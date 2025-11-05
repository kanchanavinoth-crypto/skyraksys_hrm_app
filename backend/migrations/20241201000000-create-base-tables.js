'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Create users table
      await queryInterface.createTable('users', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        firstName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        lastName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false
        },
        role: {
          type: Sequelize.ENUM('admin', 'hr', 'manager', 'employee'),
          allowNull: false,
          defaultValue: 'employee'
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        lastLoginAt: {
          type: Sequelize.DATE
        },
        passwordChangedAt: {
          type: Sequelize.DATE
        },
        emailVerifiedAt: {
          type: Sequelize.DATE
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        deletedAt: {
          type: Sequelize.DATE
        }
      }, { transaction });

      // 2. Create departments table
      await queryInterface.createTable('departments', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        description: {
          type: Sequelize.TEXT
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // 3. Create positions table
      await queryInterface.createTable('positions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        departmentId: {
          type: Sequelize.UUID,
          references: {
            model: 'departments',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT
        },
        level: {
          type: Sequelize.ENUM('Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director'),
          defaultValue: 'Junior'
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // 4. Create employees table
      await queryInterface.createTable('employees', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        userId: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        departmentId: {
          type: Sequelize.UUID,
          references: {
            model: 'departments',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        positionId: {
          type: Sequelize.UUID,
          references: {
            model: 'positions',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        managerId: {
          type: Sequelize.UUID,
          references: {
            model: 'employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        employeeId: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        firstName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        lastName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        phone: {
          type: Sequelize.STRING
        },
        hireDate: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('Active', 'Inactive', 'On Leave', 'Terminated'),
          defaultValue: 'Active'
        },
        // Statutory Details
        aadhaarNumber: {
          type: Sequelize.STRING
        },
        panNumber: {
          type: Sequelize.STRING
        },
        uanNumber: {
          type: Sequelize.STRING
        },
        pfNumber: {
          type: Sequelize.STRING
        },
        esiNumber: {
          type: Sequelize.STRING
        },
        // Bank Details
        bankName: {
          type: Sequelize.STRING
        },
        bankAccountNumber: {
          type: Sequelize.STRING
        },
        ifscCode: {
          type: Sequelize.STRING
        },
        bankBranch: {
          type: Sequelize.STRING
        },
        accountHolderName: {
          type: Sequelize.STRING
        },
        // Personal Details
        address: {
          type: Sequelize.TEXT
        },
        city: {
          type: Sequelize.STRING
        },
        state: {
          type: Sequelize.STRING
        },
        pinCode: {
          type: Sequelize.STRING
        },
        emergencyContactName: {
          type: Sequelize.STRING
        },
        emergencyContactPhone: {
          type: Sequelize.STRING
        },
        emergencyContactRelation: {
          type: Sequelize.STRING
        },
        dateOfBirth: {
          type: Sequelize.DATEONLY
        },
        gender: {
          type: Sequelize.ENUM('Male', 'Female', 'Other')
        },
        photoUrl: {
          type: Sequelize.STRING
        },
        maritalStatus: {
          type: Sequelize.ENUM('Single', 'Married', 'Divorced', 'Widowed')
        },
        nationality: {
          type: Sequelize.STRING,
          defaultValue: 'Indian'
        },
        // Work Details
        workLocation: {
          type: Sequelize.STRING
        },
        employmentType: {
          type: Sequelize.ENUM('Full-time', 'Part-time', 'Contract', 'Intern'),
          defaultValue: 'Full-time'
        },
        joiningDate: {
          type: Sequelize.DATEONLY
        },
        confirmationDate: {
          type: Sequelize.DATEONLY
        },
        resignationDate: {
          type: Sequelize.DATEONLY
        },
        lastWorkingDate: {
          type: Sequelize.DATEONLY
        },
        probationPeriod: {
          type: Sequelize.INTEGER,
          defaultValue: 6
        },
        noticePeriod: {
          type: Sequelize.INTEGER,
          defaultValue: 30
        },
        salary: {
          type: Sequelize.JSON
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        deletedAt: {
          type: Sequelize.DATE
        }
      }, { transaction });

      // 5. Create refresh_tokens table
      await queryInterface.createTable('refresh_tokens', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        userId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        token: {
          type: Sequelize.TEXT,
          allowNull: false,
          unique: true
        },
        expiresAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        isRevoked: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        revokedAt: {
          type: Sequelize.DATE
        },
        userAgent: {
          type: Sequelize.TEXT
        },
        ipAddress: {
          type: Sequelize.STRING
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // 6. Create leave_types table
      await queryInterface.createTable('leave_types', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        description: {
          type: Sequelize.TEXT
        },
        maxDaysPerYear: {
          type: Sequelize.INTEGER,
          defaultValue: 20
        },
        carryForward: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        maxCarryForwardDays: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // 7. Create leave_balances table
      await queryInterface.createTable('leave_balances', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        employeeId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        leaveTypeId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'leave_types',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        year: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        totalAccrued: {
          type: Sequelize.DECIMAL(5, 2),
          defaultValue: 0
        },
        totalTaken: {
          type: Sequelize.DECIMAL(5, 2),
          defaultValue: 0
        },
        totalPending: {
          type: Sequelize.DECIMAL(5, 2),
          defaultValue: 0
        },
        balance: {
          type: Sequelize.DECIMAL(5, 2),
          defaultValue: 0
        },
        carryForward: {
          type: Sequelize.DECIMAL(5, 2),
          defaultValue: 0
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      await queryInterface.addIndex('leave_balances', ['employeeId', 'leaveTypeId', 'year'], {
        unique: true,
        transaction
      });

      // 8. Create projects table
      await queryInterface.createTable('projects', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        managerId: {
          type: Sequelize.UUID,
          references: {
            model: 'employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT
        },
        startDate: {
          type: Sequelize.DATEONLY
        },
        endDate: {
          type: Sequelize.DATEONLY
        },
        status: {
          type: Sequelize.ENUM('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'),
          defaultValue: 'Planning'
        },
        clientName: {
          type: Sequelize.STRING
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // 9. Create tasks table
      await queryInterface.createTable('tasks', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        projectId: {
          type: Sequelize.UUID,
          references: {
            model: 'projects',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        assignedTo: {
          type: Sequelize.UUID,
          references: {
            model: 'employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT
        },
        estimatedHours: {
          type: Sequelize.DECIMAL(5, 2)
        },
        actualHours: {
          type: Sequelize.DECIMAL(5, 2),
          defaultValue: 0
        },
        status: {
          type: Sequelize.ENUM('Not Started', 'In Progress', 'Completed', 'On Hold'),
          defaultValue: 'Not Started'
        },
        priority: {
          type: Sequelize.ENUM('Low', 'Medium', 'High', 'Critical'),
          defaultValue: 'Medium'
        },
        availableToAll: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // 10. Create timesheets table
      await queryInterface.createTable('timesheets', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        employeeId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        projectId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'projects',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        taskId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'tasks',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        approvedBy: {
          type: Sequelize.UUID,
          references: {
            model: 'employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        weekStartDate: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        weekEndDate: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        weekNumber: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        year: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        totalHoursWorked: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false
        },
        mondayHours: { type: Sequelize.DECIMAL(4, 2), defaultValue: 0 },
        tuesdayHours: { type: Sequelize.DECIMAL(4, 2), defaultValue: 0 },
        wednesdayHours: { type: Sequelize.DECIMAL(4, 2), defaultValue: 0 },
        thursdayHours: { type: Sequelize.DECIMAL(4, 2), defaultValue: 0 },
        fridayHours: { type: Sequelize.DECIMAL(4, 2), defaultValue: 0 },
        saturdayHours: { type: Sequelize.DECIMAL(4, 2), defaultValue: 0 },
        sundayHours: { type: Sequelize.DECIMAL(4, 2), defaultValue: 0 },
        description: {
          type: Sequelize.TEXT
        },
        status: {
          type: Sequelize.ENUM('Draft', 'Submitted', 'Approved', 'Rejected'),
          defaultValue: 'Draft'
        },
        submittedAt: {
          type: Sequelize.DATE
        },
        approvedAt: {
          type: Sequelize.DATE
        },
        rejectedAt: {
          type: Sequelize.DATE
        },
        approverComments: {
          type: Sequelize.TEXT
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        deletedAt: {
          type: Sequelize.DATE
        }
      }, { transaction });

      await queryInterface.addIndex('timesheets', ['employeeId', 'weekStartDate', 'year'], {
        unique: true,
        name: 'unique_employee_week',
        transaction
      });

      // 11. Create payrolls table
      await queryInterface.createTable('payrolls', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        employeeId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        processedBy: {
          type: Sequelize.UUID,
          references: {
            model: 'employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        payPeriodStart: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        payPeriodEnd: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        month: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        year: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        grossSalary: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },
        totalDeductions: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        netSalary: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },
        workingDays: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        actualWorkingDays: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        leaveDays: {
          type: Sequelize.DECIMAL(5, 2),
          defaultValue: 0
        },
        overtimeHours: {
          type: Sequelize.DECIMAL(5, 2),
          defaultValue: 0
        },
        overtimePay: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        status: {
          type: Sequelize.ENUM('Draft', 'Processed', 'Paid', 'Cancelled'),
          defaultValue: 'Draft'
        },
        processedAt: {
          type: Sequelize.DATE
        },
        paidAt: {
          type: Sequelize.DATE
        },
        paymentReference: {
          type: Sequelize.STRING
        },
        notes: {
          type: Sequelize.TEXT
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        deletedAt: {
          type: Sequelize.DATE
        }
      }, { transaction });

      await queryInterface.addIndex('payrolls', ['employeeId', 'month', 'year'], {
        unique: true,
        transaction
      });

      // 12. Create payroll_components table
      await queryInterface.createTable('payroll_components', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        payrollId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'payrolls',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        componentType: {
          type: Sequelize.ENUM('Earning', 'Deduction'),
          allowNull: false
        },
        componentName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        amount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },
        percentage: {
          type: Sequelize.DECIMAL(5, 2)
        },
        isFixed: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        isTaxable: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        description: {
          type: Sequelize.TEXT
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // 13. Create payroll_data table
      await queryInterface.createTable('payroll_data', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        employeeId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        createdBy: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        updatedBy: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        approvedBy: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        payPeriod: {
          type: Sequelize.STRING,
          allowNull: false
        },
        payPeriodStart: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        payPeriodEnd: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        totalWorkingDays: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 21
        },
        presentDays: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 21
        },
        absentDays: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        lopDays: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        paidDays: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        overtimeHours: {
          type: Sequelize.DECIMAL(5, 2),
          defaultValue: 0
        },
        weeklyOffDays: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        holidays: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        variableEarnings: {
          type: Sequelize.JSON,
          defaultValue: {}
        },
        variableDeductions: {
          type: Sequelize.JSON,
          defaultValue: {}
        },
        leaveAdjustments: {
          type: Sequelize.JSON,
          defaultValue: {}
        },
        grossSalary: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        totalDeductions: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        netSalary: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        paymentMode: {
          type: Sequelize.ENUM('bank_transfer', 'cheque', 'cash', 'upi'),
          defaultValue: 'bank_transfer'
        },
        disbursementDate: {
          type: Sequelize.DATEONLY
        },
        status: {
          type: Sequelize.ENUM('draft', 'calculated', 'approved', 'paid', 'cancelled'),
          defaultValue: 'draft'
        },
        approvedAt: {
          type: Sequelize.DATE
        },
        approvalComments: {
          type: Sequelize.TEXT
        },
        calculationNotes: {
          type: Sequelize.TEXT
        },
        templateUsed: {
          type: Sequelize.STRING,
          defaultValue: 'default'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      await queryInterface.addIndex('payroll_data', ['employeeId', 'payPeriod'], {
        unique: true,
        transaction
      });

      // 14. Create salary_structures table
      await queryInterface.createTable('salary_structures', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        employeeId: {
          type: Sequelize.UUID,
          references: {
            model: 'employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        basicSalary: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },
        hra: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        allowances: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        pfContribution: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        tds: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        professionalTax: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        otherDeductions: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        currency: {
          type: Sequelize.STRING,
          defaultValue: 'INR'
        },
        effectiveFrom: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // 15. Create leave_requests table
      await queryInterface.createTable('leave_requests', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        employeeId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        leaveTypeId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'leave_types',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        startDate: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        endDate: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        totalDays: {
          type: Sequelize.DECIMAL(4, 1),
          allowNull: false
        },
        reason: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled'),
          defaultValue: 'Pending',
          allowNull: false
        },
        approvedBy: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        approvedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        rejectedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        approverComments: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        isHalfDay: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        halfDayType: {
          type: Sequelize.ENUM('first-half', 'second-half', 'First Half', 'Second Half'),
          allowNull: true
        },
        isCancellation: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        originalLeaveRequestId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'leave_requests',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        cancellationNote: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        cancelledAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        deletedAt: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      await queryInterface.addIndex('leave_requests', ['employeeId'], { transaction });
      await queryInterface.addIndex('leave_requests', ['leaveTypeId'], { transaction });
      await queryInterface.addIndex('leave_requests', ['status'], { transaction });
      await queryInterface.addIndex('leave_requests', ['startDate', 'endDate'], { transaction });

      // Note: Payslips and PayslipTemplates tables will be created by separate migrations
      // (20250824000000-create-payslip-template.js and future payslip migration)

      await transaction.commit();
      console.log('✅ All base tables created successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creating base tables:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Drop tables in reverse order to respect foreign key constraints
      await queryInterface.dropTable('salary_structures', { transaction });
      await queryInterface.dropTable('payroll_data', { transaction });
      await queryInterface.dropTable('payroll_components', { transaction });
      await queryInterface.dropTable('payrolls', { transaction });
      await queryInterface.dropTable('timesheets', { transaction });
      await queryInterface.dropTable('tasks', { transaction });
      await queryInterface.dropTable('projects', { transaction });
      await queryInterface.dropTable('leave_requests', { transaction });
      await queryInterface.dropTable('leave_balances', { transaction });
      await queryInterface.dropTable('leave_types', { transaction });
      await queryInterface.dropTable('refresh_tokens', { transaction });
      await queryInterface.dropTable('employees', { transaction });
      await queryInterface.dropTable('positions', { transaction });
      await queryInterface.dropTable('departments', { transaction });
      await queryInterface.dropTable('users', { transaction });

      await transaction.commit();
      console.log('✅ All base tables dropped successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error dropping base tables:', error);
      throw error;
    }
  }
};
