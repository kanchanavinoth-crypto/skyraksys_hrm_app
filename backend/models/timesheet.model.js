module.exports = (sequelize, DataTypes) => {
  const Timesheet = sequelize.define('Timesheet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // Weekly timesheet fields
    weekStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Monday of the week for this timesheet'
    },
    weekEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Sunday of the week for this timesheet'
    },
    weekNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Week number in the year (1-53)'
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Year for this timesheet'
    },
    // Employee who owns this timesheet
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    // Single project and task for the entire week
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects', 
        key: 'id'
      }
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id'
      }
    },
    // Weekly hours total
    totalHoursWorked: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 168 // Max hours in a week
      }
    },
    // Daily breakdown for detailed tracking
    mondayHours: { 
      type: DataTypes.DECIMAL(4, 2), 
      defaultValue: 0,
      validate: { min: 0, max: 24 }
    },
    tuesdayHours: { 
      type: DataTypes.DECIMAL(4, 2), 
      defaultValue: 0,
      validate: { min: 0, max: 24 }
    },
    wednesdayHours: { 
      type: DataTypes.DECIMAL(4, 2), 
      defaultValue: 0,
      validate: { min: 0, max: 24 }
    },
    thursdayHours: { 
      type: DataTypes.DECIMAL(4, 2), 
      defaultValue: 0,
      validate: { min: 0, max: 24 }
    },
    fridayHours: { 
      type: DataTypes.DECIMAL(4, 2), 
      defaultValue: 0,
      validate: { min: 0, max: 24 }
    },
    saturdayHours: { 
      type: DataTypes.DECIMAL(4, 2), 
      defaultValue: 0,
      validate: { min: 0, max: 24 }
    },
    sundayHours: { 
      type: DataTypes.DECIMAL(4, 2), 
      defaultValue: 0,
      validate: { min: 0, max: 24 }
    },
    // Weekly work description
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Weekly work summary and notes'
    },
    // Timesheet workflow status
    status: {
      type: DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Rejected'),
      defaultValue: 'Draft'
    },
    // Workflow timestamps
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Approval workflow
    approverComments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Comments from manager/admin during approval/rejection'
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      }
    }
  }, {
    tableName: 'timesheets',
    timestamps: true,
    paranoid: true, // Soft delete for audit trail
    indexes: [
      // REMOVED: unique constraint to allow multiple tasks per week
      // {
      //   // CRITICAL: Ensure only one timesheet per employee per week
      //   unique: true,
      //   fields: ['employeeId', 'weekStartDate', 'year'],
      //   name: 'unique_employee_week_timesheet'
      // },
      {
        fields: ['status', 'weekStartDate'],
        name: 'idx_timesheet_status_week'
      },
      {
        fields: ['employeeId', 'status'],
        name: 'idx_timesheet_employee_status'
      },
      {
        fields: ['projectId', 'weekStartDate'],
        name: 'idx_timesheet_project_week'
      },
      {
        fields: ['approvedBy', 'status'],
        name: 'idx_timesheet_approver_status'
      }
    ],
    validate: {
      // Ensure total hours matches daily breakdown
      hoursConsistency() {
        const dailyTotal = (
          parseFloat(this.mondayHours || 0) +
          parseFloat(this.tuesdayHours || 0) +
          parseFloat(this.wednesdayHours || 0) +
          parseFloat(this.thursdayHours || 0) +
          parseFloat(this.fridayHours || 0) +
          parseFloat(this.saturdayHours || 0) +
          parseFloat(this.sundayHours || 0)
        );
        
        if (Math.abs(dailyTotal - parseFloat(this.totalHoursWorked)) > 0.01) {
          throw new Error('Total hours must match sum of daily hours');
        }
      },
      
      // Ensure week dates are valid Monday-Sunday pair
      weekDatesValid() {
        const startDate = new Date(this.weekStartDate);
        const endDate = new Date(this.weekEndDate);
        
        // Check if start date is Monday (day 1)
        if (startDate.getDay() !== 1) {
          throw new Error('Week start date must be a Monday');
        }
        
        // Check if end date is Sunday (day 0)
        if (endDate.getDay() !== 0) {
          throw new Error('Week end date must be a Sunday');
        }
        
        // Check if they're exactly 6 days apart
        const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
        if (daysDiff !== 6) {
          throw new Error('Week must span exactly 7 days (Monday to Sunday)');
        }
      }
    }
  });

  // Model associations
  Timesheet.associate = function(models) {
    Timesheet.belongsTo(models.Employee, {
      foreignKey: 'employeeId',
      as: 'employee'
    });
    
    Timesheet.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
    
    Timesheet.belongsTo(models.Task, {
      foreignKey: 'taskId',
      as: 'task'
    });
    
    Timesheet.belongsTo(models.Employee, {
      foreignKey: 'approvedBy',
      as: 'approver'
    });
  };

  // Instance methods for business logic
  Timesheet.prototype.canBeEditedBy = function(userRole, userId, userEmployeeId) {
    // Draft and Rejected can be edited by the employee who owns it
    if ((this.status === 'Draft' || this.status === 'Rejected') && this.employeeId === userEmployeeId) {
      return true;
    }
    
    // Admin can edit any timesheet regardless of status
    if (userRole === 'admin') {
      return true;
    }
    
    return false;
  };

  Timesheet.prototype.canBeDeletedBy = function(userRole) {
    // Only admin can delete timesheets
    return userRole === 'admin';
  };

  Timesheet.prototype.canBeApprovedBy = function(userRole, userEmployeeId, employeeManagerId) {
    // Cannot approve own timesheet
    if (this.employeeId === userEmployeeId) {
      return false;
    }
    
    // Only submitted timesheets can be approved/rejected
    if (this.status !== 'Submitted') {
      return false;
    }
    
    // Admin and HR can approve any submitted timesheet
    if (userRole === 'admin' || userRole === 'hr') {
      return true;
    }
    
    // Manager can approve their direct reports' submitted timesheets
    if (userRole === 'manager' && employeeManagerId === userEmployeeId) {
      return true;
    }
    
    return false;
  };

  // Static helper methods
  Timesheet.getWeekStart = function(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  Timesheet.getWeekEnd = function(weekStart) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  Timesheet.getWeekNumber = function(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  return Timesheet;
};
