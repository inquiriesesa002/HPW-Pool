// api/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- DATABASE CONNECTION ---
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return; // already connected

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
};

// Middleware to ensure DB connection per request (serverless safe)
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error('DB connection failed in middleware:', err);
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }
  }
  next();
});

// --- IMPORT CONTROLLERS ---
const { register, login, getMe } = require('./server/controllers/authController.cjs');
const { getContinents, getCountries, getProvinces, getCities } = require('./server/controllers/locationController.cjs');
const { getProfessions, getProfession, createProfession, updateProfession, deleteProfession } = require('./server/controllers/professionController.cjs');
const { getProfessionals, getProfessional, createProfessional, updateProfessional, getStats, uploadCV } = require('./server/controllers/professionalController.cjs');
const { getCompanies, getCompany, createCompany, updateCompany } = require('./server/controllers/companyController.cjs');
const { getJobs, getJob, createJob, updateJob, applyToJob, downloadCV } = require('./server/controllers/jobController.cjs');
const { getTrainees, getTrainee, createTrainee, updateTrainee } = require('./server/controllers/traineeController.js');
const { getUsers, deleteUser, verifyProfessional, getAllProfessionals, deleteProfessional, getAllCompanies, verifyCompany, deleteCompany, getAllJobs, deleteJob, getLocations, createContinent, updateContinent, deleteContinent, createCountry, bulkCreateCountries, updateCountry, deleteCountry, getProfessions: getAdminProfessions, seedProfessions, getAdminStats } = require('./server/controllers/adminController.cjs');

// --- IMPORT MIDDLEWARE ---
const { protect, authorize } = require('./server/middleware/auth.cjs');
const { uploadCV: cvUploadMiddleware, uploadProfileImage, uploadLogo, uploadJobImage } = require('./server/middleware/upload.cjs');
const Professional = require('./server/models/Professional.cjs');

// ============================================
// --- ROUTES ---
// ============================================

// --- AUTH ---
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', protect, getMe);

// --- LOCATION ---
app.get('/api/locations/continents', getContinents);
app.get('/api/locations/countries', getCountries);
app.get('/api/locations/provinces', getProvinces);
app.get('/api/locations/cities', getCities);

// --- PROFESSION ---
app.get('/api/professions', getProfessions);
app.get('/api/professions/:id', getProfession);
app.post('/api/professions', protect, authorize('admin'), createProfession);
app.put('/api/professions/:id', protect, authorize('admin'), updateProfession);
app.delete('/api/professions/:id', protect, authorize('admin'), deleteProfession);

// --- PROFESSIONAL ---
app.get('/api/professionals/stats', getStats);
app.get('/api/professionals', getProfessionals);
app.get('/api/professionals/:id', getProfessional);
app.post('/api/professionals', protect, createProfessional);
app.put('/api/professionals/:id', protect, updateProfessional);
app.post('/api/professionals/upload-cv', protect, cvUploadMiddleware, uploadCV);
app.get('/api/professionals/:id/cv', protect, async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);
    if (!professional || !professional.cv) return res.status(404).json({ success: false, message: 'CV not found' });
    const cvPath = path.join(__dirname, '..', professional.cv);
    if (!fs.existsSync(cvPath)) return res.status(404).json({ success: false, message: 'CV file not found' });
    const fileName = professional.cvFileName || 'cv.pdf';
    res.download(cvPath, fileName);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- COMPANY ---
app.get('/api/companies', getCompanies);
app.get('/api/companies/:id', getCompany);
app.post('/api/companies', protect, createCompany);
app.put('/api/companies/:id', protect, updateCompany);

// --- JOB ---
app.get('/api/jobs', getJobs);
app.get('/api/jobs/:id', getJob);
app.post('/api/jobs', protect, uploadJobImage, createJob);
app.put('/api/jobs/:id', protect, uploadJobImage, updateJob);
app.post('/api/jobs/apply', protect, applyToJob);
app.get('/api/jobs/cv/download', protect, downloadCV);

