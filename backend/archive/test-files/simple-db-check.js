// Simple database check
const db = require('./backend/models');

async function simpleCheck() {
  try {
    // Count total users
    const userCount = await db.User.count();
    console.log(`Total users in database: ${userCount}`);
    
    // Get recent users
    const recentUsers = await db.User.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['email', 'role', 'createdAt']
    });
    
    console.log('\nRecent users:');
    recentUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
    // Check for any test users
    const testUserCount = await db.User.count({
      where: {
        email: {
          [db.Sequelize.Op.like]: '%test%'
        }
      }
    });
    
    console.log(`\nTest users found: ${testUserCount}`);
    
    if (testUserCount === 0) {
      console.log('❌ ISSUE CONFIRMED: No test users in database!');
      console.log('The employee creation API is not properly creating user records.');
    } else {
      console.log('✅ Test users exist in database');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

simpleCheck();
