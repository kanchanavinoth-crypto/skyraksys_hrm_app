/**
 * Modern Payslip Management Routes
 * Comprehensive API for payslip generation, management, and reporting
 * Role-based access: Admin/HR can manage all, Employees can view their own
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Joi = require('joi');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const db = require('../models');
const { sequelize } = db;

// Models
const { Payslip, Employee, PayslipTemplate, SalaryStructure, Timesheet, LeaveRequest } = db;

// Services
const { payslipCalculationService } = require('../services/payslipCalculation.service');
const { payslipTemplateService } = require('../services/payslipTemplate.service');

// Middleware
const { authenticateToken, authorize, isAdminOrHR } = require('../middleware/auth.simple');

// Apply authentication to all routes
router.use(authenticateToken);

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const payslipSchemas = {
  generate: Joi.object({
    employeeIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2020).max(2030).required(),
    templateId: Joi.string().uuid().optional(),
    options: Joi.object({
      overtimeRate: Joi.number().min(1).max(3).optional(),
      bonus: Joi.number().min(0).optional(),
      arrears: Joi.number().min(0).optional(),
      taxRegime: Joi.string().valid('old', 'new').optional(),
      section80C: Joi.number().min(0).max(150000).optional(),
      skipPF: Joi.boolean().optional(),
      skipESIC: Joi.boolean().optional(),
      skipPT: Joi.boolean().optional(),
      skipTDS: Joi.boolean().optional()
    }).optional()
  }),

  update: Joi.object({
    status: Joi.string().valid('draft', 'finalized', 'paid', 'cancelled').optional(),
    earnings: Joi.object().optional(),
    deductions: Joi.object().optional(),
    attendance: Joi.object().optional(),
    approverComments: Joi.string().max(500).optional()
  }),

  filter: Joi.object({
    month: Joi.number().integer().min(1).max(12).optional(),
    year: Joi.number().integer().min(2020).max(2030).optional(),
    employeeId: Joi.string().uuid().optional(),
    status: Joi.string().valid('draft', 'finalized', 'paid', 'cancelled').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }
    req.validatedData = value;
    next();
  };
};

// =====================================================
// PAYSLIP CRUD OPERATIONS
// =====================================================

/**
 * GET /api/payslips
 * Get all payslips with filters (role-based access)
 */
router.get('/', async (req, res) => {
  try {
    const { month, year, employeeId, status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    const where = {};
    
    // Role-based filtering
    if (req.userRole === 'employee') {
      if (!req.employeeId) {
        return res.status(403).json({
          success: false,
          message: 'Employee record not found for this user'
        });
      }
      where.employeeId = req.employeeId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }
    
    // Apply filters
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;
    
    const offset = (page - 1) * limit;
    
    const { count, rows: payslips } = await Payslip.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'departmentId', 'positionId']
        },
        {
          model: PayslipTemplate,
          as: 'template',
          attributes: ['id', 'name']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
      distinct: true
    });
    
    res.json({
      success: true,
      data: payslips,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get payslips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payslips',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/payslips/my
 * Get current user's payslips
 */
router.get('/my', async (req, res) => {
  try {
    if (!req.employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Employee record not found for this user'
      });
    }
    
    const { month, year, page = 1, limit = 20 } = req.query;
    
    const where = { employeeId: req.employeeId };
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    
    const offset = (page - 1) * limit;
    
    const { count, rows: payslips } = await Payslip.findAndCountAll({
      where,
      include: [
        {
          model: PayslipTemplate,
          as: 'template',
          attributes: ['id', 'name']
        }
      ],
      order: [['year', 'DESC'], ['month', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      success: true,
      data: payslips,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count
      }
    });
  } catch (error) {
    console.error('Get my payslips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your payslips',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/payslips/:id
 * Get single payslip by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const payslip = await Payslip.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'departmentId', 'positionId']
        },
        {
          model: PayslipTemplate,
          as: 'template'
        }
      ]
    });
    
    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }
    
    // Permission check
    if (req.userRole === 'employee' && payslip.employeeId !== req.employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: payslip
    });
  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payslip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// PAYSLIP GENERATION
