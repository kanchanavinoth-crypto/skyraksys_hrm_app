/**
 * PayslipAuditLog Model
 * Tracks all manual edits and changes to payslips for compliance and audit purposes
 */

module.exports = (sequelize, DataTypes) => {
  const PayslipAuditLog = sequelize.define('PayslipAuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    payslipId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Payslips',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    action: {
      type: DataTypes.ENUM(
        'manual_edit',
        'status_change',
        'finalize',
        'mark_paid',
        'regenerate'
      ),
      allowNull: false,
      comment: 'Type of action performed'
    },
    performedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'User who performed the action'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for the action (required for manual edits)'
    },
    changes: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Before and after values for manual edits'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address of the user'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Browser/client user agent'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'PayslipAuditLogs',
    timestamps: false, // We only need createdAt
    indexes: [
      {
        fields: ['payslipId']
      },
      {
        fields: ['performedBy']
      },
      {
        fields: ['action']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  PayslipAuditLog.associate = (models) => {
    PayslipAuditLog.belongsTo(models.Payslip, {
      foreignKey: 'payslipId',
      as: 'payslip'
    });
    
    PayslipAuditLog.belongsTo(models.User, {
      foreignKey: 'performedBy',
      as: 'performer'
    });
  };

  return PayslipAuditLog;
};
