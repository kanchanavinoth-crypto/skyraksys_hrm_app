module.exports = (sequelize, DataTypes) => {
  const SalaryStructure = sequelize.define('SalaryStructure', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    basicSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    hra: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    allowances: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    pfContribution: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    tds: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    professionalTax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    otherDeductions: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'INR'
    },
    effectiveFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'salary_structures',
    timestamps: true
  });

  SalaryStructure.associate = function(models) {
    SalaryStructure.belongsTo(models.Employee, {
      foreignKey: 'employeeId',
      as: 'employee'
    });
  };

  return SalaryStructure;
};
