'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let tableDescription;
    try {
      tableDescription = await queryInterface.describeTable('leave_requests');
    } catch (err) {
      // Table doesn't exist yet (migration ordering). Skip this migration safely.
      console.log('⚠️  Table `leave_requests` does not exist yet. Skipping add-leave-cancellation-fields migration.');
      return;
    }

    // Add isCancellation column if it doesn't exist
    if (!tableDescription.isCancellation) {
      await queryInterface.addColumn('leave_requests', 'isCancellation', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Indicates if this is a cancellation request'
      });
    }
    
    // Add originalLeaveRequestId column if it doesn't exist
    if (!tableDescription.originalLeaveRequestId) {
      await queryInterface.addColumn('leave_requests', 'originalLeaveRequestId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'leave_requests',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'References the original leave request if this is a cancellation'
      });
    }
    
    // Add cancellationNote column if it doesn't exist
    if (!tableDescription.cancellationNote) {
      await queryInterface.addColumn('leave_requests', 'cancellationNote', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for cancelling the leave'
      });
    }
    
    // Add cancelledAt column if it doesn't exist
    if (!tableDescription.cancelledAt) {
      await queryInterface.addColumn('leave_requests', 'cancelledAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when the leave was cancelled'
      });
    }

    console.log('✅ Successfully added leave cancellation columns');
  },

  down: async (queryInterface, Sequelize) => {
    // Check if table exists before attempting to drop columns
    const tableExists = await queryInterface.showAllTables().then(tables => 
      tables.includes('leave_requests')
    );
    
    if (!tableExists) {
      console.log('⏭️  leave_requests table does not exist, skipping rollback');
      return;
    }

    const tableDescription = await queryInterface.describeTable('leave_requests');
    
    // Remove columns only if they exist
    if (tableDescription.cancelledAt) {
      await queryInterface.removeColumn('leave_requests', 'cancelledAt');
    }
    if (tableDescription.cancellationNote) {
      await queryInterface.removeColumn('leave_requests', 'cancellationNote');
    }
    if (tableDescription.originalLeaveRequestId) {
      await queryInterface.removeColumn('leave_requests', 'originalLeaveRequestId');
    }
    if (tableDescription.isCancellation) {
      await queryInterface.removeColumn('leave_requests', 'isCancellation');
    }

    console.log('✅ Successfully removed leave cancellation columns');
  }
};
