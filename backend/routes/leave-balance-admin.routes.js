const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth.simple');
const db = require('../models');

const LeaveBalance = db.LeaveBalance;
const LeaveType = db.LeaveType;
const Employee = db.Employee;
const router = express.Router();

// Middleware to ensure all routes are authenticated and admin/HR only
router.use(authenticateToken);
// Temporarily disable strict authorization for admin users to allow data creation
router.use((req, res, next) => {
  console.log('User role check:', req.userRole);
  if (req.userRole === 'admin' || req.userRole === 'hr') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
});

// GET all leave balances with filtering and pagination
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            employeeId, 
            leaveTypeId, 
            year = new Date().getFullYear(),
            sortBy = 'createdAt', 
            sortOrder = 'DESC' 
        } = req.query;
        
        const offset = (page - 1) * limit;
        let where = { year };
        
        if (employeeId) where.employeeId = employeeId;
        if (leaveTypeId) where.leaveTypeId = leaveTypeId;

        const { count, rows: balances } = await LeaveBalance.findAndCountAll({
            where,
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email']
                },
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['id', 'name', 'description']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, sortOrder]]
        });

        res.json({
            success: true,
            data: {
                balances,
                pagination: {
                    total: count,
                    pages: Math.ceil(count / limit),
                    currentPage: parseInt(page),
                    hasNext: offset + limit < count,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching leave balances:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave balances'
        });
    }
});

// GET specific leave balance
router.get('/:id', async (req, res) => {
    try {
        const balance = await LeaveBalance.findByPk(req.params.id, {
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email']
                },
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['id', 'name', 'description']
                }
            ]
        });

        if (!balance) {
            return res.status(404).json({
                success: false,
                message: 'Leave balance not found'
            });
        }

        res.json({
            success: true,
            data: balance
        });
    } catch (error) {
        console.error('Error fetching leave balance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave balance'
        });
    }
});

// POST create new leave balance
router.post('/', async (req, res) => {
    try {
        const { 
            employeeId, 
            leaveTypeId, 
            year = new Date().getFullYear(),
            totalAccrued = 0,
            carryForward = 0
        } = req.body;

        if (!employeeId || !leaveTypeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID and Leave Type ID are required'
            });
        }

        // Check if balance already exists for this employee, leave type, and year
        const existingBalance = await LeaveBalance.findOne({
            where: { employeeId, leaveTypeId, year }
        });

        if (existingBalance) {
            return res.status(400).json({
                success: false,
                message: 'Leave balance already exists for this employee, leave type, and year'
            });
        }

        // Verify employee exists
        const employee = await Employee.findByPk(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Verify leave type exists
        const leaveType = await LeaveType.findByPk(leaveTypeId);
        if (!leaveType) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }

        const balance = totalAccrued + carryForward;

        const leaveBalance = await LeaveBalance.create({
            employeeId,
            leaveTypeId,
            year,
            totalAccrued,
            totalTaken: 0,
            totalPending: 0,
            balance,
            carryForward
        });

        const createdBalance = await LeaveBalance.findByPk(leaveBalance.id, {
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email']
                },
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['id', 'name', 'description']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Leave balance created successfully',
            data: createdBalance
        });
    } catch (error) {
        console.error('Error creating leave balance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create leave balance'
        });
    }
});

// PUT update leave balance
router.put('/:id', async (req, res) => {
    try {
        const { 
            totalAccrued, 
            totalTaken, 
            totalPending, 
            carryForward 
        } = req.body;

        const leaveBalance = await LeaveBalance.findByPk(req.params.id);
        if (!leaveBalance) {
            return res.status(404).json({
                success: false,
                message: 'Leave balance not found'
            });
        }

        // Calculate new balance
        const newTotalAccrued = totalAccrued !== undefined ? totalAccrued : leaveBalance.totalAccrued;
        const newCarryForward = carryForward !== undefined ? carryForward : leaveBalance.carryForward;
        const newTotalTaken = totalTaken !== undefined ? totalTaken : leaveBalance.totalTaken;
        const newTotalPending = totalPending !== undefined ? totalPending : leaveBalance.totalPending;
        const newBalance = newTotalAccrued + newCarryForward - newTotalTaken - newTotalPending;

        await leaveBalance.update({
            totalAccrued: newTotalAccrued,
            totalTaken: newTotalTaken,
            totalPending: newTotalPending,
            balance: newBalance,
            carryForward: newCarryForward
        });

        const updatedBalance = await LeaveBalance.findByPk(req.params.id, {
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email']
                },
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['id', 'name', 'description']
                }
            ]
        });

        res.json({
            success: true,
            message: 'Leave balance updated successfully',
            data: updatedBalance
        });
    } catch (error) {
        console.error('Error updating leave balance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update leave balance'
        });
    }
});

