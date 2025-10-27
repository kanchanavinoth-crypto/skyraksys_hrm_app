const { sequelize } = require('./config/database');

async function removeUniqueConstraint() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected');

        console.log('🔄 Removing unique constraint to allow multiple timesheets per week...');
        
        // Try different constraint names that might exist
        const constraintNames = [
            'unique_employee_week_timesheet',
            'unique_employee_week', 
            'timesheets_employeeId_weekStartDate_year_key'
        ];
        
        for (const constraintName of constraintNames) {
            try {
                await sequelize.getQueryInterface().removeConstraint('timesheets', constraintName);
                console.log(`✅ Removed constraint: ${constraintName}`);
            } catch (error) {
                console.log(`ℹ️  Constraint not found: ${constraintName} (${error.message})`);
            }
        }
        
        // Also try to drop using SQL directly
        try {
            await sequelize.query('SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = \'timesheets\' AND constraint_type = \'UNIQUE\'');
            const [results] = await sequelize.query('SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = \'timesheets\' AND constraint_type = \'UNIQUE\'');
            
            console.log('📋 Found unique constraints:', results.map(r => r.constraint_name));
            
            for (const result of results) {
                const constraintName = result.constraint_name;
                if (constraintName.includes('employee') || constraintName.includes('week')) {
                    try {
                        await sequelize.query(`ALTER TABLE timesheets DROP CONSTRAINT ${constraintName}`);
                        console.log(`✅ Dropped constraint: ${constraintName}`);
                    } catch (error) {
                        console.log(`❌ Failed to drop ${constraintName}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.log('❌ Error querying constraints:', error.message);
        }
        
        console.log('✅ Constraint removal process completed');
        
    } catch (error) {
        console.error('💥 Failed to remove unique constraint:', error.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

removeUniqueConstraint();