const Profession = require('../models/Profession.cjs');

// Get all professions
const getProfessions = async (req, res) => {
  try {
    const professions = await Profession.find({ isActive: true })
      .sort({ order: 1, name: 1 });
    res.json({
      success: true,
      data: professions
    });
  } catch (error) {
    console.error('Get professions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professions',
      error: error.message
    });
  }
};

// Get profession by ID
const getProfessionById = async (req, res) => {
  try {
    const profession = await Profession.findById(req.params.id);
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }
    res.json({
      success: true,
      data: profession
    });
  } catch (error) {
    console.error('Get profession error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profession',
      error: error.message
    });
  }
};

// Create profession (Admin only)
const createProfession = async (req, res) => {
  try {
    const profession = new Profession(req.body);
    await profession.save();
    res.status(201).json({
      success: true,
      message: 'Profession created successfully',
      data: profession
    });
  } catch (error) {
    console.error('Create profession error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating profession',
      error: error.message
    });
  }
};

module.exports = {
  getProfessions,
  getProfessionById,
  createProfession
};

