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
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    default: ''
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
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    default: '1-10'
  },
  location: {
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
    address: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Company || mongoose.model('Company', companySchema);

