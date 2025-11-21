const Company = require('../models/Company.cjs');
const User = require('../models/User.cjs');

// Get all companies
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .populate('city', 'name')
      .populate('country', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get company by ID
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('city', 'name')
      .populate('country', 'name')
      .populate('province', 'name')
      .populate('continent', 'name')
      .populate('user', 'name email');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create company profile
exports.createCompany = async (req, res) => {
  try {
    const company = await Company.create({
      ...req.body,
      user: req.user.id
    });
    
    // Update user role to company
    await User.findByIdAndUpdate(req.user.id, { role: 'company' });
    
    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Company profile already exists for this user'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update company profile
exports.updateCompany = async (req, res) => {
  try {
    let company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    if (company.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