// =====================================================

/**
 * PUT /api/payslips/:id
 * Manually edit a draft payslip (Admin/HR only)
 * Only draft payslips can be edited
 * All changes are logged for audit trail
 */
router.put('/:id', isAdminOrHR, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { earnings, deductions, reason } = req.body;
    
    // Validation
    if (!earnings || typeof earnings !== 'object' || Object.keys(earnings).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Earnings object is required and must have at least one component'
      });
    }
    
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Detailed reason is required (minimum 10 characters) for audit trail'
      });
    }
    
    // Fetch payslip
    const payslip = await Payslip.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email']
        }
      ],
      transaction
    });
    
    if (!payslip) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }
    
    // Security check: Only draft payslips can be edited
    if (payslip.status !== 'draft') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot edit payslip with status "${payslip.status}". Only draft payslips can be edited.`
      });
    }
    
    // Calculate new totals
    const grossEarnings = Object.values(earnings).reduce((sum, val) => sum + parseFloat(val || 0), 0);
    const totalDeductions = deductions 
      ? Object.values(deductions).reduce((sum, val) => sum + parseFloat(val || 0), 0)
      : 0;
    const netPay = grossEarnings - totalDeductions;
    
    // Validate net pay
    if (netPay < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Net pay cannot be negative. Please adjust earnings or deductions.'
      });
    }
    
    // Store original values for audit log
    const originalValues = {
      earnings: payslip.earnings,
      deductions: payslip.deductions,
      grossEarnings: payslip.grossEarnings,
      totalDeductions: payslip.totalDeductions,
      netPay: payslip.netPay
    };
    
    // Update payslip
    await payslip.update({
      earnings,
      deductions: deductions || {},
      grossEarnings,
      totalDeductions,
      netPay,
      manuallyEdited: true,
      lastEditedBy: req.user.id,
      lastEditedAt: new Date()
    }, { transaction });
    
    // Create audit log entry
    await sequelize.models.PayslipAuditLog.create({
      payslipId: payslip.id,
      action: 'manual_edit',
      performedBy: req.user.id,
      reason: reason.trim(),
      changes: {
        before: originalValues,
        after: {
          earnings,
          deductions: deductions || {},
          grossEarnings,
          totalDeductions,
          netPay
        }
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }, { transaction });
    
    await transaction.commit();
    
    // Reload with associations
    await payslip.reload({
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'departmentId']
        }
      ]
    });
    
    res.json({
      success: true,
      message: 'Payslip updated successfully',
      data: payslip
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Edit payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payslip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/payslips/validate
 * Validate employees before payslip generation (Admin/HR only)
 * Checks: salary structure, timesheet data, existing payslips
 */
router.post('/validate', isAdminOrHR, async (req, res) => {
  try {
    const { employeeIds, month, year } = req.body;
    
    // Validation
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'employeeIds array is required and cannot be empty'
      });
    }
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'month and year are required'
      });
    }
    
    // Fetch all employees with related data
    const employees = await Employee.findAll({
      where: { id: { [Op.in]: employeeIds } },
      include: [
        { 
          model: SalaryStructure, 
          as: 'salaryStructure',
          required: false 
        },
        {
          model: db.Department,
          as: 'department',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });
    
    const validation = {
      totalEmployees: employees.length,
      validEmployees: [],
      invalidEmployees: [],
      warnings: []
    };
    
    // Validate each employee
    for (const emp of employees) {
      const issues = [];
      
      // Check 1: Salary structure exists
      if (!emp.salaryStructure) {
        issues.push('No salary structure configured');
      } else if (!emp.salaryStructure.isActive) {
        issues.push('Salary structure is inactive');
      }
      
      // Check 2: Timesheet data exists
      const timesheet = await Timesheet.findOne({
        where: {
          employeeId: emp.id,
          month,
          year
        }
      });
      
      if (!timesheet) {
        issues.push('No timesheet data for this period');
      } else if (timesheet.status !== 'approved') {
        issues.push(`Timesheet not approved (status: ${timesheet.status})`);
      }
      
      // Check 3: Payslip already exists
      const existing = await Payslip.findOne({
        where: { 
          employeeId: emp.id, 
          month, 
          year 
        }
      });
      
      if (existing) {
        issues.push(`Payslip already exists (${existing.payslipNumber}, status: ${existing.status})`);
      }
      
      // Check 4: Employee status
      if (emp.status !== 'Active') {
        issues.push(`Employee status is ${emp.status}`);
      }
      
      // Categorize employee
      const employeeData = {
        id: emp.id,
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department ? emp.department.name : 'N/A',
        status: emp.status
      };
      
      if (issues.length > 0) {
        validation.invalidEmployees.push({
          ...employeeData,
          issues
        });
      } else {
        validation.validEmployees.push(employeeData);
      }
    }
    
    // Calculate success rate
    validation.canProceed = validation.validEmployees.length > 0;
    validation.successRate = validation.totalEmployees > 0 
      ? ((validation.validEmployees.length / validation.totalEmployees) * 100).toFixed(1)
      : '0.0';
    
    // Add summary message
    if (validation.validEmployees.length === validation.totalEmployees) {
      validation.message = 'All employees are valid for payslip generation';
    } else if (validation.validEmployees.length === 0) {
      validation.message = 'No employees are valid for payslip generation';
    } else {
      validation.message = `${validation.validEmployees.length} out of ${validation.totalEmployees} employees are valid`;
    }
    
    res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: error.message
    });
  }
});

/**
 * POST /api/payslips/generate
 * Generate payslips for employees (Admin/HR only)
 */
router.post('/generate', isAdminOrHR, validate(payslipSchemas.generate), async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { employeeIds, month, year, templateId, options = {} } = req.validatedData;
    
    // Get or create default template
    let template;
    if (templateId) {
      const result = await payslipTemplateService.getTemplateById(templateId);
      template = result.data;
    } else {
      const result = await payslipTemplateService.getDefaultTemplateFromDB();
      template = result.data;
    }
    
    const generatedPayslips = [];
    const errors = [];
    
    for (const employeeId of employeeIds) {
      try {
        // Check if payslip already exists
        const existing = await Payslip.findOne({
          where: { employeeId, month, year }
        });
        
        if (existing) {
          errors.push({
            employeeId,
            message: 'Payslip already exists for this period'
          });
          continue;
        }
        
        // Fetch employee with salary structure
        const employee = await Employee.findByPk(employeeId, {
          include: [
            {
              model: SalaryStructure,
              as: 'salaryStructure',
              where: { isActive: true },
              required: false
            }
          ]
        });
        
        if (!employee) {
          errors.push({
            employeeId,
            message: 'Employee not found'
          });
          continue;
        }
        
        if (!employee.salaryStructure) {
          errors.push({
            employeeId,
            message: 'No active salary structure found'
          });
          continue;
        }
        
        // Fetch attendance data (from timesheets)
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const timesheets = await Timesheet.findAll({
          where: {
            employeeId,
            workDate: {
              [Op.between]: [startDate, endDate]
            },
            status: 'Approved'
          }
        });
        
        const presentDays = new Set(timesheets.map(ts => ts.workDate.toDateString())).size;
        const totalWorkingDays = calculateWorkingDaysInMonth(year, month);
        
        // Fetch approved leaves
        const leaves = await LeaveRequest.findAll({
          where: {
            employeeId,
            status: 'Approved',
            startDate: {
              [Op.lte]: endDate
            },
            endDate: {
              [Op.gte]: startDate
            }
          }
        });
        
        const leaveDays = leaves.reduce((sum, leave) => sum + (leave.totalDays || 0), 0);
        
        // Attendance summary
        const attendance = {
          totalWorkingDays,
          presentDays,
          lopDays: Math.max(0, totalWorkingDays - presentDays - leaveDays),
          paidDays: presentDays + leaveDays,
          overtimeHours: options.overtimeHours || 0,
          weeklyOffs: 0,
          holidays: 0
        };
        
        // Calculate payslip using calculation service
        const calculation = payslipCalculationService.calculatePayslip(
          employee,
          employee.salaryStructure,
          attendance,
          options
        );
        
        if (!calculation.success) {
          errors.push({
            employeeId,
            message: calculation.error || 'Calculation failed'
          });
          continue;
        }
        
        // Generate payslip number
        const payslipNumber = `PS${year}${month.toString().padStart(2, '0')}${employee.employeeId}`;
        
        // Create company info
        const companyInfo = {
          name: 'Skyraksys Technologies',
          address: 'Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          pan: 'XXXXXX0000X',
          tan: 'MUMX00000X'
        };
        
        // Create employee info snapshot
        const employeeInfo = {
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          designation: employee.position?.name || 'N/A',
          department: employee.department?.name || 'N/A',
          dateOfJoining: employee.hireDate,
          panNumber: employee.panNumber,
          uanNumber: employee.uanNumber,
          pfNumber: employee.pfNumber,
          esiNumber: employee.esiNumber,
          bankAccountNumber: employee.bankAccountNumber,
          bankName: employee.bankName
        };
        
        // Create payslip
        const payslip = await Payslip.create({
          employeeId,
          month,
          year,
          payPeriod: `${getMonthName(month)} ${year}`,
          payPeriodStart: startDate,
          payPeriodEnd: endDate,
          templateId: template.id || null,
          templateVersion: '1.0',  // Fixed: template.version column doesn't exist
          employeeInfo,
          companyInfo,
          earnings: calculation.earnings,
          deductions: calculation.deductions,
          attendance: calculation.attendance,
          grossEarnings: calculation.grossSalary,
          totalDeductions: calculation.totalDeductions,
          netPay: calculation.netPay,
          netPayInWords: calculation.netPayInWords,
          payslipNumber,
          payDate: new Date(),
          generatedDate: new Date(),
          generatedBy: req.userId,
          status: 'draft',
          calculationDetails: calculation.calculationMetadata
        }, { transaction });
        
        generatedPayslips.push(payslip);
        
      } catch (empError) {
        console.error(`Error generating payslip for employee ${employeeId}:`, empError);
        errors.push({
          employeeId,
          message: empError.message
        });
      }
    }
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: `Generated ${generatedPayslips.length} payslip(s) successfully`,
      data: {
        payslips: generatedPayslips,
        errors: errors.length > 0 ? errors : undefined
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Generate payslips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payslips',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/payslips/generate-all
 * Generate payslips for all employees (Admin/HR only)
 */
router.post('/generate-all', isAdminOrHR, async (req, res) => {
  try {
    const { month, year, templateId, departmentId } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }
    
    // Get all active employees
    const where = { status: 'Active' };
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    const employees = await Employee.findAll({
      where,
      attributes: ['id']
    });
    
    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active employees found'
      });
    }
    
    const employeeIds = employees.map(e => e.id);
    
    // Forward to generate endpoint
    req.body = {
      employeeIds,
      month,
      year,
      templateId
    };
    req.validatedData = req.body;
    
    return router.handle(req, res);
    
  } catch (error) {
    console.error('Generate all payslips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payslips for all employees',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// PAYSLIP STATUS MANAGEMENT
// =====================================================

/**
 * PUT /api/payslips/:id/finalize
 * Finalize and lock payslip (Admin/HR only)
 */
router.put('/:id/finalize', isAdminOrHR, async (req, res) => {
  try {
    const payslip = await Payslip.findByPk(req.params.id);
    
    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }
    
    if (payslip.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft payslips can be finalized'
      });
    }
    
    await payslip.lock();
    
    res.json({
      success: true,
      message: 'Payslip finalized and locked successfully',
      data: payslip
    });
  } catch (error) {
    console.error('Finalize payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize payslip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/payslips/:id/mark-paid
 * Mark payslip as paid (Admin/HR only)
 */
router.put('/:id/mark-paid', isAdminOrHR, async (req, res) => {
  try {
    const payslip = await Payslip.findByPk(req.params.id);
    
    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }
    
    if (payslip.status !== 'finalized') {
      return res.status(400).json({
        success: false,
        message: 'Only finalized payslips can be marked as paid'
      });
    }
    
    await payslip.markAsPaid();
    
    res.json({
      success: true,
      message: 'Payslip marked as paid successfully',
      data: payslip
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payslip as paid',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/payslips/bulk-finalize
 * Finalize multiple payslips (Admin/HR only)
 */
router.put('/bulk-finalize', isAdminOrHR, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { payslipIds } = req.body;
    
    if (!Array.isArray(payslipIds) || payslipIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'payslipIds array is required'
      });
    }
    
    const payslips = await Payslip.findAll({
      where: {
        id: { [Op.in]: payslipIds },
        status: 'draft'
      }
    });
    
    for (const payslip of payslips) {
      await payslip.lock({ transaction });
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: `Finalized ${payslips.length} payslip(s) successfully`,
      data: { count: payslips.length }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Bulk finalize error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize payslips',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// PDF GENERATION & DOWNLOAD
// =====================================================

/**
 * GET /api/payslips/:id/pdf
 * Download payslip as PDF
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const payslip = await Payslip.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee'
        },
        {
          model: PayslipTemplate,
          as: 'template'
        }
      ]
    });
    
    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }
    
    // Permission check
    if (req.userRole === 'employee' && payslip.employeeId !== req.employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Generate PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${payslip.payslipNumber}.pdf"`);
    
    doc.pipe(res);
    
    // Generate PDF content
    generatePayslipPDF(doc, payslip);
    
    doc.end();
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// REPORTING & ANALYTICS
// =====================================================

