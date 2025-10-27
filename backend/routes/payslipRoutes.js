const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { 
  Payslip, 
  PayslipTemplate, 
  PayrollData, 
  SalaryStructure, 
  Employee 
} = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth.simple');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @swagger
 * /payslips:
 *   get:
 *     summary: Get all payslips with filters
 *     description: Retrieve payslips with optional filtering by month, year, employee, and status. Role-based access applies.
 *     tags: [Payslips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2030
 *         description: Filter by year
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Filter by employee ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, approved, paid]
 *         description: Filter by payslip status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Payslips retrieved successfully
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
 *                     $ref: '#/components/schemas/Payslip'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// GET /api/payslips - Get all payslips with filters
router.get('/',
  authenticateToken,
  authorize(['admin', 'hr', 'employee']),
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020, max: 2030 }),
    query('employeeId').optional().isInt(),
    query('status').optional().isIn(['draft', 'approved', 'paid']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { month, year, employeeId, status, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      // Build where clause
      let where = {};
      
      // Role-based filtering
      if (req.user.role === 'employee') {
        where.employeeId = req.user.employeeId;
      } else if (employeeId) {
        where.employeeId = employeeId;
      }
      
      if (month) where.month = month;
      if (year) where.year = year;
      if (status) where.status = status;
      
      const { count, rows } = await Payslip.findAndCountAll({
        where,
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['firstName', 'lastName', 'employeeId', 'departmentId', 'positionId']
          },
          {
            model: PayslipTemplate,
            as: 'template',
            attributes: ['name', 'description', 'isDefault']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['payPeriod', 'DESC']]
      });
      
      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching payslips:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payslips',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /payslips/{id}:
 *   get:
 *     summary: Get payslip by ID
 *     description: Retrieve a specific payslip by ID. Employees can only access their own payslips.
 *     tags: [Payslips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payslip ID
 *     responses:
 *       200:
 *         description: Payslip retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payslip'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/payslips/:id - Get payslip by ID
router.get('/:id',
  authenticateToken,
  authorize(['admin', 'hr', 'employee']),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      let where = { id };
      
      // Role-based access control
      if (req.user.role === 'employee') {
        where.employeeId = req.user.employeeId;
      }
      
      const payslip = await Payslip.findOne({
        where,
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['firstName', 'lastName', 'employeeId', 'departmentId', 'positionId', 'email']
          },
          {
            model: PayslipTemplate,
            as: 'template',
            attributes: ['name', 'description', 'headerFields', 'styling']
          },
          {
            model: PayrollData,
            as: 'payrollData',
            attributes: ['earningsData', 'deductionsData', 'attendanceData']
          }
        ]
      });
      
      if (!payslip) {
        return res.status(404).json({
          success: false,
          message: 'Payslip not found'
        });
      }
      
      res.json({
        success: true,
        data: payslip
      });
    } catch (error) {
      console.error('Error fetching payslip:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payslip',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /payslips:
 *   post:
 *     summary: Create a new payslip
 *     description: Create a new payslip for an employee using template and payroll data
 *     tags: [Payslips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - templateId
 *               - payPeriod
 *               - month
 *               - year
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: Employee ID
 *                 example: 1
 *               templateId:
 *                 type: integer
 *                 description: Payslip template ID
 *                 example: 1
 *               payrollDataId:
 *                 type: integer
 *                 description: Payroll data ID (optional, will create if not provided)
 *                 example: 1
 *               payPeriod:
 *                 type: string
 *                 format: date
 *                 description: Pay period end date
 *                 example: "2024-01-31"
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 description: Pay month
 *                 example: 1
 *               year:
 *                 type: integer
 *                 description: Pay year
 *                 example: 2024
 *               earnings:
 *                 type: object
 *                 description: Earnings breakdown
 *                 example:
 *                   basicSalary: 50000
 *                   hra: 15000
 *                   allowances: 5000
 *               deductions:
 *                 type: object
 *                 description: Deductions breakdown
 *                 example:
 *                   pf: 6000
 *                   esic: 375
 *                   professionalTax: 200
 *               attendance:
 *                 type: object
 *                 description: Attendance data
 *                 example:
 *                   totalWorkingDays: 22
 *                   presentDays: 20
 *                   lopDays: 2
 *     responses:
 *       201:
 *         description: Payslip created successfully
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
 *                   example: "Payslip created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Payslip'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// POST /api/payslips - Create new payslip
router.post('/',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    body('employeeId').isUUID().withMessage('Valid Employee ID is required'),
    body('templateId').optional().isUUID().withMessage('Valid Template ID required'),
    body('payPeriod').notEmpty().withMessage('Pay period is required'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
    body('year').isInt().withMessage('Valid year is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        employeeId,
        templateId,
        payrollDataId = 1, // Default payroll data ID
        payPeriod,
        month,
        year,
        payPeriodStart,
        payPeriodEnd,
        payslipNumber,
        employeeInfo,
        companyInfo,
        earnings = {},
        deductions = {},
        attendance = {},
        grossEarnings,
        totalDeductions,
        netPay
      } = req.body;
      
      // Check if payslip already exists for this employee and period
      const existingPayslip = await Payslip.findOne({
        where: {
          employeeId,
          month,
          year
        }
      });
      
      if (existingPayslip) {
        return res.status(400).json({
          success: false,
          message: 'Payslip already exists for this employee and period'
        });
      }
      
      // Get employee and template (template is optional)
      const employee = await Employee.findByPk(employeeId);
      let template = null;
      if (templateId) {
        template = await PayslipTemplate.findByPk(templateId);
      }
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
      
      // Calculate payslip data if not provided
      const calculatedGrossEarnings = grossEarnings || Object.values(earnings).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      const calculatedTotalDeductions = totalDeductions || Object.values(deductions).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      const calculatedNetPay = netPay || (calculatedGrossEarnings - calculatedTotalDeductions);
      
      // Create payslip
      const payslip = await Payslip.create({
        employeeId,
        templateId,
        payrollDataId,
        payPeriod,
        month,
        year,
        payPeriodStart: payPeriodStart || new Date(year, month - 1, 1).toISOString().split('T')[0],
        payPeriodEnd: payPeriodEnd || new Date(year, month, 0).toISOString().split('T')[0],
        payslipNumber: payslipNumber || `PAY-${year}${month.toString().padStart(2, '0')}-${employeeId.substring(0, 8)}`,
        employeeInfo: employeeInfo || {},
        companyInfo: companyInfo || { name: 'SkyrakSys HRM', address: 'Corporate Office' },
        earnings,
        deductions,
        attendance,
        grossEarnings: calculatedGrossEarnings,
        totalDeductions: calculatedTotalDeductions,
        netPay: calculatedNetPay,
        netPayInWords: numberToWords(calculatedNetPay),
        status: 'draft',
        generatedBy: req.user.id
      });
      
      // Fetch complete payslip data
      const completePayslip = await Payslip.findByPk(payslip.id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['firstName', 'lastName', 'employeeId', 'departmentId', 'positionId']
          },
          {
            model: PayslipTemplate,
            as: 'template',
            attributes: ['name', 'description', 'isDefault']
          }
        ]
      });
      
      res.status(201).json({
        success: true,
        message: 'Payslip created successfully',
        data: completePayslip
      });
    } catch (error) {
      console.error('Error creating payslip:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payslip',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /payslips/bulk-generate:
 *   post:
 *     summary: Bulk generate payslips
 *     description: Generate payslips for multiple employees for a specific pay period using a template
 *     tags: [Payslips]
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
 *               - payPeriod
 *               - templateId
 *             properties:
 *               employeeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of employee IDs
 *                 example: [1, 2, 3, 4]
 *               payPeriod:
 *                 type: string
 *                 format: date
 *                 description: Pay period date (YYYY-MM-DD)
 *                 example: "2024-01-31"
 *               templateId:
 *                 type: integer
 *                 description: Payslip template ID to use
 *                 example: 1
 *     responses:
 *       201:
 *         description: Payslips generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bulk payslips generated successfully"
 *                 count:
 *                   type: integer
 *                   example: 4
 *                 payslips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payslip'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// POST /api/payslips/bulk-generate - Bulk generate payslips
router.post('/bulk-generate',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    body('employeeIds').isArray().withMessage('Employee IDs must be an array'),
    body('payPeriod').isISO8601().withMessage('Valid pay period is required'),
    body('templateId').isUUID().withMessage('Template ID must be a valid UUID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { employeeIds, payPeriod, templateId } = req.body;
      const payPeriodDate = new Date(payPeriod);
      const month = payPeriodDate.getMonth() + 1;
      const year = payPeriodDate.getFullYear();
      
      const results = await Payslip.bulkGenerate({
        employeeIds,
        templateId,
        payPeriod,
        month,
        year,
        createdBy: req.user.id
      });
      
      res.status(201).json({
        success: true,
        message: `Bulk payslips generated successfully`,
        count: results.length,
        payslips: results
      });
    } catch (error) {
      console.error('Error in bulk generation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate bulk payslips',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /payslips/{id}/pdf:
 *   get:
 *     summary: Download payslip PDF
 *     description: Generate and download a PDF version of the payslip. Employees can only download their own payslips.
 *     tags: [Payslips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payslip ID
 *     responses:
 *       200:
 *         description: PDF file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             example: 'attachment; filename="payslip_1.pdf"'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// GET /api/payslips/:id/pdf - Generate and download payslip PDF
router.get('/:id/pdf',
  authenticateToken,
  authorize(['admin', 'hr', 'employee']),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      let where = { id };
      
      // Role-based access control
      if (req.user.role === 'employee') {
        where.employeeId = req.user.employeeId;
      }
      
      const payslip = await Payslip.findOne({
        where,
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['firstName', 'lastName', 'employeeId', 'departmentId', 'positionId']
          },
          {
            model: PayslipTemplate,
            as: 'template',
            attributes: ['name', 'description', 'headerFields', 'styling']
          }
        ]
      });
      
      if (!payslip) {
        return res.status(404).json({
          success: false,
          message: 'Payslip not found'
        });
      }
      
      // Generate PDF
      const doc = new PDFDocument();
      const filename = `payslip_${payslip.id}_${payslip.month}_${payslip.year}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      doc.pipe(res);
      
      // Generate PDF content
      generatePayslipPDF(doc, {
        ...payslip.toJSON(),
        companyInfo: {
          name: 'Skyraksys HRM',
          address: 'Your Company Address'
        }
      });
      
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  }
);

// PUT /api/payslips/:id - Update payslip
router.put('/:id',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    param('id').isUUID(),
    body('earnings').optional().isObject(),
    body('deductions').optional().isObject(),
    body('attendance').optional().isObject(),
    body('status').optional().isIn(['draft', 'approved', 'paid'])
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const payslip = await Payslip.findByPk(id);
      
      if (!payslip) {
        return res.status(404).json({
          success: false,
          message: 'Payslip not found'
        });
      }
      
      // Check if payslip is locked
      if (payslip.isLocked) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update locked payslip'
        });
      }
      
      // Recalculate totals if earnings or deductions are updated
      if (updateData.earnings || updateData.deductions) {
        const earnings = updateData.earnings || payslip.earnings;
        const deductions = updateData.deductions || payslip.deductions;
        
        updateData.grossEarnings = Object.values(earnings).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        updateData.totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        updateData.netPay = updateData.grossEarnings - updateData.totalDeductions;
        updateData.netPayInWords = numberToWords(updateData.netPay);
      }
      
      updateData.updatedBy = req.user.id;
      
      await payslip.update(updateData);
      
      // Fetch updated payslip with associations
      const updatedPayslip = await Payslip.findByPk(id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['firstName', 'lastName', 'employeeId', 'departmentId', 'positionId']
          },
          {
            model: PayslipTemplate,
            as: 'template',
            attributes: ['name', 'description', 'isDefault']
          }
        ]
      });
      
      res.json({
        success: true,
        message: 'Payslip updated successfully',
        data: updatedPayslip
      });
    } catch (error) {
      console.error('Error updating payslip:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payslip',
        error: error.message
      });
    }
  }
);

// DELETE /api/payslips/:id - Delete payslip
router.delete('/:id',
  authenticateToken,
  authorize(['admin', 'hr']),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const payslip = await Payslip.findByPk(id);
      
      if (!payslip) {
        return res.status(404).json({
          success: false,
          message: 'Payslip not found'
        });
      }
      
      // Check if payslip is locked
      if (payslip.isLocked) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete locked payslip'
        });
      }
      
      await payslip.destroy();
      
      res.json({
        success: true,
        message: 'Payslip deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting payslip:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payslip',
        error: error.message
      });
    }
  }
);

// Helper function to convert number to words
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

  if (num === 0) return 'Zero Rupees Only';

  function convertToWords(n) {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertToWords(n % 100) : '');
    
    // Indian numbering system
    if (n < 100000) return convertToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertToWords(n % 1000) : '');
    if (n < 10000000) return convertToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertToWords(n % 100000) : '');
    return convertToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convertToWords(n % 10000000) : '');
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = convertToWords(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convertToWords(paise) + ' Paise';
  }
  result += ' Only';
  
  return result;
}

// Helper function to generate PDF content
function generatePayslipPDF(doc, payslip) {
  const { employee, companyInfo, earnings, deductions, attendance } = payslip;
  
  // Header
  doc.fontSize(16).text(companyInfo.name || 'Company Name', { align: 'center' });
  doc.fontSize(12).text(companyInfo.address || 'Company Address', { align: 'center' });
  doc.moveDown();
  
  // Title
  doc.fontSize(14).text('SALARY SLIP', { align: 'center' });
  doc.text(`For the month of ${getMonthName(payslip.month)} ${payslip.year}`, { align: 'center' });
  doc.moveDown();
  
  // Employee details
  doc.fontSize(10);
  doc.text(`Employee Name: ${employee.firstName} ${employee.lastName}`, 50, doc.y);
  doc.text(`Employee ID: ${employee.employeeId}`, 300, doc.y - 12);
  doc.text(`Department: ${employee.department || 'N/A'}`, 50, doc.y);
  doc.text(`Designation: ${employee.position || 'N/A'}`, 300, doc.y - 12);
  doc.moveDown();
  
  // Attendance details
  doc.text('ATTENDANCE DETAILS:', 50, doc.y);
  doc.text(`Working Days: ${attendance.totalWorkingDays || 0}`, 50, doc.y);
  doc.text(`Present Days: ${attendance.presentDays || 0}`, 200, doc.y - 12);
  doc.text(`LOP Days: ${attendance.lopDays || 0}`, 350, doc.y - 12);
  doc.moveDown();
  
  // Earnings and Deductions table
  const startY = doc.y;
  doc.text('EARNINGS', 70, startY);
  doc.text('AMOUNT', 150, startY);
  doc.text('DEDUCTIONS', 270, startY);
  doc.text('AMOUNT', 370, startY);
  
  let yPos = startY + 20;
  const maxRows = Math.max(Object.keys(earnings || {}).length, Object.keys(deductions || {}).length);
  
  Object.entries(earnings || {}).forEach(([key, value], index) => {
    doc.text(key, 50, yPos + (index * 15));
    doc.text(value.toString(), 150, yPos + (index * 15));
  });
  
  Object.entries(deductions || {}).forEach(([key, value], index) => {
    doc.text(key, 250, yPos + (index * 15));
    doc.text(value.toString(), 370, yPos + (index * 15));
  });
  
  // Totals
  const totalsY = yPos + (maxRows * 15) + 10;
  doc.text('GROSS EARNINGS:', 50, totalsY);
  doc.text((payslip.grossEarnings || 0).toString(), 150, totalsY);
  doc.text('TOTAL DEDUCTIONS:', 250, totalsY);
  doc.text((payslip.totalDeductions || 0).toString(), 370, totalsY);
  
  // Net pay
  doc.fontSize(12);
  doc.text('NET PAY:', 50, totalsY + 30);
  doc.text((payslip.netPay || 0).toString(), 150, totalsY + 30);
  
  // Net pay in words
  doc.fontSize(10);
  doc.text(`Amount in words: ${payslip.netPayInWords || 'Zero Rupees Only'}`, 50, totalsY + 50);
  
  // Footer
  doc.text('This is a computer generated payslip and does not require signature.', 50, doc.page.height - 50);
}

function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || 'Unknown';
}

module.exports = router;
