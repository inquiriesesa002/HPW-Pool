// api/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const serverless = require('serverless-http');

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
const { register, login, getMe } = require('./controllers/authController.cjs');
const { getContinents, getCountries, getProvinces, getCities } = require('./controllers/locationController.cjs');
const { getProfessions, getProfession, createProfession, updateProfession, deleteProfession } = require('./controllers/professionController.cjs');
const { getProfessionals, getProfessional, createProfessional, updateProfessional, getStats, uploadCV } = require('./controllers/professionalController.cjs');
const { getCompanies, getCompany, createCompany, updateCompany } = require('./controllers/companyController.cjs');
const { getJobs, getJob, createJob, updateJob, applyToJob, downloadCV } = require('./controllers/jobController.cjs');
const { getTrainees, getTrainee, createTrainee, updateTrainee } = require('./controllers/traineeController.js');
const { getUsers, deleteUser, verifyProfessional, getAllProfessionals, deleteProfessional, getAllCompanies, verifyCompany, deleteCompany, getAllJobs, deleteJob, getLocations, createContinent, updateContinent, deleteContinent, createCountry, bulkCreateCountries, updateCountry, deleteCountry, getProfessions: getAdminProfessions, seedProfessions, getAdminStats } = require('./controllers/adminController.cjs');

// --- IMPORT MIDDLEWARE ---
const { protect, authorize } = require('./middleware/auth.cjs');
const { uploadCV: cvUploadMiddleware, uploadProfileImage, uploadLogo, uploadJobImage } = require('./middleware/upload.cjs');
const Professional = require('./models/Professional.cjs');

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
app.use('/api/admin', protect, authorize('admin'));
app.get('/api/admin/stats', getAdminStats);
app.get('/api/admin/users', getUsers);
app.delete('/api/admin/users/:id', deleteUser);
app.get('/api/admin/professionals', getAllProfessionals);
app.put('/api/admin/professionals/:id/verify', verifyProfessional);
app.delete('/api/admin/professionals/:id', deleteProfessional);
app.get('/api/admin/companies', getAllCompanies);
app.put('/api/admin/companies/:id/verify', verifyCompany);
app.delete('/api/admin/companies/:id', deleteCompany);
app.get('/api/admin/jobs', getAllJobs);
app.delete('/api/admin/jobs/:id', deleteJob);
app.get('/api/admin/locations', getLocations);
app.post('/api/admin/continents', createContinent);
app.put('/api/admin/continents/:id', updateContinent);
app.delete('/api/admin/continents/:id', deleteContinent);
app.post('/api/admin/countries', createCountry);
app.post('/api/admin/countries/bulk', bulkCreateCountries);
app.put('/api/admin/countries/:id', updateCountry);
app.delete('/api/admin/countries/:id', deleteCountry);
app.get('/api/admin/professions', getAdminProfessions);
app.post('/api/admin/seed-professions', seedProfessions);

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
module.exports = serverless(app);
