module.exports = (sequelize, DataTypes) => {
  const PayrollComponent = sequelize.define('PayrollComponent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    componentType: {
      type: DataTypes.ENUM('Earning', 'Deduction'),
      allowNull: false
    },
    componentName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2)
    },
    isFixed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isTaxable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    description: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'payroll_components',
    timestamps: true
  });

  PayrollComponent.associate = function(models) {
    PayrollComponent.belongsTo(models.Payroll, {
      foreignKey: 'payrollId',
      as: 'payroll'
    });
  };

  return PayrollComponent;
};
