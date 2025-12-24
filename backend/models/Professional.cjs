const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
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
  profession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profession',
    required: true
  },
  specialization: {
    type: String,
    default: ''
  },
  experience: {
    type: Number,
    default: 0
  },
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  qualifications: [{
    name: String,
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date
  }],
  skills: [{
    type: String
  }],
  languages: [{
    language: String,
    proficiency: {
      type: String,
      enum: ['Basic', 'Intermediate', 'Advanced', 'Native'],
      default: 'Basic'
    }
  }],
  bio: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  cv: {
    url: String,
    public_id: String,
    filename: String,
    uploadedAt: Date
  },
  cvFileName: {
    type: String,
    default: ''
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
  isVerified: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isCardPosted: {
    type: Boolean,
    default: false
  },
  cardPostedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Professional || mongoose.model('Professional', professionalSchema);

