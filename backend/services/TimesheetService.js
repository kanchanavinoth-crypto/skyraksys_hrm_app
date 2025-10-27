const BaseService = require('./BaseService');
const db = require('../models');
const { Timesheet, Project, Task, Employee, User } = db;

class TimesheetService extends BaseService {
  constructor() {
    super(Timesheet);
  }

  async findAllWithDetails(options = {}) {
    const includeOptions = [
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
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'code', 'status']
      },
      {
        model: Task,
        as: 'task',
        attributes: ['id', 'name', 'description', 'status']
      }
    ];

    return super.findAll({
      ...options,
      include: includeOptions,
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
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

  async findByProject(projectId, options = {}) {
    return this.findAllWithDetails({
      ...options,
      where: { 
        ...options.where,
        projectId 
      }
    });
  }

  async findByDateRange(startDate, endDate, options = {}) {
    return this.findAllWithDetails({
      ...options,
      where: {
        ...options.where,
        date: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      }
    });
  }

  async findByWeek(weekStart, options = {}) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return this.findByDateRange(weekStart, weekEnd, options);
  }

  async findByMonth(year, month, options = {}) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return this.findByDateRange(startDate, endDate, options);
  }

  async createTimeEntry(data) {
    // Validate time entry data
    const validation = await this.validateTimeEntry(data);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    return super.create({
      ...data,
      status: 'Draft'
    });
  }

  async updateTimeEntry(id, data) {
    const timeEntry = await this.findById(id);
    
    if (timeEntry.status === 'Approved') {
      throw new Error('Cannot update approved time entry');
    }

    const validation = await this.validateTimeEntry(data);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    return super.update(id, data);
  }

  async submitTimesheet(employeeId, weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Get all time entries for the week
    const timeEntries = await this.findByDateRange(weekStart, weekEnd, {
      where: { employeeId }
    });

    if (!timeEntries.data || timeEntries.data.length === 0) {
      throw new Error('No time entries found for the specified week');
    }

    // Update all draft entries to submitted
    const updatedEntries = [];
    for (const entry of timeEntries.data) {
      if (entry.status === 'Draft') {
        const updated = await super.update(entry.id, {
          status: 'Submitted',
          submittedAt: new Date()
        });
        updatedEntries.push(updated);
      }
    }

    return updatedEntries;
  }

  async approveTimesheet(timesheetIds, approverId, comments = '') {
    const approvedEntries = [];
    
    for (const id of timesheetIds) {
      const timeEntry = await this.findById(id);
      
      if (timeEntry.status !== 'Submitted') {
        throw new Error(`Time entry ${id} is not in submitted status`);
      }

      const updated = await super.update(id, {
        status: 'Approved',
        approverId,
        approvedAt: new Date(),
        approverComments: comments
      });
      
      approvedEntries.push(updated);
    }

    return approvedEntries;
  }

  async rejectTimesheet(timesheetIds, approverId, comments) {
    const rejectedEntries = [];
    
    for (const id of timesheetIds) {
      const timeEntry = await this.findById(id);
      
      if (timeEntry.status !== 'Submitted') {
        throw new Error(`Time entry ${id} is not in submitted status`);
      }

      const updated = await super.update(id, {
        status: 'Rejected',
        approverId,
        approvedAt: new Date(),
        approverComments: comments
      });
      
      rejectedEntries.push(updated);
    }

    return rejectedEntries;
  }

  async validateTimeEntry(data) {
    const { employeeId, projectId, taskId, date, hours } = data;

    // Check if employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return { isValid: false, message: 'Employee not found' };
    }

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return { isValid: false, message: 'Project not found' };
    }

    // Check if task exists and belongs to project
    if (taskId) {
      const task = await Task.findByPk(taskId);
      if (!task) {
        return { isValid: false, message: 'Task not found' };
      }
      if (task.projectId !== projectId) {
        return { isValid: false, message: 'Task does not belong to the specified project' };
      }
    }

    // Validate hours
    if (hours <= 0 || hours > 24) {
      return { isValid: false, message: 'Hours must be between 0 and 24' };
    }

    // Check for duplicate entry
    const existingEntry = await this.model.findOne({
      where: {
        employeeId,
        projectId,
        taskId,
        date
      }
    });

    if (existingEntry && existingEntry.id !== data.id) {
      return { isValid: false, message: 'Time entry already exists for this date, project, and task' };
    }

    // Check daily hours limit
    const dailyTotal = await this.getDailyHoursTotal(employeeId, date, data.id);
    if (dailyTotal + hours > 24) {
      return { isValid: false, message: 'Total daily hours cannot exceed 24 hours' };
    }

    return { isValid: true };
  }

  async getDailyHoursTotal(employeeId, date, excludeId = null) {
    const whereClause = {
      employeeId,
      date
    };

    if (excludeId) {
      whereClause.id = { [db.Sequelize.Op.ne]: excludeId };
    }

    const result = await this.model.sum('hours', { where: whereClause });
    return result || 0;
  }

  async getWeeklyHoursTotal(employeeId, weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const result = await this.model.sum('hours', {
      where: {
        employeeId,
        date: {
          [db.Sequelize.Op.between]: [weekStart, weekEnd]
        }
      }
    });

    return result || 0;
  }

  async getTimesheetSummary(employeeId, startDate, endDate) {
    const timeEntries = await this.findByDateRange(startDate, endDate, {
      where: { employeeId }
    });

    const summary = {
      totalHours: 0,
      totalDays: 0,
      projects: {},
      status: {
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0
      }
    };

    if (timeEntries.data) {
      timeEntries.data.forEach(entry => {
        summary.totalHours += entry.hours || 0;
        
        // Count unique dates
        const dateStr = entry.date.toISOString().split('T')[0];
        if (!summary.projects[dateStr]) {
          summary.totalDays++;
        }

        // Project breakdown
        const projectName = entry.project ? entry.project.name : 'Unknown Project';
        if (!summary.projects[projectName]) {
          summary.projects[projectName] = { hours: 0, entries: 0 };
        }
        summary.projects[projectName].hours += entry.hours || 0;
        summary.projects[projectName].entries++;

        // Status breakdown
        summary.status[entry.status.toLowerCase()]++;
      });
    }

    return summary;
  }

  async getProjectTimeReport(projectId, startDate, endDate) {
    const timeEntries = await this.findByProject(projectId, {
      where: {
        date: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      }
    });

    const report = {
      totalHours: 0,
      employees: {},
      tasks: {},
      dailyBreakdown: {}
    };

    if (timeEntries.data) {
      timeEntries.data.forEach(entry => {
        report.totalHours += entry.hours || 0;

        // Employee breakdown
        const employeeName = `${entry.employee.firstName} ${entry.employee.lastName}`;
        if (!report.employees[employeeName]) {
          report.employees[employeeName] = { hours: 0, entries: 0 };
        }
        report.employees[employeeName].hours += entry.hours || 0;
        report.employees[employeeName].entries++;

        // Task breakdown
        const taskName = entry.task ? entry.task.name : 'No Task';
        if (!report.tasks[taskName]) {
          report.tasks[taskName] = { hours: 0, entries: 0 };
        }
        report.tasks[taskName].hours += entry.hours || 0;
        report.tasks[taskName].entries++;

        // Daily breakdown
        const dateStr = entry.date.toISOString().split('T')[0];
        if (!report.dailyBreakdown[dateStr]) {
          report.dailyBreakdown[dateStr] = 0;
        }
        report.dailyBreakdown[dateStr] += entry.hours || 0;
      });
    }

    return report;
  }
}

module.exports = new TimesheetService();
