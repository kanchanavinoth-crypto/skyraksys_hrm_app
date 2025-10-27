const config = require('../config/config.json');

console.log('📋 Current Database Configuration:\n');
console.log('Development Environment:');
console.log('─'.repeat(50));
console.log(`  Database: ${config.development.database}`);
console.log(`  Host:     ${config.development.host}`);
console.log(`  Port:     ${config.development.port}`);
console.log(`  Username: ${config.development.username}`);
console.log(`  Dialect:  ${config.development.dialect}`);
console.log('─'.repeat(50));
console.log('');
console.log('Run check: node scripts/check-existing-databases.js');
