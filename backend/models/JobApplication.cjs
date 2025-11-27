const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional'
  },
  trainee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainee'
  },
  // Personal Information
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  fathersName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  whatsapp: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  cnic: {
    type: String,
    trim: true
  },
  profilePhoto: {
    url: String,
    public_id: String
  },
  // Address Information
  country: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  fullAddress: {
    type: String,
    trim: true
  },
  // Education Details
  education: [{
    highestEducation: String,
    instituteName: String,
    passingYear: String,
    grades: String
  }],
  // Experience Details
  experience: [{
    totalExperience: String,
    jobTitle: String,
    companyName: String,
    startDate: Date,
    endDate: Date,
    responsibilities: String
  }],
  // Skills
  requiredSkills: {
    type: String,
    trim: true
  },
  additionalSkills: {
    type: String,
    trim: true
  },
  // Documents
  resume: {
    url: String,
    public_id: String,
    filename: String
  },
  coverLetter: {
    url: String,
    public_id: String,
    filename: String
  },
  certificates: [{
    url: String,
    public_id: String,
    filename: String
  }],
  // Job-Specific Questions
  whyThisJob: {
    type: String,
    trim: true
  },
  expectedSalary: {
    type: String,
    trim: true
  },
  willingToRelocate: {
    type: String,
    enum: ['Yes', 'No']
  },
  availableImmediately: {
    type: String,
    enum: ['Yes', 'No']
  },
  // Additional Personal Info
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed']
  },
  languages: {
    type: String,
    trim: true
  },
  emergencyContactName: {
    type: String,
    trim: true
  },
  emergencyContactNumber: {
    type: String,
    trim: true
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
jobApplicationSchema.index({ job: 1, professional: 1 });
jobApplicationSchema.index({ job: 1, trainee: 1 });
jobApplicationSchema.index({ email: 1 });

module.exports = mongoose.models.JobApplication || mongoose.model('JobApplication', jobApplicationSchema);

