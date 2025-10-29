const axios = require('axios');

// Configuration
const API_BASE = '        console.log('\n✅ Step 1: Creating payslip-ready employee...');
        const employeeResponse = await axios.post(`${API_BASE}/employees`, testEmployeeData, {
            headers: { Authorization: `Bearer ${token}` }
        });tp://localhost:8080/api';
const TEST_TIMESTAMP = Date.now();

console.log('\n🚀 PAYSLIP-READY EMPLOYEE VALIDATION TEST');
console.log('='.repeat(50));

async function testPayslipReadyEmployeeCreation() {
    try {
        // First login as admin to get auth token
        console.log('\n🔐 Authenticating as admin...');
        const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });
        const token = adminLogin.data.data.accessToken;
        console.log('✅ Admin authentication successful');
        
        // Test employee data with ALL payslip-critical fields
        const testEmployeeData = {
            // Basic Information
            firstName: 'Payslip',
            lastName: 'Ready',
            email: `payslip.ready.${TEST_TIMESTAMP}@company.com`,
            phone: '9876543210',
            hireDate: '2025-08-09',
            
            // Department and Position (using IDs)
            departmentId: 1,
            positionId: 1,
            
            // Statutory Details (CRITICAL for payslips)
            aadhaarNumber: '123456789012',  // 12 digits without hyphens
            panNumber: 'ABCDE1234F',
            uanNumber: '123456789012',
            pfNumber: 'PF123456',
            esiNumber: 'ESI123456',
            
            // Bank Details (CRITICAL for payslips)
            bankName: 'State Bank of India',
            bankAccountNumber: '12345678901234',
            ifscCode: 'SBIN0001234',
            bankBranch: 'Main Branch',
            accountHolderName: 'Payslip Ready',
            
            // Personal Details
            dateOfBirth: '1990-01-01',
            gender: 'Male',
            address: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            pinCode: '123456',
            maritalStatus: 'Single',
            nationality: 'Indian',
            
            // Employment Details
            workLocation: 'Head Office',
            employmentType: 'Full-time',
            salary: 50000,
            
            // Emergency Contact
            emergencyContactName: 'Emergency Contact',
            emergencyContactPhone: '9876543211',
            emergencyContactRelation: 'Parent'
        };
        
        console.log('\n✅ Step 1: Creating payslip-ready employee...');
        const employeeResponse = await axios.post(`${API_BASE}/employees`, testEmployeeData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Employee created successfully!');
        console.log(`   Employee ID: ${employeeResponse.data.data.employeeId}`);
        console.log(`   Database ID: ${employeeResponse.data.data.id}`);
        
        // Verify all payslip-critical fields are stored
        const employee = employeeResponse.data.data;
        
        console.log('\n✅ Step 2: Validating payslip-critical fields...');
        
        // Statutory Fields Validation
        const statutoryFields = {
            'Aadhaar Number': employee.aadhaarNumber,
            'PAN Number': employee.panNumber,
            'UAN Number': employee.uanNumber,
            'PF Number': employee.pfNumber,
            'ESI Number': employee.esiNumber
        };
        
        console.log('\n📋 Statutory Information:');
        Object.entries(statutoryFields).forEach(([field, value]) => {
            console.log(`   ${field}: ${value || 'NOT PROVIDED'}`);
        });
        
        // Bank Fields Validation
        const bankFields = {
            'Bank Name': employee.bankName,
            'Account Number': employee.bankAccountNumber,
            'IFSC Code': employee.ifscCode,
            'Bank Branch': employee.bankBranch,
            'Account Holder Name': employee.accountHolderName
        };
        
        console.log('\n💳 Bank Details:');
        Object.entries(bankFields).forEach(([field, value]) => {
            console.log(`   ${field}: ${value || 'NOT PROVIDED'}`);
        });
        
        // Test login functionality
        console.log('\n✅ Step 3: Testing login provisioning...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: testEmployeeData.email,
            password: 'password123'  // Default password from backend
        });
        
        console.log('✅ Login successful!');
        console.log(`   User Role: ${loginResponse.data.data.user.role}`);
        console.log(`   User ID: ${loginResponse.data.data.user.id}`);
        
        // Test payslip data access
        console.log('\n✅ Step 4: Testing payslip data availability...');
        const payslipResponse = await axios.get(`${API_BASE}/payslips`, {
            headers: { Authorization: `Bearer ${loginResponse.data.data.accessToken}` }
        });
        
        console.log('✅ Payslip API accessible!');
        console.log(`   Available employees for payslip: ${payslipResponse.data.data?.length || 0}`);
        
        // Comprehensive validation summary
        console.log('\n🎉 PAYSLIP READINESS VALIDATION SUMMARY');
        console.log('='.repeat(40));
        
        const validationResults = {
            'Employee Created': '✅ SUCCESS',
            'User Account Provisioned': '✅ SUCCESS',
            'Login Working': '✅ SUCCESS',
            'Statutory Fields Present': statutoryFields.aadhaarNumber && statutoryFields.panNumber ? '✅ SUCCESS' : '❌ MISSING',
            'Bank Details Present': bankFields.bankName && bankFields.bankAccountNumber ? '✅ SUCCESS' : '❌ MISSING',
            'Payslip API Accessible': '✅ SUCCESS'
        };
        
        Object.entries(validationResults).forEach(([test, result]) => {
            console.log(`   ${test}: ${result}`);
        });
        
        // Check if employee is truly payslip-ready
        const isPayslipReady = employee.bankAccountNumber && employee.ifscCode && 
                              employee.panNumber && employee.aadhaarNumber;
        
        console.log('\n🏆 FINAL RESULT:');
        console.log(`   Payslip Ready Status: ${isPayslipReady ? '✅ READY FOR PAYROLL' : '❌ MISSING CRITICAL DATA'}`);
        
        if (isPayslipReady) {
            console.log('\n✅ This employee can now:');
            console.log('   • Generate payslips with statutory deductions');
            console.log('   • Receive salary transfers to bank account');
            console.log('   • Access payroll portal with login credentials');
            console.log('   • View PF/ESI contributions in payslips');
        }
        
        return {
            success: true,
            employee: employee,
            payslipReady: isPayslipReady,
            testResults: validationResults
        };
        
    } catch (error) {
        console.error('\n❌ Test Failed:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('   Message:', error.message);
        }
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

// Run the test
testPayslipReadyEmployeeCreation().then(result => {
    console.log('\n📊 Test completed');
    process.exit(result.success ? 0 : 1);
});
