const { Pool } = require('pg');

const pool = new Pool({
  user: 'hrm_admin',
  host: 'localhost',
  database: 'skyraksys_hrm',
  password: 'hrm_secure_2024',
  port: 5433,
});

async function removeBlockingConstraints() {
  try {
    console.log('🔧 Removing blocking unique constraints...\n');
    
    // Drop the constraints that prevent multiple timesheets per week
    const constraintsToRemove = [
      'unique_employee_week',
      'unique_employee_week_timesheet'
    ];
    
    for (const constraintName of constraintsToRemove) {
      try {
        console.log(`🗑️ Attempting to drop constraint: ${constraintName}`);
        
        // Drop the constraint
        const dropConstraintQuery = `ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS ${constraintName};`;
        await pool.query(dropConstraintQuery);
        console.log(`✅ Successfully dropped constraint: ${constraintName}`);
        
        // Also drop the associated index if it exists
        const dropIndexQuery = `DROP INDEX IF EXISTS ${constraintName};`;
        await pool.query(dropIndexQuery);
        console.log(`✅ Successfully dropped index: ${constraintName}`);
        
      } catch (error) {
        console.log(`⚠️ Issue with ${constraintName}: ${error.message}`);
      }
    }
    
    console.log('\n📋 Checking remaining constraints...');
    
    // Check what unique constraints remain
    const remainingConstraintsQuery = `
      SELECT 
        tc.constraint_name,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name = 'timesheets' 
        AND tc.table_schema = 'public'
        AND tc.constraint_type = 'UNIQUE'
      GROUP BY tc.constraint_name
      ORDER BY tc.constraint_name;
    `;
    
    const result = await pool.query(remainingConstraintsQuery);
    
    console.log('\n🔍 Remaining Unique Constraints:');
    console.log('==================================');
    
    if (result.rows.length === 0) {
      console.log('✅ No unique constraints found on timesheets table');
    } else {
      result.rows.forEach(row => {
        console.log(`🔒 ${row.constraint_name}: ${row.columns}`);
      });
    }
    
    console.log('\n✅ Constraint removal completed!');
    console.log('📝 Users should now be able to submit multiple tasks per week.');
    
  } catch (error) {
    console.error('❌ Error removing constraints:', error);
  } finally {
    await pool.end();
  }
}

removeBlockingConstraints();