const express = require('express');
const { Op } = require('sequelize');
const { authenticateToken, authorize, isManagerOrAbove } = require('../middleware/auth.simple');
const { validate, leaveSchema } = require('../middleware/validation');
const db = require('../models');

const LeaveRequest = db.LeaveRequest;
const LeaveBalance = db.LeaveBalance;
const LeaveType = db.LeaveType;
const Employee = db.Employee;
const router = express.Router();

// Middleware to ensure all routes in this file are authenticated
router.use(authenticateToken);

// Helper function to calculate working days
const calculateWorkingDays = (startDate, endDate) => {
    let count = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) count++;
    }
    return count;
};

// GET all leave requests with filtering and role-based access
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, status, employeeId, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
        const offset = (page - 1) * limit;
        
        let where = {};
        if (req.userRole === 'manager') {
            const subordinates = await Employee.findAll({ where: { managerId: req.employeeId }, attributes: ['id'] });
            const subordinateIds = subordinates.map(e => e.id);
            where.employeeId = { [Op.in]: [...subordinateIds, req.employeeId] };
        } else if (req.userRole === 'employee') {
            where.employeeId = req.employeeId;
        }

        if (status) where.status = status;
        if (employeeId && (req.userRole === 'admin' || req.userRole === 'hr')) {
            where.employeeId = employeeId;
        }

        const { count, rows: leaveRequests } = await LeaveRequest.findAndCountAll({
            where,
            include: [
                { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName'] },
                { model: LeaveType, as: 'leaveType' },
                { model: Employee, as: 'approver', attributes: ['id', 'firstName', 'lastName'] },
            ],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            success: true,
            data: leaveRequests,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalRecords: count,
            },
        });
    } catch (error) {
        console.error('Get Leave Requests Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch leave requests.' });
    }
});

// --- Metadata Routes (must come before /:id route) ---
router.get('/meta/types', async (req, res) => {
    try {
        const leaveTypes = await LeaveType.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
        res.json({ success: true, data: leaveTypes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch leave types.' });
    }
});

router.get('/meta/balance', async (req, res) => {
    try {
        const leaveBalances = await LeaveBalance.findAll({ 
            where: { employeeId: req.employeeId }, 
            include: [
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['id', 'name', 'description', 'maxDaysPerYear']
                },
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'employeeId', 'firstName', 'lastName']
                }
            ]
        });
        res.json({ success: true, data: leaveBalances });
    } catch (error) {
        console.error('Error fetching leave meta balance:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch leave balance.' });
    }
});

// GET leave balance - simplified endpoint (alias for /meta/balance)
router.get('/balance', async (req, res) => {
    try {
        const leaveBalances = await LeaveBalance.findAll({ 
            where: { employeeId: req.employeeId }, 
            include: [
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['id', 'name', 'description', 'maxDaysPerYear']
                },
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'employeeId', 'firstName', 'lastName']
                }
            ]
        });
        res.json({ success: true, data: leaveBalances });
    } catch (error) {
        console.error('Error fetching leave balance:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch leave balance.' });
    }
});

// GET a single leave request by ID
router.get('/:id', async (req, res) => {
    try {
        const leaveRequest = await LeaveRequest.findByPk(req.params.id, { include: ['employee', 'leaveType', 'approver'] });
        if (!leaveRequest) {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        // Permission check
        const isOwner = leaveRequest.employeeId === req.employeeId;
        const isManagerOfOwner = req.userRole === 'manager' && (await Employee.findOne({ where: { id: leaveRequest.employeeId, managerId: req.employeeId } }));
        if (!isOwner && !isManagerOfOwner && req.userRole !== 'admin' && req.userRole !== 'hr') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        res.json({ success: true, data: leaveRequest });
    } catch (error) {
        console.error('Get Leave Request Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch leave request.' });
    }
});

