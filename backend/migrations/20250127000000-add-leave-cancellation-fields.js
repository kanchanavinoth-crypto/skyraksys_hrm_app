'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add isCancellation column
    await queryInterface.addColumn('leave_requests', 'isCancellation', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Indicates if this is a cancellation request'
    });
    
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
    
    // Add cancellationNote column
    await queryInterface.addColumn('leave_requests', 'cancellationNote', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Reason for cancelling the leave'
    });
    
    // Add cancelledAt column
    await queryInterface.addColumn('leave_requests', 'cancelledAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when the leave was cancelled'
    });

    console.log('✅ Successfully added leave cancellation columns');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns in reverse order
    await queryInterface.removeColumn('leave_requests', 'cancelledAt');
    await queryInterface.removeColumn('leave_requests', 'cancellationNote');
    await queryInterface.removeColumn('leave_requests', 'originalLeaveRequestId');
    await queryInterface.removeColumn('leave_requests', 'isCancellation');

    console.log('✅ Successfully removed leave cancellation columns');
  }
};
