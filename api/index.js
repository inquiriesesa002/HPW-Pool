const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
require("dotenv").config();

const app = express();

// --------------------
// CORS
// --------------------
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

// --------------------
// Body Parsers
// --------------------
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// --------------------
// DB Connection
// --------------------
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ DB Error:", err);
  }
};

// Auto-connect DB
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

// --------------------
// LOAD MODELS
// --------------------
const loadModel = (modelName) => {
  const modelPath = path.join(__dirname, "..", "models", modelName);
  try {
    return require(modelPath);
  } catch (err) {
    console.error(`Error loading model ${modelName}:`, err);
    return null;
  }
};

const User = loadModel("User.cjs");
const Professional = loadModel("Professional.cjs");
const Company = loadModel("Company.cjs");
const Job = loadModel("Job.cjs");
const Trainee = loadModel("Trainee.cjs");
const Profession = loadModel("Profession.cjs");
const Continent = loadModel("Continent.cjs");
const Country = loadModel("Country.cjs");
const Province = loadModel("Province.cjs");
const City = loadModel("City.cjs");

// --------------------
// MIDDLEWARE - Auth
// --------------------
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

// --------------------
// MIDDLEWARE - Upload (Cloudinary)
// --------------------
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return reject(new Error("Cloudinary is not configured"));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder, public_id: publicId, resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else if (file.mimetype === "application/pdf" && (file.fieldname === "cv" || file.fieldname === "resume")) cb(null, true);
    else cb(new Error("Invalid file type"), false);
  },
});

