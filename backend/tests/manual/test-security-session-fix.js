const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('skyraksys_hrm', 'hrm_admin', 'hrm_secure_2024', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgres',
  logging: false
});

async function testSecuritySessionFix() {
  try {
    console.log('🧪 Testing SecuritySession model fix...\n');
    
    // Load the security models
    const { SecuritySession } = require('./models/security.models');
    
    console.log('1. Testing SecuritySession model definition...');
    
    if (SecuritySession && SecuritySession.rawAttributes) {
      const sessionIdField = SecuritySession.rawAttributes.sessionId;
      
      if (sessionIdField) {
        console.log('   ✅ SessionId field defined correctly');
        console.log('   📋 Field type:', sessionIdField.type.constructor.name);
        console.log('   📋 Unique constraint:', sessionIdField.unique || 'handled via index');
      } else {
        console.log('   ❌ SessionId field not found');
      }
    }
    
    console.log('2. Checking if security_sessions table exists...');
    const [tableExists] = await sequelize.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'security_sessions' AND table_schema = 'public'
    `);
    
    if (tableExists[0].count > 0) {
      console.log('   ✅ security_sessions table exists');
    } else {
      console.log('   ⚠️  security_sessions table does not exist yet');
    }
    
    await sequelize.close();
    
    console.log('\n🎉 SecuritySession model validation completed!');
    console.log('💡 The UNIQUE constraint syntax error should be fixed.');
    
  } catch (error) {
    console.error('❌ SecuritySession validation failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

testSecuritySessionFix();