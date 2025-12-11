const mongoose = require('mongoose');

const professionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    default: 'Medical Professionals'
  },
  subcategory: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  categoryImage: {
    type: String,
    default: ''
  },
  subcategoryImage: {
    type: String,
    default: ''
  },
  order: {
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

module.exports = mongoose.models.Profession || mongoose.model('Profession', professionSchema);

