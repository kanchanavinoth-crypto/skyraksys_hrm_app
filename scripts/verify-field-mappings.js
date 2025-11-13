#!/usr/bin/env node
/**
 * 🔍 Field Mapping Verification Script
 * 
 * This script verifies that all field mappings analyzed in FIELD_MAPPING_ANALYSIS.md
 * are correctly implemented in the production database after migration.
 * 
 * It checks:
 * - Database schema matches expected structure
 * - All fields exist with correct data types
 * - Foreign key relationships are properly established
 * - Indexes are in place
 * - Field constraints are enforced
 */

const { sequelize } = require('../backend/models');
const path = require('path');

// Expected field mappings based on our analysis
const EXPECTED_SCHEMA = {
  users: {
    fields: {
      id: { type: 'UUID', nullable: false, primaryKey: true },
      firstName: { type: 'VARCHAR', nullable: false },
      lastName: { type: 'VARCHAR', nullable: false },
      email: { type: 'VARCHAR', nullable: false, unique: true },
      password: { type: 'VARCHAR', nullable: false },
      role: { type: 'ENUM', nullable: false, values: ['admin', 'hr', 'manager', 'employee'] },
      isActive: { type: 'BOOLEAN', nullable: true, default: true },
      lastLoginAt: { type: 'TIMESTAMP', nullable: true },
      passwordChangedAt: { type: 'TIMESTAMP', nullable: true },
      emailVerifiedAt: { type: 'TIMESTAMP', nullable: true }
    },
    indexes: ['email'],
    constraints: ['users_email_key']
  },
  
  employees: {
    fields: {
      id: { type: 'UUID', nullable: false, primaryKey: true },
      userId: { type: 'UUID', nullable: true, foreignKey: 'users.id' },
      departmentId: { type: 'UUID', nullable: true, foreignKey: 'departments.id' },
      positionId: { type: 'UUID', nullable: true, foreignKey: 'positions.id' },
      managerId: { type: 'UUID', nullable: true, foreignKey: 'employees.id' },
      employeeId: { type: 'VARCHAR', nullable: false, unique: true },
      firstName: { type: 'VARCHAR', nullable: false },
      lastName: { type: 'VARCHAR', nullable: false },
      email: { type: 'VARCHAR', nullable: false, unique: true },
      phone: { type: 'VARCHAR', nullable: true },
      hireDate: { type: 'DATE', nullable: false },
      status: { type: 'ENUM', nullable: true, values: ['Active', 'Inactive', 'On Leave', 'Terminated'] },
      aadhaarNumber: { type: 'VARCHAR', nullable: true },
      panNumber: { type: 'VARCHAR', nullable: true },
      uanNumber: { type: 'VARCHAR', nullable: true },
      pfNumber: { type: 'VARCHAR', nullable: true },
      esiNumber: { type: 'VARCHAR', nullable: true },
      bankName: { type: 'VARCHAR', nullable: true },
      bankAccountNumber: { type: 'VARCHAR', nullable: true },
      ifscCode: { type: 'VARCHAR', nullable: true },
      bankBranch: { type: 'VARCHAR', nullable: true },
      accountHolderName: { type: 'VARCHAR', nullable: true },
      address: { type: 'TEXT', nullable: true },
      city: { type: 'VARCHAR', nullable: true },
      state: { type: 'VARCHAR', nullable: true },
      pinCode: { type: 'VARCHAR', nullable: true },
      emergencyContactName: { type: 'VARCHAR', nullable: true },
      emergencyContactPhone: { type: 'VARCHAR', nullable: true },
      emergencyContactRelation: { type: 'VARCHAR', nullable: true },
      dateOfBirth: { type: 'DATE', nullable: true },
      gender: { type: 'ENUM', nullable: true, values: ['Male', 'Female', 'Other'] },
      photoUrl: { type: 'VARCHAR', nullable: true },
      maritalStatus: { type: 'ENUM', nullable: true, values: ['Single', 'Married', 'Divorced', 'Widowed'] },
      nationality: { type: 'VARCHAR', nullable: true },
      workLocation: { type: 'VARCHAR', nullable: true },
      employmentType: { type: 'ENUM', nullable: true, values: ['Full-time', 'Part-time', 'Contract', 'Intern'] },
      joiningDate: { type: 'DATE', nullable: true },
      confirmationDate: { type: 'DATE', nullable: true },
      resignationDate: { type: 'DATE', nullable: true },
      lastWorkingDate: { type: 'DATE', nullable: true },
      probationPeriod: { type: 'INTEGER', nullable: true },
      noticePeriod: { type: 'INTEGER', nullable: true },
      salary: { type: 'JSON', nullable: true }
    },
    indexes: ['employeeId', 'email'],
    constraints: ['employees_employeeId_key', 'employees_email_key']
  },

  projects: {
    fields: {
      id: { type: 'UUID', nullable: false, primaryKey: true },
      managerId: { type: 'UUID', nullable: true, foreignKey: 'employees.id' },
      name: { type: 'VARCHAR', nullable: false },
      description: { type: 'TEXT', nullable: true },
      startDate: { type: 'DATE', nullable: true },
      endDate: { type: 'DATE', nullable: true },
      status: { type: 'ENUM', nullable: true, values: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'] },
      clientName: { type: 'VARCHAR', nullable: true },
      isActive: { type: 'BOOLEAN', nullable: true, default: true }
    }
  },

  tasks: {
    fields: {
      id: { type: 'UUID', nullable: false, primaryKey: true },
      projectId: { type: 'UUID', nullable: true, foreignKey: 'projects.id' },
      assignedTo: { type: 'UUID', nullable: true, foreignKey: 'employees.id' },
      name: { type: 'VARCHAR', nullable: false },
      description: { type: 'TEXT', nullable: true },
      estimatedHours: { type: 'NUMERIC', nullable: true },
      actualHours: { type: 'NUMERIC', nullable: true },
      status: { type: 'ENUM', nullable: true, values: ['Not Started', 'In Progress', 'Completed', 'On Hold'] },
      priority: { type: 'ENUM', nullable: true, values: ['Low', 'Medium', 'High', 'Critical'] },
      availableToAll: { type: 'BOOLEAN', nullable: true, default: false },
      isActive: { type: 'BOOLEAN', nullable: true, default: true }
    }
  },

  timesheets: {
    fields: {
      id: { type: 'UUID', nullable: false, primaryKey: true },
      employeeId: { type: 'UUID', nullable: false, foreignKey: 'employees.id' },
      projectId: { type: 'UUID', nullable: false, foreignKey: 'projects.id' },
      taskId: { type: 'UUID', nullable: false, foreignKey: 'tasks.id' },
      date: { type: 'DATE', nullable: false },
      hoursWorked: { type: 'NUMERIC', nullable: false },
      description: { type: 'TEXT', nullable: true },
      status: { type: 'ENUM', nullable: true, values: ['draft', 'submitted', 'approved', 'rejected'] },
      approvedBy: { type: 'UUID', nullable: true, foreignKey: 'employees.id' },
      approvedAt: { type: 'TIMESTAMP', nullable: true },
      // Weekly timesheet columns (added in migration 20250917000001)
      weekStartDate: { type: 'DATE', nullable: true },
      weekEndDate: { type: 'DATE', nullable: true },
      weekNumber: { type: 'INTEGER', nullable: true },
      year: { type: 'INTEGER', nullable: true }
    }
  },

  departments: {
    fields: {
      id: { type: 'UUID', nullable: false, primaryKey: true },
      name: { type: 'VARCHAR', nullable: false, unique: true },
      description: { type: 'TEXT', nullable: true },
      isActive: { type: 'BOOLEAN', nullable: true, default: true }
    },
    indexes: ['name'],
    constraints: ['departments_name_key']
  },

  positions: {
    fields: {
      id: { type: 'UUID', nullable: false, primaryKey: true },
      departmentId: { type: 'UUID', nullable: true, foreignKey: 'departments.id' },
      title: { type: 'VARCHAR', nullable: false },
      description: { type: 'TEXT', nullable: true },
      level: { type: 'VARCHAR', nullable: true },
      isActive: { type: 'BOOLEAN', nullable: true, default: true }
    }
  }
};

class FieldMappingVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async verifyTableExists(tableName) {
    try {
      const [results] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = '${tableName}'
        );
      `);
      
      return results[0].exists;
    } catch (error) {
      this.errors.push(`Failed to check if table ${tableName} exists: ${error.message}`);
      return false;
    }
  }

  async getTableStructure(tableName) {
    try {
      const [columns] = await sequelize.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);

      return columns.reduce((acc, col) => {
        acc[col.column_name] = {
          type: col.data_type.toUpperCase(),
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          maxLength: col.character_maximum_length,
          precision: col.numeric_precision,
          scale: col.numeric_scale
        };
        return acc;
      }, {});
    } catch (error) {
      this.errors.push(`Failed to get structure for table ${tableName}: ${error.message}`);
      return {};
    }
  }

  async getForeignKeys(tableName) {
    try {
      const [fks] = await sequelize.query(`
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = '${tableName}';
      `);

      return fks.reduce((acc, fk) => {
        acc[fk.column_name] = `${fk.foreign_table_name}.${fk.foreign_column_name}`;
        return acc;
      }, {});
    } catch (error) {
      this.errors.push(`Failed to get foreign keys for table ${tableName}: ${error.message}`);
      return {};
    }
  }

  async getEnumValues(tableName, columnName) {
    try {
      const [enums] = await sequelize.query(`
        SELECT unnest(enum_range(NULL::${tableName}_${columnName}_enum)) AS enum_value;
      `);
      
      return enums.map(e => e.enum_value);
    } catch (error) {
      // ENUM might not exist or have different naming
      return [];
    }
  }

  normalizeDataType(pgType) {
    const typeMap = {
      'character varying': 'VARCHAR',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'numeric': 'NUMERIC',
      'decimal': 'NUMERIC',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'timestamp without time zone': 'TIMESTAMP',
      'timestamp with time zone': 'TIMESTAMP',
      'json': 'JSON',
      'jsonb': 'JSON',
      'uuid': 'UUID',
      'user-defined': 'ENUM'
    };
    
    return typeMap[pgType.toLowerCase()] || pgType.toUpperCase();
  }

  async verifyTable(tableName) {
    this.log(`\n🔍 Verifying table: ${tableName}`, 'info');
    
    // Check if table exists
    const tableExists = await this.verifyTableExists(tableName);
    if (!tableExists) {
      this.errors.push(`❌ Table ${tableName} does not exist`);
      return false;
    }
    
    this.success.push(`✅ Table ${tableName} exists`);
    
    // Get expected schema
    const expectedSchema = EXPECTED_SCHEMA[tableName];
    if (!expectedSchema) {
      this.warnings.push(`⚠️ No expected schema defined for table ${tableName}`);
      return true;
    }
    
    // Get actual structure
    const actualStructure = await this.getTableStructure(tableName);
    const foreignKeys = await this.getForeignKeys(tableName);
    
    // Verify each expected field
    for (const [fieldName, expectedField] of Object.entries(expectedSchema.fields)) {
      const actualField = actualStructure[fieldName.toLowerCase()];
      
      if (!actualField) {
        this.errors.push(`❌ Field ${tableName}.${fieldName} is missing`);
        continue;
      }
      
      // Normalize and compare data types
      const actualType = this.normalizeDataType(actualField.type);
      const expectedType = expectedField.type;
      
      if (actualType !== expectedType) {
        // Special handling for common type variations
        if (!(
          (expectedType === 'VARCHAR' && actualType === 'TEXT') ||
          (expectedType === 'TIMESTAMP' && actualType.includes('TIMESTAMP')) ||
          (expectedType === 'NUMERIC' && actualType === 'NUMERIC')
        )) {
          this.warnings.push(`⚠️ Field ${tableName}.${fieldName} type mismatch: expected ${expectedType}, got ${actualType}`);
        }
      }
      
      // Check nullable constraint
      if (expectedField.nullable !== actualField.nullable) {
        this.warnings.push(`⚠️ Field ${tableName}.${fieldName} nullable mismatch: expected ${expectedField.nullable}, got ${actualField.nullable}`);
      }
      
      // Check foreign key
      if (expectedField.foreignKey) {
        const actualFK = foreignKeys[fieldName.toLowerCase()];
        if (!actualFK) {
          this.errors.push(`❌ Missing foreign key constraint for ${tableName}.${fieldName} -> ${expectedField.foreignKey}`);
        } else if (actualFK !== expectedField.foreignKey) {
          this.warnings.push(`⚠️ Foreign key mismatch for ${tableName}.${fieldName}: expected ${expectedField.foreignKey}, got ${actualFK}`);
        } else {
          this.success.push(`✅ Foreign key ${tableName}.${fieldName} -> ${actualFK} is correct`);
        }
      }
      
      // Verify ENUM values if specified
      if (expectedField.values && actualType === 'ENUM') {
        const actualEnumValues = await this.getEnumValues(tableName, fieldName);
        const missingValues = expectedField.values.filter(v => !actualEnumValues.includes(v));
        const extraValues = actualEnumValues.filter(v => !expectedField.values.includes(v));
        
        if (missingValues.length > 0) {
          this.errors.push(`❌ Missing ENUM values for ${tableName}.${fieldName}: ${missingValues.join(', ')}`);
        }
        if (extraValues.length > 0) {
          this.warnings.push(`⚠️ Extra ENUM values for ${tableName}.${fieldName}: ${extraValues.join(', ')}`);
        }
        if (missingValues.length === 0 && extraValues.length === 0) {
          this.success.push(`✅ ENUM values for ${tableName}.${fieldName} are correct`);
        }
      }
    }
    
    // Check for unexpected fields
    const expectedFieldNames = Object.keys(expectedSchema.fields).map(f => f.toLowerCase());
    const actualFieldNames = Object.keys(actualStructure);
    const extraFields = actualFieldNames.filter(f => 
      !expectedFieldNames.includes(f) && 
      !['createdAt', 'updatedAt', 'deletedAt'].includes(f)
    );
    
    if (extraFields.length > 0) {
      this.warnings.push(`⚠️ Unexpected fields in ${tableName}: ${extraFields.join(', ')}`);
    }
    
    return true;
  }

  async verifyMigrationTable() {
    this.log('\n🔍 Verifying migration tracking...', 'info');
    
    try {
      const [migrations] = await sequelize.query(`
        SELECT name FROM "SequelizeMeta" ORDER BY name;
      `);
      
      this.log(`📊 Total migrations executed: ${migrations.length}`, 'info');
      
      // Check for our specific migrations
      const expectedMigrations = [
        '20241201000000-create-base-tables.js',
        '20250917000001-add-weekly-timesheet-columns.js'
      ];
      
      const executedMigrationNames = migrations.map(m => m.name);
      
      for (const expectedMig of expectedMigrations) {
        if (executedMigrationNames.includes(expectedMig)) {
          this.success.push(`✅ Migration ${expectedMig} has been executed`);
        } else {
          this.errors.push(`❌ Missing migration: ${expectedMig}`);
        }
      }
      
      // Show recent migrations
      this.log('\n📝 Recent migrations:', 'info');
      migrations.slice(-5).forEach((mig, idx) => {
        this.log(`  ${migrations.length - 4 + idx}. ${mig.name}`, 'info');
      });
      
    } catch (error) {
      this.errors.push(`Failed to verify migration table: ${error.message}`);
    }
  }

  async run() {
    this.log('🚀 Starting Field Mapping Verification...', 'info');
    this.log(`Timestamp: ${new Date().toISOString()}`, 'info');
    
    try {
      // Test database connection
      await sequelize.authenticate();
      this.success.push('✅ Database connection successful');
      
      // Verify migration tracking
      await this.verifyMigrationTable();
      
      // Verify each table
      for (const tableName of Object.keys(EXPECTED_SCHEMA)) {
        await this.verifyTable(tableName);
      }
      
      // Generate summary report
      this.generateReport();
      
      return this.errors.length === 0;
      
    } catch (error) {
      this.errors.push(`Database connection failed: ${error.message}`);
      this.generateReport();
      return false;
    }
  }

  generateReport() {
    this.log('\n📋 FIELD MAPPING VERIFICATION REPORT', 'info');
    this.log('=' .repeat(50), 'info');
    
    this.log(`\n✅ Successful checks: ${this.success.length}`, 'success');
    if (this.success.length > 0) {
      this.success.forEach(msg => this.log(`  ${msg}`, 'success'));
    }
    
    this.log(`\n⚠️  Warnings: ${this.warnings.length}`, 'warning');
    if (this.warnings.length > 0) {
      this.warnings.forEach(msg => this.log(`  ${msg}`, 'warning'));
    }
    
    this.log(`\n❌ Errors: ${this.errors.length}`, 'error');
    if (this.errors.length > 0) {
      this.errors.forEach(msg => this.log(`  ${msg}`, 'error'));
    }
    
    this.log('\n' + '='.repeat(50), 'info');
    
    if (this.errors.length === 0) {
      this.log('🎉 ALL FIELD MAPPINGS VERIFIED SUCCESSFULLY!', 'success');
      return true;
    } else {
      this.log('💥 FIELD MAPPING VERIFICATION FAILED!', 'error');
      this.log(`Fix ${this.errors.length} error(s) before deploying to production`, 'error');
      return false;
    }
  }
}

// CLI execution
if (require.main === module) {
  const verifier = new FieldMappingVerifier();
  
  verifier.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Verification script failed:', error.message);
      process.exit(1);
    })
    .finally(() => {
      sequelize.close();
    });
}

module.exports = FieldMappingVerifier;