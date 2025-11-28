const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dakbch74l',
  api_key: process.env.CLOUDINARY_API_KEY || '595899943319583',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'IXoQKDAdHLCWMgOVQyeHk3Lr6v4',
});

module.exports = cloudinary;

