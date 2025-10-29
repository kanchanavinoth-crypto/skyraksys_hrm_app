const axios = require('axios');

// Simple debug test to see what fields are actually being saved
async function debugEmployeeCreation() {
    try {
        const API_BASE = 'http://localhost:8080/api';
        
        // Login as admin
        const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });
        const token = adminLogin.data.data.accessToken;
        
        // Get departments and positions
        const [departments, positions] = await Promise.all([
            axios.get(`${API_BASE}/employees/meta/departments`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_BASE}/employees/meta/positions`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        // Simple test data focusing on payslip fields
        const testData = {
            firstName: 'Debug',
            lastName: 'Test',
            email: `debug.test.${Date.now()}@company.com`,
            phone: '9876543210',
            hireDate: '2025-08-10',
            departmentId: departments.data.data[0].id,
            positionId: positions.data.data[0].id,
            
            // Focus on the problematic fields
            pfNumber: 'TEST_PF_123',
            esiNumber: 'TEST_ESI_456',
            bankName: 'Test Bank',
            bankAccountNumber: 'TEST_ACC_789',
            ifscCode: 'TEST0001234',
            bankBranch: 'Test Branch',
            accountHolderName: 'Debug Test'
        };
        
        console.log('📤 Sending data:', JSON.stringify(testData, null, 2));
        
        const response = await axios.post(`${API_BASE}/employees`, testData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('\n📥 Response received:');
        console.log('   Employee ID:', response.data.data.employeeId);
        console.log('   PF Number:', response.data.data.pfNumber);
        console.log('   ESI Number:', response.data.data.esiNumber);
        console.log('   Bank Name:', response.data.data.bankName);
        console.log('   Bank Account:', response.data.data.bankAccountNumber);
        console.log('   IFSC Code:', response.data.data.ifscCode);
        console.log('   Bank Branch:', response.data.data.bankBranch);
        console.log('   Account Holder:', response.data.data.accountHolderName);
        
        console.log('\n🔍 Full response data:');
        console.log(JSON.stringify(response.data.data, null, 2));
        
    } catch (error) {
        console.error('❌ Debug test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
    }
}

debugEmployeeCreation();
