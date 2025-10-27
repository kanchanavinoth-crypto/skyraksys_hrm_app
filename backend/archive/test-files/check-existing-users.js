const { User } = require('./backend/models');

async function checkExistingUsers() {
  console.log('👥 Checking existing users in database...');
  console.log('=========================================');
  
  try {
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });
    
    if (users.length === 0) {
      console.log('📭 No users found in database');
      console.log('💡 You need to create demo users first');
    } else {
      console.log(`📊 Found ${users.length} users in database:\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      });
    }
    
    console.log('🔍 Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Admin users: ${users.filter(u => u.role === 'admin').length}`);
    console.log(`   HR users: ${users.filter(u => u.role === 'hr').length}`);
    console.log(`   Manager users: ${users.filter(u => u.role === 'manager').length}`);
    console.log(`   Employee users: ${users.filter(u => u.role === 'employee').length}`);
    console.log(`   Active users: ${users.filter(u => u.isActive).length}`);
    
  } catch (error) {
    console.error('💥 Error checking users:', error.message);
  }
}

checkExistingUsers()
  .then(() => {
    console.log('\n✨ User check completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 User check failed:', err);
    process.exit(1);
  });
