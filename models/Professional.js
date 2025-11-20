const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profession',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },
  degree: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    default: 0
  },
  licenseNumber: {
    type: String,
    default: ''
  },
  // CV/Resume
  cv: {
    type: String,
    default: ''
  },
  cvFileName: {
    type: String,
    default: ''
  },
  // User Type
  userType: {
    type: String,
    enum: ['Professional', 'Trainee'],
    default: 'Professional'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  // Location
  continent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Continent'
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country'
  },
  province: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Province'
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  address: {
    type: String,
    default: ''
  },
  clinicName: {
    type: String,
    default: ''
  },
  hospitalAffiliation: {
    type: String,
    default: ''
  },
  // Contact
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  emergencyContact: {
    type: Boolean,
    default: false
  },
  // Working hours
  workingHours: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean }
  },
  // Qualifications
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
    certificate: String
  }],
  // Ratings & Reviews
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // Additional info
  bio: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  languages: [{
    type: String
  }],
  specialties: [{
    type: String
  }],
  // Stats
  views: {
    type: Number,
    default: 0
  },
  appointments: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Professional', professionalSchema);

