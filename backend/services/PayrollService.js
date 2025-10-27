const BaseService = require('./BaseService');
const db = require('../models');
const { Payroll, PayrollItem, Employee, User, SalaryStructure } = db;

class PayrollService extends BaseService {
  constructor() {
    super(Payroll);
  }

  async findAllWithDetails(options = {}) {
    const includeOptions = [
      {
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'department', 'position'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'role']
          },
          {
            model: SalaryStructure,
            as: 'salaryStructure',
            attributes: ['id', 'baseSalary', 'allowances', 'deductions']
          }
        ]
      },
      {
        model: PayrollItem,
        as: 'payrollItems',
        attributes: ['id', 'type', 'name', 'amount', 'isPercentage']
      }
    ];

    return super.findAll({
      ...options,
      include: includeOptions,
      order: [['payPeriodStart', 'DESC'], ['createdAt', 'DESC']]
    });
  }

  async findByEmployee(employeeId, options = {}) {
    return this.findAllWithDetails({
      ...options,
      where: { 
        ...options.where,
        employeeId 
      }
    });
  }

  async findByPayPeriod(payPeriodStart, payPeriodEnd, options = {}) {
    return this.findAllWithDetails({
      ...options,
      where: {
        ...options.where,
        payPeriodStart: {
          [db.Sequelize.Op.gte]: payPeriodStart
        },
        payPeriodEnd: {
          [db.Sequelize.Op.lte]: payPeriodEnd
        }
      }
    });
  }

  async findByStatus(status, options = {}) {
    return this.findAllWithDetails({
      ...options,
      where: { 
        ...options.where,
        status 
      }
    });
  }

  async calculatePayroll(employeeId, payPeriodStart, payPeriodEnd, overrides = {}) {
    // Get employee with salary structure
    const employee = await Employee.findByPk(employeeId, {
      include: [
        {
          model: SalaryStructure,
          as: 'salaryStructure'
        }
      ]
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    if (!employee.salaryStructure) {
      throw new Error('Employee does not have a salary structure assigned');
    }

    const calculation = await this.performPayrollCalculation(
      employee,
      payPeriodStart,
      payPeriodEnd,
      overrides
    );

    return calculation;
  }

  async createPayroll(employeeId, payPeriodStart, payPeriodEnd, overrides = {}) {
    // Check if payroll already exists for this period
    const existingPayroll = await this.model.findOne({
      where: {
        employeeId,
        payPeriodStart,
        payPeriodEnd
      }
    });

    if (existingPayroll) {
      throw new Error('Payroll already exists for this employee and pay period');
    }

    // Calculate payroll
    const calculation = await this.calculatePayroll(
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      overrides
    );

    // Create payroll record
    const payroll = await super.create({
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      baseSalary: calculation.baseSalary,
      totalAllowances: calculation.totalAllowances,
      totalDeductions: calculation.totalDeductions,
      grossPay: calculation.grossPay,
      netPay: calculation.netPay,
      status: 'Draft',
      calculatedAt: new Date()
    });

    // Create payroll items
    const payrollItems = [];
    
    // Add allowances
    for (const allowance of calculation.allowances) {
      const item = await PayrollItem.create({
        payrollId: payroll.id,
        type: 'allowance',
        name: allowance.name,
        amount: allowance.amount,
        isPercentage: allowance.isPercentage || false
      });
      payrollItems.push(item);
    }

    // Add deductions
    for (const deduction of calculation.deductions) {
      const item = await PayrollItem.create({
        payrollId: payroll.id,
        type: 'deduction',
        name: deduction.name,
        amount: deduction.amount,
        isPercentage: deduction.isPercentage || false
      });
      payrollItems.push(item);
    }

    // Return payroll with items
    return {
      ...payroll.toJSON(),
      payrollItems,
      calculation
    };
  }

  async performPayrollCalculation(employee, payPeriodStart, payPeriodEnd, overrides = {}) {
    const salaryStructure = employee.salaryStructure;
    const baseSalary = overrides.baseSalary || salaryStructure.baseSalary || 0;

    // Calculate pay period days
    const payPeriodDays = Math.ceil(
      (new Date(payPeriodEnd) - new Date(payPeriodStart)) / (1000 * 60 * 60 * 24)
    ) + 1;

    // For monthly payroll, assume 30 days in a month
    const monthlyBaseSalary = baseSalary;
    const dailyRate = monthlyBaseSalary / 30;
    const periodBaseSalary = payPeriodDays <= 31 ? monthlyBaseSalary : dailyRate * payPeriodDays;

    // Process allowances
    const allowances = [];
    let totalAllowances = 0;

    if (salaryStructure.allowances) {
      const allowancesList = typeof salaryStructure.allowances === 'string' 
        ? JSON.parse(salaryStructure.allowances) 
        : salaryStructure.allowances;

      for (const allowance of allowancesList) {
        const amount = allowance.isPercentage 
          ? (periodBaseSalary * allowance.amount / 100)
          : allowance.amount;
        
        allowances.push({
          name: allowance.name,
          amount,
          isPercentage: allowance.isPercentage
        });
        
        totalAllowances += amount;
      }
    }

    // Process deductions
    const deductions = [];
    let totalDeductions = 0;

    if (salaryStructure.deductions) {
      const deductionsList = typeof salaryStructure.deductions === 'string' 
        ? JSON.parse(salaryStructure.deductions) 
        : salaryStructure.deductions;

      for (const deduction of deductionsList) {
        const amount = deduction.isPercentage 
          ? (periodBaseSalary * deduction.amount / 100)
          : deduction.amount;
        
        deductions.push({
          name: deduction.name,
          amount,
          isPercentage: deduction.isPercentage
        });
        
        totalDeductions += amount;
      }
    }

    // Calculate attendance-based adjustments
    const attendanceAdjustment = await this.calculateAttendanceAdjustment(
      employee.id,
      payPeriodStart,
      payPeriodEnd,
      dailyRate
    );

    // Apply overrides
    if (overrides.allowances) {
      for (const override of overrides.allowances) {
        const existingIndex = allowances.findIndex(a => a.name === override.name);
        if (existingIndex >= 0) {
          totalAllowances -= allowances[existingIndex].amount;
          allowances[existingIndex].amount = override.amount;
          totalAllowances += override.amount;
        } else {
          allowances.push(override);
          totalAllowances += override.amount;
        }
      }
    }

    if (overrides.deductions) {
      for (const override of overrides.deductions) {
        const existingIndex = deductions.findIndex(d => d.name === override.name);
        if (existingIndex >= 0) {
          totalDeductions -= deductions[existingIndex].amount;
          deductions[existingIndex].amount = override.amount;
          totalDeductions += override.amount;
        } else {
          deductions.push(override);
          totalDeductions += override.amount;
        }
      }
    }

    const adjustedBaseSalary = periodBaseSalary + attendanceAdjustment.adjustment;
    const grossPay = adjustedBaseSalary + totalAllowances;
    const netPay = grossPay - totalDeductions;

    return {
      baseSalary: adjustedBaseSalary,
      totalAllowances,
      totalDeductions,
      grossPay,
      netPay,
      allowances,
      deductions,
      attendanceDetails: attendanceAdjustment,
      payPeriodDays
    };
  }

  async calculateAttendanceAdjustment(employeeId, payPeriodStart, payPeriodEnd, dailyRate) {
    // This would integrate with attendance/timesheet data
    // For now, return a basic structure
    return {
      workingDays: 0,
      presentDays: 0,
      absentDays: 0,
      adjustment: 0,
      details: 'Attendance adjustment calculation not implemented'
    };
  }

  async approvePayroll(id, approverId, comments = '') {
    const payroll = await this.findById(id);
    
    if (payroll.status !== 'Draft') {
      throw new Error('Payroll is not in draft status');
    }

    return super.update(id, {
      status: 'Approved',
      approverId,
      approvedAt: new Date(),
      approverComments: comments
    });
  }

  async processPayroll(id, processedBy, paymentDetails = {}) {
    const payroll = await this.findById(id);
    
    if (payroll.status !== 'Approved') {
      throw new Error('Payroll is not approved');
    }

    return super.update(id, {
      status: 'Processed',
      processedBy,
      processedAt: new Date(),
      paymentDetails: JSON.stringify(paymentDetails)
    });
  }

  async generatePayslip(payrollId) {
    const payroll = await this.findById(payrollId, {
      include: [
        {
          model: Employee,
          as: 'employee',
          include: [
            {
              model: SalaryStructure,
              as: 'salaryStructure'
            }
          ]
        },
        {
          model: PayrollItem,
          as: 'payrollItems'
        }
      ]
    });

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    const payslip = {
      payrollId: payroll.id,
      employee: {
        id: payroll.employee.id,
        name: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
        employeeId: payroll.employee.employeeId,
        department: payroll.employee.department,
        position: payroll.employee.position
      },
      payPeriod: {
        start: payroll.payPeriodStart,
        end: payroll.payPeriodEnd
      },
      earnings: {
        baseSalary: payroll.baseSalary,
        allowances: payroll.payrollItems
          .filter(item => item.type === 'allowance')
          .map(item => ({
            name: item.name,
            amount: item.amount
          })),
        totalAllowances: payroll.totalAllowances,
        grossPay: payroll.grossPay
      },
      deductions: payroll.payrollItems
        .filter(item => item.type === 'deduction')
        .map(item => ({
          name: item.name,
          amount: item.amount
        })),
      totalDeductions: payroll.totalDeductions,
      netPay: payroll.netPay,
      generatedAt: new Date()
    };

    return payslip;
  }

  async getPayrollSummary(startDate, endDate, filters = {}) {
    const whereClause = {
      payPeriodStart: {
        [db.Sequelize.Op.gte]: startDate
      },
      payPeriodEnd: {
        [db.Sequelize.Op.lte]: endDate
      }
    };

    if (filters.department) {
      whereClause['$employee.department$'] = filters.department;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    const payrolls = await this.findAllWithDetails({
      where: whereClause
    });

    const summary = {
      totalEmployees: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      statusBreakdown: {
        draft: 0,
        approved: 0,
        processed: 0
      },
      departmentBreakdown: {}
    };

    if (payrolls.data) {
      payrolls.data.forEach(payroll => {
        summary.totalEmployees++;
        summary.totalGrossPay += payroll.grossPay || 0;
        summary.totalNetPay += payroll.netPay || 0;
        summary.totalAllowances += payroll.totalAllowances || 0;
        summary.totalDeductions += payroll.totalDeductions || 0;

        // Status breakdown
        summary.statusBreakdown[payroll.status.toLowerCase()]++;

        // Department breakdown
        const dept = payroll.employee.department || 'Unknown';
        if (!summary.departmentBreakdown[dept]) {
          summary.departmentBreakdown[dept] = {
            employees: 0,
            grossPay: 0,
            netPay: 0
          };
        }
        summary.departmentBreakdown[dept].employees++;
        summary.departmentBreakdown[dept].grossPay += payroll.grossPay || 0;
        summary.departmentBreakdown[dept].netPay += payroll.netPay || 0;
      });
    }

    return summary;
  }
}

module.exports = new PayrollService();
