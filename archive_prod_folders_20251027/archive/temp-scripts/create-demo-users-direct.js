const { User } = require('./backend/models');
const bcrypt = require('bcryptjs');

// Strong passwords matching our test automation setup
const demoUsers = [
  {
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t',
    role: 'admin',
    isActive: true
  },
  {
    firstName: 'HR',
    lastName: 'Manager',
    email: 'hr@company.com', 
    password: 'Lw3nQ6xY8mD4vB7h',
    role: 'hr',
    isActive: true
  },
  {
    firstName: 'Team',
    lastName: 'Manager',
    email: 'manager@test.com',
    password: 'Qy8nR6wA2mS5kD7j',
    role: 'manager',
    isActive: true
  },
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'employee@company.com',
    password: 'Mv4pS9wE2nR6kA8j',
    role: 'employee',
    isActive: true
  },
  {
    firstName: 'Test',
    lastName: 'Admin',
    email: 'admin@test.com',
    password: 'Nx7rT5yU3mK9sD6g',
    role: 'admin',
    isActive: true
  },
  {
    firstName: 'Test',
    lastName: 'HR',
    email: 'hr@test.com',
    password: 'Ow2nV8xC4mP7rA9k',
    role: 'hr',
    isActive: true
  },
  {
    firstName: 'Test',
    lastName: 'Employee',
    email: 'employee@test.com',
    password: 'Pz5qW3nE7mT9vB4x',
    role: 'employee',
    isActive: true
  }
];

async function createDemoUsersDirectly() {
  console.log('👥 Creating demo users directly in database...');
  console.log('===============================================');
  
  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const userData of demoUsers) {
    try {
      console.log(`\n🔍 Processing user: ${userData.email}`);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create or update user
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: {
          ...userData,
          password: hashedPassword
        }
      });
      
      if (created) {
        console.log(`✅ Created new user: ${userData.email}`);
        console.log(`   Password: ${userData.password}`);
        createdCount++;
      } else {
        // Update existing user with new password
        await user.update({ 
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          isActive: userData.isActive
        });
        console.log(`🔄 Updated existing user: ${userData.email}`);
        console.log(`   New password: ${userData.password}`);
        updatedCount++;
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${userData.email}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n📊 Demo User Creation Summary');
  console.log('=============================');
  console.log(`✅ Users created: ${createdCount}`);
  console.log(`🔄 Users updated: ${updatedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`🎯 Total processed: ${demoUsers.length}`);
  
  if (createdCount > 0 || updatedCount > 0) {
    console.log('\n🎉 Demo users have been set up with strong passwords!');
    console.log('💡 These passwords match your test automation credentials.');
    console.log('🔒 Browser password manager popups should no longer appear.');
    console.log('\n🔑 Login Credentials:');
    demoUsers.forEach(user => {
      console.log(`   ${user.email} / ${user.password}`);
    });
  }
}

createDemoUsersDirectly()
  .then(() => {
    console.log('\n✨ Demo user setup completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Demo user setup failed:', err);
    process.exit(1);
  });
