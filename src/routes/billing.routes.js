const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Generate a new bill and invoice based on a reading
router.post('/generate', authMiddleware, billingController.generateBillAndInvoice);

// Download physical PDF invoice file
router.get('/invoice/:invoiceId/download', authMiddleware, billingController.downloadInvoice);

// Fetch billing history with reading, bill, and invoice info
router.get('/history', authMiddleware, billingController.getBillingHistory);

// Simulate paying a bill
router.post('/pay/:billId', authMiddleware, billingController.payBill);

module.exports = router;
