const Company = require('../models/Company.cjs');
const { uploadImage } = require('../middleware/upload.cjs');

// Get all companies
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .populate('location.continent', 'name')
      .populate('location.country', 'name code')
      .populate('location.province', 'name')
      .populate('location.city', 'name')
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

// Get company by ID
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('location.continent', 'name')
      .populate('location.country', 'name code')
      .populate('location.province', 'name')
      .populate('location.city', 'name');

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
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company',
      error: error.message
    });
  }
};

// Create company profile
const createCompany = async (req, res) => {
  try {
    const companyData = { ...req.body, user: req.user.id };

    // Handle logo upload if provided
    if (req.file && req.file.fieldname === 'logo') {
      const logoResult = await uploadImage(req.file, 'hpw-pool/companies/logos');
      companyData.logo = logoResult.url;
    }

    const company = new Company(companyData);
    await company.save();

    res.status(201).json({
      success: true,
      message: 'Company profile created successfully',
      data: company
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating company profile',
      error: error.message
    });
  }
};

// Update company profile
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    // Handle logo upload if provided
    if (req.file && req.file.fieldname === 'logo') {
      const logoResult = await uploadImage(req.file, 'hpw-pool/companies/logos');
      req.body.logo = logoResult.url;
    }

    Object.assign(company, req.body);
    await company.save();

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      data: company
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company profile',
      error: error.message
    });
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany
};

