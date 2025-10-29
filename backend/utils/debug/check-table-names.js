// Check what tables exist in the database
const { Sequelize, Op } = require('sequelize');

// Initialize database connection
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5433,
  database: 'skyraksys_hrm',
  username: 'hrm_admin',
  password: 'hrm_secure_2024',
  logging: false
});

async function checkTables() {
  try {
    console.log('🔍 Checking available tables in the database...\n');

    // Query to get all table names
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`📊 Found ${tables.length} tables:\n`);
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });

    // Look for timesheet-related tables specifically
    console.log('\n🕐 Looking for timesheet-related tables...');
    const timesheetTables = tables.filter(table => 
      table.table_name.toLowerCase().includes('timesheet')
    );

    if (timesheetTables.length > 0) {
      console.log('Found timesheet tables:');
      timesheetTables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });

      // Get columns for the timesheet table
      const mainTimesheetTable = timesheetTables[0].table_name;
      console.log(`\n📋 Columns in ${mainTimesheetTable}:`);
      
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = '${mainTimesheetTable}' 
        ORDER BY ordinal_position
      `);

      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ No timesheet-related tables found');
    }

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error checking tables:', error);
    await sequelize.close();
  }
}

checkTables();