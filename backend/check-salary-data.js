const { Employee } = require('./models');

async function checkSalaryData() {
  try {
    const employees = await Employee.findAll({
      where: { status: 'Active' },
      limit: 5,
      attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'salary', 'dateOfBirth', 'esiNumber']
    });

    console.log('\n=== Active Employees ===\n');
    
    employees.forEach(emp => {
      console.log(`${emp.employeeId} - ${emp.firstName} ${emp.lastName}`);
      console.log(`Email: ${emp.email}`);
      console.log(`Date of Birth: ${emp.dateOfBirth || 'MISSING'}`);
      console.log(`ESI Number: ${emp.esiNumber || 'MISSING'}`);
      console.log(`Salary data: ${emp.salary ? 'EXISTS' : 'MISSING'}`);
      if (emp.salary) {
        console.log(`  Basic Salary: ${emp.salary.basicSalary || 'N/A'}`);
        console.log(`  Currency: ${emp.salary.currency || 'N/A'}`);
      }
      console.log('---\n');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSalaryData();
