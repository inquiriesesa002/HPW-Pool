const User = require('../models/User.cjs');
const Professional = require('../models/Professional.cjs');
const Company = require('../models/Company.cjs');
const Job = require('../models/Job.cjs');
const Profession = require('../models/Profession.cjs');
const Country = require('../models/Country.cjs');

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

module.exports = {
  getDashboardStats,
  getUsers,
  getProfessionals,
  verifyProfessional,
  getCompanies,
  getJobs
};