// POST a new leave request
router.post('/', validate(leaveSchema.create), async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { 
            leaveTypeId, 
            startDate, 
            endDate, 
            reason, 
            isHalfDay, 
            isCancellation, 
            originalLeaveRequestId, 
            cancellationNote 
        } = req.body;
        const employeeId = req.employeeId; // User can only apply for themselves

        // CANCELLATION REQUEST HANDLING
        if (isCancellation) {
            // Verify the original leave request exists and belongs to the user
            const originalRequest = await LeaveRequest.findOne({
                where: { 
                    id: originalLeaveRequestId,
                    employeeId: employeeId
                }
            });

            if (!originalRequest) {
                await transaction.rollback();
                return res.status(404).json({ 
                    success: false, 
                    message: 'Original leave request not found or does not belong to you.' 
                });
            }

            // Check if original request is in a cancellable status
            if (!['Pending', 'Approved'].includes(originalRequest.status)) {
                await transaction.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: `Cannot cancel a leave request with status: ${originalRequest.status}` 
                });
            }

            // Check if there's already a pending cancellation for this request
            const existingCancellation = await LeaveRequest.findOne({
                where: {
                    originalLeaveRequestId: originalLeaveRequestId,
                    isCancellation: true,
                    status: 'Pending'
                }
            });

            if (existingCancellation) {
                await transaction.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: 'A cancellation request is already pending for this leave.' 
                });
            }

            // Create cancellation request (no balance deduction)
            const cancellationRequest = await LeaveRequest.create({
                employeeId,
                leaveTypeId: originalRequest.leaveTypeId,
                startDate: originalRequest.startDate,
                endDate: originalRequest.endDate,
                reason: cancellationNote || reason,
                totalDays: originalRequest.totalDays,
                isHalfDay: originalRequest.isHalfDay,
                status: 'Pending', // Requires approval
                isCancellation: true,
                originalLeaveRequestId: originalLeaveRequestId,
                cancellationNote: cancellationNote || reason
            }, { transaction });

            await transaction.commit();
            return res.status(201).json({ 
                success: true, 
                message: 'Leave cancellation request submitted successfully. Awaiting approval.', 
                data: cancellationRequest 
            });
        }

        // NORMAL LEAVE REQUEST HANDLING
        const totalDays = isHalfDay ? 0.5 : calculateWorkingDays(startDate, endDate);
        if (totalDays <= 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'The leave duration must be at least a half day.' });
        }

        const leaveBalance = await LeaveBalance.findOne({ where: { employeeId, leaveTypeId } });
        if (!leaveBalance || leaveBalance.balance < totalDays) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Insufficient leave balance.' });
        }

        const newLeaveRequest = await LeaveRequest.create({
            employeeId,
            leaveTypeId,
            startDate,
            endDate,
            reason,
            totalDays,
            isHalfDay,
            status: 'Pending',
            isCancellation: false
        }, { transaction });

        leaveBalance.balance -= totalDays;
        await leaveBalance.save({ transaction });

        await transaction.commit();
        res.status(201).json({ success: true, message: 'Leave request submitted successfully.', data: newLeaveRequest });
    } catch (error) {
        await transaction.rollback();
        console.error('Create Leave Request Error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit leave request.' });
    }
});

