const db = require('./backend/models');

(async () => {
  try {
    console.log('🔍 Checking database users...');
    const users = await db.User.findAll({ 
      attributes: ['id', 'email', 'role', 'isActive'],
      raw: true 
    });
    
    console.log(`Users found: ${users.length}`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('Creating test user...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Kx9mP7qR2nF8sA5t', 10);
      
      await db.User.create({
        email: 'admin@company.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      
      console.log('✅ Test admin user created!');
    } else {
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - Active: ${user.isActive}`);
      });
    }
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection working');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  process.exit(0);
})();
