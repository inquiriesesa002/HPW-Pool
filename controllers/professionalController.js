const Professional = require('../models/Professional');

// Get all professionals with filters
exports.getProfessionals = async (req, res) => {
  try {
    const { 
      profession, 
      city, 
      province, 
      country, 
      continent,
      gender,
      minExperience,
      minRating,
      emergencyContact,
      verified,
      userType,
      search
    } = req.query;
    
    let query = { isActive: true };
    
    if (profession) query.profession = profession;
    if (city) query.city = city;
    if (province) query.province = province;
    if (country) query.country = country;
    if (continent) query.continent = continent;
    if (gender) query.gender = gender;
    if (userType) query.userType = userType;
    if (minExperience) query.experience = { $gte: parseInt(minExperience) };
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (emergencyContact === 'true') query.emergencyContact = true;
    if (verified === 'true') query.verificationStatus = 'verified';
    
    // Search by name or profession name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { professionName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const professionals = await Professional.find(query)
      .populate('profession', 'name category')
      .populate('city', 'name')
      .populate('province', 'name')
      .populate('country', 'name')
      .populate('continent', 'name')
      .sort({ rating: -1, views: -1 });
    
    res.json({
      success: true,
      count: professionals.length,
      data: professionals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get professional by ID
exports.getProfessional = async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .populate('profession', 'name category')
      .populate('city', 'name')
      .populate('province', 'name')
      .populate('country', 'name')
      .populate('continent', 'name')
      .populate('user', 'name email');
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }
    
    // Increment views
    professional.views += 1;
    await professional.save();
    
    res.json({
      success: true,
      data: professional
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create professional profile
exports.createProfessional = async (req, res) => {
  try {
    const professional = await Professional.create({
      ...req.body,
      user: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: professional
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Professional profile already exists for this user'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update professional profile
exports.updateProfessional = async (req, res) => {
  try {
    let professional = await Professional.findById(req.params.id);
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }
    
    // Check ownership or admin
    if (professional.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    professional = await Professional.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: professional
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Upload CV
exports.uploadCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Use Cloudinary URL if available, otherwise fallback to old path
    const cvUrl = req.file.cloudinaryUrl || `/uploads/cvs/${req.file.filename}`;
    
    res.json({
      success: true,
      cvUrl: cvUrl,
      fileName: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get stats
exports.getStats = async (req, res) => {
  try {
    const totalProfessionals = await Professional.countDocuments({ isActive: true });
    const verifiedProfessionals = await Professional.countDocuments({ verificationStatus: 'verified' });
    const totalCountries = await require('../models/Country').countDocuments({ isActive: true });
    const totalProfessions = await require('../models/Profession').countDocuments({ isActive: true });
    
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

