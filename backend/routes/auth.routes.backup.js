const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  authenticateToken,
  authorize 
} = require('../middleware/auth');
const { validate, authSchema } = require('../middleware/validation');
const db = require('../models');

const User = db.User;
// const Employee = db.Employee; // Disabled for now
// const RefreshToken = db.RefreshToken; // Disabled for now
const router = express.Router();

// Register new user (HR and Admin only)
router.post('/register', authenticateToken, authorize('admin', 'hr'), validate(authSchema.register), async (req, res) => {
  try {
    const { email, password, role = 'employee' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login user
router.post('/login', validate(authSchema.login), async (req, res) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Find user with password (simplified query)
    const user = await User.scope('withPassword').findOne({ 
      where: { 
        email: email.toLowerCase(), 
        isActive: true 
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate access token only (simplified)
    const accessToken = generateAccessToken(user);

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      },
      // For compatibility with existing tests
      token: accessToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Remove password from response
// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Find refresh token
    const tokenRecord = await RefreshToken.findOne({
      where: { 
        token: refreshToken,
        isRevoked: false,
        expiresAt: { [Op.gt]: new Date() }
      },
      include: [{
        model: User,
        as: 'user',
        include: [{
          model: Employee,
          as: 'employee'
        }]
      }]
    });

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Verify refresh token
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      await tokenRecord.update({ isRevoked: true, revokedAt: new Date() });
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(tokenRecord.user);

    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message
    });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await RefreshToken.update(
        { isRevoked: true, revokedAt: new Date() },
        { where: { token: refreshToken, userId: req.userId } }
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Basic validation
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const updateData = {};
    if (email) updateData.email = email;

    await req.user.update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: req.user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: error.message
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, validate(authSchema.changePassword), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.scope('withPassword').findByPk(req.userId);
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await user.update({ 
      password: hashedNewPassword,
      passwordChangedAt: new Date()
    });

    // Revoke all refresh tokens for security
    await RefreshToken.update(
      { isRevoked: true, revokedAt: new Date() },
      { where: { userId: req.userId } }
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed',
      error: error.message
    });
  }
});

// Reset user password (Admin/HR only)
router.post('/reset-password', authenticateToken, authorize('admin', 'hr'), validate(authSchema.resetPassword), async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await user.update({ 
      password: hashedPassword,
      passwordChangedAt: new Date()
    });

    // Revoke all refresh tokens for security
    await RefreshToken.update(
      { isRevoked: true, revokedAt: new Date() },
      { where: { userId: userId } }
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
});

// Toggle user account status (Admin/HR only)
router.put('/users/:userId/status', authenticateToken, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive field must be a boolean'
      });
    }

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user status
    await user.update({ isActive });

    // If deactivating, revoke all refresh tokens
    if (!isActive) {
      await RefreshToken.update(
        { isRevoked: true, revokedAt: new Date() },
        { where: { userId: userId } }
      );
    }

    res.json({
      success: true,
      message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { userId, isActive }
    });
  } catch (error) {
    console.error('User status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// Update user role (Admin only)
router.put('/users/:userId/role', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['employee', 'manager', 'hr', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user role
    await user.update({ role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { userId, role }
    });
  } catch (error) {
    console.error('User role update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
});

// Get user account details by employee ID
router.get('/users/employee/:employeeId', authenticateToken, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Find employee with user account
    const employee = await Employee.findByPk(employeeId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'role', 'isActive', 'lastLoginAt', 'createdAt']
      }]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email
        },
        user: employee.user
      }
    });
  } catch (error) {
    console.error('User lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
});

module.exports = router;
