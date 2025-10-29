require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'skyraksys_hrm',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'admin123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function fixDuplicateTimesheets() {
  try {
    console.log('🔍 Checking for duplicate timesheets...');
    
    // Find duplicates
    const [duplicates] = await sequelize.query(`
      SELECT 
        "employeeId", 
        "weekStartDate", 
        year, 
        COUNT(*) as duplicate_count
      FROM timesheets 
      GROUP BY "employeeId", "weekStartDate", year 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate timesheets found.');
      process.exit(0);
    }
    
    console.log(`⚠️  Found ${duplicates.length} sets of duplicates:`);
    duplicates.forEach(dup => {
      console.log(`   - Employee: ${dup.employeeId}, Week: ${dup.weekStartDate}, Year: ${dup.year}, Count: ${dup.duplicate_count}`);
    });
    
    console.log('\n🗑️  Removing duplicates (keeping most recent)...');
    
    // Delete duplicates, keeping only the most recent one
    const [result] = await sequelize.query(`
      DELETE FROM timesheets
      WHERE id IN (
        SELECT id
        FROM (
          SELECT 
            id,
            ROW_NUMBER() OVER (
              PARTITION BY "employeeId", "weekStartDate", year 
              ORDER BY "updatedAt" DESC, "createdAt" DESC
            ) as rn
          FROM timesheets
        ) t
        WHERE t.rn > 1
      )
    `);
    
    console.log(`✅ Deleted ${result.rowCount || 'some'} duplicate timesheet(s).`);
    
    // Verify no duplicates remain
    const [remainingDuplicates] = await sequelize.query(`
      SELECT 
        "employeeId", 
        "weekStartDate", 
        year, 
        COUNT(*) as count
      FROM timesheets 
      GROUP BY "employeeId", "weekStartDate", year 
      HAVING COUNT(*) > 1
    `);
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ All duplicates removed successfully!');
      console.log('✅ Unique constraint can now be safely created.');
    } else {
      console.log('⚠️  Some duplicates still remain:');
      console.log(remainingDuplicates);
    }
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing duplicates:', error);
    await sequelize.close();
    process.exit(1);
  }
}

fixDuplicateTimesheets();
