const { Sequelize } = require('sequelize');
require('dotenv').config();

const {
    DB_HOST = 'localhost',
    DB_PORT = 5432,
    DB_NAME,
    DB_USER,
    DB_PASSWORD
} = process.env;

async function optimizeDatabase() {
    const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'postgres',
        logging: false
    });

    try {
        console.log('🚀 Starting database optimization...\n');

        // 1. Create missing indexes based on query patterns
        console.log('Analyzing query patterns for index opportunities...');
        const [slowQueries] = await sequelize.query(`
            SELECT schemaname, tablename, seq_scan, seq_tup_read,
                   idx_scan, n_live_tup
            FROM pg_stat_user_tables
            WHERE seq_scan > idx_scan
            AND n_live_tup > 10000
            ORDER BY seq_tup_read DESC
            LIMIT 5;
        `);

        for (const table of slowQueries) {
            console.log(`\nAnalyzing table: ${table.tablename}`);
            
            // Check common columns that might need indexing
            const [columns] = await sequelize.query(`
                SELECT a.attname, t.typname, a.attnum
                FROM pg_class c
                JOIN pg_attribute a ON a.attrelid = c.oid
                JOIN pg_type t ON t.oid = a.atttypid
                WHERE c.relname = '${table.tablename}'
                AND a.attnum > 0
                AND NOT a.attisdropped
                ORDER BY a.attnum;
            `);

            // Suggest indexes for commonly queried columns
            for (const column of columns) {
                if (['timestamp', 'date', 'int', 'varchar'].includes(column.typname)) {
                    console.log(`- Considering index on ${column.attname}`);
                    
                    // Check if index already exists
                    const [existingIndex] = await sequelize.query(`
                        SELECT indexname FROM pg_indexes
                        WHERE tablename = '${table.tablename}'
                        AND indexdef LIKE '%${column.attname}%';
                    `);

                    if (existingIndex.length === 0) {
                        try {
                            await sequelize.query(`
                                CREATE INDEX IF NOT EXISTS 
                                idx_${table.tablename}_${column.attname}
                                ON ${table.tablename} (${column.attname});
                            `);
                            console.log(`  ✅ Created index on ${column.attname}`);
                        } catch (error) {
                            console.warn(`  ⚠️  Could not create index: ${error.message}`);
                        }
                    } else {
                        console.log(`  ℹ️  Index already exists on ${column.attname}`);
                    }
                }
            }
        }

        // 2. Update table statistics
        console.log('\nUpdating table statistics...');
        await sequelize.query('ANALYZE VERBOSE');

        // 3. Optimize table storage
        console.log('\nOptimizing table storage...');
        const [tables] = await sequelize.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public';
        `);

        for (const table of tables) {
            try {
                await sequelize.query(`VACUUM FULL ANALYZE ${table.tablename};`);
                console.log(`✅ Optimized ${table.tablename}`);
            } catch (error) {
                console.warn(`⚠️  Could not optimize ${table.tablename}: ${error.message}`);
            }
        }

        // 4. Drop unused indexes
        console.log('\nChecking for unused indexes...');
        const [unusedIndexes] = await sequelize.query(`
            SELECT schemaname, tablename, indexrelname, idx_scan
            FROM pg_stat_user_indexes
            WHERE idx_scan = 0 
            AND indexrelname NOT LIKE 'pg_%'
            AND indexrelname NOT LIKE '%_pkey'
            ORDER BY tablename, indexrelname;
        `);

        if (unusedIndexes.length > 0) {
            console.log('\nRemoving unused indexes:');
            for (const index of unusedIndexes) {
                try {
                    await sequelize.query(`DROP INDEX IF EXISTS ${index.indexrelname};`);
                    console.log(`✅ Dropped unused index: ${index.indexrelname}`);
                } catch (error) {
                    console.warn(`⚠️  Could not drop index ${index.indexrelname}: ${error.message}`);
                }
            }
        } else {
            console.log('✅ No unused indexes to remove');
        }

        // 5. Update sequence values
        console.log('\nUpdating sequence values...');
        const [sequences] = await sequelize.query(`
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_schema = 'public';
        `);

        for (const seq of sequences) {
            try {
                await sequelize.query(`SELECT setval('${seq.sequence_name}', max(id)) FROM ${seq.sequence_name.replace('_id_seq', '')};`);
                console.log(`✅ Updated sequence: ${seq.sequence_name}`);
            } catch (error) {
                console.warn(`⚠️  Could not update sequence ${seq.sequence_name}: ${error.message}`);
            }
        }

        // 6. Final optimization report
        console.log('\n📊 Optimization Report');
        console.log('-------------------');
        
        const [dbStats] = await sequelize.query(`
            SELECT pg_size_pretty(pg_database_size('${DB_NAME}')) as db_size,
                   pg_size_pretty(pg_total_relation_size('public.users')) as users_size,
                   pg_size_pretty(pg_total_relation_size('public.employees')) as employees_size;
        `);
        
        console.log(`Database Size: ${dbStats[0].db_size}`);
        console.log(`Users Table Size: ${dbStats[0].users_size}`);
        console.log(`Employees Table Size: ${dbStats[0].employees_size}`);

        console.log('\n🎉 Database optimization completed successfully!');
        
    } catch (error) {
        console.error('❌ Optimization failed:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run optimization if this script is executed directly
if (require.main === module) {
    optimizeDatabase().catch(console.error);
}

module.exports = { optimizeDatabase };