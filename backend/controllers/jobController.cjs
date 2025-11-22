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
      .populate('company', 'companyName logo email')
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
      .populate('company', 'companyName logo email description')
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

    const jobData = {
      ...req.body,
      company: company._id
    };

    // Handle image upload if provided
    if (req.file && req.file.fieldname === 'image') {
      const imageResult = await uploadImage(req.file, 'hpw-pool/jobs/images');
      jobData.image = imageResult.url;
    }

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating job',
      error: error.message
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

    Object.assign(job, req.body);
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

