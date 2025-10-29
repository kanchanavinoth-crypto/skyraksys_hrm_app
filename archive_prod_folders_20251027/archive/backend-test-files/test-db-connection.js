require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'skyraksys_hrm',
  username: process.env.DB_USER || 'hrm_admin',
  password: process.env.DB_PASSWORD || 'hrm_secure_2024',
  logging: console.log
});

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...');
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Port: ${process.env.DB_PORT || 5432}`);
    console.log(`Database: ${process.env.DB_NAME || 'skyraksys_hrm'}`);
    console.log(`User: ${process.env.DB_USER || 'hrm_admin'}`);
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful!');
    
    // Test if tables exist
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📊 Available tables:');
    results.forEach(row => console.log(`  - ${row.table_name}`));
    
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:');
    console.error('Error details:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 PostgreSQL server is not running or not accessible');
    } else if (error.code === '3D000') {
      console.error('💡 Database does not exist');
    } else if (error.code === '28P01') {
      console.error('💡 Authentication failed - check username/password');
    }
  } finally {
    await sequelize.close();
  }
}

testConnection();