/**
 * GET /api/payslips/reports/summary
 * Get payroll summary report (Admin/HR only)
 */
router.get('/reports/summary', isAdminOrHR, async (req, res) => {
  try {
    const { month, year, departmentId } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }
    
    const where = {
      month: parseInt(month),
      year: parseInt(year)
    };
    
    // Build query
    const payslips = await Payslip.findAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'departmentId'],
          ...(departmentId && {
            where: { departmentId }
          })
        }
      ]
    });
    
    // Calculate summary
    const summary = {
      totalPayslips: payslips.length,
      totalGrossEarnings: 0,
      totalDeductions: 0,
      totalNetPay: 0,
      statusBreakdown: {
        draft: 0,
        finalized: 0,
        paid: 0,
        cancelled: 0
      },
      departmentWise: {}
    };
    
    payslips.forEach(payslip => {
      summary.totalGrossEarnings += parseFloat(payslip.grossEarnings) || 0;
      summary.totalDeductions += parseFloat(payslip.totalDeductions) || 0;
      summary.totalNetPay += parseFloat(payslip.netPay) || 0;
      summary.statusBreakdown[payslip.status]++;
      
      const deptId = payslip.employee?.departmentId || 'Unknown';
      if (!summary.departmentWise[deptId]) {
        summary.departmentWise[deptId] = {
          count: 0,
          totalNetPay: 0
        };
      }
      summary.departmentWise[deptId].count++;
      summary.departmentWise[deptId].totalNetPay += parseFloat(payslip.netPay) || 0;
    });
    
    res.json({
      success: true,
      data: {
        period: `${getMonthName(month)} ${year}`,
        summary
      }
    });
    
  } catch (error) {
    console.error('Summary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate summary report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/payslips/reports/export
 * Export payslips to Excel (Admin/HR only)
 */
router.get('/reports/export', isAdminOrHR, async (req, res) => {
  try {
    const { month, year, format = 'xlsx' } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }
    
    const payslips = await Payslip.findAll({
      where: {
        month: parseInt(month),
        year: parseInt(year)
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['employeeId', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['employeeId', 'ASC']]
    });
    
    if (format === 'xlsx') {
      // Generate Excel file
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Payslips');
      
      // Headers
      worksheet.columns = [
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'Employee Name', key: 'employeeName', width: 25 },
        { header: 'Period', key: 'period', width: 15 },
        { header: 'Gross Earnings', key: 'grossEarnings', width: 15 },
        { header: 'Total Deductions', key: 'totalDeductions', width: 15 },
        { header: 'Net Pay', key: 'netPay', width: 15 },
        { header: 'Status', key: 'status', width: 12 }
      ];
      
      // Data rows
      payslips.forEach(payslip => {
        worksheet.addRow({
          employeeId: payslip.employee?.employeeId || '',
          employeeName: payslip.employeeInfo?.name || '',
          period: payslip.payPeriod,
          grossEarnings: parseFloat(payslip.grossEarnings) || 0,
          totalDeductions: parseFloat(payslip.totalDeductions) || 0,
          netPay: parseFloat(payslip.netPay) || 0,
          status: payslip.status
        });
      });
      
      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="payslips-${month}-${year}.xlsx"`);
      
      await workbook.xlsx.write(res);
      res.end();
      
    } else {
      // CSV format
      const csv = [
        ['Employee ID', 'Employee Name', 'Period', 'Gross Earnings', 'Total Deductions', 'Net Pay', 'Status'].join(','),
        ...payslips.map(p => [
          p.employee?.employeeId || '',
          `"${p.employeeInfo?.name || ''}"`,
          p.payPeriod,
          p.grossEarnings,
          p.totalDeductions,
          p.netPay,
          p.status
        ].join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payslips-${month}-${year}.csv"`);
      res.send(csv);
    }
    
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate working days in a month (excluding weekends)
 */
function calculateWorkingDaysInMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    
    // Exclude Sunday (0) and Saturday (6)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }
  
  return workingDays;
}

/**
 * Get month name from number
 */
function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}

/**
 * Generate payslip PDF content
 */
function generatePayslipPDF(doc, payslip) {
  const marginLeft = 50;
  const marginRight = 550;
  let y = 50;
  
  // Company Header
  doc.fontSize(20).text(payslip.companyInfo?.name || 'Company Name', marginLeft, y, { continued: false });
  y += 25;
  
  doc.fontSize(10).text(payslip.companyInfo?.address || '', marginLeft, y);
  y += 40;
  
  // Title
  doc.fontSize(16).text('PAYSLIP', marginLeft, y, { align: 'center', width: 500 });
  y += 30;
  
  // Period and Employee Info
  doc.fontSize(11).font('Helvetica');
  doc.text(`Pay Period: ${payslip.payPeriod}`, marginLeft, y);
  doc.text(`Payslip No: ${payslip.payslipNumber}`, marginRight - 150, y);
  y += 20;
  
  doc.text(`Employee ID: ${payslip.employeeInfo?.employeeId || ''}`, marginLeft, y);
  y += 15;
  doc.text(`Employee Name: ${payslip.employeeInfo?.name || ''}`, marginLeft, y);
  y += 15;
  doc.text(`Designation: ${payslip.employeeInfo?.designation || ''}`, marginLeft, y);
  y += 15;
  doc.text(`Department: ${payslip.employeeInfo?.department || ''}`, marginLeft, y);
  y += 30;
  
  // Earnings and Deductions Table
  const tableTop = y;
  const col1 = marginLeft;
  const col2 = 250;
  const col3 = 350;
  const col4 = 450;
  
  // Table Header
  doc.fontSize(11);
  doc.rect(col1, y, 500, 25).fillAndStroke('#f0f0f0', '#000');
  doc.fillColor('#000').text('Earnings', col1 + 5, y + 8);
  doc.text('Amount', col2 + 5, y + 8);
  doc.text('Deductions', col3 + 5, y + 8);
  doc.text('Amount', col4 + 5, y + 8);
  y += 25;
  
  // Table Content
  doc.font('Helvetica').fontSize(10);
  const earnings = payslip.earnings || {};
  const deductions = payslip.deductions || {};
  
  const earningsArray = Object.entries(earnings).filter(([k, v]) => v > 0);
  const deductionsArray = Object.entries(deductions).filter(([k, v]) => v > 0);
  const maxRows = Math.max(earningsArray.length, deductionsArray.length);
  
  for (let i = 0; i < maxRows; i++) {
    const rowHeight = 20;
    
    // Earnings
    if (i < earningsArray.length) {
      const [key, value] = earningsArray[i];
      const label = formatLabel(key);
      doc.text(label, col1 + 5, y + 5, { width: 200 });
      doc.text(`₹${parseFloat(value).toFixed(2)}`, col2 + 5, y + 5);
    }
    
    // Deductions
    if (i < deductionsArray.length) {
      const [key, value] = deductionsArray[i];
      const label = formatLabel(key);
      doc.text(label, col3 + 5, y + 5, { width: 90 });
      doc.text(`₹${parseFloat(value).toFixed(2)}`, col4 + 5, y + 5);
    }
    
    doc.rect(col1, y, 500, rowHeight).stroke('#ddd');
    y += rowHeight;
  }
  
  // Totals
  y += 10;
  doc.fontSize(11);
  doc.rect(col1, y, 500, 25).fillAndStroke('#e0e0e0', '#000');
  doc.fillColor('#000').text('Gross Earnings', col1 + 5, y + 8);
  doc.text(`₹${parseFloat(payslip.grossEarnings).toFixed(2)}`, col2 + 5, y + 8);
  doc.text('Total Deductions', col3 + 5, y + 8);
  doc.text(`₹${parseFloat(payslip.totalDeductions).toFixed(2)}`, col4 + 5, y + 8);
  y += 35;
  
  // Net Pay
  doc.fontSize(14);
  doc.rect(col1, y, 500, 30).fillAndStroke('#4CAF50', '#000');
  doc.fillColor('#fff').text('NET PAY', col1 + 5, y + 10);
  doc.text(`₹${parseFloat(payslip.netPay).toFixed(2)}`, col4 + 5, y + 10);
  y += 40;
  
  // Net Pay in Words
  doc.fillColor('#000').fontSize(10);
  doc.text(`Amount in words: ${payslip.netPayInWords}`, marginLeft, y);
  y += 30;
  
  // Attendance (if available)
  if (payslip.attendance) {
    doc.fontSize(11);
    doc.text('Attendance Summary:', marginLeft, y);
    y += 15;
    doc.fontSize(10);
    doc.text(`Working Days: ${payslip.attendance.totalWorkingDays || 0}`, marginLeft + 20, y);
    doc.text(`Present: ${payslip.attendance.presentDays || 0}`, marginLeft + 200, y);
    doc.text(`LOP: ${payslip.attendance.lopDays || 0}`, marginLeft + 350, y);
    y += 30;
  }
  
  // Footer
  doc.fontSize(9).font('Helvetica')
     .text('This is a computer-generated payslip and does not require a signature.', marginLeft, y, {
       align: 'center',
       width: 500
     });
}

/**
 * Format field label for display
 */
function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// =====================================================
// BULK OPERATIONS
// =====================================================

/**
 * POST /api/payslips/bulk-finalize
 * Finalize multiple payslips at once (admin/HR only)
 */
router.post('/bulk-finalize', isAdminOrHR, async (req, res) => {
  try {
    const { payslipIds } = req.body;
    
    // Validation
    if (!Array.isArray(payslipIds) || payslipIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'payslipIds array is required and cannot be empty'
      });
    }
    
    // Find all draft payslips with the provided IDs
    const payslips = await Payslip.findAll({
      where: {
        id: { [Op.in]: payslipIds },
        status: 'draft'
      }
    });
    
    if (payslips.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No draft payslips found with the provided IDs',
        successCount: 0,
        failedCount: payslipIds.length
      });
    }
    
    // Bulk update status to finalized
    await Payslip.update(
      {
        status: 'finalized',
        finalizedAt: new Date(),
        finalizedBy: req.userId
      },
      {
        where: { id: { [Op.in]: payslips.map(p => p.id) } }
      }
    );
    
    const successCount = payslips.length;
    const failedCount = payslipIds.length - successCount;
    
    res.json({
      success: true,
      message: `${successCount} payslip(s) finalized successfully`,
      successCount,
      failedCount,
      data: { finalizedIds: payslips.map(p => p.id) }
    });
  } catch (error) {
    console.error('Bulk finalize error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize payslips',
      error: error.message
    });
  }
});

