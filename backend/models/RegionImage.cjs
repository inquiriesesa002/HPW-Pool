const mongoose = require('mongoose');

const regionImageSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
    unique: true,
    enum: ['europe', 'usa', 'africa', 'canada', 'australia'],
    trim: true
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.RegionImage || mongoose.model('RegionImage', regionImageSchema);