// PUT to update leave request status (approve/reject)
router.put('/:id/status', isManagerOrAbove, validate(leaveSchema.updateStatus), async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { status, approverComments } = req.body;
        const leaveRequest = await LeaveRequest.findByPk(req.params.id);

        if (!leaveRequest || leaveRequest.status !== 'Pending') {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'This leave request cannot be updated.' });
        }

        // Permission check for managers
        if (req.userRole === 'manager') {
            const isManagerOfOwner = await Employee.findOne({ where: { id: leaveRequest.employeeId, managerId: req.employeeId } });
            if (!isManagerOfOwner) {
                await transaction.rollback();
                return res.status(403).json({ success: false, message: 'You can only approve requests for your direct reports.' });
            }
        }

        // HANDLE CANCELLATION REQUEST APPROVAL/REJECTION
        if (leaveRequest.isCancellation) {
            if (status === 'Approved') {
                // Cancel the original leave request
                const originalRequest = await LeaveRequest.findByPk(leaveRequest.originalLeaveRequestId);
                
                if (originalRequest) {
                    originalRequest.status = 'Cancelled';
                    originalRequest.cancelledAt = new Date();
                    await originalRequest.save({ transaction });

                    // Restore leave balance (add back the days)
                    const leaveBalance = await LeaveBalance.findOne({ 
                        where: { 
                            employeeId: originalRequest.employeeId, 
                            leaveTypeId: originalRequest.leaveTypeId 
                        } 
                    });
                    
                    if (leaveBalance) {
                        leaveBalance.balance += originalRequest.totalDays;
                        await leaveBalance.save({ transaction });
                    }
                }

                // Approve the cancellation request
                leaveRequest.status = 'Approved';
                leaveRequest.approverComments = approverComments;
                leaveRequest.approvedBy = req.employeeId;
                leaveRequest.approvedAt = new Date();
                await leaveRequest.save({ transaction });

                await transaction.commit();
                return res.json({ 
                    success: true, 
                    message: 'Leave cancellation approved. Original leave has been cancelled and balance restored.' 
                });
            } else if (status === 'Rejected') {
                // Reject the cancellation request (original leave remains)
                leaveRequest.status = 'Rejected';
                leaveRequest.approverComments = approverComments;
                leaveRequest.approvedBy = req.employeeId;
                leaveRequest.rejectedAt = new Date();
                await leaveRequest.save({ transaction });

                await transaction.commit();
                return res.json({ 
                    success: true, 
                    message: 'Leave cancellation rejected. Original leave request remains active.' 
                });
            }
        }

        // HANDLE NORMAL LEAVE REQUEST APPROVAL/REJECTION
        leaveRequest.status = status;
        leaveRequest.approverComments = approverComments;
        leaveRequest.approvedBy = req.employeeId;
        
        if (status === 'Approved') {
            leaveRequest.approvedAt = new Date();
        } else if (status === 'Rejected') {
            leaveRequest.rejectedAt = new Date();
            
            // If rejected, restore leave balance
            const leaveBalance = await LeaveBalance.findOne({ 
                where: { 
                    employeeId: leaveRequest.employeeId, 
                    leaveTypeId: leaveRequest.leaveTypeId 
                } 
            });
            
            if (leaveBalance) {
                leaveBalance.balance += leaveRequest.totalDays;
                await leaveBalance.save({ transaction });
            }
        }
        
        await leaveRequest.save({ transaction });

        await transaction.commit();
        res.json({ success: true, message: `Leave request has been ${status.toLowerCase()}.` });
    } catch (error) {
        await transaction.rollback();
        console.error('Update Leave Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update leave status.' });
    }
});

// --- Metadata Routes ---

