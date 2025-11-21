// api/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
///////////////////////

// --- MIDDLEWARE ---
// CORS Configuration - Allow all origins
// CORS middleware automatically handles OPTIONS preflight requests
// --- CORS Middleware ---
const allowedOrigins = [
  "http://localhost:5173",      // local dev
  "https://atsjourney.com"      // deployed frontend
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like Postman or server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error("❌ CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,  // allow cookies
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
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






app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
///////////
// Attach io to req

/////////////
// Root should redirect to the deployed frontend if available
const FRONTEND_URL = process.env.FRONTEND_URL || "https://atsjourney.com";
app.get("/", (req, res) => {
  res.redirect(FRONTEND_URL);
});



// --- DATABASE CONNECTION ---
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return; // already connected
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
};

// Middleware to fix Vercel path forwarding issue
app.use((req, res, next) => {
  // Vercel serverless: When /api/jobs is requested, Vercel forwards to /api/index.js
  // But Express might receive path as /jobs (without /api prefix)
  
  // Get the actual path from various sources
  let targetPath = req.path;
  let targetUrl = req.url;
  
  // Don't modify if path is already /api or /
  if (targetPath === '/api' || targetPath === '/') {
    // Log for debugging
    console.log(`[${req.method}] Path: ${req.path}, URL: ${req.url}, OriginalUrl: ${req.originalUrl}`);
    return next();
  }
  
  // Priority: originalUrl > url > path > headers
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    targetPath = req.originalUrl.split('?')[0];
    targetUrl = req.originalUrl;
  } else if (req.url && req.url.startsWith('/api')) {
    targetPath = req.url.split('?')[0];
    targetUrl = req.url;
  } else if (req.headers['x-vercel-path'] && req.headers['x-vercel-path'].startsWith('/api')) {
    targetPath = req.headers['x-vercel-path'].split('?')[0];
    targetUrl = req.headers['x-vercel-path'];
  } else if (!targetPath.startsWith('/api') && targetPath !== '/' && targetPath !== '') {
    // Add /api prefix if missing (but not for /api itself)
    targetPath = '/api' + targetPath;
    targetUrl = '/api' + (req.url.includes('?') ? req.url : targetPath + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''));
  }
  
  // Update request object
  req.path = targetPath;
  req.url = targetUrl;
  req.originalUrl = targetUrl;
  
  // Log for debugging
  console.log(`[${req.method}] Path: ${req.path}, URL: ${req.url}, OriginalUrl: ${req.originalUrl}`);
  next();
});

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
// --- ROUTES --- (same as before)
// ============================================
// Auth
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', protect, getMe);

// Locations (handle both with and without /api prefix for Vercel)
app.get('/api/locations/continents', (req, res, next) => {
  console.log('Continents route hit!', req.path, req.url);
  getContinents(req, res, next);
});
app.get('/locations/continents', (req, res, next) => {
  console.log('Continents route hit (no prefix)!', req.path, req.url);
  getContinents(req, res, next);
});
app.get('/api/locations/countries', getCountries);
app.get('/locations/countries', getCountries);
app.get('/api/locations/provinces', getProvinces);
app.get('/locations/provinces', getProvinces);
app.get('/api/locations/cities', getCities);
app.get('/locations/cities', getCities);

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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// Upload
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

// Admin (all admin-protected)
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

// Health check & API root
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'Vercel' : 'Local'
  });
});

app.get('/api', (req, res) => {
  res.json({ success: true, message: 'HPW Pool API' });
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'HPW Pool API - Serverless Function', endpoints: { api: '/api', health: '/api/health' } });
});

// Error & 404 handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: err.message });
});

app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ success: false, message: 'Route not found', path: req.path });
});

// --- Local Development ---
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try { 
      await connectDB(); 
    } catch(e) { 
      console.error('DB connection failed:', e); 
    }
  });
}

// --- Export for Vercel (Vercel handles serverless automatically) ---
module.exports = app;
