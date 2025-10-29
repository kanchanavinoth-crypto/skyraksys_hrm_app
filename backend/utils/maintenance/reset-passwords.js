// Check user passwords and reset them if needed
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function checkAndResetPasswords() {
  console.log('\n=== Checking User Passwords ===\n');

  try {
    const users = await User.findAll();
    
    console.log(`Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.email} (${user.role})`);
      
      if (!user.password) {
        console.log(`   No password set - setting password123`);
        const hashedPassword = await bcrypt.hash('password123', 10);
        await user.update({ password: hashedPassword });
        console.log(`   ✅ Password set to 'password123'`);
      } else {
        // Try to check if password123 works
        const isValidPassword = await bcrypt.compare('password123', user.password);
        console.log(`   Current password 'password123' works: ${isValidPassword}`);
        
        if (!isValidPassword) {
          // Reset password to 'password123'
          const hashedPassword = await bcrypt.hash('password123', 10);
          await user.update({ password: hashedPassword });
          console.log(`   ✅ Password reset to 'password123'`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking passwords:', error.message);
  }
}

checkAndResetPasswords().then(() => {
  console.log('\n🎉 Password check completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});