const mongoose = require('mongoose');

const traineeSchema = new mongoose.Schema({
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
  professionName: {
    type: String,
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
  cv: {
    type: String,
    default: ''
  },
  // Educational Info
  education: [{
    degree: String,
    institution: String,
    year: Number,
    field: String
  }],
  // Training Info
  trainingLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  currentInstitution: {
    type: String,
    default: ''
  },
  yearsOfExperience: {
    type: Number,
    default: 0
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
  // Contact
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  // Additional Info
  bio: {
    type: String,
    default: ''
  },
  skills: [{
    type: String
  }],
  languages: [{
    type: String
  }],
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  // Stats
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trainee', traineeSchema);

