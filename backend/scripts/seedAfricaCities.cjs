/**
 * Seed Africa Cities
 * Adds all cities for all African provinces/states
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
 *   node backend/scripts/seedAfricaCities.cjs
 *   npm run seed:africa:cities
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

    const africaCountries = await Country.find({ region: 'africa' }).select('_id name code');
    console.log(`Found ${africaCountries.length} African countries`);

    if (africaCountries.length === 0) {
      console.log('No African countries found. Please seed countries first.');
      process.exit(0);
    }

    const provinces = await Province.find({ region: 'africa' }).select('_id name code flagImage');
    console.log(`Provinces in Africa: ${provinces.length}`);

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

    const statesByCountryId = new Map();
    for (const s of statesCities) {
      const cid = s.country_id;
      if (!statesByCountryId.has(cid)) statesByCountryId.set(cid, []);
      statesByCountryId.get(cid).push(s);
    }

    let totalCitiesUpserted = 0;
    let totalProvincesProcessed = 0;
    let totalProvincesWithoutDataset = 0;

    for (const country of africaCountries) {
      const iso2 = String(country.code || '').trim().toUpperCase();
      if (!iso2) continue;

      const datasetCountryId = iso2ToCountryId.get(iso2);
      if (!datasetCountryId) {
        console.log(`No dataset country_id for ${country.name} (${iso2})`);
        continue;
      }

      const countryProvinces = provinces.filter(p => {
        const countryProvincesData = statesByCountryId.get(datasetCountryId) || [];
        return countryProvincesData.some(s => norm(s.name) === norm(p.name));
      });

      const datasetStates = statesByCountryId.get(datasetCountryId) || [];
      if (datasetStates.length === 0) {
        console.log(`No states in dataset for ${country.name} (${iso2})`);
        continue;
      }

      console.log(`Processing ${country.name} (${iso2}): ${countryProvinces.length} provinces`);

      for (const province of countryProvinces) {
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
                  region: 'africa'
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
            if (totalProvincesProcessed % 50 === 0) {
              console.log(`  Processed ${totalProvincesProcessed} provinces, ${totalCitiesUpserted} cities...`);
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
    }

    console.log('='.repeat(60));
    console.log('Summary:');
    console.log(`Provinces processed: ${totalProvincesProcessed}`);
    console.log(`Provinces without cities in dataset: ${totalProvincesWithoutDataset}`);
    console.log(`Total cities upserted: ${totalCitiesUpserted}`);
    
    const totalInDB = await City.countDocuments({ region: 'africa' });
    console.log(`Total African cities in database: ${totalInDB}`);

    console.log('Africa cities seeding completed!');
  } catch (error) {
    console.error('Error seeding Africa cities:', error);
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

