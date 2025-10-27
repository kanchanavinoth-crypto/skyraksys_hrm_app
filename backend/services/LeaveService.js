const BaseService = require('./BaseService');
const db = require('../models');
const { LeaveRequest, LeaveType, Employee, User } = db;

class LeaveService extends BaseService {
  constructor() {
    super(LeaveRequest);
  }

  async findAllWithDetails(options = {}) {
    const includeOptions = [
      {
        model: LeaveType,
        as: 'leaveType',
        attributes: ['id', 'name', 'maxDaysPerYear', 'description']
      },
      {
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'role']
          }
        ]
      }
    ];

    return super.findAll({
      ...options,
      include: includeOptions,
      order: [['createdAt', 'DESC']]
    });
  }

  async findByEmployee(employeeId, options = {}) {
    return super.findAll({
      ...options,
      where: { employeeId }
    });
  }

  async findByStatus(status, options = {}) {
    return super.findAll({
      ...options,
      where: { status }
    });
  }

  async findByDateRange(startDate, endDate, options = {}) {
    return super.findAll({
      ...options,
      where: {
        [db.Sequelize.Op.or]: [
          {
            startDate: {
              [db.Sequelize.Op.between]: [startDate, endDate]
            }
          },
          {
            endDate: {
              [db.Sequelize.Op.between]: [startDate, endDate]
            }
          },
          {
            [db.Sequelize.Op.and]: [
              {
                startDate: {
                  [db.Sequelize.Op.lte]: startDate
                }
              },
              {
                endDate: {
                  [db.Sequelize.Op.gte]: endDate
                }
              }
            ]
          }
        ]
      }
    });
  }

  async createLeaveRequest(data) {
    // Validate leave request data
    const validation = await this.validateLeaveRequest(data);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    // Calculate days
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    return super.create({
      ...data,
      days,
      status: 'Pending'
    });
  }

  async approveLeaveRequest(id, approverId, comments = '') {
    const leaveRequest = await this.findById(id);
    
    if (leaveRequest.status !== 'Pending') {
      throw new Error('Leave request is not in pending status');
    }

    // Check leave balance
    const balanceCheck = await this.checkLeaveBalance(
      leaveRequest.employeeId,
      leaveRequest.leaveTypeId,
      leaveRequest.days
    );

    if (!balanceCheck.isValid) {
      throw new Error(balanceCheck.message);
    }

    return super.update(id, {
      status: 'Approved',
      approverId,
      approvedAt: new Date(),
      approverComments: comments
    });
  }

  async rejectLeaveRequest(id, approverId, comments) {
    const leaveRequest = await this.findById(id);
    
    if (leaveRequest.status !== 'Pending') {
      throw new Error('Leave request is not in pending status');
    }

    return super.update(id, {
      status: 'Rejected',
      approverId,
      approvedAt: new Date(),
      approverComments: comments
    });
  }

  async validateLeaveRequest(data) {
    const { employeeId, leaveTypeId, startDate, endDate } = data;

    // Check if employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return { isValid: false, message: 'Employee not found' };
    }

    // Check if leave type exists
    const leaveType = await LeaveType.findByPk(leaveTypeId);
    if (!leaveType) {
      return { isValid: false, message: 'Leave type not found' };
    }

    // Check date validity
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return { isValid: false, message: 'End date must be after start date' };
    }

    if (start < new Date()) {
      return { isValid: false, message: 'Start date cannot be in the past' };
    }

    // Check for overlapping leaves
    const overlappingLeaves = await this.findByDateRange(startDate, endDate, {
      where: {
        employeeId,
        status: ['Approved', 'Pending']
      }
    });

    if (overlappingLeaves.data && overlappingLeaves.data.length > 0) {
      return { isValid: false, message: 'Leave request overlaps with existing leave' };
    }

    return { isValid: true };
  }

  async checkLeaveBalance(employeeId, leaveTypeId, requestedDays) {
    // Get leave balance for employee and leave type
    const leaveBalance = await db.LeaveBalance.findOne({
      where: { employeeId, leaveTypeId }
    });

    if (!leaveBalance) {
      return { isValid: false, message: 'Leave balance not found' };
    }

    if (leaveBalance.availableDays < requestedDays) {
      return { 
        isValid: false, 
        message: `Insufficient leave balance. Available: ${leaveBalance.availableDays}, Requested: ${requestedDays}` 
      };
    }

    return { isValid: true };
  }

  async getLeaveStats(employeeId, year = new Date().getFullYear()) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const leaves = await this.findByEmployee(employeeId, {
      where: {
        startDate: {
          [db.Sequelize.Op.between]: [startOfYear, endOfYear]
        }
      }
    });

    const stats = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      days: {
        total: 0,
        approved: 0,
        pending: 0
      }
    };

    if (leaves.data) {
      leaves.data.forEach(leave => {
        stats.total++;
        stats.days.total += leave.days || 0;

        switch (leave.status) {
          case 'Approved':
            stats.approved++;
            stats.days.approved += leave.days || 0;
            break;
          case 'Pending':
            stats.pending++;
            stats.days.pending += leave.days || 0;
            break;
          case 'Rejected':
            stats.rejected++;
            break;
        }
      });
    }

    return stats;
  }
}

module.exports = new LeaveService();
