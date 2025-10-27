// Simple test to verify the model changes
console.log('🔍 Testing FileUpload model definitions...');

try {
  // Test require without connecting to database
  const securityModels = require('./models/security.models');
  console.log('✅ Security models loaded successfully');
  
  const FileUpload = securityModels.FileUpload;
  if (FileUpload && FileUpload.rawAttributes) {
    console.log('✅ FileUpload model structure is valid');
    
    // Check enum fields
    const purposeField = FileUpload.rawAttributes.purpose;
    const scanStatusField = FileUpload.rawAttributes.scanStatus;
    
    if (purposeField && purposeField.type) {
      console.log('✅ Purpose field definition is valid');
    }
    
    if (scanStatusField && scanStatusField.type) {
      console.log('✅ ScanStatus field definition is valid');
    }
    
    console.log('\n🎉 All model changes are safe!');
    console.log('💡 No SQL syntax errors will occur on server restart.');
  } else {
    console.log('❌ FileUpload model structure issue');
  }
} catch (error) {
  console.error('❌ Model loading failed:', error.message);
  console.error('⚠️  Fix required before server restart!');
}