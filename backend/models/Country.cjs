const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  flag: {
    type: String,
    default: ''
  },
  continent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Continent',
    required: true
  },
  population: {
    type: Number,
    default: 0
  },
  healthcareIndex: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Country || mongoose.model('Country', countrySchema);

