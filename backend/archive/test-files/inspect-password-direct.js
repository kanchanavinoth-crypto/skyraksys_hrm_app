// Direct database inspection to find the password issue
const bcrypt = require('bcryptjs');

// Change to backend directory to access models
process.chdir('./backend');
const db = require('./models');

async function inspectPasswordInDB() {
  try {
    console.log('🔍 Inspecting password storage in database...');
    
    // Find the most recent user
    const recentUser = await db.User.scope('withPassword').findOne({
      order: [['createdAt', 'DESC']],
      attributes: ['email', 'password', 'createdAt']
    });
    
    if (!recentUser) {
      console.log('❌ No users found');
      return;
    }
    
    console.log(`📧 Most recent user: ${recentUser.email}`);
    console.log(`📅 Created: ${recentUser.createdAt}`);
    console.log(`🔐 Password field exists: ${!!recentUser.password}`);
    console.log(`🔐 Password length: ${recentUser.password ? recentUser.password.length : 0}`);
    
    if (recentUser.password) {
      console.log(`🔐 Password starts with: ${recentUser.password.substring(0, 10)}...`);
      console.log(`🔐 Looks like bcrypt hash: ${recentUser.password.startsWith('$2b$')}`);
      
      // Test if we can verify any common passwords against this hash
      const testPasswords = [
        'Simple123',
        'TestPassword@123', 
        'WorkingTest123!',
        'password',
        'admin123',
        ''
      ];
      
      console.log('\n🧪 Testing password verification...');
      
      for (const pwd of testPasswords) {
        try {
          const isValid = await bcrypt.compare(pwd, recentUser.password);
          if (isValid) {
            console.log(`✅ FOUND WORKING PASSWORD: "${pwd}"`);
            return;
          } else {
            console.log(`❌ Not: "${pwd}"`);
          }
        } catch (error) {
          console.log(`❌ Error testing "${pwd}": ${error.message}`);
        }
      }
      
      console.log('\n💡 No common passwords work. Let me check if the hash is valid...');
      
      // Test if the hash format is correct
      const hashPattern = /^\$2[aby]\$\d+\$.{53}$/;
      if (hashPattern.test(recentUser.password)) {
        console.log('✅ Hash format looks valid');
        console.log('❌ But password verification still fails');
        console.log('💡 This suggests the password was hashed incorrectly or is different than expected');
      } else {
        console.log('❌ Hash format is invalid!');
        console.log('💡 The password field contains something other than a bcrypt hash');
      }
      
    } else {
      console.log('❌ Password field is empty/null!');
      console.log('💡 This is the root cause - password is not being saved');
    }
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
  }
  
  process.exit(0);
}

inspectPasswordInDB();
