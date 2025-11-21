const mongoose = require('mongoose');
require('dotenv').config();
const Continent = require('../models/Continent');
const Country = require('../models/Country');
const Province = require('../models/Province');
const City = require('../models/City');

const seedLocations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://inquiriesesa_db_user:9OOQm5boLEOdNZsi@cluster0.ktqsjbu.mongodb.net/?appName=Cluster0');
    console.log('MongoDB Connected...');

    // Clear existing data
    await City.deleteMany({});
    await Province.deleteMany({});
    await Country.deleteMany({});
    await Continent.deleteMany({});
    console.log('Cleared existing locations');

    // Create Continents
    const continents = await Continent.insertMany([
      { name: 'Asia', code: 'AS', description: 'Largest continent by population' },
      { name: 'Africa', code: 'AF', description: 'Second largest continent' },
      { name: 'Europe', code: 'EU', description: 'Western continent' },
      { name: 'North America', code: 'NA', description: 'Northern American continent' },
      { name: 'South America', code: 'SA', description: 'Southern American continent' },
      { name: 'Australia & Oceania', code: 'OC', description: 'Oceanic continent' }
    ]);
    console.log('Created continents');

    // Create Countries (Sample - Pakistan, India, USA, UK)
    const asia = continents.find(c => c.name === 'Asia');
    const northAmerica = continents.find(c => c.name === 'North America');
    const europe = continents.find(c => c.name === 'Europe');

    const countries = await Country.insertMany([
      { name: 'Pakistan', code: 'PK', continent: asia._id, flag: '🇵🇰', population: 231400000 },
      { name: 'India', code: 'IN', continent: asia._id, flag: '🇮🇳', population: 1400000000 },
      { name: 'United States', code: 'US', continent: northAmerica._id, flag: '🇺🇸', population: 331000000 },
      { name: 'United Kingdom', code: 'GB', continent: europe._id, flag: '🇬🇧', population: 67000000 }
    ]);
    console.log('Created countries');

    // Create Provinces (Sample - Pakistan provinces)
    const pakistan = countries.find(c => c.name === 'Pakistan');
    const provinces = await Province.insertMany([
      { name: 'Punjab', country: pakistan._id },
      { name: 'Sindh', country: pakistan._id },
      { name: 'Khyber Pakhtunkhwa', country: pakistan._id },
      { name: 'Balochistan', country: pakistan._id }
    ]);
    console.log('Created provinces');

    // Create Cities (Sample - Punjab cities)
    const punjab = provinces.find(p => p.name === 'Punjab');
    await City.insertMany([
      { name: 'Lahore', province: punjab._id },
      { name: 'Karachi', province: provinces.find(p => p.name === 'Sindh')._id },
      { name: 'Islamabad', province: provinces.find(p => p.name === 'Khyber Pakhtunkhwa')._id },
      { name: 'Faisalabad', province: punjab._id },
      { name: 'Rawalpindi', province: punjab._id },
      { name: 'Multan', province: punjab._id }
    ]);
    console.log('Created cities');

    console.log('✅ Location seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding locations:', error);
    process.exit(1);
  }
};

seedLocations();

