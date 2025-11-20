const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique province name per country
provinceSchema.index({ name: 1, country: 1 }, { unique: true });

module.exports = mongoose.model('Province', provinceSchema);

