const { Sequelize } = require('./backend/node_modules/sequelize');

const sequelize = new Sequelize('skyraksys_hrm', 'postgres', 'admin123', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgresql',
  logging: false
});

async function checkConstraints() {
  try {
    // Check existing indexes on timesheets table
    const [results] = await sequelize.query(`
      SELECT 
        indexname as constraint_name, 
        indexdef as definition 
      FROM pg_indexes 
      WHERE tablename = 'timesheets' 
        AND schemaname = 'public'
      ORDER BY indexname;
    `);
    
    console.log('📋 Existing indexes on timesheets table:');
    results.forEach((row, index) => {
      console.log(`${index + 1}. ${row.constraint_name}`);
      console.log(`   ${row.definition}`);
      console.log('');
    });

    // Check table constraints too
    const [constraints] = await sequelize.query(`
      SELECT 
        constraint_name, 
        constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'timesheets' 
        AND table_schema = 'public'
      ORDER BY constraint_name;
    `);
    
    console.log('🔐 Table constraints:');
    constraints.forEach((row, index) => {
      console.log(`${index + 1}. ${row.constraint_name} (${row.constraint_type})`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
}

checkConstraints();