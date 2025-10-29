const { Employee, User } = require('./models');

async function checkEmployees() {
  try {
    const employees = await Employee.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email', 'role']
      }]
    });
    
    console.log('Found', employees.length, 'employees:');
    employees.forEach(emp => {
      console.log(`- ${emp.employeeId}: ${emp.firstName} ${emp.lastName} (${emp.user?.role})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEmployees();