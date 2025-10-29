const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:8080/api';
const TEST_TIMESTAMP = Date.now();

console.log('\n🚀 COMPREHENSIVE PAYSLIP EMPLOYEE TEST');
console.log('='.repeat(50));

async function testComprehensivePayslipEmployee() {
    try {
        // First login as admin to get auth token
        console.log('\n🔐 Authenticating as admin...');
        const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });
        const token = adminLogin.data.data.accessToken;
        console.log('✅ Admin authentication successful');
        
        // Get valid department and position IDs
        console.log('\n📋 Fetching reference data...');
        const [departments, positions] = await Promise.all([
            axios.get(`${API_BASE}/employees/meta/departments`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_BASE}/employees/meta/positions`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const departmentId = departments.data.data[0].id;
        const positionId = positions.data.data[0].id;
        console.log(`   Using Department ID: ${departmentId}, Position ID: ${positionId}`);
        
        // Comprehensive employee data - ALL fields that backend expects
        const comprehensiveEmployeeData = {
            // Basic Information
            firstName: 'Comprehensive',
            lastName: 'PayslipTest',
            email: `comprehensive.payslip.${TEST_TIMESTAMP}@company.com`,
            phone: '9876543210',
            hireDate: '2025-08-10',
            
            // Department and Position
            departmentId: departmentId,
            positionId: positionId,
            
            // Statutory Details (CRITICAL for payslips)
            aadhaarNumber: '123456789012',  // 12 digits
            panNumber: 'ABCDE1234F',        // Standard PAN format
            uanNumber: '123456789012',      // 12 digits
            pfNumber: 'PF123456',           // PF account number
            esiNumber: 'ESI123456',         // ESI number
            
            // Bank Details (CRITICAL for payslips)
            bankName: 'State Bank of India',
            bankAccountNumber: '12345678901234',
            ifscCode: 'SBIN0001234',
            bankBranch: 'Main Branch',
            accountHolderName: 'Comprehensive PayslipTest',
            
            // Personal Details
            dateOfBirth: '1990-01-01',
            gender: 'Male',
            address: '123 Test Street, Test Area',
            city: 'Test City',
            state: 'Test State',
            zipCode: '123456',
            pinCode: '123456',
            maritalStatus: 'Single',
            nationality: 'Indian',
            
            // Employment Details
            workLocation: 'Head Office',
            employmentType: 'Full-time',
            salary: 50000,
            
            // Emergency Contact
            emergencyContactName: 'Emergency Contact Person',
            emergencyContactPhone: '9876543211',
            emergencyContactRelation: 'Parent'
        };
        
        console.log('\n✅ Step 1: Creating comprehensive payslip-ready employee...');
        console.log('   Fields being sent:', Object.keys(comprehensiveEmployeeData).length);
        
        const employeeResponse = await axios.post(`${API_BASE}/employees`, comprehensiveEmployeeData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Employee created successfully!');
        console.log(`   Employee ID: ${employeeResponse.data.data.employeeId}`);
        console.log(`   Database ID: ${employeeResponse.data.data.id}`);
        
        // Verify all fields are stored correctly
        const employee = employeeResponse.data.data;
        
        console.log('\n✅ Step 2: COMPREHENSIVE FIELD VALIDATION');
        
        // Statutory Fields Validation
        console.log('\n📋 Statutory Information:');
        const statutoryFields = {
            'Aadhaar Number': employee.aadhaarNumber,
            'PAN Number': employee.panNumber,
            'UAN Number': employee.uanNumber,
            'PF Number': employee.pfNumber,
            'ESI Number': employee.esiNumber
        };
        
        Object.entries(statutoryFields).forEach(([field, value]) => {
            const status = value ? '✅' : '❌';
            console.log(`   ${status} ${field}: ${value || 'MISSING'}`);
        });
        
        // Bank Fields Validation
        console.log('\n💳 Bank Details:');
        const bankFields = {
            'Bank Name': employee.bankName,
            'Account Number': employee.bankAccountNumber,
            'IFSC Code': employee.ifscCode,
            'Bank Branch': employee.bankBranch,
            'Account Holder Name': employee.accountHolderName
        };
        
        Object.entries(bankFields).forEach(([field, value]) => {
            const status = value ? '✅' : '❌';
            console.log(`   ${status} ${field}: ${value || 'MISSING'}`);
        });
        
        // Personal Details Validation
        console.log('\n👤 Personal Details:');
        const personalFields = {
            'Address': employee.address,
            'City': employee.city,
            'State': employee.state,
            'PIN Code': employee.pinCode,
            'Date of Birth': employee.dateOfBirth,
            'Gender': employee.gender,
            'Marital Status': employee.maritalStatus,
            'Nationality': employee.nationality
        };
        
        Object.entries(personalFields).forEach(([field, value]) => {
            const status = value ? '✅' : '❌';
            console.log(`   ${status} ${field}: ${value || 'MISSING'}`);
        });
        
        // Test login functionality
        console.log('\n✅ Step 3: Testing login provisioning...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: comprehensiveEmployeeData.email,
            password: 'password123'  // Default password
        });
        
        console.log('✅ Login successful!');
        console.log(`   User Role: ${loginResponse.data.data.user.role}`);
        console.log(`   User ID: ${loginResponse.data.data.user.id}`);
        
        // Final payslip readiness assessment
        console.log('\n🎯 PAYSLIP READINESS ASSESSMENT');
        console.log('='.repeat(40));
        
        const criticalFields = {
            'PAN Number': employee.panNumber,
            'Aadhaar Number': employee.aadhaarNumber,
            'Bank Account': employee.bankAccountNumber,
            'IFSC Code': employee.ifscCode,
            'Bank Name': employee.bankName
        };
        
        let payslipReady = true;
        Object.entries(criticalFields).forEach(([field, value]) => {
            const status = value ? '✅ PRESENT' : '❌ MISSING';
            console.log(`   ${field}: ${status}`);
            if (!value) payslipReady = false;
        });
        
        console.log('\n🏆 FINAL PAYSLIP READINESS:');
        if (payslipReady) {
            console.log('   🟢 FULLY PAYSLIP READY!');
            console.log('\n✅ This employee can now:');
            console.log('   • Generate complete payslips with all statutory deductions');
            console.log('   • Receive salary via bank transfer');
            console.log('   • Have PF/ESI contributions tracked');
            console.log('   • Access payroll portal with login credentials');
            console.log('   • Generate Form 16 and other tax documents');
        } else {
            console.log('   🟡 PARTIALLY READY - Some fields missing');
        }
        
        return {
            success: true,
            employee: employee,
            payslipReady: payslipReady,
            fieldsValidated: {
                statutory: statutoryFields,
                banking: bankFields,
                personal: personalFields
            }
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

// Run the comprehensive test
testComprehensivePayslipEmployee().then(result => {
    console.log('\n📊 Comprehensive test completed');
    if (result.success && result.payslipReady) {
        console.log('🎉 SUCCESS: Employee is fully payslip-ready!');
    } else if (result.success) {
        console.log('⚠️  PARTIAL: Employee created but some payslip fields missing');
    } else {
        console.log('❌ FAILED: Employee creation failed');
    }
    process.exit(result.success ? 0 : 1);
});
