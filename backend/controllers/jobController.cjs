const Job = require('../models/Job.cjs');
const Company = require('../models/Company.cjs');
const { uploadImage } = require('../middleware/upload.cjs');

// Get all jobs with filters
const getJobs = async (req, res) => {
  try {
    const {
      status,
      profession,
      city,
      country,
      jobType,
      company,
      limit,
      search
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (profession) query.profession = profession;
    if (city) query['location.city'] = city;
    if (country) query['location.country'] = country;
    if (jobType) query.jobType = jobType;
    if (company) query.company = company;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
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
      .populate('location.country', 'name code')
      .populate('location.province', 'name')
      .populate('location.city', 'name')
      .sort({ createdAt: -1 });

    if (limit) {
      jobsQuery = jobsQuery.limit(parseInt(limit));
    }

    const jobs = await jobsQuery;

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

    res.json({
      success: true,
      data: job
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
      profession: req.body.profession,
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
    
    // If location is not an object, try to parse FormData format
    if (!locationData || typeof locationData !== 'object') {
      locationData = {};
      if (req.body['location[continent]']) locationData.continent = req.body['location[continent]'];
      if (req.body['location[country]']) locationData.country = req.body['location[country]'];
      if (req.body['location[province]']) locationData.province = req.body['location[province]'];
      if (req.body['location[city]']) locationData.city = req.body['location[city]'];
      if (req.body['location[address]']) locationData.address = req.body['location[address]'];
      
      // Parse JSON strings for arrays
      if (req.body['location[provinces]']) {
        try {
          locationData.provinces = typeof req.body['location[provinces]'] === 'string' 
            ? JSON.parse(req.body['location[provinces]']) 
            : req.body['location[provinces]'];
        } catch (e) {
          locationData.provinces = [];
        }
      }
      if (req.body['location[cities]']) {
        try {
          locationData.cities = typeof req.body['location[cities]'] === 'string' 
            ? JSON.parse(req.body['location[cities]']) 
            : req.body['location[cities]'];
        } catch (e) {
          locationData.cities = [];
        }
      }
    }
    
    if (locationData && (locationData.continent || locationData.country || locationData.province || locationData.city || locationData.provinces || locationData.cities)) {
      jobData.location = {};
      
      if (locationData.continent) {
        if (mongoose.Types.ObjectId.isValid(locationData.continent)) {
          jobData.location.continent = new mongoose.Types.ObjectId(locationData.continent);
        }
      }
      
      if (locationData.country) {
        if (mongoose.Types.ObjectId.isValid(locationData.country)) {
          jobData.location.country = new mongoose.Types.ObjectId(locationData.country);
        }
      }
      
      // Handle multiple provinces - use first one for backward compatibility
      if (locationData.provinces && Array.isArray(locationData.provinces) && locationData.provinces.length > 0) {
        const validProvinceIds = locationData.provinces
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        if (validProvinceIds.length > 0) {
          jobData.location.province = validProvinceIds[0]; // Use first province for backward compatibility
        }
      } else if (locationData.province) {
        // Fallback to single province
        if (mongoose.Types.ObjectId.isValid(locationData.province)) {
          jobData.location.province = new mongoose.Types.ObjectId(locationData.province);
        }
      }
      
      // Handle multiple cities - use first one for backward compatibility
      if (locationData.cities && Array.isArray(locationData.cities) && locationData.cities.length > 0) {
        const validCityIds = locationData.cities
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        if (validCityIds.length > 0) {
          jobData.location.city = validCityIds[0]; // Use first city for backward compatibility
        }
      } else if (locationData.city) {
        // Fallback to single city
        if (mongoose.Types.ObjectId.isValid(locationData.city)) {
          jobData.location.city = new mongoose.Types.ObjectId(locationData.city);
        }
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

    if (!jobData.profession) {
      return res.status(400).json({
        success: false,
        message: 'Profession is required'
      });
    }

    if (!jobData.description) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required'
      });
    }

    // Validate profession ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobData.profession)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profession ID'
      });
    }
    jobData.profession = new mongoose.Types.ObjectId(jobData.profession);

    const job = new Job(jobData);
    await job.save();

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
    
    // If location is not an object, try to parse FormData format
    if (!locationData || typeof locationData !== 'object') {
      locationData = {};
      if (req.body['location[continent]']) locationData.continent = req.body['location[continent]'];
      if (req.body['location[country]']) locationData.country = req.body['location[country]'];
      if (req.body['location[province]']) locationData.province = req.body['location[province]'];
      if (req.body['location[city]']) locationData.city = req.body['location[city]'];
      if (req.body['location[address]']) locationData.address = req.body['location[address]'];
      
      // Parse JSON strings for arrays
      if (req.body['location[continents]']) {
        try {
          locationData.continents = typeof req.body['location[continents]'] === 'string' 
            ? JSON.parse(req.body['location[continents]']) 
            : req.body['location[continents]'];
        } catch (e) {
          locationData.continents = [];
        }
      }
      if (req.body['location[countries]']) {
        try {
          locationData.countries = typeof req.body['location[countries]'] === 'string' 
            ? JSON.parse(req.body['location[countries]']) 
            : req.body['location[countries]'];
        } catch (e) {
          locationData.countries = [];
        }
      }
      if (req.body['location[provinces]']) {
        try {
          locationData.provinces = typeof req.body['location[provinces]'] === 'string' 
            ? JSON.parse(req.body['location[provinces]']) 
            : req.body['location[provinces]'];
        } catch (e) {
          locationData.provinces = [];
        }
      }
      if (req.body['location[cities]']) {
        try {
          locationData.cities = typeof req.body['location[cities]'] === 'string' 
            ? JSON.parse(req.body['location[cities]']) 
            : req.body['location[cities]'];
        } catch (e) {
          locationData.cities = [];
        }
      }
    }
    
    if (locationData && (locationData.continent || locationData.country || locationData.province || locationData.city || locationData.continents || locationData.countries || locationData.provinces || locationData.cities)) {
      updateData.location = job.location || {};
      
      // Handle multiple continents - use first one for backward compatibility
      if (locationData.continents && Array.isArray(locationData.continents) && locationData.continents.length > 0) {
        const validContinentIds = locationData.continents
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        if (validContinentIds.length > 0) {
          updateData.location.continent = validContinentIds[0]; // Use first continent for backward compatibility
          updateData.location.continents = validContinentIds; // Store all continents
        }
      } else if (locationData.continent) {
        // Fallback to single continent
        if (mongoose.Types.ObjectId.isValid(locationData.continent)) {
          updateData.location.continent = new mongoose.Types.ObjectId(locationData.continent);
        }
      }
      
      // Handle multiple countries - use first one for backward compatibility
      if (locationData.countries && Array.isArray(locationData.countries) && locationData.countries.length > 0) {
        const validCountryIds = locationData.countries
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        if (validCountryIds.length > 0) {
          updateData.location.country = validCountryIds[0]; // Use first country for backward compatibility
          updateData.location.countries = validCountryIds; // Store all countries
        }
      } else if (locationData.country) {
        // Fallback to single country
        if (mongoose.Types.ObjectId.isValid(locationData.country)) {
          updateData.location.country = new mongoose.Types.ObjectId(locationData.country);
        }
      }
      
      // Handle multiple provinces - use first one for backward compatibility
      if (locationData.provinces && Array.isArray(locationData.provinces) && locationData.provinces.length > 0) {
        const validProvinceIds = locationData.provinces
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        if (validProvinceIds.length > 0) {
          updateData.location.province = validProvinceIds[0]; // Use first province for backward compatibility
          updateData.location.provinces = validProvinceIds; // Store all provinces
        }
      } else if (locationData.province) {
        // Fallback to single province
        if (mongoose.Types.ObjectId.isValid(locationData.province)) {
          updateData.location.province = new mongoose.Types.ObjectId(locationData.province);
        }
      }
      
      // Handle multiple cities - use first one for backward compatibility
      if (locationData.cities && Array.isArray(locationData.cities) && locationData.cities.length > 0) {
        const validCityIds = locationData.cities
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        if (validCityIds.length > 0) {
          updateData.location.city = validCityIds[0]; // Use first city for backward compatibility
          updateData.location.cities = validCityIds; // Store all cities
        }
      } else if (locationData.city) {
        // Fallback to single city
        if (mongoose.Types.ObjectId.isValid(locationData.city)) {
          updateData.location.city = new mongoose.Types.ObjectId(locationData.city);
        }
      }
      
      if (locationData.address) {
        updateData.location.address = locationData.address;
      }
    }
    
    // Handle application deadline if provided
    if (req.body.deadline) {
      updateData.deadline = new Date(req.body.deadline);
    }

    Object.assign(job, updateData);
    await job.save();

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

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};

