/**
 * Migration: Add Weekly Timesheet Columns
 * 
 * This migration adds weekly timesheet columns to the existing timesheets table
 * and provides data transformation scripts.
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Adding weekly timesheet columns...');
      
      // Add new weekly columns to existing timesheets table
      await queryInterface.addColumn('timesheets', 'weekStartDate', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Monday of the week for this timesheet'
      }, { transaction });

      await queryInterface.addColumn('timesheets', 'weekEndDate', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Sunday of the week for this timesheet'
      }, { transaction });

      await queryInterface.addColumn('timesheets', 'weekNumber', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Week number in the year (1-53)'
      }, { transaction });

      await queryInterface.addColumn('timesheets', 'year', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Year for this timesheet'
      }, { transaction });

      await queryInterface.addColumn('timesheets', 'totalHoursWorked', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
      }, { transaction });

      // Add daily hours columns
      await queryInterface.addColumn('timesheets', 'mondayHours', {
        type: Sequelize.DECIMAL(4, 2),
        defaultValue: 0
      }, { transaction });

      await queryInterface.addColumn('timesheets', 'tuesdayHours', {
        type: Sequelize.DECIMAL(4, 2),
        defaultValue: 0
      }, { transaction });

      await queryInterface.addColumn('timesheets', 'wednesdayHours', {
        type: Sequelize.DECIMAL(4, 2),
        defaultValue: 0
      }, { transaction });

      await queryInterface.addColumn('timesheets', 'thursdayHours', {
        type: Sequelize.DECIMAL(4, 2),
        defaultValue: 0
      }, { transaction });

      await queryInterface.addColumn('timesheets', 'fridayHours', {
        type: Sequelize.DECIMAL(4, 2),
        defaultValue: 0
      }, { transaction });

      await queryInterface.addColumn('timesheets', 'saturdayHours', {
        type: Sequelize.DECIMAL(4, 2),
        defaultValue: 0
      }, { transaction });

      await queryInterface.addColumn('timesheets', 'sundayHours', {
        type: Sequelize.DECIMAL(4, 2),
        defaultValue: 0
      }, { transaction });

      console.log('✅ Weekly columns added successfully');

      // Create indexes for the new columns
      await queryInterface.addIndex('timesheets', {
        fields: ['employeeId', 'weekStartDate', 'year'],
        name: 'idx_timesheet_employee_week_year',
        transaction
      });

      await queryInterface.addIndex('timesheets', {
        fields: ['status', 'weekStartDate'],
        name: 'idx_timesheet_status_week',
        transaction
      });

      console.log('✅ Indexes created successfully');

      await transaction.commit();
      console.log('🎉 Weekly timesheet columns migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Removing weekly timesheet columns...');
      
      // Remove indexes first
      await queryInterface.removeIndex('timesheets', 'idx_timesheet_employee_week_year', { transaction });
      await queryInterface.removeIndex('timesheets', 'idx_timesheet_status_week', { transaction });
      
      // Remove the weekly columns
      await queryInterface.removeColumn('timesheets', 'weekStartDate', { transaction });
      await queryInterface.removeColumn('timesheets', 'weekEndDate', { transaction });
      await queryInterface.removeColumn('timesheets', 'weekNumber', { transaction });
      await queryInterface.removeColumn('timesheets', 'year', { transaction });
      await queryInterface.removeColumn('timesheets', 'totalHoursWorked', { transaction });
      await queryInterface.removeColumn('timesheets', 'mondayHours', { transaction });
      await queryInterface.removeColumn('timesheets', 'tuesdayHours', { transaction });
      await queryInterface.removeColumn('timesheets', 'wednesdayHours', { transaction });
      await queryInterface.removeColumn('timesheets', 'thursdayHours', { transaction });
      await queryInterface.removeColumn('timesheets', 'fridayHours', { transaction });
      await queryInterface.removeColumn('timesheets', 'saturdayHours', { transaction });
      await queryInterface.removeColumn('timesheets', 'sundayHours', { transaction });
      
      await transaction.commit();
      console.log('✅ Weekly timesheet columns removed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};