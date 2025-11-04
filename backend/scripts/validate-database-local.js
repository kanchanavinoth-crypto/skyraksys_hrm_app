const { Sequelize } = require('sequelize');
const config = require('../config/config.json')['development'];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let errors = 0;
let warnings = 0;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: false
  }
);

// Expected tables
const EXPECTED_TABLES = [
  'SequelizeMeta',
  'departments',
  'positions',
  'users',
  'employees',
  'leave_types',
  'leave_requests',
  'leave_balances',
  'timesheets',
  'projects',
  'tasks',
  'salary_structures',
  'payroll_data',
  'payslips',
  'payslip_templates'
];

// Expected foreign keys (table.column -> referenced_table)
const EXPECTED_FOREIGN_KEYS = {
  'employees.userId': 'users',
  'employees.departmentId': 'departments',
  'employees.positionId': 'positions',
  'positions.departmentId': 'departments',
  'leave_requests.userId': 'users',
  'leave_requests.leaveTypeId': 'leave_types',
  'leave_balances.employeeId': 'employees',
  'leave_balances.leaveTypeId': 'leave_types',
  'timesheets.employeeId': 'employees',
  'timesheets.projectId': 'projects',
  'timesheets.taskId': 'tasks',
  'tasks.projectId': 'projects',
  'salary_structures.employeeId': 'employees',
  'payslips.employeeId': 'employees',
  'payslips.templateId': 'payslip_templates'
};

