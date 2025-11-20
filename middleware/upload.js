const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const fs = require('fs');
const path = require('path');

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// On Vercel, Cloudinary is REQUIRED (no local storage available)
if (process.env.VERCEL && !isCloudinaryConfigured) {
  console.error('❌ ERROR: Cloudinary is REQUIRED on Vercel. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
}

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  if (process.env.VERCEL) {
    console.error('❌ Cloudinary is not configured but required on Vercel!');
  } else {
    console.warn('⚠️  Cloudinary credentials not found. Falling back to local storage in /uploads.');
  }
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

const saveBufferLocally = async (buffer, folder, originalName = '') => {
  const uploadsDir = path.join(process.cwd(), 'uploads', folder);
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  const ext = path.extname(originalName) || '';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filePath, buffer);
  const publicPath = `/uploads/${folder}/${filename}`.replace(/\\/g, '/');
  return { filePath, publicPath };
};

// Middleware to upload file to Cloudinary after multer processes it
const uploadToCloudinaryMiddleware = (folder) => {
  return async (req, res, next) => {
    if (!req.file) {
      return next();
    }

    try {
      // On Vercel, Cloudinary is REQUIRED
      if (process.env.VERCEL && !isCloudinaryConfigured) {
        return res.status(500).json({
          success: false,
          message: 'Cloudinary is required on Vercel. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
        });
      }

      if (isCloudinaryConfigured) {
        const publicId = `${req.file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const result = await uploadToCloudinary(req.file.buffer, folder, publicId);
        
        req.file.cloudinaryUrl = result.secure_url;
        req.file.cloudinaryPublicId = result.public_id;
        req.file.cloudinaryPath = result.secure_url; // For backward compatibility
      } else {
        // Only allow local storage in non-Vercel environments
        const saved = await saveBufferLocally(req.file.buffer, folder, req.file.originalname);
        req.file.cloudinaryUrl = saved.publicPath;
        req.file.cloudinaryPath = saved.publicPath;
        req.file.localPath = saved.publicPath;
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error uploading file: ' + error.message
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
        // On Vercel, Cloudinary is REQUIRED
        if (process.env.VERCEL && !isCloudinaryConfigured) {
          return res.status(500).json({
            success: false,
            message: 'Cloudinary is required on Vercel. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
          });
        }

        const uploadPromises = req.files.map(async (file) => {
          if (isCloudinaryConfigured) {
            const publicId = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            const result = await uploadToCloudinary(file.buffer, folder, publicId);
            file.cloudinaryUrl = result.secure_url;
            file.cloudinaryPublicId = result.public_id;
            file.cloudinaryPath = result.secure_url;
          } else {
            // Only allow local storage in non-Vercel environments
            const saved = await saveBufferLocally(file.buffer, folder, file.originalname);
            file.cloudinaryUrl = saved.publicPath;
            file.cloudinaryPath = saved.publicPath;
            file.localPath = saved.publicPath;
          }
          return file;
        });

        await Promise.all(uploadPromises);
        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error uploading files: ' + error.message
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
        // On Vercel, Cloudinary is REQUIRED
        if (process.env.VERCEL && !isCloudinaryConfigured) {
          return res.status(500).json({
            success: false,
            message: 'Cloudinary is required on Vercel. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
          });
        }

        const uploadPromises = [];
        
        for (const field of fields) {
          const files = req.files[field.name];
          if (files && files.length > 0) {
            for (const file of files) {
              if (isCloudinaryConfigured) {
                const publicId = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
                uploadPromises.push(
                  uploadToCloudinary(file.buffer, folder, publicId).then(result => {
                    file.cloudinaryUrl = result.secure_url;
                    file.cloudinaryPublicId = result.public_id;
                    file.cloudinaryPath = result.secure_url;
                  })
                );
              } else {
                // Only allow local storage in non-Vercel environments
                uploadPromises.push(
                  saveBufferLocally(file.buffer, folder, file.originalname).then(saved => {
                    file.cloudinaryUrl = saved.publicPath;
                    file.cloudinaryPath = saved.publicPath;
                    file.localPath = saved.publicPath;
                  })
                );
              }
            }
          }
        }

        await Promise.all(uploadPromises);
        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error uploading files: ' + error.message
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
