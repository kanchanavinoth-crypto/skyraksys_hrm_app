const db = require('./models');

async function listUsers() {
  try {
    await db.sequelize.sync();
    
    const users = await db.User.findAll({
      attributes: ['id', 'email', 'role', 'isActive']
    });
    
    console.log('Total users:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsers();
