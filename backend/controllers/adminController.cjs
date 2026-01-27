const User = require('../models/User.cjs');
const Professional = require('../models/Professional.cjs');
const Company = require('../models/Company.cjs');
const Job = require('../models/Job.cjs');
const Profession = require('../models/Profession.cjs');
const Country = require('../models/Country.cjs');
const Continent = require('../models/Continent.cjs');
const Province = require('../models/Province.cjs');
const City = require('../models/City.cjs');
const RegionImage = require('../models/RegionImage.cjs');

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProfessionals = await Professional.countDocuments();
    const verifiedProfessionals = await Professional.countDocuments({ isVerified: true });
    const pendingVerifications = await Professional.countDocuments({ isVerified: false });
    const totalCompanies = await Company.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalCountries = await Country.countDocuments();

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProfessionals,
        verifiedProfessionals,
        pendingVerifications,
        totalCompanies,
        totalJobs,
        totalCountries
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get all professionals for admin
const getProfessionals = async (req, res) => {
  try {
    const professionals = await Professional.find()
      .populate('profession', 'name')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: professionals
    });
  } catch (error) {
    console.error('Get professionals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professionals',
      error: error.message
    });
  }
};

// Verify professional
const verifyProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await Professional.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true }
    );

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    res.json({
      success: true,
      message: 'Professional verified successfully',
      data: professional
    });
  } catch (error) {
    console.error('Verify professional error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying professional',
      error: error.message
    });
  }
};

// Get all companies for admin
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies',
      error: error.message
    });
  }
};

// Get all jobs for admin
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('company', 'companyName')
      .populate('profession', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
};

// Get all locations for admin
const getLocations = async (req, res) => {
  try {
    const continents = await Continent.find().sort({ name: 1 });
    const countries = await Country.find()
      .populate('continent', 'name')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        continents,
        countries
      }
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
      error: error.message
    });
  }
};

// Create continent (admin)
const createContinent = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Continent name is required'
      });
    }

    const continent = await Continent.create({
      name: String(name).trim(),
      code: code ? String(code).trim().toUpperCase() : '',
      description: description ? String(description).trim() : ''
    });

    res.json({
      success: true,
      message: 'Continent created successfully',
      data: continent
    });
  } catch (error) {
    console.error('Create continent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating continent',
      error: error.message
    });
  }
};

// Update continent (admin)
const updateContinent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Continent name is required'
      });
    }

    const continent = await Continent.findByIdAndUpdate(
      id,
      {
        name: String(name).trim(),
        code: code ? String(code).trim().toUpperCase() : '',
        description: description ? String(description).trim() : ''
      },
      { new: true, runValidators: true }
    );

    if (!continent) {
      return res.status(404).json({
        success: false,
        message: 'Continent not found'
      });
    }

    res.json({
      success: true,
      message: 'Continent updated successfully',
      data: continent
    });
  } catch (error) {
    console.error('Update continent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating continent',
      error: error.message
    });
  }
};

