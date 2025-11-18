const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { authenticateToken, authorize, canAccessEmployee, isAdminOrHR } = require('../middleware/auth.simple');
const { validate, validateQuery, validateParams } = require('../middleware/validate');
const validators = require('../middleware/validators');
const { NotFoundError, ConflictError, ForbiddenError, BadRequestError } = require('../utils/errors');
const { uploadEmployeePhoto, handleUploadError } = require('../middleware/upload');
const { applyFieldFiltering } = require('../middleware/fieldAccessControl');
const { enhancedFieldAccessControl } = require('../middleware/enhancedFieldAccessControl');
const { 
  enhancedSessionTracking, 
  comprehensiveAuditLog, 
  enhancedRateLimiting, 
  suspiciousActivityDetection 
} = require('../middleware/enhancedSecurity');
const db = require('../models');
const LogHelper = require('../utils/logHelper');
const { logger } = require('../config/logger');

const Employee = db.Employee;
const User = db.User;
const Department = db.Department;
const Position = db.Position;
const LeaveRequest = db.LeaveRequest;
const Timesheet = db.Timesheet;
const router = express.Router();

// Enhanced security middleware stack
router.use(authenticateToken);
router.use(enhancedSessionTracking());
router.use(comprehensiveAuditLog());
router.use(enhancedRateLimiting({ 
  maxRequests: 100, 
  maxSensitiveRequests: 20 
}));
router.use(suspiciousActivityDetection());
router.use(enhancedFieldAccessControl());

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees with pagination and filtering
 *     description: Retrieve a paginated list of employees with advanced filtering options. Role-based access controls apply - employees see only themselves, managers see their team, admin/HR see all.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 1000
 *         description: Number of employees per page (admin/HR max 1000, others max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by first name, last name, or email
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by department ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, on leave, terminated]
 *         description: Filter by employment status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: firstName
 *         description: Sort field (firstName, lastName, hireDate, etc.)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Employee list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// GET all employees with enhanced filtering, pagination, and role-based access
