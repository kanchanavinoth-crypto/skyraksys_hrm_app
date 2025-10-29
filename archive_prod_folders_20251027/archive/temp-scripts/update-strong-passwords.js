const path = require('path');

// Add backend to module path for model access
process.env.NODE_PATH = path.join(__dirname, 'backend');
require('module')._initPaths();

const sequelize = require('./backend/models').sequelize;
const { User } = require('./backend/models');
const bcrypt = require('bcryptjs');

// Strong passwords matching our test automation setup
const passwordUpdates = [
  {
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t'
  },
  {
    email: 'hr@company.com', 
    password: 'Lw3nQ6xY8mD4vB7h'
  },
  {
    email: 'manager@test.com',
    password: 'Qy8nR6wA2mS5kD7j'
  },
  {
    email: 'employee@company.com',
    password: 'Mv4pS9wE2nR6kA8j'
  },
  {
    email: 'admin@test.com',
    password: 'Nx7rT5yU3mK9sD6g'
  },
  {
    email: 'hr@test.com',
    password: 'Ow2nV8xC4mP7rA9k'
  },
  {
    email: 'employee@test.com',
    password: 'Pz5qW3nE7mT9vB4x'
  }
];

async function updateStrongPasswords() {
  console.log('🔐 Updating database with strong passwords...');
  console.log('============================================');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const userUpdate of passwordUpdates) {
      try {
        console.log(`\n🔍 Looking for user: ${userUpdate.email}`);
        
        const user = await User.findOne({ where: { email: userUpdate.email } });
        
        if (user) {
          // Hash the new strong password
          const hashedPassword = await bcrypt.hash(userUpdate.password, 12);
          
          // Update the user's password
          await user.update({ password: hashedPassword });
          
          console.log(`✅ Updated password for: ${userUpdate.email}`);
          console.log(`   New password: ${userUpdate.password}`);
          updatedCount++;
        } else {
          console.log(`❌ User not found: ${userUpdate.email}`);
          notFoundCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${userUpdate.email}:`, error.message);
      }
    }
    
    console.log('\n📊 Password Update Summary');
    console.log('==========================');
    console.log(`✅ Successfully updated: ${updatedCount} users`);
    console.log(`❌ Users not found: ${notFoundCount} users`);
    console.log(`🎯 Total processed: ${passwordUpdates.length} users`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Database passwords have been updated with strong passwords!');
      console.log('💡 These match the test automation credentials exactly.');
      console.log('🔒 Browser password manager popups should no longer appear.');
    }
    
  } catch (error) {
    console.error('💥 Database connection failed:', error.message);
    console.log('\n🔧 Make sure the backend server is running first:');
    console.log('   npm run start-backend');
  } finally {
    await sequelize.close();
    console.log('\n✅ Database connection closed');
  }
}

updateStrongPasswords()
  .then(() => {
    console.log('\n✨ Password update process completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Password update failed:', err);
    process.exit(1);
  });
