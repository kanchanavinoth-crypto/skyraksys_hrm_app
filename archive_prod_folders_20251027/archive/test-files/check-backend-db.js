// Check users in the correct backend database
const path = require('path');
process.chdir(path.join(__dirname, 'backend'));

const db = require('./models');

async function checkBackendDatabase() {
  try {
    console.log('🔍 Checking backend database (correct database file)...');
    console.log('Database path:', path.resolve('./database.sqlite'));
    
    // Find all users
    const users = await db.User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    console.log(`\nFound ${users.length} users in backend database:`);
    console.log('=' .repeat(80));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('-' .repeat(80));
    });
    
    // Check for today's users specifically
    const today = new Date().toISOString().split('T')[0];
    const todaysUsers = users.filter(user => 
      user.createdAt.toISOString().startsWith(today)
    );
    
    console.log(`\n📅 Users created today (${today}): ${todaysUsers.length}`);
    todaysUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Created: ${user.createdAt}`);
    });
    
    // Check the most recent user
    if (users.length > 0) {
      const latest = users[0];
      console.log(`\n🕐 Most recent user: ${latest.email} - ${latest.createdAt}`);
      
      // Check if this user has an associated employee record
      const employee = await db.Employee.findOne({
        where: { userId: latest.id },
        attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email']
      });
      
      if (employee) {
        console.log(`✅ Has employee record: ${employee.employeeId} - ${employee.firstName} ${employee.lastName}`);
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

checkBackendDatabase();
