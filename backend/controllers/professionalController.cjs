const Professional = require('../models/Professional.cjs');
const { uploadImage, uploadDocument } = require('../middleware/upload.cjs');

// Get all professionals with filters
const getProfessionals = async (req, res) => {
  try {
    const {
      profession,
      city,
      country,
      minExperience,
      minRating,
      verified,
      search
    } = req.query;

    const query = {};

    if (profession) query.profession = profession;
    if (city) query['location.city'] = city;
    if (country) query['location.country'] = country;
    if (minExperience) query.experience = { $gte: parseInt(minExperience) };
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (verified !== undefined) query.isVerified = verified === 'true';

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const professionals = await Professional.find(query)
      .populate('profession', 'name category')
      .populate('location.continent', 'name')
      .populate('location.country', 'name code')
      .populate('location.province', 'name')
      .populate('location.city', 'name')
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

// Get professional by ID
const getProfessionalById = async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .populate('profession', 'name category')
      .populate('location.continent', 'name')
      .populate('location.country', 'name code')
      .populate('location.province', 'name')
      .populate('location.city', 'name');

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    res.json({
      success: true,
      data: professional
    });
  } catch (error) {
    console.error('Get professional error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professional',
      error: error.message
    });
  }
};

// Get statistics
const getStats = async (req, res) => {
  try {
    const totalProfessionals = await Professional.countDocuments();
    const verifiedProfessionals = await Professional.countDocuments({ isVerified: true });
    
    // Get unique countries count - handle null/undefined values
    let totalCountries = 0;
    try {
      const countries = await Professional.distinct('location.country');
      totalCountries = countries ? countries.filter(c => c != null && c !== '').length : 0;
    } catch (err) {
      console.warn('Error getting countries count:', err.message);
      totalCountries = 0;
    }

    // Get unique professions count - handle null/undefined values
    let totalProfessions = 0;
    try {
      const professions = await Professional.distinct('profession');
      totalProfessions = professions ? professions.filter(p => p != null && p !== '').length : 0;
    } catch (err) {
      console.warn('Error getting professions count:', err.message);
      totalProfessions = 0;
    }

    res.json({
      success: true,
      data: {
        totalProfessionals,
        verifiedProfessionals,
        totalCountries,
        totalProfessions
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// Create professional profile
const createProfessional = async (req, res) => {
  try {
    const professionalData = { ...req.body, user: req.user.id };

    // Handle avatar upload if provided
    if (req.file && req.file.fieldname === 'avatar') {
      const avatarResult = await uploadImage(req.file, 'hpw-pool/professionals/avatars');
      professionalData.avatar = avatarResult.url;
    }

    const professional = new Professional(professionalData);
    await professional.save();

    res.status(201).json({
      success: true,
      message: 'Professional profile created successfully',
      data: professional
    });
  } catch (error) {
    console.error('Create professional error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating professional profile',
      error: error.message
    });
  }
};

// Update professional profile
const updateProfessional = async (req, res) => {
  try {
    const professional = await Professional.findOne({ user: req.user.id });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Handle avatar upload if provided
    if (req.file && req.file.fieldname === 'avatar') {
      const avatarResult = await uploadImage(req.file, 'hpw-pool/professionals/avatars');
      req.body.avatar = avatarResult.url;
    }

    Object.assign(professional, req.body);
    await professional.save();

    res.json({
      success: true,
      message: 'Professional profile updated successfully',
      data: professional
    });
  } catch (error) {
    console.error('Update professional error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating professional profile',
      error: error.message
    });
  }
};

// Upload CV
const uploadCV = async (req, res) => {
  try {
    const professional = await Professional.findOne({ user: req.user.id });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const cvResult = await uploadDocument(req.file, 'hpw-pool/professionals/cvs');
    
    professional.cv = {
      url: cvResult.url,
      public_id: cvResult.public_id,
      filename: req.file.originalname,
      uploadedAt: new Date()
    };

    await professional.save();

    res.json({
      success: true,
      message: 'CV uploaded successfully',
      data: professional.cv
    });
  } catch (error) {
    console.error('Upload CV error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading CV',
      error: error.message
    });
  }
};

module.exports = {
  getProfessionals,
  getProfessionalById,
  getStats,
  createProfessional,
  updateProfessional,
  uploadCV
};

