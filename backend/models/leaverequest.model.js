module.exports = (sequelize, DataTypes) => {
  const LeaveRequest = sequelize.define('LeaveRequest', {
    // ...existing fields...
    isHalfDay: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    halfDayType: {
      type: DataTypes.ENUM('first-half', 'second-half', 'First Half', 'Second Half'),
      allowNull: true
    },
    // ❌ COMMENT OUT THESE FIELDS TEMPORARILY
    // isCancellation: {
    //   type: DataTypes.BOOLEAN,
    //   defaultValue: false
    // },
    // originalLeaveRequestId: {
    //   type: DataTypes.UUID,
    //   allowNull: true
    // },
    // cancellationNote: {
    //   type: DataTypes.TEXT,
    //   allowNull: true
    // },
    // cancelledAt: {
    //   type: DataTypes.DATE,
    //   allowNull: true
    // }
  }, {
    tableName: 'leave_requests',
    timestamps: true,
    paranoid: true
  });

  // ...existing associations...
  
  return LeaveRequest;
};
