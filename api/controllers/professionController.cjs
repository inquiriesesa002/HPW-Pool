const Profession = require('../models/Profession.cjs');

// Get all professions
exports.getProfessions = async (req, res) => {
  try {
    const { category } = req.query;
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    const professions = await Profession.find(query)
      .sort({ category: 1, order: 1, name: 1 });
    
    res.json({
      success: true,
      data: professions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get profession by ID
exports.getProfession = async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create profession (Admin only)
exports.createProfession = async (req, res) => {
  try {
    const profession = await Profession.create(req.body);
    
    res.status(201).json({
      success: true,
      data: profession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update profession (Admin only)
exports.updateProfession = async (req, res) => {
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
      data: profession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete profession (Admin only)
exports.deleteProfession = async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
