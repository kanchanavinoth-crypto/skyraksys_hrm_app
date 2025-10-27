module.exports = (sequelize, DataTypes) => {
  const Payroll = sequelize.define('Payroll', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    payPeriodStart: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    payPeriodEnd: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    grossSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    totalDeductions: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    netSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    workingDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    actualWorkingDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    leaveDays: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    overtimeHours: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    overtimePay: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Processed', 'Paid', 'Cancelled'),
      defaultValue: 'Draft'
    },
    processedAt: {
      type: DataTypes.DATE
    },
    paidAt: {
      type: DataTypes.DATE
    },
    paymentReference: {
      type: DataTypes.STRING
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'payrolls',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['employeeId', 'month', 'year']
      }
    ]
  });

  Payroll.associate = function(models) {
    Payroll.belongsTo(models.Employee, {
      foreignKey: 'employeeId',
      as: 'employee'
    });
    
    Payroll.belongsTo(models.Employee, {
      foreignKey: 'processedBy',
      as: 'processor'
    });
    
    Payroll.hasMany(models.PayrollComponent, {
      foreignKey: 'payrollId',
      as: 'components'
    });
  };

  return Payroll;
};
