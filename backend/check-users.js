const { User } = require('./models');

async function checkUsers() {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'firstName', 'lastName'],
      limit: 10
    });
    
    console.log('📋 Users in database:\n');
    users.forEach(u => {
      console.log(`  ${u.email.padEnd(35)} | Role: ${u.role.padEnd(10)} | Name: ${u.firstName} ${u.lastName}`);
    });
    
    console.log(`\n📊 Total users found: ${users.length}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
