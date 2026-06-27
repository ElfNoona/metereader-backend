const Reading = require('../models/reading');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

exports.submitMeterReading = async (req, res) => {
  try {
    const { userId, isManualOverride, manualValue } = req.body;
    
    // Scenario 1: Manual Input (Or OCR Failure Fallback)
    if (isManualOverride === 'true') {
      const pendingReading = new Reading({
        userId,
        readingValue: parseFloat(manualValue),
        isAutoDetected: false,
        status: 'Pending Verification',
        imageUrl: req.file ? req.file.path : null
      });
      await pendingReading.save();
      return res.status(201).json({ success: true, reading: pendingReading });
    }

    // Scenario 2: Active OCR evaluation request
    if (!req.file) return res.status(400).json({ success: false, error: 'Meter Image Required' });

    // Construct request body and forward to local Python ML service
    const FormData = require('form-data');
    const form = new FormData();
    form.append('image', fs.createReadStream(req.file.path));

    const mlResponse = await axios.post('http://localhost:8000/predict?dials=5', form, {
      headers: { ...form.getHeaders() }
    });

    const parsedOCRText = mlResponse.data.reading; // Returns calculated sequence (e.g., "00143")
    const confidenceScore = mlResponse.data.confidence || 85; // Fallback if missing

    const verifiedReading = new Reading({
      userId,
      readingValue: parseFloat(parsedOCRText),
      rawOcrValue: String(parsedOCRText),
      confidenceScore,
      isAutoDetected: true,
      status: confidenceScore >= 90 ? 'Verified' : 'Pending Verification',
      imageUrl: req.file.path
    });
    await verifiedReading.save();

    res.status(200).json({ success: true, reading: verifiedReading });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};