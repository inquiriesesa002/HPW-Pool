const Trainee = require('../models/Trainee.cjs');
const { uploadImage } = require('../middleware/upload.cjs');

// Get all trainees
const getTrainees = async (req, res) => {
  try {
    const {
      professionName,
      continent,
      country,
      province,
      city,
      trainingLevel,
      search
    } = req.query;

    const query = {};

    if (professionName) {
      query.professionName = { $regex: professionName, $options: 'i' };
    }
    if (continent) query['location.continent'] = continent;
    if (country) query['location.country'] = country;
    if (province) query['location.province'] = province;
    if (city) query['location.city'] = city;
    if (trainingLevel) query.trainingLevel = trainingLevel;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { professionName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const trainees = await Trainee.find(query)
      .populate('location.continent', 'name')
      .populate('location.country', 'name code')
      .populate('location.province', 'name')
      .populate('location.city', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: trainees
    });
  } catch (error) {
    console.error('Get trainees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trainees',
      error: error.message
    });
  }
};

// Get trainee by ID
const getTraineeById = async (req, res) => {
  try {
    const trainee = await Trainee.findById(req.params.id)
      .populate('location.continent', 'name')
      .populate('location.country', 'name code')
      .populate('location.province', 'name')
      .populate('location.city', 'name');

    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: 'Trainee not found'
      });
    }

    res.json({
      success: true,
      data: trainee
    });
  } catch (error) {
    console.error('Get trainee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trainee',
      error: error.message
    });
  }
};

// Create trainee profile
const createTrainee = async (req, res) => {
  try {
    const traineeData = { ...req.body, user: req.user.id };

    // Handle avatar upload if provided
    if (req.file && req.file.fieldname === 'avatar') {
      const avatarResult = await uploadImage(req.file, 'hpw-pool/trainees/avatars');
      traineeData.avatar = avatarResult.url;
    }

    const trainee = new Trainee(traineeData);
    await trainee.save();

    res.status(201).json({
      success: true,
      message: 'Trainee profile created successfully',
      data: trainee
    });
  } catch (error) {
    console.error('Create trainee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating trainee profile',
      error: error.message
    });
  }
};

// Update trainee profile
const updateTrainee = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({ user: req.user.id });

    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: 'Trainee profile not found'
      });
    }

    // Handle avatar upload if provided
    if (req.file && req.file.fieldname === 'avatar') {
      const avatarResult = await uploadImage(req.file, 'hpw-pool/trainees/avatars');
      req.body.avatar = avatarResult.url;
    }

    Object.assign(trainee, req.body);
    await trainee.save();

    res.json({
      success: true,
      message: 'Trainee profile updated successfully',
      data: trainee
    });
  } catch (error) {
    console.error('Update trainee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trainee profile',
      error: error.message
    });
  }
};

module.exports = {
  getTrainees,
  getTraineeById,
  createTrainee,
  updateTrainee
};

