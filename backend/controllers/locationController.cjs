const Continent = require('../models/Continent.cjs');
const Country = require('../models/Country.cjs');
const Province = require('../models/Province.cjs');
const City = require('../models/City.cjs');

// Get all continents
const getContinents = async (req, res) => {
  try {
    const continents = await Continent.find().sort({ name: 1 });
    res.json({
      success: true,
      data: continents
    });
  } catch (error) {
    console.error('Get continents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching continents',
      error: error.message
    });
  }
};

// Get countries by continent
const getCountries = async (req, res) => {
  try {
    const { continentId } = req.query;
    const query = continentId ? { continent: continentId } : {};
    const countries = await Country.find(query)
      .populate('continent', 'name code')
      .sort({ name: 1 });
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching countries',
      error: error.message
    });
  }
};

// Get provinces by country
const getProvinces = async (req, res) => {
  try {
    const { countryId } = req.query;
    if (!countryId) {
      return res.status(400).json({
        success: false,
        message: 'Country ID is required'
      });
    }
    const provinces = await Province.find({ country: countryId })
      .populate('country', 'name code')
      .sort({ name: 1 });
    res.json({
      success: true,
      data: provinces
    });
  } catch (error) {
    console.error('Get provinces error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching provinces',
      error: error.message
    });
  }
};

// Get cities by province
const getCities = async (req, res) => {
  try {
    const { provinceId, countryId } = req.query;
    const query = {};
    if (provinceId) query.province = provinceId;
    if (countryId) query.country = countryId;
    
    const cities = await City.find(query)
      .populate('province', 'name code')
      .populate('country', 'name code')
      .sort({ name: 1 });
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cities',
      error: error.message
    });
  }
};

module.exports = {
  getContinents,
  getCountries,
  getProvinces,
  getCities
};

