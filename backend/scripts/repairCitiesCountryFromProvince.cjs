/**
 * Repair City.country by deriving it from City.province -> Province.country
 * for City documents where country is null / missing.
 *
 * Usage:
 *   node backend/scripts/repairCitiesCountryFromProvince.cjs
 *   npm run repair:cities:country
 */

const { connectDB } = require('../config/database.cjs');
const City = require('../models/City.cjs');
const Province = require('../models/Province.cjs');

async function main() {
  await connectDB();

  const query = { $or: [{ country: null }, { country: { $exists: false } }] };
  const total = await City.countDocuments(query);
  console.log('🔧 Cities with missing/null country:', total);
  if (!total) return;

  const cursor = City.find(query).select('_id province flagImage').lean().cursor();

  let ops = [];
  let seen = 0;
  let fixed = 0;
  let skipped = 0;

  const flush = async () => {
    if (!ops.length) return;
    const res = await City.bulkWrite(ops, { ordered: false });
    fixed += (res.modifiedCount || 0);
    ops = [];
  };

  for await (const city of cursor) {
    seen++;
    if (!city.province) {
      skipped++;
      continue;
    }

    const prov = await Province.findById(city.province).select('_id country flagImage').lean();
    if (!prov?.country) {
      skipped++;
      continue;
    }

    const set = { country: prov.country };
    // If city has no flagImage, inherit from province (optional convenience)
    if (!city.flagImage && prov.flagImage) set.flagImage = prov.flagImage;

    ops.push({
      updateOne: {
        filter: { _id: city._id },
        update: { $set: set }
      }
    });

    if (ops.length >= 1000) {
      await flush();
    }
  }

  await flush();

  console.log('\n=== Summary ===');
  console.log('Processed:', seen);
  console.log('Fixed:', fixed);
  console.log('Skipped:', skipped);
}

main()
  .then(() => {
    console.log('🎉 Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Repair failed:', err);
    process.exit(1);
  });


