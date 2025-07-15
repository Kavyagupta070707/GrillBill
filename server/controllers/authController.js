const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const ProductKey = require('../models/ProductKey');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        restaurantId: user.restaurantId,
        employeeId: user.employeeId
      }
    });
};

// @desc    Register admin with product key
// @route   POST /api/auth/register-admin
// @access  Public
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, productKey, restaurantName, restaurantAddress, restaurantPhone } = req.body;

    // Check if product key is valid
    const validKeys = process.env.VALID_PRODUCT_KEYS.split(',');
    if (!validKeys.includes(productKey)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product key'
      });
    }

    // Check if product key is already used
    let productKeyDoc = await ProductKey.findOne({ key: productKey });
    if (productKeyDoc && productKeyDoc.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Product key has already been used'
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

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    // Create restaurant
    const restaurant = await Restaurant.create({
      name: restaurantName,
      address: restaurantAddress ? {
        street: restaurantAddress.street,
        city: restaurantAddress.city,
        state: restaurantAddress.state,
        zipCode: restaurantAddress.zipCode,
        country: restaurantAddress.country || 'India'
      } : {},
      phone: restaurantPhone,
      email: email,
      adminId: admin._id,
      productKey
    });

    // Update admin with restaurant ID
    admin.restaurantId = restaurant._id;
    await admin.save();

    // Mark product key as used or create new record
    if (productKeyDoc) {
      productKeyDoc.isUsed = true;
      productKeyDoc.usedBy = admin._id;
      productKeyDoc.usedAt = new Date();
      await productKeyDoc.save();
    } else {
      await ProductKey.create({
        key: productKey,
        isUsed: true,
        usedBy: admin._id,
        usedAt: new Date()
      });
    }

    sendTokenResponse(admin, 201, res);
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password').populate('restaurantId');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check restaurant subscription for non-admin users
    if (user.role !== 'admin' && user.restaurantId) {
      const restaurant = await Restaurant.findById(user.restaurantId);
      if (!restaurant || !restaurant.isActive || restaurant.subscription.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Restaurant subscription is inactive. Please contact administrator.'
        });
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('restaurantId');
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password update'
    });
  }
};

// @desc    Validate product key
// @route   POST /api/auth/validate-product-key
// @access  Public
const validateProductKey = async (req, res) => {
  try {
    const { productKey } = req.body;

    // Check if product key is in valid keys list
    const validKeys = process.env.VALID_PRODUCT_KEYS.split(',');
    if (!validKeys.includes(productKey)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product key'
      });
    }

    // Check if product key is already used
    const productKeyDoc = await ProductKey.findOne({ key: productKey });
    if (productKeyDoc && productKeyDoc.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Product key has already been used'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product key is valid'
    });
  } catch (error) {
    console.error('Validate product key error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during product key validation'
    });
  }
};

module.exports = {
  registerAdmin,
  login,
  getMe,
  logout,
  updatePassword,
  validateProductKey
};