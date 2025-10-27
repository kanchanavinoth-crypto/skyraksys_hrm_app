const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { authenticateToken, authorize, canAccessEmployee, isAdminOrHR } = require('../middleware/auth.simple');
const { validate, employeeSchema } = require('../middleware/validation');
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

// GET all employees with enhanced filtering, pagination, and role-based access
router.get('/', async (req, res) => {
    try {
        // Set role-based default limit: admin/HR get all employees (1000), others get 10
        const defaultLimit = (req.userRole === 'admin' || req.userRole === 'hr') ? 1000 : 10;
        const { page = 1, limit = defaultLimit, search, department, status, sortBy = 'firstName', sortOrder = 'ASC' } = req.query;
        
        // Validate and sanitize pagination parameters
        const validatedPage = Math.max(1, parseInt(page) || 1);
        // Allow higher limits for admin/HR (up to 1000), regular users capped at 100
        const maxLimit = (req.userRole === 'admin' || req.userRole === 'hr') ? 1000 : 100;
        const validatedLimit = Math.min(Math.max(1, parseInt(limit) || defaultLimit), maxLimit);
        const offset = (validatedPage - 1) * validatedLimit;
        
        console.log(`📊 Employee list request - Role: ${req.userRole}`);
        console.log(`📊 Query params:`, req.query);
        console.log(`📊 Default limit: ${defaultLimit}, Requested limit: ${limit}, Validated limit: ${validatedLimit}, Page: ${validatedPage}`);
        
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
            // Handle case-insensitive status filtering
            const statusMapping = {
                'active': 'Active',
                'inactive': 'Inactive',
                'on leave': 'On Leave',
                'terminated': 'Terminated'
            };
            where.status = statusMapping[status.toLowerCase()] || status;
        }

        const { count, rows: employees } = await Employee.findAndCountAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['email', 'role', 'isActive'] },
                { model: Department, as: 'department' },
                { model: Position, as: 'position' },
                { model: Employee, as: 'manager', attributes: ['id', 'firstName', 'lastName'] }
            ],
            order: [[sortBy, sortOrder.toUpperCase()]],
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
        
        console.log(`✅ Returning ${filteredEmployees.length} employees out of ${count} total (Role: ${req.userRole})`);

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
        console.error('Get Employees Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch employees.' });
    }
});

// --- Metadata Routes (must be before /:id route) ---
router.get('/meta/departments', async (req, res) => {
    try {
        const departments = await Department.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
        res.json({ success: true, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
    }
});

// Alias for frontend compatibility
router.get('/departments', async (req, res) => {
    try {
        const departments = await Department.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
        res.json({ success: true, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
    }
});

// GET all managers (for dropdown/selection purposes) - must be before /:id route
router.get('/managers', isAdminOrHR, async (req, res) => {
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
        console.error('Get Managers Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch managers.' });
    }
});

router.get('/meta/positions', async (req, res) => {
    try {
        const positions = await Position.findAll({ where: { isActive: true }, order: [['title', 'ASC']] });
        res.json({ success: true, data: positions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch positions.' });
    }
});

// Alias for frontend compatibility
router.get('/positions', async (req, res) => {
    try {
        const positions = await Position.findAll({ where: { isActive: true }, order: [['title', 'ASC']] });
        res.json({ success: true, data: positions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch positions.' });
    }
});

// GET: Employee statistics - Admin/HR only
router.get('/statistics', isAdminOrHR, async (req, res) => {
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
        console.error('Statistics Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics.' });
    }
});

// GET: Get managers for dropdown - Admin/HR only
router.get('/managers', isAdminOrHR, async (req, res) => {
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
        console.error('Get Managers Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch managers.' });
    }
});

// GET a single employee by ID with enhanced field-level permissions
router.get('/:id', canAccessEmployee, async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'email', 'role', 'isActive'] },
                { model: Department, as: 'department' },
                { model: Position, as: 'position' },
                { model: Employee, as: 'manager', attributes: ['id', 'firstName', 'lastName'] },
                { model: Employee, as: 'subordinates', attributes: ['id', 'firstName', 'lastName'] },
            ],
        });

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        // Apply field-level filtering
        const employeeData = employee.toJSON();
        const isOwnRecord = employee.id === req.employeeId;
        const filteredData = req.filterEmployeeData(employeeData, isOwnRecord);

        res.json({ success: true, data: filteredData });
    } catch (error) {
        console.error('Get Employee Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch employee.' });
    }
});

// POST photo upload for existing employee (Admin or HR only)
router.post('/:id/photo', isAdminOrHR, uploadEmployeePhoto, handleUploadError, async (req, res) => {
    try {
        const employeeId = req.params.id;
        
        // Check if employee exists
        const employee = await Employee.findByPk(employeeId);
        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found.' 
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No photo file uploaded.' 
            });
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
        console.error('Photo Upload Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to upload photo.' 
        });
    }
});

// POST a new employee (Admin or HR only)
router.post('/', isAdminOrHR, uploadEmployeePhoto, handleUploadError, validate(employeeSchema.create), async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { email, password, salaryStructure, salary, ...employeeData } = req.body;

        const existingEmployee = await Employee.findOne({ where: { email: email } });
        if (existingEmployee) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'An employee with this email already exists.' });
        }

        // Check for duplicate employee ID if provided
        if (employeeData.employeeId) {
            const existingEmployeeById = await Employee.findOne({ where: { employeeId: employeeData.employeeId } });
            if (existingEmployeeById) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: `An employee with ID '${employeeData.employeeId}' already exists.` });
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
        console.error('Create Employee Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create employee.' });
    }
});