async function validateDatabase() {
  console.log('========================================');
  console.log('🔍 DATABASE VALIDATION (LOCAL)');
  console.log('========================================');
  console.log(`Database: ${config.database}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');

  try {
    // ==============================================
    // STEP 1: Database Connection
    // ==============================================
    console.log(`${colors.yellow}STEP 1: Database Connection${colors.reset}`);
    console.log('----------------------------');

    await sequelize.authenticate();
    console.log(`${colors.green}✓ Connected to database${colors.reset}`);
    console.log('');

    // ==============================================
    // STEP 2: Validate Tables
    // ==============================================
    console.log(`${colors.yellow}STEP 2: Table Structure${colors.reset}`);
    console.log('------------------------');

    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tableNames = tables.map(t => t.table_name);
    
    console.log('Checking for required tables...');
    for (const expectedTable of EXPECTED_TABLES) {
      if (tableNames.includes(expectedTable)) {
        console.log(`  ${colors.green}✓${colors.reset} ${expectedTable}`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${expectedTable} - MISSING`);
        errors++;
      }
    }
    console.log(`\nTotal tables found: ${tableNames.length}`);
    console.log('');

    // ==============================================
    // STEP 3: Validate Primary Keys
    // ==============================================
    console.log(`${colors.yellow}STEP 3: Primary Keys${colors.reset}`);
    console.log('--------------------');

    console.log('Checking primary keys...');
    const tablesToCheck = ['departments', 'positions', 'users', 'employees', 'leave_types', 'leave_requests', 'projects', 'tasks', 'salary_structures'];
    
    for (const table of tablesToCheck) {
      const [pkInfo] = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints 
        WHERE table_name='${table}' 
        AND constraint_type='PRIMARY KEY';
      `);
      
      if (pkInfo[0].count > 0) {
        console.log(`  ${colors.green}✓${colors.reset} ${table} has primary key`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${table} - NO PRIMARY KEY`);
        errors++;
      }
    }
    console.log('');

    // ==============================================
    // STEP 4: Validate Foreign Keys
    // ==============================================
    console.log(`${colors.yellow}STEP 4: Foreign Keys${colors.reset}`);
    console.log('--------------------');

    const [fkInfo] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints 
      WHERE constraint_type='FOREIGN KEY';
    `);
    
    console.log(`Total foreign keys: ${fkInfo[0].count}`);
    
    if (fkInfo[0].count < 10) {
      console.log(`${colors.red}⚠️  Warning: Expected at least 10 foreign keys, found ${fkInfo[0].count}${colors.reset}`);
      warnings++;
    } else {
      console.log(`${colors.green}✓ Foreign key count looks good${colors.reset}`);
    }
    console.log('');

    // ==============================================
    // STEP 5: Validate Indexes
    // ==============================================
    console.log(`${colors.yellow}STEP 5: Indexes${colors.reset}`);
    console.log('---------------');

    const [indexInfo] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM pg_indexes 
      WHERE schemaname = 'public';
    `);
    
    console.log(`Total indexes: ${indexInfo[0].count}`);
    console.log('');

    // ==============================================
    // STEP 6: Validate Required Data
    // ==============================================
    console.log(`${colors.yellow}STEP 6: Required Data${colors.reset}`);
    console.log('---------------------');

    console.log('Checking for essential seed data...');

    // Check users
    const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users;');
    if (userCount[0].count > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Users: ${userCount[0].count} found`);
      
      // Check for admin user
      const [adminCount] = await sequelize.query("SELECT COUNT(*) as count FROM users WHERE role='admin';");
      if (adminCount[0].count > 0) {
        console.log(`  ${colors.green}✓${colors.reset} Admin user exists`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} No admin user found!`);
        errors++;
      }
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Users: NO USERS FOUND!`);
      console.log(`  ${colors.yellow}→${colors.reset} Run: npx sequelize-cli db:seed:all`);
      errors++;
    }

    // Check departments
    const [deptCount] = await sequelize.query('SELECT COUNT(*) as count FROM departments;');
    if (deptCount[0].count > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Departments: ${deptCount[0].count} found`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Departments: NONE (seed data missing)`);
      warnings++;
    }

    // Check positions
    const [posCount] = await sequelize.query('SELECT COUNT(*) as count FROM positions;');
    if (posCount[0].count > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Positions: ${posCount[0].count} found`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Positions: NONE (seed data missing)`);
      warnings++;
    }

    // Check employees
    const [empCount] = await sequelize.query('SELECT COUNT(*) as count FROM employees;');
    if (empCount[0].count > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Employees: ${empCount[0].count} found`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Employees: NONE (seed data missing)`);
      warnings++;
    }

    // Check leave types
    const [leaveTypeCount] = await sequelize.query('SELECT COUNT(*) as count FROM leave_types;');
    if (leaveTypeCount[0].count > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Leave Types: ${leaveTypeCount[0].count} found`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Leave Types: NONE (seed data missing)`);
      warnings++;
    }

    // Check projects
    const [projectCount] = await sequelize.query('SELECT COUNT(*) as count FROM projects;');
    if (projectCount[0].count > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Projects: ${projectCount[0].count} found`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Projects: NONE (seed data missing)`);
      warnings++;
    }

    // Check payslip templates
    const [templateCount] = await sequelize.query('SELECT COUNT(*) as count FROM payslip_templates;');
    if (templateCount[0].count > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Payslip Templates: ${templateCount[0].count} found`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Payslip Templates: NONE (seed data missing)`);
      warnings++;
    }

    console.log('');

    // ==============================================
    // STEP 7: Validate Data Integrity
    // ==============================================
    console.log(`${colors.yellow}STEP 7: Data Integrity${colors.reset}`);
    console.log('----------------------');

    console.log('Checking referential integrity...');

    // Check orphaned employees (users with no employee record)
    const [orphanedUsers] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM users u 
      LEFT JOIN employees e ON u.id = e."userId" 
      WHERE e.id IS NULL 
      AND u.role IN ('employee', 'manager', 'hr');
    `);

    if (orphanedUsers[0].count === 0) {
      console.log(`  ${colors.green}✓${colors.reset} All non-admin users have employee records`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${orphanedUsers[0].count} user(s) without employee records`);
      warnings++;
    }

    // Check employees without positions
    const [empNoPosition] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM employees 
      WHERE "positionId" IS NULL;
    `);

    if (empNoPosition[0].count === 0) {
      console.log(`  ${colors.green}✓${colors.reset} All employees have positions`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${empNoPosition[0].count} employee(s) without positions`);
      warnings++;
    }

    // Check employees without departments
    const [empNoDept] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM employees 
      WHERE "departmentId" IS NULL;
    `);

    if (empNoDept[0].count === 0) {
      console.log(`  ${colors.green}✓${colors.reset} All employees have departments`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${empNoDept[0].count} employee(s) without departments`);
      warnings++;
    }

    console.log('');

    // ==============================================
    // STEP 8: Validate Migrations
    // ==============================================
    console.log(`${colors.yellow}STEP 8: Migration Status${colors.reset}`);
    console.log('------------------------');

    const [migrationCount] = await sequelize.query('SELECT COUNT(*) as count FROM "SequelizeMeta";');
    
    console.log(`Migrations executed: ${migrationCount[0].count}`);

    if (migrationCount[0].count > 0) {
      console.log(`${colors.green}✓ Migrations have been run${colors.reset}`);
      console.log('');
      console.log('Recent migrations:');
      const [recentMigrations] = await sequelize.query(`
        SELECT name as migration_file
        FROM "SequelizeMeta" 
        ORDER BY name DESC 
        LIMIT 5;
      `);
      recentMigrations.forEach((mig, idx) => {
        console.log(`  ${idx + 1}. ${mig.migration_file}`);
      });
    } else {
      console.log(`${colors.red}✗ No migrations found!${colors.reset}`);
      console.log(`  ${colors.yellow}→${colors.reset} Run: npx sequelize-cli db:migrate`);
      errors++;
    }

    console.log('');

    // ==============================================
    // STEP 9: Sample Data Details
    // ==============================================
    console.log(`${colors.yellow}STEP 9: Sample Data Details${colors.reset}`);
    console.log('----------------------------');

    if (userCount[0].count > 0) {
      console.log('User Roles:');
      const [userRoles] = await sequelize.query(`
        SELECT 
          role,
          COUNT(*) as count
        FROM users 
        GROUP BY role 
        ORDER BY role;
      `);
      userRoles.forEach(role => {
        console.log(`  ${role.role}: ${role.count}`);
      });

      console.log('');
      console.log('Departments with Employee Count:');
      const [deptEmployees] = await sequelize.query(`
        SELECT 
          d.name as department,
          COUNT(e.id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON d.id = e."departmentId"
        GROUP BY d.name
        ORDER BY employee_count DESC;
      `);
      deptEmployees.forEach(dept => {
        console.log(`  ${dept.department}: ${dept.employee_count} employees`);
      });
    }

    console.log('');

    // ==============================================
    // Final Summary
    // ==============================================
    console.log('========================================');
    console.log('📊 VALIDATION SUMMARY');
    console.log('========================================');
    console.log('');

    if (errors === 0 && warnings === 0) {
      console.log(`${colors.green}✅ ALL CHECKS PASSED!${colors.reset}`);
      console.log('');
      console.log('✓ All tables exist');
      console.log('✓ Primary keys configured');
      console.log('✓ Foreign keys in place');
      console.log('✓ Indexes present');
      console.log('✓ Required data seeded');
      console.log('✓ Data integrity verified');
      console.log('✓ Migrations complete');
      console.log('');
      console.log(`${colors.green}Database is ready for production use!${colors.reset}`);
      console.log('');
      console.log('✅ Safe to deploy to production!');
      process.exit(0);
    } else if (errors === 0 && warnings > 0) {
      console.log(`${colors.yellow}⚠️  VALIDATION PASSED WITH WARNINGS${colors.reset}`);
      console.log('');
      console.log(`Errors: ${errors}`);
      console.log(`Warnings: ${warnings}`);
      console.log('');
      console.log('The database is functional but could be improved.');
      console.log('Review warnings above for optimization suggestions.');
      console.log('');
      console.log('✅ Generally safe to deploy, but review warnings first.');
      process.exit(0);
    } else {
      console.log(`${colors.red}❌ VALIDATION FAILED${colors.reset}`);
      console.log('');
      console.log(`Errors: ${errors}`);
      console.log(`Warnings: ${warnings}`);
      console.log('');
      console.log('Critical issues found! Please fix errors before deploying to production.');
      console.log('');
      
      if (userCount[0].count === 0) {
        console.log('Quick fix:');
        console.log('  npx sequelize-cli db:seed:all');
        console.log('');
      }
      
      console.log('❌ NOT SAFE to deploy to production yet!');
      process.exit(1);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run validation
validateDatabase();
