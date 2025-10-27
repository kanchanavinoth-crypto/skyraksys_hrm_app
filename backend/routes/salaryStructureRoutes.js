const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { SalaryStructure, Employee } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

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

// GET /api/salary-structures - Get all salary structures
router.get('/', 
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    query('employeeId').optional().isInt(),
    query('isActive').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        employeeId,
        isActive,
        page = 1,
        limit = 20
      } = req.query;

      const where = {};
      
      if (employeeId) where.employeeId = employeeId;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const offset = (page - 1) * limit;

      const { count, rows: salaryStructures } = await SalaryStructure.findAndCountAll({
        where,
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'firstName', 'lastName', 'employeeId', 'email', 'department', 'position']
          }
        ],
        order: [['effectiveDate', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          salaryStructures,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching salary structures:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch salary structures',
        error: error.message
      });
    }
  }
);

// GET /api/salary-structures/employee/:employeeId - Get salary structures for specific employee
router.get('/employee/:employeeId',
  authenticateToken,
  authorize(['admin', 'hr', 'employee']),
  [param('employeeId').isInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      // Employee can only view their own salary structure
      if (req.user.role === 'employee' && 
          req.user.employeeId !== parseInt(employeeId) && 
          req.user.id !== parseInt(employeeId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const salaryStructures = await SalaryStructure.findAll({
        where: { employeeId },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'firstName', 'lastName', 'employeeId', 'email', 'department', 'position']
          }
        ],
        order: [['effectiveDate', 'DESC']]
      });

      res.json({
        success: true,
        data: salaryStructures
      });
    } catch (error) {
      console.error('Error fetching employee salary structures:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employee salary structures',
        error: error.message
      });
    }
  }
);

// GET /api/salary-structures/employee/:employeeId/current - Get current active salary structure
router.get('/employee/:employeeId/current',
  authenticateToken,
  authorize(['admin', 'hr', 'employee']),
  [param('employeeId').isInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      // Employee can only view their own salary structure
      if (req.user.role === 'employee' && 
          req.user.employeeId !== parseInt(employeeId) && 
          req.user.id !== parseInt(employeeId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const currentSalaryStructure = await SalaryStructure.findOne({
        where: { 
          employeeId,
          isActive: true,
          effectiveDate: {
            [Op.lte]: new Date()
          }
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'firstName', 'lastName', 'employeeId', 'email', 'department', 'position']
          }
        ],
        order: [['effectiveDate', 'DESC']]
      });

      if (!currentSalaryStructure) {
        return res.status(404).json({
          success: false,
          message: 'No active salary structure found for this employee'
        });
      }

      res.json({
        success: true,
        data: currentSalaryStructure
      });
    } catch (error) {
      console.error('Error fetching current salary structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch current salary structure',
        error: error.message
      });
    }
  }
);

// GET /api/salary-structures/:id - Get single salary structure
router.get('/:id',
  authenticateToken,
  authorize(['admin', 'hr', 'employee']),
  [param('id').isInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const salaryStructure = await SalaryStructure.findByPk(id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'firstName', 'lastName', 'employeeId', 'email', 'department', 'position']
          }
        ]
      });

      if (!salaryStructure) {
        return res.status(404).json({
          success: false,
          message: 'Salary structure not found'
        });
      }

      // Employee can only view their own salary structure
      if (req.user.role === 'employee' && 
          req.user.employeeId !== salaryStructure.employeeId && 
          req.user.id !== salaryStructure.employeeId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: salaryStructure
      });
    } catch (error) {
      console.error('Error fetching salary structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch salary structure',
        error: error.message
      });
    }
  }
);

// POST /api/salary-structures - Create new salary structure
router.post('/',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    body('employeeId').isInt(),
    body('earnings').isObject(),
    body('deductions').isObject(),
    body('effectiveDate').isISO8601(),
    body('ctc').isDecimal(),
    body('grossSalary').isDecimal(),
    body('netSalary').isDecimal(),
    body('payrollFrequency').isIn(['monthly', 'biweekly', 'weekly']),
    body('remarks').optional().isString().isLength({ max: 500 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        employeeId,
        earnings,
        deductions,
        effectiveDate,
        ctc,
        grossSalary,
        netSalary,
        payrollFrequency,
        remarks
      } = req.body;

      // Check if employee exists
      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Deactivate previous salary structures for this employee
      await SalaryStructure.update(
        { isActive: false, deactivatedDate: new Date() },
        { 
          where: { 
            employeeId,
            isActive: true,
            effectiveDate: { [Op.lt]: effectiveDate }
          }
        }
      );

      const salaryStructure = await SalaryStructure.create({
        employeeId,
        earnings,
        deductions,
        effectiveDate,
        ctc,
        grossSalary,
        netSalary,
        payrollFrequency,
        remarks,
        isActive: true,
        createdBy: req.user.id
      });

      // Fetch the complete salary structure with employee details
      const completeSalaryStructure = await SalaryStructure.findByPk(salaryStructure.id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'firstName', 'lastName', 'employeeId', 'email', 'department', 'position']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Salary structure created successfully',
        data: completeSalaryStructure
      });
    } catch (error) {
      console.error('Error creating salary structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create salary structure',
        error: error.message
      });
    }
  }
);

