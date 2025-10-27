const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function debugTestUser() {
  try {
    const user = await User.scope('withPassword').findOne({ 
      where: { email: 'admin@test.com' }
    });
    
    if (user) {
      console.log('✅ User found:', user.email);
      console.log('   Role:', user.role);
      console.log('   Active:', user.isActive);
      console.log('   Password hash exists:', !!user.password);
      
      // Test password verification
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('   Password test result:', isValid);
      
      if (!isValid) {
        console.log('🔄 Updating password hash...');
        const newHash = await bcrypt.hash(testPassword, 12);
        await user.update({ password: newHash });
        console.log('✅ Password updated');
      }
      
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

debugTestUser();
