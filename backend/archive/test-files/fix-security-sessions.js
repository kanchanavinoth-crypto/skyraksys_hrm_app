const db = require('./backend/models');

(async () => {
  try {
    // Drop the security_sessions table to fix the schema mismatch
    await db.sequelize.query('DROP TABLE IF EXISTS security_sessions CASCADE;');
    console.log('Dropped security_sessions table');
    
    // Force sync the SecuritySession model to recreate with correct schema
    const { SecuritySession } = require('./backend/models/security.models');
    await SecuritySession.sync({ force: true });
    console.log('Recreated security_sessions table with UUID userId field');
    
    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
