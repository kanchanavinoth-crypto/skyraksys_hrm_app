'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payslips', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      employeeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      payrollDataId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'payroll_data',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      payPeriod: {
        type: Sequelize.STRING,
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
      payPeriodStart: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      payPeriodEnd: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      templateId: {
        type: Sequelize.UUID,
        allowNull: true
        // Note: Foreign key constraint will be added by a later migration after PayslipTemplates table is created
      },
      templateVersion: {
        type: Sequelize.STRING,
        defaultValue: '1.0'
      },
      employeeInfo: {
        type: Sequelize.JSON,
        allowNull: false
      },
      companyInfo: {
        type: Sequelize.JSON,
        allowNull: false
      },
      earnings: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      deductions: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      attendance: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      grossEarnings: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      totalDeductions: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      netPay: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      netPayInWords: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      payslipNumber: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      payDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      generatedDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      generatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('draft', 'finalized', 'paid', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      calculationDetails: {
        type: Sequelize.JSON,
        allowNull: true
      },
      pdfMetadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      additionalData: {
        type: Sequelize.JSON,
        allowNull: true
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      isLocked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    });

    // Create indexes
    await queryInterface.addIndex('payslips', ['employeeId', 'month', 'year'], {
      unique: true,
      name: 'unique_employee_month_year'
    });

    await queryInterface.addIndex('payslips', ['month', 'year'], {
      name: 'idx_payslips_month_year'
    });

    await queryInterface.addIndex('payslips', ['status'], {
      name: 'idx_payslips_status'
    });

    await queryInterface.addIndex('payslips', ['payslipNumber'], {
      unique: true,
      name: 'idx_payslips_number_unique'
    });

    await queryInterface.addIndex('payslips', ['templateId'], {
      name: 'idx_payslips_template'
    });

    await queryInterface.addIndex('payslips', ['payrollDataId'], {
      name: 'idx_payslips_payroll_data'
    });

    await queryInterface.addIndex('payslips', ['generatedBy'], {
      name: 'idx_payslips_generated_by'
    });

    await queryInterface.addIndex('payslips', ['isLocked'], {
      name: 'idx_payslips_locked'
    });

    console.log('✅ Created payslips table with all indexes');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payslips');
    console.log('✅ Dropped payslips table');
  }
};
