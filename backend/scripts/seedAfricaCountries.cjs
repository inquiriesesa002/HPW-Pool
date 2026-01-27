/**
 * Seed Africa Countries
 * Adds all Africa region countries to the database
 * 
 * Usage:
 *   node backend/scripts/seedAfricaCountries.cjs
 *   npm run seed:africa:countries
 */

const { connectDB } = require('../config/database.cjs');
const Country = require('../models/Country.cjs');

const africaCountries = [
  { name: 'Algeria', code: 'DZ', flag: 'https://flagcdn.com/w320/dz.png', region: 'africa' },
  { name: 'Angola', code: 'AO', flag: 'https://flagcdn.com/w320/ao.png', region: 'africa' },
  { name: 'Benin', code: 'BJ', flag: 'https://flagcdn.com/w320/bj.png', region: 'africa' },
  { name: 'Botswana', code: 'BW', flag: 'https://flagcdn.com/w320/bw.png', region: 'africa' },
  { name: 'Burkina Faso', code: 'BF', flag: 'https://flagcdn.com/w320/bf.png', region: 'africa' },
  { name: 'Burundi', code: 'BI', flag: 'https://flagcdn.com/w320/bi.png', region: 'africa' },
  { name: 'Cabo Verde', code: 'CV', flag: 'https://flagcdn.com/w320/cv.png', region: 'africa' },
  { name: 'Cameroon', code: 'CM', flag: 'https://flagcdn.com/w320/cm.png', region: 'africa' },
  { name: 'Central African Republic', code: 'CF', flag: 'https://flagcdn.com/w320/cf.png', region: 'africa' },
  { name: 'Chad', code: 'TD', flag: 'https://flagcdn.com/w320/td.png', region: 'africa' },
  { name: 'Comoros', code: 'KM', flag: 'https://flagcdn.com/w320/km.png', region: 'africa' },
  { name: 'Democratic Republic of the Congo', code: 'CD', flag: 'https://flagcdn.com/w320/cd.png', region: 'africa' },
  { name: 'Republic of the Congo', code: 'CG', flag: 'https://flagcdn.com/w320/cg.png', region: 'africa' },
  { name: 'Djibouti', code: 'DJ', flag: 'https://flagcdn.com/w320/dj.png', region: 'africa' },
  { name: 'Egypt', code: 'EG', flag: 'https://flagcdn.com/w320/eg.png', region: 'africa' },
  { name: 'Equatorial Guinea', code: 'GQ', flag: 'https://flagcdn.com/w320/gq.png', region: 'africa' },
  { name: 'Eritrea', code: 'ER', flag: 'https://flagcdn.com/w320/er.png', region: 'africa' },
  { name: 'Eswatini', code: 'SZ', flag: 'https://flagcdn.com/w320/sz.png', region: 'africa' },
  { name: 'Ethiopia', code: 'ET', flag: 'https://flagcdn.com/w320/et.png', region: 'africa' },
  { name: 'Gabon', code: 'GA', flag: 'https://flagcdn.com/w320/ga.png', region: 'africa' },
  { name: 'Gambia', code: 'GM', flag: 'https://flagcdn.com/w320/gm.png', region: 'africa' },
  { name: 'Ghana', code: 'GH', flag: 'https://flagcdn.com/w320/gh.png', region: 'africa' },
  { name: 'Guinea', code: 'GN', flag: 'https://flagcdn.com/w320/gn.png', region: 'africa' },
  { name: 'Guinea-Bissau', code: 'GW', flag: 'https://flagcdn.com/w320/gw.png', region: 'africa' },
  { name: 'Ivory Coast', code: 'CI', flag: 'https://flagcdn.com/w320/ci.png', region: 'africa' },
  { name: 'Kenya', code: 'KE', flag: 'https://flagcdn.com/w320/ke.png', region: 'africa' },
  { name: 'Lesotho', code: 'LS', flag: 'https://flagcdn.com/w320/ls.png', region: 'africa' },
  { name: 'Liberia', code: 'LR', flag: 'https://flagcdn.com/w320/lr.png', region: 'africa' },
  { name: 'Libya', code: 'LY', flag: 'https://flagcdn.com/w320/ly.png', region: 'africa' },
  { name: 'Madagascar', code: 'MG', flag: 'https://flagcdn.com/w320/mg.png', region: 'africa' },
  { name: 'Malawi', code: 'MW', flag: 'https://flagcdn.com/w320/mw.png', region: 'africa' },
  { name: 'Mali', code: 'ML', flag: 'https://flagcdn.com/w320/ml.png', region: 'africa' },
  { name: 'Mauritania', code: 'MR', flag: 'https://flagcdn.com/w320/mr.png', region: 'africa' },
  { name: 'Mauritius', code: 'MU', flag: 'https://flagcdn.com/w320/mu.png', region: 'africa' },
  { name: 'Morocco', code: 'MA', flag: 'https://flagcdn.com/w320/ma.png', region: 'africa' },
  { name: 'Mozambique', code: 'MZ', flag: 'https://flagcdn.com/w320/mz.png', region: 'africa' },
  { name: 'Namibia', code: 'NA', flag: 'https://flagcdn.com/w320/na.png', region: 'africa' },
  { name: 'Niger', code: 'NE', flag: 'https://flagcdn.com/w320/ne.png', region: 'africa' },
  { name: 'Nigeria', code: 'NG', flag: 'https://flagcdn.com/w320/ng.png', region: 'africa' },
  { name: 'Rwanda', code: 'RW', flag: 'https://flagcdn.com/w320/rw.png', region: 'africa' },
  { name: 'Sao Tome and Principe', code: 'ST', flag: 'https://flagcdn.com/w320/st.png', region: 'africa' },
  { name: 'Senegal', code: 'SN', flag: 'https://flagcdn.com/w320/sn.png', region: 'africa' },
  { name: 'Seychelles', code: 'SC', flag: 'https://flagcdn.com/w320/sc.png', region: 'africa' },
  { name: 'Sierra Leone', code: 'SL', flag: 'https://flagcdn.com/w320/sl.png', region: 'africa' },
  { name: 'Somalia', code: 'SO', flag: 'https://flagcdn.com/w320/so.png', region: 'africa' },
  { name: 'South Africa', code: 'ZA', flag: 'https://flagcdn.com/w320/za.png', region: 'africa' },
  { name: 'South Sudan', code: 'SS', flag: 'https://flagcdn.com/w320/ss.png', region: 'africa' },
  { name: 'Sudan', code: 'SD', flag: 'https://flagcdn.com/w320/sd.png', region: 'africa' },
  { name: 'Tanzania', code: 'TZ', flag: 'https://flagcdn.com/w320/tz.png', region: 'africa' },
  { name: 'Togo', code: 'TG', flag: 'https://flagcdn.com/w320/tg.png', region: 'africa' },
  { name: 'Tunisia', code: 'TN', flag: 'https://flagcdn.com/w320/tn.png', region: 'africa' },
  { name: 'Uganda', code: 'UG', flag: 'https://flagcdn.com/w320/ug.png', region: 'africa' },
  { name: 'Zambia', code: 'ZM', flag: 'https://flagcdn.com/w320/zm.png', region: 'africa' },
  { name: 'Zimbabwe', code: 'ZW', flag: 'https://flagcdn.com/w320/zw.png', region: 'africa' }
];

