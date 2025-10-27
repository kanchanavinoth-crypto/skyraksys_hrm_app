const path = require('path');

// Navigate to backend directory for model access
const { sequelize } = require('./backend/models');

async function initializeDatabase() {
  console.log('🔧 Initializing SQLite database...');
  console.log('===================================');
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Sync all models (create tables)
    console.log('📋 Creating database tables...');
    await sequelize.sync({ force: false }); // force: false means don't drop existing tables
    
    console.log('✅ Database tables created successfully');
    
    // List all tables created
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`📊 Created tables: ${tables.join(', ')}`);
    
  } catch (error) {
    console.error('💥 Database initialization failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('✅ Database connection closed');
  }
}

initializeDatabase()
  .then(() => {
    console.log('\n🎉 Database initialization completed!');
    console.log('💡 You can now run the password update script.');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Initialization failed:', err);
    process.exit(1);
  });
