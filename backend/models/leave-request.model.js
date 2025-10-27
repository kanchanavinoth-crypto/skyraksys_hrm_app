module.exports = (sequelize, DataTypes) => {
  const LeaveRequest = sequelize.define('LeaveRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    totalDays: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled'),
      defaultValue: 'Pending'
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
    isHalfDay: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    halfDayType: {
      type: DataTypes.ENUM('First Half', 'Second Half')
    },
    isCancellation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indicates if this is a cancellation request'
    },
    originalLeaveRequestId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'References the original leave request being cancelled'
    },
    cancellationNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for cancellation'
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'leave_requests',
    timestamps: true,
    paranoid: true
  });

  LeaveRequest.associate = function(models) {
    LeaveRequest.belongsTo(models.Employee, {
      foreignKey: 'employeeId',
      as: 'employee'
    });
    
    LeaveRequest.belongsTo(models.LeaveType, {
      foreignKey: 'leaveTypeId',
      as: 'leaveType'
    });
    
    LeaveRequest.belongsTo(models.Employee, {
      foreignKey: 'approvedBy',
      as: 'approver'
    });
    
    // Self-referential association for cancellations
    LeaveRequest.belongsTo(models.LeaveRequest, {
      foreignKey: 'originalLeaveRequestId',
      as: 'originalLeaveRequest'
    });
    
    LeaveRequest.hasMany(models.LeaveRequest, {
      foreignKey: 'originalLeaveRequestId',
      as: 'cancellationRequests'
    });
  };

  return LeaveRequest;
};
