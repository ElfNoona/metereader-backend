const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true, unique: true },
  invoiceNumber: { type: String, required: true, unique: true },
  generatedAt: { type: Date, default: Date.now },
  pdfFilePath: { type: String, required: true } // Points to directory location on local/cloud drive
});

module.exports = mongoose.model('Invoice', InvoiceSchema);