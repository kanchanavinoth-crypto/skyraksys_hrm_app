const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 SkyrakSys HRM - PostgreSQL Database Migration');
console.log('===============================================');

async function runMigration() {
    try {
        // Set environment to use PostgreSQL
        process.env.NODE_ENV = 'development';
        process.env.DB_DIALECT = 'postgres';
        
        console.log('🔄 Running database migrations...');
        
        // Run Sequelize migrations
        execSync('npx sequelize-cli db:migrate', {
            cwd: path.join(__dirname, 'backend'),
            stdio: 'inherit'
        });
        
        console.log('✅ Database migrations completed successfully!');
        console.log('');
        
        // Optional: Run seeders
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('🌱 Run database seeders to create initial data? (y/N): ', (answer) => {
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                try {
                    console.log('🌱 Running database seeders...');
                    execSync('npx sequelize-cli db:seed:all', {
                        cwd: path.join(__dirname, 'backend'),
                        stdio: 'inherit'
                    });
                    console.log('✅ Database seeders completed successfully!');
                } catch (error) {
                    console.error('❌ Error running seeders:', error.message);
                }
            }
            
            console.log('');
            console.log('🎉 PostgreSQL database setup complete!');
            console.log('📊 Your HRM system is now using PostgreSQL');
            console.log('🚀 Ready for production deployment!');
            
            rl.close();
        });
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('1. Ensure PostgreSQL Docker container is running');
        console.log('2. Check database connection settings in .env');
        console.log('3. Verify database migrations exist in backend/migrations/');
        process.exit(1);
    }
}

runMigration();
