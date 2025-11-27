const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  profession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profession',
    required: true
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'],
    default: 'Full-time'
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    minExperience: {
      type: Number,
      default: 0
    },
    description: String,
    skills: [String],
    qualifications: [String]
  },
  salary: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly'
    }
  },
  location: {
    continent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Continent'
    },
    continents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Continent'
    }],
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country'
    },
    countries: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country'
    }],
    province: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province'
    },
    provinces: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province'
    }],
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City'
    },
    cities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City'
    }],
    address: String
  },
  image: {
    type: String,
    default: ''
  },
  applicationDeadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'filled'],
    default: 'draft'
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  totalApplications: {
    type: Number,
    default: 0
  },
  totalViews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);