// Delete continent (admin)
const deleteContinent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if continent has countries
    const countriesCount = await Country.countDocuments({ continent: id });
    if (countriesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete continent. It has ${countriesCount} countries associated with it. Please delete or reassign countries first.`
      });
    }

    const continent = await Continent.findByIdAndDelete(id);

    if (!continent) {
      return res.status(404).json({
        success: false,
        message: 'Continent not found'
      });
    }

    res.json({
      success: true,
      message: 'Continent deleted successfully',
      data: continent
    });
  } catch (error) {
    console.error('Delete continent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting continent',
      error: error.message
    });
  }
};

// Create country (admin)
const createCountry = async (req, res) => {
  try {
    const { name, code, region, flag, population, healthcareIndex } = req.body;

    const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];

    if (!name || !region) {
      return res.status(400).json({
        success: false,
        message: 'Country name and region are required'
      });
    }

    const regionLower = String(region).trim().toLowerCase();
    if (!validRegions.includes(regionLower)) {
      return res.status(400).json({
        success: false,
        message: `Invalid region. Must be one of: ${validRegions.join(', ')}`
      });
    }

    const country = await Country.create({
      name: String(name).trim(),
      code: code ? String(code).trim().toUpperCase() : '',
      region: regionLower,
      flag: flag ? String(flag).trim() : '',
      population: Number.isFinite(Number(population)) ? Number(population) : 0,
      healthcareIndex: Number.isFinite(Number(healthcareIndex)) ? Number(healthcareIndex) : 0
    });

    res.json({
      success: true,
      message: 'Country created successfully',
      data: country
    });
  } catch (error) {
    console.error('Create country error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating country',
      error: error.message
    });
  }
};

// Update country (admin)
const updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, region, flag, population, healthcareIndex } = req.body;

    const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];

    if (!name || !region) {
      return res.status(400).json({
        success: false,
        message: 'Country name and region are required'
      });
    }

    const regionLower = String(region).trim().toLowerCase();
    if (!validRegions.includes(regionLower)) {
      return res.status(400).json({
        success: false,
        message: `Invalid region. Must be one of: ${validRegions.join(', ')}`
      });
    }

    const country = await Country.findByIdAndUpdate(
      id,
      {
        name: String(name).trim(),
        code: code ? String(code).trim().toUpperCase() : '',
        region: regionLower,
        flag: flag ? String(flag).trim() : '',
        population: Number.isFinite(Number(population)) ? Number(population) : 0,
        healthcareIndex: Number.isFinite(Number(healthcareIndex)) ? Number(healthcareIndex) : 0
      },
      { new: true, runValidators: true }
    );

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    res.json({
      success: true,
      message: 'Country updated successfully',
      data: country
    });
  } catch (error) {
    console.error('Update country error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating country',
      error: error.message
    });
  }
};

// Delete country (admin)
const deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;

    // Note: We don't check for provinces since provinces now use region, not country
    const country = await Country.findByIdAndDelete(id);

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    res.json({
      success: true,
      message: 'Country deleted successfully',
      data: country
    });
  } catch (error) {
    console.error('Delete country error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting country',
      error: error.message
    });
  }
};

// Bulk create countries (admin) - optional helper endpoint
const bulkCreateCountries = async (req, res) => {
  try {
    const { countries } = req.body;

    if (!Array.isArray(countries) || countries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide an array of countries to create'
      });
    }

    const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];

    console.log('Received countries:', countries.length);
    console.log('Sample country:', countries[0]);

    const normalized = countries
      .filter(Boolean)
      .map(c => ({
        name: c?.name ? String(c.name).trim() : '',
        code: c?.code ? String(c.code).trim().toUpperCase() : '',
        region: c?.region ? String(c.region).trim().toLowerCase() : '',
        flag: c?.flag ? String(c.flag).trim() : '',
        population: Number.isFinite(Number(c?.population)) ? Number(c.population) : 0,
        healthcareIndex: Number.isFinite(Number(c?.healthcareIndex)) ? Number(c.healthcareIndex) : 0
      }))
      .filter(c => {
        const isValid = c.name && c.region && validRegions.includes(c.region);
        if (!isValid) {
          console.log('Filtered out country:', c, 'Reason:', !c.name ? 'no name' : !c.region ? 'no region' : !validRegions.includes(c.region) ? 'invalid region' : 'unknown');
        }
        return isValid;
      });

    console.log('Normalized countries:', normalized.length);

    if (normalized.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid countries found. Each country requires name and a valid region (europe, usa, africa, canada, australia). Received: ' + countries.length + ' countries.'
      });
    }

    // Deduplicate within payload
    const dedupMap = new Map();
    for (const c of normalized) {
      const key = `${c.region}::${c.name.toLowerCase()}`;
      if (!dedupMap.has(key)) dedupMap.set(key, c);
    }
    const deduped = Array.from(dedupMap.values());

    // Use upsert bulkWrite to avoid duplicate key errors
    // IMPORTANT: Cannot put same field in both $setOnInsert and $set
    // Solution: $setOnInsert only for required fields (name, region)
    // $set for all other fields (works for both insert and update)
    const ops = deduped.map(c => {
      // Ensure all required fields are present and valid
      if (!c.name || !c.region) {
        console.error('Invalid country data:', c);
        return null;
      }

      return {
        updateOne: {
          filter: { name: c.name, region: c.region },
          update: {
            // Only name and region in $setOnInsert (required fields for new documents)
            $setOnInsert: {
              name: c.name,
              region: c.region
            },
            // All other fields in $set (applies to both new and existing documents)
            $set: {
              code: c.code || '',
              flag: c.flag || '',
              population: c.population || 0,
              healthcareIndex: c.healthcareIndex || 0
            }
          },
          upsert: true
        }
      };
    }).filter(op => op !== null); // Remove any null operations

    console.log('Bulk countries operations:', ops.length);
    if (ops.length > 0) {
      try {
        console.log('Sample operation:', JSON.stringify(ops[0], null, 2));
      } catch (jsonError) {
        console.log('Sample operation (first 3 keys):', Object.keys(ops[0] || {}).slice(0, 3));
      }
    }

    if (ops.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid operations to perform after deduplication.'
      });
    }

    let result;
    try {
      result = await Country.bulkWrite(ops, { ordered: false });
    } catch (bulkError) {
      console.error('BulkWrite error:', bulkError);
      console.error('BulkWrite error details:', {
        name: bulkError.name,
        message: bulkError.message,
        code: bulkError.code,
        writeErrors: bulkError.writeErrors
      });
      return res.status(500).json({
        success: false,
        message: 'Database error during bulk write',
        error: bulkError.message,
        details: process.env.NODE_ENV === 'development' ? bulkError.toString() : undefined
      });
    }

    console.log('Bulk write result:', {
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      matched: result.matchedCount,
      modified: result.modifiedCount
    });

    res.json({
      success: true,
      message: `Bulk countries completed. Inserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}, Matched: ${result.matchedCount}`,
      data: {
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        matched: result.matchedCount,
        total: result.upsertedCount + result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk create countries error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error bulk creating countries',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Bulk create provinces (admin)
// Body: { provinces: [{ name, code?, region, flagImage? }, ...] }
const bulkCreateProvinces = async (req, res) => {
  try {
    const { provinces } = req.body;

    if (!Array.isArray(provinces) || provinces.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide an array of provinces to create'
      });
    }

    const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];

    const normalized = provinces
      .filter(Boolean)
      .map(p => ({
        name: p?.name ? String(p.name).trim() : '',
        code: p?.code ? String(p.code).trim() : '',
        region: p?.region ? String(p.region).trim().toLowerCase() : '',
        flagImage: p?.flagImage ? String(p.flagImage).trim() : ''
      }))
      .filter(p => p.name && p.region && validRegions.includes(p.region));

    if (normalized.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid provinces found. Each province requires name and a valid region (europe, usa, africa, canada, australia).'
      });
    }

    // Deduplicate within payload (case-insensitive by name + region)
    const dedupMap = new Map();
    for (const p of normalized) {
      const key = `${p.region}::${p.name.toLowerCase()}`;
      if (!dedupMap.has(key)) dedupMap.set(key, p);
    }
    const deduped = Array.from(dedupMap.values());

    // Use upsert bulkWrite to avoid duplicate key errors if province already exists
    // If record exists, update optional fields only when provided
    const ops = deduped.map(p => {
      const set = {};
      if (p.code) set.code = p.code;
      if (p.flagImage) set.flagImage = p.flagImage;

      return {
        updateOne: {
          filter: { name: p.name, region: p.region },
          update: {
            $setOnInsert: { name: p.name, region: p.region, code: p.code || '', flagImage: p.flagImage || '' },
            ...(Object.keys(set).length ? { $set: set } : {})
          },
          upsert: true
        }
      };
    });

    const result = await Province.bulkWrite(ops, { ordered: false });

    res.json({
      success: true,
      message: `Bulk provinces completed. Inserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}, Matched: ${result.matchedCount}`,
      data: {
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        matched: result.matchedCount
      }
    });
  } catch (error) {
    console.error('Bulk create provinces error:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk creating provinces',
      error: error.message
    });
  }
};

// Bulk create cities (admin)
// Body: { cities: [{ name, province, region, latitude?, longitude?, flagImage? }, ...] }
const bulkCreateCities = async (req, res) => {
  try {
    const { cities } = req.body;

    if (!Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide an array of cities to create'
      });
    }

    const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];

    const normalized = cities
      .filter(Boolean)
      .map(c => ({
        name: c?.name ? String(c.name).trim() : '',
        province: c?.province,
        region: c?.region ? String(c.region).trim().toLowerCase() : '',
        latitude: Number.isFinite(Number(c?.latitude)) ? Number(c.latitude) : 0,
        longitude: Number.isFinite(Number(c?.longitude)) ? Number(c.longitude) : 0,
        flagImage: c?.flagImage ? String(c.flagImage).trim() : ''
      }))
      .filter(c => c.name && c.province && c.region && validRegions.includes(c.region));

    if (normalized.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid cities found. Each city requires name, province and a valid region (europe, usa, africa, canada, australia).'
      });
    }

    // Deduplicate within payload (case-insensitive by name + province + region)
    const dedupMap = new Map();
    for (const c of normalized) {
      const key = `${c.region}::${String(c.province)}::${c.name.toLowerCase()}`;
      if (!dedupMap.has(key)) dedupMap.set(key, c);
    }
    const deduped = Array.from(dedupMap.values());

    // Upsert bulkWrite to avoid duplicate key errors if city already exists
    const ops = deduped.map(c => {
      const set = {};
      if (c.flagImage) set.flagImage = c.flagImage;
      // Only update lat/lng if non-zero provided in payload
      if (Number.isFinite(c.latitude) && c.latitude !== 0) set.latitude = c.latitude;
      if (Number.isFinite(c.longitude) && c.longitude !== 0) set.longitude = c.longitude;

      return {
        updateOne: {
          filter: { name: c.name, province: c.province, region: c.region },
          update: {
            $setOnInsert: {
              name: c.name,
              province: c.province,
              region: c.region,
              latitude: c.latitude || 0,
              longitude: c.longitude || 0,
              flagImage: c.flagImage || ''
            },
            ...(Object.keys(set).length ? { $set: set } : {})
          },
          upsert: true
        }
      };
    });

    const result = await City.bulkWrite(ops, { ordered: false });

    res.json({
      success: true,
      message: `Bulk cities completed. Inserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}, Matched: ${result.matchedCount}`,
      data: {
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        matched: result.matchedCount
      }
    });
  } catch (error) {
    console.error('Bulk create cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk creating cities',
      error: error.message
    });
  }
};

// Create province (admin)
const createProvince = async (req, res) => {
  try {
    const { name, code, region, flagImage } = req.body;

    const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];

    if (!name || !region) {
      return res.status(400).json({
        success: false,
        message: 'Province name and region are required'
      });
    }

    const regionLower = String(region).trim().toLowerCase();
    if (!validRegions.includes(regionLower)) {
      return res.status(400).json({
        success: false,
        message: `Invalid region. Must be one of: ${validRegions.join(', ')}`
      });
    }

    const province = await Province.create({
      name: String(name).trim(),
      code: code ? String(code).trim() : '',
      region: regionLower,
      flagImage: flagImage ? String(flagImage).trim() : ''
    });

    res.json({
      success: true,
      message: 'Province created successfully',
      data: province
    });
  } catch (error) {
    console.error('Create province error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating province',
      error: error.message
    });
  }
};

// Update province (admin)
const updateProvince = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, region, flagImage } = req.body;

    const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];

    if (!name || !region) {
      return res.status(400).json({
        success: false,
        message: 'Province name and region are required'
      });
    }

    const regionLower = String(region).trim().toLowerCase();
    if (!validRegions.includes(regionLower)) {
      return res.status(400).json({
        success: false,
        message: `Invalid region. Must be one of: ${validRegions.join(', ')}`
      });
    }

    const province = await Province.findByIdAndUpdate(
      id,
      {
        name: String(name).trim(),
        code: code ? String(code).trim() : '',
        region: regionLower,
        flagImage: flagImage ? String(flagImage).trim() : ''
      },
      { new: true, runValidators: true }
    );

    if (!province) {
      return res.status(404).json({
        success: false,
        message: 'Province not found'
      });
    }

    res.json({
      success: true,
      message: 'Province updated successfully',
      data: province
    });
  } catch (error) {
    console.error('Update province error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating province',
      error: error.message
    });
  }
};

// Delete province (admin)
const deleteProvince = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if province has cities
    const citiesCount = await City.countDocuments({ province: id });
    if (citiesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete province. It has ${citiesCount} cities associated with it. Please delete or reassign cities first.`
      });
    }

    const province = await Province.findByIdAndDelete(id);

    if (!province) {
      return res.status(404).json({
        success: false,
        message: 'Province not found'
      });
    }

    res.json({
      success: true,
      message: 'Province deleted successfully',
      data: province
    });
  } catch (error) {
    console.error('Delete province error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting province',
      error: error.message
    });
  }
};

