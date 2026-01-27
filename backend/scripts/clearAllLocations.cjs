/**
 * Clear all location data from database
 * Deletes all Continents, Countries, Provinces, and Cities
 * 
 * Usage:
 *   node backend/scripts/clearAllLocations.cjs
 *   npm run clear:locations
 */

const { connectDB } = require('../config/database.cjs');
const Continent = require('../models/Continent.cjs');
const Country = require('../models/Country.cjs');
const Province = require('../models/Province.cjs');
const City = require('../models/City.cjs');

async function main() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log('\n📊 Current data counts:');
    const continentCount = await Continent.countDocuments();
    const countryCount = await Country.countDocuments();
    const provinceCount = await Province.countDocuments();
    const cityCount = await City.countDocuments();
    
    console.log(`  Continents: ${continentCount}`);
    console.log(`  Countries: ${countryCount}`);
    console.log(`  Provinces: ${provinceCount}`);
    console.log(`  Cities: ${cityCount}`);

    if (continentCount === 0 && countryCount === 0 && provinceCount === 0 && cityCount === 0) {
      console.log('\n✅ Database is already empty. Nothing to delete.');
      process.exit(0);
    }

    console.log('\n🗑️  Starting deletion process...');
    console.log('⚠️  WARNING: This will delete ALL location data!');

    // Delete in order: Cities -> Provinces -> Countries -> Continents
    // (to avoid foreign key constraint issues)
    
    console.log('\n1️⃣  Deleting Cities...');
    const cityResult = await City.deleteMany({});
    console.log(`   ✅ Deleted ${cityResult.deletedCount} cities`);

    console.log('\n2️⃣  Deleting Provinces...');
    const provinceResult = await Province.deleteMany({});
    console.log(`   ✅ Deleted ${provinceResult.deletedCount} provinces`);

    console.log('\n3️⃣  Deleting Countries...');
    const countryResult = await Country.deleteMany({});
    console.log(`   ✅ Deleted ${countryResult.deletedCount} countries`);

    console.log('\n4️⃣  Deleting Continents...');
    const continentResult = await Continent.deleteMany({});
    console.log(`   ✅ Deleted ${continentResult.deletedCount} continents`);

    console.log('\n📊 Final counts:');
    const finalContinentCount = await Continent.countDocuments();
    const finalCountryCount = await Country.countDocuments();
    const finalProvinceCount = await Province.countDocuments();
    const finalCityCount = await City.countDocuments();
    
    console.log(`  Continents: ${finalContinentCount}`);
    console.log(`  Countries: ${finalCountryCount}`);
    console.log(`  Provinces: ${finalProvinceCount}`);
    console.log(`  Cities: ${finalCityCount}`);

    console.log('\n🎉 All location data cleared successfully!');
  } catch (error) {
    console.error('\n❌ Error clearing location data:', error);
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