// DELETE leave balance
router.delete('/:id', async (req, res) => {
    try {
        const leaveBalance = await LeaveBalance.findByPk(req.params.id);
        if (!leaveBalance) {
            return res.status(404).json({
                success: false,
                message: 'Leave balance not found'
            });
        }

        await leaveBalance.destroy();

        res.json({
            success: true,
            message: 'Leave balance deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting leave balance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete leave balance'
        });
    }
});

// POST bulk create leave balances for all employees
router.post('/bulk/initialize', async (req, res) => {
    try {
        const { 
            year = new Date().getFullYear(),
            leaveAllocations = {} // { leaveTypeId: allocation, ... }
        } = req.body;

        if (!leaveAllocations || Object.keys(leaveAllocations).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Leave allocations are required'
            });
        }

        // Get all active employees
        const employees = await Employee.findAll({
            where: { status: 'Active' }, // Capital 'A' to match enum
            attributes: ['id']
        });

        // Get all leave types to validate allocations
        const leaveTypes = await LeaveType.findAll({
            attributes: ['id', 'name']
        });

        const validLeaveTypeIds = leaveTypes.map(lt => lt.id);
        
        // Validate all provided leave type IDs
        for (const leaveTypeId of Object.keys(leaveAllocations)) {
            if (!validLeaveTypeIds.includes(leaveTypeId)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid leave type ID: ${leaveTypeId}`
                });
            }
        }

        const balancesToCreate = [];
        const balancesToUpdate = [];

        for (const employee of employees) {
            for (const [leaveTypeId, allocation] of Object.entries(leaveAllocations)) {
                // Check if balance already exists
                const existing = await LeaveBalance.findOne({
                    where: { employeeId: employee.id, leaveTypeId, year }
                });

                if (existing) {
                    // Add to existing balance
                    const newTotalAccrued = parseFloat(existing.totalAccrued) + parseFloat(allocation);
                    const newBalance = newTotalAccrued + parseFloat(existing.carryForward) - parseFloat(existing.totalTaken) - parseFloat(existing.totalPending);
                    
                    balancesToUpdate.push({
                        id: existing.id,
                        totalAccrued: newTotalAccrued,
                        balance: newBalance
                    });
                } else {
                    // Create new balance
                    balancesToCreate.push({
                        employeeId: employee.id,
                        leaveTypeId,
                        year,
                        totalAccrued: parseFloat(allocation),
                        totalTaken: 0,
                        totalPending: 0,
                        balance: parseFloat(allocation),
                        carryForward: 0
                    });
                }
            }
        }

        // Bulk create new balances
        if (balancesToCreate.length > 0) {
            await LeaveBalance.bulkCreate(balancesToCreate);
        }

        // Update existing balances
        if (balancesToUpdate.length > 0) {
            await Promise.all(
                balancesToUpdate.map(update =>
                    LeaveBalance.update(
                        { 
                            totalAccrued: update.totalAccrued,
                            balance: update.balance
                        },
                        { where: { id: update.id } }
                    )
                )
            );
        }

        res.status(201).json({
            success: true,
            message: 'Leave balances initialized successfully',
            data: {
                created: balancesToCreate.length,
                updated: balancesToUpdate.length,
                employees: employees.length,
                leaveTypes: Object.keys(leaveAllocations).length
            }
        });
    } catch (error) {
        console.error('Error initializing leave balances:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize leave balances'
        });
    }
});

// GET leave balance summary
router.get('/summary/overview', async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;

        const summary = await LeaveBalance.findAll({
            where: { year },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'firstName', 'lastName']
                },
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['id', 'name']
                }
            ],
            attributes: [
                'leaveTypeId',
                [db.sequelize.fn('COUNT', db.sequelize.col('LeaveBalance.id')), 'employeeCount'],
                [db.sequelize.fn('SUM', db.sequelize.col('totalAccrued')), 'totalAccrued'],
                [db.sequelize.fn('SUM', db.sequelize.col('totalTaken')), 'totalTaken'],
                [db.sequelize.fn('SUM', db.sequelize.col('balance')), 'totalBalance']
            ],
            group: ['leaveTypeId', 'leaveType.id'],
            raw: false
        });

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error fetching leave balance summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave balance summary'
        });
    }
});

module.exports = router;
