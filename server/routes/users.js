const express = require('express');
const {
  registerStaff,
  getStaff,
  getStaffMember,
  updateStaff,
  deleteStaff,
  getProfile,
  updateProfile
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const {
  validateStaffRegistration,
  validateUserUpdate
} = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// Staff management routes (Admin only)
router.post('/register-staff', authorize('admin'), validateStaffRegistration, registerStaff);
router.get('/staff', authorize('admin', 'manager'), getStaff);
router.get('/staff/:id', authorize('admin', 'manager'), getStaffMember);
router.put('/staff/:id', authorize('admin'), validateUserUpdate, updateStaff);
router.delete('/staff/:id', authorize('admin'), deleteStaff);

// Profile routes (All authenticated users)
router.get('/profile', getProfile);
router.put('/profile', validateUserUpdate, updateProfile);

module.exports = router;