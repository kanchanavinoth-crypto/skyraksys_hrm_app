#!/usr/bin/env node
/**
 * 🚀 Production Migration Runner
 * 
 * This script safely runs migrations in production with proper error handling,
 * rollback capabilities, and field mapping verification.
 * 
 * Usage:
 * node scripts/production/production-migration-runner.js [options]
 * 
 * Options:
 * --dry-run          Simulate migration without executing
 * --force-override   Force migration even if issues exist (USE WITH CAUTION)
 * --backup           Create backup before migration (recommended)
 * --verify-fields    Verify field mappings after migration
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

class ProductionMigrationRunner {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      forceOverride: options.forceOverride || false,
      backup: options.backup !== false, // Default to true
      verifyFields: options.verifyFields !== false, // Default to true
      ...options
    };
    
    this.backupPath = null;
    this.migrationStartTime = null;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async checkEnvironment() {
    this.log('🔍 Checking Production Environment...', 'cyan');
    
    // Check if we're in production
    if (process.env.NODE_ENV !== 'production') {
      this.log('⚠️  WARNING: NODE_ENV is not set to "production"', 'yellow');
      if (!this.options.forceOverride) {
        throw new Error('This script should only run in production environment');
      }
    }

    // Check required environment variables
    const requiredEnvVars = [
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    this.log('✅ Environment check passed', 'green');
  }

  async testDatabaseConnection() {
    this.log('🔌 Testing Database Connection...', 'cyan');
    
    try {
      const { stdout } = await execAsync('npm run db:test-connection');
      this.log('✅ Database connection successful', 'green');
      return true;
    } catch (error) {
      this.log('❌ Database connection failed:', 'red');
      this.log(error.message, 'red');
      throw error;
    }
  }

  async checkMigrationStatus() {
    this.log('📊 Checking Migration Status...', 'cyan');
    
    try {
      const { stdout } = await execAsync('npx sequelize-cli db:migrate:status');
      this.log('Current Migration Status:', 'blue');
      this.log(stdout);
      
      // Parse output to identify pending migrations
      const lines = stdout.split('\n');
      const pending = lines.filter(line => line.includes('down'));
      const executed = lines.filter(line => line.includes('up'));
      
      this.log(`✅ Executed migrations: ${executed.length}`, 'green');
      if (pending.length > 0) {
        this.log(`⏳ Pending migrations: ${pending.length}`, 'yellow');
        pending.forEach(migration => this.log(`  - ${migration}`, 'yellow'));
        return { hasPending: true, pending, executed };
      }
      
      this.log('✅ All migrations are up to date', 'green');
      return { hasPending: false, pending: [], executed };
    } catch (error) {
      this.log('❌ Failed to check migration status:', 'red');
      throw error;
    }
  }

  async createDatabaseBackup() {
    if (!this.options.backup) {
      this.log('⏭️  Skipping backup (disabled)', 'yellow');
      return null;
    }

    this.log('💾 Creating Database Backup...', 'cyan');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `production-backup-${timestamp}.sql`;
    this.backupPath = path.join(process.cwd(), 'backups', backupFileName);
    
    try {
      // Ensure backup directory exists
      await fs.mkdir(path.dirname(this.backupPath), { recursive: true });
      
      const pgDumpCmd = `pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -f ${this.backupPath}`;
      
      if (this.options.dryRun) {
        this.log(`🔍 DRY RUN: Would execute: ${pgDumpCmd}`, 'yellow');
        return this.backupPath;
      }
      
      await execAsync(pgDumpCmd);
      this.log(`✅ Backup created: ${this.backupPath}`, 'green');
      return this.backupPath;
    } catch (error) {
      this.log('❌ Backup creation failed:', 'red');
      this.log(error.message, 'red');
      throw error;
    }
  }

  async runMigrations() {
    this.log('🚀 Running Database Migrations...', 'cyan');
    this.migrationStartTime = Date.now();
    
    if (this.options.dryRun) {
      this.log('🔍 DRY RUN: Would execute migrations', 'yellow');
      return { success: true, dryRun: true };
    }
    
    try {
      const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate');
      
      if (stderr && !stderr.includes('Logging')) {
        this.log('⚠️  Migration warnings:', 'yellow');
        this.log(stderr, 'yellow');
      }
      
      this.log('✅ Migrations completed successfully', 'green');
      this.log(stdout, 'blue');
      
      const migrationTime = Date.now() - this.migrationStartTime;
      this.log(`⏱️  Migration completed in ${migrationTime}ms`, 'cyan');
      
      return { success: true, output: stdout, time: migrationTime };
    } catch (error) {
      this.log('❌ Migration failed:', 'red');
      this.log(error.message, 'red');
      
      if (error.stdout) {
        this.log('STDOUT:', 'blue');
        this.log(error.stdout, 'blue');
      }
      
      if (error.stderr) {
        this.log('STDERR:', 'red');
        this.log(error.stderr, 'red');
      }
      
      throw error;
    }
  }

  async verifyFieldMappings() {
    if (!this.options.verifyFields) {
      this.log('⏭️  Skipping field mapping verification (disabled)', 'yellow');
      return true;
    }

    this.log('🔍 Verifying Field Mappings...', 'cyan');
    
    try {
      // Load the field mapping verification script
      const verifyScript = path.join(process.cwd(), 'scripts', 'verify-field-mappings.js');
      
      if (await this.fileExists(verifyScript)) {
        const { stdout } = await execAsync(`node ${verifyScript}`);
        this.log('✅ Field mapping verification passed', 'green');
        return true;
      } else {
        this.log('⚠️  Field mapping verification script not found', 'yellow');
        return true;
      }
    } catch (error) {
      this.log('❌ Field mapping verification failed:', 'red');
      this.log(error.message, 'red');
      
      if (!this.options.forceOverride) {
        throw error;
      }
      
      this.log('⚠️  Continuing due to --force-override flag', 'yellow');
      return false;
    }
  }

  async rollback() {
    this.log('🔄 Rolling back migrations...', 'yellow');
    
    try {
      if (this.backupPath && await this.fileExists(this.backupPath)) {
        this.log('🔄 Restoring from backup...', 'yellow');
        
        const restoreCmd = `psql -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -f ${this.backupPath}`;
        await execAsync(restoreCmd);
        
        this.log('✅ Database restored from backup', 'green');
      } else {
        this.log('⚠️  No backup available, using Sequelize rollback', 'yellow');
        await execAsync('npx sequelize-cli db:migrate:undo');
        this.log('✅ Last migration rolled back', 'green');
      }
    } catch (error) {
      this.log('❌ Rollback failed:', 'red');
      this.log(error.message, 'red');
      this.log('💡 Manual intervention may be required', 'yellow');
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async runPostMigrationTasks() {
    this.log('🔧 Running Post-Migration Tasks...', 'cyan');
    
    const tasks = [
      {
        name: 'Update database indexes',
        command: 'npm run db:optimize',
        optional: true
      },
      {
        name: 'Validate data integrity',
        command: 'npm run db:validate',
        optional: true
      },
      {
        name: 'Clear application cache',
        command: 'pm2 reload all',
        optional: true
      }
    ];

    for (const task of tasks) {
      try {
        this.log(`  🔄 ${task.name}...`, 'blue');
        
        if (this.options.dryRun) {
          this.log(`    🔍 DRY RUN: Would execute: ${task.command}`, 'yellow');
          continue;
        }
        
        await execAsync(task.command);
        this.log(`  ✅ ${task.name} completed`, 'green');
      } catch (error) {
        if (task.optional) {
          this.log(`  ⚠️  ${task.name} failed (optional): ${error.message}`, 'yellow');
        } else {
          this.log(`  ❌ ${task.name} failed: ${error.message}`, 'red');
          throw error;
        }
      }
    }
  }

  async run() {
    const startTime = Date.now();
    this.log(`${colors.bold}🚀 PRODUCTION MIGRATION RUNNER${colors.reset}`, 'cyan');
    this.log(`Started at: ${new Date().toISOString()}`, 'blue');
    
    if (this.options.dryRun) {
      this.log('🔍 DRY RUN MODE - No changes will be made', 'yellow');
    }
    
    try {
      // Pre-migration checks
      await this.checkEnvironment();
      await this.testDatabaseConnection();
      
      const migrationStatus = await this.checkMigrationStatus();
      
      if (!migrationStatus.hasPending && !this.options.forceOverride) {
        this.log('✅ All migrations are already up to date', 'green');
        return { success: true, message: 'No migrations needed' };
      }
      
      // Create backup before migrations
      await this.createDatabaseBackup();
      
      // Run migrations
      const migrationResult = await this.runMigrations();
      
      // Verify field mappings
      await this.verifyFieldMappings();
      
      // Post-migration tasks
      await this.runPostMigrationTasks();
      
      const totalTime = Date.now() - startTime;
      
      this.log(`${colors.bold}✅ MIGRATION COMPLETED SUCCESSFULLY${colors.reset}`, 'green');
      this.log(`Total time: ${totalTime}ms`, 'cyan');
      
      if (this.backupPath) {
        this.log(`💾 Backup saved: ${this.backupPath}`, 'blue');
      }
      
      return { 
        success: true, 
        migrationResult, 
        backupPath: this.backupPath,
        totalTime 
      };
      
    } catch (error) {
      this.log(`${colors.bold}❌ MIGRATION FAILED${colors.reset}`, 'red');
      this.log(error.message, 'red');
      
      if (!this.options.dryRun) {
        this.log('🔄 Attempting rollback...', 'yellow');
        await this.rollback();
      }
      
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force-override':
        options.forceOverride = true;
        break;
      case '--no-backup':
        options.backup = false;
        break;
      case '--no-verify-fields':
        options.verifyFields = false;
        break;
      case '--help':
        console.log(`
Production Migration Runner

Usage: node production-migration-runner.js [options]

Options:
  --dry-run          Simulate migration without executing
  --force-override   Force migration even if issues exist (USE WITH CAUTION)
  --no-backup        Skip database backup (NOT recommended)
  --no-verify-fields Skip field mapping verification
  --help             Show this help message

Examples:
  # Safe production migration with backup
  node production-migration-runner.js
  
  # Dry run to test
  node production-migration-runner.js --dry-run
  
  # Force migration (emergency use)
  node production-migration-runner.js --force-override
        `);
        process.exit(0);
        break;
    }
  }
  
  const runner = new ProductionMigrationRunner(options);
  
  runner.run()
    .then(result => {
      console.log('\n✅ Migration runner completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration runner failed:', error.message);
      process.exit(1);
    });
}

module.exports = ProductionMigrationRunner;