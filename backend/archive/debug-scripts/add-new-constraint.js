const { Client } = require('./backend/node_modules/pg');

async function addNewConstraint() {
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

        // Check column names in timesheets table
        console.log('\n📋 Checking timesheet table columns...');
        const columnsQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'timesheets'
            ORDER BY ordinal_position
        `;
        
        const columnsResult = await client.query(columnsQuery);
        console.log('Available columns:');
        columnsResult.rows.forEach(row => console.log(`  - ${row.column_name}`));

        // Add the correct constraint with proper column names
        console.log('\n🔄 Adding new constraint to prevent duplicate project+task per week...');
        try {
            await client.query(`
                ALTER TABLE timesheets 
                ADD CONSTRAINT unique_employee_project_task_week 
                UNIQUE ("employeeId", "projectId", "taskId", "weekStartDate", year)
            `);
            console.log('✅ Added new constraint: unique_employee_project_task_week');
        } catch (error) {
            console.log('❌ Error adding constraint:', error.message);
            
            // Try without quotes
            try {
                await client.query(`
                    ALTER TABLE timesheets 
                    ADD CONSTRAINT unique_employee_project_task_week 
                    UNIQUE (employeeId, projectId, taskId, weekStartDate, year)
                `);
                console.log('✅ Added new constraint (without quotes): unique_employee_project_task_week');
            } catch (error2) {
                console.log('❌ Still failed:', error2.message);
            }
        }

        // Verify the new constraint
        console.log('\n🔍 Verifying new constraints...');
        const constraintQuery = `
            SELECT constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_name = 'timesheets' 
            AND constraint_type = 'UNIQUE'
        `;
        
        const finalResult = await client.query(constraintQuery);
        console.log('Current unique constraints:', finalResult.rows);

        console.log('\n🎉 Database constraint configuration completed!');

    } catch (error) {
        console.error('💥 Error:', error);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

addNewConstraint();