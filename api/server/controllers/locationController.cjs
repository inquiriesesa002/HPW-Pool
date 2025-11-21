const Continent = require('../models/Continent.cjs');
const Country = require('../models/Country.cjs');
const Province = require('../models/Province.cjs');
const City = require('../models/City.cjs');

// Get all continents
exports.getContinents = async (req, res) => {
  try {
    const continents = await Continent.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: continents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get countries by continent
exports.getCountries = async (req, res) => {
  try {
    const { continentId } = req.query;
    let query = { isActive: true };
    
    if (continentId) {
      query.continent = continentId;
    }
    
    const countries = await Country.find(query)
      .populate('continent', 'name code')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get provinces by country
exports.getProvinces = async (req, res) => {
  try {
    const { countryId } = req.query;
    let query = { isActive: true };
    
    if (countryId) {
      query.country = countryId;
    }
    
    const provinces = await Province.find(query)
      .populate('country', 'name code')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: provinces
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get cities by province
exports.getCities = async (req, res) => {
  try {
    const { provinceId } = req.query;
    let query = { isActive: true };
    
    if (provinceId) {
      query.province = provinceId;
    }
    
    const cities = await City.find(query)
      .populate('province', 'name')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

