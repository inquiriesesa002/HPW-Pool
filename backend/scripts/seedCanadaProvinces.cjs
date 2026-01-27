/**
 * Seed Canada Provinces and Territories
 * Adds all Canadian provinces and territories to the database
 * 
 * Usage:
 *   node backend/scripts/seedCanadaProvinces.cjs
 *   npm run seed:canada:provinces
 */

const { connectDB } = require('../config/database.cjs');
const Country = require('../models/Country.cjs');
const Province = require('../models/Province.cjs');

// All 13 Canadian Provinces and Territories with their codes and flag images
// Using Wikimedia Commons for province flags
const canadaProvinces = [
  { name: 'Alberta', code: 'AB', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Flag_of_Alberta.svg/320px-Flag_of_Alberta.svg.png', region: 'canada' },
  { name: 'British Columbia', code: 'BC', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Flag_of_British_Columbia.svg/320px-Flag_of_British_Columbia.svg.png', region: 'canada' },
  { name: 'Manitoba', code: 'MB', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Flag_of_Manitoba.svg/320px-Flag_of_Manitoba.svg.png', region: 'canada' },
  { name: 'New Brunswick', code: 'NB', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Flag_of_New_Brunswick.svg/320px-Flag_of_New_Brunswick.svg.png', region: 'canada' },
  { name: 'Newfoundland and Labrador', code: 'NL', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Flag_of_Newfoundland_and_Labrador.svg/320px-Flag_of_Newfoundland_and_Labrador.svg.png', region: 'canada' },
  { name: 'Northwest Territories', code: 'NT', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Flag_of_the_Northwest_Territories.svg/320px-Flag_of_the_Northwest_Territories.svg.png', region: 'canada' },
  { name: 'Nova Scotia', code: 'NS', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Flag_of_Nova_Scotia.svg/320px-Flag_of_Nova_Scotia.svg.png', region: 'canada' },
  { name: 'Nunavut', code: 'NU', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Flag_of_Nunavut.svg/320px-Flag_of_Nunavut.svg.png', region: 'canada' },
  { name: 'Ontario', code: 'ON', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Ontario.svg/320px-Flag_of_Ontario.svg.png', region: 'canada' },
  { name: 'Prince Edward Island', code: 'PE', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Flag_of_Prince_Edward_Island.svg/320px-Flag_of_Prince_Edward_Island.svg.png', region: 'canada' },
  { name: 'Quebec', code: 'QC', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Flag_of_Quebec.svg/320px-Flag_of_Quebec.svg.png', region: 'canada' },
  { name: 'Saskatchewan', code: 'SK', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Flag_of_Saskatchewan.svg/320px-Flag_of_Saskatchewan.svg.png', region: 'canada' },
  { name: 'Yukon', code: 'YT', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Flag_of_Yukon.svg/320px-Flag_of_Yukon.svg.png', region: 'canada' }
];

async function main() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    const canadaCountry = await Country.findOne({ region: 'canada' }).select('_id');
    const canadaCountryId = canadaCountry?._id || null;

    console.log(`\n📊 Seeding ${canadaProvinces.length} Canadian provinces and territories...`);

    // Use bulkWrite with upsert to avoid duplicates
    const ops = canadaProvinces.map(province => ({
      updateOne: {
        filter: { name: province.name, region: province.region },
        update: {
          $setOnInsert: {
            name: province.name,
            region: province.region
          },
          $set: {
            code: province.code,
            flagImage: province.flagImage,
            ...(canadaCountryId ? { country: canadaCountryId } : {})
          }
        },
        upsert: true
      }
    }));

    const result = await Province.bulkWrite(ops, { ordered: false });

    console.log('\n✅ Results:');
    console.log(`  Inserted: ${result.upsertedCount}`);
    console.log(`  Updated: ${result.modifiedCount}`);
    console.log(`  Matched: ${result.matchedCount}`);

    // Verify
    const totalInDB = await Province.countDocuments({ region: 'canada' });
    console.log(`\n📊 Total Canadian provinces/territories in database: ${totalInDB}`);

    if (totalInDB > 0) {
      const sample = await Province.find({ region: 'canada' }).limit(5).sort({ name: 1 });
      console.log('\n📋 Sample provinces:');
      sample.forEach(p => console.log(`  - ${p.name} (${p.code})`));
    }

    console.log('\n🎉 Canadian provinces seeding completed!');
  } catch (error) {
    console.error('\n❌ Error seeding Canadian provinces:', error);
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

