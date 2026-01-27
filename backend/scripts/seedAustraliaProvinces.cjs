/**
 * Seed Australia/Oceania Provinces/States
 * Adds all provinces/states for all Australia region countries
 * 
 * Data source: countries-states-cities-database (json/states.json)
 * - Uses country ISO2 codes to match provinces to countries
 * - Uses province flags where available, otherwise uses country flag
 * 
 * Usage:
 *   node backend/scripts/seedAustraliaProvinces.cjs
 *   npm run seed:australia:provinces
 */

const { connectDB } = require('../config/database.cjs');
const Country = require('../models/Country.cjs');
const Province = require('../models/Province.cjs');

const DEFAULT_DATA_URL =
  'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/states.json';

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

// Province flag URLs from Wikimedia Commons for major Australia/Oceania regions
const provinceFlags = {
  'AU': {
    'New South Wales': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Flag_of_New_South_Wales.svg/320px-Flag_of_New_South_Wales.svg.png',
    'Victoria': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Flag_of_Victoria_%28Australia%29.svg/320px-Flag_of_Victoria_%28Australia%29.svg.png',
    'Queensland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Flag_of_Queensland.svg/320px-Flag_of_Queensland.svg.png',
    'South Australia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_South_Australia.svg/320px-Flag_of_South_Australia.svg.png',
    'Western Australia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Flag_of_Western_Australia.svg/320px-Flag_of_Western_Australia.svg.png',
    'Tasmania': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Flag_of_Tasmania.svg/320px-Flag_of_Tasmania.svg.png',
    'Northern Territory': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Flag_of_the_Northern_Territory.svg/320px-Flag_of_the_Northern_Territory.svg.png',
    'Australian Capital Territory': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_the_Australian_Capital_Territory.svg/320px-Flag_of_the_Australian_Capital_Territory.svg.png'
  },
  'NZ': {
    'Auckland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Auckland_City.svg/320px-Flag_of_Auckland_City.svg.png'
  }
};

function findProvinceFlag(iso2, provinceName) {
  const countryFlags = provinceFlags[String(iso2 || '').toUpperCase()];
  if (!countryFlags) return '';
  if (countryFlags[provinceName]) return countryFlags[provinceName];
  const normalizedName = norm(provinceName);
  for (const [key, value] of Object.entries(countryFlags)) {
    if (norm(key) === normalizedName) return value;
  }
  return '';
}

async function main() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    const australiaCountries = await Country.find({ region: 'australia' }).select('_id name code flag');
    console.log(`Found ${australiaCountries.length} Australia region countries`);

    if (australiaCountries.length === 0) {
      console.log('No Australia region countries found. Please seed countries first.');
      process.exit(0);
    }

    const countryMap = new Map();
    for (const country of australiaCountries) {
      const iso2 = String(country.code || '').trim().toUpperCase();
      if (iso2) {
        countryMap.set(iso2, country);
      }
    }

    console.log('Downloading states dataset...');
    const states = await fetchJson(DEFAULT_DATA_URL);
    if (!Array.isArray(states)) {
      throw new Error('Dataset format unexpected (expected JSON array).');
    }
    console.log(`Dataset loaded. Total states: ${states.length}`);

    const ausStates = states.filter(state => {
      const countryCode = String(state.country_code || '').trim().toUpperCase();
      return countryMap.has(countryCode);
    });

    console.log(`Found ${ausStates.length} provinces/states for Australia region countries`);

    const statesByCountry = new Map();
    for (const state of ausStates) {
      const countryCode = String(state.country_code || '').trim().toUpperCase();
      if (!statesByCountry.has(countryCode)) {
        statesByCountry.set(countryCode, []);
      }
      statesByCountry.get(countryCode).push(state);
    }

    let totalProvincesUpserted = 0;
    let totalCountriesProcessed = 0;
    let provincesWithFlags = 0;
    let provincesWithCountryFlags = 0;

    for (const [iso2, country] of countryMap.entries()) {
      const statesForCountry = statesByCountry.get(iso2) || [];
      
      if (statesForCountry.length === 0) {
        console.log(`${country.name} (${iso2}): No provinces found in dataset`);
        continue;
      }

      totalCountriesProcessed++;
      console.log(`Processing ${country.name} (${iso2}): ${statesForCountry.length} provinces`);

      const countryFlag = country.flag || flagCdnUrl(iso2);
      const ops = [];

      const provinceNames = statesForCountry.map(s => String(s.name || '').trim()).filter(Boolean);
      const existingProvinces = await Province.find({ 
        name: { $in: provinceNames },
        region: 'australia' 
      });
      const existingProvinceMap = new Map();
      for (const p of existingProvinces) {
        existingProvinceMap.set(p.name.toLowerCase(), p);
      }

      for (const state of statesForCountry) {
        const provinceName = String(state.name || '').trim();
        if (!provinceName) continue;

        const provinceCode = String(state.state_code || '').trim();
        const provinceNameLower = provinceName.toLowerCase();
        
        let flagImage = findProvinceFlag(iso2, provinceName);
        if (flagImage) {
          provincesWithFlags++;
        } else {
          flagImage = countryFlag;
          provincesWithCountryFlags++;
        }

        const existingProvince = existingProvinceMap.get(provinceNameLower);
        
        if (existingProvince) {
          if (!provinceCode || existingProvince.code === provinceCode || !existingProvince.code) {
            ops.push({
              updateOne: {
                filter: { _id: existingProvince._id },
                update: {
                  $set: {
                    code: provinceCode || existingProvince.code || '',
                    flagImage: flagImage || existingProvince.flagImage || '',
                    country: country._id
                  }
                }
              }
            });
          }
        } else {
          ops.push({
            updateOne: {
              filter: { 
                name: provinceName, 
                region: 'australia'
              },
              update: {
                $setOnInsert: {
                  name: provinceName,
                  region: 'australia',
                  country: country._id
                },
                $set: {
                  code: provinceCode || '',
                  flagImage: flagImage || '',
                  country: country._id
                }
              },
              upsert: true
            }
          });
        }
      }

      if (ops.length > 0) {
        try {
          const result = await Province.bulkWrite(ops, { ordered: false });
          totalProvincesUpserted += result.upsertedCount + result.modifiedCount;
          console.log(`Upserted: ${result.upsertedCount} new, ${result.modifiedCount} updated`);
        } catch (error) {
          if (error.code === 11000) {
            console.log('Skipped some provinces due to duplicate key conflicts');
            for (const op of ops) {
              try {
                await Province.bulkWrite([op], { ordered: false });
                totalProvincesUpserted++;
              } catch (e) {
                // Skip this province if it still conflicts
              }
            }
          } else {
            throw error;
          }
        }
      }
    }

    console.log('='.repeat(60));
    console.log('Summary:');
    console.log(`Countries processed: ${totalCountriesProcessed}`);
    console.log(`Total provinces upserted: ${totalProvincesUpserted}`);
    console.log(`Provinces with specific flags: ${provincesWithFlags}`);
    console.log(`Provinces with country flags: ${provincesWithCountryFlags}`);
    
    const totalInDB = await Province.countDocuments({ region: 'australia' });
    console.log(`Total Australia region provinces in database: ${totalInDB}`);

    console.log('Australia region provinces seeding completed!');
  } catch (error) {
    console.error('Error seeding Australia region provinces:', error);
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

