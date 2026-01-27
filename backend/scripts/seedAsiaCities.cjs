/**
 * Seed missing Cities for Asian provinces/states that currently have 0 cities.
 *
 * Data sources: countries-states-cities-database
 * - countries.json (map ISO2 -> country_id)
 * - states+cities.json (states with nested cities)
 *
 * Matching:
 * - DB Country.code (ISO2) -> dataset countries.json.iso2 -> country_id
 * - DB Province.name -> dataset state.name (normalized, case-insensitive)
 * - Fallback: DB Province.code -> dataset state.state_code
 *
 * City uniqueness:
 * - Upsert on (name + province) to avoid duplicates (matches City unique index).
 *
 * Flags:
 * - Dataset doesn't have usable city flags. We set City.flagImage = Province.flagImage (fallback to empty).
 *
 * Usage:
 *   node backend/scripts/seedAsiaCities.cjs
 *   npm run seed:asia:cities
 */

const { connectDB } = require('../config/database.cjs');
const Continent = require('../models/Continent.cjs');
const Country = require('../models/Country.cjs');
const Province = require('../models/Province.cjs');
const City = require('../models/City.cjs');

const COUNTRIES_URL =
  'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json';
const STATES_CITIES_URL =
  'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/states+cities.json';

function norm(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
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

async function main() {
  await connectDB();

  const asia = await Continent.findOne({ name: { $regex: /^asia$/i } });
  if (!asia) throw new Error('Asia continent not found in DB.');

  const asianCountries = await Country.find({ continent: asia._id }).select('_id name code');
  const asianCountryIds = asianCountries.map(c => c._id);
  console.log('🌏 Asian countries:', asianCountries.length);

  const provinces = await Province.find({ country: { $in: asianCountryIds } }).select(
    '_id name code country flagImage'
  );
  console.log('🗺️ Provinces in Asia:', provinces.length);

  const provincesWithCities = new Set(
    (await City.distinct('province', { country: { $in: asianCountryIds } })).map(String)
  );
  console.log('🏙️ Provinces that already have cities:', provincesWithCities.size);

  console.log('⬇️  Downloading countries dataset...');
  const countriesData = await fetchJson(COUNTRIES_URL);
  console.log('✅ countries.json loaded:', Array.isArray(countriesData) ? countriesData.length : 'n/a');

  const iso2ToCountryId = new Map();
  for (const c of Array.isArray(countriesData) ? countriesData : []) {
    const iso2 = String(c.iso2 || '').trim().toUpperCase();
    if (!iso2) continue;
    iso2ToCountryId.set(iso2, c.id);
  }

  console.log('⬇️  Downloading states+cities dataset (may take a bit)...');
  const statesCities = await fetchJson(STATES_CITIES_URL);
  if (!Array.isArray(statesCities)) throw new Error('states+cities.json unexpected format.');
  console.log('✅ states+cities.json loaded:', statesCities.length);

  // Group dataset states by country_id for faster access
  const statesByCountryId = new Map();
  for (const s of statesCities) {
    const cid = s.country_id;
    if (!statesByCountryId.has(cid)) statesByCountryId.set(cid, []);
    statesByCountryId.get(cid).push(s);
  }

  // Build DB province lookup per country (by name + by code)
  const provincesByCountry = new Map(); // countryIdStr -> { byName: Map, byCode: Map }
  for (const p of provinces) {
    const key = String(p.country);
    if (!provincesByCountry.has(key)) {
      provincesByCountry.set(key, { byName: new Map(), byCode: new Map() });
    }
    const bucket = provincesByCountry.get(key);
    bucket.byName.set(norm(p.name), p);
    if (p.code) bucket.byCode.set(String(p.code).trim().toUpperCase(), p);
  }

  let totalCitiesInserted = 0;
  let provincesSeeded = 0;
  let provincesSkippedNoMatch = 0;
  let opsBuffer = [];
  let bufferedKeys = new Set(); // key: provinceId::cityNameNorm

  const flush = async () => {
    if (opsBuffer.length === 0) return;
    const result = await City.bulkWrite(opsBuffer, { ordered: false });
    totalCitiesInserted += result.upsertedCount || 0;
    opsBuffer = [];
    bufferedKeys = new Set();
  };

  for (const country of asianCountries) {
    const iso2 = String(country.code || '').trim().toUpperCase();
    const datasetCountryId = iso2ToCountryId.get(iso2);
    if (!datasetCountryId) {
      console.warn('⚠️ Missing dataset country id for:', country.name, iso2);
      continue;
    }

    const datasetStates = statesByCountryId.get(datasetCountryId) || [];
    if (datasetStates.length === 0) continue;

    const bucket = provincesByCountry.get(String(country._id));
    if (!bucket) continue;

    for (const st of datasetStates) {
      const stateName = String(st.name || '').trim();
      const stateCode = String(st.state_code || '').trim().toUpperCase();
      const province =
        bucket.byName.get(norm(stateName)) || (stateCode ? bucket.byCode.get(stateCode) : null);

      if (!province) {
        provincesSkippedNoMatch++;
        continue;
      }

      if (provincesWithCities.has(String(province._id))) {
        continue;
      }

      const citiesList = Array.isArray(st.cities) ? st.cities : [];
      if (citiesList.length === 0) continue;

      provincesSeeded++;
      const provinceFlag = String(province.flagImage || '').trim();

      for (const c of citiesList) {
        const cityName = String(c?.name || '').trim();
        if (!cityName) continue;

        const key = `${String(province._id)}::${norm(cityName)}`;
        if (bufferedKeys.has(key)) continue;
        bufferedKeys.add(key);

        const lat = Number.isFinite(Number(c.latitude)) ? Number(c.latitude) : 0;
        const lng = Number.isFinite(Number(c.longitude)) ? Number(c.longitude) : 0;

        opsBuffer.push({
          updateOne: {
            // City unique index is (name + province), so filter MUST match that to avoid E11000
            filter: { name: cityName, province: province._id },
            update: {
              $setOnInsert: {
                name: cityName,
                province: province._id,
                latitude: lat,
                longitude: lng,
                flagImage: provinceFlag
              },
              // Ensure country is consistent with province's parent country
              $set: { country: country._id }
            },
            upsert: true
          }
        });

        if (opsBuffer.length >= 1000) {
          await flush();
        }
      }
    }
  }

  await flush();

  console.log('\n=== Summary ===');
  console.log('Provinces seeded (had 0 cities):', provincesSeeded);
  console.log('Cities inserted:', totalCitiesInserted);
  console.log('Provinces skipped (no match with dataset state):', provincesSkippedNoMatch);
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


