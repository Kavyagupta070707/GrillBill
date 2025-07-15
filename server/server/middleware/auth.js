const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).populate('restaurantId');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid. User not found.'
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact administrator.'
        });
      }

      // Check restaurant subscription for non-admin users
      if (user.role !== 'admin' && user.restaurantId) {
        const restaurant = await Restaurant.findById(user.restaurantId);
        if (!restaurant || !restaurant.isActive || restaurant.subscription.status !== 'active') {
          return res.status(403).json({
            success: false,
            message: 'Restaurant subscription is inactive.'
          });
        }
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication middleware'
    });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

// Check if user belongs to the same restaurant (for staff operations)
const checkRestaurantAccess = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    
    if (req.user.role === 'admin') {
      // Admin can access their own restaurant
      const restaurant = await Restaurant.findOne({ _id: restaurantId, adminId: req.user._id });
      if (!restaurant) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own restaurant.'
        });
      }
    } else {
      // Staff can only access their assigned restaurant
      if (req.user.restaurantId.toString() !== restaurantId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your assigned restaurant.'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in restaurant access check'
    });
  }
};

module.exports = {
  protect,
  authorize,
  checkRestaurantAccess
};