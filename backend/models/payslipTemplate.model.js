const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PayslipTemplate = sequelize.define('PayslipTemplate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    version: {
      type: DataTypes.STRING,
      defaultValue: '1.0'
    },
    description: {
      type: DataTypes.TEXT
    },
    // Template configuration
    companyInfo: {
      type: DataTypes.JSON,
      defaultValue: {
        name: "SKYRAKSYS TECHNOLOGIES LLP",
        address: "Plot-No: 27E, G.S.T. Road, Guduvanchery, Chennai, Tamil Nadu, 603202 India",
        email: "info@skyraksys.com",
        website: "https://www.skyraksys.com",
        contact: "+91 89398 88577",
        logo: null,
        gst: null,
        cin: null,
        pan: null
      }
    },
    // Template structure
    structure: {
      type: DataTypes.JSON,
      allowNull: false
    },
    // Calculation rules
    calculations: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    // Validation rules
    validation: {
      type: DataTypes.JSON,
      defaultValue: {
        rules: []
      }
    },
    // CSV mapping for import/export
    csvMapping: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    // Status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Categories
    category: {
      type: DataTypes.ENUM('employee', 'executive', 'intern', 'consultant', 'custom'),
      defaultValue: 'employee'
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
    tableName: 'payslip_templates',
    timestamps: true,
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['isDefault']
      }
    ]
  });

  // Define associations
  PayslipTemplate.associate = (models) => {
    PayslipTemplate.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    PayslipTemplate.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
    PayslipTemplate.hasMany(models.SalaryStructure, {
      foreignKey: 'templateId',
      as: 'salaryStructures'
    });
  };

  return PayslipTemplate;
};