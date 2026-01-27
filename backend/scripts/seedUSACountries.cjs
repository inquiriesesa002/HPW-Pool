/**
 * Seed USA Country
 * Adds United States country to the database
 * 
 * Usage:
 *   node backend/scripts/seedUSACountries.cjs
 *   npm run seed:usa:countries
 */

const { connectDB } = require('../config/database.cjs');
const Country = require('../models/Country.cjs');

const usaCountry = {
  name: 'United States',
  code: 'US',
  flag: 'https://flagcdn.com/w320/us.png',
  region: 'usa'
};

async function main() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log('\n📊 Seeding USA country...');

    // Use bulkWrite with upsert to avoid duplicates
    const result = await Country.bulkWrite([{
      updateOne: {
        filter: { name: usaCountry.name, region: usaCountry.region },
        update: {
          $setOnInsert: {
            name: usaCountry.name,
            region: usaCountry.region
          },
          $set: {
            code: usaCountry.code,
            flag: usaCountry.flag,
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
    const totalInDB = await Country.countDocuments({ region: 'usa' });
    console.log(`\n📊 Total USA region countries in database: ${totalInDB}`);

    if (totalInDB > 0) {
      const country = await Country.findOne({ region: 'usa' });
      console.log(`\n📋 Country: ${country.name} (${country.code})`);
      console.log(`   Flag: ${country.flag}`);
    }

    console.log('\n🎉 USA country seeding completed!');
  } catch (error) {
    console.error('\n❌ Error seeding USA country:', error);
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

