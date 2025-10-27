const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up LOCAL Development Environment\n');

// 1. Check environment
console.log('1️⃣ Checking environment...');
process.env.NODE_ENV = 'development';
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log('');

// 2. Check config file
console.log('2️⃣ Checking config/config.json...');
const configPath = path.join(__dirname, '..', 'config', 'config.json');
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('   Development config:');
  console.log(`   - Database: ${config.development.database}`);
  console.log(`   - Host: ${config.development.host}`);
  console.log(`   - Port: ${config.development.port}`);
  console.log(`   - Username: ${config.development.username}`);
  
  if (config.development.host !== 'localhost' && config.development.host !== '127.0.0.1') {
    console.log('   ⚠️  WARNING: Host is not localhost!');
    console.log('   You may be connecting to a remote database.');
  }
} else {
  console.log('   ❌ config.json not found!');
  process.exit(1);
}
console.log('');

// 3. Test PostgreSQL connection
console.log('3️⃣ Testing PostgreSQL connection...');
try {
  execSync('psql -U postgres -c "SELECT version();"', { 
    stdio: 'inherit',
    env: { ...process.env, PGPASSWORD: 'your_password' }
  });
  console.log('   ✅ PostgreSQL connection successful');
} catch (error) {
  console.log('   ❌ Cannot connect to PostgreSQL');
  console.log('   Make sure PostgreSQL is running on localhost:5432');
  process.exit(1);
}
console.log('');

// 4. Create database if not exists
console.log('4️⃣ Creating development database...');
try {
  execSync('psql -U postgres -c "CREATE DATABASE skyraksys_hrm_dev;"', {
    stdio: 'inherit',
    env: { ...process.env, PGPASSWORD: 'your_password' }
  });
  console.log('   ✅ Database created');
} catch (error) {
  if (error.message.includes('already exists')) {
    console.log('   ℹ️  Database already exists');
  } else {
    console.log('   ❌ Failed to create database');
  }
}
console.log('');

// 5. Run migrations
console.log('5️⃣ Running database migrations...');
try {
  execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
  console.log('   ✅ Migrations completed');
} catch (error) {
  console.log('   ❌ Migration failed');
  process.exit(1);
}
console.log('');

// 6. Run seeders (optional)
console.log('6️⃣ Running seeders (optional)...');
try {
  execSync('npx sequelize-cli db:seed:all', { stdio: 'inherit' });
  console.log('   ✅ Seeders completed');
} catch (error) {
  console.log('   ℹ️  No seeders or seeding failed (optional)');
}
console.log('');

console.log('========================================');
console.log('✅ Local Development Setup Complete!');
console.log('========================================');
console.log('');
console.log('🎯 Next steps:');
console.log('1. Start backend: node server.js');
console.log('2. Start frontend: cd ../frontend && npm start');
console.log('3. Access: http://localhost:3000');
console.log('');
