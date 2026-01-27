const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  province: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Province',
    required: true
  },
  region: {
    type: String,
    required: true,
    enum: ['europe', 'usa', 'africa', 'canada', 'australia'],
    trim: true
  },
  // Optional flag/image URL for UI display (uploaded via /api/upload/image)
  flagImage: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes to speed province/region lookups
citySchema.index({ province: 1, name: 1 });
citySchema.index({ region: 1, name: 1 });

module.exports = mongoose.models.City || mongoose.model('City', citySchema);

