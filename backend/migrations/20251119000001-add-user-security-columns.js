'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔧 Adding missing security columns to Users table...');
      
      // Check if columns exist before adding them
      const tableInfo = await queryInterface.describeTable('users');
      
      // Add missing security columns to users table
      if (!tableInfo.lockedAt) {
        await queryInterface.addColumn('users', 'lockedAt', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
        console.log('✅ Added lockedAt column');
      } else {
        console.log('ℹ️  lockedAt column already exists');
      }
      
      if (!tableInfo.lockedReason) {
        await queryInterface.addColumn('users', 'lockedReason', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
        console.log('✅ Added lockedReason column');
      } else {
        console.log('ℹ️  lockedReason column already exists');
      }
      
      if (!tableInfo.isLocked) {
        await queryInterface.addColumn('users', 'isLocked', {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        }, { transaction });
        console.log('✅ Added isLocked column');
      } else {
        console.log('ℹ️  isLocked column already exists');
      }
      
      // Add loginAttempts if it doesn't exist (for backward compatibility)
      if (!tableInfo.loginAttempts) {
        await queryInterface.addColumn('users', 'loginAttempts', {
          type: Sequelize.INTEGER,
          defaultValue: 0
        }, { transaction });
        console.log('✅ Added loginAttempts column');
      } else {
        console.log('ℹ️  loginAttempts column already exists');
      }
      
      // Add lockUntil if it doesn't exist (for backward compatibility)
      if (!tableInfo.lockUntil) {
        await queryInterface.addColumn('users', 'lockUntil', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
        console.log('✅ Added lockUntil column');
      } else {
        console.log('ℹ️  lockUntil column already exists');
      }
      
      await transaction.commit();
      console.log('🎉 User security columns migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Reverting user security columns...');
      
      // Remove the columns we added
      const tableInfo = await queryInterface.describeTable('users');
      
      if (tableInfo.lockUntil) {
        await queryInterface.removeColumn('users', 'lockUntil', { transaction });
        console.log('✅ Removed lockUntil column');
      }
      
      if (tableInfo.loginAttempts) {
        await queryInterface.removeColumn('users', 'loginAttempts', { transaction });
        console.log('✅ Removed loginAttempts column');
      }
      
      if (tableInfo.isLocked) {
        await queryInterface.removeColumn('users', 'isLocked', { transaction });
        console.log('✅ Removed isLocked column');
      }
      
      if (tableInfo.lockedReason) {
        await queryInterface.removeColumn('users', 'lockedReason', { transaction });
        console.log('✅ Removed lockedReason column');
      }
      
      if (tableInfo.lockedAt) {
        await queryInterface.removeColumn('users', 'lockedAt', { transaction });
        console.log('✅ Removed lockedAt column');
      }
      
      await transaction.commit();
      console.log('🎉 User security columns rollback completed!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};