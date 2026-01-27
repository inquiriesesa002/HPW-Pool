const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  // Optional reference to the country this province/state belongs to.
  // Kept optional for backward compatibility with older seeded data.
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    default: null
  },
  // Optional flag/image URL for UI display (uploaded via /api/upload/image)
  flagImage: {
    type: String,
    default: ''
  },
  region: {
    type: String,
    required: true,
    enum: ['europe', 'usa', 'africa', 'canada', 'australia'],
    trim: true
  }
}, {
  timestamps: true
});

// Indexes to speed country/region lookups
provinceSchema.index({ country: 1, name: 1 });
provinceSchema.index({ region: 1, name: 1 });

module.exports = mongoose.models.Province || mongoose.model('Province', provinceSchema);

