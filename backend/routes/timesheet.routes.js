const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken, requireEmployeeRecord, authorize, isManagerOrAbove } = require('../middleware/auth.simple');
const { validate, validateQuery, validateParams } = require('../middleware/validate');
const validators = require('../middleware/validators');
const { NotFoundError, ConflictError, ForbiddenError, ValidationError } = require('../utils/errors');
const TaskValidator = require('../utils/TaskValidator');
const { sanitizeTimesheetData, sanitizeBulkTimesheetData } = require('../utils/sanitizer');
const { bulkOperationLimiter } = require('../middleware/rateLimiter');
const LogHelper = require('../utils/logHelper');
const { logger } = require('../config/logger');
const db = require('../models');
const { Op } = require('sequelize');

// Dedicated submission tracking logger
function logSubmissionActivity(type, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        type, // 'creation', 'individual_submission', 'bulk_submission', 'submission_attempt'
        ...data
    };
    
    // Log using structured logger
    LogHelper.logBusinessEvent(`Timesheet ${type}`, logEntry);
    
    // Also write to a log file for persistent tracking
    try {
        const logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, `timesheet-submissions-${new Date().toISOString().split('T')[0]}.log`);
        const logLine = `${timestamp} [${type}] ${JSON.stringify(data)}\n`;
        fs.appendFileSync(logFile, logLine);
    } catch (error) {
        LogHelper.logError(error, { context: 'Failed to write to submission log file' });
    }
}

const Timesheet = db.Timesheet;
const Employee = db.Employee;
const Project = db.Project;
const Task = db.Task;

// Helper function for bulk submission logic (extracted for reuse)
async function handleBulkSubmission(req, res) {
    try {
        logger.info('Bulk timesheet submission started', { 
            employeeId: req.employeeId, 
            body: req.body 
        });
        
        const { timesheetIds } = req.body;

        if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
            logger.warn('Invalid timesheet IDs provided in bulk submission', { employeeId: req.employeeId });
            return res.status(400).json({
                success: false,
                message: 'Invalid timesheet IDs. Please provide an array of timesheet IDs.'
            });
        }

        logger.info(`Processing bulk submission for ${timesheetIds.length} timesheets`, { employeeId: req.employeeId });
        
        const results = [];
        const errors = [];

        // Process each timesheet individually with detailed logging
        for (let i = 0; i < timesheetIds.length; i++) {
            const timesheetId = timesheetIds[i];
            logger.debug(`Processing timesheet ${i + 1}/${timesheetIds.length}`, { timesheetId });
            
            try {
                // Find the timesheet with detailed logging
                const timesheet = await Timesheet.findOne({
                    where: { id: timesheetId },
                    include: [
                        { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName'] },
                        { model: Project, as: 'project', attributes: ['id', 'name'], paranoid: false },
                        { model: Task, as: 'task', attributes: ['id', 'name'], paranoid: false }
                    ]
                });

                if (!timesheet) {
                    logger.warn('Timesheet not found in bulk submission', { timesheetId });
                    errors.push({
                        timesheetId,
                        error: 'Timesheet not found'
                    });
                    continue;
                }

                logger.debug('Timesheet details', {
                    employee: `${timesheet.employee?.firstName} ${timesheet.employee?.lastName}`,
                    project: timesheet.project?.name,
                    task: timesheet.task?.name,
                    week: `${timesheet.weekStartDate} to ${timesheet.weekEndDate}`,
                    status: timesheet.status,
                    totalHours: timesheet.totalHoursWorked
                });

                // Verify ownership
                if (timesheet.employeeId !== req.employeeId) {
                    logger.warn('Ownership check failed for bulk submission', { timesheetId, employeeId: req.employeeId });
                    errors.push({
                        timesheetId,
                        error: 'You can only submit your own timesheets'
                    });
                    continue;
                }

                // Check if timesheet can be submitted
                if (timesheet.status !== 'Draft') {
                    logger.warn('Status check failed for bulk submission', { timesheetId, status: timesheet.status });
                    errors.push({
                        timesheetId,
                        error: `Cannot submit timesheet with status: ${timesheet.status}. Only draft timesheets can be submitted.`
                    });
                    continue;
                }

                // Check for zero hours
                if (parseFloat(timesheet.totalHoursWorked) === 0) {
                    logger.warn('Submitting timesheet with zero hours', { timesheetId });
                }

                // Update timesheet status
                logger.info('Submitting timesheet in bulk', { timesheetId });
                await timesheet.update({
                    status: 'Submitted',
                    submittedAt: new Date()
                });

                // Log bulk submission activity for each timesheet
                logSubmissionActivity('bulk_submission_item', {
                    timesheetId,
                    employeeId: req.employeeId,
                    employeeName: `${timesheet.employee?.firstName} ${timesheet.employee?.lastName}`,
                    projectId: timesheet.projectId,
                    projectName: timesheet.project?.name,
                    taskId: timesheet.taskId,
                    taskName: timesheet.task?.name,
                    weekStartDate: timesheet.weekStartDate,
                    weekEndDate: timesheet.weekEndDate,
                    totalHours: timesheet.totalHoursWorked,
                    previousStatus: 'Draft',
                    newStatus: 'Submitted',
                    submittedAt: new Date().toISOString(),
                    bulkSubmissionBatch: true
                });

                logger.debug('Timesheet submitted in bulk', { timesheetId, employeeId: timesheet.employeeId });
                results.push({
                    timesheetId,
                    status: 'success',
                    message: 'Timesheet submitted successfully',
                    details: {
                        employee: `${timesheet.employee?.firstName} ${timesheet.employee?.lastName}`,
                        project: timesheet.project?.name,
                        task: timesheet.task?.name,
                        week: `${timesheet.weekStartDate} to ${timesheet.weekEndDate}`,
                        totalHours: timesheet.totalHoursWorked,
                        submittedAt: new Date().toISOString()
                    }
                });

            } catch (timesheetError) {
                logger.warn('Error processing timesheet in bulk submission', { 
                    timesheetId, 
                    error: timesheetError.message 
                });
                errors.push({
                    timesheetId,
                    error: timesheetError.message
                });
            }
        }

        logger.info('Bulk submission summary', {
            total: timesheetIds.length,
            successful: results.length,
            failed: errors.length,
            successRate: ((results.length / timesheetIds.length) * 100).toFixed(1)
        });

        if (results.length > 0) {
            logger.debug('Successful submissions', { 
                submissions: results.map(r => ({
                    employee: r.details.employee,
                    project: r.details.project,
                    task: r.details.task,
                    hours: r.details.totalHours
                }))
            });
        }

        if (errors.length > 0) {
            logger.warn('Failed submissions', {
                failures: errors.map(e => ({ timesheetId: e.timesheetId, error: e.error }))
            });
        }

        // Log bulk submission summary
        logSubmissionActivity('bulk_submission_summary', {
            employeeId: req.employeeId,
            totalTimesheets: timesheetIds.length,
            successfulSubmissions: results.length,
            failedSubmissions: errors.length,
            submittedTimesheetIds: results.map(r => r.timesheetId),
            failedTimesheetIds: errors.map(e => e.timesheetId),
            submissionErrors: errors,
            weekStartDate: req.body.weekStartDate || 'unknown'
        });

        logger.info('Bulk timesheet submission completed', { 
            employeeId: req.employeeId, 
            total: timesheetIds.length 
        });

        // Return response based on results
        if (errors.length === 0) {
            return res.json({
                success: true,
                message: `Successfully submitted ${results.length} timesheet(s)`,
                data: {
                    submitted: results,
                    summary: {
                        total: timesheetIds.length,
                        successful: results.length,
                        failed: errors.length
                    }
                }
            });
        } else if (results.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No timesheets could be submitted',
                errors,
                data: {
                    submitted: results,
                    summary: {
                        total: timesheetIds.length,
                        successful: results.length,
                        failed: errors.length
                    }
                }
            });
        } else {
            return res.status(207).json({ // 207 Multi-Status
                success: true,
                message: `Partially successful: ${results.length} submitted, ${errors.length} failed`,
                errors,
                data: {
                    submitted: results,
                    summary: {
                        total: timesheetIds.length,
                        successful: results.length,
                        failed: errors.length
                    }
                }
            });
        }

    } catch (error) {
        LogHelper.logError(error, { 
            context: 'Bulk submit timesheets', 
            employeeId: req.employeeId,
            timesheetCount: timesheetIds?.length 
        }, req);
        return res.status(500).json({
            success: false,
            message: 'Failed to process bulk timesheet submission',
            error: error.message
        });
    }
}

