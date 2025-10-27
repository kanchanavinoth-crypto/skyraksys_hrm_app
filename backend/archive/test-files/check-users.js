const db = require('./backend/models');

async function checkUsers() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected');
    
    const users = await db.User.findAll({
      attributes: ['email', 'role', 'isActive']
    });
    
    console.log('\n📋 Users in database:');
    users.forEach(u => {
      console.log(`- ${u.email} (${u.role}) - Active: ${u.isActive}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
