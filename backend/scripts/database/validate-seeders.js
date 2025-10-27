const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const SEEDERS_DIR = path.join(__dirname, '../../seeders');

async function validateSeeders() {
    // Check seeders directory exists
    if (!fs.existsSync(SEEDERS_DIR)) {
        console.error('❌ Seeders directory not found');
        process.exit(1);
    }

    const seeders = fs.readdirSync(SEEDERS_DIR)
        .filter(file => file.endsWith('.js'))
        .map(file => ({
            name: file,
            path: path.join(SEEDERS_DIR, file),
            content: require(path.join(SEEDERS_DIR, file))
        }));

    console.log(`Found ${seeders.length} seeders`);

    // Validate each seeder
    let hasErrors = false;
    for (const seeder of seeders) {
        console.log(`\nValidating ${seeder.name}...`);
        
        // Check for up/down methods
        if (!seeder.content.up || typeof seeder.content.up !== 'function') {
            console.error('❌ Missing or invalid up() method');
            hasErrors = true;
        }

        if (!seeder.content.down || typeof seeder.content.down !== 'function') {
            console.error('❌ Missing or invalid down() method');
            hasErrors = true;
        }

        // Check for seed type handling
        const content = fs.readFileSync(seeder.path, 'utf8');
        if (!content.includes('SEED_TYPE') && !content.includes('NODE_ENV')) {
            console.warn('⚠️  Seeder does not handle different seed types (minimal/full/test)');
        }

        // Validate data structure
        try {
            const { up } = seeder.content;
            const mockQueryInterface = {
                bulkInsert: (table, data) => {
                    // Validate data structure
                    if (!Array.isArray(data)) {
                        throw new Error('Data must be an array');
                    }
                    
                    // Check each record has required fields
                    data.forEach((record, index) => {
                        if (!record.createdAt || !record.updatedAt) {
                            throw new Error(`Record ${index} missing timestamps`);
                        }
                    });
                    
                    return Promise.resolve();
                }
            };

            await up(mockQueryInterface, Sequelize);
            console.log('✅ Data structure validation passed');
        } catch (error) {
            console.error('❌ Data structure validation failed:', error.message);
            hasErrors = true;
        }
    }

    if (hasErrors) {
        console.error('\n❌ Seeder validation failed');
        process.exit(1);
    } else {
        console.log('\n✅ All seeders validated successfully');
    }
}

// Run validation if this script is executed directly
if (require.main === module) {
    validateSeeders().catch(error => {
        console.error('Validation error:', error);
        process.exit(1);
    });
}

module.exports = { validateSeeders };