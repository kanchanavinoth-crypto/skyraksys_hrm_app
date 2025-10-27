const express = require('express');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { authenticateToken, isAdminOrHR } = require('../middleware/auth');
const db = require('../models');

const Employee = db.Employee;
const User = db.User;
const Timesheet = db.Timesheet;
const router = express.Router();

// Get all payslips with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      employeeId,
      month,
      year,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Filter by employee (non-admin users can only see their own)
    if (req.userRole === 'employee') {
      where.employeeId = req.user.employee?.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    // Filter by month/year
    if (month && year) {
      where.payPeriodStart = {
        [Op.gte]: dayjs(`${year}-${month}-01`).startOf('month').toDate()
      };
      where.payPeriodEnd = {
        [Op.lte]: dayjs(`${year}-${month}-01`).endOf('month').toDate()
      };
    }

    if (status) {
      where.status = status;
    }

    // For demo purposes, create mock payslip data
    const mockPayslips = [
      {
        id: '1',
        employeeId: req.user.employee?.id || '1',
        employeeName: req.user.firstName + ' ' + req.user.lastName || 'Demo Employee',
        payPeriodStart: '2025-01-01',
        payPeriodEnd: '2025-01-31',
        basicSalary: 50000,
        allowances: 5000,
        deductions: 3000,
        netPay: 52000,
        status: 'generated',
        generatedAt: '2025-01-31T23:59:59Z'
      },
      {
        id: '2',
        employeeId: req.user.employee?.id || '1',
        employeeName: req.user.firstName + ' ' + req.user.lastName || 'Demo Employee',
        payPeriodStart: '2024-12-01',
        payPeriodEnd: '2024-12-31',
        basicSalary: 50000,
        allowances: 8000,
        deductions: 2500,
        netPay: 55500,
        status: 'generated',
        generatedAt: '2024-12-31T23:59:59Z'
      }
    ];

    res.json({
      success: true,
      data: {
        payslips: mockPayslips,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalItems: mockPayslips.length,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get payslips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payslips',
      error: error.message
    });
  }
});

// Get specific payslip
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Mock detailed payslip data
    const mockPayslip = {
      id: id,
      employeeId: req.user.employee?.id || '1',
      employee: {
        id: req.user.employee?.id || '1',
        firstName: req.user.firstName || 'Demo',
        lastName: req.user.lastName || 'Employee',
        email: req.user.email,
        employeeId: 'EMP001',
        department: 'IT',
        position: 'Developer'
      },
      payPeriodStart: '2025-01-01',
      payPeriodEnd: '2025-01-31',
      generatedAt: '2025-01-31T23:59:59Z',
      earnings: {
        basicSalary: 50000,
        hra: 15000,
        transportAllowance: 2000,
        medicalAllowance: 1500,
        otherAllowances: 1500,
        total: 70000
      },
      deductions: {
        pf: 6000,
        esi: 500,
        tax: 8000,
        other: 500,
        total: 15000
      },
      netPay: 55000,
      workingDays: 22,
      presentDays: 20,
      leaves: 2,
      overtime: 8,
      status: 'generated'
    };

    res.json({
      success: true,
      data: mockPayslip
    });

  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payslip',
      error: error.message
    });
  }
});

// Generate new payslip
router.post('/generate', authenticateToken, isAdminOrHR, async (req, res) => {
  try {
    const { employeeId, payPeriodStart, payPeriodEnd } = req.body;

    if (!employeeId || !payPeriodStart || !payPeriodEnd) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, pay period start and end dates are required'
      });
    }

    // Mock payslip generation
    const mockGeneratedPayslip = {
      id: Date.now().toString(),
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      basicSalary: 50000,
      allowances: 15000,
      deductions: 12000,
      netPay: 53000,
      status: 'generated',
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.id
    };

    res.status(201).json({
      success: true,
      message: 'Payslip generated successfully',
      data: mockGeneratedPayslip
    });

  } catch (error) {
    console.error('Generate payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payslip',
      error: error.message
    });
  }
});

// Bulk generate payslips
router.post('/bulk-generate', authenticateToken, isAdminOrHR, async (req, res) => {
  try {
    const { payPeriodStart, payPeriodEnd, employeeIds } = req.body;

    if (!payPeriodStart || !payPeriodEnd) {
      return res.status(400).json({
        success: false,
        message: 'Pay period start and end dates are required'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      details: []
    };

    // Mock bulk generation
    const targetEmployees = employeeIds || ['1', '2', '3'];
    
    targetEmployees.forEach(employeeId => {
      results.success++;
      results.details.push({
        employeeId,
        status: 'success',
        payslipId: Date.now() + Math.random()
      });
    });

    res.json({
      success: true,
      message: `Bulk payslip generation completed. ${results.success} successful, ${results.failed} failed.`,
      data: results
    });

  } catch (error) {
    console.error('Bulk generate payslips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payslips',
      error: error.message
    });
  }
});

// Delete payslip
router.delete('/:id', authenticateToken, isAdminOrHR, async (req, res) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      message: 'Payslip deleted successfully'
    });

  } catch (error) {
    console.error('Delete payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payslip',
      error: error.message
    });
  }
});

module.exports = router;
