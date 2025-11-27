const mongoose = require('mongoose');
const Professional = require('../models/Professional.cjs');
const Message = require('../models/Message.cjs');
const { uploadImage, uploadDocument } = require('../middleware/upload.cjs');

// Get all professionals with filters
const getProfessionals = async (req, res) => {
  try {
    const {
      profession,
      continent,
      country,
      province,
      city,
      minExperience,
      minRating,
      verified,
      search
    } = req.query;

    const query = {};

    if (profession) {
      if (mongoose.Types.ObjectId.isValid(profession)) {
        query.profession = new mongoose.Types.ObjectId(profession);
      } else {
        query.profession = profession;
      }
    }
    if (continent) {
      if (mongoose.Types.ObjectId.isValid(continent)) {
        query['location.continent'] = new mongoose.Types.ObjectId(continent);
      } else {
        query['location.continent'] = continent;
      }
    }
    if (country) {
      if (mongoose.Types.ObjectId.isValid(country)) {
        query['location.country'] = new mongoose.Types.ObjectId(country);
      } else {
        query['location.country'] = country;
      }
    }
    if (province) {
      if (mongoose.Types.ObjectId.isValid(province)) {
        query['location.province'] = new mongoose.Types.ObjectId(province);
      } else {
        query['location.province'] = province;
      }
    }
    if (city) {
      if (mongoose.Types.ObjectId.isValid(city)) {
        query['location.city'] = new mongoose.Types.ObjectId(city);
      } else {
        query['location.city'] = city;
      }
    }
    if (minExperience) query.experience = { $gte: parseInt(minExperience) };
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (verified !== undefined) query.isVerified = verified === 'true';

    const listedOnly = req.query.listedOnly === 'true';
    if (listedOnly) {
      query.isCardPosted = true;
    }

    if (req.query.isCardPosted !== undefined && !listedOnly) {
      query.isCardPosted = req.query.isCardPosted === 'true';
    }

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

    // Set no-cache headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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
    // Use lean() to get plain JavaScript object and bypass Mongoose caching
    // Also add a fresh query by checking if refresh parameter is present
    const refresh = req.query.refresh === '1' || req.query.t;
    
    console.log(`[GET] /api/professionals/${req.params.id} - Refresh: ${refresh}`);
    
    const professional = await Professional.findById(req.params.id)
      .lean() // Get plain object, not Mongoose document (bypasses internal caching)
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

    // Set no-cache headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Last-Modified', new Date().toUTCString());
    res.setHeader('ETag', `"${Date.now()}-${Math.random()}"`);
    
    console.log(`[GET] Returning professional: ${professional.name} (ID: ${professional._id})`);

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

// Update professional profile (or create if doesn't exist)
const updateProfessional = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    console.log('Update professional - User ID:', userId);
    console.log('Update professional - Request body keys:', Object.keys(req.body));
    console.log('Update professional - Has file:', !!req.file);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found'
      });
    }
    
    // Convert to ObjectId if it's a string
    let userObjectId = userId;
    try {
      if (userId && !(userId instanceof mongoose.Types.ObjectId)) {
        if (mongoose.Types.ObjectId.isValid(userId)) {
          userObjectId = new mongoose.Types.ObjectId(userId);
        }
      }
    } catch (e) {
      console.error('Error converting userId to ObjectId:', e);
      // Keep original userId if conversion fails
    }
    
    // Try to find professional with user ID
    let professional = await Professional.findOne({ user: userObjectId });

    // If not found, try with string comparison
    if (!professional) {
      professional = await Professional.findOne({ 
        $or: [
          { user: userId },
          { user: userId?.toString() },
          { user: req.user._id },
          { user: req.user.id }
        ]
      });
    }

    // If professional doesn't exist, create a new one
    if (!professional) {
      // Try one more time with just the ID
      professional = await Professional.findOne({ user: userId });

    if (!professional) {
        // Create new professional profile
        const professionalData = { ...req.body, user: userId };
        
        // Validate required fields before creating
        if (!professionalData.name || professionalData.name.trim() === '') {
          return res.status(400).json({
            success: false,
            message: 'Name is required'
          });
        }
        
        if (!professionalData.email || professionalData.email.trim() === '') {
          return res.status(400).json({
            success: false,
            message: 'Email is required'
          });
        }
        
        if (!professionalData.profession || professionalData.profession === '' || !mongoose.Types.ObjectId.isValid(professionalData.profession)) {
          return res.status(400).json({
        success: false,
            message: 'Valid profession is required. Please select a profession.'
          });
        }
        
        // Handle avatar upload if provided
        if (req.file && req.file.fieldname === 'avatar') {
          const avatarResult = await uploadImage(req.file, 'hpw-pool/professionals/avatars');
          professionalData.avatar = avatarResult.url;
          professionalData.photo = avatarResult.url;
        }
        
        // Remove empty strings for optional fields
        Object.keys(professionalData).forEach(key => {
          if (professionalData[key] === '' && key !== 'name' && key !== 'email' && key !== 'phone' && key !== 'city' && key !== 'profession' && key !== 'user') {
            delete professionalData[key];
          }
        });
        
        // Parse JSON strings from FormData for new profile
        if (typeof professionalData.languages === 'string' && professionalData.languages) {
          try {
            professionalData.languages = JSON.parse(professionalData.languages);
          } catch (e) {
            professionalData.languages = [];
          }
        } else if (!professionalData.languages) {
          professionalData.languages = [];
        }
        
        if (typeof professionalData.specialties === 'string' && professionalData.specialties) {
          try {
            professionalData.specialties = JSON.parse(professionalData.specialties);
          } catch (e) {
            professionalData.specialties = [];
          }
        } else if (!professionalData.specialties) {
          professionalData.specialties = [];
        }
        
        if (typeof professionalData.skills === 'string' && professionalData.skills) {
          try {
            professionalData.skills = JSON.parse(professionalData.skills);
          } catch (e) {
            professionalData.skills = [];
          }
        } else if (!professionalData.skills) {
          professionalData.skills = [];
        }
        
        if (typeof professionalData.education === 'string' && professionalData.education) {
          try {
            professionalData.education = JSON.parse(professionalData.education);
          } catch (e) {
            professionalData.education = [];
          }
        } else if (!professionalData.education) {
          professionalData.education = [];
        }
        
        if (typeof professionalData.qualifications === 'string' && professionalData.qualifications) {
          try {
            professionalData.qualifications = JSON.parse(professionalData.qualifications);
          } catch (e) {
            professionalData.qualifications = [];
          }
        } else if (!professionalData.qualifications) {
          professionalData.qualifications = [];
        }
        
        // Convert string numbers to numbers
        if (professionalData.experience !== undefined && professionalData.experience !== null) {
          professionalData.experience = parseInt(professionalData.experience) || 0;
        }
        if (professionalData.isAvailable !== undefined) {
          professionalData.isAvailable = professionalData.isAvailable === 'true' || professionalData.isAvailable === true || professionalData.isAvailable === '1';
        }
        
        // Validate location ObjectIds
        const locationFields = ['continent', 'country', 'province', 'city'];
        locationFields.forEach(field => {
          if (professionalData[field] === '' || professionalData[field] === null || professionalData[field] === undefined) {
            delete professionalData[field];
          } else if (professionalData[field] && !mongoose.Types.ObjectId.isValid(professionalData[field])) {
            console.warn(`Invalid ${field} ID:`, professionalData[field]);
            delete professionalData[field];
          }
        });
        
        console.log('Creating professional with data:', {
          name: professionalData.name,
          email: professionalData.email,
          profession: professionalData.profession,
          hasProfession: !!professionalData.profession
        });
        
        professional = new Professional(professionalData);
        
        try {
          await professional.save();
        } catch (saveError) {
          console.error('Create professional save error:', saveError);
          if (saveError.name === 'ValidationError') {
            const validationErrors = Object.keys(saveError.errors || {}).map(key => ({
              field: key,
              message: saveError.errors[key].message
            }));
            return res.status(400).json({
              success: false,
              message: 'Validation error: ' + (validationErrors[0]?.message || saveError.message),
              errors: validationErrors
            });
          }
          throw saveError;
        }
        
        // Populate related fields before sending response
        try {
          await professional.populate([
            { path: 'profession', select: 'name category' },
            { path: 'location.continent', select: 'name' },
            { path: 'location.country', select: 'name code' },
            { path: 'location.province', select: 'name' },
            { path: 'location.city', select: 'name' }
          ]);
        } catch (populateError) {
          console.warn('Error populating professional fields:', populateError);
        }
        
        return res.status(201).json({
          success: true,
          message: 'Professional profile created successfully',
          data: professional
        });
      }
    }

    // Handle avatar upload if provided
    if (req.file && req.file.fieldname === 'avatar') {
      const avatarResult = await uploadImage(req.file, 'hpw-pool/professionals/avatars');
      req.body.avatar = avatarResult.url;
      req.body.photo = avatarResult.url; // Also set photo for backward compatibility
    }

    // Parse JSON strings from FormData
    const updateData = { ...req.body };
    
    // Remove empty strings and convert to null/undefined for optional fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' && key !== 'name' && key !== 'email' && key !== 'phone' && key !== 'city' && key !== 'profession') {
        delete updateData[key];
      }
    });
    
    // Handle location fields - convert flat fields to nested location object
    const locationFields = ['continent', 'country', 'province', 'city'];
    const locationData = {};
    
    locationFields.forEach(field => {
      if (updateData[field] !== undefined && updateData[field] !== '' && updateData[field] !== null) {
        if (mongoose.Types.ObjectId.isValid(updateData[field])) {
          locationData[field] = updateData[field];
        } else {
          console.warn(`Invalid ${field} ID:`, updateData[field]);
        }
      }
      // Remove flat field from updateData
      delete updateData[field];
    });
    
    // Assign location data to nested location object if any location fields were provided
    if (Object.keys(locationData).length > 0) {
      updateData.location = { ...(professional?.location || {}), ...locationData };
    }
    
    // Handle address separately if provided
    if (updateData.address !== undefined) {
      if (!updateData.location) {
        updateData.location = { ...(professional?.location || {}) };
      }
      updateData.location.address = updateData.address;
      delete updateData.address;
    }
    
    // Parse and normalize languages - ensure they're in correct format
    if (typeof updateData.languages === 'string' && updateData.languages) {
      try {
        updateData.languages = JSON.parse(updateData.languages);
      } catch (e) {
        // If parsing fails, treat as empty array
        updateData.languages = [];
      }
    } else if (!updateData.languages) {
      updateData.languages = [];
    }
    
    // Normalize languages to ensure they're objects with language and proficiency
    if (Array.isArray(updateData.languages)) {
      updateData.languages = updateData.languages.map(lang => {
        if (typeof lang === 'string') {
          // Convert string to object format
          return { language: lang, proficiency: 'Basic' };
        } else if (typeof lang === 'object' && lang !== null) {
          // Ensure object has required fields
          return {
            language: lang.language || lang.name || '',
            proficiency: lang.proficiency || 'Basic'
          };
        }
        return null;
      }).filter(lang => lang !== null && lang.language); // Remove null/invalid entries
    } else {
      updateData.languages = [];
    }
    
    if (typeof updateData.specialties === 'string' && updateData.specialties) {
      try {
        updateData.specialties = JSON.parse(updateData.specialties);
      } catch (e) {
        updateData.specialties = [];
      }
    } else if (!updateData.specialties) {
      updateData.specialties = [];
    }
    
    if (typeof updateData.skills === 'string' && updateData.skills) {
      try {
        updateData.skills = JSON.parse(updateData.skills);
      } catch (e) {
        updateData.skills = [];
      }
    } else if (!updateData.skills) {
      updateData.skills = [];
    }
    
    if (typeof updateData.education === 'string' && updateData.education) {
      try {
        updateData.education = JSON.parse(updateData.education);
      } catch (e) {
        updateData.education = [];
      }
    } else if (!updateData.education) {
      updateData.education = [];
    }
    
    if (typeof updateData.qualifications === 'string' && updateData.qualifications) {
      try {
        updateData.qualifications = JSON.parse(updateData.qualifications);
      } catch (e) {
        updateData.qualifications = [];
      }
    } else if (!updateData.qualifications) {
      updateData.qualifications = [];
    }

    // Convert string numbers to numbers
    if (updateData.experience !== undefined && updateData.experience !== null) {
      updateData.experience = parseInt(updateData.experience) || 0;
    }
    
    if (updateData.isAvailable !== undefined) {
      updateData.isAvailable = updateData.isAvailable === 'true' || updateData.isAvailable === true || updateData.isAvailable === '1';
    }

    // Don't update user field
    delete updateData.user;
    
    // Handle profession field - ensure it's a valid ObjectId or remove if empty
    if (!updateData.profession || updateData.profession === '' || updateData.profession === null || updateData.profession === undefined) {
      // If profession is required and not provided, keep existing one
      if (professional && professional.profession) {
        delete updateData.profession;
      } else {
        // If no existing profession and creating new, this will cause validation error - return error
        return res.status(400).json({
          success: false,
          message: 'Profession is required. Please select a profession.'
        });
      }
    } else if (updateData.profession && !mongoose.Types.ObjectId.isValid(updateData.profession)) {
      console.warn('Invalid profession ID:', updateData.profession);
      // If invalid, keep existing profession or return error if creating new
      if (professional && professional.profession) {
        delete updateData.profession;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid profession selected. Please select a valid profession.'
        });
      }
    }
    
    // Ensure professional exists before updating
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found. Please create your profile first.'
      });
    }
    
    // Only validate required fields if they're being updated
    // For partial updates (like CV deletion), skip required field validation
    const isCVOnlyUpdate = (updateData.cv !== undefined || updateData.cvFileName !== undefined) && 
                           Object.keys(updateData).filter(key => key !== 'cv' && key !== 'cvFileName').length === 0;
    
    if (!isCVOnlyUpdate) {
      // Ensure required fields are present only if they're being updated
      if (updateData.name !== undefined && (!updateData.name || updateData.name.trim() === '')) {
        return res.status(400).json({
          success: false,
          message: 'Name is required'
        });
      }
      
      if (updateData.email !== undefined && (!updateData.email || updateData.email.trim() === '')) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }
    }
    
    // Log update data before assigning
    console.log('Update data keys:', Object.keys(updateData));
    console.log('Update data profession:', updateData.profession);
    console.log('Update data name:', updateData.name);
    console.log('Update data email:', updateData.email);
    console.log('Update data location:', updateData.location);
    
    // Log current professional data before update
    console.log('Current professional - name:', professional.name);
    console.log('Current professional - email:', professional.email);
    console.log('Current professional - profession:', professional.profession);
    console.log('Current professional - location:', professional.location);
    
    // Prepare update object for MongoDB $set - use updateData directly
    const mongoUpdate = {};
    const unsetFields = {};
    
    // Handle CV deletion - if cv is empty string, unset the cv object
    if (updateData.cv === '' || updateData.cv === null || updateData.cv === undefined) {
      // Unset the entire cv object only (don't unset individual fields to avoid conflict)
      unsetFields['cv'] = '';
    }
    
    // Copy all fields from updateData except location and cv (we'll handle them separately)
    Object.keys(updateData).forEach(key => {
      if (key !== 'location' && key !== 'cv') {
        mongoUpdate[key] = updateData[key];
      }
    });
    
    // Handle location fields - flatten for MongoDB dot notation
    if (updateData.location) {
      if (updateData.location.continent) {
        mongoUpdate['location.continent'] = updateData.location.continent;
      }
      if (updateData.location.country) {
        mongoUpdate['location.country'] = updateData.location.country;
      }
      if (updateData.location.province) {
        mongoUpdate['location.province'] = updateData.location.province;
      }
      if (updateData.location.city) {
        mongoUpdate['location.city'] = updateData.location.city;
      }
      if (updateData.location.address !== undefined) {
        mongoUpdate['location.address'] = updateData.location.address;
      }
    }
    
    console.log('MongoDB update object:', JSON.stringify(mongoUpdate, null, 2));
    console.log('MongoDB update object keys:', Object.keys(mongoUpdate));
    
    try {
      console.log('Attempting to update professional in database...');
      console.log('Professional ID:', professional._id);
      
      // Build update query with $set and $unset
      const updateQuery = {};
      if (Object.keys(mongoUpdate).length > 0) {
        updateQuery.$set = mongoUpdate;
      }
      if (Object.keys(unsetFields).length > 0) {
        updateQuery.$unset = unsetFields;
      }
      
      // Use findOneAndUpdate for direct database update
      const updateResult = await Professional.findOneAndUpdate(
        { _id: professional._id },
        updateQuery,
        { 
          new: true, 
          runValidators: true,
          upsert: false
        }
      );
      
      if (!updateResult) {
        console.error('❌ findOneAndUpdate returned null - professional not found');
        console.error('❌ Professional ID used:', professional._id);
        return res.status(404).json({
          success: false,
          message: 'Professional profile not found'
        });
      }
      
      professional = updateResult;
      console.log('✅ Professional updated successfully using findOneAndUpdate');
      console.log('✅ Updated name:', professional.name);
      console.log('✅ Updated email:', professional.email);
      console.log('✅ Updated profession:', professional.profession);
      console.log('✅ Updated location:', JSON.stringify(professional.location, null, 2));
      
      // Verify the save by fetching from database again
      const verifyProfessional = await Professional.findById(professional._id);
      if (verifyProfessional) {
        console.log('✅ Verification - Database name:', verifyProfessional.name);
        console.log('✅ Verification - Database email:', verifyProfessional.email);
        console.log('✅ Verification - Database profession:', verifyProfessional.profession);
        console.log('✅ Verification - Database location:', JSON.stringify(verifyProfessional.location, null, 2));
        
        // Check if data actually changed
        if (verifyProfessional.name !== mongoUpdate.name) {
          console.warn('⚠️ WARNING: Name mismatch! Expected:', mongoUpdate.name, 'Got:', verifyProfessional.name);
        }
        if (verifyProfessional.email !== mongoUpdate.email) {
          console.warn('⚠️ WARNING: Email mismatch! Expected:', mongoUpdate.email, 'Got:', verifyProfessional.email);
        }
        
        professional = verifyProfessional;
      } else {
        console.error('❌ Verification failed - could not fetch from database');
      }
    } catch (saveError) {
      console.error('❌ Save error details:', saveError);
      console.error('❌ Save error name:', saveError.name);
      console.error('❌ Save error message:', saveError.message);
      console.error('❌ Save error stack:', saveError.stack);
      console.error('❌ Professional data before save:', {
        name: professional.name,
        email: professional.email,
        profession: professional.profession,
        hasProfession: !!professional.profession
      });
      console.error('❌ MongoDB update object that failed:', JSON.stringify(mongoUpdate, null, 2));
      
      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.keys(saveError.errors || {}).map(key => ({
          field: key,
          message: saveError.errors[key].message
        }));
        console.error('❌ Validation errors:', validationErrors);
        return res.status(400).json({
          success: false,
          message: 'Validation error: ' + (validationErrors[0]?.message || saveError.message),
          errors: validationErrors
        });
      }
      
      if (saveError.name === 'CastError') {
        console.error('❌ Cast error:', saveError.message);
        return res.status(400).json({
          success: false,
          message: 'Invalid data format: ' + saveError.message
        });
      }
      
      throw saveError;
    }

    // Populate related fields before sending response
    try {
      await professional.populate([
        { path: 'profession', select: 'name category' },
        { path: 'location.continent', select: 'name' },
        { path: 'location.country', select: 'name code' },
        { path: 'location.province', select: 'name' },
        { path: 'location.city', select: 'name' }
      ]);
    } catch (populateError) {
      console.warn('Error populating professional fields:', populateError);
    }

    res.json({
      success: true,
      message: 'Professional profile updated successfully',
      data: professional
    });
  } catch (error) {
    console.error('Update professional error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Request body keys:', Object.keys(req.body || {}));
    console.error('User ID:', req.user?._id || req.user?.id);
    
    // Return more specific error messages
    let errorMessage = 'Error updating professional profile';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + error.message;
      statusCode = 400;
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid data format: ' + error.message;
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Upload CV
const uploadCV = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Convert to ObjectId if it's a string
    let userObjectId;
    try {
      if (userId instanceof mongoose.Types.ObjectId) {
        userObjectId = userId;
      } else {
        userObjectId = new mongoose.Types.ObjectId(userId);
      }
    } catch (e) {
      // If conversion fails, try with string
      userObjectId = userId;
    }
    
    console.log('Upload CV - Looking for professional with user ID:', userObjectId);
    console.log('User ID type:', typeof userId, 'ObjectId type:', userObjectId instanceof mongoose.Types.ObjectId);
    
    // Try to find professional with user ID
    let professional = await Professional.findOne({ user: userObjectId });

    // If not found, try with string comparison
    if (!professional) {
      professional = await Professional.findOne({ 
        $or: [
          { user: userId },
          { user: userId?.toString() },
          { user: req.user._id },
          { user: req.user.id }
        ]
      });
    }

    if (!professional) {
      console.log('Professional not found. User ID:', userId, 'ObjectId:', userObjectId);
      console.log('User object:', { id: req.user.id, _id: req.user._id });
      
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found. Please create your professional profile first by going to "Set and Edit Profile".'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const cvResult = await uploadDocument(req.file, 'hpw-pool/professionals/cvs');
    
    // Store CV as object for detailed info
    professional.cv = {
      url: cvResult.url,
      public_id: cvResult.public_id,
      filename: req.file.originalname,
      uploadedAt: new Date()
    };
    
    // Also store as string URL for backward compatibility and cvFileName
    professional.cvFileName = req.file.originalname;

    await professional.save();

    res.json({
      success: true,
      message: 'CV uploaded successfully',
      filePath: professional.cv.url,
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

// Toggle whether a professional card is posted publicly
const toggleProfessionalCard = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { isCardPosted } = req.body;

    if (typeof isCardPosted !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isCardPosted must be a boolean'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found'
      });
    }

    // Find professional profile for authenticated user
    const professional = await Professional.findOne({ user: userId })
      .populate('profession', 'name category')
      .populate('location.city', 'name')
      .populate('location.country', 'name code')
      .populate('location.province', 'name')
      .populate('location.continent', 'name');

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    professional.isCardPosted = isCardPosted;
    professional.cardPostedAt = isCardPosted ? new Date() : null;

    await professional.save();

    res.json({
      success: true,
      message: isCardPosted
        ? 'Profile card posted to public search successfully.'
        : 'Profile card removed from public search.',
      data: professional
    });
  } catch (error) {
    console.error('Toggle professional card error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating card status',
      error: error.message
    });
  }
};

