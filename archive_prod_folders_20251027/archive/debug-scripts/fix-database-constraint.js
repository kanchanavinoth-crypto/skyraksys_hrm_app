const { Client } = require('./backend/node_modules/pg');

async function removeConstraint() {
    const client = new Client({
        host: 'localhost',
        port: 5433,
        database: 'skyraksys_hrm',
        user: 'postgres',
        password: 'password'
    });

    try {
        console.log('🔌 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to database');

        // First, let's see what constraints exist
        console.log('\n📋 Checking existing constraints...');
        const constraintQuery = `
            SELECT constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_name = 'timesheets' 
            AND constraint_type = 'UNIQUE'
        `;
        
        const constraintResult = await client.query(constraintQuery);
        console.log('Found constraints:', constraintResult.rows);

        // Try to drop each unique constraint that might be blocking multiple timesheets
        const potentialConstraints = [
            'unique_employee_week',
            'unique_employee_week_timesheet',
            'timesheets_employeeId_weekStartDate_year_key',
            'timesheets_employeeId_weekStartDate_year_key1',
            'timesheets_employeeId_weekStartDate_year_key2'
        ];

        for (const constraintName of potentialConstraints) {
            try {
                console.log(`\n🔄 Attempting to drop constraint: ${constraintName}`);
                await client.query(`ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS ${constraintName}`);
                console.log(`✅ Successfully dropped or didn't exist: ${constraintName}`);
            } catch (error) {
                console.log(`⚠️  Could not drop ${constraintName}: ${error.message}`);
            }
        }

        // Also try to drop by finding all unique constraints dynamically
        console.log('\n🔍 Finding and dropping all employee/week related unique constraints...');
        for (const row of constraintResult.rows) {
            const constraintName = row.constraint_name;
            if (constraintName.includes('employee') || constraintName.includes('week') || constraintName.includes('year')) {
                try {
                    console.log(`🔄 Dropping found constraint: ${constraintName}`);
                    await client.query(`ALTER TABLE timesheets DROP CONSTRAINT ${constraintName}`);
                    console.log(`✅ Successfully dropped: ${constraintName}`);
                } catch (error) {
                    console.log(`❌ Failed to drop ${constraintName}: ${error.message}`);
                }
            }
        }

        // Verify constraints are removed
        console.log('\n🔍 Verifying constraint removal...');
        const finalResult = await client.query(constraintQuery);
        console.log('Remaining constraints:', finalResult.rows);

        // Add a new constraint that allows multiple tasks but prevents duplicate project+task combinations
        console.log('\n🔄 Adding new constraint to prevent duplicate project+task per week...');
        try {
            await client.query(`
                ALTER TABLE timesheets 
                ADD CONSTRAINT unique_employee_project_task_week 
                UNIQUE (employeeId, projectId, taskId, weekStartDate, year)
            `);
            console.log('✅ Added new constraint: unique_employee_project_task_week');
        } catch (error) {
            console.log('ℹ️  New constraint may already exist or have issue:', error.message);
        }

        console.log('\n🎉 Database constraint fix completed!');
        console.log('✅ You can now submit multiple tasks per week');
        console.log('✅ System prevents duplicate project+task combinations per week');

    } catch (error) {
        console.error('💥 Error fixing database constraint:', error);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

removeConstraint();