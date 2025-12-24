/**
 * Seed / upsert Provinces/States for ALL Asian countries.
 *
 * Data source: countries-states-cities-database (json/states.json)
 * - Map by Country.code (ISO2) -> states[].country_code
 *
 * Flags:
 * - Province/state flags are not consistently available in this dataset.
 * - Default: set Province.flagImage to COUNTRY flag (flagcdn).
 * - Optional: provide per-province overrides via a JSON mapping file.
 *
 * Usage:
 *   node backend/scripts/seedAsiaProvinces.cjs
 *   npm run seed:asia:provinces
 *
 * Optional env:
 *   DATA_URL=...                Override dataset URL (states.json)
 *   FLAGS_FILE=backend/data/asia-province-flags.json  Override flags mapping path
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB } = require('../config/database.cjs');
const Continent = require('../models/Continent.cjs');
const Country = require('../models/Country.cjs');
const Province = require('../models/Province.cjs');

const DEFAULT_DATA_URL =
  'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/states.json';

const DEFAULT_FLAGS_FILE = path.join(__dirname, '..', 'data', 'asia-province-flags.json');

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
    if (!fs.existsSync(flagsFilePath)) return {};
    const raw = fs.readFileSync(flagsFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.warn('⚠️ Failed to read FLAGS_FILE, ignoring overrides:', e.message);
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
  await connectDB();

  const asia = await Continent.findOne({ name: { $regex: /^asia$/i } });
  if (!asia) throw new Error('Asia continent not found in DB (Continent.name === "Asia").');
  console.log('✅ Connected. Asia continent:', asia._id.toString());

  const dataUrl = process.env.DATA_URL || DEFAULT_DATA_URL;
  console.log('⬇️  Downloading states dataset:', dataUrl);
  const states = await fetchJson(dataUrl);
  if (!Array.isArray(states)) throw new Error('Dataset format unexpected (expected JSON array).');
  console.log('✅ Dataset loaded. Total states:', states.length);

  const flagsFile = process.env.FLAGS_FILE || DEFAULT_FLAGS_FILE;
  const overrides = loadFlagOverrides(flagsFile);
  console.log('🏷️  Province-flag overrides loaded:', Object.keys(overrides).length, `(file: ${flagsFile})`);

  const asianCountries = await Country.find({ continent: asia._id }).select('_id name code');
  console.log('🌏 Asian countries in DB:', asianCountries.length);

  let totalProvincesUpserted = 0;
  let totalCountriesProcessed = 0;
  let totalCountriesWithoutDataset = 0;
  let totalOverridesApplied = 0;

  for (const country of asianCountries) {
    const iso2 = String(country.code || '').trim().toUpperCase();
    if (!iso2) {
      console.warn('⚠️ Country missing code, skipping:', country.name, country._id.toString());
      continue;
    }

    const countryStates = states
      .filter(s => String(s.country_code || '').trim().toUpperCase() === iso2)
      .map(s => ({
        name: String(s.name || '').trim(),
        code: String(s.state_code || '').trim(),
      }))
      .filter(s => s.name);

    if (countryStates.length === 0) {
      totalCountriesWithoutDataset++;
      console.warn(`⚠️ No states found in dataset for ${country.name} (${iso2})`);
      continue;
    }

    const seen = new Set();
    const deduped = [];
    for (const s of countryStates) {
      const key = s.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(s);
    }

    const ops = deduped.map(s => {
      const overrideFlag = findOverride(overrides, iso2, s.name);
      const flagImage = overrideFlag || flagCdnUrl(iso2);
      if (overrideFlag) totalOverridesApplied++;

      // Only update flagImage if an override is provided (keeps manual edits safe),
      // otherwise only set it on insert.
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
  console.log('Asian countries processed:', totalCountriesProcessed);
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


