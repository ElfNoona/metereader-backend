const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  readingValue: { type: Number, required: true }, // The final value used for billing
  rawOcrValue: { type: String }, // The raw text output from the OCR engine
  confidenceScore: { type: Number }, // OCR confidence score
  timestamp: { type: Date, default: Date.now },
  isAutoDetected: { type: Boolean, required: true }, // Verification audit flag
  status: { 
    type: String, 
    enum: ['Verified', 'Pending Verification', 'Rejected'], 
    default: 'Pending Verification' 
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Audit trail for manual fixes
  imageUrl: { type: String } // Path to cloud or local storage
});

module.exports = mongoose.model('Reading', ReadingSchema);