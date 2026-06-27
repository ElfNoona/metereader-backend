const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Authentication Endpoints
router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshSession);
router.post('/logout', authController.logout);

module.exports = router;
