// Direct Leave Balance Setup
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    user: 'hrm_user',
    host: 'localhost',
    database: 'skyraksys_hrm',
    password: 'hrm_password',
    port: 5432,
});

async function setupLeaveBalances() {
    const client = await pool.connect();
    try {
        console.log('🔄 Setting up leave balances directly...');
        
        // Get all employees
        const employeesResult = await client.query('SELECT id, "firstName", "lastName" FROM "Employees"');
        const employees = employeesResult.rows;
        
        // Get all leave types
        const leaveTypesResult = await client.query('SELECT id, name FROM "LeaveTypes"');
        const leaveTypes = leaveTypesResult.rows;
        
        if (employees.length === 0 || leaveTypes.length === 0) {
            console.log('❌ No employees or leave types found');
            return;
        }
        
        console.log(`📊 Found ${employees.length} employees and ${leaveTypes.length} leave types`);
        
        // Clear existing leave balances
        await client.query('DELETE FROM "LeaveBalances"');
        console.log('🧹 Cleared existing leave balances');
        
        // Create leave balances for each employee and leave type
        let balanceCount = 0;
        for (const employee of employees) {
            for (const leaveType of leaveTypes) {
                // Define allocations based on leave type
                let allocated = 15; // Default
                if (leaveType.name.toLowerCase().includes('annual')) allocated = 21;
                if (leaveType.name.toLowerCase().includes('sick')) allocated = 12;
                if (leaveType.name.toLowerCase().includes('personal')) allocated = 10;
                if (leaveType.name.toLowerCase().includes('casual')) allocated = 10;
                
                const currentYear = new Date().getFullYear();
                const balanceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                const insertQuery = `
                    INSERT INTO "LeaveBalances" (
                        id, "employeeId", "leaveTypeId", year, 
                        allocated, used, remaining, "createdAt", "updatedAt"
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                `;
                
                await client.query(insertQuery, [
                    balanceId,
                    employee.id,
                    leaveType.id,
                    currentYear,
                    allocated,
                    0, // used
                    allocated // remaining
                ]);
                
                balanceCount++;
            }
        }
        
        console.log(`✅ Created ${balanceCount} leave balance records`);
        
        // Verify balances were created
        const verifyResult = await client.query(`
            SELECT 
                e."firstName", e."lastName",
                lt.name as leave_type,
                lb.allocated, lb.used, lb.remaining
            FROM "LeaveBalances" lb
            JOIN "Employees" e ON lb."employeeId" = e.id
            JOIN "LeaveTypes" lt ON lb."leaveTypeId" = lt.id
            ORDER BY e."firstName", lt.name
            LIMIT 10
        `);
        
        console.log('\n📋 Sample leave balances created:');
        verifyResult.rows.forEach(row => {
            console.log(`   ${row.firstName} ${row.lastName} - ${row.leave_type}: ${row.remaining}/${row.allocated} days`);
        });
        
        // Now try to create a sample leave request
        console.log('\n🧪 Testing leave request creation...');
        
        const firstEmployee = employees[0];
        const firstLeaveType = leaveTypes[0];
        
        // Create a future date (7 days from now)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 7);
        const endDate = new Date(startDate);
        
        const leaveRequestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const leaveInsertQuery = `
            INSERT INTO "LeaveRequests" (
                id, "employeeId", "leaveTypeId", "startDate", "endDate",
                reason, status, "isHalfDay", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `;
        
        await client.query(leaveInsertQuery, [
            leaveRequestId,
            firstEmployee.id,
            firstLeaveType.id,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            'Test leave request created during setup',
            'pending',
            false
        ]);
        
        // Update leave balance
        await client.query(`
            UPDATE "LeaveBalances" 
            SET used = used + 1, remaining = remaining - 1, "updatedAt" = NOW()
            WHERE "employeeId" = $1 AND "leaveTypeId" = $2
        `, [firstEmployee.id, firstLeaveType.id]);
        
        console.log(`✅ Created test leave request for ${firstEmployee.firstName} ${firstEmployee.lastName}`);
        
        // Final verification
        const finalStatsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM "Employees") as employee_count,
                (SELECT COUNT(*) FROM "LeaveBalances") as balance_count,
                (SELECT COUNT(*) FROM "LeaveRequests") as request_count,
                (SELECT COUNT(*) FROM "Timesheets") as timesheet_count
        `;
        
        const finalStats = await client.query(finalStatsQuery);
        const stats = finalStats.rows[0];
        
        console.log('\n🎯 FINAL SYSTEM STATISTICS:');
        console.log(`   👥 Employees: ${stats.employee_count}`);
        console.log(`   📊 Leave Balances: ${stats.balance_count}`);
        console.log(`   🏖️ Leave Requests: ${stats.request_count}`);
        console.log(`   ⏰ Timesheets: ${stats.timesheet_count}`);
        
        console.log('\n🎉 Leave system setup complete!');
        
    } catch (error) {
        console.error('❌ Error setting up leave balances:', error.message);
    } finally {
        client.release();
        pool.end();
    }
}

// Run the setup
setupLeaveBalances();
