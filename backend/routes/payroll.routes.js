const express = require('express');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { authenticateToken, authorize, isAdminOrHR } = require('../middleware/auth.simple');
const db = require('../models');

const Payroll = db.Payroll;
const Employee = db.Employee;
const SalaryStructure = db.SalaryStructure;
const Timesheet = db.Timesheet;
const LeaveRequest = db.LeaveRequest;
const { generatePayslipPDF } = require('../utils/payslipGenerator');
const router = express.Router();

// Middleware to ensure all routes in this file are authenticated
router.use(authenticateToken);

// Helper function to calculate working days in a month
const calculateWorkingDaysInMonth = (year, month) => {
    const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
    let workingDays = 0;
    for (let i = 1; i <= daysInMonth; i++) {
        const day = dayjs(`${year}-${month}-${i}`).day();
        if (day !== 0 && day !== 6) { // Exclude Sunday and Saturday
            workingDays++;
        }
    }
    return workingDays;
};

/**
 * @swagger
 * /api/payroll:
 *   get:
 *     summary: Get all payroll records
 *     description: Retrieve payroll records with role-based filtering - employees see their own, admin/HR see all
 *     tags: [Payroll]
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
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll records retrieved successfully
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
 *                     $ref: '#/components/schemas/PayrollData'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// GET all payroll records with filtering and role-based access
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, status, employeeId, month, year, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
        const offset = (page - 1) * limit;

        let where = {};
        if (req.userRole === 'employee') {
            where.employeeId = req.employeeId;
        }

        if (status) where.status = status;
        if (month) where.month = month;
        if (year) where.year = year;
        if (employeeId && (req.userRole === 'admin' || req.userRole === 'hr')) {
            where.employeeId = employeeId;
        }

        const { count, rows: payrolls } = await Payroll.findAndCountAll({
            where,
            include: [{ 
                model: Employee, 
                as: 'employee', 
                attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email'],
                required: false // Make this a LEFT JOIN to handle cases where employee might not exist
            }],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            success: true,
            data: payrolls,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalRecords: count,
            },
        });
    } catch (error) {
        console.error('Get Payrolls Error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch payroll records.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET a single payroll record by ID
router.get('/:id', async (req, res) => {
    try {
        const payroll = await Payroll.findByPk(req.params.id, { 
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email']
                }
            ]
        });
        if (!payroll) {
            return res.status(404).json({ success: false, message: 'Payroll record not found.' });
        }

        // Permission check
        if (req.userRole === 'employee' && payroll.employeeId !== req.employeeId) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        res.json({ success: true, data: payroll });
    } catch (error) {
        console.error('Get Payroll Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payroll record.' });
    }
});

// POST to generate payroll for employees (Admin or HR only)
/**
 * @swagger
 * /api/payroll/generate:
 *   post:
 *     summary: Generate payroll for a period
 *     description: Generate payroll records for all employees for a specified month/year - Admin/HR only
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - year
 *             properties:
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 10
 *               year:
 *                 type: integer
 *                 example: 2024
 *               employeeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Optional - specific employees (leave empty for all)
 *     responses:
 *       201:
 *         description: Payroll generated successfully
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
 *                     generated:
 *                       type: integer
 *                     skipped:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/generate', isAdminOrHR, async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { employeeIds, employeeId, month, year } = req.body;
        
        // Handle both single employeeId and array of employeeIds
        let targetEmployeeIds = [];
        if (employeeIds && Array.isArray(employeeIds)) {
            targetEmployeeIds = employeeIds;
        } else if (employeeId) {
            targetEmployeeIds = [employeeId];
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide either employeeId or employeeIds array' 
            });
        }
        
        const targetEmployees = await Employee.findAll({ 
            where: { id: { [Op.in]: targetEmployeeIds } } 
        });

        const payPeriodStart = dayjs(`${year}-${month}-01`).startOf('month').toDate();
        const payPeriodEnd = dayjs(`${year}-${month}-01`).endOf('month').toDate();
        const workingDaysInMonth = calculateWorkingDaysInMonth(year, month);

        // Pre-fetch all related data to avoid N+1 queries
        const [salaryStructures, approvedTimesheets, approvedLeaves] = await Promise.all([
            SalaryStructure.findAll({ 
                where: { 
                    employeeId: { [Op.in]: targetEmployeeIds }, 
                    isActive: true 
                } 
            }),
            Timesheet.findAll({
                where: { 
                    employeeId: { [Op.in]: targetEmployeeIds }, 
                    weekStartDate: { [Op.between]: [payPeriodStart, payPeriodEnd] }, 
                    status: 'Approved' 
                }
            }),
            LeaveRequest.findAll({
                where: { 
                    employeeId: { [Op.in]: targetEmployeeIds }, 
                    status: 'Approved', 
                    startDate: { [Op.between]: [payPeriodStart, payPeriodEnd] } 
                }
            })
        ]);

        // Create lookup maps for efficient access
        const salaryStructureMap = new Map(salaryStructures.map(ss => [ss.employeeId, ss]));
        
        // Group timesheets and leaves by employee
        const timesheetsByEmployee = {};
        approvedTimesheets.forEach(ts => {
            if (!timesheetsByEmployee[ts.employeeId]) {
                timesheetsByEmployee[ts.employeeId] = [];
            }
            timesheetsByEmployee[ts.employeeId].push(ts);
        });
        
        const leavesByEmployee = {};
        approvedLeaves.forEach(lr => {
            if (!leavesByEmployee[lr.employeeId]) {
                leavesByEmployee[lr.employeeId] = 0;
            }
            leavesByEmployee[lr.employeeId] += lr.totalDays;
        });

        let generatedPayrolls = [];

        for (const employee of targetEmployees) {
            const salaryStructure = salaryStructureMap.get(employee.id);
            if (!salaryStructure) continue;

            const employeeTimesheets = timesheetsByEmployee[employee.id] || [];
            const actualWorkedHours = employeeTimesheets.reduce((sum, ts) => sum + parseFloat(ts.totalHoursWorked || 0), 0);
            // Calculate worked days from total hours (assuming 8 hours = 1 day)
            const actualWorkedDays = Math.floor(actualWorkedHours / 8);

            const approvedLeaveDays = leavesByEmployee[employee.id] || 0;

            const payableDays = actualWorkedDays + approvedLeaveDays;
            
            // Enhanced calculation with proper NaN handling
            const basicSalary = parseFloat(salaryStructure.basicSalary) || 0;
            const pfContribution = parseFloat(salaryStructure.pfContribution) || 0;
            const professionalTax = parseFloat(salaryStructure.professionalTax) || 0;
            const tds = parseFloat(salaryStructure.tds) || 0;
            
            const grossSalary = (basicSalary / workingDaysInMonth) * payableDays;
            const totalDeductions = pfContribution + professionalTax + tds;
            const netSalary = grossSalary - totalDeductions;
            
            // Ensure all values are valid numbers
            const finalGrossSalary = isNaN(grossSalary) ? 0 : Math.round(grossSalary * 100) / 100;
            const finalTotalDeductions = isNaN(totalDeductions) ? 0 : Math.round(totalDeductions * 100) / 100;
            const finalNetSalary = isNaN(netSalary) ? 0 : Math.round(netSalary * 100) / 100;

            const [payroll] = await Payroll.findOrCreate({
                where: { employeeId: employee.id, month, year },
                defaults: {
                    payPeriodStart,
                    payPeriodEnd,
                    grossSalary: finalGrossSalary,
                    totalDeductions: finalTotalDeductions,
                    netSalary: finalNetSalary,
                    workingDays: workingDaysInMonth,
                    actualWorkingDays: actualWorkedDays,
                    leaveDays: approvedLeaveDays,
                    overtimeHours: 0,
                    overtimePay: 0,
                    status: 'Draft',
                    processedBy: req.userId,
                },
                transaction,
            });
            generatedPayrolls.push(payroll);
        }

        await transaction.commit();
        res.status(201).json({ success: true, message: `Payroll generated for ${generatedPayrolls.length} employees.`, data: generatedPayrolls });
    } catch (error) {
        await transaction.rollback();
        console.error('Generate Payroll Error:', error);
        console.error('Error Stack:', error.stack);
        res.status(500).json({ success: false, message: 'Failed to generate payroll.', error: error.message });
    }
});

// PUT to update payroll status (Admin or HR only)
router.put('/:id/status', isAdminOrHR, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const payroll = await Payroll.findByPk(req.params.id);
        if (!payroll) {
            return res.status(404).json({ success: false, message: 'Payroll record not found.' });
        }

        payroll.status = status;
        payroll.notes = notes;
        if (status === 'Paid') {
            payroll.paidAt = new Date();
        }
        await payroll.save();

        res.json({ success: true, message: `Payroll status updated to ${status}.` });
    } catch (error) {
        console.error('Update Payroll Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update payroll status.' });
    }
});

// GET to download a payslip as PDF
router.get('/:id/download', async (req, res) => {
    try {
        const payroll = await Payroll.findByPk(req.params.id, {
            include: [
                { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'leaveBalance'] },
                { model: db.PayrollComponent, as: 'components' }
            ]
        });

        if (!payroll) {
            return res.status(404).json({ success: false, message: 'Payroll record not found.' });
        }

        // Permission check
        if (req.userRole === 'employee' && payroll.employeeId !== req.employeeId) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // Generate and stream the PDF
        await generatePayslipPDF(payroll.toJSON(), res);

    } catch (error) {
        console.error('Download Payslip Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate payslip PDF.' });
    }
});

module.exports = router;
