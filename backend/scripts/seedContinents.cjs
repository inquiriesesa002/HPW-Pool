/**
 * Seed Continents into the database
 * 
 * This script creates the basic continents that are used in the system.
 * 
 * Usage:
 *   node backend/scripts/seedContinents.cjs
 */

const { connectDB } = require('../config/database.cjs');
const Continent = require('../models/Continent.cjs');

const CONTINENTS = [
  { name: 'Asia', code: 'AS' },
  { name: 'Africa', code: 'AF' },
  { name: 'Europe', code: 'EU' },
  { name: 'North America', code: 'NA' },
  { name: 'South America', code: 'SA' },
  { name: 'Australia & Oceania', code: 'OC' },
  { name: 'Antarctica', code: 'AN' }
];

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    let created = 0;
    let updated = 0;

    for (const continentData of CONTINENTS) {
      const result = await Continent.findOneAndUpdate(
        { name: continentData.name },
        { 
          name: continentData.name,
          code: continentData.code
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );

      if (result.isNew) {
        created++;
        console.log(`✅ Created continent: ${continentData.name} (${continentData.code})`);
      } else {
        updated++;
        console.log(`🔄 Updated continent: ${continentData.name} (${continentData.code})`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Total: ${CONTINENTS.length}`);

    // Verify all continents exist
    const allContinents = await Continent.find().sort({ name: 1 });
    console.log(`\n✅ All continents in database (${allContinents.length}):`);
    allContinents.forEach(c => {
      console.log(`   - ${c.name} (${c.code || 'no code'}) - ID: ${c._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding continents:', error);
    process.exit(1);
  }
}

main();