// Create city (admin)
const createCity = async (req, res) => {
  try {
    const { name, province, region, latitude, longitude, flagImage } = req.body;

    const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];

    if (!name || !province || !region) {
      return res.status(400).json({
        success: false,
        message: 'City name, province and region are required'
      });
    }

    const regionLower = String(region).trim().toLowerCase();
    if (!validRegions.includes(regionLower)) {
      return res.status(400).json({
        success: false,
        message: `Invalid region. Must be one of: ${validRegions.join(', ')}`
      });
    }

    const city = await City.create({
      name: String(name).trim(),
      province,
      region: regionLower,
      flagImage: flagImage ? String(flagImage).trim() : '',
      latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : 0,
      longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : 0
    });

    const populated = await City.findById(city._id)
      .populate('province', 'name code region');

    res.json({
      success: true,
      message: 'City created successfully',
      data: populated
    });
  } catch (error) {
    console.error('Create city error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating city',
      error: error.message
    });
  }
};

// Update city (admin)
const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, province, region, latitude, longitude, flagImage } = req.body;

    const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];

    if (!name || !province || !region) {
      return res.status(400).json({
        success: false,
        message: 'City name, province and region are required'
      });
    }

    const regionLower = String(region).trim().toLowerCase();
    if (!validRegions.includes(regionLower)) {
      return res.status(400).json({
        success: false,
        message: `Invalid region. Must be one of: ${validRegions.join(', ')}`
      });
    }

    const city = await City.findByIdAndUpdate(
      id,
      {
        name: String(name).trim(),
        province,
        region: regionLower,
        flagImage: flagImage ? String(flagImage).trim() : '',
        latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : 0,
        longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : 0
      },
      { new: true, runValidators: true }
    );

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    const populated = await City.findById(city._id)
      .populate('province', 'name code region');

    res.json({
      success: true,
      message: 'City updated successfully',
      data: populated
    });
  } catch (error) {
    console.error('Update city error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating city',
      error: error.message
    });
  }
};

