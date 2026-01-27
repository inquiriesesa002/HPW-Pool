/**
 * Seed USA States
 * Adds all 50 US states as provinces to the database
 * 
 * Usage:
 *   node backend/scripts/seedUSAStates.cjs
 *   npm run seed:usa:states
 */

const { connectDB } = require('../config/database.cjs');
const Country = require('../models/Country.cjs');
const Province = require('../models/Province.cjs');

// All 50 US States with their codes and flag images
// Using Wikimedia Commons for state flags
const usaStates = [
  { name: 'Alabama', code: 'AL', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flag_of_Alabama.svg/320px-Flag_of_Alabama.svg.png', region: 'usa' },
  { name: 'Alaska', code: 'AK', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Flag_of_Alaska.svg/320px-Flag_of_Alaska.svg.png', region: 'usa' },
  { name: 'Arizona', code: 'AZ', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Flag_of_Arizona.svg/320px-Flag_of_Arizona.svg.png', region: 'usa' },
  { name: 'Arkansas', code: 'AR', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Flag_of_Arkansas.svg/320px-Flag_of_Arkansas.svg.png', region: 'usa' },
  { name: 'California', code: 'CA', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Flag_of_California.svg/320px-Flag_of_California.svg.png', region: 'usa' },
  { name: 'Colorado', code: 'CO', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Colorado.svg/320px-Flag_of_Colorado.svg.png', region: 'usa' },
  { name: 'Connecticut', code: 'CT', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Flag_of_Connecticut.svg/320px-Flag_of_Connecticut.svg.png', region: 'usa' },
  { name: 'Delaware', code: 'DE', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Flag_of_Delaware.svg/320px-Flag_of_Delaware.svg.png', region: 'usa' },
  { name: 'Florida', code: 'FL', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Flag_of_Florida.svg/320px-Flag_of_Florida.svg.png', region: 'usa' },
  { name: 'Georgia', code: 'GA', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Flag_of_Georgia_%28U.S._state%29.svg/320px-Flag_of_Georgia_%28U.S._state%29.svg.png', region: 'usa' },
  { name: 'Hawaii', code: 'HI', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Flag_of_Hawaii.svg/320px-Flag_of_Hawaii.svg.png', region: 'usa' },
  { name: 'Idaho', code: 'ID', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_Idaho.svg/320px-Flag_of_Idaho.svg.png', region: 'usa' },
  { name: 'Illinois', code: 'IL', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Flag_of_Illinois.svg/320px-Flag_of_Illinois.svg.png', region: 'usa' },
  { name: 'Indiana', code: 'IN', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Flag_of_Indiana.svg/320px-Flag_of_Indiana.svg.png', region: 'usa' },
  { name: 'Iowa', code: 'IA', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Flag_of_Iowa.svg/320px-Flag_of_Iowa.svg.png', region: 'usa' },
  { name: 'Kansas', code: 'KS', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Flag_of_Kansas.svg/320px-Flag_of_Kansas.svg.png', region: 'usa' },
  { name: 'Kentucky', code: 'KY', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Flag_of_Kentucky.svg/320px-Flag_of_Kentucky.svg.png', region: 'usa' },
  { name: 'Louisiana', code: 'LA', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Flag_of_Louisiana.svg/320px-Flag_of_Louisiana.svg.png', region: 'usa' },
  { name: 'Maine', code: 'ME', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Flag_of_Maine.svg/320px-Flag_of_Maine.svg.png', region: 'usa' },
  { name: 'Maryland', code: 'MD', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Flag_of_Maryland.svg/320px-Flag_of_Maryland.svg.png', region: 'usa' },
  { name: 'Massachusetts', code: 'MA', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Flag_of_Massachusetts.svg/320px-Flag_of_Massachusetts.svg.png', region: 'usa' },
  { name: 'Michigan', code: 'MI', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Flag_of_Michigan.svg/320px-Flag_of_Michigan.svg.png', region: 'usa' },
  { name: 'Minnesota', code: 'MN', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Flag_of_Minnesota.svg/320px-Flag_of_Minnesota.svg.png', region: 'usa' },
  { name: 'Mississippi', code: 'MS', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Flag_of_Mississippi.svg/320px-Flag_of_Mississippi.svg.png', region: 'usa' },
  { name: 'Missouri', code: 'MO', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Flag_of_Missouri.svg/320px-Flag_of_Missouri.svg.png', region: 'usa' },
  { name: 'Montana', code: 'MT', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_Montana.svg/320px-Flag_of_Montana.svg.png', region: 'usa' },
  { name: 'Nebraska', code: 'NE', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Flag_of_Nebraska.svg/320px-Flag_of_Nebraska.svg.png', region: 'usa' },
  { name: 'Nevada', code: 'NV', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Flag_of_Nevada.svg/320px-Flag_of_Nevada.svg.png', region: 'usa' },
  { name: 'New Hampshire', code: 'NH', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Flag_of_New_Hampshire.svg/320px-Flag_of_New_Hampshire.svg.png', region: 'usa' },
  { name: 'New Jersey', code: 'NJ', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Flag_of_New_Jersey.svg/320px-Flag_of_New_Jersey.svg.png', region: 'usa' },
  { name: 'New Mexico', code: 'NM', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_New_Mexico.svg/320px-Flag_of_New_Mexico.svg.png', region: 'usa' },
  { name: 'New York', code: 'NY', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_New_York.svg/320px-Flag_of_New_York.svg.png', region: 'usa' },
  { name: 'North Carolina', code: 'NC', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Flag_of_North_Carolina.svg/320px-Flag_of_North_Carolina.svg.png', region: 'usa' },
  { name: 'North Dakota', code: 'ND', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Flag_of_North_Dakota.svg/320px-Flag_of_North_Dakota.svg.png', region: 'usa' },
  { name: 'Ohio', code: 'OH', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Flag_of_Ohio.svg/320px-Flag_of_Ohio.svg.png', region: 'usa' },
  { name: 'Oklahoma', code: 'OK', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Flag_of_Oklahoma.svg/320px-Flag_of_Oklahoma.svg.png', region: 'usa' },
  { name: 'Oregon', code: 'OR', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Flag_of_Oregon.svg/320px-Flag_of_Oregon.svg.png', region: 'usa' },
  { name: 'Pennsylvania', code: 'PA', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Flag_of_Pennsylvania.svg/320px-Flag_of_Pennsylvania.svg.png', region: 'usa' },
  { name: 'Rhode Island', code: 'RI', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Rhode_Island.svg/320px-Flag_of_Rhode_Island.svg.png', region: 'usa' },
  { name: 'South Carolina', code: 'SC', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Flag_of_South_Carolina.svg/320px-Flag_of_South_Carolina.svg.png', region: 'usa' },
  { name: 'South Dakota', code: 'SD', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_South_Dakota.svg/320px-Flag_of_South_Dakota.svg.png', region: 'usa' },
  { name: 'Tennessee', code: 'TN', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Flag_of_Tennessee.svg/320px-Flag_of_Tennessee.svg.png', region: 'usa' },
  { name: 'Texas', code: 'TX', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Flag_of_Texas.svg/320px-Flag_of_Texas.svg.png', region: 'usa' },
  { name: 'Utah', code: 'UT', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Flag_of_Utah.svg/320px-Flag_of_Utah.svg.png', region: 'usa' },
  { name: 'Vermont', code: 'VT', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Vermont.svg/320px-Flag_of_Vermont.svg.png', region: 'usa' },
  { name: 'Virginia', code: 'VA', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Flag_of_Virginia.svg/320px-Flag_of_Virginia.svg.png', region: 'usa' },
  { name: 'Washington', code: 'WA', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Flag_of_Washington.svg/320px-Flag_of_Washington.svg.png', region: 'usa' },
  { name: 'West Virginia', code: 'WV', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Flag_of_West_Virginia.svg/320px-Flag_of_West_Virginia.svg.png', region: 'usa' },
  { name: 'Wisconsin', code: 'WI', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Flag_of_Wisconsin.svg/320px-Flag_of_Wisconsin.svg.png', region: 'usa' },
  { name: 'Wyoming', code: 'WY', flagImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Flag_of_Wyoming.svg/320px-Flag_of_Wyoming.svg.png', region: 'usa' }
];

async function main() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    const usaCountry = await Country.findOne({ region: 'usa' }).select('_id');
    const usaCountryId = usaCountry?._id || null;

    console.log(`\n📊 Seeding ${usaStates.length} USA states...`);

    // Use bulkWrite with upsert to avoid duplicates
    const ops = usaStates.map(state => ({
      updateOne: {
        filter: { name: state.name, region: state.region },
        update: {
          $setOnInsert: {
            name: state.name,
            region: state.region
          },
          $set: {
            code: state.code,
            flagImage: state.flagImage,
            ...(usaCountryId ? { country: usaCountryId } : {})
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
    const totalInDB = await Province.countDocuments({ region: 'usa' });
    console.log(`\n📊 Total USA states in database: ${totalInDB}`);

    if (totalInDB > 0) {
      const sample = await Province.find({ region: 'usa' }).limit(5).sort({ name: 1 });
      console.log('\n📋 Sample states:');
      sample.forEach(s => console.log(`  - ${s.name} (${s.code})`));
    }

    console.log('\n🎉 USA states seeding completed!');
  } catch (error) {
    console.error('\n❌ Error seeding USA states:', error);
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

