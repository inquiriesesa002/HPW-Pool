// api/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// --------------------
// CORS - Allow all origins for Vercel compatibility
// --------------------
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "email",
    "password",
    "x-access-token"
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"]
}));

// --------------------
// Vercel Path Handling Middleware
// --------------------
// Vercel may strip /api prefix when routing to serverless function
// This middleware ensures paths always have /api prefix (except root)
app.use((req, res, next) => {
  const originalPath = req.path;
  const originalUrl = req.url;
  const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
  
  // Log incoming request for debugging
  console.log(`[Request] ${req.method} ${originalPath} | URL: ${originalUrl} | Headers:`, {
    'x-vercel-path': req.headers['x-vercel-path'],
    'x-invoke-path': req.headers['x-invoke-path'],
    'x-rewrite-url': req.headers['x-rewrite-url']
  });
  
  // Priority 1: Check Vercel-specific headers for original path
  const vercelPath = req.headers['x-vercel-path'] || req.headers['x-invoke-path'] || req.headers['x-rewrite-url'];
  if (vercelPath) {
    const cleanPath = vercelPath.split('?')[0];
    req.path = cleanPath;
    req.url = vercelPath;
    req.originalUrl = vercelPath;
    console.log(`[Vercel] Using path from header: ${req.method} ${originalPath} -> ${req.path}`);
    return next();
  }
  
  // Priority 2: Check if path already has /api prefix
  if (req.path.startsWith('/api') || req.path === '/') {
    console.log(`[Vercel] Path OK: ${req.method} ${req.path}`);
    return next();
  }
  
  // Priority 3: If path doesn't start with /api and it's not root, add /api prefix
  if (req.path !== '/' && !req.path.startsWith('/api')) {
    req.path = '/api' + req.path;
    req.url = '/api' + req.url;
    req.originalUrl = '/api' + originalUrl;
    console.log(`[Vercel] Added /api prefix: ${req.method} ${originalPath} -> ${req.path}`);
  }
  
  next();
});

// --------------------
// Body parsers
// --------------------
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------------
// DB connection
// --------------------
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10 });
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    throw err;
  }
};

// --------------------
// Middleware: ensure DB connected
// --------------------
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }
  }
  next();
});

// --------------------
// Controllers
// --------------------
const { register, login, getMe } = require('./server/controllers/authController.cjs');
const { getContinents, getCountries, getProvinces, getCities } = require('./server/controllers/locationController.cjs');
const { getProfessions, getProfession, createProfession, updateProfession, deleteProfession } = require('./server/controllers/professionController.cjs');
const { getProfessionals, getProfessional, createProfessional, updateProfessional, getStats, uploadCV } = require('./server/controllers/professionalController.cjs');
const { getCompanies, getCompany, createCompany, updateCompany } = require('./server/controllers/companyController.cjs');
const { getJobs, getJob, createJob, updateJob, applyToJob, downloadCV } = require('./server/controllers/jobController.cjs');
const { getTrainees, getTrainee, createTrainee, updateTrainee } = require('./server/controllers/traineeController.js');
const { getUsers, deleteUser, verifyProfessional, getAllProfessionals, deleteProfessional, getAllCompanies, verifyCompany, deleteCompany, getAllJobs, deleteJob, getLocations, createContinent, updateContinent, deleteContinent, createCountry, bulkCreateCountries, updateCountry, deleteCountry, getProfessions: getAdminProfessions, seedProfessions, getAdminStats } = require('./server/controllers/adminController.cjs');

// Middleware
const { protect, authorize } = require('./server/middleware/auth.cjs');
const { uploadCV: cvUploadMiddleware, uploadProfileImage, uploadLogo, uploadJobImage } = require('./server/middleware/upload.cjs');
const Professional = require('./server/models/Professional.cjs');

// --------------------
// Routes
// --------------------

// Root redirect to frontend
const FRONTEND_URL = process.env.FRONTEND_URL || "https://atsjourney.com";
app.get("/", (req, res) => res.redirect(FRONTEND_URL));

// Auth
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', protect, getMe);

// Locations
app.get('/api/locations/continents', getContinents);
app.get('/api/locations/countries', getCountries);
app.get('/api/locations/provinces', getProvinces);
app.get('/api/locations/cities', getCities);

// Professions
app.get('/api/professions', getProfessions);
app.get('/api/professions/:id', getProfession);
app.post('/api/professions', protect, authorize('admin'), createProfession);
app.put('/api/professions/:id', protect, authorize('admin'), updateProfession);
app.delete('/api/professions/:id', protect, authorize('admin'), deleteProfession);

// Professionals
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
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Companies
app.get('/api/companies', getCompanies);
app.get('/api/companies/:id', getCompany);
app.post('/api/companies', protect, createCompany);
app.put('/api/companies/:id', protect, updateCompany);

// Jobs
app.get('/api/jobs', getJobs);
app.get('/api/jobs/:id', getJob);
app.post('/api/jobs', protect, uploadJobImage, createJob);
app.put('/api/jobs/:id', protect, uploadJobImage, updateJob);
app.post('/api/jobs/apply', protect, applyToJob);
app.get('/api/jobs/cv/download', protect, downloadCV);

// Trainees
app.get('/api/trainees', getTrainees);
app.get('/api/trainees/:id', getTrainee);
app.post('/api/trainees', protect, createTrainee);
app.put('/api/trainees/:id', protect, updateTrainee);

// Uploads
app.post('/api/upload/cv', protect, uploadCV, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, filePath: req.file.cloudinaryUrl || `/uploads/cvs/${req.file.filename}`, fileName: req.file.originalname });
});
app.post('/api/upload/profile-image', protect, uploadProfileImage, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, filePath: req.file.cloudinaryUrl || `/uploads/profile-images/${req.file.filename}`, fileName: req.file.originalname });
});
app.post('/api/upload/logo', protect, uploadLogo, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, filePath: req.file.cloudinaryUrl || `/uploads/company-logos/${req.file.filename}`, fileName: req.file.originalname });
});

// Admin
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'Vercel' : 'Local'
  });
});

// API root
app.get('/api', (req, res) => {
  res.json({ success: true, message: 'HPW Pool API' });
});

// Debug route to test Vercel routing
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Debug route working',
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    method: req.method,
    headers: {
      'x-vercel-path': req.headers['x-vercel-path'],
      'x-invoke-path': req.headers['x-invoke-path'],
      'x-rewrite-url': req.headers['x-rewrite-url']
    }
  });
});

// Catch-all 404 (no '*' route)
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ success: false, message: 'Route not found', path: req.path });
});

// --------------------
// Local development
// --------------------
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    connectDB().catch(err => console.error('DB connection failed:', err));
  });
}

// Export for Vercel
module.exports = app;
