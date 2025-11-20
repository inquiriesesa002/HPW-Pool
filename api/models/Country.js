const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    maxlength: 3
  },
  continent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Continent',
    required: true
  },
  flag: {
    type: String,
    default: ''
  },
  population: {
    type: Number,
    default: 0
  },
  healthcareIndex: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique country code per continent
countrySchema.index({ code: 1, continent: 1 }, { unique: true });

module.exports = mongoose.model('Country', countrySchema);

