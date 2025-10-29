// Check employee-user relationships and find who has the Week 37 timesheets
const { Sequelize, Op } = require('sequelize');

// Initialize database connection
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5433,
  database: 'skyraksys_hrm',
  username: 'hrm_admin',
  password: 'hrm_secure_2024',
  logging: false
});

async function checkEmployeeUserRelation() {
  try {
    console.log('🔍 Checking employee-user relationships...\n');

    // Find the employee who has Week 37 timesheets
    const [employees] = await sequelize.query(`
      SELECT 
        e.id,
        e."firstName",
        e."lastName",
        e.email,
        e."userId",
        u.email as userEmail,
        u.role
      FROM "employees" e
      LEFT JOIN "users" u ON e."userId" = u.id
      WHERE e."deletedAt" IS NULL
      ORDER BY e."firstName"
    `);

    console.log(`📊 Found ${employees.length} employees:\n`);
    
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. Employee ID: ${emp.id}`);
      console.log(`   Name: ${emp.firstName} ${emp.lastName}`);
      console.log(`   Employee Email: ${emp.email}`);
      console.log(`   User ID: ${emp.userId}`);
      console.log(`   User Email: ${emp.userEmail}`);
      console.log(`   Role: ${emp.role}`);
      
      // Check if this is the employee with Week 37 timesheets
      if (emp.id === '44e1c634-485f-46ac-b9d9-f9b8b832a553') {
        console.log('   *** THIS IS THE EMPLOYEE WITH WEEK 37 TIMESHEETS ***');
      }
      console.log('');
    });

    // Try to find password for the correct user
    console.log('🔍 Checking user passwords (for testing)...\n');
    
    const [userPasswords] = await sequelize.query(`
      SELECT 
        email,
        password
      FROM "users"
      WHERE "deletedAt" IS NULL
      LIMIT 5
    `);

    userPasswords.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password Hash: ${user.password.substring(0, 20)}...`);
      console.log('');
    });

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error checking employee-user relationship:', error);
    await sequelize.close();
  }
}

checkEmployeeUserRelation();