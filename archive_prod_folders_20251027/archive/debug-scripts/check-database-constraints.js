const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hrm_system',
  password: 'Skylightz24',
  port: 5433,
});

async function checkConstraints() {
  try {
    console.log('📋 Checking current database constraints on timesheets table...\n');
    
    // Check all constraints on timesheets table
    const constraintsQuery = `
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name,
        tc.is_deferrable,
        tc.initially_deferred
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name = 'timesheets' 
        AND tc.table_schema = 'public'
      ORDER BY tc.constraint_name, kcu.ordinal_position;
    `;
    
    const result = await pool.query(constraintsQuery);
    
    console.log('🔍 Current Constraints on timesheets table:');
    console.log('================================================');
    
    if (result.rows.length === 0) {
      console.log('❌ No constraints found on timesheets table');
    } else {
      result.rows.forEach(row => {
        console.log(`📝 ${row.constraint_name} (${row.constraint_type})`);
        console.log(`   Column: ${row.column_name}`);
        console.log(`   Deferrable: ${row.is_deferrable}`);
        console.log(`   Initially Deferred: ${row.initially_deferred}`);
        console.log('');
      });
    }
    
    // Specifically check for unique constraints
    console.log('\n🔍 Unique Constraints specifically:');
    console.log('=====================================');
    
    const uniqueConstraintsQuery = `
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
    
    const uniqueResult = await pool.query(uniqueConstraintsQuery);
    
    if (uniqueResult.rows.length === 0) {
      console.log('✅ No unique constraints found on timesheets table');
    } else {
      uniqueResult.rows.forEach(row => {
        console.log(`🔒 ${row.constraint_name}: ${row.columns}`);
      });
    }
    
    // Check indexes as well
    console.log('\n🔍 Indexes on timesheets table:');
    console.log('===============================');
    
    const indexQuery = `
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'timesheets'
        AND schemaname = 'public'
      ORDER BY indexname;
    `;
    
    const indexResult = await pool.query(indexQuery);
    
    if (indexResult.rows.length === 0) {
      console.log('❌ No indexes found on timesheets table');
    } else {
      indexResult.rows.forEach(row => {
        console.log(`📊 ${row.indexname}`);
        console.log(`   Definition: ${row.indexdef}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking constraints:', error);
  } finally {
    await pool.end();
  }
}

checkConstraints();