const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Generate a new bill and invoice based on a reading
router.post('/generate', authMiddleware, billingController.generateBillAndInvoice);

// Download physical PDF invoice file
router.get('/download/:invoiceId', authMiddleware, billingController.downloadInvoice);

module.exports = router;
