const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth.simple');
const jwt = require('jsonwebtoken');
const db = require('../models');

const SalaryStructure = db.SalaryStructure;
const Employee = db.Employee;
const router = express.Router();

// Get all salary structures (admin/hr only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin or HR access required'
      });
    }

    const salaryStructures = await SalaryStructure.findAll({
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      success: true,
      data: salaryStructures
    });
  } catch (error) {
    console.error('Error fetching salary structures:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary structures'
    });
  }
});

// Get salary structure by ID (admin/hr only or own record)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const salaryStructure = await SalaryStructure.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'userId']
        }
      ]
    });

    if (!salaryStructure) {
      return res.status(404).json({
        success: false,
        message: 'Salary structure not found'
      });
    }

    // Check access permissions
    if (!['admin', 'hr'].includes(req.user.role)) {
      if (salaryStructure.employee && salaryStructure.employee.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you can only view your own salary structure'
        });
      }
    }

    res.json({
      success: true,
      data: salaryStructure
    });
  } catch (error) {
    console.error('Error fetching salary structure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary structure'
    });
  }
});

// Get salary structure by employee ID (admin/hr only or own record)
router.get('/employee/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const salaryStructure = await SalaryStructure.findOne({
      where: { 
        employeeId: employeeId,
        isActive: true 
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'userId']
        }
      ],
      order: [['effectiveFrom', 'DESC']] // Get the latest salary structure
    });

    if (!salaryStructure) {
      return res.status(404).json({
        success: false,
        message: 'No salary structure found for this employee'
      });
    }

    // Check access permissions
    if (!['admin', 'hr'].includes(req.user.role)) {
      if (salaryStructure.employee && salaryStructure.employee.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: salaryStructure
    });
  } catch (error) {
    console.error('Error fetching salary structure by employee ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary structure'
    });
  }
});

// Create new salary structure (admin/hr only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin or HR access required'
      });
    }

    const { 
      employeeId,
      basicSalary,
      hra,
      allowances,
      pfContribution,
      tds,
      professionalTax,
      otherDeductions,
      currency,
      effectiveFrom,
      isActive
    } = req.body;

    if (!employeeId || !basicSalary) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and basic salary are required'
      });
    }

    // Validate employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Deactivate any existing active salary structure for this employee
    await SalaryStructure.update(
      { isActive: false },
      { where: { employeeId, isActive: true } }
    );

    const salaryStructure = await SalaryStructure.create({
      employeeId,
      basicSalary,
      hra: hra || 0,
      allowances: allowances || 0,
      pfContribution: pfContribution || 0,
      tds: tds || 0,
      professionalTax: professionalTax || 0,
      otherDeductions: otherDeductions || 0,
      currency: currency || 'INR',
      effectiveFrom: effectiveFrom || new Date().toISOString().split('T')[0],
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Salary structure created successfully',
      data: salaryStructure
    });
  } catch (error) {
    console.error('Error creating salary structure:', error);
    
    // Provide more specific error information
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => err.message)
      });
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID - employee not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create salary structure',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update salary structure (admin/hr only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin or HR access required'
      });
    }

    const { 
      basicSalary,
      hra,
      transportAllowance,
      medicalAllowance,
      specialAllowance,
      providentFund,
      professionalTax,
      incomeTax,
      effectiveDate 
    } = req.body;
    
    const salaryStructure = await SalaryStructure.findByPk(req.params.id);
    if (!salaryStructure) {
      return res.status(404).json({
        success: false,
        message: 'Salary structure not found'
      });
    }

    // Recalculate totals
    const newBasicSalary = basicSalary || salaryStructure.basicSalary;
    const newHra = hra !== undefined ? hra : salaryStructure.hra;
    const newTransportAllowance = transportAllowance !== undefined ? transportAllowance : salaryStructure.transportAllowance;
    const newMedicalAllowance = medicalAllowance !== undefined ? medicalAllowance : salaryStructure.medicalAllowance;
    const newSpecialAllowance = specialAllowance !== undefined ? specialAllowance : salaryStructure.specialAllowance;
    
    const newGrossSalary = newBasicSalary + newHra + newTransportAllowance + newMedicalAllowance + newSpecialAllowance;
    
    const newProvidentFund = providentFund !== undefined ? providentFund : salaryStructure.providentFund;
    const newProfessionalTax = professionalTax !== undefined ? professionalTax : salaryStructure.professionalTax;
    const newIncomeTax = incomeTax !== undefined ? incomeTax : salaryStructure.incomeTax;
    
    const newTotalDeductions = newProvidentFund + newProfessionalTax + newIncomeTax;
    const newNetSalary = newGrossSalary - newTotalDeductions;

    await salaryStructure.update({
      basicSalary: newBasicSalary,
      hra: newHra,
      transportAllowance: newTransportAllowance,
      medicalAllowance: newMedicalAllowance,
      specialAllowance: newSpecialAllowance,
      grossSalary: newGrossSalary,
      providentFund: newProvidentFund,
      professionalTax: newProfessionalTax,
      incomeTax: newIncomeTax,
      totalDeductions: newTotalDeductions,
      netSalary: newNetSalary,
      effectiveDate: effectiveDate || salaryStructure.effectiveDate
    });

    res.json({
      success: true,
      message: 'Salary structure updated successfully',
      data: salaryStructure
    });
  } catch (error) {
    console.error('Error updating salary structure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update salary structure'
    });
  }
});

// Delete salary structure (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const salaryStructure = await SalaryStructure.findByPk(req.params.id);
    if (!salaryStructure) {
      return res.status(404).json({
        success: false,
        message: 'Salary structure not found'
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
      message: 'Failed to delete salary structure'
    });
  }
});

module.exports = router;
