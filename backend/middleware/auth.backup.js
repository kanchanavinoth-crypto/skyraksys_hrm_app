const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

const User = db.User;
const Employee = db.Employee;
const RefreshToken = db.RefreshToken;

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      employeeId: user.employee?.id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

// Generate refresh token
const generateRefreshToken = async (user, userAgent, ipAddress) => {
  const token = jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    token,
    userId: user.id,
    expiresAt,
    userAgent,
    ipAddress
  });

  return token;
};

// Auth middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Employee,
        as: 'employee',
        include: [
          { model: db.Department, as: 'department' },
          { model: db.Position, as: 'position' }
        ]
      }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    req.employeeId = user.employee?.id;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user is admin or HR
const isAdminOrHR = (req, res, next) => {
  return authorize('admin', 'hr')(req, res, next);
};

// Check if user is manager or above
const isManagerOrAbove = (req, res, next) => {
  return authorize('admin', 'hr', 'manager')(req, res, next);
};

// Check if user can access employee data (own data or if they're manager/admin/hr)
const canAccessEmployee = async (req, res, next) => {
  try {
    const employeeId = req.params.id || req.params.employeeId;
    
    // Admin and HR can access all employee data
    if (['admin', 'hr'].includes(req.user.role)) {
      return next();
    }

    // Users can access their own data
    if (req.employeeId === employeeId) {
      return next();
    }

    // Managers can access their subordinates' data
    if (req.user.role === 'manager') {
      const employee = await Employee.findByPk(employeeId);
      if (employee && employee.managerId === req.employeeId) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking permissions'
    });
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  authenticateToken,
  authorize,
  isAdminOrHR,
  isManagerOrAbove,
  canAccessEmployee,
  bcrypt
};
