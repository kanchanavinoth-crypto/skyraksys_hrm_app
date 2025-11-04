const { Sequelize } = require('sequelize');
const config = require('../config/config.json')['development'];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

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

let testsPassed = 0;
let testsFailed = 0;

async function testDatabaseOperations() {
  console.log('========================================');
  console.log('🧪 DATABASE OPERATIONS TEST');
  console.log('========================================');
  console.log(`Database: ${config.database}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');

  try {
    await sequelize.authenticate();
    console.log(`${colors.green}✓ Connected to database${colors.reset}\n`);

    // ==============================================
    // TEST 1: SELECT Queries
    // ==============================================
    console.log(`${colors.cyan}TEST 1: SELECT Operations${colors.reset}`);
    console.log('------------------------');

    // Test 1.1: Select users
    try {
      const [users] = await sequelize.query('SELECT id, email, role, "firstName", "lastName" FROM users LIMIT 5;');
      console.log(`${colors.green}✓${colors.reset} SELECT users: ${users.length} records retrieved`);
      if (users.length > 0) {
        console.log(`  Sample: ${users[0].firstName} ${users[0].lastName} (${users[0].email})`);
      }
      testsPassed++;
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} SELECT users failed: ${error.message}`);
      testsFailed++;
    }

    // Test 1.2: Select with JOIN
    try {
      const [empWithDept] = await sequelize.query(`
        SELECT 
          e."firstName", 
          e."lastName", 
          d.name as department,
          p.title as position
        FROM employees e
        LEFT JOIN departments d ON e."departmentId" = d.id
        LEFT JOIN positions p ON e."positionId" = p.id
        LIMIT 5;
      `);
      console.log(`${colors.green}✓${colors.reset} SELECT with JOIN: ${empWithDept.length} records`);
      if (empWithDept.length > 0) {
        console.log(`  Sample: ${empWithDept[0].firstName} - ${empWithDept[0].department} - ${empWithDept[0].position}`);
      }
      testsPassed++;
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} SELECT with JOIN failed: ${error.message}`);
      testsFailed++;
    }

    // Test 1.3: Aggregate query
    try {
      const [deptCount] = await sequelize.query(`
        SELECT 
          d.name,
          COUNT(e.id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON d.id = e."departmentId"
        GROUP BY d.name
        ORDER BY employee_count DESC;
      `);
      console.log(`${colors.green}✓${colors.reset} Aggregate query: ${deptCount.length} departments`);
      testsPassed++;
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} Aggregate query failed: ${error.message}`);
      testsFailed++;
    }

    console.log('');

    // ==============================================
    // TEST 2: INSERT Operations
    // ==============================================
    console.log(`${colors.cyan}TEST 2: INSERT Operations${colors.reset}`);
    console.log('------------------------');

    let testDeptId;
    let testPositionId;
    let testUserId;
    let testEmployeeId;

    // Test 2.1: Insert department
    try {
      const deptId = require('crypto').randomUUID();
      await sequelize.query(`
        INSERT INTO departments (id, name, description, "isActive", "createdAt", "updatedAt")
        VALUES (
          '${deptId}',
          'Test Department ${Date.now()}',
          'Temporary test department',
          true,
          NOW(),
          NOW()
        );
      `);
      testDeptId = deptId;
      console.log(`${colors.green}✓${colors.reset} INSERT department: Success`);
      testsPassed++;
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} INSERT department failed: ${error.message}`);
      testsFailed++;
    }

    // Test 2.2: Insert position
    if (testDeptId) {
      try {
        const positionId = require('crypto').randomUUID();
        await sequelize.query(`
          INSERT INTO positions (id, title, description, level, "departmentId", "isActive", "createdAt", "updatedAt")
          VALUES (
            '${positionId}',
            'Test Position',
            'Temporary test position',
            'Mid',
            '${testDeptId}',
            true,
            NOW(),
            NOW()
          );
        `);
        testPositionId = positionId;
        console.log(`${colors.green}✓${colors.reset} INSERT position: Success`);
        testsPassed++;
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} INSERT position failed: ${error.message}`);
        testsFailed++;
      }
    }

    // Test 2.3: Insert user
    try {
      const userId = require('crypto').randomUUID();
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      
      await sequelize.query(`
        INSERT INTO users (id, "firstName", "lastName", email, password, role, "isActive", "createdAt", "updatedAt")
        VALUES (
          '${userId}',
          'Test',
          'User',
          'test${Date.now()}@test.com',
          '${hashedPassword}',
          'employee',
          true,
          NOW(),
          NOW()
        );
      `);
      testUserId = userId;
      console.log(`${colors.green}✓${colors.reset} INSERT user: Success`);
      testsPassed++;
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} INSERT user failed: ${error.message}`);
      testsFailed++;
    }

    // Test 2.4: Insert employee with foreign keys
    if (testUserId && testDeptId && testPositionId) {
      try {
        const employeeId = require('crypto').randomUUID();
        await sequelize.query(`
          INSERT INTO employees (
            id, "employeeId", "firstName", "lastName", email, phone, 
            "hireDate", status, "departmentId", "positionId", "userId", 
            "createdAt", "updatedAt"
          )
          VALUES (
            '${employeeId}',
            'TEMP${Date.now()}',
            'Test',
            'Employee',
            'test${Date.now()}@test.com',
            '9999999999',
            NOW(),
            'Active',
            '${testDeptId}',
            '${testPositionId}',
            '${testUserId}',
            NOW(),
            NOW()
          );
        `);
        testEmployeeId = employeeId;
        console.log(`${colors.green}✓${colors.reset} INSERT employee with FK: Success`);
        testsPassed++;
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} INSERT employee with FK failed: ${error.message}`);
        testsFailed++;
      }
    }

    console.log('');

    // ==============================================
    // TEST 3: UPDATE Operations
    // ==============================================
    console.log(`${colors.cyan}TEST 3: UPDATE Operations${colors.reset}`);
    console.log('------------------------');

    // Test 3.1: Update department
    if (testDeptId) {
      try {
        await sequelize.query(`
          UPDATE departments 
          SET description = 'Updated test department', "updatedAt" = NOW()
          WHERE id = '${testDeptId}';
        `);
        console.log(`${colors.green}✓${colors.reset} UPDATE department: Success`);
        testsPassed++;
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} UPDATE department failed: ${error.message}`);
        testsFailed++;
      }
    }

    // Test 3.2: Update employee status
    if (testEmployeeId) {
      try {
        await sequelize.query(`
          UPDATE employees 
          SET status = 'Inactive', "updatedAt" = NOW()
          WHERE id = '${testEmployeeId}';
        `);
        console.log(`${colors.green}✓${colors.reset} UPDATE employee: Success`);
        testsPassed++;
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} UPDATE employee failed: ${error.message}`);
        testsFailed++;
      }
    }

    console.log('');

    // ==============================================
    // TEST 4: Foreign Key Constraints
    // ==============================================
    console.log(`${colors.cyan}TEST 4: Foreign Key Constraints${colors.reset}`);
    console.log('------------------------');

    // Test 4.1: Try to insert employee with invalid department (should fail)
    try {
      const invalidDeptId = require('crypto').randomUUID();
      await sequelize.query(`
        INSERT INTO employees (
          id, "employeeId", "firstName", "lastName", email, 
          "hireDate", status, "departmentId", "positionId", "userId", 
          "createdAt", "updatedAt"
        )
        VALUES (
          '${require('crypto').randomUUID()}',
          'FAIL${Date.now()}',
          'Fail',
          'Test',
          'fail@test.com',
          NOW(),
          'Active',
          '${invalidDeptId}',
          '${testPositionId || require('crypto').randomUUID()}',
          '${testUserId || require('crypto').randomUUID()}',
          NOW(),
          NOW()
        );
      `);
      console.log(`${colors.red}✗${colors.reset} FK constraint should have blocked invalid insert!`);
      testsFailed++;
    } catch (error) {
      if (error.message.includes('foreign key constraint') || error.message.includes('violates')) {
        console.log(`${colors.green}✓${colors.reset} FK constraint working: Blocked invalid department`);
        testsPassed++;
      } else {
        console.log(`${colors.red}✗${colors.reset} Unexpected error: ${error.message}`);
        testsFailed++;
      }
    }

    console.log('');

    // ==============================================
    // TEST 5: DELETE Operations
    // ==============================================
    console.log(`${colors.cyan}TEST 5: DELETE Operations (Cleanup)${colors.reset}`);
    console.log('------------------------');

    // Clean up in reverse order (respect FK constraints)
    
    // Delete employee first
    if (testEmployeeId) {
      try {
        await sequelize.query(`DELETE FROM employees WHERE id = '${testEmployeeId}';`);
        console.log(`${colors.green}✓${colors.reset} DELETE employee: Success`);
        testsPassed++;
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} DELETE employee failed: ${error.message}`);
        testsFailed++;
      }
    }

    // Delete user
    if (testUserId) {
      try {
        await sequelize.query(`DELETE FROM users WHERE id = '${testUserId}';`);
        console.log(`${colors.green}✓${colors.reset} DELETE user: Success`);
        testsPassed++;
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} DELETE user failed: ${error.message}`);
        testsFailed++;
      }
    }

    // Delete position
    if (testPositionId) {
      try {
        await sequelize.query(`DELETE FROM positions WHERE id = '${testPositionId}';`);
        console.log(`${colors.green}✓${colors.reset} DELETE position: Success`);
        testsPassed++;
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} DELETE position failed: ${error.message}`);
        testsFailed++;
      }
    }

    // Delete department last
    if (testDeptId) {
      try {
        await sequelize.query(`DELETE FROM departments WHERE id = '${testDeptId}';`);
        console.log(`${colors.green}✓${colors.reset} DELETE department: Success`);
        testsPassed++;
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} DELETE department failed: ${error.message}`);
        testsFailed++;
      }
    }

    console.log('');

    // ==============================================
    // TEST 6: Transaction Support
    // ==============================================
    console.log(`${colors.cyan}TEST 6: Transaction Support${colors.reset}`);
    console.log('------------------------');

    try {
      await sequelize.query('BEGIN;');
      const tempId = require('crypto').randomUUID();
      await sequelize.query(`
        INSERT INTO departments (id, name, description, "isActive", "createdAt", "updatedAt")
        VALUES ('${tempId}', 'Temp Dept', 'Will be rolled back', true, NOW(), NOW());
      `);
      await sequelize.query('ROLLBACK;');
      
      // Verify rollback worked
      const [check] = await sequelize.query(`SELECT * FROM departments WHERE id = '${tempId}';`);
      if (check.length === 0) {
        console.log(`${colors.green}✓${colors.reset} Transaction ROLLBACK: Working correctly`);
        testsPassed++;
      } else {
        console.log(`${colors.red}✗${colors.reset} Transaction ROLLBACK: Failed`);
        testsFailed++;
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} Transaction test failed: ${error.message}`);
      testsFailed++;
    }

    console.log('');

    // ==============================================
    // Final Summary
    // ==============================================
    console.log('========================================');
    console.log('📊 TEST SUMMARY');
    console.log('========================================');
    console.log('');
    
    const totalTests = testsPassed + testsFailed;
    const successRate = ((testsPassed / totalTests) * 100).toFixed(1);

    console.log(`Total Tests: ${totalTests}`);
    console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('');

    if (testsFailed === 0) {
      console.log(`${colors.green}✅ ALL DATABASE OPERATIONS WORKING!${colors.reset}`);
      console.log('');
      console.log('✓ SELECT queries work');
      console.log('✓ JOIN operations work');
      console.log('✓ INSERT operations work');
      console.log('✓ UPDATE operations work');
      console.log('✓ DELETE operations work');
      console.log('✓ Foreign key constraints enforced');
      console.log('✓ Transactions supported');
      console.log('');
      console.log(`${colors.green}Database is fully operational and ready for production!${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.red}❌ SOME TESTS FAILED${colors.reset}`);
      console.log('');
      console.log('Please review the errors above and fix the issues.');
      console.log('Database may not be ready for production.');
      process.exit(1);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Fatal Error:${colors.reset}`, error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run tests
testDatabaseOperations();
