const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../models');

const LeaveType = db.LeaveType;
const LeaveRequest = db.LeaveRequest;
const LeaveBalance = db.LeaveBalance;
const Employee = db.Employee;
const router = express.Router();

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }
    req.user = user;
    next();
  });
};

// Get all leave types
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const leaveTypes = await LeaveType.findAll();

    res.json({
      success: true,
      data: leaveTypes
    });
  } catch (error) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave types'
    });
  }
});

// Get all leave requests
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};
    
    // If not admin or hr, only show user's own requests
    if (!['admin', 'hr'].includes(req.user.role)) {
      const employee = await Employee.findOne({ where: { userId: req.user.id } });
      if (employee) {
        whereClause.employeeId = employee.id;
      }
    }

    const leaveRequests = await LeaveRequest.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName']
        },
        {
          model: LeaveType,
          as: 'leaveType',
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: leaveRequests
    });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests'
    });
  }
});

// Get leave balances
router.get('/balances', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};
    
    // If not admin or hr, only show user's own balances
    if (!['admin', 'hr'].includes(req.user.role)) {
      const employee = await Employee.findOne({ where: { userId: req.user.id } });
      if (employee) {
        whereClause.employeeId = employee.id;
      }
    }

    const leaveBalances = await LeaveBalance.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName']
        },
        {
          model: LeaveType,
          as: 'leaveType',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    res.json({
      success: true,
      data: leaveBalances
    });
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave balances'
    });
  }
});

// Apply for leave
router.post('/requests', authenticateToken, async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;

    if (!leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, start date, and end date are required'
      });
    }

    // Get employee record
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found'
      });
    }

    // Calculate days requested
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysRequested = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = await LeaveRequest.create({
      employeeId: employee.id,
      leaveTypeId,
      startDate,
      endDate,
      daysRequested,
      reason,
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leaveRequest
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave request'
    });
  }
});

// Update leave request status (admin/hr only)
router.put('/requests/:id', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin or HR access required'
      });
    }

    const { status, approverComments } = req.body;
    
    const leaveRequest = await LeaveRequest.findByPk(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    await leaveRequest.update({
      status: status || leaveRequest.status,
      approverComments: approverComments || leaveRequest.approverComments,
      approvedBy: req.user.id,
      approvedAt: status === 'Approved' ? new Date() : null
    });

    res.json({
      success: true,
      message: 'Leave request updated successfully',
      data: leaveRequest
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave request'
    });
  }
});

module.exports = router;
