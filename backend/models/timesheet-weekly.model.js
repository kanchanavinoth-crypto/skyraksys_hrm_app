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
    // Daily breakdown (optional for detailed tracking)
    mondayHours: { type: DataTypes.DECIMAL(4, 2), defaultValue: 0 },
    tuesdayHours: { type: DataTypes.DECIMAL(4, 2), defaultValue: 0 },
    wednesdayHours: { type: DataTypes.DECIMAL(4, 2), defaultValue: 0 },
    thursdayHours: { type: DataTypes.DECIMAL(4, 2), defaultValue: 0 },
    fridayHours: { type: DataTypes.DECIMAL(4, 2), defaultValue: 0 },
    saturdayHours: { type: DataTypes.DECIMAL(4, 2), defaultValue: 0 },
    sundayHours: { type: DataTypes.DECIMAL(4, 2), defaultValue: 0 },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Weekly work summary'
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Rejected'),
      defaultValue: 'Draft'
    },
    submittedAt: {
      type: DataTypes.DATE
    },
    approvedAt: {
      type: DataTypes.DATE
    },
    rejectedAt: {
      type: DataTypes.DATE
    },
    approverComments: {
      type: DataTypes.TEXT
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
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
    paranoid: true, // Soft delete
    indexes: [
      {
        // CRITICAL: Ensure only one timesheet per employee per week
        unique: true,
        fields: ['employeeId', 'weekStartDate', 'year'],
        name: 'unique_employee_week'
      },
      {
        fields: ['status', 'weekStartDate']
      },
      {
        fields: ['employeeId', 'status']
      },
      {
        fields: ['projectId', 'weekStartDate']
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
      
      // Ensure week dates are valid
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
          throw new Error('Week must span exactly 7 days');
        }
      }
    }
  });

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

  // Helper methods
  Timesheet.prototype.canBeEditedBy = function(userRole, userId, userEmployeeId) {
    // Draft and Rejected can be edited by employee
    if ((this.status === 'Draft' || this.status === 'Rejected') && this.employeeId === userEmployeeId) {
      return true;
    }
    
    // Admin can edit any timesheet
    if (userRole === 'admin') {
      return true;
    }
    
    return false;
  };

  Timesheet.prototype.canBeDeletedBy = function(userRole, userId, userEmployeeId) {
    // Only admin can delete timesheets
    return userRole === 'admin';
  };

  Timesheet.prototype.canBeApprovedBy = function(userRole, userId, userEmployeeId, managerId) {
    // Cannot approve own timesheet
    if (this.employeeId === userEmployeeId) {
      return false;
    }
    
    // Admin and HR can approve any submitted timesheet
    if ((userRole === 'admin' || userRole === 'hr') && this.status === 'Submitted') {
      return true;
    }
    
    // Manager can approve their direct reports' submitted timesheets
    if (userRole === 'manager' && this.status === 'Submitted' && managerId === userEmployeeId) {
      return true;
    }
    
    return false;
  };

  return Timesheet;
};