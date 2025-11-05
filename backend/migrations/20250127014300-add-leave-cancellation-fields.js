'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Starting migration: Add leave cancellation fields...');
    
    try {
      let tableDescription;
      try {
        tableDescription = await queryInterface.describeTable('leave_requests');
      } catch (err) {
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
        console.log('✅ Added column: isCancellation');
      } else {
        console.log('ℹ️ Column already exists: isCancellation');
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
        console.log('✅ Added column: originalLeaveRequestId');
      } else {
        console.log('ℹ️ Column already exists: originalLeaveRequestId');
      }
      
      // Add cancellationNote column if it doesn't exist
      if (!tableDescription.cancellationNote) {
        await queryInterface.addColumn('leave_requests', 'cancellationNote', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Reason for cancelling the leave'
        });
        console.log('✅ Added column: cancellationNote');
      } else {
        console.log('ℹ️ Column already exists: cancellationNote');
      }
      
      // Add cancelledAt column if it doesn't exist
      if (!tableDescription.cancelledAt) {
        await queryInterface.addColumn('leave_requests', 'cancelledAt', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp when the leave was cancelled'
        });
        console.log('✅ Added column: cancelledAt');
      } else {
        console.log('ℹ️ Column already exists: cancelledAt');
      }

      console.log('✅ Successfully added all leave cancellation columns');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back migration: Remove leave cancellation fields...');
    
    try {
      // Remove columns in reverse order
      await queryInterface.removeColumn('leave_requests', 'cancelledAt');
      console.log('✅ Removed column: cancelledAt');
      
      await queryInterface.removeColumn('leave_requests', 'cancellationNote');
      console.log('✅ Removed column: cancellationNote');
      
      await queryInterface.removeColumn('leave_requests', 'originalLeaveRequestId');
      console.log('✅ Removed column: originalLeaveRequestId');
      
      await queryInterface.removeColumn('leave_requests', 'isCancellation');
      console.log('✅ Removed column: isCancellation');

      console.log('✅ Successfully removed all leave cancellation columns');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
