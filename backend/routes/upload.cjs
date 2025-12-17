const express = require('express');
const router = express.Router();
const {
  uploadImageHandler,
  uploadDocumentHandler,
  deleteFile
} = require('../controllers/uploadController.cjs');
const { auth } = require('../middleware/auth.cjs');
const { upload } = require('../middleware/upload.cjs');

router.post('/image', auth, upload.single('image'), uploadImageHandler);
router.post('/profile-image', auth, upload.single('photo'), uploadImageHandler);
router.post('/document', auth, upload.single('document'), uploadDocumentHandler);
router.delete('/file', auth, deleteFile);

module.exports = router;