router.get('/', validateQuery(validators.employeeQuerySchema), async (req, res, next) => {
    try {
        // Set role-based default limit: admin/HR get all employees (1000), others get 10
        const defaultLimit = (req.userRole === 'admin' || req.userRole === 'hr') ? 1000 : 10;
        const { page, limit, search, department, status, sort, order } = req.validatedQuery;
        
        // Validate and sanitize pagination parameters
        const validatedPage = page;
        // Allow higher limits for admin/HR (up to 1000), regular users capped at 100
        const maxLimit = (req.userRole === 'admin' || req.userRole === 'hr') ? 1000 : 100;
        const validatedLimit = Math.min(limit || defaultLimit, maxLimit);
        const offset = (validatedPage - 1) * validatedLimit;
        
        logger.debug('Employee list request', { 
            role: req.userRole, 
            page: validatedPage, 
            limit: validatedLimit, 
            search, 
            department, 
            status 
        });
        
        let where = {};
        const isOwnRecord = false; // This is a list view, not individual record
        
        // Apply role-based filtering
        if (req.userRole === 'manager') {
            const subordinates = await Employee.findAll({ where: { managerId: req.employeeId }, attributes: ['id'] });
            const subordinateIds = subordinates.map(e => e.id);
            where.id = { [Op.in]: [...subordinateIds, req.employeeId] };
        } else if (req.userRole === 'employee') {
            where.id = req.employeeId;
        }

        if (search) {
            where[Op.or] = [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ];
        }
        if (department) where.departmentId = department;
        if (status) {
            // Handle both capitalized and lowercase status values
            // Validator already accepts capitalized values, so use them directly
            where.status = status;
        }

        const { count, rows: employees } = await Employee.findAndCountAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['email', 'role', 'isActive'] },
                { model: Department, as: 'department' },
                { model: Position, as: 'position' },
                { model: Employee, as: 'manager', attributes: ['id', 'firstName', 'lastName'] }
            ],
            order: [[sort, order.toUpperCase()]],
            limit: validatedLimit,
            offset,
            distinct: true,
        });

        // Apply field-level filtering to each employee
        const filteredEmployees = employees.map(employee => {
            const employeeData = employee.toJSON();
            const isUserOwnRecord = employee.id === req.employeeId;
            return req.filterEmployeeData(employeeData, isUserOwnRecord);
        });
        
        logger.debug('Employee list results', { 
            returned: filteredEmployees.length, 
            total: count, 
            role: req.userRole 
        });

        res.json({
            success: true,
            data: filteredEmployees,
            pagination: {
                currentPage: validatedPage,
                totalPages: Math.ceil(count / validatedLimit),
                totalRecords: count,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/employees/meta/departments:
 *   get:
 *     summary: Get all active departments (metadata endpoint)
 *     description: Retrieve a list of all active departments for dropdown/selection purposes
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Departments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Department'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// --- Metadata Routes (must be before /:id route) ---
router.get('/meta/departments', async (req, res, next) => {
    try {
        const departments = await Department.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
        res.json({ success: true, data: departments });
    } catch (error) {
        next(error);
    }
});

// Alias for frontend compatibility
router.get('/departments', async (req, res, next) => {
    try {
        const departments = await Department.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
        res.json({ success: true, data: departments });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/employees/managers:
 *   get:
 *     summary: Get all managers for dropdown/selection
 *     description: Retrieve a list of all active managers (users with manager, admin, or HR roles) - Admin/HR only
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Managers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           role:
 *                             type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// GET all managers (for dropdown/selection purposes) - must be before /:id route
router.get('/managers', isAdminOrHR, async (req, res, next) => {
    try {
        const managers = await Employee.findAll({
            include: [
                { 
                    model: User, 
                    as: 'user', 
                    where: { 
                        role: { [Op.in]: ['manager', 'admin', 'hr'] },
                        isActive: true 
                    },
                    attributes: ['id', 'role']
                }
            ],
            attributes: ['id', 'firstName', 'lastName', 'email'],
            order: [['firstName', 'ASC']]
        });

        res.json({ 
            success: true, 
            data: managers 
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/employees/meta/positions:
 *   get:
 *     summary: Get all active positions (metadata endpoint)
 *     description: Retrieve a list of all active positions for dropdown/selection purposes
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Positions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Position'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/meta/positions', async (req, res, next) => {
    try {
        const positions = await Position.findAll({ where: { isActive: true }, order: [['title', 'ASC']] });
        res.json({ success: true, data: positions });
    } catch (error) {
        next(error);
    }
});

// Alias for frontend compatibility
router.get('/positions', async (req, res, next) => {
    try {
        const positions = await Position.findAll({ where: { isActive: true }, order: [['title', 'ASC']] });
        res.json({ success: true, data: positions });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/employees/statistics:
 *   get:
 *     summary: Get employee statistics
 *     description: Retrieve aggregate statistics about employees (total, active, inactive, new hires this month) - Admin/HR only
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     active:
 *                       type: integer
 *                       example: 142
 *                     inactive:
 *                       type: integer
 *                       example: 8
 *                     newThisMonth:
 *                       type: integer
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// GET: Employee statistics - Admin/HR only
router.get('/statistics', isAdminOrHR, async (req, res, next) => {
    try {
        const total = await Employee.count();
        const active = await Employee.count({ where: { status: 'Active' } });
        const inactive = await Employee.count({ where: { status: 'Inactive' } });
        
        // Get new employees this month
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        
        const newThisMonth = await Employee.count({
            where: {
                hireDate: {
                    [Op.gte]: currentMonth
                }
            }
        });

        res.json({
            success: true,
            data: {
                total,
                active,
                inactive,
                newThisMonth
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     description: Retrieve detailed information about a specific employee with field-level permissions applied. Employees can view only themselves, managers can view their team, admin/HR can view all.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID (UUID)
 *     responses:
 *       200:
 *         description: Employee retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/employees/me:
 *   get:
 *     summary: Get current user's employee profile
 *     description: Retrieve the employee profile for the currently authenticated user
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee profile not found for current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', async (req, res, next) => {
    try {
        // Find employee by userId (the authenticated user's ID)
        const employee = await Employee.findOne({
            where: { userId: req.userId },
            include: [
                { model: User, as: 'user', attributes: ['email', 'role', 'isActive'] },
                { model: Department, as: 'department' },
                { model: Position, as: 'position' },
                { model: Employee, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Employee, as: 'subordinates', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        if (!employee) {
            throw new NotFoundError('Employee profile not found for your user account.');
        }

        // Apply field-level filtering (user viewing their own record)
        const employeeData = employee.toJSON();
        const filteredData = req.filterEmployeeData(employeeData, true); // isOwnRecord = true

        res.json({
            success: true,
            data: filteredData
        });
    } catch (error) {
        next(error);
    }
});

// GET a single employee by ID with enhanced field-level permissions
router.get('/:id', canAccessEmployee, validateParams(validators.uuidParamSchema), async (req, res, next) => {
    try {
        const employee = await Employee.findByPk(req.validatedParams.id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'email', 'role', 'isActive'] },
                { model: Department, as: 'department' },
                { model: Position, as: 'position' },
                { model: Employee, as: 'manager', attributes: ['id', 'firstName', 'lastName'] },
                { model: Employee, as: 'subordinates', attributes: ['id', 'firstName', 'lastName'] },
            ],
        });

        if (!employee) {
            throw new NotFoundError('Employee not found.');
        }

        // Apply field-level filtering
        const employeeData = employee.toJSON();
        const isOwnRecord = employee.id === req.employeeId;
        const filteredData = req.filterEmployeeData(employeeData, isOwnRecord);

        res.json({ success: true, data: filteredData });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/employees/{id}/photo:
 *   post:
 *     summary: Upload employee photo
 *     description: Upload a profile photo for an existing employee - Admin/HR only
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Employee photo file (jpg, jpeg, png, gif - max 5MB)
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
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
 *                   example: Photo uploaded successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     photoUrl:
 *                       type: string
 *                       example: /uploads/employee-photos/1698517200000-photo.jpg
 *                     filename:
 *                       type: string
 *                       example: 1698517200000-photo.jpg
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// POST photo upload for existing employee (Admin or HR only)
router.post('/:id/photo', isAdminOrHR, uploadEmployeePhoto, handleUploadError, validateParams(validators.uuidParamSchema), async (req, res, next) => {
    try {
        const employeeId = req.validatedParams.id;
        
        // Check if employee exists
        const employee = await Employee.findByPk(employeeId);
        if (!employee) {
            throw new NotFoundError('Employee not found.');
        }

        // Check if file was uploaded
        if (!req.file) {
            throw new BadRequestError('No photo file uploaded.');
        }

        // Update employee with new photo URL
        const photoUrl = `/uploads/employee-photos/${req.file.filename}`;
        await employee.update({ photoUrl });

        res.json({ 
            success: true, 
            message: 'Photo uploaded successfully.',
            data: { 
                photoUrl,
                filename: req.file.filename
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee
 *     description: Create a new employee record with user account and optional salary structure - Admin/HR only
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - departmentId
 *               - positionId
 *               - hireDate
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@company.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Initial password (defaults to password123 if not provided)
 *                 example: SecurePass123!
 *               employeeId:
 *                 type: string
 *                 description: Custom employee ID (auto-generated if not provided)
 *                 example: EMP001
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *               positionId:
 *                 type: string
 *                 format: uuid
 *               managerId:
 *                 type: string
 *                 format: uuid
 *               hireDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-15
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               country:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, On Leave, Terminated]
 *                 default: Active
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Employee photo file
 *               salary:
 *                 type: object
 *                 properties:
 *                   basicSalary:
 *                     type: number
 *                     example: 50000
 *                   allowances:
 *                     type: object
 *                     properties:
 *                       hra:
 *                         type: number
 *                       transport:
 *                         type: number
 *                       medical:
 *                         type: number
 *                   deductions:
 *                     type: object
 *                     properties:
 *                       pf:
 *                         type: number
 *     responses:
 *       201:
 *         description: Employee created successfully
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
 *                   example: Employee created successfully.
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Employee with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// POST a new employee (Admin or HR only)
router.post('/', isAdminOrHR, uploadEmployeePhoto, handleUploadError, validate(validators.createEmployeeSchema), async (req, res, next) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { email, password, salaryStructure, salary, ...employeeData } = req.validatedData;

        const existingEmployee = await Employee.findOne({ where: { email: email } });
        if (existingEmployee) {
            throw new ConflictError('An employee with this email already exists.');
        }

        // Check for duplicate employee ID if provided
        if (employeeData.employeeId) {
            const existingEmployeeById = await Employee.findOne({ where: { employeeId: employeeData.employeeId } });
            if (existingEmployeeById) {
                throw new ConflictError(`An employee with ID '${employeeData.employeeId}' already exists.`);
            }
        }

        const hashedPassword = await bcrypt.hash(password || 'password123', 12);
        const user = await User.create({
            email,
            password: hashedPassword,
            role: 'employee',
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
        }, { transaction });

        if (req.file) {
            employeeData.photoUrl = `/uploads/employee-photos/${req.file.filename}`;
        }

        // Use provided employee ID or generate next employee ID
        let employeeId = employeeData.employeeId; // Use user-provided ID if available
        
        if (!employeeId) {
            // Generate next employee ID only if not provided
            const latestEmployee = await Employee.findOne({
                order: [['employeeId', 'DESC']],
                where: {
                    employeeId: {
                        [db.Sequelize.Op.like]: 'EMP%'
                    }
                }
            });
            
            let nextEmployeeNumber = 1;
            if (latestEmployee && latestEmployee.employeeId) {
                const currentNumber = parseInt(latestEmployee.employeeId.replace('EMP', ''));
                nextEmployeeNumber = currentNumber + 1;
            }
            employeeId = `EMP${nextEmployeeNumber.toString().padStart(3, '0')}`;
        }

        const newEmployee = await Employee.create({
            ...employeeData,
            employeeId,
            email,
            userId: user.id,
            // Store salary JSON in employee record
            salary: salary || null
        }, { transaction });

        // Create comprehensive salary structure if provided (new format)
        if (salary && salary.basicSalary) {
            await db.SalaryStructure.create({
                employeeId: newEmployee.id,
                basicSalary: salary.basicSalary,
                hra: salary.allowances?.hra || 0,
                allowances: (salary.allowances?.transport || 0) + (salary.allowances?.medical || 0) + 
                           (salary.allowances?.food || 0) + (salary.allowances?.communication || 0) + 
                           (salary.allowances?.special || 0) + (salary.allowances?.other || 0),
                pfContribution: salary.deductions?.pf || 0,
                effectiveFrom: salary.effectiveFrom || new Date().toISOString().split('T')[0],
                isActive: true
            }, { transaction });
        }
        // Create legacy salary structure if provided (backward compatibility)
        else if (salaryStructure && salaryStructure.basicSalary) {
            await db.SalaryStructure.create({
                ...salaryStructure,
                employeeId: newEmployee.id,
                effectiveFrom: salaryStructure.effectiveFrom || new Date().toISOString().split('T')[0],
                isActive: true
            }, { transaction });
        }

        await transaction.commit();
        
        // Fetch employee with salary structure for response
        const employeeWithSalary = await Employee.findByPk(newEmployee.id, {
            include: [{
                model: db.SalaryStructure,
                as: 'salaryStructure'
            }]
        });
        
        res.status(201).json({ success: true, message: 'Employee created successfully.', data: employeeWithSalary });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
});

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Update an employee
 *     description: Update employee information. Admin/HR can update all fields, managers/employees can update limited fields on themselves.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               country:
 *                 type: string
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *                 description: Admin/HR only
 *               positionId:
 *                 type: string
 *                 format: uuid
 *                 description: Admin/HR only
 *               managerId:
 *                 type: string
 *                 format: uuid
 *                 description: Admin/HR only
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, On Leave, Terminated]
 *                 description: Admin/HR only
 *               hireDate:
 *                 type: string
 *                 format: date
 *                 description: Admin/HR only
 *               salaryStructure:
 *                 type: object
 *                 description: Admin/HR only
 *                 properties:
 *                   basicSalary:
 *                     type: number
 *                   hra:
 *                     type: number
 *                   allowances:
 *                     type: number
 *                   pfContribution:
 *                     type: number
 *     responses:
 *       200:
 *         description: Employee updated successfully
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
 *                   example: Employee updated successfully.
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT to update an employee
router.put('/:id', canAccessEmployee, validateParams(validators.uuidParamSchema), (req, res, next) => {
    logger.debug('PUT /employees/:id request', { 
        employeeId: req.params.id, 
        bodyKeys: Object.keys(req.body),
        userId: req.user?.id
    });
    next();
}, validate(validators.updateEmployeeSchema), async (req, res, next) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { salaryStructure, salary, ...updateData } = req.validatedData;
        
        const employee = await Employee.findByPk(req.validatedParams.id);
        if (!employee) {
            await transaction.rollback();
            throw new NotFoundError('Employee not found.');
        }

        // Non-admins/HR cannot change critical fields
        if (req.userRole !== 'admin' && req.userRole !== 'hr') {
            delete updateData.departmentId;
            delete updateData.positionId;
            delete updateData.managerId;
            delete updateData.status;
            delete updateData.hireDate;
            delete updateData.salary;
            delete updateData.employeeId; // Only admins can change employee IDs
            // Also prevent salary structure updates for non-admin/hr
            if (salaryStructure || salary) {
                await transaction.rollback();
                throw new ForbiddenError('You do not have permission to update salary structure.');
            }
        }

        // Check for duplicate employee ID if being updated
        if (updateData.employeeId && updateData.employeeId !== employee.employeeId) {
            const existingEmployeeById = await Employee.findOne({ 
                where: { employeeId: updateData.employeeId } 
            });
            if (existingEmployeeById) {
                await transaction.rollback();
                throw new ConflictError(`An employee with ID '${updateData.employeeId}' already exists.`);
            }
        }

        // Include salary in updateData if provided and user has permission
        if (salary && (req.userRole === 'admin' || req.userRole === 'hr')) {
            updateData.salary = salary;
        }

        await employee.update(updateData, { transaction });
        
        // Handle salary structure update if provided and user has permission
        if ((salary || salaryStructure) && (req.userRole === 'admin' || req.userRole === 'hr')) {
            const existingSalaryStructure = await db.SalaryStructure.findOne({
                where: { employeeId: req.validatedParams.id, isActive: true }
            });
            
            if (existingSalaryStructure) {
                // Deactivate existing salary structure
                await existingSalaryStructure.update({ isActive: false }, { transaction });
            }
            
            // Create new salary structure from new format
            if (salary && salary.basicSalary) {
                await db.SalaryStructure.create({
                    employeeId: req.validatedParams.id,
                    basicSalary: salary.basicSalary,
                    hra: salary.allowances?.hra || 0,
                    allowances: (salary.allowances?.transport || 0) + (salary.allowances?.medical || 0) + 
                               (salary.allowances?.food || 0) + (salary.allowances?.communication || 0) + 
                               (salary.allowances?.special || 0) + (salary.allowances?.other || 0),
                    pfContribution: salary.deductions?.pf || 0,
                    effectiveFrom: salary.effectiveFrom || new Date().toISOString().split('T')[0],
                    isActive: true
                }, { transaction });
            }
            // Create new salary structure from legacy format
            else if (salaryStructure && salaryStructure.basicSalary) {
                await db.SalaryStructure.create({
                    ...salaryStructure,
                    employeeId: req.validatedParams.id,
                    effectiveFrom: salaryStructure.effectiveFrom || new Date().toISOString().split('T')[0],
                    isActive: true
                }, { transaction });
            }
        }
        
        await transaction.commit();
        
        // Fetch updated employee with salary structure
        const updatedEmployee = await Employee.findByPk(req.validatedParams.id, {
            include: [{
                model: db.SalaryStructure,
                as: 'salaryStructure',
                where: { isActive: true },
                required: false
            }]
        });
        
        res.json({ success: true, message: 'Employee updated successfully.', data: updatedEmployee });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
});

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Deactivate an employee
 *     description: Soft delete an employee by setting status to 'Terminated' and deactivating their user account - Admin/HR only
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID (UUID)
 *     responses:
 *       200:
 *         description: Employee deactivated successfully
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
 *                   example: Employee deactivated successfully.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// DELETE an employee (deactivate)
router.delete('/:id', isAdminOrHR, validateParams(validators.uuidParamSchema), async (req, res, next) => {
    const transaction = await db.sequelize.transaction();
    try {
        const employee = await Employee.findByPk(req.validatedParams.id);
        if (!employee) {
            await transaction.rollback();
            throw new NotFoundError('Employee not found.');
        }

        await employee.update({ status: 'Terminated' }, { transaction });
        if (employee.userId) {
            await User.update({ isActive: false }, { where: { id: employee.userId }, transaction });
        }

        await transaction.commit();
        res.json({ success: true, message: 'Employee deactivated successfully.' });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
});

/**
 * @swagger
 * /api/employees/{id}/compensation:
 *   put:
 *     summary: Update employee compensation
 *     description: Update salary and pay-related information for an employee - Admin/HR only
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               salary:
 *                 type: number
 *                 example: 75000
 *               payGrade:
 *                 type: string
 *                 example: L3
 *               payFrequency:
 *                 type: string
 *                 enum: [weekly, bi-weekly, monthly, annual]
 *                 example: monthly
 *     responses:
 *       200:
 *         description: Compensation updated successfully
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
 *                   example: Compensation updated successfully.
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT to update an employee's compensation (Admin or HR only)
router.put('/:id/compensation', isAdminOrHR, validateParams(validators.uuidParamSchema), validate(validators.updateCompensationSchema), async (req, res, next) => {
    try {
        const employee = await Employee.findByPk(req.validatedParams.id);
        if (!employee) {
            throw new NotFoundError('Employee not found.');
        }

        const { salary, payGrade, payFrequency } = req.validatedData;
        await employee.update({ salary, payGrade, payFrequency });

        const updatedEmployee = await Employee.findByPk(req.validatedParams.id);
        res.json({ success: true, message: 'Compensation updated successfully.', data: updatedEmployee });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/employees/{id}/status:
 *   patch:
 *     summary: Update employee status
 *     description: Update employment status and sync with user account active status - Admin/HR only
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, On Leave, Terminated]
 *                 example: Active
 *     responses:
 *       200:
 *         description: Status updated successfully
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
 *                   example: Status updated successfully.
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PATCH: Update employee status - Admin/HR only
router.patch('/:id/status', isAdminOrHR, validateParams(validators.uuidParamSchema), validate(validators.updateStatusSchema), async (req, res, next) => {
    try {
        const employee = await Employee.findByPk(req.validatedParams.id);
        if (!employee) {
            throw new NotFoundError('Employee not found.');
        }
        
        const { status } = req.validatedData;
        await employee.update({ status });
        
        // Also update user account status
        if (employee.user) {
            await employee.user.update({ isActive: status === 'Active' });
        }
        
        res.json({ success: true, message: 'Status updated successfully.', data: employee });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/employees/export:
 *   get:
 *     summary: Export employees to CSV
 *     description: Export filtered employee data as CSV file - Admin/HR only
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search filter
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Department filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Status filter
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// GET: Export employees - Admin/HR only
router.get('/export', isAdminOrHR, async (req, res) => {
    try {
        const { search, department, status } = req.query;
        
        let where = {};
        if (search) {
            where[Op.or] = [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ];
        }
        if (department) where.departmentId = department;
        if (status) where.status = status;

        const employees = await Employee.findAll({
            where,
            include: [
                { model: Department, as: 'department', attributes: ['name'] },
                { model: Position, as: 'position', attributes: ['title'] }
            ],
            order: [['firstName', 'ASC']]
        });

        // Create CSV content
        const csvHeader = 'Employee ID,First Name,Last Name,Email,Phone,Department,Position,Status,Hire Date\n';
        const csvRows = employees.map(emp => [
            emp.employeeId || '',
            emp.firstName || '',
            emp.lastName || '',
            emp.email || '',
            emp.phone || '',
            emp.department?.name || '',
            emp.position?.title || '',
            emp.status || '',
            emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : ''
        ].join(',')).join('\n');
        
        const csvContent = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=employees_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
    } catch (error) {
        LogHelper.logError(error, { context: 'Exporting employees to CSV' }, req);
        res.status(500).json({ success: false, message: 'Failed to export employees.' });
    }
});

/**
 * @swagger
 * /api/employees/bulk-update:
 *   post:
 *     summary: Bulk update employees
 *     description: Update multiple employees at once (status, department, manager) - Admin/HR only
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeIds
 *               - updateData
 *             properties:
 *               employeeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
 *               updateData:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [Active, Inactive, On Leave, Terminated]
 *                   departmentId:
 *                     type: string
 *                     format: uuid
 *                   managerId:
 *                     type: string
 *                     format: uuid
 *     responses:
 *       200:
 *         description: Employees updated successfully
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
 *                   example: 5 employees updated successfully.
 *                 updatedCount:
 *                   type: integer
 *                   example: 5
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// POST: Bulk update employees - Admin/HR only
router.post('/bulk-update', isAdminOrHR, async (req, res) => {
    try {
        const { employeeIds, updateData } = req.body;
        
        if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid employee IDs provided.' });
        }
        
        const allowedFields = ['status', 'departmentId', 'managerId'];
        const filteredData = {};
        
        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredData[key] = updateData[key];
            }
        });
        
        if (Object.keys(filteredData).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid update fields provided.' });
        }
        
        await Employee.update(filteredData, {
            where: {
                id: { [Op.in]: employeeIds }
            }
        });
        
        res.json({ 
            success: true, 
            message: `${employeeIds.length} employees updated successfully.`,
            updatedCount: employeeIds.length
        });
    } catch (error) {
        LogHelper.logError(error, { context: 'Bulk updating employees', employeeCount: req.body.employeeIds?.length }, req);
        res.status(500).json({ success: false, message: 'Failed to update employees.' });
    }
});

// GET: Get employee by employee ID (not database ID)
router.get('/by-employee-id/:employeeId', canAccessEmployee, async (req, res) => {
    try {
        const employee = await Employee.findOne({
            where: { employeeId: req.params.employeeId },
            include: [
                { model: User, as: 'user', attributes: ['email', 'role', 'isActive'] },
                { model: Department, as: 'department' },
                { model: Position, as: 'position' },
                { model: Employee, as: 'manager', attributes: ['id', 'firstName', 'lastName'] },
                { model: Employee, as: 'subordinates', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });
        
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }
        
        res.json({ success: true, data: employee });
    } catch (error) {
        LogHelper.logError(error, { context: 'Getting employee by employee ID', employeeId: req.params.employeeId }, req);
        res.status(500).json({ success: false, message: 'Failed to fetch employee.' });
    }
});

// GET team members for a manager
router.get('/manager/:managerId/team', async (req, res) => {
    try {
        const { managerId } = req.params;
        
        // Security check: only manager can access their own team or admin/hr can access any
        if (req.userRole === 'manager' && req.employeeId !== managerId && req.userRole !== 'admin' && req.userRole !== 'hr') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const teamMembers = await Employee.findAll({
            where: { managerId: managerId },
            include: [
                { model: User, as: 'user', attributes: ['email', 'role', 'isActive'] },
                { model: Department, as: 'department', attributes: ['id', 'name'] },
                { model: Position, as: 'position', attributes: ['id', 'title'] }
            ],
            order: [['firstName', 'ASC']]
        });

        // Apply field-level filtering to each team member
        const filteredTeamMembers = teamMembers.map(member => {
            const memberData = member.toJSON();
            const isUserOwnRecord = member.id === req.employeeId;
            return req.filterEmployeeData(memberData, isUserOwnRecord);
        });

        res.json({ 
            success: true, 
            data: filteredTeamMembers 
        });
    } catch (error) {
        LogHelper.logError(error, { context: 'Getting team members for manager', managerId: req.params.managerId }, req);
        res.status(500).json({ success: false, message: 'Failed to fetch team members.' });
    }
});

/**
 * @swagger
 * /api/employees/team-members:
 *   get:
 *     summary: Get team members for manager
 *     description: Retrieve all active employees reporting to the current manager - Manager/Admin/HR only
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Team members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// GET team members for managers
router.get('/team-members', authorize(['manager', 'admin', 'hr']), async (req, res) => {
    try {
        // Get team members where current user is the manager
        const teamMembers = await Employee.findAll({
            where: { 
                managerId: req.employeeId,
                status: 'Active'
            },
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name']
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['id', 'title']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['email', 'role', 'isActive', 'lastLoginAt']
                }
            ],
            order: [['firstName', 'ASC'], ['lastName', 'ASC']]
        });

        // Apply field filtering for manager role
        const filteredTeamMembers = teamMembers.map(employee => {
            return applyFieldFiltering(employee.toJSON(), req.userRole, false);
        });

        res.json({
            success: true,
            data: filteredTeamMembers
        });
    } catch (error) {
        LogHelper.logError(error, { context: 'Getting team members', employeeId: req.employeeId }, req);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team members'
        });
    }
});

module.exports = router;

module.exports = router;
