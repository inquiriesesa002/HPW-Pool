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
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
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

module.exports = mongoose.models.City || mongoose.model('City', citySchema);

