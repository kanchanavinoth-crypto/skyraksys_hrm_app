const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Removing unique constraint to allow multiple timesheets per week...');
      
      // Drop the unique constraint
      await queryInterface.removeConstraint('timesheets', 'unique_employee_week_timesheet');
      console.log('✅ Removed unique_employee_week_timesheet constraint');
      
      // Also try to remove the other constraint name if it exists
      try {
        await queryInterface.removeConstraint('timesheets', 'unique_employee_week');
        console.log('✅ Removed unique_employee_week constraint');
      } catch (error) {
        console.log('ℹ️  unique_employee_week constraint not found (expected)');
      }
      
      console.log('✅ Constraint removal completed successfully');
    } catch (error) {
      console.error('❌ Error removing constraints:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('🔄 Adding back unique constraint (rollback)...');
      
      // Add the constraint back
      await queryInterface.addConstraint('timesheets', {
        fields: ['employeeId', 'weekStartDate', 'year'],
        type: 'unique',
        name: 'unique_employee_week_timesheet'
      });
      
      console.log('✅ Restored unique_employee_week_timesheet constraint');
    } catch (error) {
      console.error('❌ Error restoring constraint:', error.message);
      throw error;
    }
  }
};