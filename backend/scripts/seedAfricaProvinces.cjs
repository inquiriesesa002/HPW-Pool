/**
 * Seed Africa Provinces/States
 * Adds all provinces/states for all African countries
 * 
 * Data source: countries-states-cities-database (json/states.json)
 * - Uses country ISO2 codes to match provinces to countries
 * - Uses province flags where available, otherwise uses country flag
 * 
 * Usage:
 *   node backend/scripts/seedAfricaProvinces.cjs
 *   npm run seed:africa:provinces
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

// Province flag URLs from Wikimedia Commons for major African provinces
// Format: { "ISO2": { "ProvinceName": "flagURL" } }
const provinceFlags = {
  'ZA': {
    'Western Cape': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Flag_of_the_Western_Cape.svg/320px-Flag_of_the_Western_Cape.svg.png',
    'Eastern Cape': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_the_Eastern_Cape.svg/320px-Flag_of_the_Eastern_Cape.svg.png',
    'Northern Cape': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Flag_of_the_Northern_Cape.svg/320px-Flag_of_the_Northern_Cape.svg.png',
    'Free State': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Flag_of_the_Free_State.svg/320px-Flag_of_the_Free_State.svg.png',
    'KwaZulu-Natal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_KwaZulu-Natal.svg/320px-Flag_of_KwaZulu-Natal.svg.png',
    'Gauteng': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Gauteng.svg/320px-Flag_of_Gauteng.svg.png',
    'Limpopo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Flag_of_Limpopo.svg/320px-Flag_of_Limpopo.svg.png',
    'Mpumalanga': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Mpumalanga.svg/320px-Flag_of_Mpumalanga.svg.png',
    'North West': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Flag_of_the_North_West_%28South_Africa%29.svg/320px-Flag_of_the_North_West_%28South_Africa%29.svg.png'
  },
  'NG': {
    'Lagos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Lagos_State.svg/320px-Flag_of_Lagos_State.svg.png',
    'Kano': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Flag_of_Kano_State.svg/320px-Flag_of_Kano_State.svg.png',
    'Rivers': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Rivers_State.svg/320px-Flag_of_Rivers_State.svg.png',
    'Kaduna': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Kaduna_State.svg/320px-Flag_of_Kaduna_State.svg.png'
  },
  'EG': {
    'Cairo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Cairo.svg/320px-Flag_of_Cairo.svg.png',
    'Alexandria': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Alexandria.svg/320px-Flag_of_Alexandria.svg.png'
  },
  'KE': {
    'Nairobi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Nairobi.svg/320px-Flag_of_Nairobi.svg.png'
  }
};

function findProvinceFlag(iso2, provinceName) {
  const countryFlags = provinceFlags[String(iso2 || '').toUpperCase()];
  if (!countryFlags) return '';
  
  // Try exact match first
  if (countryFlags[provinceName]) return countryFlags[provinceName];
  
  // Try normalized match
  const normalizedName = norm(provinceName);
  for (const [key, value] of Object.entries(countryFlags)) {
    if (norm(key) === normalizedName) return value;
  }
  
  return '';
}

async function main() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    // Get all Africa region countries
    const africaCountries = await Country.find({ region: 'africa' }).select('_id name code flag');
    console.log(`\n🌍 Found ${africaCountries.length} African countries`);

    if (africaCountries.length === 0) {
      console.log('⚠️  No African countries found. Please seed countries first.');
      process.exit(0);
    }

    // Create a map of ISO2 code to country
    const countryMap = new Map();
    for (const country of africaCountries) {
      const iso2 = String(country.code || '').trim().toUpperCase();
      if (iso2) {
        countryMap.set(iso2, country);
      }
    }

    console.log(`\n⬇️  Downloading states dataset...`);
    const states = await fetchJson(DEFAULT_DATA_URL);
    if (!Array.isArray(states)) {
      throw new Error('Dataset format unexpected (expected JSON array).');
    }
    console.log(`✅ Dataset loaded. Total states: ${states.length}`);

    // Filter states for African countries
    const africaStates = states.filter(state => {
      const countryCode = String(state.country_code || '').trim().toUpperCase();
      return countryMap.has(countryCode);
    });

    console.log(`\n📊 Found ${africaStates.length} provinces/states for African countries`);

    // Group by country
    const statesByCountry = new Map();
    for (const state of africaStates) {
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

    // Process each country
    for (const [iso2, country] of countryMap.entries()) {
      const statesForCountry = statesByCountry.get(iso2) || [];
      
      if (statesForCountry.length === 0) {
        console.log(`\n⚠️  ${country.name} (${iso2}): No provinces found in dataset`);
        continue;
      }

      totalCountriesProcessed++;
      console.log(`\n📍 Processing ${country.name} (${iso2}): ${statesForCountry.length} provinces`);

      const countryFlag = country.flag || flagCdnUrl(iso2);
      const ops = [];

      // Pre-fetch all existing provinces for this country's states to avoid conflicts
      const provinceNames = statesForCountry.map(s => String(s.name || '').trim()).filter(Boolean);
      const existingProvinces = await Province.find({ 
        name: { $in: provinceNames },
        region: 'africa' 
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
        
        // Try to find province-specific flag, otherwise use country flag
        let flagImage = findProvinceFlag(iso2, provinceName);
        if (flagImage) {
          provincesWithFlags++;
        } else {
          flagImage = countryFlag;
          provincesWithCountryFlags++;
        }

        const existingProvince = existingProvinceMap.get(provinceNameLower);
        
        if (existingProvince) {
          // Province exists - update it if code matches or if no code conflict
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
          // Skip if code conflicts to avoid duplicate key errors
        } else {
          // New province - try to insert, but catch duplicate key errors
          ops.push({
            updateOne: {
              filter: { 
                name: provinceName, 
                region: 'africa'
              },
              update: {
                $setOnInsert: {
                  name: provinceName,
                  region: 'africa',
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
          console.log(`   ✅ Upserted: ${result.upsertedCount} new, ${result.modifiedCount} updated`);
        } catch (error) {
          if (error.code === 11000) {
            // Duplicate key error - skip conflicting provinces
            console.log(`   ⚠️  Skipped some provinces due to duplicate key conflicts`);
            // Try individual inserts for remaining provinces
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

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Countries processed: ${totalCountriesProcessed}`);
    console.log(`   Total provinces upserted: ${totalProvincesUpserted}`);
    console.log(`   Provinces with specific flags: ${provincesWithFlags}`);
    console.log(`   Provinces with country flags: ${provincesWithCountryFlags}`);
    
    const totalInDB = await Province.countDocuments({ region: 'africa' });
    console.log(`\n📊 Total African provinces in database: ${totalInDB}`);

    console.log('\n🎉 Africa provinces seeding completed!');
  } catch (error) {
    console.error('\n❌ Error seeding Africa provinces:', error);
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