// Delete city (admin)
const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await City.findByIdAndDelete(id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    res.json({
      success: true,
      message: 'City deleted successfully'
    });
  } catch (error) {
    console.error('Delete city error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting city',
      error: error.message
    });
  }
};

// Get all region images
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

// Upload/Update region image
const uploadRegionImage = async (req, res) => {
  try {
    const { region, image, description } = req.body;

    const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];

    if (!region || !image) {
      return res.status(400).json({
        success: false,
        message: 'Region and image URL are required'
      });
    }

    const regionLower = String(region).trim().toLowerCase();
    if (!validRegions.includes(regionLower)) {
      return res.status(400).json({
        success: false,
        message: `Invalid region. Must be one of: ${validRegions.join(', ')}`
      });
    }

    const regionImage = await RegionImage.findOneAndUpdate(
      { region: regionLower },
      {
        region: regionLower,
        image: String(image).trim(),
        description: description ? String(description).trim() : ''
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Region image uploaded successfully',
      data: regionImage
    });
  } catch (error) {
    console.error('Upload region image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading region image',
      error: error.message
    });
  }
};

// Delete region image
const deleteRegionImage = async (req, res) => {
  try {
    const { region } = req.params;

    const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];
    const regionLower = String(region).trim().toLowerCase();
    
    if (!validRegions.includes(regionLower)) {
      return res.status(400).json({
        success: false,
        message: `Invalid region. Must be one of: ${validRegions.join(', ')}`
      });
    }

    const regionImage = await RegionImage.findOneAndDelete({ region: regionLower });

    if (!regionImage) {
      return res.status(404).json({
        success: false,
        message: 'Region image not found'
      });
    }

    res.json({
      success: true,
      message: 'Region image deleted successfully'
    });
  } catch (error) {
    console.error('Delete region image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting region image',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getProfessionals,
  verifyProfessional,
  getCompanies,
  getJobs,
  getLocations,
  createContinent,
  updateContinent,
  deleteContinent,
  createCountry,
  updateCountry,
  deleteCountry,
  bulkCreateCountries,
  bulkCreateProvinces,
  bulkCreateCities,
  createProvince,
  updateProvince,
  deleteProvince,
  createCity,
  updateCity,
  deleteCity,
  getRegionImages,
  uploadRegionImage,
  deleteRegionImage
};

