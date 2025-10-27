const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function checkPasswordsAndFix() {
  console.log('Checking demo user passwords...\n');
  
  const testUsers = await User.findAll({ 
    where: { 
      email: { 
        [require('sequelize').Op.in]: [
          'admin@test.com', 
          'hr@test.com', 
          'manager@test.com', 
          'employee@test.com'
        ] 
      } 
    } 
  });
  
  for (const user of testUsers) {
    console.log(`Checking ${user.email}...`);
    
    // Check if current password works
    const isCurrentValid = await bcrypt.compare('admin123', user.password);
    console.log(`Current password valid: ${isCurrentValid}`);
    
    if (!isCurrentValid) {
      // Password needs to be re-hashed
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await user.update({ password: hashedPassword });
      console.log(`✅ Updated password for ${user.email}`);
      
      // Verify the fix
      const isNewValid = await bcrypt.compare('admin123', user.password);
      console.log(`New password valid: ${isNewValid}`);
    } else {
      console.log(`✅ Password already correct for ${user.email}`);
    }
    console.log('');
  }
  
  console.log('Password check/fix complete!');
}

checkPasswordsAndFix()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
