const multer = require('multer');
const cloudinary = require('../config/cloudinary.cjs');
const { Readable } = require('stream');

// Configure multer for memory storage (for Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow images and PDFs
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png, gif) and documents (pdf, doc, docx) are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
});

// Upload to Cloudinary helper function
const uploadToCloudinary = (buffer, folder = 'hpw-pool', resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
        transformation: resourceType === 'image' ? [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' }
        ] : []
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

// Upload image to Cloudinary
const uploadImage = async (file, folder = 'hpw-pool/images') => {
  try {
    if (!file || !file.buffer) {
      throw new Error('No file provided');
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME && !cloudinary.config().cloud_name) {
      throw new Error('Cloudinary is not configured. Please set CLOUDINARY environment variables.');
    }

    const result = await uploadToCloudinary(file.buffer, folder, 'image');
    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Upload document (PDF, DOC, etc.) to Cloudinary
const uploadDocument = async (file, folder = 'hpw-pool/documents') => {
  try {
    if (!file || !file.buffer) {
      throw new Error('No file provided');
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME && !cloudinary.config().cloud_name) {
      throw new Error('Cloudinary is not configured. Please set CLOUDINARY environment variables.');
    }

    const result = await uploadToCloudinary(file.buffer, folder, 'raw');
    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary document upload error:', error);
    throw error;
  }
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

module.exports = {
  upload,
  uploadImage,
  uploadDocument,
  deleteFromCloudinary,
};

