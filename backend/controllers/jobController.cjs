const mongoose = require('mongoose');
const Job = require('../models/Job.cjs');
const Company = require('../models/Company.cjs');
const JobApplication = require('../models/JobApplication.cjs');
const Professional = require('../models/Professional.cjs');
const Country = require('../models/Country.cjs');
const { uploadImage, uploadDocument } = require('../middleware/upload.cjs');

// Get all jobs with filters
const getJobs = async (req, res) => {
  try {
    const {
      status,
      profession,
      category,
      continent,
      country,
      province,
      city,
      jobType,
      company,
      limit,
      search
    } = req.query;

    const query = {};
    const andConditions = [];

    // Helpers
    const toIdOrString = (value) => {
      if (!value) return null;
      return mongoose.Types.ObjectId.isValid(value)
        ? new mongoose.Types.ObjectId(value)
        : value;
    };
    const idToString = (v) => {
      if (!v) return '';
      if (typeof v === 'string') return v;
      if (v._id) return String(v._id);
      return String(v);
    };

    if (status) query.status = status;
    
    // Handle category filter - check both direct category field and profession.category
    // Use case-insensitive regex match to handle variations in category names
    if (category) {
      const trimmedCategory = category.trim();
      // Escape special regex characters and create case-insensitive regex
      const categoryRegex = new RegExp(`^${trimmedCategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      andConditions.push({
        $or: [
          { category: categoryRegex },
          { 'profession.category': categoryRegex }
        ]
      });
    }
    
    if (profession) {
      if (mongoose.Types.ObjectId.isValid(profession)) {
        query.profession = new mongoose.Types.ObjectId(profession);
      } else {
        query.profession = profession;
      }
    }

    // Location filters
    // continent can now be either:
    // - a Continent ObjectId (backward compatibility)
    // - a region string: 'europe', 'usa', 'africa', 'canada', 'australia'
    const validRegions = ['europe', 'usa', 'africa', 'canada', 'australia'];
    let regionFilter = null;
    let continentId = null;

    if (continent && typeof continent === 'string') {
      const trimmed = continent.trim().toLowerCase();
      if (validRegions.includes(trimmed)) {
        regionFilter = trimmed;
      } else {
        continentId = toIdOrString(continent);
      }
    } else {
      continentId = toIdOrString(continent);
    }

    // Country / province / city are always treated as IDs
    const countryId = toIdOrString(country);
    const provinceId = toIdOrString(province);
    const cityId = toIdOrString(city);

    // ContinentId filter only applies when we are using Continent ObjectIds
    if (continentId) {
      andConditions.push({
        $or: [
          { 'location.continent': continentId },
          { 'location.continents': continentId }
        ]
      });
    }
    if (countryId) {
      andConditions.push({
        $or: [
          { 'location.country': countryId },
          { 'location.countries': countryId }
        ]
      });
    }
    if (provinceId) {
      andConditions.push({
        $or: [
          { 'location.province': provinceId },
          { 'location.provinces': provinceId }
        ]
      });
    }
    if (city) {
      // Support both single city and cities array
      // MongoDB automatically matches array elements, but we'll be explicit
      andConditions.push({
        $or: [
          { 'location.city': cityId },
          { 'location.cities': cityId } // MongoDB matches if element exists in array
        ]
      });
    }
    if (jobType) query.jobType = jobType;
    if (company) query.company = company;

    if (search) {
      andConditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Combine all conditions
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    let jobsQuery = Job.find(query)
      .populate({
        path: 'company',
        select: 'companyName logo email',
        populate: [
          { path: 'location.continent', select: 'name' },
          { path: 'location.country', select: 'name code' },
          { path: 'location.province', select: 'name' },
          { path: 'location.city', select: 'name' }
        ]
      })
      .populate('profession', 'name category')
      .populate('location.continent', 'name')
      .populate('location.continents', 'name')
      .populate('location.country', 'name code')
      .populate('location.countries', 'name code')
      .populate('location.province', 'name')
      .populate('location.provinces', 'name')
      .populate('location.city', 'name')
      .populate({
        path: 'location.cities',
        select: 'name province',
        populate: { path: 'province', select: 'name' }
      })
      .sort({ createdAt: -1 });

    if (limit) {
      jobsQuery = jobsQuery.limit(parseInt(limit));
    }

    let jobs = await jobsQuery;

    // If continent was provided as a REGION string, convert it to a set of countries
    // and enforce region-based country matching.
    let regionCountryIds = null;
    if (regionFilter) {
      const regionCountries = await Country.find({ region: regionFilter }).select('_id');
      regionCountryIds = new Set(regionCountries.map(c => String(c._id)));
    }

    // Fallback: Some jobs may rely on company.location rather than job.location.
    // After populate, enforce location filters against company.location too.
    if (continentId || countryId || provinceId || cityId || regionCountryIds) {
      jobs = jobs.filter(job => {
        const jobLoc = job.location || {};
        const compLoc = job.company?.location || {};

        const jobContinents = Array.isArray(jobLoc.continents) ? jobLoc.continents : [];
        const jobCountries = Array.isArray(jobLoc.countries) ? jobLoc.countries : [];
        const jobProvinces = Array.isArray(jobLoc.provinces) ? jobLoc.provinces : [];
        const jobCities = Array.isArray(jobLoc.cities) ? jobLoc.cities : [];

        const matchesContinent = !continentId || (
          idToString(jobLoc.continent) === idToString(continentId) ||
          jobContinents.some(x => idToString(x) === idToString(continentId)) ||
          idToString(compLoc.continent) === idToString(continentId)
        );

        const matchesCountryId = !countryId || (
          idToString(jobLoc.country) === idToString(countryId) ||
          jobCountries.some(x => idToString(x) === idToString(countryId)) ||
          idToString(compLoc.country) === idToString(countryId)
        );

        // Region-based country match: job must have at least one country inside the region
        let matchesRegionCountry = true;
        if (regionCountryIds) {
          const jobCountryIds = [];
          if (jobLoc.country) jobCountryIds.push(idToString(jobLoc.country));
          jobCountryIds.push(...jobCountries.map(idToString));
          if (compLoc.country) jobCountryIds.push(idToString(compLoc.country));

          matchesRegionCountry = jobCountryIds.some(cid => regionCountryIds.has(cid));
        }

        const matchesProvince = !provinceId || (
          idToString(jobLoc.province) === idToString(provinceId) ||
          jobProvinces.some(x => idToString(x) === idToString(provinceId)) ||
          idToString(compLoc.province) === idToString(provinceId)
        );

        const matchesCity = !cityId || (
          idToString(jobLoc.city) === idToString(cityId) ||
          jobCities.some(x => idToString(x) === idToString(cityId)) ||
          idToString(compLoc.city) === idToString(cityId)
        );

        return matchesContinent && matchesCountryId && matchesProvince && matchesCity && matchesRegionCountry;
      });
    }

    // Fetch application counts for each job
    const jobsWithApplications = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await JobApplication.countDocuments({ job: job._id });
        const jobObj = job.toObject();
        jobObj.applicationsCount = applicationCount;
        jobObj.applications = []; // Empty array for backward compatibility
        return jobObj;
      })
    );

    res.json({
      success: true,
      data: jobsWithApplications
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

// Get job by ID
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate({
        path: 'company',
        select: 'companyName logo email description',
        populate: [
          { path: 'location.continent', select: 'name' },
          { path: 'location.country', select: 'name code' },
          { path: 'location.province', select: 'name' },
          { path: 'location.city', select: 'name' }
        ]
      })
      .populate('location.continents', 'name')
      .populate('location.countries', 'name code')
      .populate('location.provinces', 'name')
      .populate({
        path: 'location.cities',
        select: 'name province',
        populate: { path: 'province', select: 'name' }
      })
      .populate('profession', 'name category')
      .populate('location.continent', 'name')
      .populate('location.country', 'name code')
      .populate('location.province', 'name')
      .populate('location.city', 'name');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment views
    job.totalViews += 1;
    await job.save();

    // Fetch applications for this job
    const applications = await JobApplication.find({ job: job._id })
      .populate({
        path: 'professional',
        select: 'name email phone profession location avatar cv',
        populate: [
          { path: 'profession', select: 'name' },
          { path: 'location.city', select: 'name' },
          { path: 'location.province', select: 'name' },
          { path: 'location.country', select: 'name' },
          { path: 'location.continent', select: 'name' },
          { path: 'user', select: 'name email' }
        ]
      })
      .populate({
        path: 'trainee',
        select: 'name email phone profession location avatar cv',
        populate: [
          { path: 'profession', select: 'name' },
          { path: 'location.city', select: 'name' },
          { path: 'user', select: 'name email' }
        ]
      })
      .sort({ createdAt: -1 });

    // Convert job to object and add applications
    const jobObj = job.toObject();
    jobObj.applications = applications;
    jobObj.applicationsCount = applications.length;

    res.json({
      success: true,
      data: jobObj
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message
    });
  }
};

// Create job
const createJob = async (req, res) => {
  try {
    // Find company for this user
    const company = await Company.findOne({ user: req.user.id });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found. Please create a company profile first.'
      });
    }

    const mongoose = require('mongoose');

    // Prepare job data
    const jobData = {
      title: req.body.title,
      profession: req.body.profession || null, // Profession is now optional
      category: req.body.category || null, // Add category field
      subcategory: req.body.subcategory || null, // Add subcategory field
      jobType: req.body.jobType || 'Full-time',
      description: req.body.description,
      company: company._id,
      status: req.body.status || 'draft'
    };

    // Handle requirements if provided (support both JSON and FormData JSON string)
    if (req.body.requirements) {
      let requirementsData = req.body.requirements;
      if (typeof requirementsData === 'string') {
        try {
          requirementsData = JSON.parse(requirementsData);
        } catch (e) {
          requirementsData = {};
        }
      }
      jobData.requirements = {
        minExperience: requirementsData.minExperience || 0,
        description: requirementsData.description || '',
        skills: requirementsData.skills || [],
        qualifications: requirementsData.qualifications || []
      };
    }

    // Handle salary if provided (support both JSON and FormData JSON string)
    if (req.body.salary) {
      let salaryData = req.body.salary;
      if (typeof salaryData === 'string') {
        try {
          salaryData = JSON.parse(salaryData);
        } catch (e) {
          salaryData = {};
        }
      }
      jobData.salary = {
        min: salaryData.min || 0,
        max: salaryData.max || 0,
        currency: salaryData.currency || 'USD',
        period: salaryData.period || 'monthly'
      };
    }

    // Handle location if provided - convert string IDs to ObjectIds
    // Support both JSON (req.body.location) and FormData (req.body['location[continent]'])
    let locationData = req.body.location;
    
    // Debug: Log what we're receiving
    console.log('=== CREATE JOB - Location Data Debug ===');
    console.log('Full req.body keys:', Object.keys(req.body));
    console.log('req.body.location:', req.body.location);
    console.log('req.body[location[continents]]:', req.body['location[continents]'], 'Type:', typeof req.body['location[continents]']);
    console.log('req.body[location[countries]]:', req.body['location[countries]'], 'Type:', typeof req.body['location[countries]']);
    console.log('req.body[location[provinces]]:', req.body['location[provinces]'], 'Type:', typeof req.body['location[provinces]']);
    console.log('req.body[location[cities]]:', req.body['location[cities]'], 'Type:', typeof req.body['location[cities]']);
    
    // Also check if it's an array (multer might parse it differently)
    if (Array.isArray(req.body['location[cities]'])) {
      console.log('⚠️ location[cities] is already an array!', req.body['location[cities]']);
    }
    
    // If location is not an object, try to parse FormData format
    if (!locationData || typeof locationData !== 'object') {
      locationData = {};
      if (req.body['location[continent]']) locationData.continent = req.body['location[continent]'];
      if (req.body['location[country]']) locationData.country = req.body['location[country]'];
      if (req.body['location[province]']) locationData.province = req.body['location[province]'];
      if (req.body['location[city]']) locationData.city = req.body['location[city]'];
      if (req.body['location[address]']) locationData.address = req.body['location[address]'];
      
      // Helper function to get array from value (handles string JSON, array, or single value)
      const getArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            // If not JSON, treat as single value
            return [value];
          }
        }
        // Single value - wrap in array
        return [value];
      };
      
      // Parse arrays using helper function
      locationData.continents = getArray(req.body['location[continents]']);
      locationData.countries = getArray(req.body['location[countries]']);
      locationData.provinces = getArray(req.body['location[provinces]']);
      locationData.cities = getArray(req.body['location[cities]']);
      
      console.log('Parsed continents:', locationData.continents, 'Length:', locationData.continents?.length, 'Is Array?', Array.isArray(locationData.continents));
      console.log('Parsed countries:', locationData.countries, 'Length:', locationData.countries?.length, 'Is Array?', Array.isArray(locationData.countries));
      console.log('Parsed provinces:', locationData.provinces, 'Length:', locationData.provinces?.length, 'Is Array?', Array.isArray(locationData.provinces));
      console.log('Parsed cities:', locationData.cities, 'Length:', locationData.cities?.length, 'Is Array?', Array.isArray(locationData.cities));
    }
    
    console.log('Final locationData:', JSON.stringify(locationData, null, 2));
    
    if (locationData && (locationData.continent || locationData.country || locationData.province || locationData.city || locationData.continents || locationData.countries || locationData.provinces || locationData.cities)) {
      jobData.location = {};
      
      // IMPORTANT: Handle arrays FIRST, then set single values from arrays for backward compatibility
      // Initialize arrays as empty arrays first
      jobData.location.continents = [];
      jobData.location.countries = [];
      jobData.location.provinces = [];
      jobData.location.cities = [];
      
      // Handle multiple continents FIRST - use first one for backward compatibility
      if (locationData.continents && Array.isArray(locationData.continents) && locationData.continents.length > 0) {
        console.log('Processing continents array, length:', locationData.continents.length);
        const validContinentIds = locationData.continents
          .filter(id => {
            const isValid = mongoose.Types.ObjectId.isValid(id);
            if (!isValid) {
              console.warn('Invalid continent ID:', id);
            }
            return isValid;
          })
          .map(id => new mongoose.Types.ObjectId(id));
        console.log('Valid continent IDs:', validContinentIds.length, validContinentIds);
        if (validContinentIds.length > 0) {
          // CRITICAL: Set the entire array at once
          jobData.location.continents = [...validContinentIds]; // Create a new array copy
          jobData.location.continent = validContinentIds[0]; // Use first continent for backward compatibility
          console.log('✅ Saving continents array with', validContinentIds.length, 'items:', validContinentIds.map(id => id.toString()));
          console.log('jobData.location.continents after assignment:', jobData.location.continents, 'Length:', jobData.location.continents.length);
        } else {
          console.warn('⚠️ No valid continent IDs found!');
        }
      } else if (locationData.continent) {
        // Fallback to single continent - convert to array
        console.log('Using single continent fallback:', locationData.continent);
        if (mongoose.Types.ObjectId.isValid(locationData.continent)) {
          const continentId = new mongoose.Types.ObjectId(locationData.continent);
          jobData.location.continent = continentId;
          jobData.location.continents = [continentId]; // Also save as array
          console.log('✅ Saved single continent as array:', [continentId]);
        }
      } else {
        console.warn('⚠️ No continents data found!');
      }
      
      // Handle multiple countries - use first one for backward compatibility
      if (locationData.countries && Array.isArray(locationData.countries) && locationData.countries.length > 0) {
        console.log('Processing countries array, length:', locationData.countries.length);
        const validCountryIds = locationData.countries
          .filter(id => {
            const isValid = mongoose.Types.ObjectId.isValid(id);
            if (!isValid) {
              console.warn('Invalid country ID:', id);
            }
            return isValid;
          })
          .map(id => new mongoose.Types.ObjectId(id));
        console.log('Valid country IDs:', validCountryIds.length, validCountryIds);
        if (validCountryIds.length > 0) {
          // CRITICAL: Set the entire array at once
          jobData.location.countries = [...validCountryIds]; // Create a new array copy
          jobData.location.country = validCountryIds[0]; // Use first country for backward compatibility
          console.log('✅ Saving countries array with', validCountryIds.length, 'items:', validCountryIds.map(id => id.toString()));
          console.log('jobData.location.countries after assignment:', jobData.location.countries, 'Length:', jobData.location.countries.length);
        } else {
          console.warn('⚠️ No valid country IDs found!');
        }
      } else if (locationData.country) {
        // Fallback to single country - convert to array
        console.log('Using single country fallback:', locationData.country);
        if (mongoose.Types.ObjectId.isValid(locationData.country)) {
          const countryId = new mongoose.Types.ObjectId(locationData.country);
          jobData.location.country = countryId;
          jobData.location.countries = [countryId]; // Also save as array
          console.log('✅ Saved single country as array:', [countryId]);
        }
      } else {
        console.warn('⚠️ No countries data found!');
      }
      
      // Handle multiple provinces - use first one for backward compatibility
      if (locationData.provinces && Array.isArray(locationData.provinces) && locationData.provinces.length > 0) {
        console.log('Processing provinces array, length:', locationData.provinces.length);
        const validProvinceIds = locationData.provinces
          .filter(id => {
            const isValid = mongoose.Types.ObjectId.isValid(id);
            if (!isValid) {
              console.warn('Invalid province ID:', id);
            }
            return isValid;
          })
          .map(id => new mongoose.Types.ObjectId(id));
        console.log('Valid province IDs:', validProvinceIds.length, validProvinceIds);
        if (validProvinceIds.length > 0) {
          // CRITICAL: Set the entire array at once
          jobData.location.provinces = [...validProvinceIds]; // Create a new array copy
          jobData.location.province = validProvinceIds[0]; // Use first province for backward compatibility
          console.log('✅ Saving provinces array with', validProvinceIds.length, 'items:', validProvinceIds.map(id => id.toString()));
          console.log('jobData.location.provinces after assignment:', jobData.location.provinces, 'Length:', jobData.location.provinces.length);
        } else {
          console.warn('⚠️ No valid province IDs found!');
        }
      } else if (locationData.province) {
        // Fallback to single province - convert to array
        console.log('Using single province fallback:', locationData.province);
        if (mongoose.Types.ObjectId.isValid(locationData.province)) {
          const provinceId = new mongoose.Types.ObjectId(locationData.province);
          jobData.location.province = provinceId;
          jobData.location.provinces = [provinceId]; // Also save as array
          console.log('✅ Saved single province as array:', [provinceId]);
        }
      } else {
        console.warn('⚠️ No provinces data found!');
      }
      
      // Handle multiple cities - use first one for backward compatibility
      if (locationData.cities && Array.isArray(locationData.cities) && locationData.cities.length > 0) {
        console.log('Processing cities array, length:', locationData.cities.length);
        const validCityIds = locationData.cities
          .filter(id => {
            const isValid = mongoose.Types.ObjectId.isValid(id);
            if (!isValid) {
              console.warn('Invalid city ID:', id);
            }
            return isValid;
          })
          .map(id => new mongoose.Types.ObjectId(id));
        console.log('Valid city IDs:', validCityIds.length, validCityIds);
        if (validCityIds.length > 0) {
          // CRITICAL: Set the entire array at once
          jobData.location.cities = [...validCityIds]; // Create a new array copy
          jobData.location.city = validCityIds[0]; // Use first city for backward compatibility
          console.log('✅ Saving cities array with', validCityIds.length, 'items:', validCityIds.map(id => id.toString()));
          console.log('jobData.location.cities after assignment:', jobData.location.cities, 'Length:', jobData.location.cities.length);
        } else {
          console.warn('⚠️ No valid city IDs found!');
        }
      } else if (locationData.city) {
        // Fallback to single city - convert to array
        console.log('Using single city fallback:', locationData.city);
        if (mongoose.Types.ObjectId.isValid(locationData.city)) {
          const cityId = new mongoose.Types.ObjectId(locationData.city);
          jobData.location.city = cityId;
          jobData.location.cities = [cityId]; // Also save as array
          console.log('✅ Saved single city as array:', [cityId]);
        }
      } else {
        console.warn('⚠️ No cities data found!');
      }
      
      if (locationData.address) {
        jobData.location.address = locationData.address;
      }
    }

    // Handle application deadline if provided
    if (req.body.applicationDeadline) {
      jobData.applicationDeadline = new Date(req.body.applicationDeadline);
    }

    // Handle isUrgent if provided
    if (req.body.isUrgent !== undefined) {
      jobData.isUrgent = Boolean(req.body.isUrgent);
    }

    // Handle image upload if provided
    if (req.file && req.file.fieldname === 'image') {
      const imageResult = await uploadImage(req.file, 'hpw-pool/jobs/images');
      jobData.image = imageResult.url;
    } else if (req.body.image) {
      jobData.image = req.body.image;
    }

    // Validate required fields
    if (!jobData.title) {
      return res.status(400).json({
        success: false,
        message: 'Job title is required'
      });
    }

    if (!jobData.description) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required'
      });
    }

    // Profession is now optional - only validate if provided
    if (jobData.profession) {
      // Validate profession ObjectId if provided
      if (!mongoose.Types.ObjectId.isValid(jobData.profession)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid profession ID'
        });
      }
      jobData.profession = new mongoose.Types.ObjectId(jobData.profession);
    }
    
    // Category is optional - stored as string (no ObjectId conversion needed)
    // Category value is already a string from the form

    console.log('Final jobData.location BEFORE SAVE:', JSON.stringify(jobData.location, null, 2));
    console.log('jobData.location.continents:', jobData.location?.continents, 'Type:', Array.isArray(jobData.location?.continents), 'Length:', jobData.location?.continents?.length);
    console.log('jobData.location.countries:', jobData.location?.countries, 'Type:', Array.isArray(jobData.location?.countries), 'Length:', jobData.location?.countries?.length);
    console.log('jobData.location.provinces:', jobData.location?.provinces, 'Type:', Array.isArray(jobData.location?.provinces), 'Length:', jobData.location?.provinces?.length);
    console.log('jobData.location.cities:', jobData.location?.cities, 'Type:', Array.isArray(jobData.location?.cities), 'Length:', jobData.location?.cities?.length);
    
    // CRITICAL: Ensure arrays are explicitly set as arrays (not undefined or null)
    if (jobData.location) {
      // Only set empty arrays if they don't exist, don't overwrite existing arrays
      if (jobData.location.continents === undefined || jobData.location.continents === null) {
        jobData.location.continents = [];
      }
      if (jobData.location.countries === undefined || jobData.location.countries === null) {
        jobData.location.countries = [];
      }
      if (jobData.location.provinces === undefined || jobData.location.provinces === null) {
        jobData.location.provinces = [];
      }
      if (jobData.location.cities === undefined || jobData.location.cities === null) {
        jobData.location.cities = [];
      }
      
      // Ensure they are actual arrays
      if (!Array.isArray(jobData.location.continents)) {
        console.warn('⚠️ continents is not an array, converting...');
        jobData.location.continents = Array.isArray(jobData.location.continents) ? jobData.location.continents : [];
      }
      if (!Array.isArray(jobData.location.countries)) {
        console.warn('⚠️ countries is not an array, converting...');
        jobData.location.countries = Array.isArray(jobData.location.countries) ? jobData.location.countries : [];
      }
      if (!Array.isArray(jobData.location.provinces)) {
        console.warn('⚠️ provinces is not an array, converting...');
        jobData.location.provinces = Array.isArray(jobData.location.provinces) ? jobData.location.provinces : [];
      }
      if (!Array.isArray(jobData.location.cities)) {
        console.warn('⚠️ cities is not an array, converting...');
        jobData.location.cities = Array.isArray(jobData.location.cities) ? jobData.location.cities : [];
      }
    }
    
    console.log('After array validation:', {
      continents: jobData.location?.continents?.length || 0,
      countries: jobData.location?.countries?.length || 0,
      provinces: jobData.location?.provinces?.length || 0,
      cities: jobData.location?.cities?.length || 0
    });

    const job = new Job(jobData);
    
    // Mark arrays as modified to ensure Mongoose saves them
    if (job.location) {
      if (job.location.continents && job.location.continents.length > 0) {
        job.markModified('location.continents');
      }
      if (job.location.countries && job.location.countries.length > 0) {
        job.markModified('location.countries');
      }
      if (job.location.provinces && job.location.provinces.length > 0) {
        job.markModified('location.provinces');
      }
      if (job.location.cities && job.location.cities.length > 0) {
        job.markModified('location.cities');
      }
    }
    
    console.log('Job object created, location before save:', {
      continents: job.location?.continents?.length || 0,
      countries: job.location?.countries?.length || 0,
      provinces: job.location?.provinces?.length || 0,
      cities: job.location?.cities?.length || 0
    });
    console.log('Job.location.continents actual array:', job.location?.continents);
    console.log('Job.location.countries actual array:', job.location?.countries);
    console.log('Job.location.provinces actual array:', job.location?.provinces);
    console.log('Job.location.cities actual array:', job.location?.cities);
    
    await job.save();
    
    // Fetch fresh from DB to verify what was actually saved
    const savedJob = await Job.findById(job._id).lean();
    console.log('=== AFTER SAVE - Fresh from DB ===');
    console.log('Saved continents array:', savedJob.location?.continents, 'Length:', savedJob.location?.continents?.length);
    console.log('Saved countries array:', savedJob.location?.countries, 'Length:', savedJob.location?.countries?.length);
    console.log('Saved provinces array:', savedJob.location?.provinces, 'Length:', savedJob.location?.provinces?.length);
    console.log('Saved cities array:', savedJob.location?.cities, 'Length:', savedJob.location?.cities?.length);
    
    if (savedJob.location?.cities?.length === 1 && locationData.cities?.length > 1) {
      console.error('❌ ERROR: Only 1 city saved but', locationData.cities.length, 'were sent!');
      console.error('Expected cities:', locationData.cities);
      console.error('Saved cities:', savedJob.location?.cities);
    }
    if (savedJob.location?.provinces?.length === 1 && locationData.provinces?.length > 1) {
      console.error('❌ ERROR: Only 1 province saved but', locationData.provinces.length, 'were sent!');
      console.error('Expected provinces:', locationData.provinces);
      console.error('Saved provinces:', savedJob.location?.provinces);
    }
    if (savedJob.location?.countries?.length === 1 && locationData.countries?.length > 1) {
      console.error('❌ ERROR: Only 1 country saved but', locationData.countries.length, 'were sent!');
      console.error('Expected countries:', locationData.countries);
      console.error('Saved countries:', savedJob.location?.countries);
    }
    if (savedJob.location?.continents?.length === 1 && locationData.continents?.length > 1) {
      console.error('❌ ERROR: Only 1 continent saved but', locationData.continents.length, 'were sent!');
      console.error('Expected continents:', locationData.continents);
      console.error('Saved continents:', savedJob.location?.continents);
    }

    // Populate the job before sending response
    const populatedJob = await Job.findById(job._id)
      .populate('company', 'companyName logo email')
      .populate('profession', 'name category')
      .populate('location.continent', 'name')
      .populate('location.country', 'name code')
      .populate('location.province', 'name')
      .populate('location.city', 'name');

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: populatedJob
    });
  } catch (error) {
    console.error('Create job error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating job',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update job
const updateJob = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    const job = await Job.findOne({
      _id: req.params.id,
      company: company._id
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or you do not have permission to update it'
      });
    }

    // Handle image upload if provided
    if (req.file && req.file.fieldname === 'image') {
      const imageResult = await uploadImage(req.file, 'hpw-pool/jobs/images');
      req.body.image = imageResult.url;
    }

    const mongoose = require('mongoose');
    
    // Prepare update data
    const updateData = {};
    
    // Handle basic fields
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.category !== undefined) updateData.category = req.body.category || null; // Handle category
    if (req.body.subcategory !== undefined) updateData.subcategory = req.body.subcategory || null; // Handle subcategory
    if (req.body.jobType) updateData.jobType = req.body.jobType;
    if (req.body.address) updateData.address = req.body.address;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.isUrgent !== undefined) updateData.isUrgent = Boolean(req.body.isUrgent);
    if (req.body.image) updateData.image = req.body.image;
    
    // Handle profession
    if (req.body.profession) {
      if (mongoose.Types.ObjectId.isValid(req.body.profession)) {
        updateData.profession = new mongoose.Types.ObjectId(req.body.profession);
      }
    }
    
    // Handle requirements if provided (support both JSON and FormData JSON string)
    if (req.body.requirements) {
      let requirementsData = req.body.requirements;
      if (typeof requirementsData === 'string') {
        try {
          requirementsData = JSON.parse(requirementsData);
        } catch (e) {
          requirementsData = {};
        }
      }
      updateData.requirements = {
        minExperience: requirementsData.minExperience || 0,
        description: requirementsData.description || '',
        skills: requirementsData.skills || [],
        qualifications: requirementsData.qualifications || []
      };
    }
    
    // Handle salary if provided (support both JSON and FormData JSON string)
    if (req.body.salary) {
      let salaryData = req.body.salary;
      if (typeof salaryData === 'string') {
        try {
          salaryData = JSON.parse(salaryData);
        } catch (e) {
          salaryData = {};
        }
      }
      updateData.salary = {
        min: salaryData.min || 0,
        max: salaryData.max || 0,
        currency: salaryData.currency || 'USD',
        period: salaryData.period || 'monthly'
      };
    }
    
    // Handle location if provided - convert string IDs to ObjectIds
    // Support both JSON (req.body.location) and FormData (req.body['location[continent]'])
    let locationData = req.body.location;
    
    // Debug: Log what we're receiving
    console.log('=== UPDATE JOB - Location Data Debug ===');
    console.log('req.body.location:', req.body.location);
    console.log('req.body[location[continents]]:', req.body['location[continents]']);
    console.log('req.body[location[countries]]:', req.body['location[countries]']);
    console.log('req.body[location[provinces]]:', req.body['location[provinces]']);
    console.log('req.body[location[cities]]:', req.body['location[cities]']);
    
    // If location is not an object, try to parse FormData format
    if (!locationData || typeof locationData !== 'object') {
      locationData = {};
      if (req.body['location[continent]']) locationData.continent = req.body['location[continent]'];
      if (req.body['location[country]']) locationData.country = req.body['location[country]'];
      if (req.body['location[province]']) locationData.province = req.body['location[province]'];
      if (req.body['location[city]']) locationData.city = req.body['location[city]'];
      if (req.body['location[address]']) locationData.address = req.body['location[address]'];
      
      // Helper function to get array from value (handles string JSON, array, or single value)
      const getArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            // If not JSON, treat as single value
            return [value];
          }
        }
        // Single value - wrap in array
        return [value];
      };
      
      // Parse arrays using helper function
      locationData.continents = getArray(req.body['location[continents]']);
      locationData.countries = getArray(req.body['location[countries]']);
      locationData.provinces = getArray(req.body['location[provinces]']);
      locationData.cities = getArray(req.body['location[cities]']);
      
      console.log('UPDATE: Parsed continents:', locationData.continents, 'Length:', locationData.continents?.length, 'Is Array?', Array.isArray(locationData.continents));
      console.log('UPDATE: Parsed countries:', locationData.countries, 'Length:', locationData.countries?.length, 'Is Array?', Array.isArray(locationData.countries));
      console.log('UPDATE: Parsed provinces:', locationData.provinces, 'Length:', locationData.provinces?.length, 'Is Array?', Array.isArray(locationData.provinces));
      console.log('UPDATE: Parsed cities:', locationData.cities, 'Length:', locationData.cities?.length, 'Is Array?', Array.isArray(locationData.cities));
    }
    
    console.log('Final locationData:', JSON.stringify(locationData, null, 2));
    
    if (locationData && (locationData.continent || locationData.country || locationData.province || locationData.city || locationData.continents || locationData.countries || locationData.provinces || locationData.cities)) {
      updateData.location = job.location || {};
      
      // IMPORTANT: Handle arrays FIRST, then set single values from arrays for backward compatibility
      // Initialize arrays as empty arrays first
      updateData.location.continents = [];
      updateData.location.countries = [];
      updateData.location.provinces = [];
      updateData.location.cities = [];
      
      // Handle multiple continents FIRST - use first one for backward compatibility
      if (locationData.continents && Array.isArray(locationData.continents) && locationData.continents.length > 0) {
        console.log('UPDATE: Processing continents array, length:', locationData.continents.length);
        const validContinentIds = locationData.continents
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        console.log('UPDATE: Valid continent IDs:', validContinentIds.length, validContinentIds);
        if (validContinentIds.length > 0) {
          // CRITICAL: Set the entire array at once
          updateData.location.continents = [...validContinentIds]; // Create a new array copy
          updateData.location.continent = validContinentIds[0]; // Use first continent for backward compatibility
          console.log('UPDATE: ✅ Saving continents array with', validContinentIds.length, 'items:', validContinentIds.map(id => id.toString()));
        }
      } else if (locationData.continent) {
        // Fallback to single continent - convert to array
        if (mongoose.Types.ObjectId.isValid(locationData.continent)) {
          const continentId = new mongoose.Types.ObjectId(locationData.continent);
          updateData.location.continent = continentId;
          updateData.location.continents = [continentId]; // Also save as array
        }
      }
      
      // Handle multiple countries - use first one for backward compatibility
      if (locationData.countries && Array.isArray(locationData.countries) && locationData.countries.length > 0) {
        console.log('UPDATE: Processing countries array, length:', locationData.countries.length);
        const validCountryIds = locationData.countries
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        console.log('UPDATE: Valid country IDs:', validCountryIds.length, validCountryIds);
        if (validCountryIds.length > 0) {
          // CRITICAL: Set the entire array at once
          updateData.location.countries = [...validCountryIds]; // Create a new array copy
          updateData.location.country = validCountryIds[0]; // Use first country for backward compatibility
          console.log('UPDATE: ✅ Saving countries array with', validCountryIds.length, 'items:', validCountryIds.map(id => id.toString()));
        }
      } else if (locationData.country) {
        // Fallback to single country - convert to array
        if (mongoose.Types.ObjectId.isValid(locationData.country)) {
          const countryId = new mongoose.Types.ObjectId(locationData.country);
          updateData.location.country = countryId;
          updateData.location.countries = [countryId]; // Also save as array
        }
      }
      
      // Handle multiple provinces - use first one for backward compatibility
      if (locationData.provinces && Array.isArray(locationData.provinces) && locationData.provinces.length > 0) {
        console.log('UPDATE: Processing provinces array, length:', locationData.provinces.length);
        const validProvinceIds = locationData.provinces
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        console.log('UPDATE: Valid province IDs:', validProvinceIds.length, validProvinceIds);
        if (validProvinceIds.length > 0) {
          // CRITICAL: Set the entire array at once
          updateData.location.provinces = [...validProvinceIds]; // Create a new array copy
          updateData.location.province = validProvinceIds[0]; // Use first province for backward compatibility
          console.log('UPDATE: ✅ Saving provinces array with', validProvinceIds.length, 'items:', validProvinceIds.map(id => id.toString()));
        }
      } else if (locationData.province) {
        // Fallback to single province - convert to array
        if (mongoose.Types.ObjectId.isValid(locationData.province)) {
          const provinceId = new mongoose.Types.ObjectId(locationData.province);
          updateData.location.province = provinceId;
          updateData.location.provinces = [provinceId]; // Also save as array
        }
      }
      
      // Handle multiple cities - use first one for backward compatibility
      if (locationData.cities && Array.isArray(locationData.cities) && locationData.cities.length > 0) {
        console.log('UPDATE: Processing cities array, length:', locationData.cities.length);
        const validCityIds = locationData.cities
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        console.log('UPDATE: Valid city IDs:', validCityIds.length, validCityIds);
        if (validCityIds.length > 0) {
          // CRITICAL: Set the entire array at once
          updateData.location.cities = [...validCityIds]; // Create a new array copy
          updateData.location.city = validCityIds[0]; // Use first city for backward compatibility
          console.log('UPDATE: ✅ Saving cities array with', validCityIds.length, 'items:', validCityIds.map(id => id.toString()));
        }
      } else if (locationData.city) {
        // Fallback to single city - convert to array
        if (mongoose.Types.ObjectId.isValid(locationData.city)) {
          const cityId = new mongoose.Types.ObjectId(locationData.city);
          updateData.location.city = cityId;
          updateData.location.cities = [cityId]; // Also save as array
        }
      }
      
      if (locationData.address) {
        updateData.location.address = locationData.address;
      }
    }
    
    console.log('Final updateData.location:', JSON.stringify(updateData.location, null, 2));
    
    // Handle application deadline if provided
    if (req.body.deadline) {
      updateData.deadline = new Date(req.body.deadline);
    }

    // Use $set for proper nested object updates, especially for arrays
    if (updateData.location) {
      // Explicitly set location arrays to ensure they're saved
      Object.keys(updateData.location).forEach(key => {
        job.location = job.location || {};
        job.location[key] = updateData.location[key];
      });
      
      // CRITICAL: Mark arrays as modified to ensure Mongoose saves them
      if (updateData.location.continents && updateData.location.continents.length > 0) {
        job.markModified('location.continents');
      }
      if (updateData.location.countries && updateData.location.countries.length > 0) {
        job.markModified('location.countries');
      }
      if (updateData.location.provinces && updateData.location.provinces.length > 0) {
        job.markModified('location.provinces');
      }
      if (updateData.location.cities && updateData.location.cities.length > 0) {
        job.markModified('location.cities');
      }
      
      console.log('Location updated directly on job object');
      console.log('UPDATE: job.location.continents:', job.location.continents, 'Length:', job.location.continents?.length);
      console.log('UPDATE: job.location.countries:', job.location.countries, 'Length:', job.location.countries?.length);
      console.log('UPDATE: job.location.provinces:', job.location.provinces, 'Length:', job.location.provinces?.length);
      console.log('UPDATE: job.location.cities:', job.location.cities, 'Length:', job.location.cities?.length);
    }
    
    // Update other fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'location') {
        job[key] = updateData[key];
      }
    });
    
    await job.save();
    
    // Verify what was saved
    const savedJob = await Job.findById(job._id);
    console.log('Job updated with location arrays:', {
      continents: savedJob.location?.continents?.length || 0,
      countries: savedJob.location?.countries?.length || 0,
      provinces: savedJob.location?.provinces?.length || 0,
      cities: savedJob.location?.cities?.length || 0
    });
    console.log('Saved location.continents:', savedJob.location?.continents);
    console.log('Saved location.countries:', savedJob.location?.countries);
    console.log('Saved location.provinces:', savedJob.location?.provinces);
    console.log('Saved location.cities:', savedJob.location?.cities);

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job',
      error: error.message
    });
  }
};

// Delete job
const deleteJob = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      company: company._id
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or you do not have permission to delete it'
      });
    }

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting job',
      error: error.message
    });
  }
};

// Apply for a job
const applyJob = async (req, res) => {
  try {
    const { jobId, professionalId } = req.body;
    const userId = req.user._id;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job is active
    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This job is not accepting applications'
      });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      job: jobId,
      $or: [
        { professional: professionalId },
        { email: req.body.email }
      ]
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Prepare application data
    const applicationData = {
      job: jobId,
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      fathersName: req.body.fathersName || '',
      whatsapp: req.body.whatsapp || '',
      dateOfBirth: req.body.dateOfBirth || null,
      gender: req.body.gender || '',
      cnic: req.body.cnic || '',
      country: req.body.country || '',
      state: req.body.state || '',
      city: req.body.city || '',
      fullAddress: req.body.fullAddress || '',
      requiredSkills: req.body.requiredSkills || '',
      additionalSkills: req.body.additionalSkills || '',
      whyThisJob: req.body.whyThisJob || '',
      expectedSalary: req.body.expectedSalary || '',
      willingToRelocate: req.body.willingToRelocate || '',
      availableImmediately: req.body.availableImmediately || '',
      maritalStatus: req.body.maritalStatus || '',
      languages: req.body.languages || '',
      emergencyContactName: req.body.emergencyContactName || '',
      emergencyContactNumber: req.body.emergencyContactNumber || '',
      notes: req.body.notes || ''
    };

    // Add professional/trainee reference if provided
    if (professionalId) {
      applicationData.professional = professionalId;
    }

    // Parse education if provided
    if (req.body.education) {
      try {
        applicationData.education = typeof req.body.education === 'string' 
          ? JSON.parse(req.body.education) 
          : req.body.education;
      } catch (e) {
        applicationData.education = [];
      }
    }

    // Parse experience if provided
    if (req.body.experience) {
      try {
        applicationData.experience = typeof req.body.experience === 'string' 
          ? JSON.parse(req.body.experience) 
          : req.body.experience;
      } catch (e) {
        applicationData.experience = [];
      }
    }

    // Handle file uploads
    if (req.files) {
      // Profile Photo
      if (req.files.profilePhoto) {
        const file = Array.isArray(req.files.profilePhoto) ? req.files.profilePhoto[0] : req.files.profilePhoto;
        const profilePhotoResult = await uploadImage(file, 'hpw-pool/profile-images');
        applicationData.profilePhoto = {
          url: profilePhotoResult.url,
          public_id: profilePhotoResult.public_id
        };
      }

      // Resume/CV
      if (req.files.resume) {
        const file = Array.isArray(req.files.resume) ? req.files.resume[0] : req.files.resume;
        const resumeResult = await uploadDocument(file, 'hpw-pool/resumes');
        applicationData.resume = {
          url: resumeResult.url,
          public_id: resumeResult.public_id,
          filename: file.originalname
        };
      }

      // Cover Letter
      if (req.files.coverLetter) {
        const file = Array.isArray(req.files.coverLetter) ? req.files.coverLetter[0] : req.files.coverLetter;
        const coverLetterResult = await uploadDocument(file, 'hpw-pool/cover-letters');
        applicationData.coverLetter = {
          url: coverLetterResult.url,
          public_id: coverLetterResult.public_id,
          filename: file.originalname
        };
      }

      // Certificates
      if (req.files.certificates) {
        const files = Array.isArray(req.files.certificates) ? req.files.certificates : [req.files.certificates];
        applicationData.certificates = await Promise.all(
          files.map(async (file) => {
            const certResult = await uploadDocument(file, 'hpw-pool/certificates');
            return {
              url: certResult.url,
              public_id: certResult.public_id,
              filename: file.originalname
            };
          })
        );
      }
    }

    // Create application
    const application = new JobApplication(applicationData);
    await application.save();

    // Update job's total applications count
    await Job.findByIdAndUpdate(jobId, {
      $inc: { totalApplications: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
};

// Get applications for a job (company only)
const getJobApplications = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    const job = await Job.findOne({
      _id: req.params.id,
      company: company._id
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or you do not have permission to view applications'
      });
    }

    const applications = await JobApplication.find({ job: job._id })
      .populate('professional', 'name email phone profession location avatar')
      .populate('trainee', 'name email phone profession location avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// Mark application as viewed
const markApplicationAsViewed = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    const application = await JobApplication.findById(req.params.applicationId)
      .populate('job');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify the job belongs to this company
    const job = await Job.findOne({
      _id: application.job._id || application.job,
      company: company._id
    });

    if (!job) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this application'
      });
    }

    application.isViewed = true;
    application.viewedAt = new Date();
    await application.save();

    res.json({
      success: true,
      message: 'Application marked as viewed',
      data: application
    });
  } catch (error) {
    console.error('Mark application as viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking application as viewed',
      error: error.message
    });
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyJob,
  getJobApplications,
  markApplicationAsViewed
};

