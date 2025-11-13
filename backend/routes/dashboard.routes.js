const express = require('express');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { authenticateToken, isAdminOrHR } = require('../middleware/auth.simple');
const LogHelper = require('../utils/logHelper');
const { logger } = require('../config/logger');
const db = require('../models');

const router = express.Router();

// Employee dashboard stats (any authenticated user can access their own data)
router.get('/employee-stats', authenticateToken, async (req, res) => {
    try {
        const employeeId = req.employeeId;
        
        // Get current month and year
        const currentMonthStart = dayjs().startOf('month').toDate();
        const currentYearStart = dayjs().startOf('year').toDate();

        // Leave Balance - get from leave_balances table
        const leaveBalances = await db.LeaveBalance.findAll({
            where: { 
                employeeId,
                year: dayjs().year()
            },
            include: [{
                model: db.LeaveType,
                as: 'leaveType',
                attributes: ['name']
            }]
        });

        // Pending leave requests
        const pendingLeaves = await db.LeaveRequest.count({
            where: {
                employeeId,
                status: 'Pending'
            }
        });

        // Pending timesheets (Draft status)
        const pendingTimesheets = await db.Timesheet.count({
            where: {
                employeeId,
                status: 'Draft'
            }
        });

        // Current month timesheet stats
        const currentMonthTimesheets = await db.Timesheet.findAll({
            where: {
                employeeId,
                weekStartDate: {
                    [Op.gte]: currentMonthStart,
                    [Op.lt]: dayjs().endOf('month').toDate()
                }
            },
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('totalHoursWorked')), 'totalHours'],
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalDays']
            ],
            raw: true
        });

        // Recent activity (last 5 activities)
        const recentLeaves = await db.LeaveRequest.findAll({
            where: { employeeId },
            order: [['updatedAt', 'DESC']],
            limit: 3,
            include: [{
                model: db.LeaveType,
                as: 'leaveType',
                attributes: ['name']
            }]
        });

        const recentTimesheets = await db.Timesheet.findAll({
            where: { employeeId },
            order: [['updatedAt', 'DESC']],
            limit: 2,
            include: [{
                model: db.Project,
                as: 'project',
                attributes: ['name']
            }]
        });

        // Upcoming approved leaves
        const upcomingLeaves = await db.LeaveRequest.findAll({
            where: {
                employeeId,
                status: 'Approved',
                startDate: { [Op.gte]: new Date() }
            },
            order: [['startDate', 'ASC']],
            limit: 3,
            include: [{
                model: db.LeaveType,
                as: 'leaveType',
                attributes: ['name']
            }]
        });

        // Format leave balance data
        const formattedLeaveBalance = {};
        leaveBalances.forEach(balance => {
            const leaveTypeName = balance.leaveType?.name || 'Unknown';
            formattedLeaveBalance[leaveTypeName.toLowerCase()] = {
                remaining: balance.balance || 0,
                total: balance.totalAccrued || 0,
                used: (balance.totalAccrued || 0) - (balance.balance || 0)
            };
        });

        // Calculate working hours for current month
        const totalHours = parseFloat(currentMonthTimesheets[0]?.totalHours || 0);
        const daysWorked = parseInt(currentMonthTimesheets[0]?.totalDays || 0);
        const expectedHours = daysWorked * 8; // Assuming 8 hours per day

        res.json({
            success: true,
            data: {
                leaveBalance: formattedLeaveBalance,
                pendingRequests: {
                    leaves: pendingLeaves,
                    timesheets: pendingTimesheets
                },
                currentMonth: {
                    hoursWorked: totalHours,
                    expectedHours: expectedHours,
                    daysWorked: daysWorked,
                    efficiency: expectedHours > 0 ? Math.round((totalHours / expectedHours) * 100) : 0
                },
                recentActivity: [
                    ...recentLeaves.map(leave => ({
                        type: 'leave',
                        action: `${leave.leaveType?.name || 'Leave'} ${leave.status.toLowerCase()} - ${dayjs(leave.startDate).format('MMM DD')} to ${dayjs(leave.endDate).format('MMM DD')}`,
                        date: leave.updatedAt,
                        status: leave.status.toLowerCase()
                    })),
                    ...recentTimesheets.map(timesheet => ({
                        type: 'timesheet',
                        action: `${timesheet.project?.name || 'Project'} timesheet ${timesheet.status.toLowerCase()} - ${dayjs(timesheet.workDate).format('MMM DD')}`,
                        date: timesheet.updatedAt,
                        status: timesheet.status.toLowerCase()
                    }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
                upcomingLeaves: upcomingLeaves.map(leave => ({
                    startDate: leave.startDate,
                    endDate: leave.endDate,
                    type: leave.leaveType?.name || 'Leave',
                    days: dayjs(leave.endDate).diff(dayjs(leave.startDate), 'day') + 1,
                    status: leave.status.toLowerCase()
                }))
            }
        });

    } catch (error) {
        LogHelper.logError(error, { context: 'Fetching employee dashboard stats', employeeId: req.employeeId }, req);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch employee dashboard statistics.' 
        });
    }
});

