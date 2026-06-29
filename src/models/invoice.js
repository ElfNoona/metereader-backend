const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true, unique: true },
  invoiceNumber: { type: String, required: true, unique: true },
  generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);