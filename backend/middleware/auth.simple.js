const jwt = require('jsonwebtoken');
const db = require('../models');
const authConfig = require('../config/auth.config');
const LogHelper = require('../utils/logHelper');

const User = db.User;
const Employee = db.Employee;

const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employee ? user.employee.id : null,
  };
  return jwt.sign(payload, authConfig.secret, {
    expiresIn: authConfig.expiresIn,
  });
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    LogHelper.logAuthEvent('token_missing', false, { 
      reason: 'No token provided',
      path: req.path 
    }, req);
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, authConfig.secret);
    
    const user = await User.findByPk(decoded.id, {
      include: {
        model: Employee,
        as: 'employee',
        attributes: ['id', 'managerId'],
      },
    });

    if (!user || !user.isActive) {
      LogHelper.logAuthEvent('token_invalid_user', false, {
        reason: !user ? 'User not found' : 'User is inactive',
        userId: decoded.id,
        email: decoded.email
      }, req);
      return res.status(401).json({ success: false, message: 'User not found or is inactive.' });
    }

    // Log successful authentication
    LogHelper.logAuthEvent('token_verified', true, {
      userId: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id
    }, req);

    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    req.employeeId = user.employee ? user.employee.id : null;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      LogHelper.logAuthEvent('token_expired', false, {
        reason: 'Token has expired',
        error: error.message
      }, req);
      return res.status(401).json({ success: false, message: 'Token has expired.' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      LogHelper.logAuthEvent('token_invalid', false, {
        reason: 'Invalid token',
        error: error.message
      }, req);
      return res.status(403).json({ success: false, message: 'Invalid token.' });
    }
    LogHelper.logError(error, { context: 'token_authentication' }, req);
    return res.status(500).json({ success: false, message: 'Failed to authenticate token.' });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Flatten the roles array if it's nested (handles both authorize('admin') and authorize(['admin', 'hr']))
    const roles = allowedRoles.flat();
    
    // Debug logging
    console.log('🔐 Authorization Check:', {
      userRole: req.userRole,
      allowedRoles: roles,
      path: req.path,
      userId: req.userId,
      hasUser: !!req.user
    });
    
    if (!req.userRole || !roles.includes(req.userRole)) {
      LogHelper.logAuthzEvent('access_denied', false, {
        userRole: req.userRole,
        allowedRoles: roles,
        resource: req.path,
        action: req.method,
        reason: 'Insufficient permissions'
      }, req);
      console.log('❌ Access denied - User role:', req.userRole, 'Required roles:', roles);
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    
    LogHelper.logAuthzEvent('access_granted', true, {
      userRole: req.userRole,
      allowedRoles: roles,
      resource: req.path,
      action: req.method
    }, req);
    
    next();
  };
};

const isAdminOrHR = authorize('admin', 'hr');

const isManagerOrAbove = authorize('admin', 'hr', 'manager');

const canAccessEmployee = async (req, res, next) => {
    const targetEmployeeId = req.params.id || req.params.employeeId;

    if (req.userRole === 'admin' || req.userRole === 'hr') {
        return next();
    }

    // Convert to numbers for comparison to handle type mismatch
    if (req.employeeId && parseInt(req.employeeId) === parseInt(targetEmployeeId)) {
        return next();
    }

    if (req.userRole === 'manager') {
        const subordinate = await Employee.findOne({ where: { id: targetEmployeeId, managerId: req.employeeId } });
        if (subordinate) {
            return next();
        }
    }

    LogHelper.logAuthzEvent('employee_access_denied', false, {
        userRole: req.userRole,
        userEmployeeId: req.employeeId,
        targetEmployeeId: targetEmployeeId,
        reason: 'User cannot access this employee record'
    }, req);

    return res.status(403).json({ success: false, message: 'You do not have permission to access this employee\'s data.' });
};

module.exports = {
  generateAccessToken,
  authenticateToken,
  authorize,
  isAdminOrHR,
  isManagerOrAbove,
  canAccessEmployee,
};