const router = express.Router();

// Helper functions for week calculations
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Enhanced task availability validation with proper type safety
function validateTaskAccess(task, employeeId, context = 'operation', userRole = null) {
  if (!task) {
    return { 
      allowed: false, 
      message: 'Task not found or invalid.' 
    };
  }

  // Admin and HR users can work on any task
  if (userRole === 'admin' || userRole === 'hr') {
    return { allowed: true };
  }

  // If task is available to all employees, allow access
  if (task.availableToAll) {
    return { allowed: true };
  }

  // If task is not assigned to anyone, deny access
  if (!task.assignedTo) {
    return { 
      allowed: false, 
      message: 'This task is not available to any employees. Please contact your manager.' 
    };
  }

  // Convert both IDs to strings for proper comparison (handles UUID vs string types)
  const taskAssignedTo = task.assignedTo.toString();
  const currentEmployeeId = employeeId.toString();

  // Check if current employee is assigned to this task
  if (taskAssignedTo === currentEmployeeId) {
    return { allowed: true };
  }

  return { 
    allowed: false, 
    message: `You are not authorized to work on this task during ${context}. Please contact your manager.` 
  };
}

router.use(authenticateToken);

/**
 * @swagger
 * /api/timesheets:
 *   get:
 *     summary: Get all timesheets with filtering
 *     description: Retrieve paginated timesheets with role-based access - employees see their own, managers see their team, admin/HR see all
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Submitted, Approved, Rejected]
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: weekNumber
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Timesheets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Timesheet'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// GET all weekly timesheets with role-based filtering
router.get('/', validateQuery(validators.timesheetQuerySchema), async (req, res, next) => {
    try {
        logger.debug('Timesheet GET request query params:', req.query);
        logger.debug('Validated query params:', req.validatedQuery);
        
        const { 
            page, 
            limit, 
            status, 
            employeeId, 
            projectId, 
            year, 
            weekNumber,
            startDate,
            sort, 
            order 
        } = req.validatedQuery;
        
        const offset = (page - 1) * limit;
        let where = {};

        // Role-based access control
        if (req.userRole === 'manager') {
            const subordinates = await Employee.findAll({ 
                where: { managerId: req.employeeId }, 
                attributes: ['id'] 
            });
            const subordinateIds = subordinates.map(e => e.id);
            where.employeeId = { [Op.in]: [...subordinateIds, req.employeeId] };
        } else if (req.userRole === 'employee') {
            where.employeeId = req.employeeId;
        }
        // Admin/HR can see all timesheets by default, or filter by specific employee
        // No default filtering for admin/hr roles

        // Additional filters  
        if (status) {
            // Normalize status case for database query
            const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
            where.status = normalizedStatus;
        }
        if (projectId) where.projectId = projectId;
        if (year) where.year = parseInt(year);
        if (weekNumber) where.weekNumber = parseInt(weekNumber);
        
        // Handle startDate parameter for weekly filtering
        if (startDate) {
            logger.debug('Filtering timesheets by startDate', { startDate, employeeId: req.employeeId });
            // Ensure exact match for week start date
            where.weekStartDate = { [Op.eq]: startDate };
            logger.debug('WHERE condition for timesheet query:', where);
        }
        
        // Admin/HR can filter by specific employee
        if (employeeId && (req.userRole === 'admin' || req.userRole === 'hr')) {
            where.employeeId = employeeId;
        }

        const { count, rows: timesheets } = await Timesheet.findAndCountAll({
            where,
            include: [
                { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId'] },
                { model: Project, as: 'project', attributes: ['id', 'name'], paranoid: false },
                { model: Task, as: 'task', attributes: ['id', 'name'], paranoid: false },
                { model: Employee, as: 'approver', attributes: ['id', 'firstName', 'lastName'], required: false }
            ],
            order: [[sort, order.toUpperCase()]],
            limit: parseInt(limit),
            offset,
        });

        // Defensive filtering: Ensure returned timesheets match the requested week
        if (startDate) {
            const originalCount = timesheets.length;
            const filteredTimesheets = timesheets.filter(ts => ts.weekStartDate === startDate);
            if (filteredTimesheets.length !== originalCount) {
                logger.warn('Week mismatch detected in query results', {
                    requestedWeek: startDate,
                    originalCount,
                    filteredCount: filteredTimesheets.length,
                    mismatchedTimesheets: timesheets.filter(ts => ts.weekStartDate !== startDate).map(ts => ({
                        id: ts.id,
                        actualWeek: ts.weekStartDate
                    }))
                });
            }
            timesheets = filteredTimesheets;
        }

        logger.debug('Timesheet query results:', {
            requestedStartDate: startDate,
            count: timesheets.length,
            timesheets: timesheets.map(ts => ({
                id: ts.id,
                weekStartDate: ts.weekStartDate,
                status: ts.status,
                employeeId: ts.employeeId
            }))
        });

        res.json({
            success: true,
            data: timesheets,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(timesheets.length / limit),
                totalItems: timesheets.length,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

// ===== BULK OPERATIONS (must come before /:id routes) =====

// POST bulk create timesheets (save multiple as draft)
router.post('/bulk-save', async (req, res) => {
    return await handleBulkSave(req, res, false);
});

// PUT bulk update timesheets (update multiple drafts)
router.put('/bulk-update', async (req, res) => {
    return await handleBulkSave(req, res, true);
});

// POST bulk submit timesheets (multiple timesheets at once)
/**
 * @swagger
 * /api/timesheets/bulk-submit:
 *   post:
 *     summary: Bulk submit timesheets
 *     description: Submit multiple draft timesheets at once - changes status from Draft to Submitted
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timesheetIds
 *             properties:
 *               timesheetIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
 *     responses:
 *       200:
 *         description: Bulk submission completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     submitted:
 *                       type: integer
 *                       example: 5
 *                     failed:
 *                       type: integer
 *                       example: 0
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/bulk-submit', validate(validators.bulkSubmitTimesheetSchema), async (req, res, next) => {
    return await handleBulkSubmission(req, res, next);
});

// POST bulk approve timesheets (managers, admin, hr)
/**
 * @swagger
 * /api/timesheets/bulk-approve:
 *   post:
 *     summary: Bulk approve timesheets
 *     description: Approve multiple submitted timesheets at once - Manager/Admin/HR only
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timesheetIds
 *             properties:
 *               timesheetIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               comments:
 *                 type: string
 *                 example: Approved for all team members
 *     responses:
 *       200:
 *         description: Bulk approval completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 approved:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/bulk-approve', authorize(['manager', 'admin', 'hr']), async (req, res, next) => {
    try {
        const { timesheetIds, approverComments = '' } = req.body;
        
        // Validate input
        if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
            throw new ValidationError('Please provide an array of timesheet IDs to approve.');
        }

        logger.info('Bulk approval started', { 
            count: timesheetIds.length, 
            userId: req.userId,
            approverId: req.employeeId,
            hasComments: !!approverComments 
        });

        const results = [];
        const errors = [];

        // Fetch all timesheets with employee data in one query to avoid N+1
        const timesheets = await Timesheet.findAll({
            where: { id: { [Op.in]: timesheetIds } },
            include: [{ 
                model: Employee, 
                as: 'employee',
                attributes: ['id', 'managerId', 'firstName', 'lastName']
            }]
        });

        // Create a map for quick lookup
        const timesheetMap = new Map(timesheets.map(ts => [ts.id, ts]));

        // Process each timesheet
        for (const timesheetId of timesheetIds) {
            try {
                const timesheet = timesheetMap.get(timesheetId);

                if (!timesheet) {
                    errors.push({
                        timesheetId,
                        error: 'Timesheet not found'
                    });
                    continue;
                }

                // Check approval permissions - employee data already loaded
                if (!timesheet.canBeApprovedBy(req.userRole, req.employeeId, timesheet.employee.managerId)) {
                    errors.push({
                        timesheetId,
                        error: 'You do not have permission to approve this timesheet'
                    });
                    continue;
                }

                // Can only approve submitted timesheets
                if (timesheet.status !== 'Submitted') {
                    errors.push({
                        timesheetId,
                        error: `Cannot approve timesheet with status: ${timesheet.status}`
                    });
                    continue;
                }

                // Update timesheet status
                await timesheet.update({
                    status: 'Approved',
                    approverComments: approverComments,
                    approvedBy: req.employeeId,
                    approvedAt: new Date()
                });

                results.push({
                    timesheetId,
                    status: 'success',
                    message: 'Approved successfully'
                });

                logger.debug('Timesheet approved', { timesheetId, approverId: req.employeeId });

            } catch (error) {
                logger.warn('Error approving timesheet', { timesheetId, error: error.message });
                errors.push({
                    timesheetId,
                    error: error.message
                });
            }
        }

        logger.info('Bulk approval completed', { 
            successful: results.length, 
            failed: errors.length,
            approverId: req.employeeId 
        });

        res.json({
            success: true,
            message: `Bulk approval completed. ${results.length} approved, ${errors.length} failed.`,
            data: {
                approved: results,
                failed: errors,
                summary: {
                    total: timesheetIds.length,
                    successful: results.length,
                    failed: errors.length
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

// POST bulk reject timesheets (managers, admin, hr)
/**
 * @swagger
 * /api/timesheets/bulk-reject:
 *   post:
 *     summary: Bulk reject timesheets
 *     description: Reject multiple submitted timesheets at once with comments - Manager/Admin/HR only
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timesheetIds
 *               - comments
 *             properties:
 *               timesheetIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               comments:
 *                 type: string
 *                 example: Hours exceed maximum limit, please review
 *     responses:
 *       200:
 *         description: Bulk rejection completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 rejected:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/bulk-reject', bulkOperationLimiter, authorize(['manager', 'admin', 'hr']), async (req, res, next) => {
    try {
        const { timesheetIds, approverComments = '' } = req.body;
        
        // Validate input
        if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
            throw new ValidationError('Please provide an array of timesheet IDs to reject.');
        }

        if (!approverComments.trim()) {
            throw new ValidationError('Rejection reason is required for bulk rejection.');
        }

        logger.info('Bulk rejection started', { 
            count: timesheetIds.length, 
            userId: req.userId,
            approverId: req.employeeId 
        });

        const results = [];
        const errors = [];

        // Fetch all timesheets with employee data in one query to avoid N+1
        const timesheets = await Timesheet.findAll({
            where: { id: { [Op.in]: timesheetIds } },
            include: [{ 
                model: Employee, 
                as: 'employee',
                attributes: ['id', 'managerId', 'firstName', 'lastName']
            }]
        });

        // Create a map for quick lookup
        const timesheetMap = new Map(timesheets.map(ts => [ts.id, ts]));

        // Process each timesheet
        for (const timesheetId of timesheetIds) {
            try {
                const timesheet = timesheetMap.get(timesheetId);

                if (!timesheet) {
                    errors.push({
                        timesheetId,
                        error: 'Timesheet not found'
                    });
                    continue;
                }

                // Check approval permissions - employee data already loaded
                if (!timesheet.canBeApprovedBy(req.userRole, req.employeeId, timesheet.employee.managerId)) {
                    errors.push({
                        timesheetId,
                        error: 'You do not have permission to reject this timesheet'
                    });
                    continue;
                }

                // Can only reject submitted timesheets
                if (timesheet.status !== 'Submitted') {
                    errors.push({
                        timesheetId,
                        error: `Cannot reject timesheet with status: ${timesheet.status}`
                    });
                    continue;
                }

                // Update timesheet status
                await timesheet.update({
                    status: 'Rejected',
                    approverComments: approverComments,
                    approvedBy: req.employeeId,
                    rejectedAt: new Date()
                });

                results.push({
                    timesheetId,
                    status: 'success',
                    message: 'Rejected successfully'
                });

                logger.debug('Timesheet rejected', { timesheetId, approverId: req.employeeId });

            } catch (error) {
                logger.warn('Error rejecting timesheet', { timesheetId, error: error.message });
                errors.push({
                    timesheetId,
                    error: error.message
                });
            }
        }

        logger.info('Bulk rejection completed', { 
            successful: results.length, 
            failed: errors.length,
            approverId: req.employeeId 
        });

        res.json({
            success: true,
            message: `Bulk rejection completed. ${results.length} rejected, ${errors.length} failed.`,
            data: {
                rejected: results,
                failed: errors,
                summary: {
                    total: timesheetIds.length,
                    successful: results.length,
                    failed: errors.length
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

// ===== INDIVIDUAL OPERATIONS (parameterized routes) =====

// GET specific weekly timesheet by ID
/**
 * @swagger
 * /api/timesheets/{id}:
 *   get:
 *     summary: Get timesheet by ID
 *     description: Retrieve detailed information about a specific timesheet
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Timesheet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Timesheet'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', validateParams(validators.uuidParamSchema), async (req, res, next) => {
    try {
        const timesheet = await Timesheet.findByPk(req.validatedParams.id, {
            include: ['employee', 'project', 'task', 'approver']
        });

        if (!timesheet) {
            throw new NotFoundError('Timesheet not found.');
        }

        // Check access permissions
        if (req.userRole === 'employee' && timesheet.employeeId !== req.employeeId) {
            throw new ForbiddenError('Access denied.');
        }

        if (req.userRole === 'manager') {
            const isSubordinate = await Employee.findOne({ 
                where: { id: timesheet.employeeId, managerId: req.employeeId } 
            });
            if (!isSubordinate && timesheet.employeeId !== req.employeeId) {
                throw new ForbiddenError('Access denied.');
            }
        }

        res.json({ success: true, data: timesheet });
    } catch (error) {
        next(error);
    }
});

// POST create new weekly timesheet
/**
 * @swagger
 * /api/timesheets:
 *   post:
 *     summary: Create a new timesheet
 *     description: Create a new timesheet entry for tracking work hours on projects/tasks
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - taskId
 *               - weekStartDate
 *               - weekEndDate
 *             properties:
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               taskId:
 *                 type: string
 *                 format: uuid
 *               weekStartDate:
 *                 type: string
 *                 format: date
 *               weekEndDate:
 *                 type: string
 *                 format: date
 *               mondayHours:
 *                 type: number
 *                 example: 8
 *               tuesdayHours:
 *                 type: number
 *               wednesdayHours:
 *                 type: number
 *               thursdayHours:
 *                 type: number
 *               fridayHours:
 *                 type: number
 *               saturdayHours:
 *                 type: number
 *               sundayHours:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Timesheet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Timesheet'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', validate(validators.createTimesheetSchema), async (req, res, next) => {
    try {
        const requestId = Math.random().toString(36).substr(2, 9);
        logger.info('Timesheet creation request', {
            requestId,
            employeeId: req.employeeId,
            userId: req.userId,
            hasProjectId: !!req.validatedData.projectId,
            hasTaskId: !!req.validatedData.taskId
        });

        // Use validated data from middleware
        const value = req.validatedData;

        // Sanitize and prepare data
        const employeeId = req.employeeId;
        
        // Enhanced date validation and processing
        let weekStart, weekEnd, weekNum, year;
        try {
            weekStart = new Date(value.weekStartDate);
            
            // Validate that the date is actually a Monday
            if (weekStart.getDay() !== 1) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid week start date: Must be a Monday.',
                    details: {
                        received: value.weekStartDate,
                        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekStart.getDay()],
                        expectedDay: 'Monday'
                    },
                    hint: 'Week start date must be a Monday. Use a date picker or ensure your date calculation is correct.'
                });
            }

            weekEnd = getWeekEnd(weekStart);
            weekNum = getWeekNumber(weekStart);
            year = weekStart.getFullYear();
        } catch (dateError) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid date format for weekStartDate.',
                details: {
                    received: value.weekStartDate,
                    error: dateError.message,
                    expectedFormat: 'YYYY-MM-DD (ISO 8601 date string)'
                },
                hint: 'Please provide weekStartDate in YYYY-MM-DD format (e.g., "2024-01-01")'
            });
        }

        // Check if a timesheet already exists for this specific employee, week, project, and task combination
        const existingTimesheet = await Timesheet.findOne({
            where: {
                employeeId,
                weekStartDate: weekStart,
                year,
                projectId: value.projectId,
                taskId: value.taskId,
                deletedAt: null
            }
        });

        if (existingTimesheet) {
            // If existing timesheet is Draft, allow update instead of creating new one
            if (existingTimesheet.status === 'Draft') {
                logger.debug('Updating existing Draft timesheet', { 
                    timesheetId: existingTimesheet.id, 
                    employeeId 
                });
                
                // Update the existing draft timesheet
                const totalHours = (value.mondayHours || 0) +
                                 (value.tuesdayHours || 0) +
                                 (value.wednesdayHours || 0) +
                                 (value.thursdayHours || 0) +
                                 (value.fridayHours || 0) +
                                 (value.saturdayHours || 0) +
                                 (value.sundayHours || 0);
                
                await existingTimesheet.update({
                    mondayHours: value.mondayHours || 0,
                    tuesdayHours: value.tuesdayHours || 0,
                    wednesdayHours: value.wednesdayHours || 0,
                    thursdayHours: value.thursdayHours || 0,
                    fridayHours: value.fridayHours || 0,
                    saturdayHours: value.saturdayHours || 0,
                    sundayHours: value.sundayHours || 0,
                    description: value.description || '',
                    totalHoursWorked: totalHours
                });
                
                // Fetch updated timesheet with includes
                const updatedTimesheet = await Timesheet.findByPk(existingTimesheet.id, {
                    include: [
                        { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId'] },
                        { model: Project, as: 'project', attributes: ['id', 'name'], paranoid: false },
                        { model: Task, as: 'task', attributes: ['id', 'name'], paranoid: false }
                    ]
                });
                
                return res.json({ 
                    success: true, 
                    message: 'Existing draft timesheet updated successfully',
                    data: updatedTimesheet,
                    action: 'updated'
                });
            }
            
            // If existing timesheet is Submitted or Approved, block creation
            return res.status(400).json({ 
                success: false, 
                message: `A ${existingTimesheet.status.toLowerCase()} timesheet already exists for this project and task combination for this week.`,
                details: {
                    existingTimesheetId: existingTimesheet.id,
                    weekStartDate: weekStart.toISOString().split('T')[0],
                    weekEndDate: weekEnd.toISOString().split('T')[0],
                    projectId: value.projectId,
                    taskId: value.taskId,
                    status: existingTimesheet.status,
                    totalHours: existingTimesheet.totalHoursWorked
                },
                suggestion: {
                    action: existingTimesheet.status === 'Rejected' 
                        ? 'You can edit and resubmit the rejected timesheet'
                        : 'Choose a different project/task combination or contact your manager if changes are needed',
                    endpoint: existingTimesheet.status === 'Rejected' 
                        ? `PUT /api/timesheets/${existingTimesheet.id}`
                        : null
                }
            });
        }

        // Log if this is an additional task for the same week
        const weekTimesheetCount = await Timesheet.count({
            where: {
                employeeId,
                weekStartDate: weekStart,
                year,
                deletedAt: null
            }
        });

        if (weekTimesheetCount > 0) {
            logger.debug('Adding additional task for week', { 
                weekStart: weekStart.toISOString().split('T')[0], 
                existingCount: weekTimesheetCount,
                employeeId 
            });
        }

        // Validate project exists with detailed error
        const project = await Project.findByPk(value.projectId);
        if (!project) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project selected: Project not found.',
                details: {
                    providedProjectId: value.projectId,
                    error: 'Project does not exist or has been deleted'
                },
                hint: 'Please select a valid project from the available projects list. Contact your manager if you cannot find the required project.'
            });
        }

        // Validate task exists with detailed error
        const task = await Task.findByPk(value.taskId);
        if (!task) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid task selected: Task not found.',
                details: {
                    providedTaskId: value.taskId,
                    error: 'Task does not exist or has been deleted'
                },
                hint: 'Please select a valid task from the available tasks list. Contact your manager if you cannot find the required task.'
            });
        }

        // Validate task access using enhanced validation helper
        const taskValidation = await TaskValidator.validateTaskAccess(value.taskId, employeeId, req.userRole);
        if (!taskValidation.isValid) {
            return res.status(403).json({ 
                success: false, 
                message: taskValidation.message,
                details: taskValidation.details,
                hint: taskValidation.hint
            });
        }

        // Validate and calculate total hours with detailed feedback
        const dailyHours = {
            monday: value.mondayHours || 0,
            tuesday: value.tuesdayHours || 0,
            wednesday: value.wednesdayHours || 0,
            thursday: value.thursdayHours || 0,
            friday: value.fridayHours || 0,
            saturday: value.saturdayHours || 0,
            sunday: value.sundayHours || 0
        };

        const totalHours = Object.values(dailyHours).reduce((sum, hours) => sum + hours, 0);

        // Warn if no hours are entered
        if (totalHours === 0) {
            logger.warn('Timesheet created with zero hours', { employeeId, projectId: value.projectId });
        }

        // Warn if excessive hours
        if (totalHours > 60) {
            logger.warn('High total hours for timesheet', { totalHours, employeeId });
        }

        // Create new weekly timesheet with comprehensive logging
        logger.debug('Creating timesheet', {
            employeeId,
            projectId: value.projectId,
            taskId: value.taskId,
            weekStart: weekStart.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            weekNum,
            year,
            totalHours,
            dailyHours
        });

        const newTimesheet = await Timesheet.create({
            ...value,
            employeeId,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            weekNumber: weekNum,
            year,
            totalHoursWorked: totalHours,
            status: 'Draft'
        });

        // Fetch with includes for response
        const createdTimesheet = await Timesheet.findByPk(newTimesheet.id, {
            include: ['employee', 'project', 'task']
        });

        logger.info('Timesheet created successfully', {
            timesheetId: createdTimesheet.id,
            status: createdTimesheet.status,
            totalHours: createdTimesheet.totalHoursWorked,
            project: createdTimesheet.project?.name,
            task: createdTimesheet.task?.name,
            employeeId
        });
        
        // Log creation activity for tracking
        logSubmissionActivity('creation', {
            timesheetId: createdTimesheet.id,
            employeeId: employeeId,
            employeeName: `${createdTimesheet.employee?.firstName} ${createdTimesheet.employee?.lastName}`,
            projectId: value.projectId,
            projectName: createdTimesheet.project?.name,
            taskId: value.taskId,
            taskName: createdTimesheet.task?.name,
            weekStartDate: weekStart.toISOString().split('T')[0],
            weekEndDate: weekEnd.toISOString().split('T')[0],
            year: year,
            weekNumber: weekNum,
            totalHours: totalHours,
            dailyHours: dailyHours,
            status: 'Draft'
        });
        
        logger.info('Timesheet creation completed', { 
            timesheetId: createdTimesheet.id, 
            employeeId 
        });

        res.status(201).json({ 
            success: true, 
            message: 'Weekly timesheet created successfully as draft.', 
            data: createdTimesheet,
            summary: {
                weekStartDate: weekStart.toISOString().split('T')[0],
                weekEndDate: weekEnd.toISOString().split('T')[0],
                totalHours,
                dailyBreakdown: dailyHours,
                status: 'Draft'
            }
        });
    } catch (error) {
        // Handle specific database errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            return next(new ConflictError('A timesheet already exists for this week.'));
        }
        
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map(err => ({
                field: err.path,
                message: err.message
            }));
            return next(new ValidationError('Database validation failed.', validationErrors));
        }

        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return next(new ValidationError('Invalid reference: One or more IDs do not exist in the system.'));
        }
        
        next(error);
    }
});

// PUT update weekly timesheet
/**
 * @swagger
 * /api/timesheets/{id}:
 *   put:
 *     summary: Update a timesheet
 *     description: Update timesheet hours and details (only allowed for Draft timesheets)
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mondayHours:
 *                 type: number
 *               tuesdayHours:
 *                 type: number
 *               wednesdayHours:
 *                 type: number
 *               thursdayHours:
 *                 type: number
 *               fridayHours:
 *                 type: number
 *               saturdayHours:
 *                 type: number
 *               sundayHours:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Timesheet updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Timesheet'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', validateParams(validators.uuidParamSchema), validate(validators.updateTimesheetSchema), async (req, res, next) => {
    try {
        const value = req.validatedData;
        const timesheet = await Timesheet.findByPk(req.validatedParams.id);

        if (!timesheet) {
            throw new NotFoundError('Weekly timesheet not found.');
        }

        // Check edit permissions
        if (!timesheet.canBeEditedBy(req.userRole, req.userId, req.employeeId)) {
            throw new ForbiddenError('You can only edit draft or rejected timesheets.');
        }

        // If taskId is being updated, validate availability
        if (value.taskId && value.taskId !== timesheet.taskId) {
            const task = await Task.findByPk(value.taskId);
            if (!task) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid task selected.' 
                });
            }

            // Validate task access using enhanced validation helper
            const taskAccess = validateTaskAccess(task, req.employeeId, 'timesheet update', req.userRole);
            if (!taskAccess.allowed) {
                return res.status(403).json({ 
                    success: false, 
                    message: taskAccess.message 
                });
            }
        }

        // Recalculate total hours if any daily hours are being updated
        if (value.mondayHours !== undefined || value.tuesdayHours !== undefined || 
            value.wednesdayHours !== undefined || value.thursdayHours !== undefined || 
            value.fridayHours !== undefined || value.saturdayHours !== undefined || 
            value.sundayHours !== undefined) {
            
            const totalHours = (value.mondayHours !== undefined ? value.mondayHours : timesheet.mondayHours || 0) + 
                              (value.tuesdayHours !== undefined ? value.tuesdayHours : timesheet.tuesdayHours || 0) + 
                              (value.wednesdayHours !== undefined ? value.wednesdayHours : timesheet.wednesdayHours || 0) + 
                              (value.thursdayHours !== undefined ? value.thursdayHours : timesheet.thursdayHours || 0) + 
                              (value.fridayHours !== undefined ? value.fridayHours : timesheet.fridayHours || 0) + 
                              (value.saturdayHours !== undefined ? value.saturdayHours : timesheet.saturdayHours || 0) + 
                              (value.sundayHours !== undefined ? value.sundayHours : timesheet.sundayHours || 0);
            
            value.totalHoursWorked = totalHours;
        }

        // Update timesheet
        await timesheet.update(value);

        // Fetch updated timesheet with includes
        const updatedTimesheet = await Timesheet.findByPk(timesheet.id, {
            include: ['employee', 'project', 'task', 'approver']
        });

        res.json({ 
            success: true, 
            message: 'Weekly timesheet updated successfully.', 
            data: updatedTimesheet 
        });
    } catch (error) {
        LogHelper.logError(error, { context: 'Update weekly timesheet', timesheetId: req.params.id }, req);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update weekly timesheet.' 
        });
    }
});

// PUT submit weekly timesheet for approval
/**
 * @swagger
 * /api/timesheets/{id}/submit:
 *   put:
 *     summary: Submit a timesheet for approval
 *     description: Submit a draft timesheet for manager approval
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Timesheet submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Timesheet'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id/submit', async (req, res) => {
    try {
        logger.info('Individual timesheet submission started', {
            timesheetId: req.params.id,
            userId: req.userId,
            employeeId: req.employeeId
        });
        
        const timesheet = await Timesheet.findByPk(req.params.id, {
            include: [
                { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName'] },
                { model: Project, as: 'project', attributes: ['id', 'name'], paranoid: false },
                { model: Task, as: 'task', attributes: ['id', 'name'], paranoid: false }
            ]
        });
        
        if (!timesheet) {
            logger.warn('Timesheet not found for submission', { timesheetId: req.params.id, employeeId: req.employeeId });
            return res.status(404).json({ 
                success: false, 
                message: 'Weekly timesheet not found.' 
            });
        }

        logger.debug('Timesheet submission details', {
            timesheetId: req.params.id,
            employee: `${timesheet.employee?.firstName} ${timesheet.employee?.lastName}`,
            project: timesheet.project?.name,
            task: timesheet.task?.name,
            week: `${timesheet.weekStartDate} to ${timesheet.weekEndDate}`,
            status: timesheet.status,
            totalHours: timesheet.totalHoursWorked
        });

        // Only employee can submit their own timesheet
        if (timesheet.employeeId !== req.employeeId) {
            logger.warn('Ownership check failed for timesheet submission', { 
                timesheetId: req.params.id, 
                timesheetEmployee: timesheet.employeeId, 
                requestEmployee: req.employeeId 
            });
            return res.status(403).json({ 
                success: false, 
                message: 'You can only submit your own timesheets.' 
            });
        }

        // Can only submit draft timesheets
        if (timesheet.status !== 'Draft') {
            logger.warn('Cannot submit non-draft timesheet', { 
                timesheetId: req.params.id, 
                currentStatus: timesheet.status 
            });
            return res.status(400).json({ 
                success: false, 
                message: 'Only draft timesheets can be submitted.' 
            });
        }

        // Check if there are multiple tasks for the same week - if so, auto-trigger bulk submission
        const weekTimesheets = await Timesheet.findAll({
            where: {
                employeeId: req.employeeId,
                weekStartDate: timesheet.weekStartDate,
                year: timesheet.year,
                deletedAt: null
            }
        });

        if (weekTimesheets.length > 1) {
            logger.info('Multiple tasks for week - triggering bulk submission', { 
                weeklyTaskCount: weekTimesheets.length, 
                weekStartDate: timesheet.weekStartDate,
                employeeId: req.employeeId 
            });
            
            // Get all draft timesheets for this week
            const draftTimesheets = weekTimesheets.filter(ts => ts.status === 'Draft');
            
            if (draftTimesheets.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No draft timesheets found to submit for this week.' 
                });
            }
            
            logger.debug('Auto-submitting draft timesheets', { 
                draftCount: draftTimesheets.length,
                employeeId: req.employeeId 
            });
            
            // Prepare bulk submission data
            const timesheetIds = draftTimesheets.map(ts => ts.id);
            
            // Simulate bulk submission request
            const bulkReq = {
                body: { timesheetIds },
                employeeId: req.employeeId,
                user: req.user
            };
            
            // Call bulk submission logic (we'll need to extract it to a helper function)
            return await handleBulkSubmission(bulkReq, res);
        }

        // Validate that the task is still available to the employee
        const task = await Task.findByPk(timesheet.taskId);
        if (!task) {
            logger.warn('Task not found for timesheet submission', { 
                taskId: timesheet.taskId, 
                timesheetId: req.params.id 
            });
            return res.status(400).json({ 
                success: false, 
                message: 'The task associated with this timesheet no longer exists.' 
            });
        }

        // Validate task access using enhanced validation helper
        const taskAccess = validateTaskAccess(task, req.employeeId, 'timesheet submission', req.userRole);
        if (!taskAccess.allowed) {
            logger.warn('Task access denied for timesheet submission', { 
                taskId: timesheet.taskId, 
                employeeId: req.employeeId,
                userRole: req.userRole,
                reason: taskAccess.message 
            });
            return res.status(403).json({ 
                success: false, 
                message: taskAccess.message 
            });
        }

        // Validate minimum hours
        if (timesheet.totalHoursWorked <= 0) {
            logger.warn('Cannot submit timesheet with zero hours', { 
                timesheetId: req.params.id, 
                employeeId: req.employeeId 
            });
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot submit timesheet with zero hours.' 
            });
        }

        // Update status to submitted
        logger.info('Submitting timesheet', { 
            timesheetId: req.params.id, 
            employeeId: req.employeeId,
            totalHours: timesheet.totalHoursWorked 
        });
        await timesheet.update({
            status: 'Submitted',
            submittedAt: new Date()
        });

        // Log individual submission activity
        logSubmissionActivity('individual_submission', {
            timesheetId: req.params.id,
            employeeId: req.employeeId,
            employeeName: `${timesheet.employee?.firstName} ${timesheet.employee?.lastName}`,
            projectId: timesheet.projectId,
            projectName: timesheet.project?.name,
            taskId: timesheet.taskId,
            taskName: timesheet.task?.name,
            weekStartDate: timesheet.weekStartDate,
            weekEndDate: timesheet.weekEndDate,
            totalHours: timesheet.totalHoursWorked,
            previousStatus: 'Draft',
            newStatus: 'Submitted',
            submittedAt: new Date().toISOString()
        });

        logger.info('Timesheet submitted successfully', { 
            timesheetId: req.params.id, 
            employeeId: req.employeeId 
        });

        res.json({ 
            success: true, 
            message: 'Weekly timesheet submitted for approval successfully.' 
        });
    } catch (error) {
        LogHelper.logError(error, { 
            context: 'Submit timesheet for approval', 
            timesheetId: req.params.id,
            employeeId: req.employeeId 
        }, req);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit weekly timesheet.' 
        });
    }
});

// PUT approve/reject weekly timesheet (managers, admin, hr)
/**
 * @swagger
 * /api/timesheets/{id}/approve:
 *   put:
 *     summary: Approve a timesheet
 *     description: Approve a submitted timesheet - Manager/Admin/HR only
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Timesheet approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id/approve', authorize(['manager', 'admin', 'hr']), async (req, res) => {
    try {
        logger.debug('Approval request received', { timesheetId: req.params.id, body: req.body });
        
        const { error, value } = validators.timesheetApprovalSchema.validate(req.body);
        if (error) {
            logger.warn('Approval validation failed', { errors: error.details });
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: error.details 
            });
        }
        
        logger.debug('Approval validation passed', { action: value.action });

        const timesheet = await Timesheet.findByPk(req.params.id, {
            include: [{ 
                model: Employee, 
                as: 'employee',
                attributes: ['id', 'managerId', 'firstName', 'lastName']
            }]
        });
        
        if (!timesheet) {
            return res.status(404).json({ 
                success: false, 
                message: 'Weekly timesheet not found.' 
            });
        }

        // Check approval permissions - employee data already loaded
        
        logger.debug('Permission check for approval', {
            userRole: req.userRole,
            userId: req.userId,
            userEmployeeId: req.employeeId,
            timesheetEmployeeId: timesheet.employeeId,
            timesheetManagerId: timesheet.employee.managerId,
            timesheetStatus: timesheet.status
        });
        
        const canApprove = timesheet.canBeApprovedBy(req.userRole, req.employeeId, timesheet.employee.managerId);
        
        if (!canApprove) {
            logger.warn('Permission denied for timesheet approval', { 
                timesheetId: req.params.id, 
                userId: req.userId 
            });
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to approve this timesheet.' 
            });
        }

        // Can only approve submitted timesheets
        if (timesheet.status !== 'Submitted') {
            return res.status(400).json({ 
                success: false, 
                message: 'Only submitted timesheets can be approved or rejected.' 
            });
        }

        // Update timesheet status
        const updateData = {
            status: value.action === 'approve' ? 'Approved' : 'Rejected',
            approverComments: value.comments || '',
            approvedBy: req.employeeId,
            approvedAt: new Date()
        };

        if (value.action === 'reject') {
            updateData.rejectedAt = new Date();
        }

        await timesheet.update(updateData);

        res.json({ 
            success: true, 
            message: `Weekly timesheet ${value.action}d successfully.` 
        });
    } catch (error) {
        LogHelper.logError(error, { context: 'Approve timesheet', timesheetId: req.params.id }, req);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process timesheet approval.' 
        });
    }
});

// DELETE weekly timesheet (admin only)
/**
 * @swagger
 * /api/timesheets/{id}:
 *   delete:
 *     summary: Delete a timesheet
 *     description: Delete a timesheet (admin only)
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Timesheet deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', authorize(['admin']), async (req, res) => {
    try {
        const timesheet = await Timesheet.findByPk(req.params.id);
        if (!timesheet) {
            return res.status(404).json({ 
                success: false, 
                message: 'Weekly timesheet not found.' 
            });
        }

        // Soft delete the timesheet
        await timesheet.destroy();

        res.json({ 
            success: true, 
            message: 'Weekly timesheet deleted successfully.' 
        });
    } catch (error) {
        LogHelper.logError(error, { context: 'Delete timesheet', timesheetId: req.params.id }, req);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete weekly timesheet.' 
        });
    }
});

// GET weekly timesheets for approval (managers, admin, hr)
/**
 * @swagger
 * /api/timesheets/approval/pending:
 *   get:
 *     summary: Get pending timesheets for approval
 *     description: Retrieve all timesheets pending approval for manager's team - Manager/Admin/HR only
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending timesheets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Timesheet'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/approval/pending', isManagerOrAbove, async (req, res) => {
    try {
        const { year, weekNumber, employeeId } = req.query;
        let where = { status: 'Submitted' };
        
        // Filter by year and week if provided
        if (year) where.year = parseInt(year);
        if (weekNumber) where.weekNumber = parseInt(weekNumber);

        // Role-based filtering
        let employeeWhere = {};
        if (req.userRole === 'manager') {
            employeeWhere.managerId = req.employeeId;
        } else if (employeeId && (req.userRole === 'admin' || req.userRole === 'hr')) {
            where.employeeId = employeeId;
        }

        const timesheets = await Timesheet.findAll({
            where,
            include: [
                { 
                    model: Employee, 
                    as: 'employee', 
                    where: employeeWhere,
                    attributes: ['id', 'firstName', 'lastName', 'employeeId'] 
                },
                { model: Project, as: 'project', attributes: ['id', 'name'], paranoid: false },
                { model: Task, as: 'task', attributes: ['id', 'name'], paranoid: false }
            ],
            order: [['weekStartDate', 'DESC'], ['employee', 'firstName', 'ASC']]
        });

        res.json({
            success: true,
            data: timesheets,
            summary: {
                totalPending: timesheets.length,
                totalHours: timesheets.reduce((sum, ts) => sum + parseFloat(ts.totalHoursWorked || 0), 0),
                employees: [...new Set(timesheets.map(ts => ts.employeeId))].length
            }
        });
    } catch (error) {
        LogHelper.logError(error, { context: 'Get pending approvals' }, req);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch pending approvals.' 
        });
    }
});

// GET timesheet statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const { year = new Date().getFullYear(), employeeId } = req.query;
        let where = { year: parseInt(year) };
        
        // Role-based access
        if (req.userRole === 'employee') {
            where.employeeId = req.employeeId;
        } else if (req.userRole === 'manager') {
            const subordinates = await Employee.findAll({ 
                where: { managerId: req.employeeId }, 
                attributes: ['id'] 
            });
            const subordinateIds = subordinates.map(e => e.id);
            where.employeeId = { [Op.in]: [...subordinateIds, req.employeeId] };
        } else if (employeeId && (req.userRole === 'admin' || req.userRole === 'hr')) {
            where.employeeId = employeeId;
        }

        const stats = await Timesheet.findAll({
            where,
            attributes: [
                'status',
                [db.sequelize.fn('COUNT', '*'), 'count'],
                [db.sequelize.fn('SUM', db.sequelize.col('totalHoursWorked')), 'totalHours']
            ],
            group: ['status']
        });

        const summary = {
            Draft: { count: 0, totalHours: 0 },
            Submitted: { count: 0, totalHours: 0 },
            Approved: { count: 0, totalHours: 0 },
            Rejected: { count: 0, totalHours: 0 }
        };

        stats.forEach(stat => {
            summary[stat.status] = {
                count: parseInt(stat.dataValues.count),
                totalHours: parseFloat(stat.dataValues.totalHours || 0)
            };
        });

        res.json({ success: true, data: summary });
    } catch (error) {
        LogHelper.logError(error, { context: 'Get timesheet statistics', year: req.query.year }, req);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch timesheet statistics.' 
        });
    }
});

// Helper function for bulk save/update operations (with transaction support)
async function handleBulkSave(req, res, isUpdate = false) {
    // Start a database transaction for atomicity
    const transaction = await db.sequelize.transaction();
    
    try {
        const operation = isUpdate ? 'UPDATE' : 'CREATE';
        logger.info(`Bulk timesheet ${operation.toLowerCase()} started`, {
            employeeId: req.employeeId,
            operation,
            count: req.body.timesheets?.length,
            transactionId: transaction.id
        });
        
        const { timesheets } = req.body;

        if (!timesheets || !Array.isArray(timesheets) || timesheets.length === 0) {
            logger.warn('Invalid timesheets data for bulk operation');
            return res.status(400).json({
                success: false,
                message: `Invalid timesheets data. Please provide an array of timesheet objects.`
            });
        }

        logger.debug(`Processing ${timesheets.length} timesheets for bulk ${operation.toLowerCase()}`);
        
        // Sanitize all timesheet data
        const sanitizedTimesheets = sanitizeBulkTimesheetData(timesheets);
        
        const results = [];
        const errors = [];

        // Process each timesheet individually
        for (let i = 0; i < sanitizedTimesheets.length; i++) {
            const timesheetData = sanitizedTimesheets[i];
            console.log(`\n🔍 Processing timesheet ${i + 1}/${timesheets.length}`);
            
            try {
                let timesheet;
                
                if (isUpdate && timesheetData.id) {
                    // Update existing timesheet
                    console.log(`📝 Updating existing timesheet: ${timesheetData.id}`);
                    
                    // Validate UUID format
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                    if (!uuidRegex.test(timesheetData.id)) {
                        throw new Error(`Invalid timesheet ID format. Expected UUID, got: ${timesheetData.id}`);
                    }
                    
                    timesheet = await Timesheet.findOne({
                        where: { 
                            id: timesheetData.id,
                            employeeId: req.employeeId 
                        },
                        include: [
                            { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName'] },
                            { model: Project, as: 'project', attributes: ['id', 'name'], paranoid: false },
                            { model: Task, as: 'task', attributes: ['id', 'name'], paranoid: false }
                        ]
                    });

                    if (!timesheet) {
                        throw new Error(`Timesheet not found or access denied: ${timesheetData.id}`);
                    }

                    if (timesheet.status !== 'Draft') {
                        throw new Error(`Cannot update timesheet with status: ${timesheet.status}. Only draft timesheets can be updated.`);
                    }

                    // Update the timesheet
                    await timesheet.update({
                        projectId: timesheetData.projectId || timesheet.projectId,
                        taskId: timesheetData.taskId || timesheet.taskId,
                        mondayHours: timesheetData.mondayHours !== undefined ? timesheetData.mondayHours : timesheet.mondayHours,
                        tuesdayHours: timesheetData.tuesdayHours !== undefined ? timesheetData.tuesdayHours : timesheet.tuesdayHours,
                        wednesdayHours: timesheetData.wednesdayHours !== undefined ? timesheetData.wednesdayHours : timesheet.wednesdayHours,
                        thursdayHours: timesheetData.thursdayHours !== undefined ? timesheetData.thursdayHours : timesheet.thursdayHours,
                        fridayHours: timesheetData.fridayHours !== undefined ? timesheetData.fridayHours : timesheet.fridayHours,
                        saturdayHours: timesheetData.saturdayHours !== undefined ? timesheetData.saturdayHours : timesheet.saturdayHours,
                        sundayHours: timesheetData.sundayHours !== undefined ? timesheetData.sundayHours : timesheet.sundayHours,
                        description: timesheetData.description !== undefined ? timesheetData.description : timesheet.description,
                        totalHoursWorked: (timesheetData.mondayHours !== undefined ? timesheetData.mondayHours : timesheet.mondayHours || 0) +
                                        (timesheetData.tuesdayHours !== undefined ? timesheetData.tuesdayHours : timesheet.tuesdayHours || 0) +
                                        (timesheetData.wednesdayHours !== undefined ? timesheetData.wednesdayHours : timesheet.wednesdayHours || 0) +
                                        (timesheetData.thursdayHours !== undefined ? timesheetData.thursdayHours : timesheet.thursdayHours || 0) +
                                        (timesheetData.fridayHours !== undefined ? timesheetData.fridayHours : timesheet.fridayHours || 0) +
                                        (timesheetData.saturdayHours !== undefined ? timesheetData.saturdayHours : timesheet.saturdayHours || 0) +
                                        (timesheetData.sundayHours !== undefined ? timesheetData.sundayHours : timesheet.sundayHours || 0)
                    });

                } else {
                    // Create new timesheet
                    console.log(`📝 Creating new timesheet for project: ${timesheetData.projectId}, task: ${timesheetData.taskId}`);
                    
                    // Validate required fields
                    if (!timesheetData.projectId || !timesheetData.taskId || !timesheetData.weekStartDate) {
                        throw new Error('Missing required fields: projectId, taskId, and weekStartDate are required');
                    }

                    // Check for existing timesheet with same project+task+week
                    const existingTimesheet = await Timesheet.findOne({
                        where: {
                            employeeId: req.employeeId,
                            projectId: timesheetData.projectId,
                            taskId: timesheetData.taskId,
                            weekStartDate: new Date(timesheetData.weekStartDate),
                            deletedAt: null
                        }
                    });

                    if (existingTimesheet) {
                        throw new Error(`A timesheet already exists for this project and task combination for this week`);
                    }

                    // Calculate week details
                    const weekStart = new Date(timesheetData.weekStartDate);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    
                    const totalHours = (timesheetData.mondayHours || 0) +
                                     (timesheetData.tuesdayHours || 0) +
                                     (timesheetData.wednesdayHours || 0) +
                                     (timesheetData.thursdayHours || 0) +
                                     (timesheetData.fridayHours || 0) +
                                     (timesheetData.saturdayHours || 0) +
                                     (timesheetData.sundayHours || 0);

                    const createData = {
                        employeeId: req.employeeId,
                        projectId: timesheetData.projectId,
                        taskId: timesheetData.taskId,
                        weekStartDate: weekStart,
                        weekEndDate: weekEnd,
                        weekNumber: getWeekNumber(weekStart),
                        year: weekStart.getFullYear(),
                        mondayHours: timesheetData.mondayHours || 0,
                        tuesdayHours: timesheetData.tuesdayHours || 0,
                        wednesdayHours: timesheetData.wednesdayHours || 0,
                        thursdayHours: timesheetData.thursdayHours || 0,
                        fridayHours: timesheetData.fridayHours || 0,
                        saturdayHours: timesheetData.saturdayHours || 0,
                        sundayHours: timesheetData.sundayHours || 0,
                        description: timesheetData.description || '',
                        totalHoursWorked: totalHours,
                        status: 'Draft'
                    };
                    
                    console.log('📝 About to create timesheet with data:', JSON.stringify(createData, null, 2));
                    
                    try {
                        timesheet = await Timesheet.create(createData, { transaction });
                        console.log('✅ Timesheet created successfully:', timesheet.id);
                    } catch (createError) {
                        console.log('❌ Sequelize create error:', createError.name);
                        console.log('❌ Error message:', createError.message);
                        console.log('❌ Error stack:', createError.stack);
                        if (createError.errors) {
                            console.log('❌ Validation errors:', JSON.stringify(createError.errors, null, 2));
                        }
                        throw createError;
                    }

                    // Fetch with includes for response (must use same transaction)
                    timesheet = await Timesheet.findByPk(timesheet.id, {
                        include: [
                            { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName'] },
                            { model: Project, as: 'project', attributes: ['id', 'name'], paranoid: false },
                            { model: Task, as: 'task', attributes: ['id', 'name'], paranoid: false }
                        ],
                        transaction
                    });
                    
                    if (!timesheet) {
                        throw new Error('Failed to reload created timesheet with associations');
                    }
                }

                console.log(`✅ Successfully ${isUpdate ? 'updated' : 'created'} timesheet ${timesheet.id}`);
                results.push({
                    timesheetId: timesheet.id,
                    status: 'success',
                    message: `Timesheet ${isUpdate ? 'updated' : 'created'} successfully`,
                    operation: operation.toLowerCase(),
                    details: {
                        employee: `${timesheet.employee?.firstName} ${timesheet.employee?.lastName}`,
                        project: timesheet.project?.name,
                        task: timesheet.task?.name,
                        week: `${timesheet.weekStartDate} to ${timesheet.weekEndDate}`,
                        totalHours: timesheet.totalHoursWorked,
                        status: timesheet.status
                    }
                });

            } catch (timesheetError) {
                console.log(`❌ Error processing timesheet ${i + 1}:`, timesheetError.message);
                console.log(`❌ Error name:`, timesheetError.name);
                if (timesheetError.errors) {
                    console.log(`❌ Validation errors:`, timesheetError.errors.map(e => ({
                        field: e.path,
                        message: e.message,
                        value: e.value,
                        type: e.type
                    })));
                }
                errors.push({
                    index: i,
                    error: timesheetError.message,
                    errorName: timesheetError.name,
                    validationErrors: timesheetError.errors?.map(e => ({
                        field: e.path,
                        message: e.message
                    })),
                    data: timesheetData
                });
            }
        }

        console.log(`\n📊 BULK ${operation} SUMMARY:`);
        console.log(`   ✅ Successfully processed: ${results.length}`);
        console.log(`   ❌ Failed: ${errors.length}`);
        console.log(`   📈 Success rate: ${((results.length / sanitizedTimesheets.length) * 100).toFixed(1)}%`);

        // Commit transaction if all operations succeeded
        if (errors.length === 0) {
            await transaction.commit();
            console.log('✅ Transaction committed successfully');
            
            return res.json({
                success: true,
                message: `Successfully ${isUpdate ? 'updated' : 'created'} ${results.length} timesheet(s)`,
                data: {
                    processed: results,
                    summary: {
                        total: sanitizedTimesheets.length,
                        successful: results.length,
                        failed: errors.length,
                        operation: operation.toLowerCase()
                    }
                }
            });
        } else if (results.length === 0) {
            // All failed - rollback transaction
            await transaction.rollback();
            console.log('❌ All operations failed - transaction rolled back');
            
            return res.status(400).json({
                success: false,
                message: `No timesheets could be ${isUpdate ? 'updated' : 'created'}`,
                errors,
                data: {
                    processed: results,
                    summary: {
                        total: sanitizedTimesheets.length,
                        successful: results.length,
                        failed: errors.length,
                        operation: operation.toLowerCase()
                    }
                }
            });
        } else {
            // Partial success - rollback transaction to maintain consistency
            await transaction.rollback();
            console.log('⚠️  Partial success - transaction rolled back to maintain consistency');
            
            return res.status(207).json({ // 207 Multi-Status
                success: false,
                message: `Partially successful but rolled back: ${results.length} would succeed, ${errors.length} failed. All or nothing policy.`,
                errors,
                data: {
                    processed: results,
                    summary: {
                        total: sanitizedTimesheets.length,
                        successful: results.length,
                        failed: errors.length,
                        operation: operation.toLowerCase()
                    }
                },
                hint: 'Fix the errors and retry the entire batch. Transactions ensure all-or-nothing operation.'
            });
        }

    } catch (error) {
        // Rollback transaction on any error
        await transaction.rollback();
        console.error(`💥 Bulk ${isUpdate ? 'Update' : 'Create'} Timesheets Error (transaction rolled back):`, error);
        return res.status(500).json({
            success: false,
            message: `Failed to process bulk timesheet ${isUpdate ? 'update' : 'creation'}. All changes have been rolled back.`,
            error: error.message
        });
    }
}

module.exports = router;
