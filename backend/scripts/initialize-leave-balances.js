// Leave Balance Initialization Script
const { Employee, LeaveType, LeaveBalance, sequelize } = require('../models');

async function initializeLeaveBalances() {
    const transaction = await sequelize.transaction();
    
    try {
        console.log('🔄 Initializing leave balances for all employees...');
        
        // Get all active employees
        const employees = await Employee.findAll({
            where: { status: 'active' },
            attributes: ['id', 'firstName', 'lastName', 'employeeId']
        });
        
        // Get all leave types
        const leaveTypes = await LeaveType.findAll({
            attributes: ['id', 'name']
        });
        
        if (employees.length === 0) {
            console.log('❌ No active employees found');
            await transaction.rollback();
            return;
        }
        
        if (leaveTypes.length === 0) {
            console.log('❌ No leave types found');
            await transaction.rollback();
            return;
        }
        
        console.log(`📊 Found ${employees.length} active employees and ${leaveTypes.length} leave types`);
        
        const currentYear = new Date().getFullYear();
        
        // Define standard leave allocations (can be customized)
        const standardAllocations = {
            annual: 21,
            sick: 12,
            personal: 10,
            casual: 10,
            maternity: 90,
            paternity: 15,
            emergency: 5
        };
        
        const balancesToCreate = [];
        let existingCount = 0;
        
        for (const employee of employees) {
            for (const leaveType of leaveTypes) {
                // Check if balance already exists
                const existingBalance = await LeaveBalance.findOne({
                    where: {
                        employeeId: employee.id,
                        leaveTypeId: leaveType.id,
                        year: currentYear
                    },
                    transaction
                });
                
                if (existingBalance) {
                    existingCount++;
                    continue;
                }
                
                // Determine allocation based on leave type name
                let allocation = 15; // Default
                const typeName = leaveType.name.toLowerCase();
                
                for (const [key, value] of Object.entries(standardAllocations)) {
                    if (typeName.includes(key)) {
                        allocation = value;
                        break;
                    }
                }
                
                balancesToCreate.push({
                    employeeId: employee.id,
                    leaveTypeId: leaveType.id,
                    year: currentYear,
                    totalAccrued: allocation,
                    totalTaken: 0,
                    totalPending: 0,
                    balance: allocation,
                    carryForward: 0
                });
            }
        }
        
        if (balancesToCreate.length > 0) {
            await LeaveBalance.bulkCreate(balancesToCreate, { transaction });
            console.log(`✅ Created ${balancesToCreate.length} new leave balance records`);
        } else {
            console.log('ℹ️  No new leave balances to create');
        }
        
        if (existingCount > 0) {
            console.log(`ℹ️  Skipped ${existingCount} existing leave balance records`);
        }
        
        // Verify the results
        const totalBalances = await LeaveBalance.count({
            where: { year: currentYear },
            transaction
        });
        
        console.log(`📈 Total leave balances for ${currentYear}: ${totalBalances}`);
        
        // Show sample balances
        const sampleBalances = await LeaveBalance.findAll({
            where: { year: currentYear },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['firstName', 'lastName', 'employeeId']
                },
                {
                    model: LeaveType,
                    as: 'leaveType',
                    attributes: ['name']
                }
            ],
            limit: 10,
            transaction
        });
        
        console.log('\n📋 Sample leave balances created:');
        sampleBalances.forEach(balance => {
            console.log(`   ${balance.employee.firstName} ${balance.employee.lastName} (${balance.employee.employeeId}) - ${balance.leaveType.name}: ${balance.balance} days`);
        });
        
        await transaction.commit();
        
        console.log('\n🎉 Leave balance initialization completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Access the admin panel at /admin/leave-balances');
        console.log('   2. Review and adjust allocations as needed');
        console.log('   3. Employees can now submit leave requests');
        
        return {
            success: true,
            created: balancesToCreate.length,
            existing: existingCount,
            total: totalBalances
        };
        
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error initializing leave balances:', error.message);
        console.error(error.stack);
        throw error;
    }
}

// If this script is run directly
if (require.main === module) {
    initializeLeaveBalances()
        .then(result => {
            console.log('\n✅ Initialization result:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Initialization failed:', error.message);
            process.exit(1);
        });
}

module.exports = { initializeLeaveBalances };
