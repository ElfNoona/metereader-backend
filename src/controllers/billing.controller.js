const Bill = require('../models/bill');
const Reading = require('../models/reading');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const { calculateTariff } = require('../utils/tariff.calculator');
const { generateInvoicePDF } = require('../utils/invoice.generator');
const path = require('path');
const fs = require('fs');

exports.generateBillAndInvoice = async (req, res) => {
  try {
    const { readingId } = req.body;
    
    // 1. Fetch current reading information
    const currentReading = await Reading.findById(readingId);
    if (!currentReading) return res.status(404).json({ success: false, error: 'Reading record not found' });

    // 2. Fetch user information
    const user = await User.findById(currentReading.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User record not found' });

    // 3. Find the previous verified reading to calculate unit consumption
    const previousReadingRecord = await Reading.findOne({
      userId: user._id,
      _id: { $ne: currentReading._id },
      timestamp: { $lt: currentReading.timestamp }
    }).sort({ timestamp: -1 });

    const previousReadingValue = previousReadingRecord ? previousReadingRecord.readingValue : 0;
    
    // Calculate Billing Cycle Dates
    const billingCycleStart = previousReadingRecord ? previousReadingRecord.timestamp : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const billingCycleEnd = currentReading.timestamp;

    // 4. Run tariff calculator
    const charges = calculateTariff(
      previousReadingValue,
      currentReading.readingValue,
      billingCycleStart,
      billingCycleEnd
    );

    // 5. Save the generated bill record
    const bill = new Bill({
      userId: user._id,
      readingId: currentReading._id,
      billingCycleStart,
      billingCycleEnd,
      previousReading: previousReadingValue,
      currentReading: currentReading.readingValue,
      ...charges
    });
    await bill.save();

    // 6. Save metadata reference in MongoDB
    const invoice = new Invoice({
      billId: bill._id,
      invoiceNumber: `INV-${bill._id.toString().substring(0, 8).toUpperCase()}`
    });
    await invoice.save();

    res.status(201).json({ success: true, bill, invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

    const bill = await Bill.findById(invoice.billId);
    if (!bill) return res.status(404).json({ success: false, error: 'Bill not found' });

    const user = await User.findById(bill.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);

    await generateInvoicePDF(bill, user, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBillingHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const readings = await Reading.find({ userId }).sort({ timestamp: -1 });

    const history = [];
    for (const reading of readings) {
      const bill = await Bill.findOne({ readingId: reading._id });
      let invoiceId = null;
      let isPaid = false;
      let totalPayable = 0;

      if (bill) {
        isPaid = bill.isPaid;
        totalPayable = bill.totalPayable;
        const invoice = await Invoice.findOne({ billId: bill._id });
        if (invoice) invoiceId = invoice._id;
      }

      history.push({
        reading,
        billId: bill ? bill._id : null,
        isPaid,
        totalPayable,
        invoiceId
      });
    }

    res.status(200).json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.payBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.billId);
    if (!bill) return res.status(404).json({ success: false, error: 'Bill not found' });
    bill.isPaid = true;
    await bill.save();
    res.status(200).json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};