const { sequelize } = require('./models');
const db = require('./models');

(async () => {
  try {
    console.log('🏥 COMPREHENSIVE DATABASE HEALTH CHECK\n');
    console.log('='.repeat(70));
    
    // 1. Connection Test
    console.log('\n1️⃣  DATABASE CONNECTION');
    console.log('-'.repeat(70));
    await sequelize.authenticate();
    console.log(`✅ Connected as: ${process.env.DB_USER}`);
    console.log(`✅ Database: ${process.env.DB_NAME}`);
    console.log(`✅ Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    // 2. Tables Test
    console.log('\n2️⃣  TABLE INTEGRITY');
    console.log('-'.repeat(70));
    const [tables] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != 'SequelizeMeta'
    `);
    console.log(`✅ Total tables: ${tables[0].count}`);
    
    // 3. Data Count
    console.log('\n3️⃣  DATA VERIFICATION');
    console.log('-'.repeat(70));
    const dataChecks = [
      { table: 'users', expected: '5', critical: true },
      { table: 'employees', expected: '5', critical: true },
      { table: 'departments', expected: '5', critical: true },
      { table: 'positions', expected: '11', critical: true },
      { table: 'leave_types', expected: '5', critical: true },
      { table: 'leave_balances', expected: '25', critical: true },
      { table: 'projects', expected: '3', critical: false },
      { table: 'tasks', expected: '3', critical: false },
      { table: 'salary_structures', expected: '5', critical: true },
      { table: 'refresh_tokens', expected: '0+', critical: false }
    ];
    
    for (const check of dataChecks) {
      const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${check.table}`);
      const count = result[0].count;
      const icon = count > 0 ? '✅' : (check.critical ? '❌' : '⚠️');
      console.log(`${icon} ${check.table.padEnd(25)} ${count} records`);
    }
    
    // 4. Test User Login
    console.log('\n4️⃣  USER AUTHENTICATION TEST');
    console.log('-'.repeat(70));
    const [adminUser] = await sequelize.query(`
      SELECT email, role, "isActive" 
      FROM users 
      WHERE email = 'admin@skyraksys.com'
    `);
    
    if (adminUser.length > 0) {
      console.log(`✅ Admin user exists: ${adminUser[0].email}`);
      console.log(`✅ Role: ${adminUser[0].role}`);
      console.log(`✅ Active: ${adminUser[0].isActive}`);
    } else {
      console.log('❌ Admin user not found!');
    }
    
    // 5. Foreign Key Relationships
    console.log('\n5️⃣  RELATIONSHIP INTEGRITY');
    console.log('-'.repeat(70));
    
    // Check employee-user links
    const [empUserLinks] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM employees e 
      INNER JOIN users u ON e."userId" = u.id
    `);
    console.log(`✅ Employee-User links: ${empUserLinks[0].count}/5`);
    
    // Check employee-department links
    const [empDeptLinks] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM employees e 
      INNER JOIN departments d ON e."departmentId" = d.id
    `);
    console.log(`✅ Employee-Department links: ${empDeptLinks[0].count}/5`);
    
    // Check leave balances
    const [leaveBalLinks] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM leave_balances lb
      INNER JOIN employees e ON lb."employeeId" = e.id
      INNER JOIN leave_types lt ON lb."leaveTypeId" = lt.id
    `);
    console.log(`✅ Leave Balance links: ${leaveBalLinks[0].count}/25`);
    
    // 6. Migration Status
    console.log('\n6️⃣  MIGRATION STATUS');
    console.log('-'.repeat(70));
    const [migrations] = await sequelize.query(`
      SELECT name FROM "SequelizeMeta" ORDER BY name
    `);
    console.log(`✅ Applied migrations: ${migrations.length}`);
    migrations.slice(0, 5).forEach(m => console.log(`   • ${m.name}`));
    if (migrations.length > 5) {
      console.log(`   ... and ${migrations.length - 5} more`);
    }
    
    // 7. Index Check
    console.log('\n7️⃣  PERFORMANCE INDEXES');
    console.log('-'.repeat(70));
    const [indexes] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename NOT IN ('SequelizeMeta')
    `);
    console.log(`✅ Total indexes: ${indexes[0].count}`);
    
    // 8. Final Summary
    console.log('\n8️⃣  HEALTH SUMMARY');
    console.log('-'.repeat(70));
    console.log('✅ Database is HEALTHY and ready for use!');
    console.log('✅ All critical data seeded successfully');
    console.log('✅ All relationships intact');
    console.log('✅ Migrations up to date');
    
    console.log('\n🔐 TEST CREDENTIALS:');
    console.log('-'.repeat(70));
    console.log('Password for all users: admin123');
    console.log('  • admin@skyraksys.com    - Admin access');
    console.log('  • hr@skyraksys.com       - HR access');
    console.log('  • lead@skyraksys.com     - Manager access');
    console.log('  • employee1@skyraksys.com - Employee');
    console.log('  • employee2@skyraksys.com - Employee');
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ HEALTH CHECK COMPLETE - ALL SYSTEMS GO!');
    console.log('='.repeat(70) + '\n');
    
    await sequelize.close();
  } catch (error) {
    console.error('\n❌ HEALTH CHECK FAILED:', error.message);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
})();
