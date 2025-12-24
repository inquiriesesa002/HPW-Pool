/**
 * Seed missing Provinces/States for African countries that currently have 0 provinces.
 *
 * Data source: countries-states-cities-database (states.json)
 * - We map by Country.code (ISO2) -> states[].country_code
 *
 * Flags:
 * - Province-specific flags are not consistently available across all countries.
 * - As a practical default, we set Province.flagImage to the parent COUNTRY flag (flagcdn).
 *
 * Usage:
 *   node backend/scripts/seedMissingAfricanProvinces.cjs
 *
 * Optional env:
 *   DATA_URL=... (override dataset URL)
 */

const mongoose = require('mongoose');
const { connectDB } = require('../config/database.cjs');
const Continent = require('../models/Continent.cjs');
const Country = require('../models/Country.cjs');
const Province = require('../models/Province.cjs');

const DEFAULT_DATA_URL =
  'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/states.json';

function flagCdnUrl(countryCode) {
  if (!countryCode) return '';
  return `https://flagcdn.com/w320/${String(countryCode).toLowerCase()}.png`;
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
  await connectDB();

  const africa = await Continent.findOne({ name: { $regex: /^africa$/i } });
  if (!africa) {
    throw new Error('Africa continent not found in DB (Continent.name === "Africa").');
  }

  console.log('✅ Connected. Africa continent:', africa._id.toString());

  const dataUrl = process.env.DATA_URL || DEFAULT_DATA_URL;
  console.log('⬇️  Downloading states dataset:', dataUrl);
  const states = await fetchJson(dataUrl);
  if (!Array.isArray(states)) {
    throw new Error('Dataset format unexpected (expected JSON array).');
  }
  console.log('✅ Dataset loaded. Total states:', states.length);

  const africanCountries = await Country.find({ continent: africa._id }).select('_id name code');
  console.log('🌍 African countries in DB:', africanCountries.length);

  let totalCountriesWithNoProvinces = 0;
  let totalProvincesInserted = 0;
  let totalCountriesSeeded = 0;
  let totalCountriesWithoutDataset = 0;

  for (const country of africanCountries) {
    const existingCount = await Province.countDocuments({ country: country._id });
    if (existingCount > 0) continue;

    totalCountriesWithNoProvinces++;

    const code = String(country.code || '').trim().toUpperCase();
    if (!code) {
      console.warn('⚠️  Country missing code, skipping:', country.name, country._id.toString());
      continue;
    }

    const countryStates = states
      .filter(s => String(s.country_code || '').trim().toUpperCase() === code)
      .map(s => ({
        name: String(s.name || '').trim(),
        code: String(s.state_code || '').trim(),
      }))
      .filter(s => s.name);

    if (countryStates.length === 0) {
      totalCountriesWithoutDataset++;
      console.warn(`⚠️  No states found in dataset for ${country.name} (${code})`);
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

    const ops = deduped.map(s => ({
      updateOne: {
        filter: { name: s.name, country: country._id },
        update: {
          $setOnInsert: {
            name: s.name,
            code: s.code || '',
            country: country._id,
            flagImage: flagCdnUrl(code),
          },
        },
        upsert: true,
      },
    }));

    const result = await Province.bulkWrite(ops, { ordered: false });
    const inserted = result.upsertedCount || 0;
    totalProvincesInserted += inserted;
    totalCountriesSeeded += 1;

    console.log(
      `✅ Seeded ${country.name} (${code}) — provinces inserted: ${inserted} (dataset total: ${deduped.length})`
    );
  }

  console.log('\n=== Summary ===');
  console.log('African countries checked:', africanCountries.length);
  console.log('Countries with 0 provinces initially:', totalCountriesWithNoProvinces);
  console.log('Countries seeded:', totalCountriesSeeded);
  console.log('Countries missing from dataset:', totalCountriesWithoutDataset);
  console.log('Total provinces inserted:', totalProvincesInserted);
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


