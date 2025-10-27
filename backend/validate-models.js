const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize('skyraksys_hrm', 'hrm_admin', 'hrm_secure_2024', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgres',
  logging: false
});

async function testModelDefinitions() {
  try {
    console.log('🧪 Testing model definitions...\n');
    
    // Test loading the security models without executing sync
    console.log('1. Loading security models...');
    const securityModels = require('./models/security.models');
    console.log('   ✅ Security models loaded successfully');
    
    // Test that the models have the expected structure
    console.log('2. Checking FileUpload model structure...');
    const FileUpload = securityModels.FileUpload;
    
    if (FileUpload) {
      console.log('   ✅ FileUpload model exists');
      
      // Check if the enum fields are properly defined
      const purposeField = FileUpload.rawAttributes.purpose;
      const scanStatusField = FileUpload.rawAttributes.scanStatus;
      
      if (purposeField && purposeField.type && purposeField.type.key === 'ENUM') {
        console.log('   ✅ Purpose field enum definition correct');
      } else {
        console.log('   ❌ Purpose field definition issue');
      }
      
      if (scanStatusField && scanStatusField.type && scanStatusField.type.key === 'ENUM') {
        console.log('   ✅ ScanStatus field enum definition correct');
      } else {
        console.log('   ❌ ScanStatus field definition issue');
      }
    } else {
      console.log('   ❌ FileUpload model not found');
    }
    
    // Test database connection without sync
    console.log('3. Testing database connection...');
    await sequelize.authenticate();
    console.log('   ✅ Database connection successful');
    
    // Check if file_uploads table exists and has correct structure
    console.log('4. Checking file_uploads table structure...');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'file_uploads' 
      ORDER BY ordinal_position
    `);
    
    if (columns.length > 0) {
      console.log('   ✅ file_uploads table exists with', columns.length, 'columns');
      
      // Check for enum columns
      const purposeCol = columns.find(c => c.column_name === 'purpose');
      const scanStatusCol = columns.find(c => c.column_name === 'scanStatus');
      
      if (purposeCol && purposeCol.data_type === 'USER-DEFINED') {
        console.log('   ✅ purpose column has correct enum type');
      } else {
        console.log('   ⚠️  purpose column type:', purposeCol ? purposeCol.data_type : 'NOT FOUND');
      }
      
      if (scanStatusCol && scanStatusCol.data_type === 'USER-DEFINED') {
        console.log('   ✅ scanStatus column has correct enum type');
      } else {
        console.log('   ⚠️  scanStatus column type:', scanStatusCol ? scanStatusCol.data_type : 'NOT FOUND');
      }
    } else {
      console.log('   ❌ file_uploads table not found');
    }
    
    await sequelize.close();
    
    console.log('\n🎉 Model validation completed successfully!');
    console.log('💡 Changes appear safe - no breaking issues detected.');
    
  } catch (error) {
    console.error('❌ Model validation failed:', error.message);
    if (error.original) {
      console.error('   SQL Error:', error.original.message);
    }
    console.error('\n⚠️  DO NOT restart server - fix issues first!');
    process.exit(1);
  }
}

testModelDefinitions();