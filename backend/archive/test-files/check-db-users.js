// Check users in the backend database file
const db = require('./backend/models');

async function checkDatabaseUsers() {
  try {
    console.log('🔍 Checking all users in database...\n');
    
    // Get all users from database
    const allUsers = await db.User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log(`Found ${allUsers.length} users in database:`);
    console.log('='.repeat(80));
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('   -'.repeat(40));
    });
    
    // Check specifically for test users
    console.log('\n🧪 Checking for test users...');
    const testUsers = await db.User.findAll({
      where: {
        email: {
          [db.Sequelize.Op.like]: '%test%'
        }
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt']
    });
    
    if (testUsers.length > 0) {
      console.log(`Found ${testUsers.length} test users:`);
      testUsers.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - Created: ${user.createdAt}`);
      });
    } else {
      console.log('❌ No test users found in database!');
      console.log('This confirms the issue - users are not being stored properly.');
    }
    
    // Check the most recent user creation
    console.log('\n📅 Most recent user:');
    const latestUser = await db.User.findOne({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt']
    });
    
    if (latestUser) {
      console.log(`Latest: ${latestUser.email} - Created: ${latestUser.createdAt}`);
      
      // Check if this user has an associated employee record
      const associatedEmployee = await db.Employee.findOne({
        where: { userId: latestUser.id },
        attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email']
      });
      
      if (associatedEmployee) {
        console.log(`✅ Has employee record: ${associatedEmployee.employeeId}`);
      } else {
        console.log('❌ No associated employee record found');
      }
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    process.exit(0);
  }
}

checkDatabaseUsers();
