const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { generateAccessToken } = require('../middleware/auth.simple');
const { authenticateToken, authorize } = require('../middleware/auth.simple');
const { validate, authSchema } = require('../middleware/validation');
const db = require('../models');

const User = db.User;
const Employee = db.Employee;
const router = express.Router();

// Login user
router.post('/login', validate(authSchema.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.scope('withPassword').findOne({
      where: { email: email, isActive: true },
      include: { model: Employee, as: 'employee', attributes: ['id'] },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const accessToken = generateAccessToken(user);

    await user.update({ lastLoginAt: new Date() });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employee ? user.employee.id : null,
        },
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during login.', error: error.message });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ success: true, data: req.user });
});

// Alias for profile route (for frontend compatibility)
router.get('/me', authenticateToken, (req, res) => {
  res.json({ success: true, data: req.user });
});

// Change password
router.put('/change-password', authenticateToken, validate(authSchema.changePassword), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.scope('withPassword').findByPk(req.userId);

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        await user.update({ password: hashedNewPassword, passwordChangedAt: new Date() });

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while changing the password.' });
    }
});

// Admin and HR routes
router.use(authenticateToken, authorize('admin', 'hr'));

// Register new user
router.post('/register', validate(authSchema.register), async (req, res) => {
    try {
        const { email, password, role = 'employee', ...otherData } = req.body;

        const existingUser = await User.findOne({ where: { email: email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            email,
            password: hashedPassword,
            role,
            ...otherData,
        });

        res.status(201).json({ success: true, message: 'User registered successfully.', data: newUser });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred during registration.' });
    }
});

// Reset user password (Admin/HR only)
router.put('/users/:userId/reset-password', async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword, forceChange = true } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await user.update({ 
            password: hashedPassword, 
            passwordChangedAt: new Date(),
            forcePasswordChange: forceChange
        });

        res.json({ success: true, message: 'Password reset successfully.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while resetting password.' });
    }
});

// Update user account (comprehensive update)
router.put('/users/:userId/account', async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, email, password, enableLogin, forcePasswordChange } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const updateData = {};
        
        if (role) updateData.role = role;
        if (email) updateData.email = email;
        if (enableLogin !== undefined) updateData.isActive = enableLogin;
        if (forcePasswordChange !== undefined) updateData.forcePasswordChange = forcePasswordChange;
        
        if (password) {
            updateData.password = await bcrypt.hash(password, 12);
            updateData.passwordChangedAt = new Date();
        }

        await user.update(updateData);

        res.json({ success: true, message: 'User account updated successfully.', data: user });
    } catch (error) {
        console.error('Update User Account Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating user account.' });
    }
});

// Create user account for existing employee
router.post('/users/employee/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { role = 'employee', password = 'password123', forcePasswordChange = true } = req.body;

        // Get employee
        const employee = await Employee.findByPk(employeeId);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: employee.email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User account already exists for this employee.' });
        }

        // Create user account
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            password: hashedPassword,
            role: role,
            isActive: true,
            passwordChangedAt: new Date(),
            forcePasswordChange: forcePasswordChange
        });

        // Link employee to user
        await employee.update({ userId: newUser.id });

        res.status(201).json({ 
            success: true, 
            message: 'User account created successfully.', 
            data: { 
                userId: newUser.id, 
                email: newUser.email, 
                role: newUser.role,
                defaultPassword: password 
            } 
        });
    } catch (error) {
        console.error('Create User Account Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while creating user account.' });
    }
});

// Update user role (Admin only)
router.put('/users/:userId/role', authorize('admin'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        await user.update({ role });

        res.json({ success: true, message: 'User role updated successfully.', data: user });
    } catch (error) {
        console.error('Update User Role Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating user role.' });
    }
});

// Toggle user status
router.put('/users/:userId/status', async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        await user.update({ isActive });

        res.json({ 
            success: true, 
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`, 
            data: user 
        });
    } catch (error) {
        console.error('Toggle User Status Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating user status.' });
    }
});

module.exports = router;