async function main() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log(`\n📊 Seeding ${africaCountries.length} Africa region countries...`);

    // Use bulkWrite with upsert to avoid duplicates
    const ops = africaCountries.map(country => ({
      updateOne: {
        filter: { name: country.name, region: country.region },
        update: {
          $setOnInsert: {
            name: country.name,
            region: country.region
          },
          $set: {
            code: country.code,
            flag: country.flag,
            population: 0,
            healthcareIndex: 0
          }
        },
        upsert: true
      }
    }));

    const result = await Country.bulkWrite(ops, { ordered: false });

    console.log('\n✅ Results:');
    console.log(`  Inserted: ${result.upsertedCount}`);
    console.log(`  Updated: ${result.modifiedCount}`);
    console.log(`  Matched: ${result.matchedCount}`);

    // Verify
    const totalInDB = await Country.countDocuments({ region: 'africa' });
    console.log(`\n📊 Total Africa region countries in database: ${totalInDB}`);

    if (totalInDB > 0) {
      const sample = await Country.find({ region: 'africa' }).limit(5).sort({ name: 1 });
      console.log('\n📋 Sample countries:');
      sample.forEach(c => console.log(`  - ${c.name} (${c.code})`));
    }

    console.log('\n🎉 Africa region countries seeding completed!');
  } catch (error) {
    console.error('\n❌ Error seeding Africa countries:', error);
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

