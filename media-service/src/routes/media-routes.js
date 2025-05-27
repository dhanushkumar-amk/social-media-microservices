const express = require('express');
const multer = require('multer');

const { uploadMedia, getAllMedia } = require('../controllers/media-controllers');
const { isAuthenticatedRequest } = require('../middleware/authmidlleware');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file upload
const uploadMediaMulter = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
}).single('file');

// Route for uploading media
router.post('/upload', isAuthenticatedRequest, (req, res, next) => {
  uploadMediaMulter(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      logger.error('Multer error while uploading');
      return res.status(400).json({
        message: 'Multer error',
        error: err.message,
        stack: err.stack,
      });
    } else if (err) {
      logger.error('Unknown error while uploading');
      return res.status(500).json({
        message: 'Unknown error while uploading',
        error: err.message,
        stack: err.stack,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'No file found',
      });
    }

    // Proceed to controller only if no error and file exists
    next();
  });
}, uploadMedia);

router.get('/get', isAuthenticatedRequest, getAllMedia)

module.exports = router;
