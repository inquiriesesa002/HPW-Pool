const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary (only if environment variables are set)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn('⚠️  Cloudinary credentials not found. File uploads will not work. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
}

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  }
  // Allow PDFs for CVs
  else if (file.mimetype === 'application/pdf' && (file.fieldname === 'cv' || file.fieldname === 'resume')) {
    cb(null, true);
  }
  // Allow common document types for CVs
  else if (
    (file.mimetype === 'application/msword' || 
     file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') &&
    (file.fieldname === 'cv' || file.fieldname === 'resume')
  ) {
    cb(null, true);
  }
  else {
    cb(new Error('Invalid file type. Only images and PDF/DOC files are allowed.'), false);
  }
};

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return reject(new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: publicId,
        resource_type: 'auto', // Automatically detect image, video, or raw
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Multer memory storage (always use memory for Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

// Middleware to upload file to Cloudinary after multer processes it
const uploadToCloudinaryMiddleware = (folder) => {
  return async (req, res, next) => {
    if (!req.file) {
      return next();
    }

    try {
      const publicId = `${req.file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const result = await uploadToCloudinary(req.file.buffer, folder, publicId);
      
      // Attach Cloudinary URL to req.file
      req.file.cloudinaryUrl = result.secure_url;
      req.file.cloudinaryPublicId = result.public_id;
      req.file.cloudinaryPath = result.secure_url; // For backward compatibility
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error uploading file to Cloudinary: ' + error.message
      });
    }
  };
};

// Upload single file
exports.uploadSingle = (fieldName, folder = 'uploads') => {
  return [
    upload.single(fieldName),
    uploadToCloudinaryMiddleware(folder)
  ];
};

// Upload multiple files
exports.uploadMultiple = (fieldName, maxCount = 5, folder = 'uploads') => {
  return [
    upload.array(fieldName, maxCount),
    async (req, res, next) => {
      if (!req.files || req.files.length === 0) {
        return next();
      }

      try {
        const uploadPromises = req.files.map(async (file) => {
          const publicId = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
          const result = await uploadToCloudinary(file.buffer, folder, publicId);
          file.cloudinaryUrl = result.secure_url;
          file.cloudinaryPublicId = result.public_id;
          file.cloudinaryPath = result.secure_url;
          return file;
        });

        await Promise.all(uploadPromises);
        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error uploading files to Cloudinary: ' + error.message
        });
      }
    }
  ];
};

// Upload fields
exports.uploadFields = (fields, folder = 'uploads') => {
  return [
    upload.fields(fields),
    async (req, res, next) => {
      if (!req.files) {
        return next();
      }

      try {
        const uploadPromises = [];
        
        for (const field of fields) {
          const files = req.files[field.name];
          if (files && files.length > 0) {
            for (const file of files) {
              const publicId = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
              uploadPromises.push(
                uploadToCloudinary(file.buffer, folder, publicId).then(result => {
                  file.cloudinaryUrl = result.secure_url;
                  file.cloudinaryPublicId = result.public_id;
                  file.cloudinaryPath = result.secure_url;
                })
              );
            }
          }
        }

        await Promise.all(uploadPromises);
        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error uploading files to Cloudinary: ' + error.message
        });
      }
    }
  ];
};

// CV Upload specifically
exports.uploadCV = [
  upload.single('cv'),
  uploadToCloudinaryMiddleware('cvs')
];

// Profile Image Upload
exports.uploadProfileImage = [
  upload.single('photo'),
  uploadToCloudinaryMiddleware('profile-images')
];

// Company Logo Upload
exports.uploadLogo = [
  upload.single('logo'),
  uploadToCloudinaryMiddleware('company-logos')
];

// Job Image Upload
exports.uploadJobImage = [
  upload.single('jobImage'),
  uploadToCloudinaryMiddleware('job-images')
];

module.exports = {
  uploadSingle: exports.uploadSingle,
  uploadMultiple: exports.uploadMultiple,
  uploadFields: exports.uploadFields,
  uploadCV: exports.uploadCV,
  uploadProfileImage: exports.uploadProfileImage,
  uploadLogo: exports.uploadLogo,
  uploadJobImage: exports.uploadJobImage
};
