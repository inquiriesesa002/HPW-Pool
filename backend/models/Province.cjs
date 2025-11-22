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
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Province || mongoose.model('Province', provinceSchema);

