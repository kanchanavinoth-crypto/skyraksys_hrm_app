const db = require('./backend/models');

async function simpleEmployeeCheck() {
  try {
    console.log('🔍 Simple Employee Status Check\n');
    
    // Get basic employee data
    const employees = await db.Employee.findAll({
      attributes: ['id', 'employeeId', 'firstName', 'lastName', 'status'],
      raw: true
    });
    
    console.log('Raw employee data:');
    employees.forEach((emp, i) => {
      console.log(`${i+1}. ${emp.firstName} ${emp.lastName} - Status: "${emp.status}"`);
    });
    
    console.log(`\nTotal: ${employees.length} employees`);
    
    // Check Active status
    const activeCount = employees.filter(emp => emp.status === 'Active').length;
    const lowercaseActiveCount = employees.filter(emp => emp.status === 'active').length;
    
    console.log(`Active (uppercase): ${activeCount}`);
    console.log(`active (lowercase): ${lowercaseActiveCount}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

simpleEmployeeCheck();
