const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function updateDemoPasswords() {
  console.log('Updating demo user passwords...');
  
  const demoEmails = ['admin@test.com', 'hr@test.com', 'manager@test.com', 'employee@test.com'];
  
  for (const email of demoEmails) {
    try {
      const user = await User.findOne({ where: { email } });
      if (user) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await user.update({ password: hashedPassword });
        console.log(`✅ Updated password for ${email}`);
      } else {
        console.log(`❌ User not found: ${email}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${email}:`, error.message);
    }
  }
  
  console.log('Password update complete!');
}

updateDemoPasswords()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
