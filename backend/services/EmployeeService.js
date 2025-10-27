const BaseService = require('./BaseService');
const db = require('../models');
const { Employee, Department, Position, User } = db;

class EmployeeService extends BaseService {
  constructor() {
    super(Employee);
  }

  async findAllWithDetails(options = {}) {
    const includeOptions = [
      {
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'description']
      },
      {
        model: Position,
        as: 'position',
        attributes: ['id', 'title', 'description']
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'role', 'isActive', 'lastLoginAt']
      },
      {
        model: Employee,
        as: 'manager',
        attributes: ['id', 'employeeId', 'firstName', 'lastName'],
        required: false
      }
    ];

    return super.findAll({
      ...options,
      include: includeOptions
    });
  }

  async findByIdWithDetails(id) {
    const includeOptions = [
      {
        model: Department,
        as: 'department'
      },
      {
        model: Position,
        as: 'position'
      },
      {
        model: User,
        as: 'user',
        attributes: { exclude: ['password'] }
      },
      {
        model: Employee,
        as: 'manager',
        attributes: ['id', 'employeeId', 'firstName', 'lastName']
      }
    ];

    return super.findById(id, includeOptions);
  }

  async findByEmployeeId(employeeId) {
    return super.findOne({ employeeId });
  }

  async findByEmail(email) {
    return super.findOne({ email });
  }

  async findByDepartment(departmentId, options = {}) {
    return super.findAll({
      ...options,
      where: { departmentId }
    });
  }

  async findByPosition(positionId, options = {}) {
    return super.findAll({
      ...options,
      where: { positionId }
    });
  }

  async findByStatus(status, options = {}) {
    return super.findAll({
      ...options,
      where: { status }
    });
  }

  async getActiveEmployeesCount() {
    return super.count({ status: 'Active' });
  }

  async getEmployeesByHireDate(startDate, endDate) {
    return super.findAll({
      where: {
        hireDate: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      }
    });
  }

  async updateStatus(id, status) {
    return super.update(id, { status });
  }

  async assignManager(employeeId, managerId) {
    return super.update(employeeId, { managerId });
  }

  async getSubordinates(managerId) {
    return super.findAll({
      where: { managerId }
    });
  }

  async searchEmployees(searchTerm, options = {}) {
    const where = {
      [db.Sequelize.Op.or]: [
        {
          firstName: {
            [db.Sequelize.Op.iLike]: `%${searchTerm}%`
          }
        },
        {
          lastName: {
            [db.Sequelize.Op.iLike]: `%${searchTerm}%`
          }
        },
        {
          email: {
            [db.Sequelize.Op.iLike]: `%${searchTerm}%`
          }
        },
        {
          employeeId: {
            [db.Sequelize.Op.iLike]: `%${searchTerm}%`
          }
        }
      ]
    };

    return super.findAll({
      ...options,
      where
    });
  }

  async validateUniqueFields(data, excludeId = null) {
    const conditions = [];

    if (data.email) {
      conditions.push({ email: data.email });
    }

    if (data.employeeId) {
      conditions.push({ employeeId: data.employeeId });
    }

    if (conditions.length === 0) {
      return { isValid: true };
    }

    const where = {
      [db.Sequelize.Op.or]: conditions
    };

    if (excludeId) {
      where.id = {
        [db.Sequelize.Op.ne]: excludeId
      };
    }

    const existingEmployee = await super.findOne(where);

    if (existingEmployee) {
      let conflictField = '';
      if (existingEmployee.email === data.email) {
        conflictField = 'email';
      } else if (existingEmployee.employeeId === data.employeeId) {
        conflictField = 'employeeId';
      }

      return {
        isValid: false,
        conflictField,
        message: `An employee with this ${conflictField} already exists`
      };
    }

    return { isValid: true };
  }

  async createWithValidation(data) {
    // Validate unique fields
    const validation = await this.validateUniqueFields(data);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    // Generate employee ID if not provided
    if (!data.employeeId) {
      data.employeeId = await this.generateEmployeeId();
    }

    return super.create(data);
  }

  async updateWithValidation(id, data) {
    // Validate unique fields (excluding current record)
    const validation = await this.validateUniqueFields(data, id);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    return super.update(id, data);
  }

  async generateEmployeeId() {
    const lastEmployee = await Employee.findOne({
      order: [['employeeId', 'DESC']],
      where: {
        employeeId: {
          [db.Sequelize.Op.regexp]: '^EMP[0-9]+$'
        }
      }
    });

    let nextNumber = 1;
    if (lastEmployee && lastEmployee.employeeId) {
      const match = lastEmployee.employeeId.match(/^EMP(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `EMP${nextNumber.toString().padStart(3, '0')}`;
  }

  async getEmployeeStats() {
    const totalEmployees = await super.count();
    const activeEmployees = await super.count({ status: 'Active' });
    const inactiveEmployees = await super.count({ status: 'Inactive' });
    const onLeaveEmployees = await super.count({ status: 'On Leave' });

    return {
      total: totalEmployees,
      active: activeEmployees,
      inactive: inactiveEmployees,
      onLeave: onLeaveEmployees
    };
  }
}

module.exports = new EmployeeService();
