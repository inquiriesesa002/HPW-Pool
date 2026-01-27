/**
 * Repair Province.country by deriving it from dataset (states.json) + DB Countries (by ISO2 code).
 *
 * Why: Provinces previously only stored `region`, which is not enough to return
 * "only provinces of selected country". This script backfills Province.country.
 *
 * Usage:
 *   node backend/scripts/repairProvincesCountryFromDataset.cjs
 *   node backend/scripts/repairProvincesCountryFromDataset.cjs --url https://.../states.json
 */
const { connectDB } = require('../config/database.cjs');
const Country = require('../models/Country.cjs');
const Province = require('../models/Province.cjs');

const DEFAULT_DATA_URL =
  'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/states.json';

function norm(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { url: DEFAULT_DATA_URL };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--url') out.url = args[i + 1] || out.url;
  }
  return out;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to download dataset: ${res.status} ${res.statusText} ${text}`);
  }
  return await res.json();
}

async function main() {
  const { url } = parseArgs();
  await connectDB();

  const countries = await Country.find().select('_id code region').lean();
  const countryByIso2 = new Map();
  for (const c of countries) {
    const iso2 = String(c.code || '').trim().toUpperCase();
    if (iso2) countryByIso2.set(iso2, c);
  }

  console.log('⬇️  Downloading dataset:', url);
  const states = await fetchJson(url);
  if (!Array.isArray(states)) throw new Error('Dataset format unexpected (expected array).');

  // Map: region -> provinceNameNorm -> set(countryId)
  const provinceToCountry = new Map();
  for (const st of states) {
    const iso2 = String(st.country_code || '').trim().toUpperCase();
    const name = String(st.name || '').trim();
    if (!iso2 || !name) continue;
    const country = countryByIso2.get(iso2);
    if (!country?._id || !country.region) continue;
    const region = String(country.region).toLowerCase();
    const key = `${region}::${norm(name)}`;
    if (!provinceToCountry.has(key)) provinceToCountry.set(key, new Set());
    provinceToCountry.get(key).add(String(country._id));
  }

  const provinces = await Province.find().select('_id name region country').lean();
  console.log('📦 Provinces in DB:', provinces.length);

  let matched = 0;
  let updated = 0;
  let ambiguous = 0;
  let missing = 0;

  const ops = [];

  for (const p of provinces) {
    if (p.country) continue; // already set
    const region = String(p.region || '').toLowerCase();
    const key = `${region}::${norm(p.name)}`;
    const set = provinceToCountry.get(key);
    if (!set || set.size === 0) {
      missing++;
      continue;
    }
    matched++;
    if (set.size > 1) {
      // same province name exists in multiple countries in same region; skip to avoid wrong mapping
      ambiguous++;
      continue;
    }
    const [countryId] = Array.from(set);
    ops.push({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: { country: countryId } }
      }
    });
    updated++;
  }

  if (ops.length) {
    const res = await Province.bulkWrite(ops, { ordered: false });
    console.log('✅ bulkWrite modified:', res.modifiedCount || 0);
  } else {
    console.log('ℹ️  Nothing to update.');
  }

  console.log('\n=== Summary ===');
  console.log('Matched:', matched);
  console.log('Updated:', updated);
  console.log('Ambiguous skipped:', ambiguous);
  console.log('Missing from dataset:', missing);
}

main()
  .then(() => {
    console.log('🎉 Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Repair failed:', err);
    process.exit(1);
  });


