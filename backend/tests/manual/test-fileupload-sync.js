const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('skyraksys_hrm', 'hrm_admin', 'hrm_secure_2024', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgres',
  logging: true // Enable logging to see the exact SQL
});

async function testFileUploadSync() {
  try {
    console.log('🧪 Testing FileUpload model sync safely...\n');
    
    // Load only the FileUpload model
    const { FileUpload } = require('./models/security.models');
    
    console.log('1. Attempting FileUpload model sync...');
    
    // Try to sync just the FileUpload model
    await FileUpload.sync({ alter: false, force: false });
    
    console.log('✅ FileUpload model sync completed without errors!');
    
    await sequelize.close();
    
    console.log('\n🎉 FileUpload model is now safe to use!');
    console.log('💡 Server should restart without SQL syntax errors.');
    
  } catch (error) {
    console.error('❌ FileUpload sync failed:', error.message);
    if (error.sql) {
      console.error('   Problematic SQL:', error.sql);
    }
    console.error('\n⚠️  There are still issues - server restart will fail!');
    await sequelize.close();
    process.exit(1);
  }
}

testFileUploadSync();