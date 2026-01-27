const mongoose = require('mongoose');
const Continent = require('../models/Continent.cjs');
const Country = require('../models/Country.cjs');
const Province = require('../models/Province.cjs');
const City = require('../models/City.cjs');
const RegionImage = require('../models/RegionImage.cjs');

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

// Get countries by region or continentId
const getCountries = async (req, res) => {
  try {
    const { region, continentId } = req.query;
    const query = {};
    
    // If continentId is provided, map it to region
    if (continentId && String(continentId).trim() !== '') {
      const trimmedContinentId = String(continentId).trim();
      if (mongoose.Types.ObjectId.isValid(trimmedContinentId)) {
        try {
          const continent = await Continent.findById(trimmedContinentId).select('name code');
          if (continent) {
            // Map continent name to region
            const continentName = (continent.name || '').toLowerCase();
            const continentCode = (continent.code || '').toLowerCase();
            
            // Map continent to region
            let mappedRegion = null;
            if (continentName.includes('europe') || continentCode === 'eu') {
              mappedRegion = 'europe';
            } else if (continentName.includes('africa') || continentCode === 'af') {
              mappedRegion = 'africa';
            } else if (continentName.includes('north america') || continentName.includes('america')) {
              // For North America, we can return both USA and Canada, or check the specific country
              // For now, let's check if it's specifically USA or Canada
              if (continentName.includes('usa') || continentName.includes('united states')) {
                mappedRegion = 'usa';
              } else if (continentName.includes('canada') || continentCode === 'ca') {
                mappedRegion = 'canada';
              } else {
                // Default to usa for North America
                mappedRegion = 'usa';
              }
            } else if (continentName.includes('australia') || continentName.includes('oceania') || continentCode === 'au' || continentCode === 'oc') {
              mappedRegion = 'australia';
            }
            
            if (mappedRegion) {
              query.region = mappedRegion;
            } else {
              console.warn('Could not map continent to region:', continent.name, continent.code);
              return res.json({
                success: true,
                data: []
              });
            }
          } else {
            console.warn('Continent not found:', trimmedContinentId);
            return res.json({
              success: true,
              data: []
            });
          }
        } catch (error) {
          console.error('Error fetching continent for country filter:', error);
          return res.json({
            success: true,
            data: []
          });
        }
      } else {
        console.warn('Invalid continentId format:', trimmedContinentId);
        return res.json({
          success: true,
          data: []
        });
      }
    } else if (region && region.trim() !== '') {
      const trimmedRegion = region.trim().toLowerCase();
      const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];
      if (validRegions.includes(trimmedRegion)) {
        query.region = trimmedRegion;
      } else {
        console.warn('Invalid region:', trimmedRegion);
        return res.json({
          success: true,
          data: []
        });
      }
    }
    
    const countries = await Country.find(query)
      .sort({ name: 1 })
      .lean(); // Use lean() for better performance
    
    console.log(`Found ${countries.length} countries for region: ${query.region || 'all'}, continentId: ${continentId || 'none'}`);
    if (countries.length > 0) {
      console.log('First 3 countries:', countries.slice(0, 3).map(c => ({ name: c.name, region: c.region, id: c._id })));
    }
    
    res.json({
      success: true,
      data: countries,
      count: countries.length
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
    
    const province = await Province.findById(id);
    
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

// Get provinces by region or countryId
const getProvinces = async (req, res) => {
  try {
    const { region, countryId } = req.query;
    console.log('Get provinces request - region:', region, 'countryId:', countryId);
    console.log('Query params:', req.query);
    
    const query = {};
    
    // If countryId is provided, filter provinces by that country (preferred).
    // Falls back to region-only when provinces are not yet backfilled with country.
    if (countryId && String(countryId).trim() !== '') {
      const trimmedCountryId = String(countryId).trim();
      if (mongoose.Types.ObjectId.isValid(trimmedCountryId)) {
        try {
          const country = await Country.findById(trimmedCountryId).select('_id region');
          if (country && country._id) {
            query.country = country._id;
            // Keep region as a helpful secondary filter when present
            if (country.region) query.region = country.region.toLowerCase();
          } else {
            console.warn('Country not found or has no region:', trimmedCountryId);
            return res.json({
              success: true,
              data: []
            });
          }
        } catch (error) {
          console.error('Error fetching country for province filter:', error);
          return res.json({
            success: true,
            data: []
          });
        }
      } else {
        console.warn('Invalid countryId format:', trimmedCountryId);
        return res.json({
          success: true,
          data: []
        });
      }
    } else if (region && region.trim() !== '') {
      // Only add region filter if region is provided and is valid
      const trimmedRegion = region.trim().toLowerCase();
      const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];
      if (validRegions.includes(trimmedRegion)) {
        query.region = trimmedRegion;
      } else {
        console.warn('Invalid region:', trimmedRegion);
        // Return empty array for invalid region instead of error
        return res.json({
          success: true,
          data: []
        });
      }
    }
    
    console.log('Provinces query:', query);
    
    // If no region/country filter, return empty array instead of error
    if (!query.region && !query.country) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    let provinces = await Province.find(query)
      .sort({ name: 1 })
      .lean();

    // Backward-compat: if querying by country but no provinces have country set yet,
    // fall back to region-only so UI doesn't break (will be fixed once repair/seed runs).
    if (query.country && provinces.length === 0 && query.region) {
      const fallback = await Province.find({ region: query.region }).sort({ name: 1 }).lean();
      provinces = fallback;
    }
    
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

// Get cities by province, region, or countryId
const getCities = async (req, res) => {
  try {
    const { provinceId, region, countryId } = req.query;
    console.log('Get cities request - provinceId:', provinceId, 'region:', region, 'countryId:', countryId);
    const query = {};

    // Priority: provinceId > countryId > region
    if (provinceId && String(provinceId).trim() !== '') {
      const trimmed = String(provinceId).trim();
      if (mongoose.Types.ObjectId.isValid(trimmed)) {
        query.province = trimmed;
      } else {
        console.warn('Invalid provinceId format:', trimmed);
        return res.json({ success: true, data: [] });
      }
    } else if (countryId && String(countryId).trim() !== '') {
      // If countryId is provided, get the country's region and filter cities by that region
      const trimmedCountryId = String(countryId).trim();
      if (mongoose.Types.ObjectId.isValid(trimmedCountryId)) {
        try {
          const country = await Country.findById(trimmedCountryId).select('region');
          if (country && country.region) {
            query.region = country.region.toLowerCase();
          } else {
            console.warn('Country not found or has no region:', trimmedCountryId);
            return res.json({ success: true, data: [] });
          }
        } catch (error) {
          console.error('Error fetching country for city filter:', error);
          return res.json({ success: true, data: [] });
        }
      } else {
        console.warn('Invalid countryId format:', trimmedCountryId);
        return res.json({ success: true, data: [] });
      }
    } else if (region && String(region).trim() !== '') {
      const trimmedRegion = String(region).trim().toLowerCase();
      const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];
      if (validRegions.includes(trimmedRegion)) {
        query.region = trimmedRegion;
      } else {
        console.warn('Invalid region:', trimmedRegion);
        return res.json({ success: true, data: [] });
      }
    }
    
    console.log('Cities query:', query);
    const cities = await City.find(query)
      .populate('province', 'name code region')
      .sort({ name: 1 })
      .lean();
    
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

// Get region images (public)
const getRegionImages = async (req, res) => {
  try {
    const regionImages = await RegionImage.find().sort({ region: 1 });
    res.json({
      success: true,
      data: regionImages
    });
  } catch (error) {
    console.error('Get region images error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching region images',
      error: error.message
    });
  }
};

module.exports = {
  getContinents,
  getCountries,
  getProvinceById,
  getProvinces,
  getCities,
  getRegionImages
};

