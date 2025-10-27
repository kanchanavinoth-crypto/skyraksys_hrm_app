const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SalaryStructure = sequelize.define('SalaryStructure', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Employees',
        key: 'id'
      }
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    // Basic salary components
    basicSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    // Allowances
    houseRentAllowance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    conveyanceAllowance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    medicalAllowance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    specialAllowance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    performanceBonus: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    overtimeAllowance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    lta: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    shiftAllowance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    internetAllowance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    arrears: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    incentive: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    // Deductions
    providentFund: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    voluntaryPF: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    esic: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    professionalTax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    tds: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    medicalPremium: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    nps: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    loanEmi: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    advances: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    canteenCharges: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    otherDeductions: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    // Settings
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        pfApplicable: true,
        esicApplicable: true,
        ptApplicable: true,
        overtimeEligible: true,
        bonusEligible: true,
        gratuityApplicable: true
      }
    },
    // Bank details
    bankDetails: {
      type: DataTypes.JSON,
      defaultValue: {
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branch: ''
      }
    },
    // Template to use
    templateId: {
      type: DataTypes.STRING,
      defaultValue: 'default'
    },
    // Status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Audit fields
    createdBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'salary_structures',
    timestamps: true,
    indexes: [
      {
        fields: ['employeeId']
      },
      {
        fields: ['effectiveDate']
      },
      {
        fields: ['employeeId', 'effectiveDate']
      }
    ]
  });

  // Define associations
  SalaryStructure.associate = (models) => {
    SalaryStructure.belongsTo(models.Employee, {
      foreignKey: 'employeeId',
      as: 'employee'
    });
    SalaryStructure.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    SalaryStructure.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
  };

  return SalaryStructure;
};