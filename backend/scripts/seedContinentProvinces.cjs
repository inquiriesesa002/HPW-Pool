/**
 * Seed / upsert Provinces/States for ALL countries in a given continent.
 *
 * Data source: countries-states-cities-database (json/states.json)
 * - Map by Country.code (ISO2) -> states[].country_code
 *
 * Flags:
 * - Province/state flags are not consistently available in this dataset.
 * - Default: set Province.flagImage to COUNTRY flag (flagcdn).
 * - Optional: provide per-province overrides via:
 *     backend/data/province-flags/<continent-slug>.json
 *   Shape:
 *     { "PK": { "Punjab": "https://...", ... }, "IN": { ... } }
 *
 * Usage:
 *   node backend/scripts/seedContinentProvinces.cjs --continent "Europe"
 *
 * Optional args:
 *   --flagsFile backend/data/province-flags/europe.json
 *   --dataUrl https://.../states.json
 */

const fs = require('fs');
const path = require('path');
const { connectDB } = require('../config/database.cjs');
const Continent = require('../models/Continent.cjs');
const Country = require('../models/Country.cjs');
const Province = require('../models/Province.cjs');

const DEFAULT_DATA_URL =
  'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/states.json';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function slugify(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function flagCdnUrl(countryCode) {
  if (!countryCode) return '';
  return `https://flagcdn.com/w320/${String(countryCode).toLowerCase()}.png`;
}

function norm(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to download dataset: ${res.status} ${res.statusText} ${text}`);
  }
  return await res.json();
}

function loadFlagOverrides(flagsFilePath) {
  try {
    if (!flagsFilePath) return {};
    if (!fs.existsSync(flagsFilePath)) return {};
    const raw = fs.readFileSync(flagsFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.warn('⚠️ Failed to read flagsFile, ignoring overrides:', e.message);
    return {};
  }
}

function findOverride(overrides, iso2, provinceName) {
  if (!overrides) return '';
  const countryMap = overrides[String(iso2 || '').toUpperCase()];
  if (!countryMap || typeof countryMap !== 'object') return '';

  // Exact key match first, then normalized match
  if (countryMap[provinceName]) return String(countryMap[provinceName] || '').trim();
  const n = norm(provinceName);
  for (const [k, v] of Object.entries(countryMap)) {
    if (norm(k) === n) return String(v || '').trim();
  }
  return '';
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const continentName = String(args.continent || '').trim();
  if (!continentName) throw new Error('Missing required arg: --continent "Europe"');

  const dataUrl = String(args.dataUrl || DEFAULT_DATA_URL).trim();

  await connectDB();

  const continent = await Continent.findOne({ name: { $regex: new RegExp(`^${continentName}$`, 'i') } });
  if (!continent) throw new Error(`Continent not found in DB: ${continentName}`);

  const defaultFlagsFile = path.join(
    __dirname,
    '..',
    'data',
    'province-flags',
    `${slugify(continentName)}.json`
  );
  const flagsFile = String(args.flagsFile || defaultFlagsFile).trim();
  const overrides = loadFlagOverrides(flagsFile);

  console.log(`✅ Connected. Continent: ${continent.name} ${continent._id.toString()}`);
  console.log('⬇️  Downloading states dataset:', dataUrl);
  const states = await fetchJson(dataUrl);
  if (!Array.isArray(states)) throw new Error('Dataset format unexpected (expected JSON array).');
  console.log('✅ Dataset loaded. Total states:', states.length);
  console.log('🏷️  Province-flag overrides loaded:', Object.keys(overrides).length, `(file: ${flagsFile})`);

  const countries = await Country.find({ continent: continent._id }).select('_id name code');
  console.log(`🌍 Countries in ${continent.name}:`, countries.length);

  let totalProvincesUpserted = 0;
  let totalCountriesProcessed = 0;
  let totalCountriesWithoutDataset = 0;
  let totalOverridesApplied = 0;

  for (const country of countries) {
    const iso2 = String(country.code || '').trim().toUpperCase();
    if (!iso2) {
      console.warn('⚠️ Country missing code, skipping:', country.name, country._id.toString());
      continue;
    }

    const countryStates = states
      .filter(s => String(s.country_code || '').trim().toUpperCase() === iso2)
      .map(s => ({ name: String(s.name || '').trim(), code: String(s.state_code || '').trim() }))
      .filter(s => s.name);

    if (countryStates.length === 0) {
      totalCountriesWithoutDataset++;
      console.warn(`⚠️ No states found in dataset for ${country.name} (${iso2})`);
      continue;
    }

    // Deduplicate by state name
    const seen = new Set();
    const deduped = [];
    for (const s of countryStates) {
      const key = norm(s.name);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(s);
    }

    const ops = deduped.map(s => {
      const overrideFlag = findOverride(overrides, iso2, s.name);
      const flagImage = overrideFlag || flagCdnUrl(iso2);
      if (overrideFlag) totalOverridesApplied++;

      // Only overwrite flagImage when override provided (keeps manual edits safe)
      const set = {};
      if (s.code) set.code = s.code;
      if (overrideFlag) set.flagImage = overrideFlag;

      return {
        updateOne: {
          filter: { name: s.name, country: country._id },
          update: {
            $setOnInsert: {
              name: s.name,
              code: s.code || '',
              country: country._id,
              flagImage
            },
            ...(Object.keys(set).length ? { $set: set } : {})
          },
          upsert: true
        }
      };
    });

    const result = await Province.bulkWrite(ops, { ordered: false });
    const upserted = result.upsertedCount || 0;
    const modified = result.modifiedCount || 0;
    totalProvincesUpserted += upserted + modified;
    totalCountriesProcessed += 1;

    console.log(
      `✅ ${country.name} (${iso2}) — upserted: ${upserted}, updated: ${modified}, dataset: ${deduped.length}`
    );
  }

  console.log('\n=== Summary ===');
  console.log('Countries processed:', totalCountriesProcessed);
  console.log('Countries missing from dataset:', totalCountriesWithoutDataset);
  console.log('Total provinces upserted/updated:', totalProvincesUpserted);
  console.log('Province-flag overrides applied:', totalOverridesApplied);
}

main()
  .then(() => {
    console.log('🎉 Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });


