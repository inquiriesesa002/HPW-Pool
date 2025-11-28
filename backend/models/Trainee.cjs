const mongoose = require('mongoose');

const traineeSchema = new mongoose.Schema({
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
  professionName: {
    type: String,
    required: true,
    trim: true
  },
  trainingLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  currentInstitution: {
    type: String,
    default: ''
  },
  expectedCompletion: {
    type: Date
  },
  bio: {
    type: String,
    default: ''
  },
  avatar: {
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
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Trainee || mongoose.model('Trainee', traineeSchema);

