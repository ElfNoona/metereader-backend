const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const readingController = require('../controllers/reading.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Configure multer for local storage of uploaded meter images
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST route for submitting reading. Requires authentication and file upload handling.
router.post('/submit', authMiddleware, upload.single('image'), readingController.submitMeterReading);

module.exports = router;
