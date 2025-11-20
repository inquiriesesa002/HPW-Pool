const Job = require('../models/Job');
const Profession = require('../models/Profession');
const Company = require('../models/Company');

// Get all jobs
exports.getJobs = async (req, res) => {
  try {
    const { 
      profession, 
      city, 
      country, 
      jobType,
      status,
      company
    } = req.query;
    
    let query = {};
    
    if (profession) query.profession = profession;
    if (city) query.city = city;
    if (country) query.country = country;
    if (jobType) query.jobType = jobType;
    if (status) query.status = status;
    if (company) query.company = company;
    
    let jobsQuery = Job.find(query)
      .populate('company', 'companyName logo')
      .populate('profession', 'name category')
      .populate('city', 'name')
      .populate('country', 'name')
      .sort({ postedDate: -1 });
    
    // Support limit parameter
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      jobsQuery = jobsQuery.limit(limit);
    }
    
    const jobs = await jobsQuery;
    
    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get job by ID
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'companyName logo description')
      .populate('profession', 'name category')
      .populate('city', 'name')
      .populate('country', 'name')
      .populate('province', 'name')
      .populate({
        path: 'applications.professional',
        select: 'user profession city cv degree experience',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'profession', select: 'name' },
          { path: 'city', select: 'name' }
        ]
      })
      .populate({
        path: 'applications.trainee',
        select: 'user profession city degree',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'profession', select: 'name' },
          { path: 'city', select: 'name' }
        ]
      });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Increment views
    job.views += 1;
    await job.save();
    
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create job
exports.createJob = async (req, res) => {
  try {
    const profession = await Profession.findById(req.body.profession);
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }
    
    // Get company for this user
    const company = await Company.findOne({ user: req.user.id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found. Please create company profile first.'
      });
    }
    
    // Handle image upload (Cloudinary)
    let imagePath = '';
    if (req.file && req.file.cloudinaryUrl) {
      imagePath = req.file.cloudinaryUrl;
    }
    
    // Parse JSON strings from FormData
    let requirements = {};
    let salary = {};
    
    if (req.body.requirements) {
      try {
        requirements = typeof req.body.requirements === 'string' 
          ? JSON.parse(req.body.requirements) 
          : req.body.requirements;
      } catch (e) {
        requirements = {};
      }
    }
    
    if (req.body.salary) {
      try {
        salary = typeof req.body.salary === 'string' 
          ? JSON.parse(req.body.salary) 
          : req.body.salary;
      } catch (e) {
        salary = {};
      }
    }
    
    const job = await Job.create({
      title: req.body.title,
      description: req.body.description || '',
      profession: req.body.profession,
      professionName: profession.name,
      jobType: req.body.jobType,
      city: req.body.city,
      address: req.body.address || '',
      requirements: requirements,
      salary: salary,
      deadline: req.body.deadline || undefined,
      status: req.body.status || 'active',
      isUrgent: req.body.isUrgent === 'true' || req.body.isUrgent === true,
      company: company._id,
      image: imagePath || req.body.image || ''
    });
    
    // Update company stats
    company.totalJobsPosted += 1;
    await company.save();
    
    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update job
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if user owns this job
    const company = await Company.findOne({ user: req.user.id });
    if (!company || (job.company.toString() !== company._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }
    
    // Handle image upload (Cloudinary)
    let imagePath = job.image || '';
    if (req.file && req.file.cloudinaryUrl) {
      imagePath = req.file.cloudinaryUrl;
    }
    
    // Parse JSON strings from FormData
    let requirements = job.requirements || {};
    let salary = job.salary || {};
    
    if (req.body.requirements) {
      try {
        requirements = typeof req.body.requirements === 'string' 
          ? JSON.parse(req.body.requirements) 
          : req.body.requirements;
      } catch (e) {
        requirements = job.requirements || {};
      }
    }
    
    if (req.body.salary) {
      try {
        salary = typeof req.body.salary === 'string' 
          ? JSON.parse(req.body.salary) 
          : req.body.salary;
      } catch (e) {
        salary = job.salary || {};
      }
    }
    
    // Update profession name if profession changed
    let professionName = job.professionName;
    if (req.body.profession && req.body.profession !== job.profession.toString()) {
      const profession = await Profession.findById(req.body.profession);
      if (profession) {
        professionName = profession.name;
      }
    }
    
    // Update job
    job.title = req.body.title || job.title;
    job.description = req.body.description || job.description;
    if (req.body.profession) job.profession = req.body.profession;
    job.professionName = professionName;
    if (req.body.jobType) job.jobType = req.body.jobType;
    if (req.body.city) job.city = req.body.city;
    if (req.body.address !== undefined) job.address = req.body.address;
    job.requirements = requirements;
    job.salary = salary;
    if (req.body.deadline) job.deadline = req.body.deadline;
    if (req.body.status) job.status = req.body.status;
    if (req.body.isUrgent !== undefined) job.isUrgent = req.body.isUrgent === 'true' || req.body.isUrgent === true;
    if (imagePath) job.image = imagePath;
    
    await job.save();
    
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Apply to job
exports.applyToJob = async (req, res) => {
  try {
    const { jobId, professionalId, traineeId, notes } = req.body;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if already applied
    const existingApplication = job.applications.find(
      app => (app.professional && app.professional.toString() === professionalId) ||
             (app.trainee && app.trainee.toString() === traineeId)
    );
    
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Already applied to this job'
      });
    }
    
    job.applications.push({
      professional: professionalId || null,
      trainee: traineeId || null,
      notes: notes || '',
      status: 'pending'
    });
    
    job.applicationsCount += 1;
    await job.save();
    
    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Download CV (for companies)
exports.downloadCV = async (req, res) => {
  try {
    const { professionalId, traineeId } = req.query;
    
    let cvPath = '';
    let fileName = '';
    
    if (professionalId) {
      const Professional = require('../models/Professional');
      const professional = await Professional.findById(professionalId);
      if (professional && professional.cv) {
        cvPath = professional.cv;
        fileName = professional.cvFileName || 'cv.pdf';
      }
    } else if (traineeId) {
      const Trainee = require('../models/Trainee');
      const trainee = await Trainee.findById(traineeId);
      if (trainee && trainee.cv) {
        cvPath = trainee.cv;
        fileName = 'trainee-cv.pdf';
      }
    }
    
    if (!cvPath) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }
    
    // In production, use proper file serving
    res.json({
      success: true,
      cvPath: cvPath,
      fileName: fileName
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
