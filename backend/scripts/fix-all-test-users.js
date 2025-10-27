const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

async function fixAllTestUsers() {
  try {
    console.log('Fixing password hashes for all test users...');
    
    const testUsers = await User.scope('withPassword').findAll({ 
      where: { 
        email: { 
          [Op.like]: '%@test.com' 
        } 
      } 
    });
    
    const correctPassword = 'admin123';
    const correctHash = await bcrypt.hash(correctPassword, 12);
    
    for (const user of testUsers) {
      await user.update({ password: correctHash });
      console.log('✅ Updated password for:', user.email);
    }
    
    console.log(`🎉 Fixed ${testUsers.length} test user passwords!`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

fixAllTestUsers();
