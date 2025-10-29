'use strict';

/**
 * Migration: Add Payslip Edit Tracking and Audit Log
 * 
 * This migration adds:
 * 1. Edit tracking fields to payslips table (manuallyEdited, lastEditedBy, lastEditedAt)
 * 2. Finalization tracking fields (finalizedAt, finalizedBy)
 * 3. Payment tracking fields (paidAt, paidBy, paymentMethod, paymentReference)
 * 4. PayslipAuditLogs table for complete audit trail
 * 
 * Required for: Manual Edit Payslip Feature
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ========================================
    // 1. Add edit tracking fields to payslips
    // ========================================
    
    await queryInterface.addColumn('payslips', 'manuallyEdited', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates if payslip was manually edited'
    });
    
    await queryInterface.addColumn('payslips', 'lastEditedBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who last edited the payslip'
    });
    
    await queryInterface.addColumn('payslips', 'lastEditedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of last edit'
    });
    
    // ========================================
    // 2. Add finalization tracking fields
    // ========================================
    
    await queryInterface.addColumn('payslips', 'finalizedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When payslip was finalized'
    });
    
    await queryInterface.addColumn('payslips', 'finalizedBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who finalized the payslip'
    });
    
    // ========================================
    // 3. Add payment tracking fields
    // ========================================
    
    await queryInterface.addColumn('payslips', 'paidAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When payslip was marked as paid'
    });
    
    await queryInterface.addColumn('payslips', 'paidBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who marked as paid'
    });
    
    await queryInterface.addColumn('payslips', 'paymentMethod', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Method of payment (bank transfer, cheque, etc.)'
    });
    
    await queryInterface.addColumn('payslips', 'paymentReference', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Payment transaction reference number'
    });
    
    // ========================================
    // 4. Create PayslipAuditLogs table
    // ========================================
    
    await queryInterface.createTable('PayslipAuditLogs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      payslipId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'payslips',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Reference to payslip'
      },
      action: {
        type: Sequelize.ENUM(
          'manual_edit',
          'status_change',
          'finalize',
          'mark_paid',
          'regenerate'
        ),
        allowNull: false,
        comment: 'Type of action performed'
      },
      performedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'User who performed the action'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for the action (required for manual edits)'
      },
      changes: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Before and after values for manual edits'
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'IP address of the user'
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Browser/client user agent'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp of the action'
      }
    });
    
    // ========================================
    // 5. Create indexes for performance
    // ========================================
    
    // Indexes on payslips table
    await queryInterface.addIndex('payslips', ['manuallyEdited'], {
      name: 'idx_payslips_manually_edited'
    });
    
    await queryInterface.addIndex('payslips', ['lastEditedBy'], {
      name: 'idx_payslips_last_edited_by'
    });
    
    await queryInterface.addIndex('payslips', ['lastEditedAt'], {
      name: 'idx_payslips_last_edited_at'
    });
    
    await queryInterface.addIndex('payslips', ['finalizedAt'], {
      name: 'idx_payslips_finalized_at'
    });
    
    await queryInterface.addIndex('payslips', ['paidAt'], {
      name: 'idx_payslips_paid_at'
    });
    
    // Indexes on PayslipAuditLogs table
    await queryInterface.addIndex('PayslipAuditLogs', ['payslipId'], {
      name: 'idx_audit_logs_payslip_id'
    });
    
    await queryInterface.addIndex('PayslipAuditLogs', ['performedBy'], {
      name: 'idx_audit_logs_performed_by'
    });
    
    await queryInterface.addIndex('PayslipAuditLogs', ['action'], {
      name: 'idx_audit_logs_action'
    });
    
    await queryInterface.addIndex('PayslipAuditLogs', ['createdAt'], {
      name: 'idx_audit_logs_created_at'
    });
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Added edit tracking fields to payslips table');
    console.log('✅ Created PayslipAuditLogs table');
    console.log('✅ Created all indexes for optimal performance');
  },

  down: async (queryInterface, Sequelize) => {
    // ========================================
    // Rollback: Remove everything in reverse order
    // ========================================
    
    console.log('⚠️  Rolling back migration...');
    
    // 1. Drop indexes from PayslipAuditLogs
    await queryInterface.removeIndex('PayslipAuditLogs', 'idx_audit_logs_created_at');
    await queryInterface.removeIndex('PayslipAuditLogs', 'idx_audit_logs_action');
    await queryInterface.removeIndex('PayslipAuditLogs', 'idx_audit_logs_performed_by');
    await queryInterface.removeIndex('PayslipAuditLogs', 'idx_audit_logs_payslip_id');
    
    // 2. Drop indexes from payslips
    await queryInterface.removeIndex('payslips', 'idx_payslips_paid_at');
    await queryInterface.removeIndex('payslips', 'idx_payslips_finalized_at');
    await queryInterface.removeIndex('payslips', 'idx_payslips_last_edited_at');
    await queryInterface.removeIndex('payslips', 'idx_payslips_last_edited_by');
    await queryInterface.removeIndex('payslips', 'idx_payslips_manually_edited');
    
    // 3. Drop PayslipAuditLogs table
    await queryInterface.dropTable('PayslipAuditLogs');
    
    // 4. Remove payment tracking fields
    await queryInterface.removeColumn('payslips', 'paymentReference');
    await queryInterface.removeColumn('payslips', 'paymentMethod');
    await queryInterface.removeColumn('payslips', 'paidBy');
    await queryInterface.removeColumn('payslips', 'paidAt');
    
    // 5. Remove finalization tracking fields
    await queryInterface.removeColumn('payslips', 'finalizedBy');
    await queryInterface.removeColumn('payslips', 'finalizedAt');
    
    // 6. Remove edit tracking fields
    await queryInterface.removeColumn('payslips', 'lastEditedAt');
    await queryInterface.removeColumn('payslips', 'lastEditedBy');
    await queryInterface.removeColumn('payslips', 'manuallyEdited');
    
    console.log('✅ Rollback completed successfully!');
  }
};
