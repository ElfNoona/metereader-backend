const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const readingRoutes = require('./routes/reading.routes');
const billingRoutes = require('./routes/billing.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically (useful for debugging OCR)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Serve generated invoices statically (optional based on security needs)
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/billing', billingRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Meter Reader OCR Backend is active and running.' });
});

module.exports = app;
