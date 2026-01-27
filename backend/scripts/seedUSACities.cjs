/**
 * Seed USA Cities
 * Adds all cities for all US states
 * 
 * Data sources: countries-states-cities-database
 * - countries.json (map ISO2 -> country_id)
 * - states+cities.json (states with nested cities)
 * 
 * Matching:
 * - DB Country.code (ISO2) -> dataset countries.json.iso2 -> country_id
 * - DB Province.name -> dataset state.name (normalized, case-insensitive)
 * 
 * Flags:
 * - Uses province flagImage as city flagImage (fallback)
 * 
 * Usage:
 *   node backend/scripts/seedUSACities.cjs
 *   npm run seed:usa:cities
 */

const { connectDB } = require('../config/database.cjs');
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

async function main() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    const usaCountry = await Country.findOne({ region: 'usa' }).select('_id name code');
    if (!usaCountry) {
      console.log('USA country not found. Please seed USA country first.');
      process.exit(0);
    }

    const provinces = await Province.find({ region: 'usa' }).select('_id name code flagImage');
    console.log(`US States: ${provinces.length}`);

    console.log('Downloading countries dataset...');
    const countriesData = await fetchJson(COUNTRIES_URL);
    console.log('countries.json loaded:', Array.isArray(countriesData) ? countriesData.length : 'n/a');

    const iso2ToCountryId = new Map();
    for (const c of Array.isArray(countriesData) ? countriesData : []) {
      const iso2 = String(c.iso2 || '').trim().toUpperCase();
      if (!iso2) continue;
      iso2ToCountryId.set(iso2, c.id);
    }

    console.log('Downloading states+cities dataset (may take a bit)...');
    const statesCities = await fetchJson(STATES_CITIES_URL);
    if (!Array.isArray(statesCities)) throw new Error('states+cities.json unexpected format.');
    console.log('states+cities.json loaded:', statesCities.length);

    const datasetCountryId = iso2ToCountryId.get('US');
    if (!datasetCountryId) {
      console.log('No dataset country_id for USA');
      process.exit(0);
    }

    const datasetStates = statesCities.filter(s => s.country_id === datasetCountryId);
    console.log(`Found ${datasetStates.length} US states in dataset`);

    let totalCitiesUpserted = 0;
    let totalProvincesProcessed = 0;
    let totalProvincesWithoutDataset = 0;

    for (const province of provinces) {
      const datasetState = datasetStates.find(s => norm(s.name) === norm(province.name) || (province.code && norm(s.state_code) === norm(province.code)));
      
      if (!datasetState || !Array.isArray(datasetState.cities) || datasetState.cities.length === 0) {
        totalProvincesWithoutDataset++;
        continue;
      }

      totalProvincesProcessed++;
      const cities = datasetState.cities || [];
      const provinceFlag = province.flagImage || '';

      const ops = [];
      for (const cityData of cities) {
        const cityName = String(cityData.name || '').trim();
        if (!cityName) continue;

        const latitude = parseFloat(cityData.latitude) || 0;
        const longitude = parseFloat(cityData.longitude) || 0;

        ops.push({
          updateOne: {
            filter: { name: cityName, province: province._id },
            update: {
              $setOnInsert: {
                name: cityName,
                province: province._id,
                region: 'usa'
              },
              $set: {
                flagImage: provinceFlag,
                latitude: latitude,
                longitude: longitude
              }
            },
            upsert: true
          }
        });
      }

      if (ops.length > 0) {
        try {
          const result = await City.bulkWrite(ops, { ordered: false });
          totalCitiesUpserted += result.upsertedCount + result.modifiedCount;
          if (totalProvincesProcessed % 10 === 0) {
            console.log(`  Processed ${totalProvincesProcessed} states, ${totalCitiesUpserted} cities...`);
          }
        } catch (error) {
          if (error.code === 11000) {
            console.log(`  Skipped some cities for ${province.name} due to duplicate key conflicts`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('='.repeat(60));
    console.log('Summary:');
    console.log(`States processed: ${totalProvincesProcessed}`);
    console.log(`States without cities in dataset: ${totalProvincesWithoutDataset}`);
    console.log(`Total cities upserted: ${totalCitiesUpserted}`);
    
    const totalInDB = await City.countDocuments({ region: 'usa' });
    console.log(`Total USA cities in database: ${totalInDB}`);

    console.log('USA cities seeding completed!');
  } catch (error) {
    console.error('Error seeding USA cities:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

