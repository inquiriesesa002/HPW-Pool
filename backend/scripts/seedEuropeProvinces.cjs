/**
 * Seed Europe Provinces/States
 * Adds all provinces/states for all European countries
 * 
 * Data source: countries-states-cities-database (json/states.json)
 * - Uses country ISO2 codes to match provinces to countries
 * - Uses province flags where available, otherwise uses country flag
 * 
 * Usage:
 *   node backend/scripts/seedEuropeProvinces.cjs
 *   npm run seed:europe:provinces
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

// Province flag URLs from Wikimedia Commons for major European provinces
// Format: { "ISO2": { "ProvinceName": "flagURL" } }
const provinceFlags = {
  'DE': {
    'Bavaria': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Flag_of_Bavaria_%28lozengy%29.svg/320px-Flag_of_Bavaria_%28lozengy%29.svg.png',
    'Baden-Württemberg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Flag_of_Baden-W%C3%BCrttemberg.svg/320px-Flag_of_Baden-W%C3%BCrttemberg.svg.png',
    'North Rhine-Westphalia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Flag_of_North_Rhine-Westphalia.svg/320px-Flag_of_North_Rhine-Westphalia.svg.png',
    'Lower Saxony': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Flag_of_Lower_Saxony.svg/320px-Flag_of_Lower_Saxony.svg.png',
    'Hesse': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Flag_of_Hesse.svg/320px-Flag_of_Hesse.svg.png',
    'Saxony': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Flag_of_Saxony.svg/320px-Flag_of_Saxony.svg.png',
    'Rhineland-Palatinate': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Flag_of_Rhineland-Palatinate.svg/320px-Flag_of_Rhineland-Palatinate.svg.png',
    'Berlin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Flag_of_Berlin.svg/320px-Flag_of_Berlin.svg.png',
    'Schleswig-Holstein': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Flag_of_Schleswig-Holstein.svg/320px-Flag_of_Schleswig-Holstein.svg.png',
    'Brandenburg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Flag_of_Brandenburg.svg/320px-Flag_of_Brandenburg.svg.png',
    'Saxony-Anhalt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Flag_of_Saxony-Anhalt.svg/320px-Flag_of_Saxony-Anhalt.svg.png',
    'Thuringia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Flag_of_Thuringia.svg/320px-Flag_of_Thuringia.svg.png',
    'Hamburg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Flag_of_Hamburg.svg/320px-Flag_of_Hamburg.svg.png',
    'Mecklenburg-Vorpommern': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Flag_of_Mecklenburg-Western_Pomerania.svg/320px-Flag_of_Mecklenburg-Western_Pomerania.svg.png',
    'Saarland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Flag_of_Saarland.svg/320px-Flag_of_Saarland.svg.png',
    'Bremen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Flag_of_Bremen.svg/320px-Flag_of_Bremen.svg.png'
  },
  'FR': {
    'Île-de-France': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Flag_of_Île-de-France.svg/320px-Flag_of_Île-de-France.svg.png',
    'Provence-Alpes-Côte d\'Azur': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Provence-Alpes-Côte_d%27Azur.svg/320px-Flag_of_Provence-Alpes-Côte_d%27Azur.svg.png',
    'Auvergne-Rhône-Alpes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Auvergne-Rhône-Alpes.svg/320px-Flag_of_Auvergne-Rhône-Alpes.svg.png',
    'Occitanie': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Flag_of_Occitanie.svg/320px-Flag_of_Occitanie.svg.png',
    'Nouvelle-Aquitaine': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Flag_of_Nouvelle-Aquitaine.svg/320px-Flag_of_Nouvelle-Aquitaine.svg.png',
    'Hauts-de-France': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Flag_of_Hauts-de-France.svg/320px-Flag_of_Hauts-de-France.svg.png',
    'Grand Est': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Flag_of_Grand_Est.svg/320px-Flag_of_Grand_Est.svg.png',
    'Normandy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Flag_of_Normandy.svg/320px-Flag_of_Normandy.svg.png',
    'Brittany': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Flag_of_Brittany.svg/320px-Flag_of_Brittany.svg.png',
    'Pays de la Loire': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Pays_de_la_Loire.svg/320px-Flag_of_Pays_de_la_Loire.svg.png',
    'Centre-Val de Loire': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Centre-Val_de_Loire.svg/320px-Flag_of_Centre-Val_de_Loire.svg.png',
    'Bourgogne-Franche-Comté': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Bourgogne-Franche-Comté.svg/320px-Flag_of_Bourgogne-Franche-Comté.svg.png',
    'Corsica': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Flag_of_Corsica.svg/320px-Flag_of_Corsica.svg.png'
  },
  'IT': {
    'Lombardy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Flag_of_Lombardy.svg/320px-Flag_of_Lombardy.svg.png',
    'Lazio': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Flag_of_Lazio.svg/320px-Flag_of_Lazio.svg.png',
    'Campania': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Flag_of_Campania.svg/320px-Flag_of_Campania.svg.png',
    'Sicily': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Flag_of_Sicily.svg/320px-Flag_of_Sicily.svg.png',
    'Veneto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Flag_of_Veneto.svg/320px-Flag_of_Veneto.svg.png',
    'Emilia-Romagna': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Flag_of_Emilia-Romagna.svg/320px-Flag_of_Emilia-Romagna.svg.png',
    'Piedmont': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Flag_of_Piedmont.svg/320px-Flag_of_Piedmont.svg.png',
    'Puglia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Flag_of_Puglia.svg/320px-Flag_of_Puglia.svg.png',
    'Tuscany': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Flag_of_Tuscany.svg/320px-Flag_of_Tuscany.svg.png',
    'Calabria': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Flag_of_Calabria.svg/320px-Flag_of_Calabria.svg.png',
    'Sardinia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Sardinia.svg/320px-Flag_of_Sardinia.svg.png'
  },
  'ES': {
    'Andalusia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Flag_of_Andalusia.svg/320px-Flag_of_Andalusia.svg.png',
    'Catalonia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Flag_of_Catalonia.svg/320px-Flag_of_Catalonia.svg.png',
    'Madrid': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Flag_of_the_Community_of_Madrid.svg/320px-Flag_of_the_Community_of_Madrid.svg.png',
    'Valencia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Flag_of_the_Land_of_Valencia.svg/320px-Flag_of_the_Land_of_Valencia.svg.png',
    'Galicia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Flag_of_Galicia.svg/320px-Flag_of_Galicia.svg.png',
    'Castile and León': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Flag_of_Castile_and_León.svg/320px-Flag_of_Castile_and_León.svg.png',
    'Basque Country': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Flag_of_the_Basque_Country.svg/320px-Flag_of_the_Basque_Country.svg.png',
    'Canary Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Flag_of_the_Canary_Islands.svg/320px-Flag_of_the_Canary_Islands.svg.png'
  },
  'GB': {
    'England': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Flag_of_England.svg/320px-Flag_of_England.svg.png',
    'Scotland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Flag_of_Scotland.svg/320px-Flag_of_Scotland.svg.png',
    'Wales': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Flag_of_Wales.svg/320px-Flag_of_Wales.svg.png',
    'Northern Ireland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Flag_of_Northern_Ireland.svg/320px-Flag_of_Northern_Ireland.svg.png'
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

    // Get all Europe region countries
    const europeCountries = await Country.find({ region: 'europe' }).select('_id name code flag');
    console.log(`\n🌍 Found ${europeCountries.length} European countries`);

    if (europeCountries.length === 0) {
      console.log('⚠️  No European countries found. Please seed countries first.');
      process.exit(0);
    }

    // Create a map of ISO2 code to country
    const countryMap = new Map();
    for (const country of europeCountries) {
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

    // Filter states for European countries
    const europeStates = states.filter(state => {
      const countryCode = String(state.country_code || '').trim().toUpperCase();
      return countryMap.has(countryCode);
    });

    console.log(`\n📊 Found ${europeStates.length} provinces/states for European countries`);

    // Group by country
    const statesByCountry = new Map();
    for (const state of europeStates) {
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
        region: 'europe' 
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
                region: 'europe'
              },
              update: {
                $setOnInsert: {
                  name: provinceName,
                  region: 'europe',
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
    
    const totalInDB = await Province.countDocuments({ region: 'europe' });
    console.log(`\n📊 Total European provinces in database: ${totalInDB}`);

    console.log('\n🎉 Europe provinces seeding completed!');
  } catch (error) {
    console.error('\n❌ Error seeding Europe provinces:', error);
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

