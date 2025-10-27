// Direct database inspection test
const db = require('./backend/models');
const bcrypt = require('bcryptjs');

async function inspectDatabase() {
  try {
    console.log('🔍 Inspecting database directly...');
    
    // Find the most recent user (not just test users)
    const recentUser = await db.User.findOne({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'firstName', 'lastName', 'email', 'password', 'role', 'isActive', 'createdAt']
    });
    
    if (!recentUser) {
      console.log('❌ No users found');
      return;
    }
    
    console.log('✅ Found most recent user:', {
      id: recentUser.id,
      email: recentUser.email,
      role: recentUser.role,
      isActive: recentUser.isActive,
      createdAt: recentUser.createdAt,
      passwordStart: recentUser.password ? recentUser.password.substring(0, 10) + '...' : 'NULL',
      passwordLength: recentUser.password ? recentUser.password.length : 0
    });
    
    // Test password verification
    const testPasswords = [
      'TestPassword@123',
      'TestPassword123',
      'PasswordTest123'
    ];
    
    console.log('\n🔐 Testing password verification:');
    for (const pwd of testPasswords) {
      try {
        const isValid = await bcrypt.compare(pwd, recentUser.password);
        console.log(`Password "${pwd}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
        
        if (isValid) {
          console.log(`🎉 Found working password: ${pwd}`);
          break;
        }
      } catch (error) {
        console.log(`Password "${pwd}": ❌ Error - ${error.message}`);
      }
    }
    
    // Also test what the actual stored hash looks like
    console.log('\n🔬 Password hash analysis:');
    console.log('Hash starts with $2b$ (bcrypt):', recentUser.password.startsWith('$2b$'));
    console.log('Hash format looks valid:', /^\$2[aby]\$\d+\$/.test(recentUser.password));
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
  } finally {
    process.exit(0);
  }
}

inspectDatabase();