// Send message to professional
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, message } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if professional exists
    const professional = await Professional.findById(id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    // Create message
    const newMessage = new Message({
      professional: id,
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      message: message.trim()
    });

    await newMessage.save();

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Get messages for a professional
const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;

    // Verify professional exists and belongs to user
    const professional = await Professional.findById(id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    // Check if user owns this professional profile
    const professionalUserId = professional.user?._id || professional.user;
    if (userId && String(professionalUserId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await Message.find({ professional: id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// Mark message as read
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const message = await Message.findById(messageId).populate('professional');
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify user owns the professional profile
    const professionalUserId = message.professional.user?._id || message.professional.user;
    if (userId && String(professionalUserId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    message.read = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating message',
      error: error.message
    });
  }
};

// Mark message as unread
const markMessageAsUnread = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const message = await Message.findById(messageId).populate('professional');
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify user owns the professional profile
    const professionalUserId = message.professional.user?._id || message.professional.user;
    if (userId && String(professionalUserId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    message.read = false;
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as unread',
      data: message
    });
  } catch (error) {
    console.error('Mark message as unread error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating message',
      error: error.message
    });
  }
};

// Get current user's professional profile
const getCurrentProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const professional = await Professional.findOne({ user: userId })
      .populate('profession', 'name category')
      .populate('location.continent', 'name')
      .populate('location.country', 'name code')
      .populate('location.province', 'name')
      .populate('location.city', 'name')
      .populate('user', 'name email');

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    res.json({
      success: true,
      data: professional
    });
  } catch (error) {
    console.error('Get current profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
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
  uploadCV,
  toggleProfessionalCard,
  sendMessage,
  getMessages,
  markMessageAsRead,
  markMessageAsUnread,
  getCurrentProfile
};