// PUT /api/salary-structures/:id - Update salary structure
router.put('/:id',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    param('id').isInt(),
    body('earnings').optional().isObject(),
    body('deductions').optional().isObject(),
    body('effectiveDate').optional().isISO8601(),
    body('ctc').optional().isDecimal(),
    body('grossSalary').optional().isDecimal(),
    body('netSalary').optional().isDecimal(),
    body('payrollFrequency').optional().isIn(['monthly', 'biweekly', 'weekly']),
    body('remarks').optional().isString().isLength({ max: 500 }),
    body('isActive').optional().isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const salaryStructure = await SalaryStructure.findByPk(id);
      if (!salaryStructure) {
        return res.status(404).json({
          success: false,
          message: 'Salary structure not found'
        });
      }

      // If updating effective date and making it active, deactivate other active structures
      if (updateData.effectiveDate && updateData.isActive !== false) {
        await SalaryStructure.update(
          { isActive: false, deactivatedDate: new Date() },
          { 
            where: { 
              employeeId: salaryStructure.employeeId,
              isActive: true,
              id: { [Op.ne]: id },
              effectiveDate: { [Op.lt]: updateData.effectiveDate }
            }
          }
        );
      }

      updateData.updatedBy = req.user.id;
      await salaryStructure.update(updateData);

      // Fetch updated salary structure with employee details
      const updatedSalaryStructure = await SalaryStructure.findByPk(id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'firstName', 'lastName', 'employeeId', 'email', 'department', 'position']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Salary structure updated successfully',
        data: updatedSalaryStructure
      });
    } catch (error) {
      console.error('Error updating salary structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update salary structure',
        error: error.message
      });
    }
  }
);

// POST /api/salary-structures/:id/deactivate - Deactivate salary structure
router.post('/:id/deactivate',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    param('id').isInt(),
    body('deactivatedDate').optional().isISO8601(),
    body('remarks').optional().isString().isLength({ max: 500 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { deactivatedDate, remarks } = req.body;

      const salaryStructure = await SalaryStructure.findByPk(id);
      if (!salaryStructure) {
        return res.status(404).json({
          success: false,
          message: 'Salary structure not found'
        });
      }

      if (!salaryStructure.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Salary structure is already deactivated'
        });
      }

      await salaryStructure.update({
        isActive: false,
        deactivatedDate: deactivatedDate || new Date(),
        remarks: remarks || salaryStructure.remarks,
        updatedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Salary structure deactivated successfully',
        data: salaryStructure
      });
    } catch (error) {
      console.error('Error deactivating salary structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate salary structure',
        error: error.message
      });
    }
  }
);

// POST /api/salary-structures/:id/activate - Activate salary structure
router.post('/:id/activate',
  authenticateToken,
  authorize(['admin', 'hr']),
  [param('id').isInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const salaryStructure = await SalaryStructure.findByPk(id);
      if (!salaryStructure) {
        return res.status(404).json({
          success: false,
          message: 'Salary structure not found'
        });
      }

      if (salaryStructure.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Salary structure is already active'
        });
      }

      // Deactivate other active salary structures for this employee
      await SalaryStructure.update(
        { isActive: false, deactivatedDate: new Date() },
        { 
          where: { 
            employeeId: salaryStructure.employeeId,
            isActive: true,
            id: { [Op.ne]: id }
          }
        }
      );

      await salaryStructure.update({
        isActive: true,
        deactivatedDate: null,
        updatedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Salary structure activated successfully',
        data: salaryStructure
      });
    } catch (error) {
      console.error('Error activating salary structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate salary structure',
        error: error.message
      });
    }
  }
);

