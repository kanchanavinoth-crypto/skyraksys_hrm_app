const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { PayrollData, Employee, SalaryStructure } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');
const csv = require('csv-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

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

// GET /api/payroll-data - Get all payroll data with filters
router.get('/', 
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020, max: 2030 }),
    query('employeeId').optional().isInt(),
    query('status').optional().isIn(['draft', 'submitted', 'approved', 'rejected']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        month,
        year,
        employeeId,
        status,
        page = 1,
        limit = 20
      } = req.query;

      const where = {};
      
      if (month) where.month = month;
      if (year) where.year = year;
      if (employeeId) where.employeeId = employeeId;
      if (status) where.status = status;

      const offset = (page - 1) * limit;

      const { count, rows: payrollData } = await PayrollData.findAndCountAll({
        where,
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'firstName', 'lastName', 'employeeId', 'email', 'department', 'position']
          },
          {
            model: SalaryStructure,
            as: 'salaryStructure',
            attributes: ['id', 'ctc', 'grossSalary', 'netSalary']
          }
        ],
        order: [['year', 'DESC'], ['month', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          payrollData,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payroll data',
        error: error.message
      });
    }
  }
);

// GET /api/payroll-data/employee/:employeeId - Get payroll data for specific employee
router.get('/employee/:employeeId',
  authenticateToken,
  authorize(['admin', 'hr', 'employee']),
  [param('employeeId').isInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      // Employee can only view their own payroll data
      if (req.user.role === 'employee' && 
          req.user.employeeId !== parseInt(employeeId) && 
          req.user.id !== parseInt(employeeId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const payrollData = await PayrollData.findAll({
        where: { employeeId },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'firstName', 'lastName', 'employeeId', 'email', 'department', 'position']
          },
          {
            model: SalaryStructure,
            as: 'salaryStructure',
            attributes: ['id', 'ctc', 'grossSalary', 'netSalary']
          }
        ],
        order: [['year', 'DESC'], ['month', 'DESC']]
      });

      res.json({
        success: true,
        data: payrollData
      });
    } catch (error) {
      console.error('Error fetching employee payroll data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employee payroll data',
        error: error.message
      });
    }
  }
);

// GET /api/payroll-data/:id - Get single payroll data
router.get('/:id',
  authenticateToken,
  authorize(['admin', 'hr', 'employee']),
  [param('id').isInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const payrollData = await PayrollData.findByPk(id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'firstName', 'lastName', 'employeeId', 'email', 'department', 'position']
          },
          {
            model: SalaryStructure,
            as: 'salaryStructure'
          }
        ]
      });

      if (!payrollData) {
        return res.status(404).json({
          success: false,
          message: 'Payroll data not found'
        });
      }

      // Employee can only view their own payroll data
      if (req.user.role === 'employee' && 
          req.user.employeeId !== payrollData.employeeId && 
          req.user.id !== payrollData.employeeId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: payrollData
      });
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payroll data',
        error: error.message
      });
    }
  }
);