// --- TRAINEE ---
app.get('/api/trainees', getTrainees);
app.get('/api/trainees/:id', getTrainee);
app.post('/api/trainees', protect, createTrainee);
app.put('/api/trainees/:id', protect, updateTrainee);

// --- UPLOAD ---
app.post('/api/upload/cv', protect, uploadCV, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const filePath = req.file.cloudinaryUrl || `/uploads/cvs/${req.file.filename}`;
  res.json({ success: true, message: 'CV uploaded', filePath, fileName: req.file.originalname });
});
app.post('/api/upload/profile-image', protect, uploadProfileImage, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const filePath = req.file.cloudinaryUrl || `/uploads/profile-images/${req.file.filename}`;
  res.json({ success: true, message: 'Profile image uploaded', filePath, fileName: req.file.originalname });
});
app.post('/api/upload/logo', protect, uploadLogo, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const filePath = req.file.cloudinaryUrl || `/uploads/company-logos/${req.file.filename}`;
  res.json({ success: true, message: 'Logo uploaded', filePath, fileName: req.file.originalname });
});

// --- ADMIN (all admin-protected) ---
app.get('/api/admin/stats', protect, authorize('admin'), getAdminStats);
app.get('/api/admin/users', protect, authorize('admin'), getUsers);
app.delete('/api/admin/users/:id', protect, authorize('admin'), deleteUser);
app.get('/api/admin/professionals', protect, authorize('admin'), getAllProfessionals);
app.put('/api/admin/professionals/:id/verify', protect, authorize('admin'), verifyProfessional);
app.delete('/api/admin/professionals/:id', protect, authorize('admin'), deleteProfessional);
app.get('/api/admin/companies', protect, authorize('admin'), getAllCompanies);
app.put('/api/admin/companies/:id/verify', protect, authorize('admin'), verifyCompany);
app.delete('/api/admin/companies/:id', protect, authorize('admin'), deleteCompany);
app.get('/api/admin/jobs', protect, authorize('admin'), getAllJobs);
app.delete('/api/admin/jobs/:id', protect, authorize('admin'), deleteJob);
app.get('/api/admin/locations', protect, authorize('admin'), getLocations);
app.post('/api/admin/continents', protect, authorize('admin'), createContinent);
app.put('/api/admin/continents/:id', protect, authorize('admin'), updateContinent);
app.delete('/api/admin/continents/:id', protect, authorize('admin'), deleteContinent);
app.post('/api/admin/countries', protect, authorize('admin'), createCountry);
app.post('/api/admin/countries/bulk', protect, authorize('admin'), bulkCreateCountries);
app.put('/api/admin/countries/:id', protect, authorize('admin'), updateCountry);
app.delete('/api/admin/countries/:id', protect, authorize('admin'), deleteCountry);
app.get('/api/admin/professions', protect, authorize('admin'), getAdminProfessions);
app.post('/api/admin/seed-professions', protect, authorize('admin'), seedProfessions);

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'Vercel' : 'Local'
  });
});

// --- API ROOT ---
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'HPW Pool API',
    endpoints: {
      auth: '/api/auth',
      locations: '/api/locations',
      professions: '/api/professions',
      professionals: '/api/professionals',
      companies: '/api/companies',
      jobs: '/api/jobs',
      trainees: '/api/trainees',
      upload: '/api/upload',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// --- SERVERLESS ROOT ---
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HPW Pool API - Serverless Function',
    endpoints: {
      api: '/api',
      health: '/api/health'
    }
  });
});

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!', error: err.message });
});

// --- 404 HANDLER ---
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found', path: req.path }));

// --- LOCAL DEVELOPMENT ---
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log(`🚀 HPW Pool Server running on port ${PORT}`);
    try { await connectDB(); } catch (error) { console.error('DB connection failed:', error); }
  });
}

// --- EXPORT FOR VERCEL ---
// Vercel automatically handles serverless functions
module.exports = app;