// POST /api/salary-structures/bulk-create - Create multiple salary structures
router.post('/bulk-create',
  authenticateToken,
  authorize(['admin', 'hr']),
  [
    body('salaryStructures').isArray().notEmpty(),
    body('salaryStructures.*.employeeId').isInt(),
    body('salaryStructures.*.earnings').isObject(),
    body('salaryStructures.*.deductions').isObject(),
    body('salaryStructures.*.effectiveDate').isISO8601(),
    body('salaryStructures.*.ctc').isDecimal(),
    body('salaryStructures.*.grossSalary').isDecimal(),
    body('salaryStructures.*.netSalary').isDecimal()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { salaryStructures } = req.body;
      const createdStructures = [];
      const errors = [];

      for (const structureData of salaryStructures) {
        try {
          // Check if employee exists
          const employee = await Employee.findByPk(structureData.employeeId);
          if (!employee) {
            errors.push({
              employeeId: structureData.employeeId,
              error: 'Employee not found'
            });
            continue;
          }

          // Deactivate previous salary structures
          await SalaryStructure.update(
            { isActive: false, deactivatedDate: new Date() },
            { 
              where: { 
                employeeId: structureData.employeeId,
                isActive: true,
                effectiveDate: { [Op.lt]: structureData.effectiveDate }
              }
            }
          );

          const salaryStructure = await SalaryStructure.create({
            ...structureData,
            isActive: true,
            createdBy: req.user.id
          });

          createdStructures.push(salaryStructure);
        } catch (error) {
          errors.push({
            employeeId: structureData.employeeId,
            error: error.message
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Successfully created ${createdStructures.length} salary structures`,
        data: {
          created: createdStructures,
          errors: errors
        }
      });
    } catch (error) {
      console.error('Error creating bulk salary structures:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create bulk salary structures',
        error: error.message
      });
    }
  }
);

// DELETE /api/salary-structures/:id - Delete salary structure (soft delete)
router.delete('/:id',
  authenticateToken,
  authorize(['admin']),
  [param('id').isInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const salaryStructure = await SalaryStructure.findByPk(id);
      if (!salaryStructure) {
        return res.status(404).json({
          success: false,
          message: 'Salary structure not found'
        });
      }

      // Check if salary structure is used in any payroll data
      const { PayrollData } = require('../models');
      const payrollDataCount = await PayrollData.count({
        where: { 
          employeeId: salaryStructure.employeeId,
          createdAt: { [Op.gte]: salaryStructure.effectiveDate }
        }
      });

      if (payrollDataCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete salary structure. It is referenced by payroll data.'
        });
      }

      await salaryStructure.destroy();

      res.json({
        success: true,
        message: 'Salary structure deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting salary structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete salary structure',
        error: error.message
      });
    }
  }
);

// GET /api/salary-structures/employee/:employeeId/history - Get salary history
router.get('/employee/:employeeId/history',
  authenticateToken,
  authorize(['admin', 'hr', 'employee']),
  [param('employeeId').isInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      // Employee can only view their own salary history
      if (req.user.role === 'employee' && 
          req.user.employeeId !== parseInt(employeeId) && 
          req.user.id !== parseInt(employeeId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const salaryHistory = await SalaryStructure.findAll({
        where: { employeeId },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'firstName', 'lastName', 'employeeId', 'email']
          }
        ],
        order: [['effectiveDate', 'DESC']]
      });

      // Calculate salary growth over time
      const salaryGrowth = salaryHistory.map((current, index) => {
        const previous = salaryHistory[index + 1];
        let growthPercentage = 0;
        let growthAmount = 0;

        if (previous) {
          growthAmount = current.ctc - previous.ctc;
          growthPercentage = ((growthAmount / previous.ctc) * 100).toFixed(2);
        }

        return {
          ...current.toJSON(),
          growthFromPrevious: {
            amount: growthAmount,
            percentage: parseFloat(growthPercentage)
          }
        };
      });

      res.json({
        success: true,
        data: {
          history: salaryGrowth,
          summary: {
            totalRevisions: salaryHistory.length,
            currentCTC: salaryHistory[0]?.ctc || 0,
            firstCTC: salaryHistory[salaryHistory.length - 1]?.ctc || 0,
            totalGrowth: salaryHistory.length > 1 
              ? salaryHistory[0].ctc - salaryHistory[salaryHistory.length - 1].ctc 
              : 0
          }
        }
      });
    } catch (error) {
      console.error('Error fetching salary history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch salary history',
        error: error.message
      });
    }
  }
);

module.exports = router;
