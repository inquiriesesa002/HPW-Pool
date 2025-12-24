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
  // Optional flag/image URL for UI display (uploaded via /api/upload/image)
  flagImage: {
    type: String,
    default: ''
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Province || mongoose.model('Province', provinceSchema);

