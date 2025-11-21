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
  description: {
    type: String,
    required: true
  },
  profession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profession',
    required: true
  },
  professionName: {
    type: String,
    required: true
  },
  // Job Type
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'],
    default: 'Full-time'
  },
  // Requirements
  requirements: {
    minExperience: {
      type: Number,
      default: 0
    },
    maxExperience: {
      type: Number,
      default: 50
    },
    education: {
      type: String,
      default: ''
    },
    skills: [{
      type: String
    }],
    certifications: [{
      type: String
    }]
  },
  // Location
  continent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Continent'
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country'
  },
  province: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Province'
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  address: {
    type: String,
    default: ''
  },
  // Salary
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
  // Status
  status: {
    type: String,
    enum: ['active', 'closed', 'filled', 'draft'],
    default: 'active'
  },
  // Applications
  applications: [{
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professional'
    },
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainee'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
      default: 'pending'
    },
    notes: {
      type: String,
      default: ''
    }
  }],
  // Stats
  views: {
    type: Number,
    default: 0
  },
  applicationsCount: {
    type: Number,
    default: 0
  },
  // Dates
  postedDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date
  },
  // Image
  image: {
    type: String,
    default: ''
  },
  isUrgent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
