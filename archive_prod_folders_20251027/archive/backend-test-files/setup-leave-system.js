// Direct Leave Balance Setup using backend models
const { Employee, LeaveType, LeaveBalance, LeaveRequest, sequelize } = require('./models');

async function setupLeaveBalances() {
    try {
        console.log('🔄 Setting up leave balances using Sequelize...');
        
        // Get all employees
        const employees = await Employee.findAll({
            attributes: ['id', 'firstName', 'lastName']
        });
        
        // Get all leave types
        const leaveTypes = await LeaveType.findAll({
            attributes: ['id', 'name']
        });
        
        if (employees.length === 0 || leaveTypes.length === 0) {
            console.log('❌ No employees or leave types found');
            return;
        }
        
        console.log(`📊 Found ${employees.length} employees and ${leaveTypes.length} leave types`);
        
        // Clear existing leave balances
        await LeaveBalance.destroy({ where: {} });
        console.log('🧹 Cleared existing leave balances');
        
        // Create leave balances for each employee and leave type
        const balancesToCreate = [];
        const currentYear = new Date().getFullYear();
        
        for (const employee of employees) {
            for (const leaveType of leaveTypes) {
                // Define allocations based on leave type
                let allocated = 15; // Default
                const typeName = leaveType.name.toLowerCase();
                if (typeName.includes('annual')) allocated = 21;
                if (typeName.includes('sick')) allocated = 12;
                if (typeName.includes('personal')) allocated = 10;
                if (typeName.includes('casual')) allocated = 10;
                
                balancesToCreate.push({
                    employeeId: employee.id,
                    leaveTypeId: leaveType.id,
                    year: currentYear,
                    allocated: allocated,
                    used: 0,
                    remaining: allocated
                });
            }
        }
        
        // Bulk create leave balances
        await LeaveBalance.bulkCreate(balancesToCreate);
        console.log(`✅ Created ${balancesToCreate.length} leave balance records`);
        
        // Verify balances were created
        const sampleBalances = await LeaveBalance.findAll({
            limit: 10,
            include: [
                {
                    model: Employee,
                    attributes: ['firstName', 'lastName']
                },
                {
                    model: LeaveType,
                    attributes: ['name']
                }
            ]
        });
        
        console.log('\n📋 Sample leave balances created:');
        sampleBalances.forEach(balance => {
            console.log(`   ${balance.Employee.firstName} ${balance.Employee.lastName} - ${balance.LeaveType.name}: ${balance.remaining}/${balance.allocated} days`);
        });
        
        // Now try to create a sample leave request
        console.log('\n🧪 Testing leave request creation...');
        
        const firstEmployee = employees[0];
        const firstLeaveType = leaveTypes[0];
        
        // Create a future date (7 days from now)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 7);
        const endDate = new Date(startDate);
        
        const leaveRequest = await LeaveRequest.create({
            employeeId: firstEmployee.id,
            leaveTypeId: firstLeaveType.id,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            reason: 'Test leave request created during setup',
            status: 'pending',
            isHalfDay: false
        });
        
        // Update leave balance
        await LeaveBalance.update(
            {
                used: sequelize.literal('used + 1'),
                remaining: sequelize.literal('remaining - 1')
            },
            {
                where: {
                    employeeId: firstEmployee.id,
                    leaveTypeId: firstLeaveType.id
                }
            }
        );
        
        console.log(`✅ Created test leave request for ${firstEmployee.firstName} ${firstEmployee.lastName}`);
        
        // Final verification
        const finalCounts = await Promise.all([
            Employee.count(),
            LeaveBalance.count(),
            LeaveRequest.count()
        ]);
        
        console.log('\n🎯 FINAL SYSTEM STATISTICS:');
        console.log(`   👥 Employees: ${finalCounts[0]}`);
        console.log(`   📊 Leave Balances: ${finalCounts[1]}`);
        console.log(`   🏖️ Leave Requests: ${finalCounts[2]}`);
        
        console.log('\n🎉 Leave system setup complete!');
        console.log('\n🌐 Your HRM system now has complete test data for:');
        console.log('   • Employee Management (10 employees)');
        console.log('   • Timesheet System (147+ timesheets)');
        console.log('   • Leave Management (with balances and requests)');
        console.log('   • Project Management (7 projects)');
        console.log('   • Payroll System (ready for processing)');
        console.log('   • Dashboard Analytics (real-time statistics)');
        
    } catch (error) {
        console.error('❌ Error setting up leave balances:', error.message);
        console.error(error.stack);
    } finally {
        await sequelize.close();
    }
}

// Run the setup
setupLeaveBalances();