// General dashboard stats (accessible to all authenticated users)
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        logger.info('Dashboard stats requested', {
            userId: req.user.id,
            role: req.user.role,
            email: req.user.email
        });

        // If admin/HR, return full stats
        // Check both lowercase and as-is role values
        const userRole = req.user.role?.toLowerCase();
        
        if (['admin', 'hr'].includes(userRole)) {
            logger.debug('Admin/HR user detected, fetching full stats', { userId: req.user.id, role: userRole });
            
            const currentMonthStart = dayjs().startOf('month').toDate();
            
            // Employee Stats
            const totalEmployees = await db.Employee.count({ 
                where: { deletedAt: null } 
            });
            logger.debug('Total employees count', { count: totalEmployees });
            
            const activeEmployees = await db.Employee.count({ 
                where: { deletedAt: null, status: 'Active' } 
            });
            logger.debug('Active employees count', { count: activeEmployees });
            
            const onLeaveToday = await db.LeaveRequest.count({
                where: {
                    status: 'Approved',
                    startDate: { [Op.lte]: new Date() },
                    endDate: { [Op.gte]: new Date() }
                }
            });
            logger.debug('Employees on leave today', { count: onLeaveToday });
            
            const newHiresThisMonth = await db.Employee.count({
                where: {
                    hireDate: { [Op.gte]: currentMonthStart },
                    deletedAt: null
                }
            });
            logger.debug('New hires this month', { count: newHiresThisMonth });

            // Leave Stats
            const pendingLeaves = await db.LeaveRequest.count({ 
                where: { status: 'Pending' } 
            });
            
            const approvedLeavesThisMonth = await db.LeaveRequest.count({
                where: {
                    status: 'Approved',
                    startDate: { [Op.gte]: currentMonthStart }
                }
            });
            
            const rejectedLeavesThisMonth = await db.LeaveRequest.count({
                where: {
                    status: 'Rejected',
                    updatedAt: { [Op.gte]: currentMonthStart }
                }
            });

            // Timesheet Stats
            const pendingTimesheets = await db.Timesheet.count({ 
                where: { status: 'Draft' } 
            });
            
            const submittedTimesheets = await db.Timesheet.count({ 
                where: { status: 'Submitted' } 
            });
            
            const approvedTimesheets = await db.Timesheet.count({ 
                where: { status: 'Approved' } 
            });

            // Payroll Stats
            const processedPayrolls = await db.Payroll.count({ 
                where: { 
                    status: 'Paid', 
                    month: dayjs().month() + 1, 
                    year: dayjs().year() 
                } 
            });
            const pendingPayrolls = totalEmployees - processedPayrolls;

            const statsData = {
                stats: {
                    employees: { 
                        total: totalEmployees, 
                        active: activeEmployees, 
                        onLeave: onLeaveToday, 
                        newHires: newHiresThisMonth 
                    },
                    leaves: { 
                        pending: pendingLeaves, 
                        approved: approvedLeavesThisMonth, 
                        rejected: rejectedLeavesThisMonth 
                    },
                    timesheets: { 
                        pending: pendingTimesheets, 
                        submitted: submittedTimesheets, 
                        approved: approvedTimesheets 
                    },
                    payroll: { 
                        processed: processedPayrolls, 
                        pending: pendingPayrolls, 
                        total: totalEmployees 
                    }
                }
            };

            logger.debug('Returning admin/HR stats', { hasAdminStats: true, userId: req.user.id });

            return res.json({
                success: true,
                data: statsData
            });
        }

        // For non-admin users, return basic stats
        logger.debug('Non-admin user, returning basic stats', { userId: req.user.id, role: req.user.role });
        const basicStats = {
            userInfo: {
                id: req.user.id,
                role: req.user.role,
                employeeId: req.employeeId
            },
            serverTime: new Date().toISOString(),
            systemStatus: 'operational'
        };

        res.json({
            success: true,
            data: basicStats
        });
    } catch (error) {
        LogHelper.logError(error, { context: 'Fetching dashboard stats', userId: req.user?.id, role: req.user?.role }, req);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch dashboard statistics.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin/HR dashboard stats (admin/HR access required)
router.get('/admin-stats', authenticateToken, isAdminOrHR, async (req, res) => {
    try {
        const currentMonthStart = dayjs().startOf('month').toDate();
        const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();

        // Employee Stats
        const totalEmployees = await db.Employee.count();
        const activeEmployees = await db.Employee.count({ where: { status: 'Active' } });
        const onLeaveToday = await db.LeaveRequest.count({
            where: {
                status: 'Approved',
                startDate: { [Op.lte]: new Date() },
                endDate: { [Op.gte]: new Date() },
            },
        });
        const newHiresThisMonth = await db.Employee.count({
            where: {
                hireDate: { [Op.gte]: currentMonthStart },
            },
        });

        // Leave Stats
        const pendingLeaves = await db.LeaveRequest.count({ where: { status: 'Pending' } });
        const approvedLeavesThisMonth = await db.LeaveRequest.count({
            where: {
                status: 'Approved',
                startDate: { [Op.gte]: currentMonthStart },
            },
        });
        const rejectedLeavesThisMonth = await db.LeaveRequest.count({
            where: {
                status: 'Rejected',
                updatedAt: { [Op.gte]: currentMonthStart },
            },
        });

        // Timesheet Stats
        const pendingTimesheets = await db.Timesheet.count({ where: { status: 'Draft' } });
        const submittedTimesheets = await db.Timesheet.count({ where: { status: 'Submitted' } });
        const approvedTimesheets = await db.Timesheet.count({ where: { status: 'Approved' } });

        // Payroll Stats
        const processedPayrolls = await db.Payroll.count({ where: { status: 'Paid', month: dayjs().month() + 1, year: dayjs().year() } });
        const pendingPayrolls = totalEmployees - processedPayrolls;


        // Chart Data: Employee Growth for the last 6 months
        const employeeGrowth = [];
        for (let i = 5; i >= 0; i--) {
            const month = dayjs().subtract(i, 'month');
            const count = await db.Employee.count({
                where: {
                    hireDate: { [Op.lte]: month.endOf('month').toDate() }
                }
            });
            employeeGrowth.push({ name: month.format('MMM'), employees: count });
        }

        // Chart Data: Leave Distribution
        const leaveDistribution = await db.LeaveRequest.findAll({
            attributes: [
                [db.sequelize.fn('COUNT', db.sequelize.col('LeaveRequest.id')), 'count'],
            ],
            include: [{
                model: db.LeaveType,
                as: 'leaveType',
                attributes: ['name'],
            }],
            group: ['leaveType.id', 'leaveType.name'],
            raw: true,
        });

        const formattedLeaveDistribution = leaveDistribution.map(item => ({
            name: item['leaveType.name'],
            value: parseInt(item.count, 10),
        }));


        res.json({
            success: true,
            data: {
                stats: {
                    employees: { total: totalEmployees, active: activeEmployees, onLeave: onLeaveToday, newHires: newHiresThisMonth },
                    leaves: { pending: pendingLeaves, approved: approvedLeavesThisMonth, rejected: rejectedLeavesThisMonth },
                    timesheets: { pending: pendingTimesheets, submitted: submittedTimesheets, approved: approvedTimesheets },
                    payroll: { processed: processedPayrolls, pending: pendingPayrolls, total: totalEmployees }
                },
                charts: {
                    employeeGrowth,
                    leaveDistribution: formattedLeaveDistribution,
                }
            }
        });

    } catch (error) {
        LogHelper.logError(error, { context: 'Fetching admin dashboard stats' }, req);
        res.status(500).json({ success: false, message: "Failed to fetch dashboard statistics." });
    }
});

module.exports = router;
