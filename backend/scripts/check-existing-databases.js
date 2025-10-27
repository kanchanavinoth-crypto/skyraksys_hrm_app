const { Client } = require('pg');
const config = require('../config/config.json');

async function checkDatabases() {
  const dbConfig = config.development;
  
  // Connect to postgres default database first
  const client = new Client({
    host: dbConfig.host || 'localhost',
    port: dbConfig.port || 5432,
    user: dbConfig.username || 'postgres',
    password: dbConfig.password,
    database: 'postgres' // Connect to default postgres DB first
  });

  try {
    console.log('🔍 Checking PostgreSQL databases...\n');
    console.log('Connection info:');
    console.log(`  Host: ${dbConfig.host || 'localhost'}`);
    console.log(`  Port: ${dbConfig.port || 5432}`);
    console.log(`  User: ${dbConfig.username || 'postgres'}`);
    console.log('');

    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // List all databases
    const result = await client.query(`
      SELECT 
        datname as database_name,
        pg_size_pretty(pg_database_size(datname)) as size,
        datallowconn as allow_connections,
        datistemplate as is_template
      FROM pg_database
      WHERE datistemplate = false
      ORDER BY datname;
    `);

    console.log('📊 Existing databases:\n');
    console.log('─'.repeat(80));
    console.log('Database Name'.padEnd(30) + 'Size'.padEnd(15) + 'Connections'.padEnd(20) + 'Template');
    console.log('─'.repeat(80));

    result.rows.forEach(db => {
      console.log(
        db.database_name.padEnd(30) +
        db.size.padEnd(15) +
        (db.allow_connections ? '✓ Allowed' : '✗ Not allowed').padEnd(20) +
        (db.is_template ? 'Yes' : 'No')
      );
    });

    console.log('─'.repeat(80));
    console.log(`\nTotal: ${result.rows.length} databases found\n`);

    // Check if our HRM database exists
    const hrmDatabases = result.rows.filter(db => 
      db.database_name.includes('skyraksys') || 
      db.database_name.includes('hrm')
    );

    if (hrmDatabases.length > 0) {
      console.log('🎯 Found HRM-related databases:');
      hrmDatabases.forEach(db => {
        console.log(`   ✓ ${db.database_name} (${db.size})`);
      });
    } else {
      console.log('⚠️  No HRM-related databases found');
    }

    console.log('');

    // Check the configured database
    console.log('📋 Configuration check:');
    console.log(`   config.json specifies: ${dbConfig.database}`);
    
    const configDbExists = result.rows.some(db => db.database_name === dbConfig.database);
    if (configDbExists) {
      console.log(`   ✅ Database "${dbConfig.database}" EXISTS`);
      
      // Get table count
      await client.end();
      const dbClient = new Client({
        host: dbConfig.host || 'localhost',
        port: dbConfig.port || 5432,
        user: dbConfig.username || 'postgres',
        password: dbConfig.password,
        database: dbConfig.database
      });
      
      await dbClient.connect();
      const tableResult = await dbClient.query(`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
      `);
      
      console.log(`   📊 Contains ${tableResult.rows[0].table_count} tables`);
      
      await dbClient.end();
    } else {
      console.log(`   ❌ Database "${dbConfig.database}" DOES NOT EXIST`);
      console.log('');
      console.log('💡 Suggestions:');
      console.log(`   1. Create it: CREATE DATABASE ${dbConfig.database};`);
      console.log(`   2. Or update config.json to use an existing database`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 PostgreSQL is not running. Start it with:');
      console.log('   net start postgresql-x64-14');
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Check:');
      console.log('   - Username in config/config.json');
      console.log('   - Password in config/config.json');
    }
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

checkDatabases();