// POST /api/payroll-data - Create new payroll data
router.post('/',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    body('employeeId').isInt(),
    body('month').isInt({ min: 1, max: 12 }),
    body('year').isInt({ min: 2020, max: 2030 }),
    body('salaryStructureId').isInt(),
    body('earnings').isObject(),
    body('deductions').isObject(),
    body('attendance').isObject(),
    body('workingDays').isInt({ min: 1, max: 31 }),
    body('presentDays').isInt({ min: 0, max: 31 }),
    body('lopDays').optional().isInt({ min: 0, max: 31 }),
    body('overtimeHours').optional().isDecimal({ min: 0 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        employeeId,
        month,
        year,
        salaryStructureId,
        earnings,
        deductions,
        attendance,
        workingDays,
        presentDays,
        lopDays = 0,
        overtimeHours = 0,
        remarks
      } = req.body;

      // Check if payroll data already exists for this employee and month
      const existingPayrollData = await PayrollData.findOne({
        where: { employeeId, month, year }
      });

      if (existingPayrollData) {
        return res.status(400).json({
          success: false,
          message: 'Payroll data already exists for this employee and month'
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

      // Verify salary structure exists and belongs to the employee
      const salaryStructure = await SalaryStructure.findOne({
        where: { 
          id: salaryStructureId,
          employeeId,
          isActive: true
        }
      });

      if (!salaryStructure) {
        return res.status(404).json({
          success: false,
          message: 'Active salary structure not found for this employee'
        });
      }

      // Calculate totals
      const grossEarnings = Object.values(earnings).reduce((sum, amount) => sum + parseFloat(amount || 0), 0);
      const totalDeductions = Object.values(deductions).reduce((sum, amount) => sum + parseFloat(amount || 0), 0);
      const netPay = grossEarnings - totalDeductions;

      const payrollData = await PayrollData.create({
        employeeId,
        month,
        year,
        salaryStructureId,
        earnings,
        deductions,
        attendance: {
          ...attendance,
          workingDays,
          presentDays,
          lopDays,
          overtimeHours
        },
        grossEarnings,
        totalDeductions,
        netPay,
        workingDays,
        presentDays,
        lopDays,
        overtimeHours,
        remarks,
        status: 'draft',
        createdBy: req.user.id
      });

      // Fetch complete payroll data with associations
      const completePayrollData = await PayrollData.findByPk(payrollData.id, {
        include: [
          { model: Employee, as: 'employee' },
          { model: SalaryStructure, as: 'salaryStructure' }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Payroll data created successfully',
        data: completePayrollData
      });
    } catch (error) {
      console.error('Error creating payroll data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payroll data',
        error: error.message
      });
    }
  }
);

// PUT /api/payroll-data/:id - Update payroll data
router.put('/:id',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    param('id').isInt(),
    body('earnings').optional().isObject(),
    body('deductions').optional().isObject(),
    body('attendance').optional().isObject(),
    body('workingDays').optional().isInt({ min: 1, max: 31 }),
    body('presentDays').optional().isInt({ min: 0, max: 31 }),
    body('lopDays').optional().isInt({ min: 0, max: 31 }),
    body('overtimeHours').optional().isDecimal({ min: 0 }),
    body('status').optional().isIn(['draft', 'submitted', 'approved', 'rejected']),
    body('remarks').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const payrollData = await PayrollData.findByPk(id);
      if (!payrollData) {
        return res.status(404).json({
          success: false,
          message: 'Payroll data not found'
        });
      }

      // Check if payroll data can be modified
      if (payrollData.status === 'approved' && !req.body.forceUpdate) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify approved payroll data'
        });
      }

      // Recalculate totals if earnings or deductions changed
      if (updateData.earnings || updateData.deductions) {
        const earnings = updateData.earnings || payrollData.earnings;
        const deductions = updateData.deductions || payrollData.deductions;
        
        updateData.grossEarnings = Object.values(earnings).reduce((sum, amount) => sum + parseFloat(amount || 0), 0);
        updateData.totalDeductions = Object.values(deductions).reduce((sum, amount) => sum + parseFloat(amount || 0), 0);
        updateData.netPay = updateData.grossEarnings - updateData.totalDeductions;
      }

      // Update attendance object if individual fields changed
      if (updateData.workingDays || updateData.presentDays || updateData.lopDays || updateData.overtimeHours) {
        updateData.attendance = {
          ...payrollData.attendance,
          workingDays: updateData.workingDays || payrollData.workingDays,
          presentDays: updateData.presentDays || payrollData.presentDays,
          lopDays: updateData.lopDays || payrollData.lopDays,
          overtimeHours: updateData.overtimeHours || payrollData.overtimeHours
        };
      }

      updateData.updatedBy = req.user.id;
      await payrollData.update(updateData);

      // Fetch updated payroll data with associations
      const updatedPayrollData = await PayrollData.findByPk(id, {
        include: [
          { model: Employee, as: 'employee' },
          { model: SalaryStructure, as: 'salaryStructure' }
        ]
      });

      res.json({
        success: true,
        message: 'Payroll data updated successfully',
        data: updatedPayrollData
      });
    } catch (error) {
      console.error('Error updating payroll data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payroll data',
        error: error.message
      });
    }
  }
);

// POST /api/payroll-data/:id/submit - Submit payroll data for approval
router.post('/:id/submit',
  authenticateToken,
  authorize(['admin', 'hr']),
  [param('id').isInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const payrollData = await PayrollData.findByPk(id);
      if (!payrollData) {
        return res.status(404).json({
          success: false,
          message: 'Payroll data not found'
        });
      }

      if (payrollData.status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: `Cannot submit payroll data with status: ${payrollData.status}`
        });
      }

      await payrollData.update({
        status: 'submitted',
        submittedAt: new Date(),
        submittedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Payroll data submitted for approval',
        data: payrollData
      });
    } catch (error) {
      console.error('Error submitting payroll data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit payroll data',
        error: error.message
      });
    }
  }
);

