// Find existing user for testing
const { User, Employee } = require('./models');

async function findExistingUser() {
  console.log('\n=== Finding Existing Users ===\n');

  try {
    // Get all users with their employees
    const users = await User.findAll({
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });

    console.log(`👥 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. Email: ${user.email} - Role: ${user.role}`);
      if (user.employee) {
        console.log(`     Employee: ${user.employee.firstName} ${user.employee.lastName} (ID: ${user.employee.id})`);
      } else {
        console.log(`     No employee record`);
      }
    });

    // Get all employees
    const employees = await Employee.findAll();
    console.log(`\n👔 Found ${employees.length} employees:`);
    employees.forEach((emp, index) => {
      console.log(`  ${index + 1}. ${emp.firstName} ${emp.lastName} (ID: ${emp.id}) - UserID: ${emp.userId || 'None'}`);
    });

  } catch (error) {
    console.error('❌ Error finding users:', error.message);
  }
}

findExistingUser().then(() => {
  console.log('\n🎉 User lookup completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});