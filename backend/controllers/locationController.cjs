const mongoose = require('mongoose');
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

// Get province by ID
const getProvinceById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Get province by ID:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid province ID format'
      });
    }
    
    const province = await Province.findById(id)
      .populate('country', 'name code');
    
    if (!province) {
      return res.status(404).json({
        success: false,
        message: 'Province not found'
      });
    }
    
    res.json({
      success: true,
      data: province
    });
  } catch (error) {
    console.error('Get province by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching province',
      error: error.message
    });
  }
};

// Get provinces by country
const getProvinces = async (req, res) => {
  try {
    const { countryId } = req.query;
    console.log('Get provinces request - countryId:', countryId);
    console.log('Query params:', req.query);
    
    const query = {};
    
    // Only add country filter if countryId is provided, not empty, and is a valid ObjectId
    if (countryId && countryId.trim() !== '') {
      const trimmedId = countryId.trim();
      // Validate ObjectId format (24 hex characters)
      if (mongoose.Types.ObjectId.isValid(trimmedId)) {
        query.country = trimmedId;
      } else {
        console.warn('Invalid countryId format:', trimmedId);
        // Return empty array for invalid ObjectId instead of error
        return res.json({
          success: true,
          data: []
        });
      }
    }
    
    console.log('Provinces query:', query);
    
    // If no countryId, return empty array instead of error
    const provinces = await Province.find(query)
      .populate('country', 'name code')
      .sort({ name: 1 });
    
    console.log('Provinces found:', provinces.length);
    
    res.json({
      success: true,
      data: provinces
    });
  } catch (error) {
    console.error('Get provinces error:', error);
    console.error('Error stack:', error.stack);
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
    console.log('Get cities request - provinceId:', provinceId, 'countryId:', countryId);
    const query = {};

    // Only add filters if provided and valid ObjectIds (avoid CastError -> 500)
    if (provinceId && String(provinceId).trim() !== '') {
      const trimmed = String(provinceId).trim();
      if (mongoose.Types.ObjectId.isValid(trimmed)) {
        query.province = trimmed;
      } else {
        console.warn('Invalid provinceId format:', trimmed);
        return res.json({ success: true, data: [] });
      }
    }

    if (countryId && String(countryId).trim() !== '') {
      const trimmed = String(countryId).trim();
      if (mongoose.Types.ObjectId.isValid(trimmed)) {
        query.country = trimmed;
      } else {
        console.warn('Invalid countryId format:', trimmed);
        return res.json({ success: true, data: [] });
      }
    }
    
    console.log('Cities query:', query);
    const cities = await City.find(query)
      .populate('province', 'name code')
      .populate('country', 'name code')
      .sort({ name: 1 });
    
    console.log('Cities found:', cities.length);
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
  getProvinceById,
  getProvinces,
  getCities
};