// POST /api/payroll-data/:id/approve - Approve payroll data
router.post('/:id/approve',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    param('id').isInt(),
    body('approvalRemarks').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { approvalRemarks } = req.body;
      
      const payrollData = await PayrollData.findByPk(id);
      if (!payrollData) {
        return res.status(404).json({
          success: false,
          message: 'Payroll data not found'
        });
      }

      if (payrollData.status !== 'submitted') {
        return res.status(400).json({
          success: false,
          message: `Cannot approve payroll data with status: ${payrollData.status}`
        });
      }

      await payrollData.update({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user.id,
        approvalRemarks
      });

      res.json({
        success: true,
        message: 'Payroll data approved successfully',
        data: payrollData
      });
    } catch (error) {
      console.error('Error approving payroll data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve payroll data',
        error: error.message
      });
    }
  }
);

// POST /api/payroll-data/:id/reject - Reject payroll data
router.post('/:id/reject',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    param('id').isInt(),
    body('rejectionRemarks').notEmpty().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectionRemarks } = req.body;
      
      const payrollData = await PayrollData.findByPk(id);
      if (!payrollData) {
        return res.status(404).json({
          success: false,
          message: 'Payroll data not found'
        });
      }

      if (payrollData.status !== 'submitted') {
        return res.status(400).json({
          success: false,
          message: `Cannot reject payroll data with status: ${payrollData.status}`
        });
      }

      await payrollData.update({
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: req.user.id,
        rejectionRemarks
      });

      res.json({
        success: true,
        message: 'Payroll data rejected',
        data: payrollData
      });
    } catch (error) {
      console.error('Error rejecting payroll data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject payroll data',
        error: error.message
      });
    }
  }
);

// POST /api/payroll-data/bulk-approve - Bulk approve payroll data
router.post('/bulk-approve',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    body('payrollDataIds').isArray().notEmpty(),
    body('approvalRemarks').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { payrollDataIds, approvalRemarks } = req.body;
      
      const payrollDataList = await PayrollData.findAll({
        where: { 
          id: { [Op.in]: payrollDataIds },
          status: 'submitted'
        }
      });

      if (payrollDataList.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No submitted payroll data found for approval'
        });
      }

      await PayrollData.update(
        {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: req.user.id,
          approvalRemarks
        },
        {
          where: { 
            id: { [Op.in]: payrollDataList.map(pd => pd.id) }
          }
        }
      );

      res.json({
        success: true,
        message: `Successfully approved ${payrollDataList.length} payroll records`,
        data: { approvedCount: payrollDataList.length }
      });
    } catch (error) {
      console.error('Error bulk approving payroll data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk approve payroll data',
        error: error.message
      });
    }
  }
);

