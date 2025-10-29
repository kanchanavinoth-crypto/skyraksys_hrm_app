// Check what users exist in the system
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

async function checkUsers() {
  try {
    console.log('🔍 Checking users in the system...\n');

    const [users] = await sequelize.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u."firstName",
        u."lastName",
        e.id as employeeId,
        e."employeeId" as empNumber
      FROM "users" u
      LEFT JOIN "employees" e ON u.id = e."userId"
      WHERE u."deletedAt" IS NULL
      ORDER BY u.email
    `);

    console.log(`📊 Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Employee ID: ${user.employeeId}`);
      console.log(`   Employee Number: ${user.empNumber}`);
      console.log('');
    });

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error checking users:', error);
    await sequelize.close();
  }
}

checkUsers();