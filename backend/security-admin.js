const { User } = require('./models');

/**
 * Security Management Utility
 * Provides admin functions to manage user account security
 */

async function resetSecurityCounters(email) {
  console.log(`🔧 Resetting security counters for: ${email}`);
  
  try {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ User not found');
      return false;
    }
    
    await user.update({
      loginAttempts: 0,
      lockUntil: null,
      // Note: Don't reset isLocked (manual admin lock) or lockedReason
    });
    
    console.log('✅ Security counters reset successfully');
    console.log(`   - Login attempts: ${user.loginAttempts} → 0`);
    console.log(`   - Temporary lock: ${user.lockUntil ? 'Active' : 'None'} → None`);
    
    return true;
  } catch (error) {
    console.error('❌ Error resetting security counters:', error.message);
    return false;
  }
}

async function unlockAllTemporary() {
  console.log('🔓 Unlocking all temporarily locked accounts...');
  
  try {
    const result = await User.update(
      { 
        loginAttempts: 0,
        lockUntil: null 
      },
      { 
        where: { 
          lockUntil: { [require('sequelize').Op.not]: null }
        }
      }
    );
    
    console.log(`✅ Unlocked ${result[0]} temporarily locked accounts`);
    return result[0];
  } catch (error) {
    console.error('❌ Error unlocking accounts:', error.message);
    return 0;
  }
}

async function getSecurityStatus(email = null) {
  console.log('📊 Current Security Status');
  console.log('========================');
  
  try {
    const whereClause = email ? { email } : {};
    const users = await User.findAll({
      where: whereClause,
      attributes: ['email', 'isLocked', 'lockedReason', 'loginAttempts', 'lockUntil', 'lastLoginAt'],
      order: [['email', 'ASC']]
    });
    
    if (users.length === 0) {
      console.log('No users found');
      return;
    }
    
    users.forEach(user => {
      const now = new Date();
      const isTemporarilyLocked = user.lockUntil && now < user.lockUntil;
      const timeLeft = isTemporarilyLocked ? 
        Math.ceil((user.lockUntil - now) / (1000 * 60)) : 0;
      
      console.log(`\n📧 ${user.email}`);
      console.log(`   Manual Lock: ${user.isLocked ? '🔒 Yes' : '✅ No'} ${user.lockedReason ? `(${user.lockedReason})` : ''}`);
      console.log(`   Temp Lock: ${isTemporarilyLocked ? `🔒 Yes (${timeLeft}m left)` : '✅ No'}`);
      console.log(`   Failed Attempts: ${user.loginAttempts || 0}`);
      console.log(`   Last Login: ${user.lastLoginAt ? user.lastLoginAt.toLocaleString() : 'Never'}`);
    });
    
  } catch (error) {
    console.error('❌ Error getting security status:', error.message);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const email = args[1];
  
  switch (command) {
    case 'reset':
      if (!email) {
        console.log('Usage: node security-admin.js reset <email>');
        return;
      }
      await resetSecurityCounters(email);
      break;
      
    case 'unlock-all':
      await unlockAllTemporary();
      break;
      
    case 'status':
      await getSecurityStatus(email);
      break;
      
    default:
      console.log('🔐 Security Admin Utility');
      console.log('========================');
      console.log('');
      console.log('Commands:');
      console.log('  node security-admin.js status [email]     - Show security status');
      console.log('  node security-admin.js reset <email>      - Reset security counters for user');
      console.log('  node security-admin.js unlock-all         - Unlock all temporarily locked accounts');
      console.log('');
      console.log('Examples:');
      console.log('  node security-admin.js status');
      console.log('  node security-admin.js status admin@company.com');
      console.log('  node security-admin.js reset admin@company.com');
      console.log('  node security-admin.js unlock-all');
      break;
  }
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  resetSecurityCounters,
  unlockAllTemporary,
  getSecurityStatus
};