// PUT to update an employee
router.put('/:id', canAccessEmployee, (req, res, next) => {
    console.log('🔍 Backend received PUT /employees/:id with body keys:', Object.keys(req.body));
    console.log('📦 Full body:', JSON.stringify(req.body, null, 2));
    next();
}, validate(employeeSchema.update), async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { salaryStructure, ...updateData } = req.body;
        
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Employee not found.' });
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
            if (salaryStructure) {
                await transaction.rollback();
                return res.status(403).json({ success: false, message: 'You do not have permission to update salary structure.' });
            }
        }

        // Check for duplicate employee ID if being updated
        if (updateData.employeeId && updateData.employeeId !== employee.employeeId) {
            const existingEmployeeById = await Employee.findOne({ 
                where: { employeeId: updateData.employeeId } 
            });
            if (existingEmployeeById) {
                await transaction.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: `An employee with ID '${updateData.employeeId}' already exists.` 
                });
            }
        }

        await employee.update(updateData, { transaction });
        
        // Handle salary structure update if provided and user has permission
        if (salaryStructure && (req.userRole === 'admin' || req.userRole === 'hr')) {
            const existingSalaryStructure = await db.SalaryStructure.findOne({
                where: { employeeId: req.params.id, isActive: true }
            });
            
            if (existingSalaryStructure) {
                // Deactivate existing salary structure
                await existingSalaryStructure.update({ isActive: false }, { transaction });
            }
            
            // Create new salary structure
            if (salaryStructure.basicSalary) {
                await db.SalaryStructure.create({
                    ...salaryStructure,
                    employeeId: req.params.id,
                    effectiveFrom: salaryStructure.effectiveFrom || new Date().toISOString().split('T')[0],
                    isActive: true
                }, { transaction });
            }
        }
        
        await transaction.commit();
        
        // Fetch updated employee with salary structure
        const updatedEmployee = await Employee.findByPk(req.params.id, {
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
        console.error('Update Employee Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update employee.' });
    }
});

// DELETE an employee (deactivate)
router.delete('/:id', isAdminOrHR, async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        await employee.update({ status: 'Terminated' }, { transaction });
        if (employee.userId) {
            await User.update({ isActive: false }, { where: { id: employee.userId }, transaction });
        }

        await transaction.commit();
        res.json({ success: true, message: 'Employee deactivated successfully.' });
    } catch (error) {
        await transaction.rollback();
        console.error('Deactivate Employee Error:', error);
        res.status(500).json({ success: false, message: 'Failed to deactivate employee.' });
    }
});

// PUT to update an employee's compensation (Admin or HR only)
router.put('/:id/compensation', isAdminOrHR, async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        const { salary, payGrade, payFrequency } = req.body;
        
        if (salary === undefined || salary === null) {
             return res.status(400).json({ success: false, message: 'Salary is a required field.' });
        }

        await employee.update({ salary, payGrade, payFrequency });

        const updatedEmployee = await Employee.findByPk(req.params.id);
        res.json({ success: true, message: 'Compensation updated successfully.', data: updatedEmployee });
    } catch (error) {
        console.error('Update Compensation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update compensation.' });
    }
});

// PUT: Update employee compensation (salary) - Admin/HR only
router.put('/:id/compensation', isAdminOrHR, async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }
        const { salary } = req.body;
        if (typeof salary !== 'number' || salary < 0) {
            return res.status(400).json({ success: false, message: 'Invalid salary value.' });
        }
        await employee.update({ salary });
        res.json({ success: true, message: 'Compensation updated successfully.', data: employee });
    } catch (error) {
        console.error('Update Compensation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update compensation.' });
    }
});

// PATCH: Update employee status - Admin/HR only
router.patch('/:id/status', isAdminOrHR, async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }
        
        const { status } = req.body;
        if (!['Active', 'Inactive', 'On-Leave', 'Terminated'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value.' });
        }
        
        await employee.update({ status });
        
        // Also update user account status
        if (employee.user) {
            await employee.user.update({ isActive: status === 'Active' });
        }
        
        res.json({ success: true, message: 'Status updated successfully.', data: employee });
    } catch (error) {
        console.error('Status Update Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status.' });
    }
});

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
        console.error('Export Error:', error);
        res.status(500).json({ success: false, message: 'Failed to export employees.' });
    }
});

// GET: Get managers for dropdown - Admin/HR only (Alternative implementation)
// This is now handled by the main /managers route above
// router.get('/managers', isAdminOrHR, async (req, res) => {
//     try {
//         const managers = await Employee.findAll({
//             where: {
//                 status: 'Active'
//             },
//             include: [
//                 { 
//                     model: Position, 
//                     as: 'position',
//                     where: {
//                         [Op.or]: [
//                             { title: { [Op.like]: '%manager%' } },
//                             { title: { [Op.like]: '%director%' } },
//                             { title: { [Op.like]: '%head%' } },
//                             { level: 'Manager' }
//                         ]
//                     },
//                     required: false
//                 }
//             ],
//             attributes: ['id', 'firstName', 'lastName', 'email'],
//             order: [['firstName', 'ASC']]
//         });
        
//         res.json({ success: true, data: managers });
//     } catch (error) {
//         console.error('Managers Error:', error);
//         res.status(500).json({ success: false, message: 'Failed to fetch managers.' });
//     }
// });

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
        console.error('Bulk Update Error:', error);
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
        console.error('Get Employee by ID Error:', error);
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
        console.error('Get Team Members Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch team members.' });
    }
});

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
        console.error('Get Team Members Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team members'
        });
    }
});

module.exports = router;

module.exports = router;
