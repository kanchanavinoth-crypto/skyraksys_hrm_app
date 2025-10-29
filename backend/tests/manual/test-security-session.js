const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Import and test SecuritySession model
try {
  // Load the security models file to check for syntax errors
  require('../models/security.models.js');
  console.log('✅ Security models loaded successfully!');
  
  // Test SecuritySession model sync specifically
  const { SecuritySession } = require('../models/security.models.js');
  
  if (SecuritySession) {
    console.log('✅ SecuritySession model found!');
    
    // Test the model definition (without actually syncing to avoid DB conflicts)
    const modelAttributes = SecuritySession.rawAttributes;
    console.log('✅ SecuritySession model attributes loaded successfully!');
    
    // Check if logoutReason field is properly defined
    if (modelAttributes.logoutReason) {
      console.log('✅ logoutReason field definition:');
      console.log('   Type:', modelAttributes.logoutReason.type.constructor.name);
      console.log('   AllowNull:', modelAttributes.logoutReason.allowNull);
      console.log('   Comment:', modelAttributes.logoutReason.comment || 'None (fixed)');
    }
  } else {
    console.log('❌ SecuritySession model not found!');
  }
  
} catch (error) {
  console.error('❌ Error loading SecuritySession model:', error.message);
  console.error('Stack:', error.stack);
}