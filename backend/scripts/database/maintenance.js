const { Sequelize } = require('sequelize');
const { execSync } = require('child_process');
require('dotenv').config();

const {
    DB_HOST = 'localhost',
    DB_PORT = 5432,
    DB_NAME,
    DB_USER,
    DB_PASSWORD
} = process.env;

async function performMaintenance() {
    const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'postgres',
        logging: false
    });

    try {
        console.log('🔧 Starting database maintenance...\n');

        // 1. Analyze tables
        console.log('Analyzing tables...');
        await sequelize.query('ANALYZE VERBOSE');
        console.log('✅ Tables analyzed\n');

        // 2. Vacuum analyze (requires superuser)
        try {
            console.log('Performing VACUUM ANALYZE...');
            await sequelize.query('VACUUM ANALYZE');
            console.log('✅ Vacuum analyze completed\n');
        } catch (error) {
            console.warn('⚠️  Skipping VACUUM ANALYZE (requires superuser privileges)\n');
        }

        // 3. Check for bloated tables
        console.log('Checking for bloated tables...');
        const [bloatedTables] = await sequelize.query(`
            SELECT schemaname, tablename, n_dead_tup, n_live_tup,
                round(n_dead_tup * 100.0 / nullif(n_live_tup, 0), 2) as dead_percentage
            FROM pg_stat_user_tables
            WHERE n_dead_tup > 1000
            ORDER BY n_dead_tup DESC;
        `);

        if (bloatedTables.length > 0) {
            console.log('\nBloated tables found:');
            bloatedTables.forEach(table => {
                console.log(`- ${table.tablename}: ${table.dead_percentage}% dead tuples`);
            });
        } else {
            console.log('✅ No significant table bloat found\n');
        }

        // 4. Check for missing indexes
        console.log('Checking for missing indexes...');
        const [missingIndexes] = await sequelize.query(`
            SELECT schemaname, tablename, seq_scan, seq_tup_read
            FROM pg_stat_user_tables
            WHERE seq_scan > 1000 AND seq_tup_read / seq_scan > 100
            ORDER BY seq_tup_read DESC;
        `);

        if (missingIndexes.length > 0) {
            console.log('\nPotential missing indexes:');
            missingIndexes.forEach(table => {
                console.log(`- ${table.tablename}: ${table.seq_scan} sequential scans`);
            });
        } else {
            console.log('✅ No missing indexes detected\n');
        }

        // 5. Check for unused indexes
        console.log('Checking for unused indexes...');
        const [unusedIndexes] = await sequelize.query(`
            SELECT schemaname, tablename, indexrelname, idx_scan
            FROM pg_stat_user_indexes
            WHERE idx_scan = 0 AND indexrelname NOT LIKE 'pg_%'
            ORDER BY tablename, indexrelname;
        `);

        if (unusedIndexes.length > 0) {
            console.log('\nUnused indexes found:');
            unusedIndexes.forEach(index => {
                console.log(`- ${index.tablename}.${index.indexrelname}`);
            });
        } else {
            console.log('✅ No unused indexes found\n');
        }

        // 6. Database size information
        console.log('Database size information:');
        const [dbSize] = await sequelize.query(`
            SELECT pg_size_pretty(pg_database_size('${DB_NAME}')) as size;
        `);
        console.log(`Total database size: ${dbSize[0].size}\n`);

        console.log('🎉 Maintenance completed successfully!');
        
    } catch (error) {
        console.error('❌ Maintenance failed:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run maintenance if this script is executed directly
if (require.main === module) {
    performMaintenance().catch(console.error);
}

module.exports = { performMaintenance };