const db = require('./backend/models');

async function checkData() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected');
    
    const employees = await db.Employee.findAll();
    const timesheets = await db.Timesheet.findAll();
    const leaves = await db.Leave.findAll();
    const payrolls = await db.Payroll.findAll();
    
    console.log('📊 Database Contents:');
    console.log('   Employees:', employees.length);
    console.log('   Timesheets:', timesheets.length);
    console.log('   Leaves:', leaves.length);
    console.log('   Payrolls:', payrolls.length);
    
    if (employees.length > 0) {
      console.log('👥 Employee examples:');
      employees.slice(0, 3).forEach(emp => {
        console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.email})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();
