module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(5, 2)
    },
    actualHours: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'On Hold'),
      defaultValue: 'Not Started'
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
      defaultValue: 'Medium'
    },
    availableToAll: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'If true, task is available to all employees regardless of assignment'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'tasks',
    timestamps: true
  });

  Task.associate = function(models) {
    Task.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
    
    Task.belongsTo(models.Employee, {
      foreignKey: 'assignedTo',
      as: 'assignee'
    });
    
    Task.hasMany(models.Timesheet, {
      foreignKey: 'taskId',
      as: 'timesheets'
    });
  };

  return Task;
};
