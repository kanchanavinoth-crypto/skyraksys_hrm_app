const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('skyraksys_hrm', 'hrm_admin', 'hrm_secure_2024', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgres',
  logging: false
});

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    console.log('📊 Local Database: skyraksys_hrm');
    console.log('🔑 User: hrm_admin');
    console.log('🔌 Port: 5433');
    
    // Get all tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Current Tables in Database:');
    results.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${row.table_name}`);
    });
    
    console.log(`\nTotal Tables: ${results.length}`);
    
    // Check if payslip-related tables exist
    const payslipTables = results.filter(row => 
      row.table_name.includes('payslip') || 
      row.table_name.includes('payroll') || 
      row.table_name.includes('salary')
    );
    
    console.log('\n💰 Payroll/Payslip Related Tables:');
    if (payslipTables.length > 0) {
      payslipTables.forEach((row, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${row.table_name}`);
      });
    } else {
      console.log('❌ No payslip/payroll tables found');
    }
    
    // Check for UUID extension
    const [uuidCheck] = await sequelize.query(`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
      ) as has_uuid_extension;
    `);
    
    console.log(`\n🔧 UUID Extension: ${uuidCheck[0].has_uuid_extension ? '✅ Installed' : '❌ Not Installed'}`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();