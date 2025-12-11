const { uploadImage, uploadDocument, deleteFromCloudinary } = require('../middleware/upload.cjs');

// Upload image
const uploadImageHandler = async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file in request:', req.body, req.files);
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('Uploading image:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const folder = req.body.folder || 'hpw-pool/professionals/avatars';
    const result = await uploadImage(req.file, folder);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      filePath: result.url,
      data: {
        url: result.url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
};

// Upload document (CV, etc.)
const uploadDocumentHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const folder = req.body.folder || 'hpw-pool/documents';
    const result = await uploadDocument(req.file, folder);

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        url: result.url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        filename: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
};

// Delete file from Cloudinary
const deleteFile = async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const result = await deleteFromCloudinary(public_id);

    res.json({
      success: true,
      message: 'File deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

module.exports = {
  uploadImageHandler,
  uploadDocumentHandler,
  deleteFile
};

