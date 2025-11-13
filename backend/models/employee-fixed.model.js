module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employeeId: {
      type: DataTypes.STRING,
      field: 'employee_number', // Map to database column
      allowNull: false,
      unique: true
    },
    firstName: {
      type: DataTypes.STRING,
      field: 'first_name', // Map to database column
      allowNull: false,
      validate: {
        len: [2, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      field: 'last_name', // Map to database column
      allowNull: false,
      validate: {
        len: [2, 50]
      }
    },
    middleName: {
      type: DataTypes.STRING,
      field: 'middle_name', // Map to database column
      validate: {
        len: [0, 50]
      }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      field: 'date_of_birth' // Map to database column
    },
    gender: {
      type: DataTypes.STRING,
      field: 'gender'
    },
    phone: {
      type: DataTypes.STRING,
      field: 'phone',
      validate: {
        len: [10, 15]
      }
    },
    emergencyContactName: {
      type: DataTypes.STRING,
      field: 'emergency_contact_name'
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      field: 'emergency_contact_phone'
    },
    address: {
      type: DataTypes.TEXT,
      field: 'address'
    },
    city: {
      type: DataTypes.STRING,
      field: 'city'
    },
    state: {
      type: DataTypes.STRING,
      field: 'state'
    },
    pinCode: {
      type: DataTypes.STRING,
      field: 'postal_code', // Map to database column
      validate: {
        isEmptyOrValid(value) {
          if (value === '' || value === null || value === undefined) {
            return; // Allow empty values
          }
          if (!/^\d{6}$/.test(value)) {
            throw new Error('PIN code must be exactly 6 digits');
          }
        }
      }
    },
    country: {
      type: DataTypes.STRING,
      field: 'country',
      defaultValue: 'India'
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      field: 'hire_date', // Map to database column
      allowNull: false
    },
    employmentType: {
      type: DataTypes.STRING,
      field: 'employment_type' // Map to database column
    },
    status: {
      type: DataTypes.STRING,
      field: 'employment_status', // Map to database column
      defaultValue: 'active'
    },
    baseSalary: {
      type: DataTypes.DECIMAL(12, 2),
      field: 'base_salary' // Map to database column
    },
    currency: {
      type: DataTypes.STRING,
      field: 'currency',
      defaultValue: 'INR'
    },
    // Statutory Details (India-specific)
    aadhaarNumber: {
      type: DataTypes.STRING,
      field: 'aadhaar_number', // Map to database column
      validate: {
        isEmptyOrValid(value) {
          if (value === '' || value === null || value === undefined) {
            return; // Allow empty values
          }
          if (!/^\d{12}$/.test(value)) {
            throw new Error('Aadhaar number must be exactly 12 digits');
          }
        }
      }
    },
    panNumber: {
      type: DataTypes.STRING,
      field: 'pan_number', // Map to database column
      validate: {
        isEmptyOrValid(value) {
          if (value === '' || value === null || value === undefined) {
            return; // Allow empty values
          }
          if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
            throw new Error('PAN number must be in valid format (e.g., ABCDE1234F)');
          }
        }
      }
    },
    uanNumber: {
      type: DataTypes.STRING,
      field: 'uan_number' // Map to database column
    },
    pfNumber: {
      type: DataTypes.STRING,
      field: 'pf_number' // Map to database column
    },
    esiNumber: {
      type: DataTypes.STRING,
      field: 'esi_number' // Map to database column
    },
    // Bank Details
    bankName: {
      type: DataTypes.STRING,
      field: 'bank_name' // Map to database column
    },
    bankAccountNumber: {
      type: DataTypes.STRING,
      field: 'bank_account_number' // Map to database column
    },
    ifscCode: {
      type: DataTypes.STRING,
      field: 'bank_ifsc_code', // Map to database column
      validate: {
        isEmptyOrValid(value) {
          if (value === '' || value === null || value === undefined) {
            return; // Allow empty values
          }
          if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
            throw new Error('IFSC code must be in valid format (e.g., SBIN0001234)');
          }
        }
      }
    },
    bankBranch: {
      type: DataTypes.STRING,
      field: 'bank_branch' // Map to database column
    },
    photoUrl: {
      type: DataTypes.STRING,
      field: 'profile_image_url', // Map to database column
      validate: {
        isEmptyOrValidUrl(value) {
          if (value === '' || value === null || value === undefined) {
            return; // Allow empty values
          }
          
          // Allow relative paths starting with /
          if (value.startsWith('/')) {
            return; // Valid relative path
          }
          
          // Basic full URL validation for absolute URLs
          const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          if (!urlPattern.test(value)) {
            throw new Error('Photo URL must be a valid URL or relative path');
          }
        }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active', // Map to database column
      defaultValue: true
    },
    // Foreign key references
    userId: {
      type: DataTypes.UUID,
      field: 'user_id', // Map to database column
      references: {
        model: 'users',
        key: 'id'
      }
    },
    departmentId: {
      type: DataTypes.UUID,
      field: 'department_id', // Map to database column
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    positionId: {
      type: DataTypes.UUID,
      field: 'position_id', // Map to database column
      references: {
        model: 'positions',
        key: 'id'
      }
    },
    managerId: {
      type: DataTypes.UUID,
      field: 'manager_id', // Map to database column
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    // Comprehensive salary structure (JSON field) - not in current DB schema
    salary: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidSalaryStructure(value) {
          if (value && typeof value === 'object') {
            // Basic validation for salary structure
            if (value.basicSalary !== undefined && (typeof value.basicSalary !== 'number' || value.basicSalary < 0)) {
              throw new Error('Basic salary must be a positive number');
            }
            if (value.currency && !['INR', 'USD', 'EUR', 'GBP'].includes(value.currency)) {
              throw new Error('Invalid currency');
            }
            if (value.payFrequency && !['weekly', 'biweekly', 'monthly', 'annually'].includes(value.payFrequency)) {
              throw new Error('Invalid pay frequency');
            }
          }
        }
      }
    }
  }, {
    tableName: 'employees',
    timestamps: true,
    paranoid: true,
    underscored: false, // Keep camelCase in model, use field mapping for DB
    indexes: [
      {
        unique: true,
        fields: ['employee_number'] // Use actual DB column name
      },
      {
        unique: true,
        fields: ['user_id'] // Use actual DB column name
      },
      {
        fields: ['department_id']
      },
      {
        fields: ['position_id']
      },
      {
        fields: ['manager_id']
      },
      {
        fields: ['employment_status']
      }
    ]
  });

  Employee.associate = function(models) {
    Employee.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    Employee.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department'
    });
    
    Employee.belongsTo(models.Position, {
      foreignKey: 'positionId',
      as: 'position'
    });
    
    Employee.belongsTo(models.Employee, {
      foreignKey: 'managerId',
      as: 'manager'
    });
    
    Employee.hasMany(models.Employee, {
      foreignKey: 'managerId',
      as: 'subordinates'
    });
    
    Employee.hasMany(models.LeaveRequest, {
      foreignKey: 'employeeId',
      as: 'leaveRequests'
    });
    
    Employee.hasMany(models.LeaveBalance, {
      foreignKey: 'employeeId',
      as: 'leaveBalances'
    });
    
    Employee.hasMany(models.Timesheet, {
      foreignKey: 'employeeId',
      as: 'timesheets'
    });
    
    Employee.hasMany(models.Payroll, {
      foreignKey: 'employeeId',
      as: 'payrolls'
    });
    
    Employee.hasOne(models.SalaryStructure, {
      foreignKey: 'employeeId',
      as: 'salaryStructure'
    });
  };

  return Employee;
};