const { Sequelize } = require('./backend/node_modules/sequelize');

const sequelize = new Sequelize('skyraksys_hrm', 'postgres', 'admin123', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgresql',
  logging: false
});

async function checkUsers() {
  try {
    // Check what users exist
    const [users] = await sequelize.query(`
      SELECT 
        u.id, 
        u.email, 
        u.role, 
        e."firstName" || ' ' || e."lastName" as employee_name,
        e.id as employee_id
      FROM users u
      LEFT JOIN employees e ON u.id = e."userId"
      ORDER BY u.email;
    `);
    
    console.log('👥 Users in database:');
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role})`);
        if (user.employee_name) {
          console.log(`   Employee: ${user.employee_name} (ID: ${user.employee_id})`);
        }
        console.log('');
      });
    }
    
    // Check if tables exist
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables in database:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
}

checkUsers();