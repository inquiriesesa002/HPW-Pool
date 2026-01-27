/**
 * Seed Canada Country
 * Adds Canada country to the database
 * 
 * Usage:
 *   node backend/scripts/seedCanadaCountries.cjs
 *   npm run seed:canada:countries
 */

const { connectDB } = require('../config/database.cjs');
const Country = require('../models/Country.cjs');

const canadaCountry = {
  name: 'Canada',
  code: 'CA',
  flag: 'https://flagcdn.com/w320/ca.png',
  region: 'canada'
};

async function main() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log('\n📊 Seeding Canada country...');

    // Use bulkWrite with upsert to avoid duplicates
    const result = await Country.bulkWrite([{
      updateOne: {
        filter: { name: canadaCountry.name, region: canadaCountry.region },
        update: {
          $setOnInsert: {
            name: canadaCountry.name,
            region: canadaCountry.region
          },
          $set: {
            code: canadaCountry.code,
            flag: canadaCountry.flag,
            population: 0,
            healthcareIndex: 0
          }
        },
        upsert: true
      }
    }], { ordered: false });

    console.log('\n✅ Results:');
    console.log(`  Inserted: ${result.upsertedCount}`);
    console.log(`  Updated: ${result.modifiedCount}`);
    console.log(`  Matched: ${result.matchedCount}`);

    // Verify
    const totalInDB = await Country.countDocuments({ region: 'canada' });
    console.log(`\n📊 Total Canada region countries in database: ${totalInDB}`);

    if (totalInDB > 0) {
      const country = await Country.findOne({ region: 'canada' });
      console.log(`\n📋 Country: ${country.name} (${country.code})`);
      console.log(`   Flag: ${country.flag}`);
    }

    console.log('\n🎉 Canada country seeding completed!');
  } catch (error) {
    console.error('\n❌ Error seeding Canada country:', error);
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