const uploadToCloudinaryMiddleware = (folder) => {
  return async (req, res, next) => {
    if (!req.file) return next();
    try {
      const publicId = `${req.file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const result = await uploadToCloudinary(req.file.buffer, folder, publicId);
      req.file.cloudinaryUrl = result.secure_url;
      req.file.cloudinaryPublicId = result.public_id;
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error uploading file: " + error.message });
    }
  };
};

const uploadJobImage = [upload.single("jobImage"), uploadToCloudinaryMiddleware("job-images")];
const uploadCV = [upload.single("cv"), uploadToCloudinaryMiddleware("cvs")];

// --------------------
// CONTROLLERS - Auth
// --------------------
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "30d" });
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide name, email, and password" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }
    const user = await User.create({ name, email, password, phone: phone || "", role: role || "user" });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, data: user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(400).json({ success: false, message: error.message || "Registration failed" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(user._id);
    res.json({ success: true, token, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------
// CONTROLLERS - Companies
// --------------------
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .populate("city", "name")
      .populate("country", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate("city", "name")
      .populate("country", "name")
      .populate("province", "name")
      .populate("continent", "name")
      .populate("user", "name email");
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCompany = async (req, res) => {
  try {
    const company = await Company.create({ ...req.body, user: req.user.id });
    await User.findByIdAndUpdate(req.user.id, { role: "company" });
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Company profile already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCompany = async (req, res) => {
  try {
    let company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }
    if (company.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------
// CONTROLLERS - Jobs
// --------------------
const getJobs = async (req, res) => {
  try {
    const { profession, city, country, jobType, status, company } = req.query;
    let query = {};
    if (profession) query.profession = profession;
    if (city) query.city = city;
    if (country) query.country = country;
    if (jobType) query.jobType = jobType;
    if (status) query.status = status;
    if (company) query.company = company;
    let jobsQuery = Job.find(query)
      .populate("company", "companyName logo")
      .populate("profession", "name category")
      .populate("city", "name")
      .populate("country", "name")
      .sort({ postedDate: -1 });
    if (req.query.limit) {
      jobsQuery = jobsQuery.limit(parseInt(req.query.limit));
    }
    const jobs = await jobsQuery;
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("company", "companyName logo description")
      .populate("profession", "name category")
      .populate("city", "name")
      .populate("country", "name")
      .populate("province", "name")
      .populate({
        path: "applications.professional",
        select: "user profession city cv degree experience",
        populate: [{ path: "user", select: "name email" }, { path: "profession", select: "name" }, { path: "city", select: "name" }],
      })
      .populate({
        path: "applications.trainee",
        select: "user profession city degree",
        populate: [{ path: "user", select: "name email" }, { path: "profession", select: "name" }, { path: "city", select: "name" }],
      });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    job.views += 1;
    await job.save();
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createJob = async (req, res) => {
  try {
    const profession = await Profession.findById(req.body.profession);
    if (!profession) {
      return res.status(404).json({ success: false, message: "Profession not found" });
    }
    const company = await Company.findOne({ user: req.user.id });
    if (!company) {
      return res.status(404).json({ success: false, message: "Company profile not found" });
    }
    let imagePath = "";
    if (req.file && req.file.cloudinaryUrl) {
      imagePath = req.file.cloudinaryUrl;
    }
    let requirements = {};
    let salary = {};
    if (req.body.requirements) {
      try {
        requirements = typeof req.body.requirements === "string" ? JSON.parse(req.body.requirements) : req.body.requirements;
      } catch (e) {
        requirements = {};
      }
    }
    if (req.body.salary) {
      try {
        salary = typeof req.body.salary === "string" ? JSON.parse(req.body.salary) : req.body.salary;
      } catch (e) {
        salary = {};
      }
    }
    const job = await Job.create({
      title: req.body.title,
      description: req.body.description || "",
      profession: req.body.profession,
      professionName: profession.name,
      jobType: req.body.jobType,
      city: req.body.city,
      address: req.body.address || "",
      requirements: requirements,
      salary: salary,
      deadline: req.body.deadline || undefined,
      status: req.body.status || "active",
      isUrgent: req.body.isUrgent === "true" || req.body.isUrgent === true,
      company: company._id,
      image: imagePath || req.body.image || "",
    });
    company.totalJobsPosted += 1;
    await company.save();
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    const company = await Company.findOne({ user: req.user.id });
    if (!company || job.company.toString() !== company._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    let imagePath = job.image || "";
    if (req.file && req.file.cloudinaryUrl) {
      imagePath = req.file.cloudinaryUrl;
    }
    let requirements = job.requirements || {};
    let salary = job.salary || {};
    if (req.body.requirements) {
      try {
        requirements = typeof req.body.requirements === "string" ? JSON.parse(req.body.requirements) : req.body.requirements;
      } catch (e) {
        requirements = job.requirements || {};
      }
    }
    if (req.body.salary) {
      try {
        salary = typeof req.body.salary === "string" ? JSON.parse(req.body.salary) : req.body.salary;
      } catch (e) {
        salary = job.salary || {};
      }
    }
    let professionName = job.professionName;
    if (req.body.profession && req.body.profession !== job.profession.toString()) {
      const profession = await Profession.findById(req.body.profession);
      if (profession) professionName = profession.name;
    }
    job.title = req.body.title || job.title;
    job.description = req.body.description || job.description;
    if (req.body.profession) job.profession = req.body.profession;
    job.professionName = professionName;
    if (req.body.jobType) job.jobType = req.body.jobType;
    if (req.body.city) job.city = req.body.city;
    if (req.body.address !== undefined) job.address = req.body.address;
    job.requirements = requirements;
    job.salary = salary;
    if (req.body.deadline) job.deadline = req.body.deadline;
    if (req.body.status) job.status = req.body.status;
    if (req.body.isUrgent !== undefined) job.isUrgent = req.body.isUrgent === "true" || req.body.isUrgent === true;
    if (imagePath) job.image = imagePath;
    await job.save();
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const applyToJob = async (req, res) => {
  try {
    const { jobId, professionalId, traineeId, notes } = req.body;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    const existingApplication = job.applications.find(
      (app) => (app.professional && app.professional.toString() === professionalId) || (app.trainee && app.trainee.toString() === traineeId)
    );
    if (existingApplication) {
      return res.status(400).json({ success: false, message: "Already applied to this job" });
    }
    job.applications.push({ professional: professionalId || null, trainee: traineeId || null, notes: notes || "", status: "pending" });
    job.applicationsCount += 1;
    await job.save();
    res.json({ success: true, message: "Application submitted successfully", data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadCV = async (req, res) => {
  try {
    const { professionalId, traineeId } = req.query;
    let cvPath = "";
    let fileName = "";
    if (professionalId) {
      const professional = await Professional.findById(professionalId);
      if (professional && professional.cv) {
        cvPath = professional.cv;
        fileName = professional.cvFileName || "cv.pdf";
      }
    } else if (traineeId) {
      const trainee = await Trainee.findById(traineeId);
      if (trainee && trainee.cv) {
        cvPath = trainee.cv;
        fileName = "trainee-cv.pdf";
      }
    }
    if (!cvPath) {
      return res.status(404).json({ success: false, message: "CV not found" });
    }
    res.json({ success: true, cvPath: cvPath, fileName: fileName });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------
// CONTROLLERS - Professionals
// --------------------
const getProfessionals = async (req, res) => {
  try {
    const { profession, city, province, country, continent, gender, minExperience, minRating, emergencyContact, verified, userType, search } = req.query;
    let query = { isActive: true };
    if (profession) query.profession = profession;
    if (city) query.city = city;
    if (province) query.province = province;
    if (country) query.country = country;
    if (continent) query.continent = continent;
    if (gender) query.gender = gender;
    if (userType) query.userType = userType;
    if (minExperience) query.experience = { $gte: parseInt(minExperience) };
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (emergencyContact === "true") query.emergencyContact = true;
    if (verified === "true") query.verificationStatus = "verified";
    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { professionName: { $regex: search, $options: "i" } }];
    }
    const professionals = await Professional.find(query)
      .populate("profession", "name category")
      .populate("city", "name")
      .populate("province", "name")
      .populate("country", "name")
      .populate("continent", "name")
      .sort({ rating: -1, views: -1 });
    res.json({ success: true, count: professionals.length, data: professionals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProfessional = async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .populate("profession", "name category")
      .populate("city", "name")
      .populate("province", "name")
      .populate("country", "name")
      .populate("continent", "name")
      .populate("user", "name email");
    if (!professional) {
      return res.status(404).json({ success: false, message: "Professional not found" });
    }
    professional.views += 1;
    await professional.save();
    res.json({ success: true, data: professional });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProfessional = async (req, res) => {
  try {
    const professional = await Professional.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, data: professional });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Professional profile already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfessional = async (req, res) => {
  try {
    let professional = await Professional.findById(req.params.id);
    if (!professional) {
      return res.status(404).json({ success: false, message: "Professional not found" });
    }
    if (professional.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    professional = await Professional.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: professional });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadCVHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const cvUrl = req.file.cloudinaryUrl || `/uploads/cvs/${req.file.filename}`;
    res.json({ success: true, cvUrl: cvUrl, fileName: req.file.originalname });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const totalProfessionals = await Professional.countDocuments({ isActive: true });
    const verifiedProfessionals = await Professional.countDocuments({ verificationStatus: "verified" });
    const totalCountries = await Country.countDocuments({ isActive: true });
    const totalProfessions = await Profession.countDocuments({ isActive: true });
    res.json({
      success: true,
      data: { totalProfessionals, verifiedProfessionals, totalCountries, totalProfessions },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------
// CONTROLLERS - Professions
// --------------------
const getProfessions = async (req, res) => {
  try {
    const { category } = req.query;
    let query = { isActive: true };
    if (category) query.category = category;
    const professions = await Profession.find(query).sort({ category: 1, order: 1, name: 1 });
    res.json({ success: true, data: professions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProfession = async (req, res) => {
  try {
    const profession = await Profession.findById(req.params.id);
    if (!profession) {
      return res.status(404).json({ success: false, message: "Profession not found" });
    }
    res.json({ success: true, data: profession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProfession = async (req, res) => {
  try {
    const profession = await Profession.create(req.body);
    res.status(201).json({ success: true, data: profession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfession = async (req, res) => {
  try {
    const profession = await Profession.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!profession) {
      return res.status(404).json({ success: false, message: "Profession not found" });
    }
    res.json({ success: true, data: profession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProfession = async (req, res) => {
  try {
    const profession = await Profession.findByIdAndDelete(req.params.id);
    if (!profession) {
      return res.status(404).json({ success: false, message: "Profession not found" });
    }
    res.json({ success: true, message: "Profession deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------
// CONTROLLERS - Locations
// --------------------
const getContinents = async (req, res) => {
  try {
    const continents = await Continent.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: continents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCountries = async (req, res) => {
  try {
    const { continentId } = req.query;
    let query = { isActive: true };
    if (continentId) query.continent = continentId;
    const countries = await Country.find(query).populate("continent", "name code").sort({ name: 1 });
    res.json({ success: true, data: countries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProvinces = async (req, res) => {
  try {
    const { countryId } = req.query;
    let query = { isActive: true };
    if (countryId) query.country = countryId;
    const provinces = await Province.find(query).populate("country", "name code").sort({ name: 1 });
    res.json({ success: true, data: provinces });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCities = async (req, res) => {
  try {
    const { provinceId } = req.query;
    let query = { isActive: true };
    if (provinceId) query.province = provinceId;
    const cities = await City.find(query).populate("province", "name").sort({ name: 1 });
    res.json({ success: true, data: cities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------
// CONTROLLERS - Trainees
// --------------------
const getTrainees = async (req, res) => {
  try {
    const { profession, city, country, trainingLevel, available } = req.query;
    let query = { isActive: true };
    if (profession) query.profession = profession;
    if (city) query.city = city;
    if (country) query.country = country;
    if (trainingLevel) query.trainingLevel = trainingLevel;
    if (available === "true") query.isAvailable = true;
    const trainees = await Trainee.find(query)
      .populate("profession", "name category")
      .populate("city", "name")
      .populate("country", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: trainees.length, data: trainees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTrainee = async (req, res) => {
  try {
    const trainee = await Trainee.findById(req.params.id)
      .populate("profession", "name category")
      .populate("city", "name")
      .populate("country", "name")
      .populate("user", "name email");
    if (!trainee) {
      return res.status(404).json({ success: false, message: "Trainee not found" });
    }
    trainee.views += 1;
    await trainee.save();
    res.json({ success: true, data: trainee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTrainee = async (req, res) => {
  try {
    const profession = await Profession.findById(req.body.profession);
    if (!profession) {
      return res.status(404).json({ success: false, message: "Profession not found" });
    }
    const trainee = await Trainee.create({ ...req.body, professionName: profession.name, user: req.user.id });
    res.status(201).json({ success: true, data: trainee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Trainee profile already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTrainee = async (req, res) => {
  try {
    let trainee = await Trainee.findById(req.params.id);
    if (!trainee) {
      return res.status(404).json({ success: false, message: "Trainee not found" });
    }
    if (trainee.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    if (req.body.profession) {
      const profession = await Profession.findById(req.body.profession);
      if (profession) req.body.professionName = profession.name;
    }
    trainee = await Trainee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: trainee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------
// CONTROLLERS - Admin (simplified)
// --------------------
const getAdminStats = async (req, res) => {
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
        totalCountries,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------
// ROUTES
// --------------------
// Auth Routes
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);
app.get("/api/auth/me", protect, getMe);

// Company Routes
app.get("/api/companies", getCompanies);
app.get("/api/companies/:id", getCompany);
app.post("/api/companies", protect, createCompany);
app.put("/api/companies/:id", protect, updateCompany);

// Job Routes
app.get("/api/jobs", getJobs);
app.get("/api/jobs/:id", getJob);
app.post("/api/jobs", protect, ...uploadJobImage, createJob);
app.put("/api/jobs/:id", protect, ...uploadJobImage, updateJob);
app.post("/api/jobs/apply", protect, applyToJob);
app.get("/api/jobs/cv/download", protect, downloadCV);

// Professional Routes
app.get("/api/professionals/stats", getStats);
app.get("/api/professionals", getProfessionals);
app.get("/api/professionals/:id", getProfessional);
app.post("/api/professionals", protect, createProfessional);
app.put("/api/professionals/:id", protect, updateProfessional);
app.post("/api/professionals/upload-cv", protect, ...uploadCV, uploadCVHandler);
app.get("/api/professionals/:id/cv", protect, async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);
    if (!professional || !professional.cv) {
      return res.status(404).json({ success: false, message: "CV not found" });
    }
    res.json({ success: true, cvUrl: professional.cv, fileName: professional.cvFileName || "cv.pdf" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Profession Routes
app.get("/api/professions", getProfessions);
app.get("/api/professions/:id", getProfession);
app.post("/api/professions", protect, authorize("admin"), createProfession);
app.put("/api/professions/:id", protect, authorize("admin"), updateProfession);
app.delete("/api/professions/:id", protect, authorize("admin"), deleteProfession);

// Location Routes
app.get("/api/locations/continents", getContinents);
app.get("/api/locations/countries", getCountries);
app.get("/api/locations/provinces", getProvinces);
app.get("/api/locations/cities", getCities);

// Trainee Routes
app.get("/api/trainees", getTrainees);
app.get("/api/trainees/:id", getTrainee);
app.post("/api/trainees", protect, createTrainee);
app.put("/api/trainees/:id", protect, updateTrainee);

// Admin Routes
app.get("/api/admin/stats", protect, authorize("admin"), getAdminStats);

// --------------------
// Health Check
// --------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    env: process.env.VERCEL ? "Vercel" : "Local",
    time: new Date().toISOString(),
  });
});

// API Root
app.get("/api", (req, res) => {
  res.json({ success: true, message: "HPW Pool API Root" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// LOCAL SERVER (only for localhost)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log("🚀 Local server running on", PORT);
    await connectDB();
  });
}

// Export for Vercel
module.exports = app;
