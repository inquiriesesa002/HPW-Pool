const Profession = require('../models/Profession.cjs');

// Get all professions
const getProfessions = async (req, res) => {
  try {
    // If admin, return all professions (including inactive)
    // Otherwise, return only active professions
    const isAdmin = req.user && req.user.role && (req.user.role === 'admin' || req.user.role === 'Admin');
    const query = isAdmin ? {} : { isActive: true };
    
    const professions = await Profession.find(query)
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

// Update profession (Admin only)
const updateProfession = async (req, res) => {
  try {
    const profession = await Profession.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }
    res.json({
      success: true,
      message: 'Profession updated successfully',
      data: profession
    });
  } catch (error) {
    console.error('Update profession error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profession',
      error: error.message
    });
  }
};

// Delete profession (Admin only)
const deleteProfession = async (req, res) => {
  try {
    const profession = await Profession.findByIdAndDelete(req.params.id);
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }
    res.json({
      success: true,
      message: 'Profession deleted successfully'
    });
  } catch (error) {
    console.error('Delete profession error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting profession',
      error: error.message
    });
  }
};

module.exports = {
  getProfessions,
  getProfessionById,
  createProfession,
  updateProfession,
  deleteProfession
};

