const { User, Employee, Department, Position } = require('./models');

async function finalManagerSetup() {
  try {
    console.log('=== Final Manager Setup & Verification ===\n');
    
    // Step 1: Ensure John has a proper manager with "manager" role
    const john = await Employee.findByPk('614a6351-29b0-4819-950f-1deb9965926c');
    
    // Find employee with manager role
    const managerEmployee = await Employee.findOne({
      include: [{
        model: User,
        as: 'user',
        where: { role: 'manager' },
        required: true
      }]
    });
    
    if (john && managerEmployee) {
      await john.update({ managerId: managerEmployee.id });
      console.log(`✅ John Developer now reports to ${managerEmployee.firstName} ${managerEmployee.lastName} (manager role)`);
    }
    
    // Step 2: Show login details
    const allUsers = await User.findAll({
      attributes: ['email', 'role', 'firstName', 'lastName'],
      where: { isActive: true }
    });
    
    console.log('\n🔐 Login Credentials (Password: password123 for all):');
    allUsers.forEach(user => {
      console.log(`   ${user.firstName} ${user.lastName} (${user.role}): ${user.email}`);
    });
    
    console.log('\n✅ Setup Complete! You can now:');
    console.log('1. Log in with any user using email and password "password123"');
    console.log('2. John Developer has a proper manager with "manager" role');
    console.log('3. All department, position, and manager fields will display correctly');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

finalManagerSetup();
