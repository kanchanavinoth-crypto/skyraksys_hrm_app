const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('skyraksys_hrm', 'hrm_admin', 'hrm_secure_2024', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgres',
  logging: false
});

async function cleanupData() {
  try {
    console.log('🧹 Starting data cleanup...\n');
    
    // 1. Remove duplicate timesheet records (keep only the oldest one)
    console.log('1. Removing duplicate timesheet records...');
    
    const [duplicates] = await sequelize.query(`
      WITH duplicates AS (
        SELECT id, 
               ROW_NUMBER() OVER (
                 PARTITION BY "employeeId", "weekStartDate", "year" 
                 ORDER BY "createdAt" ASC
               ) as rn
        FROM timesheets
      )
      DELETE FROM timesheets 
      WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
      )
      RETURNING id
    `);
    
    console.log(`   ✅ Removed ${duplicates.length} duplicate timesheet records`);
    
    // 2. Check what positions exist and clean up invalid references
    console.log('\n2. Checking positions table...');
    
    const [positionCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM positions
    `);
    
    if (positionCount[0].count === 0) {
      console.log('   📝 No positions found - creating sample positions...');
      
      // Create some basic positions
      await sequelize.query(`
        INSERT INTO positions (id, title, department, "createdAt", "updatedAt") VALUES
        ('b8c1f5df-0723-4792-911a-9f88b78d2552', 'Software Developer', 'IT', NOW(), NOW()),
        ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'HR Manager', 'HR', NOW(), NOW()),
        ('f1e2d3c4-b5a6-9870-1234-567890fedcba', 'Project Manager', 'IT', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);
      
      console.log('   ✅ Created sample positions');
    } else {
      console.log(`   ✅ Found ${positionCount[0].count} positions`);
      
      // Check if the specific position exists
      const [specificPosition] = await sequelize.query(`
        SELECT COUNT(*) as count FROM positions 
        WHERE id = 'b8c1f5df-0723-4792-911a-9f88b78d2552'
      `);
      
      if (specificPosition[0].count === 0) {
        console.log('   📝 Missing specific position - creating it...');
        await sequelize.query(`
          INSERT INTO positions (id, title, department, "createdAt", "updatedAt") 
          VALUES ('b8c1f5df-0723-4792-911a-9f88b78d2552', 'Software Developer', 'IT', NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `);
        console.log('   ✅ Created missing position');
      }
    }
    
    // 3. Verify cleanup
    console.log('\n3. Verification...');
    
    const [remainingDuplicates] = await sequelize.query(`
      SELECT COUNT(*) as count FROM (
        SELECT "employeeId", "weekStartDate", "year", COUNT(*) as cnt
        FROM timesheets 
        GROUP BY "employeeId", "weekStartDate", "year"
        HAVING COUNT(*) > 1
      ) duplicates
    `);
    
    console.log(`   📊 Remaining duplicate groups: ${remainingDuplicates[0].count}`);
    
    const [positionExists] = await sequelize.query(`
      SELECT COUNT(*) as count FROM positions 
      WHERE id = 'b8c1f5df-0723-4792-911a-9f88b78d2552'
    `);
    
    console.log(`   📊 Required position exists: ${positionExists[0].count > 0 ? 'YES' : 'NO'}`);
    
    await sequelize.close();
    
    console.log('\n🎉 Data cleanup completed!');
    console.log('💡 You can now restart the server - the database initialization should work.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  }
}

cleanupData();