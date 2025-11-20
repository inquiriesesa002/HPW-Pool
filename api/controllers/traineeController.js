const Trainee = require('../models/Trainee');
const Profession = require('../models/Profession');

// Get all trainees
exports.getTrainees = async (req, res) => {
  try {
    const { 
      profession, 
      city, 
      country,
      trainingLevel,
      available
    } = req.query;
    
    let query = { isActive: true };
    
    if (profession) query.profession = profession;
    if (city) query.city = city;
    if (country) query.country = country;
    if (trainingLevel) query.trainingLevel = trainingLevel;
    if (available === 'true') query.isAvailable = true;
    
    const trainees = await Trainee.find(query)
      .populate('profession', 'name category')
      .populate('city', 'name')
      .populate('country', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: trainees.length,
      data: trainees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get trainee by ID
exports.getTrainee = async (req, res) => {
  try {
    const trainee = await Trainee.findById(req.params.id)
      .populate('profession', 'name category')
      .populate('city', 'name')
      .populate('country', 'name')
      .populate('user', 'name email');
    
    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: 'Trainee not found'
      });
    }
    
    // Increment views
    trainee.views += 1;
    await trainee.save();
    
    res.json({
      success: true,
      data: trainee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create trainee profile
exports.createTrainee = async (req, res) => {
  try {
    const profession = await Profession.findById(req.body.profession);
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }
    
    const trainee = await Trainee.create({
      ...req.body,
      professionName: profession.name,
      user: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: trainee
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Trainee profile already exists for this user'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update trainee profile
exports.updateTrainee = async (req, res) => {
  try {
    let trainee = await Trainee.findById(req.params.id);
    
    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: 'Trainee not found'
      });
    }
    
    if (trainee.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Update profession name if profession changed
    if (req.body.profession) {
      const profession = await Profession.findById(req.body.profession);
      if (profession) {
        req.body.professionName = profession.name;
      }
    }
    
    trainee = await Trainee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: trainee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

