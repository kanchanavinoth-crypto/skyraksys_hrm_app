'use strict';

/**
 * Migration: Remove Unique Index on Timesheets
 * 
 * This migration removes the unique index 'unique_employee_week' that prevents
 * employees from creating multiple timesheets for different projects/tasks in the same week.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Checking for unique index on timesheets...');
      
      // Check if the index exists
      const [indexes] = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes 
         WHERE tablename = 'timesheets' 
         AND indexname = 'unique_employee_week';`,
        { transaction }
      );
      
      if (indexes && indexes.length > 0) {
        console.log('🔄 Removing unique index unique_employee_week...');
        
        // Drop the unique index
        await queryInterface.sequelize.query(
          'DROP INDEX IF EXISTS unique_employee_week;',
          { transaction }
        );
        
        console.log('✅ Unique index removed successfully');
        console.log('ℹ️  Employees can now create multiple timesheets per week for different projects/tasks');
      } else {
        console.log('ℹ️  Index does not exist - skipping removal');
      }
      
      await transaction.commit();
      console.log('🎉 Migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Re-adding unique index on timesheets...');
      console.log('⚠️  WARNING: This will prevent multiple tasks per week!');
      
      // Re-add the unique index (for rollback purposes only)
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX unique_employee_week 
         ON timesheets ("employeeId", "weekStartDate", year);`,
        { transaction }
      );
      
      await transaction.commit();
      console.log('✅ Unique index re-added');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};