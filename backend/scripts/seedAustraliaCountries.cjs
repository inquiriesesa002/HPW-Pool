/**
 * Seed Australia/Oceania Countries
 * Adds all Australia region countries to the database
 * 
 * Usage:
 *   node backend/scripts/seedAustraliaCountries.cjs
 *   npm run seed:australia:countries
 */

const { connectDB } = require('../config/database.cjs');
const Country = require('../models/Country.cjs');

const australiaCountries = [
  { name: 'Australia', code: 'AU', flag: 'https://flagcdn.com/w320/au.png', region: 'australia' },
  { name: 'New Zealand', code: 'NZ', flag: 'https://flagcdn.com/w320/nz.png', region: 'australia' },
  { name: 'Papua New Guinea', code: 'PG', flag: 'https://flagcdn.com/w320/pg.png', region: 'australia' },
  { name: 'Fiji', code: 'FJ', flag: 'https://flagcdn.com/w320/fj.png', region: 'australia' },
  { name: 'Solomon Islands', code: 'SB', flag: 'https://flagcdn.com/w320/sb.png', region: 'australia' },
  { name: 'Vanuatu', code: 'VU', flag: 'https://flagcdn.com/w320/vu.png', region: 'australia' },
  { name: 'Samoa', code: 'WS', flag: 'https://flagcdn.com/w320/ws.png', region: 'australia' },
  { name: 'Tonga', code: 'TO', flag: 'https://flagcdn.com/w320/to.png', region: 'australia' },
  { name: 'Kiribati', code: 'KI', flag: 'https://flagcdn.com/w320/ki.png', region: 'australia' },
  { name: 'Tuvalu', code: 'TV', flag: 'https://flagcdn.com/w320/tv.png', region: 'australia' },
  { name: 'Nauru', code: 'NR', flag: 'https://flagcdn.com/w320/nr.png', region: 'australia' },
  { name: 'Federated States of Micronesia', code: 'FM', flag: 'https://flagcdn.com/w320/fm.png', region: 'australia' },
  { name: 'Palau', code: 'PW', flag: 'https://flagcdn.com/w320/pw.png', region: 'australia' },
  { name: 'Marshall Islands', code: 'MH', flag: 'https://flagcdn.com/w320/mh.png', region: 'australia' }
];

async function main() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log(`\n📊 Seeding ${australiaCountries.length} Australia region countries...`);

    // Use bulkWrite with upsert to avoid duplicates
    const ops = australiaCountries.map(country => ({
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
    const totalInDB = await Country.countDocuments({ region: 'australia' });
    console.log(`\n📊 Total Australia region countries in database: ${totalInDB}`);

    if (totalInDB > 0) {
      const sample = await Country.find({ region: 'australia' }).limit(5).sort({ name: 1 });
      console.log('\n📋 Sample countries:');
      sample.forEach(c => console.log(`  - ${c.name} (${c.code})`));
    }

    console.log('\n🎉 Australia region countries seeding completed!');
  } catch (error) {
    console.error('\n❌ Error seeding Australia countries:', error);
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

