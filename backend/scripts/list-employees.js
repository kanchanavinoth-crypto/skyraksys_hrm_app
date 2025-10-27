const db = require('./models');

async function listEmployees() {
  try {
    await db.sequelize.sync({ force: false });
    
    const employees = await db.Employee.findAll({
      include: [
        { model: db.User, as: 'user', attributes: ['email', 'role', 'isActive'] },
        { model: db.Department, as: 'department' },
        { model: db.Position, as: 'position' }
      ]
    });
    
    console.log('=== EMPLOYEES LIST ===');
    console.log('Total employees found:', employees.length);
    console.log('');
    
    employees.forEach((emp, index) => {
      console.log(`Employee #${index + 1}:`);
      console.log(`  ID: ${emp.id}`);
      console.log(`  Employee ID: ${emp.employeeId}`);
      console.log(`  Name: ${emp.firstName} ${emp.lastName}`);
      console.log(`  Email: ${emp.email}`);
      console.log(`  Department: ${emp.department ? emp.department.name : 'None'}`);
      console.log(`  Position: ${emp.position ? emp.position.title : 'None'}`);
      console.log(`  Status: ${emp.status}`);
      if (emp.user) {
        console.log(`  User Account: ${emp.user.email}`);
        console.log(`  User Role: ${emp.user.role}`);
        console.log(`  User Active: ${emp.user.isActive}`);
      } else {
        console.log('  No user account');
      }
      console.log('  ---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error listing employees:', error);
    process.exit(1);
  }
}

listEmployees();