// POST /api/payroll-data/import-csv - Import payroll data from CSV
router.post('/import-csv',
  authenticateToken,
  authorize(['admin', 'hr']),
  upload.single('csvFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CSV file uploaded'
        });
      }

      const results = [];
      const errors = [];
      
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            const createdPayrollData = [];
            
            for (const row of results) {
              try {
                // Validate required fields
                if (!row.employeeId || !row.month || !row.year) {
                  errors.push({
                    row: results.indexOf(row) + 1,
                    error: 'Missing required fields: employeeId, month, year'
                  });
                  continue;
                }

                // Check if employee exists
                const employee = await Employee.findOne({
                  where: { employeeId: row.employeeId }
                });

                if (!employee) {
                  errors.push({
                    row: results.indexOf(row) + 1,
                    error: `Employee with ID ${row.employeeId} not found`
                  });
                  continue;
                }

                // Get active salary structure
                const salaryStructure = await SalaryStructure.findOne({
                  where: { 
                    employeeId: employee.id,
                    isActive: true
                  },
                  order: [['effectiveDate', 'DESC']]
                });

                if (!salaryStructure) {
                  errors.push({
                    row: results.indexOf(row) + 1,
                    error: `No active salary structure found for employee ${row.employeeId}`
                  });
                  continue;
                }

                // Parse earnings and deductions
                const earnings = {};
                const deductions = {};
                
                Object.keys(row).forEach(key => {
                  if (key.startsWith('earning_')) {
                    const earningKey = key.replace('earning_', '');
                    earnings[earningKey] = parseFloat(row[key]) || 0;
                  } else if (key.startsWith('deduction_')) {
                    const deductionKey = key.replace('deduction_', '');
                    deductions[deductionKey] = parseFloat(row[key]) || 0;
                  }
                });

                // Calculate totals
                const grossEarnings = Object.values(earnings).reduce((sum, amount) => sum + amount, 0);
                const totalDeductions = Object.values(deductions).reduce((sum, amount) => sum + amount, 0);

                const payrollData = await PayrollData.create({
                  employeeId: employee.id,
                  month: parseInt(row.month),
                  year: parseInt(row.year),
                  salaryStructureId: salaryStructure.id,
                  earnings,
                  deductions,
                  attendance: {
                    workingDays: parseInt(row.workingDays) || 21,
                    presentDays: parseInt(row.presentDays) || 21,
                    lopDays: parseInt(row.lopDays) || 0,
                    overtimeHours: parseFloat(row.overtimeHours) || 0
                  },
                  grossEarnings,
                  totalDeductions,
                  netPay: grossEarnings - totalDeductions,
                  workingDays: parseInt(row.workingDays) || 21,
                  presentDays: parseInt(row.presentDays) || 21,
                  lopDays: parseInt(row.lopDays) || 0,
                  overtimeHours: parseFloat(row.overtimeHours) || 0,
                  remarks: row.remarks,
                  status: 'draft',
                  createdBy: req.user.id
                });

                createdPayrollData.push(payrollData);
              } catch (error) {
                errors.push({
                  row: results.indexOf(row) + 1,
                  error: error.message
                });
              }
            }

            // Clean up uploaded file
            fs.unlinkSync(req.file.path);

            res.json({
              success: true,
              message: `Successfully imported ${createdPayrollData.length} payroll records`,
              data: {
                imported: createdPayrollData.length,
                errors: errors.length,
                errorDetails: errors
              }
            });
          } catch (error) {
            console.error('Error processing CSV:', error);
            res.status(500).json({
              success: false,
              message: 'Failed to process CSV file',
              error: error.message
            });
          }
        })
        .on('error', (error) => {
          console.error('Error reading CSV:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to read CSV file',
            error: error.message
          });
        });
    } catch (error) {
      console.error('Error importing CSV:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import CSV',
        error: error.message
      });
    }
  }
);

// GET /api/payroll-data/export-csv - Export payroll data to CSV
router.get('/export-csv',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020, max: 2030 }),
    query('status').optional().isIn(['draft', 'submitted', 'approved', 'rejected'])
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { month, year, status } = req.query;
      
      const where = {};
      if (month) where.month = month;
      if (year) where.year = year;
      if (status) where.status = status;

      const payrollData = await PayrollData.findAll({
        where,
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['employeeId', 'firstName', 'lastName', 'email', 'department', 'position']
          }
        ],
        order: [['year', 'DESC'], ['month', 'DESC']]
      });

      // Convert to CSV format
      const csvHeader = [
        'Employee ID', 'Employee Name', 'Department', 'Position',
        'Month', 'Year', 'Status',
        'Gross Earnings', 'Total Deductions', 'Net Pay',
        'Working Days', 'Present Days', 'LOP Days', 'Overtime Hours'
      ];

      const csvRows = payrollData.map(pd => [
        pd.employee.employeeId,
        `${pd.employee.firstName} ${pd.employee.lastName}`,
        pd.employee.department || '',
        pd.employee.position || '',
        pd.month,
        pd.year,
        pd.status,
        pd.grossEarnings,
        pd.totalDeductions,
        pd.netPay,
        pd.workingDays,
        pd.presentDays,
        pd.lopDays,
        pd.overtimeHours
      ]);

      const csvContent = [csvHeader, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const filename = `payroll_data_${year || 'all'}_${month || 'all'}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export CSV',
        error: error.message
      });
    }
  }
);

// DELETE /api/payroll-data/:id - Delete payroll data
router.delete('/:id',
  authenticateToken,
  authorize(['admin']),
  [param('id').isInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const payrollData = await PayrollData.findByPk(id);
      if (!payrollData) {
        return res.status(404).json({
          success: false,
          message: 'Payroll data not found'
        });
      }

      if (payrollData.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete approved payroll data'
        });
      }

      await payrollData.destroy();

      res.json({
        success: true,
        message: 'Payroll data deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting payroll data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payroll data',
        error: error.message
      });
    }
  }
);

module.exports = router;
