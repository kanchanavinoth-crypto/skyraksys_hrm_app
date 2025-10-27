const db = require('./models');

async function createTestEmployee() {
  try {
    await db.sequelize.sync({ force: false });
    
    // Get Operations department and HR Executive position
    const department = await db.Department.findOne({ where: { name: 'Engineering' } });
    const position = await db.Position.findOne({ where: { title: 'Software Engineer' } });
    
    // Create a test employee
    const testEmployee = await db.Employee.create({
      employeeId: 'EMP002',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@skyraksys.com',
      phone: '+1-555-0102',
      status: 'active',
      hireDate: new Date('2023-01-15'),
      salary: 75000,
      departmentId: department ? department.id : null,
      positionId: position ? position.id : null
    });
    
    console.log('Test employee created:');
    console.log(`ID: ${testEmployee.id}`);
    console.log(`Employee ID: ${testEmployee.employeeId}`);
    console.log(`Name: ${testEmployee.firstName} ${testEmployee.lastName}`);
    console.log(`Email: ${testEmployee.email}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test employee:', error);
    process.exit(1);
  }
}

createTestEmployee();
