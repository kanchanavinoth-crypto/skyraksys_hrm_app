const express = require('express');
const router = express.Router();
const { Employee, Payslip } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth.simple');
const { ApiResponse } = require('../utils/ApiResponse');

/**
 * Generate payslip for an employee
 * POST /api/payslips/generate
 */
router.post('/generate', authenticateToken, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { employeeId, month, salaryData } = req.body;

    // Validate input
    if (!employeeId || !month) {
      return res.status(400).json(
        ApiResponse.error('Employee ID and month are required')
      );
    }

    // Find employee
    const employee = await Employee.findById(employeeId)
      .populate('department')
      .populate('position')
      .populate('manager');

    if (!employee) {
      return res.status(404).json(
        ApiResponse.error('Employee not found')
      );
    }

    // Calculate payslip data
    const payslipData = calculatePayslip(employee, salaryData, month);

    // Save payslip to database
    const payslip = new Payslip({
      employee: employeeId,
      month: month,
      payslipData: payslipData,
      generatedBy: req.user.id,
      generatedAt: new Date()
    });

    await payslip.save();

    res.json(
      ApiResponse.success(payslipData, 'Payslip generated successfully')
    );
  } catch (error) {
    console.error('Error generating payslip:', error);
    res.status(500).json(
      ApiResponse.error('Failed to generate payslip')
    );
  }
});

/**
 * Get all payslips (admin/HR only)
 * GET /api/payslips
 */
router.get('/', authenticateToken, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { month, status, employeeId, page = 1, limit = 50 } = req.query;
    
    // Build filter conditions
    const filter = {};
    if (month) filter.month = month;
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch payslips with employee details
    const payslips = await Payslip.findAll({
      where: filter,
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'firstName', 'lastName', 'employeeId']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: skip
    });

    // Get total count for pagination
    const totalCount = await Payslip.count({ where: filter });

    res.json(
      ApiResponse.success({
        data: payslips,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }, 'Payslips retrieved successfully')
    );
  } catch (error) {
    console.error('Error fetching all payslips:', error);
    res.status(500).json(
      ApiResponse.error('Failed to fetch payslips')
    );
  }
});

/**
 * Get payslip history for an employee
 * GET /api/payslips/history/:employeeId
 */
router.get('/history/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check if user can access this employee's payslips
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.employeeId !== employeeId) {
      return res.status(403).json(
        ApiResponse.error('Insufficient permissions')
      );
    }

    const payslips = await Payslip.find({ employee: employeeId })
      .sort({ month: -1 })
      .populate('generatedBy', 'firstName lastName');

    res.json(
      ApiResponse.success(payslips, 'Payslip history retrieved successfully')
    );
  } catch (error) {
    console.error('Error fetching payslip history:', error);
    res.status(500).json(
      ApiResponse.error('Failed to fetch payslip history')
    );
  }
});

/**
 * Get specific payslip by ID
 * GET /api/payslips/:payslipId
 */
router.get('/:payslipId', authenticateToken, async (req, res) => {
  try {
    const { payslipId } = req.params;

    const payslip = await Payslip.findById(payslipId)
      .populate('employee')
      .populate('generatedBy', 'firstName lastName');

    if (!payslip) {
      return res.status(404).json(
        ApiResponse.error('Payslip not found')
      );
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && 
        req.user.employeeId !== payslip.employee._id.toString()) {
      return res.status(403).json(
        ApiResponse.error('Insufficient permissions')
      );
    }

    res.json(
      ApiResponse.success(payslip, 'Payslip retrieved successfully')
    );
  } catch (error) {
    console.error('Error fetching payslip:', error);
    res.status(500).json(
      ApiResponse.error('Failed to fetch payslip')
    );
  }
});

/**
 * Download payslip as PDF
 * POST /api/payslips/download-pdf
 */
router.post('/download-pdf', authenticateToken, async (req, res) => {
  try {
    const { employeeId, month } = req.body;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.employeeId !== employeeId) {
      return res.status(403).json(
        ApiResponse.error('Insufficient permissions')
      );
    }

    // Find employee and payslip
    const employee = await Employee.findById(employeeId)
      .populate('department')
      .populate('position');

    if (!employee) {
      return res.status(404).json(
        ApiResponse.error('Employee not found')
      );
    }

    const payslip = await Payslip.findOne({ employee: employeeId, month: month });

    if (!payslip) {
      return res.status(404).json(
        ApiResponse.error('Payslip not found for the specified month')
      );
    }

    // TODO: Implement PDF generation using puppeteer or similar
    // For now, return a placeholder response
    res.json(
      ApiResponse.success({ downloadUrl: '/placeholder-pdf' }, 'PDF generation not implemented yet')
    );
    
  } catch (error) {
    console.error('Error downloading payslip PDF:', error);
    res.status(500).json(
      ApiResponse.error('Failed to generate PDF')
    );
  }
});

/**
 * Calculate payslip data
 * @param {Object} employee - Employee data
 * @param {Object} salaryData - Salary configuration
 * @param {string} month - Month in YYYY-MM format
 * @returns {Object} Calculated payslip data
 */
function calculatePayslip(employee, salaryData, month) {
  const workingDays = salaryData.totalWorkingDays || 21;
  const presentDays = salaryData.presentDays || 21;
  const ratio = presentDays / workingDays;

  // Calculate earnings
  const earnings = {
    basicSalary: (salaryData.basicSalary || 15000) * ratio,
    houseRentAllowance: (salaryData.houseRentAllowance || 0) * ratio,
    conveyanceAllowance: (salaryData.conveyanceAllowance || 0) * ratio,
    medicalAllowance: (salaryData.medicalAllowance || 0) * ratio,
    specialAllowance: (salaryData.specialAllowance || 0) * ratio,
    lta: (salaryData.lta || 0) * ratio,
    shiftAllowance: (salaryData.shiftAllowance || 0) * ratio,
    internetAllowance: (salaryData.internetAllowance || 0) * ratio,
    arrears: salaryData.arrears || 0
  };

  const grossSalary = Object.values(earnings).reduce((sum, amount) => sum + amount, 0);

  // Calculate deductions
  const deductions = {
    medicalPremium: salaryData.medicalPremium || 0,
    nps: salaryData.nps || 0,
    professionalTax: calculateProfessionalTax(grossSalary),
    providentFund: calculatePF(earnings.basicSalary),
    tds: calculateTDS(grossSalary),
    voluntaryPF: salaryData.voluntaryPF || 0,
    esic: calculateESIC(grossSalary)
  };

  const totalDeductions = Object.values(deductions).reduce((sum, amount) => sum + amount, 0);
  const netPay = grossSalary - totalDeductions;

  // Format month display
  const monthDate = new Date(month + '-01');
  const monthDisplay = monthDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return {
    month: monthDisplay,
    totalWorkingDays: workingDays,
    lopDays: workingDays - presentDays,
    paidDays: presentDays,
    earnings,
    deductions,
    grossSalary,
    totalDeductions,
    netPay,
    paymentMode: 'Online Transfer',
    disbursementDate: new Date().toLocaleDateString('en-GB')
  };
}

// Helper functions for tax calculations
function calculateProfessionalTax(grossSalary) {
  if (grossSalary <= 21000) return 0;
  if (grossSalary <= 25000) return 150;
  return 200;
}

function calculatePF(basicSalary) {
  const pfLimit = 15000;
  const pfRate = 0.12;
  return Math.min(basicSalary, pfLimit) * pfRate;
}

function calculateESIC(grossSalary) {
  if (grossSalary > 25000) return 0;
  return grossSalary * 0.0075;
}

function calculateTDS(grossSalary) {
  const annualSalary = grossSalary * 12;
  const exemptionLimit = 250000;

  if (annualSalary <= exemptionLimit) return 0;
  
  const taxableAmount = annualSalary - exemptionLimit;
  const annualTDS = taxableAmount * 0.05;
  return annualTDS / 12;
}

module.exports = router;
