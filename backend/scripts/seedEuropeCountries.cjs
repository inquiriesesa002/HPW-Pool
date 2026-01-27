/**
 * Seed Europe Countries
 * Adds all European countries to the database
 * 
 * Usage:
 *   node backend/scripts/seedEuropeCountries.cjs
 *   npm run seed:europe:countries
 */

const { connectDB } = require('../config/database.cjs');
const Country = require('../models/Country.cjs');

const europeCountries = [
  { name: 'Albania', code: 'AL', flag: 'https://flagpedia.net/data/flags/w580/al.png', region: 'europe' },
  { name: 'Andorra', code: 'AD', flag: 'https://flagpedia.net/data/flags/w580/ad.png', region: 'europe' },
  { name: 'Armenia', code: 'AM', flag: 'https://flagpedia.net/data/flags/w580/am.png', region: 'europe' },
  { name: 'Austria', code: 'AT', flag: 'https://flagpedia.net/data/flags/w580/at.png', region: 'europe' },
  { name: 'Azerbaijan', code: 'AZ', flag: 'https://flagpedia.net/data/flags/w580/az.png', region: 'europe' },
  { name: 'Belarus', code: 'BY', flag: 'https://flagpedia.net/data/flags/w580/by.png', region: 'europe' },
  { name: 'Belgium', code: 'BE', flag: 'https://flagpedia.net/data/flags/w580/be.png', region: 'europe' },
  { name: 'Bosnia and Herzegovina', code: 'BA', flag: 'https://flagpedia.net/data/flags/w580/ba.png', region: 'europe' },
  { name: 'Bulgaria', code: 'BG', flag: 'https://flagpedia.net/data/flags/w580/bg.png', region: 'europe' },
  { name: 'Croatia', code: 'HR', flag: 'https://flagpedia.net/data/flags/w580/hr.png', region: 'europe' },
  { name: 'Cyprus', code: 'CY', flag: 'https://flagpedia.net/data/flags/w580/cy.png', region: 'europe' },
  { name: 'Czech Republic', code: 'CZ', flag: 'https://flagpedia.net/data/flags/w580/cz.png', region: 'europe' },
  { name: 'Denmark', code: 'DK', flag: 'https://flagpedia.net/data/flags/w580/dk.png', region: 'europe' },
  { name: 'Estonia', code: 'EE', flag: 'https://flagpedia.net/data/flags/w580/ee.png', region: 'europe' },
  { name: 'Finland', code: 'FI', flag: 'https://flagpedia.net/data/flags/w580/fi.png', region: 'europe' },
  { name: 'France', code: 'FR', flag: 'https://flagpedia.net/data/flags/w580/fr.png', region: 'europe' },
  { name: 'Germany', code: 'DE', flag: 'https://flagpedia.net/data/flags/w580/de.png', region: 'europe' },
  { name: 'Greece', code: 'GR', flag: 'https://flagpedia.net/data/flags/w580/gr.png', region: 'europe' },
  { name: 'Hungary', code: 'HU', flag: 'https://flagpedia.net/data/flags/w580/hu.png', region: 'europe' },
  { name: 'Iceland', code: 'IS', flag: 'https://flagpedia.net/data/flags/w580/is.png', region: 'europe' },
  { name: 'Ireland', code: 'IE', flag: 'https://flagpedia.net/data/flags/w580/ie.png', region: 'europe' },
  { name: 'Italy', code: 'IT', flag: 'https://flagpedia.net/data/flags/w580/it.png', region: 'europe' },
  { name: 'Kosovo', code: 'XK', flag: 'https://flagpedia.net/data/flags/w580/xk.png', region: 'europe' },
  { name: 'Latvia', code: 'LV', flag: 'https://flagpedia.net/data/flags/w580/lv.png', region: 'europe' },
  { name: 'Liechtenstein', code: 'LI', flag: 'https://flagpedia.net/data/flags/w580/li.png', region: 'europe' },
  { name: 'Lithuania', code: 'LT', flag: 'https://flagpedia.net/data/flags/w580/lt.png', region: 'europe' },
  { name: 'Luxembourg', code: 'LU', flag: 'https://flagpedia.net/data/flags/w580/lu.png', region: 'europe' },
  { name: 'Malta', code: 'MT', flag: 'https://flagpedia.net/data/flags/w580/mt.png', region: 'europe' },
  { name: 'Moldova', code: 'MD', flag: 'https://flagpedia.net/data/flags/w580/md.png', region: 'europe' },
  { name: 'Monaco', code: 'MC', flag: 'https://flagpedia.net/data/flags/w580/mc.png', region: 'europe' },
  { name: 'Montenegro', code: 'ME', flag: 'https://flagpedia.net/data/flags/w580/me.png', region: 'europe' },
  { name: 'Netherlands', code: 'NL', flag: 'https://flagpedia.net/data/flags/w580/nl.png', region: 'europe' },
  { name: 'North Macedonia', code: 'MK', flag: 'https://flagpedia.net/data/flags/w580/mk.png', region: 'europe' },
  { name: 'Norway', code: 'NO', flag: 'https://flagpedia.net/data/flags/w580/no.png', region: 'europe' },
  { name: 'Poland', code: 'PL', flag: 'https://flagpedia.net/data/flags/w580/pl.png', region: 'europe' },
  { name: 'Portugal', code: 'PT', flag: 'https://flagpedia.net/data/flags/w580/pt.png', region: 'europe' },
  { name: 'Romania', code: 'RO', flag: 'https://flagpedia.net/data/flags/w580/ro.png', region: 'europe' },
  { name: 'Russia', code: 'RU', flag: 'https://flagpedia.net/data/flags/w580/ru.png', region: 'europe' },
  { name: 'San Marino', code: 'SM', flag: 'https://flagpedia.net/data/flags/w580/sm.png', region: 'europe' },
  { name: 'Serbia', code: 'RS', flag: 'https://flagpedia.net/data/flags/w580/rs.png', region: 'europe' },
  { name: 'Slovakia', code: 'SK', flag: 'https://flagpedia.net/data/flags/w580/sk.png', region: 'europe' },
  { name: 'Slovenia', code: 'SI', flag: 'https://flagpedia.net/data/flags/w580/si.png', region: 'europe' },
  { name: 'Spain', code: 'ES', flag: 'https://flagpedia.net/data/flags/w580/es.png', region: 'europe' },
  { name: 'Sweden', code: 'SE', flag: 'https://flagpedia.net/data/flags/w580/se.png', region: 'europe' },
  { name: 'Switzerland', code: 'CH', flag: 'https://flagpedia.net/data/flags/w580/ch.png', region: 'europe' },
  { name: 'Turkey', code: 'TR', flag: 'https://flagpedia.net/data/flags/w580/tr.png', region: 'europe' },
  { name: 'Ukraine', code: 'UA', flag: 'https://flagpedia.net/data/flags/w580/ua.png', region: 'europe' },
  { name: 'United Kingdom', code: 'GB', flag: 'https://flagpedia.net/data/flags/w580/gb.png', region: 'europe' },
  { name: 'Vatican City', code: 'VA', flag: 'https://flagpedia.net/data/flags/w580/va.png', region: 'europe' }
];

async function main() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log(`\n📊 Seeding ${europeCountries.length} European countries...`);

    // Use bulkWrite with upsert to avoid duplicates
    const ops = europeCountries.map(country => ({
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
    const totalInDB = await Country.countDocuments({ region: 'europe' });
    console.log(`\n📊 Total Europe countries in database: ${totalInDB}`);

    if (totalInDB > 0) {
      const sample = await Country.find({ region: 'europe' }).limit(5).sort({ name: 1 });
      console.log('\n📋 Sample countries:');
      sample.forEach(c => console.log(`  - ${c.name} (${c.code})`));
    }

    console.log('\n🎉 Europe countries seeding completed!');
  } catch (error) {
    console.error('\n❌ Error seeding Europe countries:', error);
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

