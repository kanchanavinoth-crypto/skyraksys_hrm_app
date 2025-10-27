const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken, requireEmployeeRecord, authorize, isManagerOrAbove } = require('../middleware/auth.simple');
const { validate, timesheetSchema } = require('../middleware/validation');
const TaskValidator = require('../utils/TaskValidator');
const { sanitizeTimesheetData, sanitizeBulkTimesheetData } = require('../utils/sanitizer');
const { bulkOperationLimiter } = require('../middleware/rateLimiter');
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
    
    // Log to console with enhanced formatting
    console.log(`\n🔔 === SUBMISSION TRACKING LOG [${type.toUpperCase()}] ===`);
    console.log(`⏰ Timestamp: ${timestamp}`);
    Object.keys(data).forEach(key => {
        console.log(`📝 ${key}: ${typeof data[key] === 'object' ? JSON.stringify(data[key], null, 2) : data[key]}`);
    });
    console.log(`🔔 === END SUBMISSION TRACKING LOG ===\n`);
    
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
        console.error('⚠️  Failed to write to submission log file:', error.message);
    }
}

const Timesheet = db.Timesheet;
const Employee = db.Employee;
const Project = db.Project;
const Task = db.Task;

// Helper function for bulk submission logic (extracted for reuse)
async function handleBulkSubmission(req, res) {
    try {
        console.log('🔄 === BULK TIMESHEET SUBMISSION START ===');
        console.log('📝 Request Details:');
        console.log('   Employee ID:', req.employeeId);
        console.log('   Request body:', JSON.stringify(req.body, null, 2));
        console.log('   Timestamp:', new Date().toISOString());
        
        const { timesheetIds } = req.body;

        if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
            console.log('❌ Invalid timesheet IDs provided');
            return res.status(400).json({
                success: false,
                message: 'Invalid timesheet IDs. Please provide an array of timesheet IDs.'
            });
        }

        console.log(`📋 Processing ${timesheetIds.length} timesheets for bulk submission`);
        
        const results = [];
        const errors = [];

        // Process each timesheet individually with detailed logging
        for (let i = 0; i < timesheetIds.length; i++) {
            const timesheetId = timesheetIds[i];
            console.log(`\n🔍 Processing timesheet ${i + 1}/${timesheetIds.length}: ${timesheetId}`);
            
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
                    console.log(`❌ Timesheet not found: ${timesheetId}`);
                    errors.push({
                        timesheetId,
                        error: 'Timesheet not found'
                    });
                    continue;
                }

                console.log(`📊 Timesheet details:`);
                console.log(`   Employee: ${timesheet.employee?.firstName} ${timesheet.employee?.lastName}`);
                console.log(`   Project: ${timesheet.project?.name}`);
                console.log(`   Task: ${timesheet.task?.name}`);
                console.log(`   Week: ${timesheet.weekStartDate} to ${timesheet.weekEndDate}`);
                console.log(`   Current Status: ${timesheet.status}`);
                console.log(`   Total Hours: ${timesheet.totalHoursWorked}`);

                // Verify ownership
                if (timesheet.employeeId !== req.employeeId) {
                    console.log(`❌ Ownership check failed - timesheet belongs to different employee`);
                    errors.push({
                        timesheetId,
                        error: 'You can only submit your own timesheets'
                    });
                    continue;
                }

                // Check if timesheet can be submitted
                if (timesheet.status !== 'Draft') {
                    console.log(`❌ Status check failed - current status: ${timesheet.status}`);
                    errors.push({
                        timesheetId,
                        error: `Cannot submit timesheet with status: ${timesheet.status}. Only draft timesheets can be submitted.`
                    });
                    continue;
                }

                // Check for zero hours
                if (parseFloat(timesheet.totalHoursWorked) === 0) {
                    console.log(`⚠️  Warning: Submitting timesheet with zero hours`);
                }

                // Update timesheet status
                console.log(`✅ Submitting timesheet ${timesheetId}...`);
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

                console.log(`✅ Successfully submitted timesheet ${timesheetId}`);
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
                console.log(`❌ Error processing timesheet ${timesheetId}:`, timesheetError.message);
                errors.push({
                    timesheetId,
                    error: timesheetError.message
                });
            }
        }

        console.log('\n📊 BULK SUBMISSION SUMMARY:');
        console.log(`   ✅ Successfully submitted: ${results.length}`);
        console.log(`   ❌ Failed submissions: ${errors.length}`);
        console.log(`   📈 Success rate: ${((results.length / timesheetIds.length) * 100).toFixed(1)}%`);

        if (results.length > 0) {
            console.log('\n✅ Successful submissions:');
            results.forEach((result, index) => {
                console.log(`   ${index + 1}. ${result.details.employee} - ${result.details.project}/${result.details.task} (${result.details.totalHours}h)`);
            });
        }

        if (errors.length > 0) {
            console.log('\n❌ Failed submissions:');
            errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.timesheetId}: ${error.error}`);
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

        console.log('🔄 === BULK TIMESHEET SUBMISSION END ===\n');

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
        console.error('💥 Bulk Submit Timesheets Error:', error);
        console.log('🔄 === BULK TIMESHEET SUBMISSION END (ERROR) ===\n');
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
function validateTaskAccess(task, employeeId, context = 'operation') {
  if (!task) {
    return { 
      allowed: false, 
      message: 'Task not found or invalid.' 
    };
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

// GET all weekly timesheets with role-based filtering
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            employeeId, 
            projectId, 
            year, 
            weekNumber,
            startDate,
            sortBy = 'weekStartDate', 
            sortOrder = 'DESC' 
        } = req.query;
        
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

        // Additional filters
        if (status) where.status = status;
        if (projectId) where.projectId = projectId;
        if (year) where.year = parseInt(year);
        if (weekNumber) where.weekNumber = parseInt(weekNumber);
        
        // Handle startDate parameter for weekly filtering
        if (startDate) {
            console.log('🔍 Filtering timesheets by startDate:', startDate);
            where.weekStartDate = startDate;
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
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            success: true,
            data: timesheets,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get Weekly Timesheets Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch weekly timesheets.' 
        });
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
router.post('/bulk-submit', async (req, res) => {
    return await handleBulkSubmission(req, res);
});

// POST bulk approve timesheets (managers, admin, hr)
router.post('/bulk-approve', authorize(['manager', 'admin', 'hr']), async (req, res) => {
    try {
        const { timesheetIds, approverComments = '' } = req.body;
        
        // Validate input
        if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of timesheet IDs to approve.'
            });
        }

        console.log(`🔄 === BULK APPROVAL START ===`);
        console.log(`📝 Approving ${timesheetIds.length} timesheets by user ${req.userId}`);
        console.log(`📝 Timesheet IDs: ${timesheetIds.join(', ')}`);
        console.log(`📝 Comments: ${approverComments}`);

        const results = [];
        const errors = [];

        // Process each timesheet
        for (const timesheetId of timesheetIds) {
            try {
                const timesheet = await Timesheet.findByPk(timesheetId, {
                    include: [{ model: Employee, as: 'employee' }]
                });

                if (!timesheet) {
                    errors.push({
                        timesheetId,
                        error: 'Timesheet not found'
                    });
                    continue;
                }

                // Check approval permissions
                const employee = await Employee.findByPk(timesheet.employeeId);
                if (!timesheet.canBeApprovedBy(req.userRole, req.userId, req.employeeId, employee.managerId)) {
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

                console.log(`✅ Approved timesheet ${timesheetId}`);

            } catch (error) {
                console.error(`❌ Error approving timesheet ${timesheetId}:`, error);
                errors.push({
                    timesheetId,
                    error: error.message
                });
            }
        }

        console.log(`🔄 === BULK APPROVAL END ===`);
        console.log(`✅ Successful: ${results.length}, ❌ Failed: ${errors.length}`);

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
        console.error('Bulk Approval Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process bulk approval.'
        });
    }
});

// POST bulk reject timesheets (managers, admin, hr)
router.post('/bulk-reject', bulkOperationLimiter, authorize(['manager', 'admin', 'hr']), async (req, res) => {
    try {
        const { timesheetIds, approverComments = '' } = req.body;
        
        // Validate input
        if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of timesheet IDs to reject.'
            });
        }

        if (!approverComments.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required for bulk rejection.'
            });
        }

        console.log(`🔄 === BULK REJECTION START ===`);
        console.log(`📝 Rejecting ${timesheetIds.length} timesheets by user ${req.userId}`);
        console.log(`📝 Timesheet IDs: ${timesheetIds.join(', ')}`);
        console.log(`📝 Rejection reason: ${approverComments}`);

        const results = [];
        const errors = [];

        // Process each timesheet
        for (const timesheetId of timesheetIds) {
            try {
                const timesheet = await Timesheet.findByPk(timesheetId, {
                    include: [{ model: Employee, as: 'employee' }]
                });

                if (!timesheet) {
                    errors.push({
                        timesheetId,
                        error: 'Timesheet not found'
                    });
                    continue;
                }

                // Check approval permissions
                const employee = await Employee.findByPk(timesheet.employeeId);
                if (!timesheet.canBeApprovedBy(req.userRole, req.userId, req.employeeId, employee.managerId)) {
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

                console.log(`❌ Rejected timesheet ${timesheetId}`);

            } catch (error) {
                console.error(`❌ Error rejecting timesheet ${timesheetId}:`, error);
                errors.push({
                    timesheetId,
                    error: error.message
                });
            }
        }

        console.log(`🔄 === BULK REJECTION END ===`);
        console.log(`✅ Successful: ${results.length}, ❌ Failed: ${errors.length}`);

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
        console.error('Bulk Rejection Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process bulk rejection.'
        });
    }
});

// ===== INDIVIDUAL OPERATIONS (parameterized routes) =====

// GET specific weekly timesheet by ID
router.get('/:id', async (req, res) => {
    try {
        const timesheet = await Timesheet.findByPk(req.params.id, {
            include: ['employee', 'project', 'task', 'approver']
        });

        if (!timesheet) {
            return res.status(404).json({ 
                success: false, 
                message: 'Weekly timesheet not found.' 
            });
        }

        // Check access permissions
        if (req.userRole === 'employee' && timesheet.employeeId !== req.employeeId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied.' 
            });
        }

        if (req.userRole === 'manager') {
            const isSubordinate = await Employee.findOne({ 
                where: { id: timesheet.employeeId, managerId: req.employeeId } 
            });
            if (!isSubordinate && timesheet.employeeId !== req.employeeId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied.' 
                });
            }
        }

        res.json({ success: true, data: timesheet });
    } catch (error) {
        console.error('Get Weekly Timesheet Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch weekly timesheet.' 
        });
    }
});

// POST create new weekly timesheet
router.post('/', async (req, res) => {
    try {
        // Enhanced request body logging for debugging
        console.log('🔄 === TIMESHEET CREATION REQUEST START ===');
        console.log('📝 Request Details:');
        console.log('   Request body:', JSON.stringify(req.body, null, 2));
        console.log('   Content-Type:', req.headers['content-type']);
        console.log('   User ID:', req.userId);
        console.log('   Employee ID:', req.employeeId);
        console.log('   Timestamp:', new Date().toISOString());
        console.log('   Request #:', Math.random().toString(36).substr(2, 9)); // Random ID for tracking
        console.log('============================================');

        // Pre-validation checks for common issues
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Request body is empty. Please provide timesheet data.',
                hint: 'Make sure you are sending JSON data with Content-Type: application/json'
            });
        }

        // Check for old daily format vs new weekly format BEFORE Joi validation
        if (req.body.workDate && req.body.hoursWorked) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid data format: This endpoint expects weekly timesheet data, not daily entries.',
                details: {
                    receivedFormat: 'Daily format (workDate, hoursWorked)',
                    expectedFormat: 'Weekly format (weekStartDate, mondayHours, tuesdayHours, etc.)',
                    example: {
                        projectId: 'uuid-string',
                        taskId: 'uuid-string',
                        weekStartDate: '2024-01-01', // Must be a Monday
                        mondayHours: 8,
                        tuesdayHours: 8,
                        wednesdayHours: 8,
                        thursdayHours: 8,
                        fridayHours: 8,
                        saturdayHours: 0,
                        sundayHours: 0,
                        description: 'Work description (optional)'
                    }
                },
                hint: 'Please use the weekly timesheet format or contact support for API migration assistance.'
            });
        }

        // Validate request body with enhanced error messages
        const { error, value } = timesheetSchema.create.validate(req.body, { 
            abortEarly: false, // Get all validation errors, not just the first one
            allowUnknown: false // Reject unknown fields
        });
        
        if (error) {
            const detailedErrors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                received: detail.context?.value,
                type: detail.type
            }));

            return res.status(400).json({ 
                success: false, 
                message: 'Timesheet validation failed. Please check the required fields and data format.',
                errors: detailedErrors,
                validationGuide: {
                    requiredFields: ['projectId', 'taskId', 'weekStartDate'],
                    optionalFields: ['mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours', 'fridayHours', 'saturdayHours', 'sundayHours', 'description'],
                    fieldTypes: {
                        projectId: 'UUID string',
                        taskId: 'UUID string', 
                        weekStartDate: 'ISO date string (must be a Monday)',
                        hours: 'Number between 0 and 24',
                        description: 'String (max 500 characters)'
                    }
                },
                receivedData: req.body
            });
        }

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
                    received: sanitizedData.weekStartDate,
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
                projectId: sanitizedData.projectId,
                taskId: sanitizedData.taskId,
                deletedAt: null
            }
        });

        if (existingTimesheet) {
            // If existing timesheet is Draft, allow update instead of creating new one
            if (existingTimesheet.status === 'Draft') {
                console.log(`📝 Found existing Draft timesheet (${existingTimesheet.id}). Updating instead of creating new one.`);
                
                // Update the existing draft timesheet
                const totalHours = (sanitizedData.mondayHours || 0) +
                                 (sanitizedData.tuesdayHours || 0) +
                                 (sanitizedData.wednesdayHours || 0) +
                                 (sanitizedData.thursdayHours || 0) +
                                 (sanitizedData.fridayHours || 0) +
                                 (sanitizedData.saturdayHours || 0) +
                                 (sanitizedData.sundayHours || 0);
                
                await existingTimesheet.update({
                    mondayHours: sanitizedData.mondayHours || 0,
                    tuesdayHours: sanitizedData.tuesdayHours || 0,
                    wednesdayHours: sanitizedData.wednesdayHours || 0,
                    thursdayHours: sanitizedData.thursdayHours || 0,
                    fridayHours: sanitizedData.fridayHours || 0,
                    saturdayHours: sanitizedData.saturdayHours || 0,
                    sundayHours: sanitizedData.sundayHours || 0,
                    description: sanitizedData.description || '',
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
            console.log(`📋 Adding additional task for week ${weekStart.toISOString().split('T')[0]} (total tasks for week will be: ${weekTimesheetCount + 1})`);
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
            console.log('Warning: Timesheet created with zero hours');
        }

        // Warn if excessive hours
        if (totalHours > 60) {
            console.log(`Warning: High total hours (${totalHours}) for employee ${employeeId}`);
        }

        // Create new weekly timesheet with comprehensive logging
        console.log('📊 Creating timesheet with data:');
        console.log('   Employee ID:', employeeId);
        console.log('   Project ID:', value.projectId);
        console.log('   Task ID:', value.taskId);
        console.log('   Week:', weekStart.toISOString().split('T')[0], 'to', weekEnd.toISOString().split('T')[0]);
        console.log('   Week Number:', weekNum, 'Year:', year);
        console.log('   Total Hours:', totalHours);
        console.log('   Daily Hours:', dailyHours);

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

        console.log('✅ Timesheet created successfully:');
        console.log('   ID:', createdTimesheet.id);
        console.log('   Status:', createdTimesheet.status);
        console.log('   Total Hours:', createdTimesheet.totalHoursWorked);
        console.log('   Project:', createdTimesheet.project?.name);
        console.log('   Task:', createdTimesheet.task?.name);
        console.log('   Employee:', createdTimesheet.employee?.firstName, createdTimesheet.employee?.lastName);
        
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
        
        console.log('🔄 === TIMESHEET CREATION REQUEST END ===\n');

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
        console.error('Create Weekly Timesheet Error:', error);
        console.error('Stack trace:', error.stack);
        console.error('Request data that caused error:', JSON.stringify(req.body, null, 2));
        
        // Handle specific database errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                success: false, 
                message: 'A timesheet already exists for this week.',
                details: {
                    constraint: 'unique_employee_week_timesheet',
                    conflictingFields: ['employeeId', 'weekStartDate', 'year']
                },
                hint: 'Please edit the existing timesheet instead of creating a new one.'
            });
        }
        
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ 
                success: false, 
                message: 'Database validation failed.',
                details: {
                    validationErrors: error.errors.map(err => ({
                        field: err.path,
                        message: err.message,
                        value: err.value
                    }))
                },
                hint: 'Please check the data format and constraints.'
            });
        }

        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid reference: One or more IDs do not exist.',
                details: {
                    table: error.table,
                    field: error.fields,
                    error: 'Foreign key constraint violation'
                },
                hint: 'Please ensure all project, task, and employee IDs are valid and exist in the system.'
            });
        }
        
        // Generic server error with helpful message
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create weekly timesheet due to an internal server error.',
            details: {
                errorType: error.name || 'Unknown',
                timestamp: new Date().toISOString()
            },
            hint: 'Please try again. If the problem persists, contact technical support with the timestamp above.',
            supportInfo: {
                whatToInclude: [
                    'The exact error message',
                    'The data you were trying to submit',
                    'The timestamp from this error',
                    'Steps to reproduce the issue'
                ]
            }
        });
    }
});

// PUT update weekly timesheet
router.put('/:id', async (req, res) => {
    try {
        const { error, value } = timesheetSchema.update.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: error.details 
            });
        }

        const timesheet = await Timesheet.findByPk(req.params.id);
        if (!timesheet) {
            return res.status(404).json({ 
                success: false, 
                message: 'Weekly timesheet not found.' 
            });
        }

        // Check edit permissions
        if (!timesheet.canBeEditedBy(req.userRole, req.userId, req.employeeId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only edit draft or rejected timesheets.' 
            });
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
            const taskAccess = validateTaskAccess(task, req.employeeId, 'timesheet update');
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
        console.error('Update Weekly Timesheet Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update weekly timesheet.' 
        });
    }
});

// PUT submit weekly timesheet for approval
router.put('/:id/submit', async (req, res) => {
    try {
        console.log('🔄 === INDIVIDUAL TIMESHEET SUBMISSION START ===');
        console.log('📝 Request Details:');
        console.log('   Timesheet ID:', req.params.id);
        console.log('   User ID:', req.userId);
        console.log('   Employee ID:', req.employeeId);
        console.log('   Timestamp:', new Date().toISOString());
        
        const timesheet = await Timesheet.findByPk(req.params.id, {
            include: [
                { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName'] },
                { model: Project, as: 'project', attributes: ['id', 'name'], paranoid: false },
                { model: Task, as: 'task', attributes: ['id', 'name'], paranoid: false }
            ]
        });
        
        if (!timesheet) {
            console.log('❌ Timesheet not found:', req.params.id);
            return res.status(404).json({ 
                success: false, 
                message: 'Weekly timesheet not found.' 
            });
        }

        console.log('📊 Timesheet details:');
        console.log('   Employee:', timesheet.employee?.firstName, timesheet.employee?.lastName);
        console.log('   Project:', timesheet.project?.name);
        console.log('   Task:', timesheet.task?.name);
        console.log('   Week:', timesheet.weekStartDate, 'to', timesheet.weekEndDate);
        console.log('   Current Status:', timesheet.status);
        console.log('   Total Hours:', timesheet.totalHoursWorked);

        // Only employee can submit their own timesheet
        if (timesheet.employeeId !== req.employeeId) {
            console.log('❌ Ownership check failed - different employee');
            return res.status(403).json({ 
                success: false, 
                message: 'You can only submit your own timesheets.' 
            });
        }

        // Can only submit draft timesheets
        if (timesheet.status !== 'Draft') {
            console.log('❌ Status check failed - current status:', timesheet.status);
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
            console.log('🔄 Multiple tasks detected for week - auto-triggering bulk submission');
            console.log('   Found', weekTimesheets.length, 'tasks for week', timesheet.weekStartDate);
            
            // Get all draft timesheets for this week
            const draftTimesheets = weekTimesheets.filter(ts => ts.status === 'Draft');
            
            if (draftTimesheets.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No draft timesheets found to submit for this week.' 
                });
            }
            
            console.log('📝 Auto-submitting', draftTimesheets.length, 'draft timesheets via bulk submission');
            
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
            console.log('❌ Task not found:', timesheet.taskId);
            return res.status(400).json({ 
                success: false, 
                message: 'The task associated with this timesheet no longer exists.' 
            });
        }

        // Validate task access using enhanced validation helper
        const taskAccess = validateTaskAccess(task, req.employeeId, 'timesheet submission');
        if (!taskAccess.allowed) {
            console.log('❌ Task access denied:', taskAccess.message);
            return res.status(403).json({ 
                success: false, 
                message: taskAccess.message 
            });
        }

        // Validate minimum hours
        if (timesheet.totalHoursWorked <= 0) {
            console.log('❌ Zero hours validation failed');
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot submit timesheet with zero hours.' 
            });
        }

        // Update status to submitted
        console.log('✅ Submitting timesheet...');
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

        console.log('✅ Timesheet submitted successfully:', req.params.id);
        console.log('🔄 === INDIVIDUAL TIMESHEET SUBMISSION END ===\n');

        res.json({ 
            success: true, 
            message: 'Weekly timesheet submitted for approval successfully.' 
        });
    } catch (error) {
        console.error('💥 Submit Weekly Timesheet Error:', error);
        console.log('🔄 === INDIVIDUAL TIMESHEET SUBMISSION END (ERROR) ===\n');
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit weekly timesheet.' 
        });
    }
});

// PUT approve/reject weekly timesheet (managers, admin, hr)
router.put('/:id/approve', authorize(['manager', 'admin', 'hr']), async (req, res) => {
    try {
        console.log('\n📋 APPROVAL REQUEST DATA:');
        console.log('Request Body:', req.body);
        
        const { error, value } = timesheetSchema.updateStatus.validate(req.body);
        if (error) {
            console.log('❌ Validation Error:', error.details);
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: error.details 
            });
        }
        
        console.log('✅ Validation Passed:', value);

        const timesheet = await Timesheet.findByPk(req.params.id, {
            include: [{ model: Employee, as: 'employee' }]
        });
        
        if (!timesheet) {
            return res.status(404).json({ 
                success: false, 
                message: 'Weekly timesheet not found.' 
            });
        }

        // Check approval permissions
        const employee = await Employee.findByPk(timesheet.employeeId);
        
        // Debug permission check
        console.log('\n🔐 PERMISSION DEBUG - Individual Approval:');
        console.log('User Role:', req.userRole);
        console.log('User ID:', req.userId);
        console.log('User Employee ID:', req.employeeId);
        console.log('Timesheet Employee ID:', timesheet.employeeId);
        console.log('Timesheet Employee Manager ID:', employee.managerId);
        console.log('Timesheet Status:', timesheet.status);
        
        const canApprove = timesheet.canBeApprovedBy(req.userRole, req.userId, req.employeeId, employee.managerId);
        console.log('canBeApprovedBy() result:', canApprove);
        
        if (!canApprove) {
            console.log('❌ Permission denied for individual approval');
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
            approverComments: value.approverComments || '',
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
        console.error('Approve Weekly Timesheet Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process timesheet approval.' 
        });
    }
});

// DELETE weekly timesheet (admin only)
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
        console.error('Delete Weekly Timesheet Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete weekly timesheet.' 
        });
    }
});

// GET weekly timesheets for approval (managers, admin, hr)
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
        console.error('Get Pending Approvals Error:', error);
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
        console.error('Get Timesheet Stats Error:', error);
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
        console.log(`🔄 === BULK TIMESHEET ${operation} START (Transaction ID: ${transaction.id}) ===`);
        console.log('📝 Request Details:');
        console.log('   Employee ID:', req.employeeId);
        console.log('   Operation:', operation);
        console.log('   Request body:', JSON.stringify(req.body, null, 2));
        console.log('   Timestamp:', new Date().toISOString());
        
        const { timesheets } = req.body;

        if (!timesheets || !Array.isArray(timesheets) || timesheets.length === 0) {
            console.log('❌ Invalid timesheets data provided');
            return res.status(400).json({
                success: false,
                message: `Invalid timesheets data. Please provide an array of timesheet objects.`
            });
        }

        console.log(`📋 Processing ${timesheets.length} timesheets for bulk ${operation.toLowerCase()}`);
        
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

                    // Fetch with includes for response
                    timesheet = await Timesheet.findByPk(timesheet.id, {
                        include: [
                            { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName'] },
                            { model: Project, as: 'project', attributes: ['id', 'name'], paranoid: false },
                            { model: Task, as: 'task', attributes: ['id', 'name'], paranoid: false }
                        ]
                    });
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
