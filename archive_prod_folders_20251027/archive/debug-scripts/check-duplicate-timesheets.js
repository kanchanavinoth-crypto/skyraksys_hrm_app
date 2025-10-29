const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('skyraksys_hrm', 'skyraksys_user', 'skyraksys_password', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgres',
  logging: false
});

async function checkDuplicates() {
  try {
    console.log('🔍 Checking for duplicate timesheet records...\n');
    
    // Check for duplicates
    const [results] = await sequelize.query(`
      SELECT "employeeId", "weekStartDate", "year", COUNT(*) as count
      FROM timesheets 
      GROUP BY "employeeId", "weekStartDate", "year"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    console.log('=== DUPLICATE TIMESHEET RECORDS ===');
    console.log('Total duplicate groups:', results.length);
    
    if (results.length > 0) {
      console.log('\n📋 Duplicates found:');
      results.forEach((row, i) => {
        console.log(`${i+1}. Employee: ${row.employeeId}, Week: ${row.weekStartDate}, Year: ${row.year}, Count: ${row.count}`);
      });
      
      // Get details of the first duplicate
      console.log('\n🔎 Details of first duplicate group:');
      const [details] = await sequelize.query(`
        SELECT id, "employeeId", "weekStartDate", "year", "createdAt"
        FROM timesheets 
        WHERE "employeeId" = '${results[0].employeeId}' 
        AND "weekStartDate" = '${results[0].weekStartDate}'
        AND "year" = ${results[0].year}
        ORDER BY "createdAt"
      `);
      
      details.forEach((record, i) => {
        console.log(`  ${i+1}. ID: ${record.id}, Created: ${record.createdAt}`);
      });
    } else {
      console.log('✅ No duplicate records found');
    }
    
    // Also check for missing positions
    console.log('\n=== CHECKING MISSING POSITIONS ===');
    const [positions] = await sequelize.query(`
      SELECT id, name FROM positions 
      WHERE id = 'b8c1f5df-0723-4792-911a-9f88b78d2552'
    `);
    
    if (positions.length === 0) {
      console.log('❌ Position b8c1f5df-0723-4792-911a-9f88b78d2552 NOT FOUND');
      
      // Show available positions
      const [allPositions] = await sequelize.query(`
        SELECT id, name FROM positions 
        ORDER BY name
        LIMIT 10
      `);
      
      console.log('\n📋 Available positions:');
      allPositions.forEach((pos, i) => {
        console.log(`${i+1}. ${pos.name} (${pos.id})`);
      });
    } else {
      console.log('✅ Position found:', positions[0].name);
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDuplicates();