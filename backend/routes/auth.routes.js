const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { generateAccessToken } = require('../middleware/auth.simple');
const { authenticateToken, authorize } = require('../middleware/auth.simple');
const { validate, validateParams } = require('../middleware/validate');
const validators = require('../middleware/validators');
const { NotFoundError, UnauthorizedError, ConflictError, ValidationError } = require('../utils/errors');
const db = require('../models');

const User = db.User;
const Employee = db.Employee;
const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password, returns JWT access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@skyraksys.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful.
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [admin, hr, manager, employee]
 *                         employeeId:
 *                           type: string
 *                           format: uuid
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Login user
router.post('/login', validate(validators.loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedData;

    const user = await User.scope('withPassword').findOne({
      where: { email: email, isActive: true },
      include: { model: Employee, as: 'employee', attributes: ['id'] },
    });

    // Security Check 1: Account manually locked by admin
    if (user?.isLocked) {
      console.log(`🔒 Login attempt on locked account: ${email}`);
      return res.status(423).json({
        success: false,
        message: 'Account is locked. Please contact your administrator.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Security Check 2: Temporary lockout from failed attempts
    if (user?.lockUntil && new Date() < user.lockUntil) {
      const remainingTime = Math.ceil((user.lockUntil - new Date()) / (1000 * 60));
      console.log(`⏰ Login attempt on temporarily locked account: ${email} (${remainingTime}m remaining)`);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked. Please try again in ${remainingTime} minute(s).`,
        code: 'ACCOUNT_TEMP_LOCKED'
      });
    }

    // Validate credentials
    if (!user || !(await bcrypt.compare(password, user.password))) {
      // Track failed login attempts
      if (user) {
        const attempts = (user.loginAttempts || 0) + 1;
        const maxAttempts = 5; // Conservative: 5 failed attempts
        const lockDuration = 15; // Conservative: 15 minutes lockout
        
        console.log(`❌ Failed login attempt ${attempts}/${maxAttempts} for: ${email}`);
        
        const updateData = { loginAttempts: attempts };
        
        // Apply temporary lockout after max attempts
        if (attempts >= maxAttempts) {
          updateData.lockUntil = new Date(Date.now() + lockDuration * 60 * 1000);
          console.log(`🚫 Account temporarily locked due to ${attempts} failed attempts: ${email}`);
        }
        
        await user.update(updateData);
      }
      
      throw new UnauthorizedError('Invalid credentials');
    }

    const accessToken = generateAccessToken(user);

    // Reset security counters on successful login
    const securityResetData = { lastLoginAt: new Date() };
    if (user.loginAttempts > 0 || user.lockUntil) {
      securityResetData.loginAttempts = 0;
      securityResetData.lockUntil = null;
      console.log(`✅ Security counters reset for successful login: ${email}`);
    }
    
    await user.update(securityResetData);

    // Set httpOnly cookie for security (protects against XSS)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,  // Cannot be accessed by JavaScript (XSS protection)
      secure: isProduction,  // Only send over HTTPS in production
      sameSite: isProduction ? 'strict' : 'lax',  // CSRF protection
      maxAge: 24 * 60 * 60 * 1000  // 24 hours
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        accessToken,  // Also send in response for backward compatibility
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employee ? user.employee.id : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ success: true, data: req.user });
});

// Alias for profile route (for frontend compatibility)
router.get('/me', authenticateToken, (req, res) => {
  res.json({ success: true, data: req.user });
});

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change user password
 *     description: Change the password for the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: oldPassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: newSecurePassword123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password changed successfully.
 *       401:
 *         description: Current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Change password
router.put('/change-password', authenticateToken, validate(validators.changePasswordSchema), async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.validatedData;
        const user = await User.scope('withPassword').findByPk(req.userId);

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            throw new UnauthorizedError('Current password is incorrect');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        await user.update({ password: hashedNewPassword, passwordChangedAt: new Date() });

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        next(error);
    }
});

// Admin and HR routes
router.use(authenticateToken, authorize('admin', 'hr'));

// Register new user
router.post('/register', validate(validators.registerSchema), async (req, res, next) => {
    try {
        const { email, password, role = 'employee', ...otherData } = req.validatedData;

        const existingUser = await User.findOne({ where: { email: email } });
        if (existingUser) {
            throw new ConflictError('User with this email already exists');
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
        next(error);
    }
});

// Reset user password (Admin/HR only)
router.put('/users/:userId/reset-password', 
    validateParams(validators.userIdParamSchema), 
    validate(validators.adminResetPasswordSchema), 
    async (req, res, next) => {
        try {
            const { userId } = req.validatedParams;
            const { newPassword, forceChange = true } = req.validatedData;

            const user = await User.findByPk(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            const hashedPassword = await bcrypt.hash(newPassword, 12);
            await user.update({ 
                password: hashedPassword, 
                passwordChangedAt: new Date(),
                forcePasswordChange: forceChange
            });

            res.json({ success: true, message: 'Password reset successfully.' });
        } catch (error) {
            next(error);
        }
    }
);

// Update user account (comprehensive update - Admin/HR only)
router.put('/users/:userId/account', 
    authenticateToken,
    authorize('admin', 'hr'),
    validateParams(validators.userIdParamSchema),
    async (req, res, next) => {
        try {
            const { userId } = req.validatedParams;
            const { role, email, password, enableLogin, forcePasswordChange } = req.body;

            const user = await User.findByPk(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            const updateData = {};
            
            // Validate role if provided
            if (role !== undefined) {
                const validRoles = ['admin', 'hr', 'manager', 'employee'];
                if (!validRoles.includes(role.toLowerCase())) {
                    throw new ValidationError('Invalid role specified');
                }
                updateData.role = role.toLowerCase();
            }
            
            if (email) updateData.email = email;
            if (enableLogin !== undefined) updateData.isActive = enableLogin;
            if (forcePasswordChange !== undefined) updateData.forcePasswordChange = forcePasswordChange;
            
            if (password) {
                // Validate password length
                if (password.length < 8) {
                    throw new ValidationError('Password must be at least 8 characters long');
                }
                updateData.password = await bcrypt.hash(password, 12);
                updateData.passwordChangedAt = new Date();
            }

            await user.update(updateData);

            res.json({ success: true, message: 'User account updated successfully.', data: user });
        } catch (error) {
            next(error);
        }
    }
);

// Create user account for existing employee
router.post('/users/employee/:employeeId', 
    validateParams(validators.employeeIdParamSchema),
    async (req, res, next) => {
        try {
            const { employeeId } = req.validatedParams;
            const { role = 'employee', password = 'password123', forcePasswordChange = true } = req.body;

            // Get employee
            const employee = await Employee.findByPk(employeeId);
            if (!employee) {
                throw new NotFoundError('Employee not found');
            }

            // Check if user already exists
            const existingUser = await User.findOne({ where: { email: employee.email } });
            if (existingUser) {
                throw new ConflictError('User account already exists for this employee');
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
            next(error);
        }
    }
);

// Update user role (Admin only)
router.put('/users/:userId/role', 
    authorize('admin'), 
    validateParams(validators.userIdParamSchema),
    validate(validators.updateRoleSchema),
    async (req, res, next) => {
        try {
            const { userId } = req.validatedParams;
            const { role } = req.validatedData;

            const user = await User.findByPk(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            await user.update({ role });

            res.json({ success: true, message: 'User role updated successfully.', data: user });
        } catch (error) {
            next(error);
        }
    }
);

// Toggle user status
router.put('/users/:userId/status', 
    authenticateToken,
    authorize('admin', 'hr'),
    validateParams(validators.userIdParamSchema),
    validate(validators.updateUserStatusSchema),
    async (req, res, next) => {
        try {
            const { userId } = req.validatedParams;
            const { isActive } = req.validatedData;

            const user = await User.findByPk(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Prevent self-deactivation
            if (userId === req.userId && !isActive) {
                throw new ConflictError('You cannot deactivate your own account');
            }

            await user.update({ isActive });

            res.json({ 
                success: true, 
                message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`, 
                data: user 
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get all users (Admin/HR only)
router.get('/users',
    authenticateToken,
    authorize('admin', 'hr'),
    async (req, res, next) => {
        try {
            const { page = 1, limit = 10, search, role, status } = req.query;
            const offset = (page - 1) * limit;

            const whereClause = {};
            
            // Search by email or name
            if (search) {
                whereClause[Op.or] = [
                    { email: { [Op.iLike]: `%${search}%` } },
                    { firstName: { [Op.iLike]: `%${search}%` } },
                    { lastName: { [Op.iLike]: `%${search}%` } }
                ];
            }

            // Filter by role
            if (role) {
                whereClause.role = role;
            }

            // Filter by status
            if (status !== undefined) {
                whereClause.isActive = status === 'active';
            }

            const { count, rows } = await User.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: Employee,
                        as: 'employee',
                        attributes: ['id', 'employeeId', 'departmentId', 'positionId'],
                        required: false
                    }
                ],
                attributes: { exclude: ['password'] },
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']]
            });

            res.json({
                success: true,
                data: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalRecords: count,
                    recordsPerPage: parseInt(limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// Terminate user (Admin only) - Soft delete by deactivating
router.delete('/users/:userId',
    authenticateToken,
    authorize('admin'),
    validateParams(validators.userIdParamSchema),
    async (req, res, next) => {
        try {
            const { userId } = req.validatedParams;

            // Prevent admin from terminating themselves
            if (userId === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot terminate your own account'
                });
            }

            const user = await User.findByPk(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Soft delete: deactivate instead of destroying
            await user.update({
                isActive: false,
                terminatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'User terminated successfully (account deactivated)'
            });
        } catch (error) {
            next(error);
        }
    }
);

// Lock/Unlock user account (Admin only)
router.put('/users/:userId/lock',
    authenticateToken,
    authorize('admin'),
    validateParams(validators.userIdParamSchema),
    async (req, res, next) => {
        try {
            const { userId } = req.validatedParams;
            const { isLocked, reason } = req.body;

            if (userId === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot lock your own account'
                });
            }

            const user = await User.findByPk(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            await user.update({
                isLocked: isLocked,
                lockedAt: isLocked ? new Date() : null,
                lockedReason: isLocked ? reason : null
            });

            res.json({
                success: true,
                message: `User account ${isLocked ? 'locked' : 'unlocked'} successfully`
            });
        } catch (error) {
            next(error);
        }
    }
);

// Send welcome email to user (Admin/HR only)
router.post('/users/:userId/send-welcome-email',
    authenticateToken,
    authorize('admin', 'hr'),
    validateParams(validators.userIdParamSchema),
    async (req, res, next) => {
        try {
            const { userId } = req.validatedParams;
            const { includePassword, tempPassword } = req.body;

            const user = await User.findByPk(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            const emailService = require('../services/email.service');
            
            if (!emailService.isConfigured()) {
                return res.status(503).json({
                    success: false,
                    message: 'Email service not configured. Please contact administrator.'
                });
            }

            if (includePassword && tempPassword) {
                await emailService.sendWelcomeEmail(user, tempPassword);
            } else {
                await emailService.sendAccountStatusChangeEmail(user, user.isActive);
            }

            res.json({
                success: true,
                message: 'Email sent successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Clear authentication cookie and invalidate session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    // Clear the httpOnly cookie
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
