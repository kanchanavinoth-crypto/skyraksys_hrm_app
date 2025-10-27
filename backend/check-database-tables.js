const { Pool } = require('pg');
const pool = new Pool({
  user: 'hrm_admin',
  host: 'localhost',
  database: 'skyraksys_hrm',
  password: 'hrm_secure_2024',
  port: 5433,
});

async function checkDatabaseTables() {
  try {
    console.log('🔍 Checking available tables in database...\n');
    
    // List all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found in the database');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} tables in database:`);
      tablesResult.rows.forEach(row => {
        console.log(`   📋 ${row.table_name}`);
      });
    }
    
    // Check if there are any timesheet-related tables
    console.log('\n🔍 Looking for timesheet-related tables...\n');
    const timesheetTables = tablesResult.rows.filter(row => 
      row.table_name.toLowerCase().includes('timesheet')
    );
    
    if (timesheetTables.length > 0) {
      console.log('📅 Found timesheet-related tables:');
      timesheetTables.forEach(row => {
        console.log(`   ⏰ ${row.table_name}`);
      });
      
      // Check the structure of the first timesheet table
      const firstTable = timesheetTables[0].table_name;
      console.log(`\n🔍 Checking structure of table "${firstTable}":\n`);
      
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [firstTable]);
      
      columnsResult.rows.forEach(row => {
        console.log(`   📝 ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
      });
      
      // Check if there's any data in this table
      console.log(`\n🔍 Checking data in table "${firstTable}":\n`);
      const dataResult = await pool.query(`SELECT COUNT(*) as count FROM "${firstTable}"`);
      console.log(`   📊 Records found: ${dataResult.rows[0].count}`);
      
      if (dataResult.rows[0].count > 0) {
        // Show sample records
        const sampleResult = await pool.query(`SELECT * FROM "${firstTable}" LIMIT 5`);
        console.log(`\n📋 Sample records from "${firstTable}":`);
        sampleResult.rows.forEach((row, index) => {
          console.log(`   Record ${index + 1}:`, JSON.stringify(row, null, 2));
        });
      }
    } else {
      console.log('❌ No timesheet-related tables found');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseTables();