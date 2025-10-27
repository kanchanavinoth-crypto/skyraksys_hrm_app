const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use the same database configuration as the server
const sequelize = new Sequelize(
  process.env.DB_NAME || 'skyraksys_hrm',
  process.env.DB_USER || 'postgres', 
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    dialect: 'postgres',
    logging: console.log
  }
);

async function resetDatabase() {
  console.log('🔄 RESETTING DATABASE - CLEARING ALL DATA\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Drop all tables
    console.log('\n🗑️  Dropping all tables...');
    await sequelize.drop();
    console.log('✅ All tables dropped successfully');

    console.log('\n✅ Database reset complete!');
    console.log('\n📝 Next step: Start the backend server to recreate tables and seed data');
    console.log('   Command: npm start or node server.js');

  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

resetDatabase();