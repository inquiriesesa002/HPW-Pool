const mongoose = require('mongoose');
require('dotenv').config();
const Profession = require('../models/Profession');

// Comprehensive list of Health Professions with icons and subcategories
const professions = [
  // Medical Professionals
  { name: 'Physicians (Doctors)', category: 'Medical Professionals', subcategory: 'General Practice', icon: '👨‍⚕️', description: 'General medical practitioners providing primary healthcare', order: 1 },
  { name: 'Surgeons', category: 'Medical Professionals', subcategory: 'Surgery', icon: '⚕️', description: 'Specialized doctors performing surgical procedures', order: 2 },
  { name: 'Dentists', category: 'Medical Professionals', subcategory: 'Dental', icon: '🦷', description: 'Oral health specialists providing dental care', order: 3 },
  { name: 'Pharmacists', category: 'Medical Professionals', subcategory: 'Pharmacy', icon: '💊', description: 'Medication experts managing prescriptions and drug therapy', order: 4 },
  { name: 'Nurses (RN)', category: 'Medical Professionals', subcategory: 'Registered Nurse', icon: '👩‍⚕️', description: 'Registered nurses providing patient care', order: 5 },
  { name: 'Nurses (LPN)', category: 'Medical Professionals', subcategory: 'Licensed Practical Nurse', icon: '👩‍⚕️', description: 'Licensed practical nurses assisting in patient care', order: 6 },
  { name: 'Midwives', category: 'Medical Professionals', subcategory: 'Maternity', icon: '🤱', description: 'Healthcare providers specializing in pregnancy and childbirth', order: 7 },
  { name: 'Psychiatrists', category: 'Medical Professionals', subcategory: 'Mental Health', icon: '🧠', description: 'Medical doctors specializing in mental health disorders', order: 8 },
  { name: 'Anesthesiologists', category: 'Medical Professionals', subcategory: 'Anesthesia', icon: '💉', description: 'Specialists managing anesthesia during medical procedures', order: 9 },
  
  // Allied Health Professionals
  { name: 'Physical Therapists', category: 'Allied Health Professionals', subcategory: 'Therapy', icon: '🏃', description: 'Therapists helping patients recover movement and function', order: 1 },
  { name: 'Occupational Therapists', category: 'Allied Health Professionals', subcategory: 'Therapy', icon: '🖐️', description: 'Therapists helping patients with daily living activities', order: 2 },
  { name: 'Speech-Language Pathologists', category: 'Allied Health Professionals', subcategory: 'Therapy', icon: '🗣️', description: 'Specialists treating communication and swallowing disorders', order: 3 },
  { name: 'Respiratory Therapists', category: 'Allied Health Professionals', subcategory: 'Respiratory', icon: '🫁', description: 'Specialists managing breathing and respiratory conditions', order: 4 },
  { name: 'Radiologic Technologists', category: 'Allied Health Professionals', subcategory: 'Radiology', icon: '📷', description: 'Technicians operating medical imaging equipment', order: 5 },
  { name: 'Medical Laboratory Technologists', category: 'Allied Health Professionals', subcategory: 'Laboratory', icon: '🔬', description: 'Scientists analyzing medical samples and test results', order: 6 },
  { name: 'Dietitians', category: 'Allied Health Professionals', subcategory: 'Nutrition', icon: '🥗', description: 'Nutrition experts providing dietary guidance and meal planning', order: 7 },
  
  // Mental Health Professionals
  { name: 'Psychologists', category: 'Mental Health Professionals', subcategory: 'Psychology', icon: '🧘', description: 'Mental health professionals providing therapy and counseling', order: 1 },
  { name: 'Counselors', category: 'Mental Health Professionals', subcategory: 'Counseling', icon: '💬', description: 'Therapists providing guidance and emotional support', order: 2 },
  { name: 'Social Workers', category: 'Mental Health Professionals', subcategory: 'Social Work', icon: '🤝', description: 'Professionals helping individuals and families with social issues', order: 3 },
  { name: 'Mental Health Nurses', category: 'Mental Health Professionals', subcategory: 'Nursing', icon: '👩‍⚕️', description: 'Nurses specializing in psychiatric and mental health care', order: 4 },
  { name: 'Psychiatric Technicians', category: 'Mental Health Professionals', subcategory: 'Support', icon: '🛡️', description: 'Support staff assisting in mental health facilities', order: 5 },
  
  // Support Staff
  { name: 'Medical Assistants', category: 'Support Staff', subcategory: 'Clinical Support', icon: '📋', description: 'Healthcare workers assisting with clinical and administrative tasks', order: 1 },
  { name: 'Nursing Assistants', category: 'Support Staff', subcategory: 'Nursing Support', icon: '👨‍⚕️', description: 'Caregivers providing basic patient care under nurse supervision', order: 2 },
  { name: 'Pharmacy Technicians', category: 'Support Staff', subcategory: 'Pharmacy Support', icon: '💊', description: 'Support staff assisting pharmacists with medication preparation', order: 3 },
  { name: 'Medical Records Clerks', category: 'Support Staff', subcategory: 'Administrative', icon: '📁', description: 'Administrative staff managing patient records and documentation', order: 4 },
  { name: 'Billing Specialists', category: 'Support Staff', subcategory: 'Administrative', icon: '💰', description: 'Administrative staff handling medical billing and insurance claims', order: 5 },
  
  // Specialized Health Professionals
  { name: 'Cardiologists', category: 'Specialized Professionals', subcategory: 'Cardiology', icon: '❤️', description: 'Heart specialists diagnosing and treating cardiovascular diseases', order: 1 },
  { name: 'Oncologists', category: 'Specialized Professionals', subcategory: 'Oncology', icon: '🎗️', description: 'Cancer specialists providing diagnosis and treatment', order: 2 },
  { name: 'Neonatologists', category: 'Specialized Professionals', subcategory: 'Neonatology', icon: '👶', description: 'Specialists caring for newborn infants, especially premature or ill babies', order: 3 },
  { name: 'Pediatricians', category: 'Specialized Professionals', subcategory: 'Pediatrics', icon: '👨‍⚕️', description: 'Doctors specializing in children\'s health and development', order: 4 },
  { name: 'Geriatricians', category: 'Specialized Professionals', subcategory: 'Geriatrics', icon: '👴', description: 'Specialists focusing on healthcare for elderly patients', order: 5 },
  { name: 'Orthopedic Surgeons', category: 'Specialized Professionals', subcategory: 'Orthopedics', icon: '🦴', description: 'Surgeons specializing in bone, joint, and muscle conditions', order: 6 },
  { name: 'Ophthalmologists', category: 'Specialized Professionals', subcategory: 'Ophthalmology', icon: '👁️', description: 'Eye specialists providing comprehensive eye care and surgery', order: 7 },
  { name: 'Otolaryngologists', category: 'Specialized Professionals', subcategory: 'ENT', icon: '👂', description: 'Ear, nose, and throat specialists treating head and neck conditions', order: 8 },
  
  // Alternative Medicine Practitioners
  { name: 'Acupuncturists', category: 'Alternative Medicine', subcategory: 'Traditional Medicine', icon: '📍', description: 'Practitioners using acupuncture for pain relief and healing', order: 1 },
  { name: 'Chiropractors', category: 'Alternative Medicine', subcategory: 'Manual Therapy', icon: '🦴', description: 'Specialists treating musculoskeletal disorders through spinal adjustments', order: 2 },
  { name: 'Herbalists', category: 'Alternative Medicine', subcategory: 'Herbal Medicine', icon: '🌿', description: 'Practitioners using plant-based remedies for healing', order: 3 },
  { name: 'Homeopaths', category: 'Alternative Medicine', subcategory: 'Homeopathy', icon: '💧', description: 'Practitioners using homeopathic remedies for treatment', order: 4 },
  { name: 'Naturopaths', category: 'Alternative Medicine', subcategory: 'Naturopathy', icon: '🌱', description: 'Natural medicine practitioners focusing on holistic healing', order: 5 }
];

const seedProfessions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://inquiriesesa_db_user:9OOQm5boLEOdNZsi@cluster0.ktqsjbu.mongodb.net/?appName=Cluster0');
    console.log('MongoDB Connected...');
    
    await Profession.deleteMany({});
    console.log('Cleared existing professions');
    
    const inserted = await Profession.insertMany(professions);
    console.log(`✅ Successfully seeded ${inserted.length} professions`);
    
    const byCategory = inserted.reduce((acc, prof) => {
      acc[prof.category] = (acc[prof.category] || 0) + 1;
      return acc;
    }, {});
    
    Object.keys(byCategory).forEach(category => {
      console.log(`   - ${category}: ${byCategory[category]}`);
    });
    console.log(`   - Total: ${inserted.length} professions`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding professions:', error);
    process.exit(1);
  }
};

seedProfessions();
