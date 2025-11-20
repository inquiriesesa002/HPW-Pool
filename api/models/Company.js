const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  industry: {
    type: String,
    default: ''
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    default: '1-10'
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
    ref: 'City'
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
  website: {
    type: String,
    default: ''
  },
  // Social
  linkedin: {
    type: String,
    default: ''
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Stats
  totalJobsPosted: {
    type: Number,
    default: 0
  },
  totalHires: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
