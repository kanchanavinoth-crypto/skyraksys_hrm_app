const db = require('./backend/models');

async function debugEmployeeStatus() {
  console.log('🔍 Debugging Employee Status in Database\n');
  
  try {
    // Get all employees without filters
    const allEmployees = await db.Employee.findAll({
      include: [
        { model: db.User, as: 'user' },
        { model: db.Department, as: 'department' },
        { model: db.Position, as: 'position' }
      ]
    });
    
    console.log(`Found ${allEmployees.length} total employees in database:`);
    
    allEmployees.forEach((emp, index) => {
      console.log(`\n${index + 1}. Employee Details:`);
      console.log(`   ID: ${emp.id}`);
      console.log(`   Employee ID: ${emp.employeeId}`);
      console.log(`   Name: ${emp.firstName} ${emp.lastName}`);
      console.log(`   Email: ${emp.email}`);
      console.log(`   Status: "${emp.status}" (type: ${typeof emp.status})`);
      console.log(`   User Role: ${emp.user?.role}`);
      console.log(`   Department: ${emp.department?.name}`);
      console.log(`   Position: ${emp.position?.title}`);
    });
    
    // Now try to find Active employees
    console.log('\n🔍 Searching for Active employees...');
    const activeEmployees = await db.Employee.findAll({
      where: { status: 'Active' }
    });
    
    console.log(`Active employees found: ${activeEmployees.length}`);
    
    // Try case-insensitive search
    console.log('\n🔍 Searching case-insensitive...');
    const activeEmployeesCI = await db.Employee.findAll({
      where: db.sequelize.where(
        db.sequelize.fn('LOWER', db.sequelize.col('status')),
        'active'
      )
    });
    
    console.log(`Case-insensitive active employees: ${activeEmployeesCI.length}`);
    
    // Show all unique statuses
    const uniqueStatuses = [...new Set(allEmployees.map(emp => emp.status))];
    console.log(`\n📊 Unique statuses in database: [${uniqueStatuses.map(s => `"${s}"`).join(', ')}]`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

debugEmployeeStatus();
