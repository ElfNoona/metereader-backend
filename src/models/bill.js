const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  readingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reading', required: true },
  billingCycleStart: { type: Date, required: true },
  billingCycleEnd: { type: Date, required: true },
  previousReading: { type: Number, required: true },
  currentReading: { type: Number, required: true },
  unitsConsumed: { type: Number, required: true },
  fixedCharges: { type: Number, required: true },
  gasCharges: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  totalPayable: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bill', BillSchema);