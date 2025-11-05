'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists (created by base migration)
    const tableExists = await queryInterface.showAllTables().then(tables => 
      tables.includes('leave_requests')
    );
    
    if (tableExists) {
      console.log('⏭️  leave_requests table already exists, skipping creation');
      return;
    }

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
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('leave_requests', ['employeeId']);
    await queryInterface.addIndex('leave_requests', ['leaveTypeId']);
    await queryInterface.addIndex('leave_requests', ['status']);
    await queryInterface.addIndex('leave_requests', ['startDate', 'endDate']);
    
    console.log('✅ Created leave_requests table with all columns');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('leave_requests');
    console.log('✅ Dropped leave_requests table');
  }
};
