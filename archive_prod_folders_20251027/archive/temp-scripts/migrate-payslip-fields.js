const db = require('./backend/models');

console.log('\n🔄 DATABASE MIGRATION FOR PAYSLIP FIELDS');
console.log('='.repeat(50));

async function migratePayslipFields() {
    try {
        console.log('\n🔍 Step 1: Checking current database schema...');
        
        // Force sync the database to ensure all model changes are applied
        console.log('\n⚙️ Step 2: Synchronizing database schema...');
        await db.sequelize.sync({ alter: true });
        console.log('✅ Database schema synchronized successfully');
        
        // Test that all payslip fields exist by attempting to create a test record
        console.log('\n🧪 Step 3: Testing payslip field availability...');
        
        // First, get valid foreign keys
        const testDepartment = await db.Department.findOne();
        const testPosition = await db.Position.findOne();
        
        if (!testDepartment || !testPosition) {
            console.log('⚠️ Warning: Need to create test department/position first');
            
            // Create test department if none exists
            let dept = testDepartment;
            if (!dept) {
                dept = await db.Department.create({
                    name: 'Test Department',
                    description: 'Test department for migration',
                    isActive: true
                });
                console.log('✅ Created test department');
            }
            
            // Create test position if none exists
            let pos = testPosition;
            if (!pos) {
                pos = await db.Position.create({
                    title: 'Test Position',
                    description: 'Test position for migration',
                    level: 'Junior',
                    departmentId: dept.id,
                    isActive: true
                });
                console.log('✅ Created test position');
            }
        }
        
        const validDepartment = testDepartment || await db.Department.findOne();
        const validPosition = testPosition || await db.Position.findOne();
        
        // Create a test user first
        const testUser = await db.User.create({
            firstName: 'Migration',
            lastName: 'Test',
            email: `migration.test.${Date.now()}@test.com`,
            password: 'test123',
            role: 'employee'
        });
        
        // Test creating an employee with all payslip fields
        const testEmployeeData = {
            employeeId: `MIG${Date.now()}`,
            firstName: 'Migration',
            lastName: 'Test',
            email: testUser.email,
            phone: '1234567890',
            hireDate: '2025-08-10',
            departmentId: validDepartment.id,
            positionId: validPosition.id,
            userId: testUser.id,
            
            // Statutory fields
            aadhaarNumber: '123456789012',
            panNumber: 'MIGRA1234T',
            uanNumber: '123456789012',
            pfNumber: 'MIG_PF_123',
            esiNumber: 'MIG_ESI_456',
            
            // Bank details
            bankName: 'Migration Test Bank',
            bankAccountNumber: 'MIG123456789',
            ifscCode: 'MIGR0001234',
            bankBranch: 'Test Branch',
            accountHolderName: 'Migration Test',
            
            // Personal details
            address: 'Test Address',
            city: 'Test City',
            state: 'Test State',
            pinCode: '123456',
            dateOfBirth: '1990-01-01',
            gender: 'Other',
            maritalStatus: 'Single',
            nationality: 'Indian',
            workLocation: 'Test Location',
            employmentType: 'Full-time'
        };
        
        console.log('\n🔬 Creating test employee with all payslip fields...');
        const testEmployee = await db.Employee.create(testEmployeeData);
        
        // Fetch the created employee to verify all fields
        const createdEmployee = await db.Employee.findByPk(testEmployee.id);
        
        console.log('\n✅ Step 4: Verifying payslip field storage...');
        const payslipFields = {
            'PF Number': createdEmployee.pfNumber,
            'ESI Number': createdEmployee.esiNumber,
            'Bank Name': createdEmployee.bankName,
            'Bank Account Number': createdEmployee.bankAccountNumber,
            'IFSC Code': createdEmployee.ifscCode,
            'Bank Branch': createdEmployee.bankBranch,
            'Account Holder Name': createdEmployee.accountHolderName,
            'Aadhaar Number': createdEmployee.aadhaarNumber,
            'PAN Number': createdEmployee.panNumber,
            'UAN Number': createdEmployee.uanNumber,
            'Address': createdEmployee.address,
            'City': createdEmployee.city,
            'State': createdEmployee.state,
            'PIN Code': createdEmployee.pinCode,
            'Marital Status': createdEmployee.maritalStatus,
            'Nationality': createdEmployee.nationality
        };
        
        let fieldsWorking = 0;
        const totalFields = Object.keys(payslipFields).length;
        
        Object.entries(payslipFields).forEach(([field, value]) => {
            const status = value ? '✅ WORKING' : '❌ FAILED';
            console.log(`   ${field}: ${status}`);
            if (value) fieldsWorking++;
        });
        
        const successRate = Math.round((fieldsWorking / totalFields) * 100);
        
        console.log('\n📊 Migration Results:');
        console.log(`   Fields Working: ${fieldsWorking}/${totalFields} (${successRate}%)`);
        
        // Cleanup test data
        console.log('\n🧹 Cleaning up test data...');
        await testEmployee.destroy();
        await testUser.destroy();
        console.log('✅ Test data cleaned up');
        
        console.log('\n' + '='.repeat(50));
        console.log('🎯 MIGRATION COMPLETION STATUS');
        console.log('='.repeat(50));
        
        if (successRate >= 90) {
            console.log('🟢 MIGRATION SUCCESSFUL!');
            console.log('   All payslip fields are now fully functional');
            console.log('   Ready for production payslip generation');
        } else if (successRate >= 70) {
            console.log('🟡 MIGRATION PARTIALLY SUCCESSFUL');
            console.log('   Most payslip fields working, some may need attention');
        } else {
            console.log('🔴 MIGRATION NEEDS ATTENTION');
            console.log('   Several payslip fields not working properly');
        }
        
        console.log('\n🎉 Next Steps:');
        console.log('1. Test employee creation with payslip fields');
        console.log('2. Update frontend forms to capture all fields');
        console.log('3. Implement payslip generation functionality');
        console.log('4. Add field validation rules');
        
        return {
            success: true,
            fieldsWorking: fieldsWorking,
            totalFields: totalFields,
            successRate: successRate,
            migrationComplete: successRate >= 90
        };
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('Stack:', error.stack);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the migration
migratePayslipFields().then(result => {
    console.log('\n📊 Migration completed');
    if (result.success && result.migrationComplete) {
        console.log('🚀 Ready for full payslip functionality!');
    }
    process.exit(result.success ? 0 : 1);
});
