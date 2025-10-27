const { Sequelize } = require('sequelize');
require('dotenv').config();

const {
    DB_HOST = 'localhost',
    DB_PORT = 5432,
    DB_NAME,
    DB_USER,
    DB_PASSWORD
} = process.env;

async function testConnection() {
    const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'postgres',
        logging: false
    });

    try {
        await sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test query execution
        const [results] = await sequelize.query('SELECT version();');
        console.log('\nDatabase Info:');
        console.log('-------------');
        console.log('Version:', results[0].version);
        console.log(`Host: ${DB_HOST}:${DB_PORT}`);
        console.log(`Database: ${DB_NAME}`);
        console.log(`User: ${DB_USER}`);
        
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        if (error.original) {
            console.error('\nDetailed error:');
            console.error('---------------');
            console.error('Code:', error.original.code);
            console.error('Detail:', error.original.detail);
            console.error('Hint:', error.original.hint || 'No hint available');
        }
        return false;
    } finally {
        await sequelize.close();
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testConnection()
        .then(success => process.exit(success ? 0 : 1));
}

module.exports = { testConnection };