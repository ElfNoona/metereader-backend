const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Streams a vector PDF invoice directly to a writable stream (e.g. Express Response)
 * @param {Object} bill - Active mongoose bill structure
 * @param {Object} user - Target user profile details
 * @param {Object} resStream - Express response object or writable stream
 */
const generateInvoicePDF = (bill, user, resStream) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.pipe(resStream);

    // Color Constants (Styled for IGL)
    const PRIMARY_BLUE = '#00529B'; // IGL Blue
    const DARK_CHARCOAL = '#2C2C2C';
    const LIGHT_GREY = '#F9F9F9';
    const BORDER_GREY = '#E0E0E0';
    const TEXT_DULL = '#666666';

    // 1. Header Design
    doc.rect(0, 0, 595.28, 120).fill(PRIMARY_BLUE); // Blue top banner
    
    doc.fillColor('#FFFFFF')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('INDRAPRASTHA GAS LIMITED', 50, 40);
       
    doc.fontSize(10)
       .font('Helvetica')
       .text('IGL Bhawan, Plot No. 4, Community Centre', 50, 68)
       .text('Sector 9, R.K. Puram, New Delhi - 110022', 50, 80);

    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('TAX INVOICE', 450, 40, { align: 'right' });

    doc.fontSize(9)
       .font('Helvetica')
       .text(`Invoice No: INV-${bill._id.toString().substring(0, 8).toUpperCase()}`, 400, 68, { align: 'right' })
       .text(`Billing Cycle: ${new Date(bill.billingCycleStart).toLocaleDateString()} - ${new Date(bill.billingCycleEnd).toLocaleDateString()}`, 300, 80, { align: 'right' });

    // 2. Billing Grid Details
    doc.y = 150;
    
    // User Section Left
    doc.fillColor(DARK_CHARCOAL).font('Helvetica-Bold').fontSize(12).text('BILL TO:', 50, 150);
    doc.font('Helvetica').fontSize(10)
       .text(`Name: ${user.fullName}`, 50, 170)
       .text(`BP Number: ${user.bpNumber}`, 50, 185)
       .text(`Address: ${user.address}`, 50, 200);

    // Metadata Right
    doc.font('Helvetica-Bold').fontSize(12).text('SUMMARY:', 350, 150);
    doc.font('Helvetica').fontSize(10)
       .text(`Previous Reading: ${bill.previousReading || 0} SCM`, 350, 170)
       .text(`Current Reading: ${bill.currentReading || 0} SCM`, 350, 185)
       .text(`Gas Consumption: ${bill.unitsConsumed} SCM`, 350, 200)
       .text(`Issue Date: ${new Date().toLocaleDateString()}`, 350, 215);

    // 3. Grid Table Details
    const tableTop = 245;
    doc.rect(50, tableTop, 495, 25).fill(DARK_CHARCOAL); // Table Header
    
    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .fontSize(10)
       .text('Charges Category', 70, tableTop + 7)
       .text('Calculation Metrics', 250, tableTop + 7)
       .text('Total (INR)', 450, tableTop + 7, { align: 'right' });

    // Table Row 1: Fixed charges
    const row1Top = tableTop + 25;
    doc.fillColor(DARK_CHARCOAL).rect(50, row1Top, 495, 30).fill(LIGHT_GREY);
    doc.fillColor(DARK_CHARCOAL).font('Helvetica')
       .text('Fixed Charges / Meter Rent', 70, row1Top + 10)
       .text('Applicable Fixed Daily Charges', 250, row1Top + 10)
       .text(`Rs. ${bill.fixedCharges.toFixed(2)}`, 450, row1Top + 10, { align: 'right' });

    // Table Row 2: Gas charges (PNG Consumption)
    const row2Top = row1Top + 30;
    doc.rect(50, row2Top, 495, 30).fill('#FFFFFF');
    doc.text('PNG Consumption Charges', 70, row2Top + 10)
       .text(`${bill.unitsConsumed} SCM @ Rs. 49.59/SCM`, 250, row2Top + 10)
       .text(`Rs. ${bill.gasCharges.toFixed(2)}`, 450, row2Top + 10, { align: 'right' });

    // Table Row 3: Duty tax
    const row3Top = row2Top + 30;
    doc.rect(50, row3Top, 495, 30).fill(LIGHT_GREY);
    doc.text('Taxes & Surcharges', 70, row3Top + 10)
       .text('VAT & other applicable taxes', 250, row3Top + 10)
       .text(`Rs. ${bill.taxAmount.toFixed(2)}`, 450, row3Top + 10, { align: 'right' });

    // Add a divider line
    doc.moveTo(50, row3Top + 30).lineTo(545, row3Top + 30).strokeColor(BORDER_GREY).stroke();

    // 4. Net Due Totals Box
    const totalBoxTop = row3Top + 45;
    doc.rect(320, totalBoxTop, 225, 40).fill(PRIMARY_BLUE);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12)
       .text('Total Payable:', 340, totalBoxTop + 14)
       .fontSize(14)
       .text(`Rs. ${bill.totalPayable.toFixed(2)}`, 430, totalBoxTop + 13, { align: 'right' });

    // 5. Explanatory Disclaimer footer
    doc.fillColor(TEXT_DULL).font('Helvetica-Oblique').fontSize(8)
       .text('* Invoice automatically calculated by the smart meter system. Current PNG retail price in Delhi is Rs. 49.59 per SCM. Ensure timely payment to avoid late payment surcharge (LPSC).', 50, 480, { width: 495, align: 'center' });

    doc.end();

    resStream.on('finish', () => resolve());
    resStream.on('error', (err) => reject(err));
  });
};

module.exports = { generateInvoicePDF };