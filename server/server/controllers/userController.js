const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// @desc    Register staff member (Admin only)
// @route   POST /api/users/register-staff
// @access  Private (Admin only)
const registerStaff = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, salary } = req.body;

    // Get admin's restaurant
    const restaurant = await Restaurant.findOne({ adminId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create staff member
    const staff = await User.create({
      name,
      email,
      password,
      role,
      phone,
      address,
      salary,
      restaurantId: restaurant._id,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Staff member registered successfully',
      user: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        employeeId: staff.employeeId,
        status: staff.status
      }
    });
  } catch (error) {
    console.error('Staff registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during staff registration'
    });
  }
};

// @desc    Get all staff members (Admin/Manager only)
// @route   GET /api/users/staff
// @access  Private (Admin/Manager only)
const getStaff = async (req, res) => {
  try {
    let restaurantId;

    if (req.user.role === 'admin') {
      const restaurant = await Restaurant.findOne({ adminId: req.user._id });
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: 'Restaurant not found'
        });
      }
      restaurantId = restaurant._id;
    } else {
      restaurantId = req.user.restaurantId;
    }

    const staff = await User.find({ 
      restaurantId,
      role: { $ne: 'admin' }
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff'
    });
  }
};

// @desc    Get single staff member
// @route   GET /api/users/staff/:id
// @access  Private (Admin/Manager only)
const getStaffMember = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check if staff belongs to the same restaurant
    let restaurantId;
    if (req.user.role === 'admin') {
      const restaurant = await Restaurant.findOne({ adminId: req.user._id });
      restaurantId = restaurant._id;
    } else {
      restaurantId = req.user.restaurantId;
    }

    if (staff.restaurantId.toString() !== restaurantId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      staff
    });
  } catch (error) {
    console.error('Get staff member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff member'
    });
  }
};

// @desc    Update staff member (Admin only)
// @route   PUT /api/users/staff/:id
// @access  Private (Admin only)
const updateStaff = async (req, res) => {
  try {
    const { name, phone, address, salary, status } = req.body;

    const staff = await User.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check if staff belongs to admin's restaurant
    const restaurant = await Restaurant.findOne({ adminId: req.user._id });
    if (staff.restaurantId.toString() !== restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update fields
    if (name) staff.name = name;
    if (phone) staff.phone = phone;
    if (address) staff.address = address;
    if (salary !== undefined) staff.salary = salary;
    if (status) staff.status = status;

    await staff.save();

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      staff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during staff update'
    });
  }
};

// @desc    Delete staff member (Admin only)
// @route   DELETE /api/users/staff/:id
// @access  Private (Admin only)
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check if staff belongs to admin's restaurant
    const restaurant = await Restaurant.findOne({ adminId: req.user._id });
    if (staff.restaurantId.toString() !== restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during staff deletion'
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('restaurantId');
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

module.exports = {
  registerStaff,
  getStaff,
  getStaffMember,
  updateStaff,
  deleteStaff,
  getProfile,
  updateProfile
};