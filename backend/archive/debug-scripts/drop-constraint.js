const { Sequelize } = require('./backend/node_modules/sequelize');

const sequelize = new Sequelize('skyraksys_hrm', 'postgres', 'admin123', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgresql',
  logging: false
});

async function dropConstraint() {
  try {
    // Drop the problematic unique constraint index
    await sequelize.query('DROP INDEX IF EXISTS unique_employee_week CASCADE;');
    console.log('✅ Dropped unique_employee_week index');
    
    // Also drop the unique constraint if it exists as constraint
    await sequelize.query('ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS unique_employee_week CASCADE;');
    console.log('✅ Dropped unique_employee_week table constraint');
    
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
}

dropConstraint();