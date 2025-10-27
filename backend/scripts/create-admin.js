const bcrypt = require('bcryptjs');
const db = require('../models');

async function createAdmin() {
  try {
    // Sync database
    await db.sequelize.sync({ force: false });
    
    console.log('Database synchronized');
    
    // Check if admin already exists
    const existingAdmin = await db.User.findOne({
      where: { email: 'admin@skyraksys.com' }
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const adminUser = await db.User.create({
      email: 'admin@skyraksys.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    
    console.log('Admin user created successfully:', adminUser.email);
    
    // Create corresponding employee record if needed
    await db.Employee.create({
      userId: adminUser.id,
      employeeId: 'EMP001',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@skyraksys.com',
      phone: '+1-555-0001',
      status: 'active',
      hireDate: new Date()
    });
    
    console.log('Admin employee record created');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
