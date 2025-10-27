'use strict';

/**
 * Migration: Remove Unique Constraint on Timesheets
 * 
 * This migration removes the incorrect UNIQUE constraint on (employeeId, weekStartDate, year)
 * to allow employees to have multiple timesheets (for different projects/tasks) in the same week.
 * 
 * The constraint was preventing users from creating multiple task entries for the same week,
 * which is a critical feature for timesheet management.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Removing unique constraint on timesheets...');
      
      // Drop the unique constraint that's preventing multiple tasks per week
      await queryInterface.removeConstraint(
        'timesheets',
        'unique_employee_week_timesheet',
        { transaction }
      );
      
      console.log('✅ Unique constraint removed successfully');
      console.log('ℹ️  Employees can now create multiple timesheets per week for different projects/tasks');
      
      await transaction.commit();
      console.log('🎉 Migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      
      // If constraint doesn't exist, that's okay - it might have been removed already
      if (error.message && error.message.includes('does not exist')) {
        console.log('ℹ️  Constraint already removed or never existed - skipping');
      } else {
        console.error('❌ Migration failed:', error);
        throw error;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Re-adding unique constraint on timesheets...');
      console.log('⚠️  WARNING: This will prevent multiple tasks per week!');
      
      // Re-add the unique constraint (for rollback purposes only)
      await queryInterface.addConstraint('timesheets', {
        fields: ['employeeId', 'weekStartDate', 'year'],
        type: 'unique',
        name: 'unique_employee_week_timesheet',
        transaction
      });
      
      await transaction.commit();
      console.log('✅ Unique constraint re-added');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
