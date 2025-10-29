const express = require('express');
const { Op } = require('sequelize');
const { authenticateToken, authorize, isManagerOrAbove } = require('../middleware/auth.simple');
const { validate, validateQuery, validateParams } = require('../middleware/validate');
const validators = require('../middleware/validators');
const { NotFoundError, ConflictError, BadRequestError, ForbiddenError } = require('../utils/errors');
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

/**
 * @swagger
 * /api/leaves:
 *   get:
 *     summary: Get all leave requests with filtering
 *     description: Retrieve paginated leave requests with role-based access - employees see their own, managers see their team, admin/HR see all
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Approved, Rejected, Cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by employee (admin/HR only)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Leave requests retrieved successfully
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
 *                     $ref: '#/components/schemas/LeaveRequest'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// GET all leave requests with filtering and role-based access
router.get('/', validateQuery(validators.leaveQuerySchema), async (req, res, next) => {
    try {
        const { page, limit, status, employeeId, sort, order } = req.validatedQuery;
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
            order: [[sort, order.toUpperCase()]],
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
        next(error);
    }
});

/**
 * @swagger
 * /api/leaves/meta/types:
 *   get:
 *     summary: Get all active leave types
 *     description: Retrieve all available leave types for dropdown/selection
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave types retrieved successfully
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
 *                       name:
 *                         type: string
 *                         example: Annual Leave
 *                       code:
 *                         type: string
 *                         example: AL
 *                       maxDaysPerYear:
 *                         type: number
 *                         example: 20
 *                       description:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// --- Metadata Routes (must come before /:id route) ---
router.get('/meta/types', async (req, res, next) => {
    try {
        const leaveTypes = await LeaveType.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
        res.json({ success: true, data: leaveTypes });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/leaves/meta/balance:
 *   get:
 *     summary: Get current user's leave balance
 *     description: Retrieve leave balance for all leave types for the authenticated user
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave balance retrieved successfully
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
 *                     $ref: '#/components/schemas/LeaveBalance'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/meta/balance', async (req, res, next) => {
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
        next(error);
    }
});

// GET leave balance - simplified endpoint (alias for /meta/balance)
router.get('/balance', async (req, res, next) => {
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
        next(error);
    }
});

/**
 * @swagger
 * /api/leaves/{id}:
 *   get:
 *     summary: Get leave request by ID
 *     description: Retrieve detailed information about a specific leave request with permission checks
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Leave request retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LeaveRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET a single leave request by ID
router.get('/:id', validateParams(validators.uuidParamSchema), async (req, res, next) => {
    try {
        const leaveRequest = await LeaveRequest.findByPk(req.validatedParams.id, { include: ['employee', 'leaveType', 'approver'] });
        if (!leaveRequest) {
            throw new NotFoundError('Leave request not found.');
        }

        // Permission check
        const isOwner = leaveRequest.employeeId === req.employeeId;
        const isManagerOfOwner = req.userRole === 'manager' && (await Employee.findOne({ where: { id: leaveRequest.employeeId, managerId: req.employeeId } }));
        if (!isOwner && !isManagerOfOwner && req.userRole !== 'admin' && req.userRole !== 'hr') {
            throw new ForbiddenError('Access denied.');
        }

        res.json({ success: true, data: leaveRequest });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/leaves:
 *   post:
 *     summary: Create a new leave request or cancellation request
 *     description: Submit a new leave request (deducts from balance) or submit a cancellation request for existing leave
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 title: Normal Leave Request
 *                 required:
 *                   - leaveTypeId
 *                   - startDate
 *                   - endDate
 *                   - reason
 *                 properties:
 *                   leaveTypeId:
 *                     type: string
 *                     format: uuid
 *                   startDate:
 *                     type: string
 *                     format: date
 *                     example: 2024-02-01
 *                   endDate:
 *                     type: string
 *                     format: date
 *                     example: 2024-02-03
 *                   reason:
 *                     type: string
 *                     example: Personal reasons
 *                   isHalfDay:
 *                     type: boolean
 *                     default: false
 *               - type: object
 *                 title: Cancellation Request
 *                 required:
 *                   - isCancellation
 *                   - originalLeaveRequestId
 *                   - cancellationNote
 *                 properties:
 *                   isCancellation:
 *                     type: boolean
 *                     example: true
 *                   originalLeaveRequestId:
 *                     type: string
 *                     format: uuid
 *                   cancellationNote:
 *                     type: string
 *                     example: Plans changed, need to cancel
 *     responses:
 *       201:
 *         description: Leave request submitted successfully
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
 *                 data:
 *                   $ref: '#/components/schemas/LeaveRequest'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Conflict (e.g., cancellation already pending)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST a new leave request
// POST to create a new leave request
router.post('/', validate(validators.createLeaveRequestSchema), async (req, res, next) => {
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
        } = req.validatedData;
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
                throw new NotFoundError('Original leave request not found or does not belong to you.');
            }

            // Check if original request is in a cancellable status
            if (!['Pending', 'Approved'].includes(originalRequest.status)) {
                await transaction.rollback();
                throw new BadRequestError(`Cannot cancel a leave request with status: ${originalRequest.status}`);
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
                throw new ConflictError('A cancellation request is already pending for this leave.');
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
            throw new BadRequestError('The leave duration must be at least a half day.');
        }

        const leaveBalance = await LeaveBalance.findOne({ where: { employeeId, leaveTypeId } });
        if (!leaveBalance || leaveBalance.balance < totalDays) {
            await transaction.rollback();
            throw new BadRequestError('Insufficient leave balance.');
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
        // Only rollback if transaction is still active (not already rolled back or committed)
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        next(error);
    }
});

/**
 * @swagger
 * /api/leaves/{id}/status:
 *   put:
 *     summary: Approve or reject leave request
 *     description: Update leave request status - Manager/Admin/HR only. Handles both normal leaves and cancellation requests with automatic balance adjustments.
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leave request ID
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
 *                 enum: [Approved, Rejected]
 *                 example: Approved
 *               approverComments:
 *                 type: string
 *                 example: Approved for requested dates
 *     responses:
 *       200:
 *         description: Leave request status updated successfully
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
 *                   example: Leave request has been approved.
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// PUT to update leave request status (approve/reject)
router.put('/:id/status', isManagerOrAbove, validateParams(validators.uuidParamSchema), validate(validators.updateLeaveStatusSchema), async (req, res, next) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { status, approverComments } = req.validatedData;
        const leaveRequest = await LeaveRequest.findByPk(req.validatedParams.id);

        if (!leaveRequest || leaveRequest.status !== 'Pending') {
            await transaction.rollback();
            throw new BadRequestError('This leave request cannot be updated.');
        }

        // Permission check for managers
        if (req.userRole === 'manager') {
            const isManagerOfOwner = await Employee.findOne({ where: { id: leaveRequest.employeeId, managerId: req.employeeId } });
            if (!isManagerOfOwner) {
                await transaction.rollback();
                throw new ForbiddenError('You can only approve requests for your direct reports.');
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
        next(error);
    }
});

// --- Metadata Routes ---

// GET pending leave requests for manager approval
router.get('/manager/:managerId/pending', validateParams(validators.uuidParamSchema), async (req, res, next) => {
    try {
        const { managerId } = req.validatedParams;
        
        // Security check: only manager can access their own pending requests or admin/hr can access any
        if (req.userRole === 'manager' && req.employeeId !== managerId && req.userRole !== 'admin' && req.userRole !== 'hr') {
            throw new ForbiddenError('Access denied.');
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
        next(error);
    }
});

// PUT approve/reject leave request (enhanced version)
router.put('/:id/approve-reject', validateParams(validators.uuidParamSchema), async (req, res, next) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { action, comments } = req.body;
        const leaveId = req.validatedParams.id;

        if (!['approved', 'rejected'].includes(action)) {
            throw new BadRequestError('Invalid action. Use "approved" or "rejected".');
        }

        const leaveRequest = await LeaveRequest.findByPk(leaveId);
        if (!leaveRequest) {
            await transaction.rollback();
            throw new NotFoundError('Leave request not found.');
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
        next(error);
    }
});

/**
 * @swagger
 * /api/leaves/pending-for-manager:
 *   get:
 *     summary: Get pending leave requests for manager approval
 *     description: Retrieve all pending leave requests for the manager's team members - Manager/Admin/HR only
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending leave requests retrieved successfully
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
 *                     $ref: '#/components/schemas/LeaveRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// GET pending leave requests for manager approval
router.get('/pending-for-manager', authorize(['manager', 'admin', 'hr']), async (req, res, next) => {
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
        next(error);
    }
});

/**
 * @swagger
 * /api/leaves/{id}/approve:
 *   put:
 *     summary: Approve leave request
 *     description: Approve a pending leave request - Manager/Admin/HR only
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leave request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *                 example: Approved for requested dates
 *     responses:
 *       200:
 *         description: Leave request approved successfully
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
 *                 data:
 *                   $ref: '#/components/schemas/LeaveRequest'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT approve leave request (manager)
router.put('/:id/approve', authorize(['manager', 'admin', 'hr']), validateParams(validators.uuidParamSchema), async (req, res, next) => {
    try {
        const leaveRequest = await LeaveRequest.findByPk(req.validatedParams.id, {
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'managerId']
                }
            ]
        });

        if (!leaveRequest) {
            throw new NotFoundError('Leave request not found');
        }

        // Check if manager can approve this request
        if (req.userRole === 'manager' && leaveRequest.employee.managerId !== req.employeeId) {
            throw new ForbiddenError('You can only approve leave requests for your team members');
        }

        if (leaveRequest.status !== 'Pending') {
            throw new BadRequestError('Leave request is not in pending status');
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
        next(error);
    }
});

/**
 * @swagger
 * /api/leaves/{id}/reject:
 *   put:
 *     summary: Reject leave request
 *     description: Reject a pending leave request and restore leave balance - Manager/Admin/HR only
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leave request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comments
 *             properties:
 *               comments:
 *                 type: string
 *                 example: Insufficient staffing during requested period
 *     responses:
 *       200:
 *         description: Leave request rejected successfully
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
 *                 data:
 *                   $ref: '#/components/schemas/LeaveRequest'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PUT reject leave request (manager)
router.put('/:id/reject', authorize(['manager', 'admin', 'hr']), validateParams(validators.uuidParamSchema), async (req, res, next) => {
    try {
        const { comments } = req.body;

        if (!comments || !comments.trim()) {
            throw new BadRequestError('Rejection reason is required');
        }

        const leaveRequest = await LeaveRequest.findByPk(req.validatedParams.id, {
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'managerId']
                }
            ]
        });

        if (!leaveRequest) {
            throw new NotFoundError('Leave request not found');
        }

        // Check if manager can reject this request
        if (req.userRole === 'manager' && leaveRequest.employee.managerId !== req.employeeId) {
            throw new ForbiddenError('You can only reject leave requests for your team members');
        }

        if (leaveRequest.status !== 'Pending') {
            throw new BadRequestError('Leave request is not in pending status');
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
        next(error);
    }
});

/**
 * @swagger
 * /api/leaves/recent-approvals:
 *   get:
 *     summary: Get recent leave approvals/rejections by manager
 *     description: Retrieve the last 10 leave requests approved or rejected by the current manager - Manager/Admin/HR only
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent approvals retrieved successfully
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
 *                     $ref: '#/components/schemas/LeaveRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// GET recent approvals by manager
router.get('/recent-approvals', authorize(['manager', 'admin', 'hr']), async (req, res, next) => {
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
        next(error);
    }
});

/**
 * @swagger
 * /api/leave/{id}:
 *   delete:
 *     summary: Delete a leave request
 *     description: Delete a leave request. Employees can only delete their own pending requests. Managers/HR/Admin can delete any pending request.
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Leave request deleted successfully
 *       403:
 *         description: Cannot delete this leave request (not yours or already processed)
 *       404:
 *         description: Leave request not found
 */
router.delete('/:id', validateParams(validators.uuidParamSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId, userRole, employeeId } = req;

        // Find the leave request
        const leaveRequest = await LeaveRequest.findByPk(id, {
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'employeeId', 'firstName', 'lastName']
                }
            ]
        });

        if (!leaveRequest) {
            throw new NotFoundError('Leave request not found');
        }

        // Check authorization
        const isOwnRequest = leaveRequest.employeeId === employeeId;
        const normalizedRole = userRole ? userRole.toLowerCase() : 'employee';
        const isManagerOrAbove = ['admin', 'hr', 'manager'].includes(normalizedRole);

        if (!isOwnRequest && !isManagerOrAbove) {
            throw new ForbiddenError('You can only delete your own leave requests');
        }

        // Only allow deletion of pending requests
        if (leaveRequest.status !== 'Pending') {
            const statusText = leaveRequest.status || 'unknown';
            throw new ForbiddenError(`Cannot delete ${statusText.toLowerCase()} leave requests`);
        }

        await leaveRequest.destroy();

        res.json({
            success: true,
            message: 'Leave request deleted successfully',
            data: {
                id: leaveRequest.id,
                status: 'deleted'
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
