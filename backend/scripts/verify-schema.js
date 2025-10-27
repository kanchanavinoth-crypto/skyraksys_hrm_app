const { sequelize } = require('../models');

async function verifySchema() {
  try {
    console.log('🔍 Verifying database schema...\n');

    // Check all expected tables
    const expectedTables = [
      'users',
      'employees',
      'departments',
      'positions',
      'leave_types',
      'leave_requests', // ✅ This is the table we're checking for
      'leave_balances',
      'timesheets',
      'projects',
      'tasks',
      'payrolls',
      'SequelizeMeta' // Migration tracking table
    ];

    const [existingTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const existingTableNames = existingTables.map(t => t.table_name);

    console.log('📋 Table Status:\n');
    expectedTables.forEach(table => {
      const exists = existingTableNames.includes(table);
      const icon = exists ? '✅' : '❌';
      const status = exists ? 'EXISTS' : 'MISSING';
      console.log(`${icon} ${table.padEnd(25)} ${status}`);
    });

    const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));

    console.log('');
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:', missingTables.join(', '));
      console.log('\n💡 Solution: Run database sync');
      console.log('   node scripts/setup-database.js\n');
      process.exit(1);
    } else {
      console.log('✅ All expected tables exist!');
      
      // Check leave_requests columns
      const [columns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_name = 'leave_requests'
        ORDER BY ordinal_position;
      `);

      const columnNames = columns.map(c => c.column_name);
      const requiredColumns = [
        'id', 'employeeId', 'leaveTypeId', 'startDate', 'endDate',
        'totalDays', 'reason', 'status', 'isCancellation',
        'originalLeaveRequestId', 'cancellationNote', 'cancelledAt'
      ];

      console.log('\n📊 leave_requests columns:');
      console.log(`   Found ${columnNames.length} columns`);
      
      const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
      if (missingColumns.length > 0) {
        console.log('\n⚠️ Missing columns:', missingColumns.join(', '));
        console.log('\n💡 Solution: Run migration');
        console.log('   npx sequelize-cli db:migrate\n');
      } else {
        console.log('   ✅ All required columns present\n');
      }
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifySchema();
