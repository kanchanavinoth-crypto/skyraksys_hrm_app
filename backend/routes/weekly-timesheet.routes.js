const express = require('express');
const { Op } = require('sequelize');
const { authenticateToken, authorize, isManagerOrAbove } = require('../middleware/auth.simple');
const { weeklyTimesheetSchema, getWeekStart, getWeekEnd, getWeekNumber } = require('../middleware/weekly-timesheet-validation');
const db = require('../models');

const Timesheet = db.Timesheet;
const Employee = db.Employee;
const Project = db.Project;
const Task = db.Task;
const router = express.Router();

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
        // Validate request body
        const { error, value } = weeklyTimesheetSchema.create.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: error.details 
            });
        }

        const employeeId = req.employeeId;
        const weekStart = new Date(value.weekStartDate);
        const weekEnd = getWeekEnd(weekStart);
        const weekNum = getWeekNumber(weekStart);
        const year = weekStart.getFullYear();

        // Check if timesheet already exists for this specific employee, week, project, and task combination
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
            return res.status(400).json({ 
                success: false, 
                message: 'A timesheet already exists for this specific project and task combination for this week. Please edit the existing timesheet.',
                details: {
                    existingTimesheetId: existingTimesheet.id,
                    projectId: value.projectId,
                    taskId: value.taskId,
                    status: existingTimesheet.status
                }
            });
        }

        // Validate project and task exist
        const project = await Project.findByPk(value.projectId);
        if (!project) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project selected.' 
            });
        }

        const task = await Task.findByPk(value.taskId);
        if (!task) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid task selected.' 
            });
        }

        // Create new weekly timesheet
        const newTimesheet = await Timesheet.create({
            ...value,
            employeeId,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            weekNumber: weekNum,
            year,
            status: 'Draft'
        });

        // Fetch with includes for response
        const createdTimesheet = await Timesheet.findByPk(newTimesheet.id, {
            include: ['employee', 'project', 'task']
        });

        res.status(201).json({ 
            success: true, 
            message: 'Weekly timesheet created successfully as draft.', 
            data: createdTimesheet 
        });
    } catch (error) {
        console.error('Create Weekly Timesheet Error:', error);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                success: false, 
                message: 'A timesheet already exists for this week.' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create weekly timesheet.' 
        });
    }
});

// PUT update weekly timesheet
router.put('/:id', async (req, res) => {
    try {
        const { error, value } = weeklyTimesheetSchema.update.validate(req.body);
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
        const timesheet = await Timesheet.findByPk(req.params.id);
        if (!timesheet) {
            return res.status(404).json({ 
                success: false, 
                message: 'Weekly timesheet not found.' 
            });
        }

        // Only employee can submit their own timesheet
        if (timesheet.employeeId !== req.employeeId) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only submit your own timesheets.' 
            });
        }

        // Can only submit draft timesheets
        if (timesheet.status !== 'Draft') {
            return res.status(400).json({ 
                success: false, 
                message: 'Only draft timesheets can be submitted.' 
            });
        }

        // Validate minimum hours
        if (timesheet.totalHoursWorked <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot submit timesheet with zero hours.' 
            });
        }

        // Update status to submitted
        await timesheet.update({
            status: 'Submitted',
            submittedAt: new Date()
        });

        res.json({ 
            success: true, 
            message: 'Weekly timesheet submitted for approval successfully.' 
        });
    } catch (error) {
        console.error('Submit Weekly Timesheet Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit weekly timesheet.' 
        });
    }
});

// PUT approve/reject weekly timesheet (managers, admin, hr)
router.put('/:id/approve', authorize(['manager', 'admin', 'hr']), async (req, res) => {
    try {
        const { error, value } = weeklyTimesheetSchema.approve.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: error.details 
            });
        }

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
        if (!timesheet.canBeApprovedBy(req.userRole, req.userId, req.employeeId, employee.managerId)) {
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

module.exports = router;
