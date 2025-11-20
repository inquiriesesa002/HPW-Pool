const User = require('../models/User');
const Professional = require('../models/Professional');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Continent = require('../models/Continent');
const Country = require('../models/Country');
const Province = require('../models/Province');
const City = require('../models/City');
const Profession = require('../models/Profession');

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting admin
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify/Reject professional
exports.verifyProfessional = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const professional = await Professional.findById(req.params.id);
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    if (action === 'approve') {
      professional.isVerified = true;
      await professional.save();
      
      res.json({
        success: true,
        message: 'Professional verified successfully',
        data: professional
      });
    } else if (action === 'reject') {
      professional.isVerified = false;
      await professional.save();

    res.json({
      success: true,
        message: 'Professional verification rejected',
        data: professional
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all professionals (admin view)
exports.getAllProfessionals = async (req, res) => {
  try {
    const professionals = await Professional.find({})
      .populate('profession', 'name category')
      .populate('city', 'name')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
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

// Delete professional
exports.deleteProfessional = async (req, res) => {
  try {
    await Professional.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Professional deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
        success: false,
      message: error.message
    });
  }
};

// Get all companies (admin view)
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find({})
      .populate('city', 'name')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify company
exports.verifyCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    company.isVerified = true;
    await company.save();
    
    res.json({
      success: true,
      message: 'Company verified successfully',
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete company
exports.deleteCompany = async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all jobs (admin view)
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({})
      .populate('company', 'name')
      .populate('profession', 'name')
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete job
exports.deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
        success: false,
      message: error.message
    });
  }
};

// Location Management
exports.getLocations = async (req, res) => {
  try {
    const continents = await Continent.find({});
    const countries = await Country.find({}).populate('continent', 'name');
    const provinces = await Province.find({}).populate('country', 'name');
    const cities = await City.find({}).populate('province', 'name');

    res.json({
      success: true,
      data: {
        continents,
        countries,
        provinces,
        cities
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create Continent
exports.createContinent = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    
    const continent = await Continent.create({
      name,
      code: code || name.substring(0, 2).toUpperCase(),
      description: description || ''
    });
    
    res.status(201).json({
      success: true,
      message: 'Continent created successfully',
      data: continent
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Continent already exists'
      });
    }
    res.status(500).json({
        success: false,
      message: error.message
    });
  }
};

// Update Continent
exports.updateContinent = async (req, res) => {
  try {
    const continent = await Continent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!continent) {
      return res.status(404).json({
        success: false,
        message: 'Continent not found'
      });
    }

    res.json({
      success: true,
      message: 'Continent updated successfully',
      data: continent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Continent
exports.deleteContinent = async (req, res) => {
  try {
    const continent = await Continent.findById(req.params.id);
    
    if (!continent) {
      return res.status(404).json({
        success: false,
        message: 'Continent not found'
      });
    }

    // Check if countries exist
    const countriesCount = await Country.countDocuments({ continent: req.params.id });
    if (countriesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete continent. ${countriesCount} countries are associated with it.`
      });
    }

    await Continent.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Continent deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create Country
exports.createCountry = async (req, res) => {
  try {
    const { name, code, continent, flag, population, healthcareIndex } = req.body;
    
    if (!continent) {
      return res.status(400).json({
        success: false,
        message: 'Continent is required'
      });
    }

    const country = await Country.create({
      name,
      code: code || name.substring(0, 2).toUpperCase(),
      continent,
      flag: flag || '',
      population: population || 0,
      healthcareIndex: healthcareIndex || 0
    });

    res.status(201).json({
      success: true,
      message: 'Country created successfully',
      data: country
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Country already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Bulk Create Countries
exports.bulkCreateCountries = async (req, res) => {
  try {
    const { countries } = req.body; // Array of country objects
    
    if (!Array.isArray(countries) || countries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Countries array is required'
      });
    }

    const created = [];
    const errors = [];

    for (const countryData of countries) {
      try {
        const country = await Country.create(countryData);
        created.push(country);
      } catch (error) {
        errors.push({
          country: countryData.name,
          error: error.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Created ${created.length} countries`,
      data: {
        created: created.length,
        errors: errors.length,
        details: {
          created,
          errors
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Country
exports.updateCountry = async (req, res) => {
  try {
    const country = await Country.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    res.json({
      success: true,
      message: 'Country updated successfully',
      data: country
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Country
exports.deleteCountry = async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);
    
    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    // Check if provinces exist
    const provincesCount = await Province.countDocuments({ country: req.params.id });
    if (provincesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete country. ${provincesCount} provinces are associated with it.`
      });
    }

    await Country.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Country deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Profession Management
exports.getProfessions = async (req, res) => {
  try {
    const professions = await Profession.find({}).sort({ order: 1 });
    
    res.json({
      success: true,
      count: professions.length,
      data: professions
    });
  } catch (error) {
    res.status(500).json({
        success: false,
      message: error.message
    });
  }
};

// Seed Professions
exports.seedProfessions = async (req, res) => {
  try {
    const professionsData = [
      // Medical Professionals
      { name: 'Physicians (Doctors)', category: 'Medical Professionals', subcategory: 'General Practice', icon: '👨‍⚕️', description: 'General medical practitioners providing primary healthcare', order: 1 },
      { name: 'Surgeons', category: 'Medical Professionals', subcategory: 'Surgery', icon: '⚕️', description: 'Specialized doctors performing surgical procedures', order: 2 },
      { name: 'Dentists', category: 'Medical Professionals', subcategory: 'Dental', icon: '🦷', description: 'Oral health specialists providing dental care', order: 3 },
      { name: 'Pharmacists', category: 'Medical Professionals', subcategory: 'Pharmacy', icon: '💊', description: 'Medication experts managing prescriptions and drug therapy', order: 4 },
      { name: 'Nurses (RN)', category: 'Medical Professionals', subcategory: 'Registered Nurse', icon: '👩‍⚕️', description: 'Registered nurses providing patient care', order: 5 },
      { name: 'Nurses (LPN)', category: 'Medical Professionals', subcategory: 'Licensed Practical Nurse', icon: '👩‍⚕️', description: 'Licensed practical nurses assisting in patient care', order: 6 },
      { name: 'Midwives', category: 'Medical Professionals', subcategory: 'Maternity', icon: '🤱', description: 'Healthcare providers specializing in pregnancy and childbirth', order: 7 },
      { name: 'Psychiatrists', category: 'Medical Professionals', subcategory: 'Mental Health', icon: '🧠', description: 'Medical doctors specializing in mental health disorders', order: 8 },
      { name: 'Anesthesiologists', category: 'Medical Professionals', subcategory: 'Anesthesia', icon: '💉', description: 'Specialists managing anesthesia during medical procedures', order: 9 },
      
      // Allied Health Professionals
      { name: 'Physical Therapists', category: 'Allied Health Professionals', subcategory: 'Therapy', icon: '🏃', description: 'Therapists helping patients recover movement and function', order: 1 },
      { name: 'Occupational Therapists', category: 'Allied Health Professionals', subcategory: 'Therapy', icon: '🖐️', description: 'Therapists helping patients with daily living activities', order: 2 },
      { name: 'Speech-Language Pathologists', category: 'Allied Health Professionals', subcategory: 'Therapy', icon: '🗣️', description: 'Specialists treating communication and swallowing disorders', order: 3 },
      { name: 'Respiratory Therapists', category: 'Allied Health Professionals', subcategory: 'Respiratory', icon: '🫁', description: 'Specialists managing breathing and respiratory conditions', order: 4 },
      { name: 'Radiologic Technologists', category: 'Allied Health Professionals', subcategory: 'Radiology', icon: '📷', description: 'Technicians operating medical imaging equipment', order: 5 },
      { name: 'Medical Laboratory Technologists', category: 'Allied Health Professionals', subcategory: 'Laboratory', icon: '🔬', description: 'Scientists analyzing medical samples and test results', order: 6 },
      { name: 'Dietitians', category: 'Allied Health Professionals', subcategory: 'Nutrition', icon: '🥗', description: 'Nutrition experts providing dietary guidance and meal planning', order: 7 },
      
      // Mental Health Professionals
      { name: 'Psychologists', category: 'Mental Health Professionals', subcategory: 'Psychology', icon: '🧘', description: 'Mental health professionals providing therapy and counseling', order: 1 },
      { name: 'Counselors', category: 'Mental Health Professionals', subcategory: 'Counseling', icon: '💬', description: 'Therapists providing guidance and emotional support', order: 2 },
      { name: 'Social Workers', category: 'Mental Health Professionals', subcategory: 'Social Work', icon: '🤝', description: 'Professionals helping individuals and families with social issues', order: 3 },
      { name: 'Mental Health Nurses', category: 'Mental Health Professionals', subcategory: 'Nursing', icon: '👩‍⚕️', description: 'Nurses specializing in psychiatric and mental health care', order: 4 },
      { name: 'Psychiatric Technicians', category: 'Mental Health Professionals', subcategory: 'Support', icon: '🛡️', description: 'Support staff assisting in mental health facilities', order: 5 },
      
      // Support Staff
      { name: 'Medical Assistants', category: 'Support Staff', subcategory: 'Clinical Support', icon: '📋', description: 'Healthcare workers assisting with clinical and administrative tasks', order: 1 },
      { name: 'Nursing Assistants', category: 'Support Staff', subcategory: 'Nursing Support', icon: '👨‍⚕️', description: 'Caregivers providing basic patient care under nurse supervision', order: 2 },
      { name: 'Pharmacy Technicians', category: 'Support Staff', subcategory: 'Pharmacy Support', icon: '💊', description: 'Support staff assisting pharmacists with medication preparation', order: 3 },
      { name: 'Medical Records Clerks', category: 'Support Staff', subcategory: 'Administrative', icon: '📁', description: 'Administrative staff managing patient records and documentation', order: 4 },
      { name: 'Billing Specialists', category: 'Support Staff', subcategory: 'Administrative', icon: '💰', description: 'Administrative staff handling medical billing and insurance claims', order: 5 },
      
      // Specialized Health Professionals
      { name: 'Cardiologists', category: 'Specialized Professionals', subcategory: 'Cardiology', icon: '❤️', description: 'Heart specialists diagnosing and treating cardiovascular diseases', order: 1 },
      { name: 'Oncologists', category: 'Specialized Professionals', subcategory: 'Oncology', icon: '🎗️', description: 'Cancer specialists providing diagnosis and treatment', order: 2 },
      { name: 'Neonatologists', category: 'Specialized Professionals', subcategory: 'Neonatology', icon: '👶', description: 'Specialists caring for newborn infants, especially premature or ill babies', order: 3 },
      { name: 'Pediatricians', category: 'Specialized Professionals', subcategory: 'Pediatrics', icon: '👨‍⚕️', description: 'Doctors specializing in children\'s health and development', order: 4 },
      { name: 'Geriatricians', category: 'Specialized Professionals', subcategory: 'Geriatrics', icon: '👴', description: 'Specialists focusing on healthcare for elderly patients', order: 5 },
      { name: 'Orthopedic Surgeons', category: 'Specialized Professionals', subcategory: 'Orthopedics', icon: '🦴', description: 'Surgeons specializing in bone, joint, and muscle conditions', order: 6 },
      { name: 'Ophthalmologists', category: 'Specialized Professionals', subcategory: 'Ophthalmology', icon: '👁️', description: 'Eye specialists providing comprehensive eye care and surgery', order: 7 },
      { name: 'Otolaryngologists', category: 'Specialized Professionals', subcategory: 'ENT', icon: '👂', description: 'Ear, nose, and throat specialists treating head and neck conditions', order: 8 },
      
      // Alternative Medicine Practitioners
      { name: 'Acupuncturists', category: 'Alternative Medicine', subcategory: 'Traditional Medicine', icon: '📍', description: 'Practitioners using acupuncture for pain relief and healing', order: 1 },
      { name: 'Chiropractors', category: 'Alternative Medicine', subcategory: 'Manual Therapy', icon: '🦴', description: 'Specialists treating musculoskeletal disorders through spinal adjustments', order: 2 },
      { name: 'Herbalists', category: 'Alternative Medicine', subcategory: 'Herbal Medicine', icon: '🌿', description: 'Practitioners using plant-based remedies for healing', order: 3 },
      { name: 'Homeopaths', category: 'Alternative Medicine', subcategory: 'Homeopathy', icon: '💧', description: 'Practitioners using homeopathic remedies for treatment', order: 4 },
      { name: 'Naturopaths', category: 'Alternative Medicine', subcategory: 'Naturopathy', icon: '🌱', description: 'Natural medicine practitioners focusing on holistic healing', order: 5 }
    ];

    // Check if professions already exist
    const existingCount = await Profession.countDocuments();
    if (existingCount > 0) {
      // Update existing or insert new
      for (const prof of professionsData) {
        await Profession.findOneAndUpdate(
          { name: prof.name },
          prof,
          { upsert: true, new: true }
        );
      }
    } else {
      // Insert all if database is empty
      await Profession.insertMany(professionsData);
    }

    const totalCount = await Profession.countDocuments();
    
    res.json({
      success: true,
      message: 'Professions seeded successfully',
      count: totalCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get admin stats
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalProfessionals = await Professional.countDocuments({});
    const verifiedProfessionals = await Professional.countDocuments({ isVerified: true });
    const totalCompanies = await Company.countDocuments({});
    const totalJobs = await Job.countDocuments({});
    const totalCountries = await Country.countDocuments({});

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProfessionals,
        verifiedProfessionals,
        pendingVerifications: totalProfessionals - verifiedProfessionals,
        totalCompanies,
        totalJobs,
        totalCountries
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

