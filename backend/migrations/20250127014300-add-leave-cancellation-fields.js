'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Starting migration: Add leave cancellation fields...');
    
    try {
      // Add isCancellation column
      await queryInterface.addColumn('leave_requests', 'isCancellation', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Indicates if this is a cancellation request'
      });
      console.log('✅ Added column: isCancellation');
      
      // Add originalLeaveRequestId column (self-referencing foreign key)
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
      
      // Add cancellationNote column
      await queryInterface.addColumn('leave_requests', 'cancellationNote', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for cancelling the leave'
      });
      console.log('✅ Added column: cancellationNote');
      
      // Add cancelledAt column
      await queryInterface.addColumn('leave_requests', 'cancelledAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when the leave was cancelled'
      });
      console.log('✅ Added column: cancelledAt');

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
