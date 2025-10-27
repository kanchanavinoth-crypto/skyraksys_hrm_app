const { Sequelize } = require('sequelize');
const config = require('../config/config.json');

async function testConnection() {
  const dbConfig = config.development;
  
  console.log('🔍 Testing database connection...\n');
  console.log('Config:', {
    host: dbConfig.host,
    port: dbConfig.port || 5432,
    database: dbConfig.database,
    username: dbConfig.username
  });
  console.log('');

  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port || 5432,
      dialect: 'postgres',
      logging: console.log
    }
  );

  try {
    await sequelize.authenticate();
    console.log('');
    console.log('✅ PostgreSQL connection successful!');
    console.log('');
    console.log('Database info:');
    const [results] = await sequelize.query('SELECT version();');
    console.log('PostgreSQL version:', results[0].version);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.log('');
    console.log('❌ Connection failed!');
    console.log('');
    console.log('Error:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('1. Check if PostgreSQL is running:');
    console.log('   - Windows: services.msc → postgresql-x64-14');
    console.log('   - Or use pgAdmin');
    console.log('');
    console.log('2. Verify connection details in config/config.json:');
    console.log('   - host:', dbConfig.host);
    console.log('   - port:', dbConfig.port || 5432);
    console.log('   - database:', dbConfig.database);
    console.log('   - username:', dbConfig.username);
    console.log('');
    console.log('3. Check if database exists:');
    console.log('   psql -U postgres -c "\\l"');
    
    process.exit(1);
  }
}

testConnection();
