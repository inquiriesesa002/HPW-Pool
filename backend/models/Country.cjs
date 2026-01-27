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
  region: {
    type: String,
    required: true,
    enum: ['europe', 'usa', 'africa', 'canada', 'australia'],
    trim: true
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

// Speed up lookups by region and code
countrySchema.index({ region: 1 });
countrySchema.index({ code: 1 });

module.exports = mongoose.models.Country || mongoose.model('Country', countrySchema);