// GET pending leave requests for manager approval
router.get('/manager/:managerId/pending', async (req, res) => {
    try {
        const { managerId } = req.params;
        
        // Security check: only manager can access their own pending requests or admin/hr can access any
        if (req.userRole === 'manager' && req.employeeId !== managerId && req.userRole !== 'admin' && req.userRole !== 'hr') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // Get team members for this manager
        const teamMembers = await Employee.findAll({ 
            where: { managerId: managerId },
            attributes: ['id'] 
        });
        const teamMemberIds = teamMembers.map(e => e.id);

        // Get pending leave requests for team members
        const pendingLeaves = await LeaveRequest.findAll({
            where: {
                employeeId: { [Op.in]: teamMemberIds },
                status: 'Pending'
            },
            include: [
                { 
                    model: Employee, 
                    as: 'employee', 
                    attributes: ['id', 'firstName', 'lastName', 'email'] 
                },
                { 
                    model: LeaveType, 
                    as: 'leaveType',
                    attributes: ['id', 'name', 'code']
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.json({ 
            success: true, 
            data: pendingLeaves 
        });
    } catch (error) {
        console.error('Get Manager Pending Leaves Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending leave requests.' });
    }
});

// PUT approve/reject leave request (enhanced version)
router.put('/:id/approve-reject', async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { action, comments } = req.body;
        const leaveId = req.params.id;

        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action. Use "approved" or "rejected".' });
        }

        const leaveRequest = await LeaveRequest.findByPk(leaveId);
        if (!leaveRequest) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        if (leaveRequest.status !== 'Pending') {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Leave request has already been processed.' });
        }

        // Permission check for managers
        if (req.userRole === 'manager') {
            const isManagerOfOwner = await Employee.findOne({ where: { id: leaveRequest.employeeId, managerId: req.employeeId } });
            if (!isManagerOfOwner) {
                await transaction.rollback();
                return res.status(403).json({ success: false, message: 'You can only approve requests for your direct reports.' });
            }
        }

        // Update leave request
        leaveRequest.status = action === 'approved' ? 'Approved' : 'Rejected';
        leaveRequest.approverComments = comments || '';
        leaveRequest.approvedBy = req.employeeId;
        leaveRequest.approvedAt = new Date();
        await leaveRequest.save({ transaction });

        // If rejected, restore leave balance
        if (action === 'rejected') {
            const leaveBalance = await LeaveBalance.findOne({ 
                where: { 
                    employeeId: leaveRequest.employeeId, 
                    leaveTypeId: leaveRequest.leaveTypeId 
                } 
            });
            if (leaveBalance) {
                leaveBalance.balance += leaveRequest.totalDays;
                await leaveBalance.save({ transaction });
            }
        }

        await transaction.commit();
        res.json({ 
            success: true, 
            message: `Leave request has been ${action}.`,
            data: leaveRequest
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Approve/Reject Leave Error:', error);
        res.status(500).json({ success: false, message: 'Failed to process leave request.' });
    }
});

// GET pending leave requests for manager approval
router.get('/pending-for-manager', authorize(['manager', 'admin', 'hr']), async (req, res) => {
    try {
        let where = { status: 'Pending' };
        
        // For managers, only show team member requests
        if (req.userRole === 'manager') {
            const subordinates = await Employee.findAll({ 
                where: { managerId: req.employeeId }, 
                attributes: ['id'] 
            });
            const subordinateIds = subordinates.map(e => e.id);
            where.employeeId = { [Op.in]: subordinateIds };
        }

        const pendingLeaves = await LeaveRequest.findAll({
            where,
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email'],
                    include: [
                        {
                            model: db.Department,
                            as: 'department',
                            attributes: ['id', 'name']
                        }
                    ]
                },
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['id', 'name', 'description']
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.json({
            success: true,
            data: pendingLeaves
        });
    } catch (error) {
        console.error('Get Pending Leaves Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending leave requests'
        });
    }
});

// PUT approve leave request (manager)
router.put('/:id/approve', authorize(['manager', 'admin', 'hr']), async (req, res) => {
    try {
        const leaveRequest = await LeaveRequest.findByPk(req.params.id, {
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'managerId']
                }
            ]
        });

        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        // Check if manager can approve this request
        if (req.userRole === 'manager' && leaveRequest.employee.managerId !== req.employeeId) {
            return res.status(403).json({
                success: false,
                message: 'You can only approve leave requests for your team members'
            });
        }

        if (leaveRequest.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Leave request is not in pending status'
            });
        }

        await leaveRequest.update({
            status: 'Approved',
            approvedBy: req.employeeId,
            approvedAt: new Date(),
            comments: req.body.comments || 'Approved by manager'
        });

        res.json({
            success: true,
            message: 'Leave request approved successfully',
            data: leaveRequest
        });
    } catch (error) {
        console.error('Approve Leave Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve leave request'
        });
    }
});

// PUT reject leave request (manager)
router.put('/:id/reject', authorize(['manager', 'admin', 'hr']), async (req, res) => {
    try {
        const { comments } = req.body;

        if (!comments || !comments.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const leaveRequest = await LeaveRequest.findByPk(req.params.id, {
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'managerId']
                }
            ]
        });

        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        // Check if manager can reject this request
        if (req.userRole === 'manager' && leaveRequest.employee.managerId !== req.employeeId) {
            return res.status(403).json({
                success: false,
                message: 'You can only reject leave requests for your team members'
            });
        }

        if (leaveRequest.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Leave request is not in pending status'
            });
        }

        await leaveRequest.update({
            status: 'Rejected',
            rejectedBy: req.employeeId,
            rejectedAt: new Date(),
            comments: comments
        });

        res.json({
            success: true,
            message: 'Leave request rejected successfully',
            data: leaveRequest
        });
    } catch (error) {
        console.error('Reject Leave Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject leave request'
        });
    }
});

// GET recent approvals by manager
router.get('/recent-approvals', authorize(['manager', 'admin', 'hr']), async (req, res) => {
    try {
        let where = { 
            [Op.or]: [
                { approvedBy: req.employeeId },
                { rejectedBy: req.employeeId }
            ]
        };

        const recentApprovals = await LeaveRequest.findAll({
            where,
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'employeeId', 'firstName', 'lastName']
                },
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['id', 'name']
                }
            ],
            order: [['updatedAt', 'DESC']],
            limit: 10
        });

        res.json({
            success: true,
            data: recentApprovals
        });
    } catch (error) {
        console.error('Get Recent Approvals Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent approvals'
        });
    }
});

module.exports = router;