/**
 * POST /api/payslips/bulk-paid
 * Mark multiple payslips as paid (admin/HR only)
 */
router.post('/bulk-paid', isAdminOrHR, async (req, res) => {
  try {
    const { payslipIds, paymentDate, paymentMethod, paymentReference } = req.body;
    
    // Validation
    if (!Array.isArray(payslipIds) || payslipIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'payslipIds array is required and cannot be empty'
      });
    }
    
    // Find all finalized payslips (only finalized can be marked as paid)
    const payslips = await Payslip.findAll({
      where: {
        id: { [Op.in]: payslipIds },
        status: 'finalized'
      }
    });
    
    if (payslips.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No finalized payslips found. Only finalized payslips can be marked as paid.',
        successCount: 0,
        failedCount: payslipIds.length
      });
    }
    
    // Bulk update to paid
    await Payslip.update(
      {
        status: 'paid',
        paidAt: paymentDate || new Date(),
        paidBy: req.userId,
        paymentMethod: paymentMethod || 'Bank Transfer',
        paymentReference: paymentReference || null
      },
      {
        where: { id: { [Op.in]: payslips.map(p => p.id) } }
      }
    );
    
    const successCount = payslips.length;
    const failedCount = payslipIds.length - successCount;
    
    res.json({
      success: true,
      message: `${successCount} payslip(s) marked as paid`,
      successCount,
      failedCount,
      data: { paidIds: payslips.map(p => p.id) }
    });
  } catch (error) {
    console.error('Bulk mark paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payslips as paid',
      error: error.message
    });
  }
});

/**
 * DELETE /api/payslips/bulk
 * Delete multiple payslips (draft only, admin/HR only)
 */
router.delete('/bulk', isAdminOrHR, async (req, res) => {
  try {
    const { payslipIds } = req.body;
    
    // Validation
    if (!Array.isArray(payslipIds) || payslipIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'payslipIds array is required and cannot be empty'
      });
    }
    
    // Only allow deleting draft payslips (safety measure)
    const deletedCount = await Payslip.destroy({
      where: {
        id: { [Op.in]: payslipIds },
        status: 'draft' // Safety: only drafts can be deleted
      }
    });
    
    const failedCount = payslipIds.length - deletedCount;
    
    res.json({
      success: true,
      message: `${deletedCount} payslip(s) deleted successfully`,
      successCount: deletedCount,
      failedCount,
      data: { deletedCount }
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payslips',
      error: error.message
    });
  }
});

module.exports = router;
