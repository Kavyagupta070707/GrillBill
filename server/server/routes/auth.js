const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  registerAdmin,
  login,
  getMe,
  logout,
  updatePassword,
  validateProductKey
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validateAdminRegistration,
  validateLogin
} = require('../middleware/validation');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  }
});

// Public routes
router.post('/register-admin', authLimiter, validateAdminRegistration, registerAdmin);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/validate-product-key', authLimiter, validateProductKey);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;