// Debug script to test employee creation and see the exact validation error
const axios = require('axios');

async function debugEmployeeCreationError() {
    console.log('Debugging employee creation validation error...');
    
    try {
        // First try to login to get a valid token
        console.log('1. Attempting login...');
        const loginAttempts = [
            { email: 'admin@example.com', password: 'password123' },
            { email: 'admin@company.com', password: 'admin123' },
            { email: 'test@example.com', password: 'password' }
        ];
        
        let token = null;
        for (const creds of loginAttempts) {
            try {
                console.log(`Trying login with ${creds.email}...`);
                const loginResponse = await axios.post('http://localhost:8080/api/auth/login', creds);
                token = loginResponse.data.token;
                console.log('✅ Login successful with:', creds.email);
                break;
            } catch (error) {
                console.log(`❌ Login failed with ${creds.email}`);
            }
        }
        
        if (!token) {
            console.log('❌ Could not login. Testing without authentication...');
        }
        
        // Test employee creation with minimal valid data including employeeId
        console.log('\n2. Testing employee creation with Employee ID...');
        const testEmployee = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe.test@example.com',
            employeeId: 'EMP001',  // This should satisfy the requirement
            hireDate: '2024-01-01',
            departmentId: '123e4567-e89b-12d3-a456-426614174000', // Dummy UUID
            positionId: '123e4567-e89b-12d3-a456-426614174001'    // Dummy UUID
        };
        
        console.log('Sending employee data:', JSON.stringify(testEmployee, null, 2));
        
        try {
            const response = await axios.post('http://localhost:8080/api/employees', testEmployee, {
                headers: token ? {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                } : {
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Employee creation successful:', response.data);
        } catch (error) {
            console.log('❌ Employee creation failed:');
            console.log('Status:', error.response?.status);
            console.log('Message:', error.response?.data?.message);
            console.log('Errors:', JSON.stringify(error.response?.data?.errors, null, 2));
            console.log('Validation Guide:', JSON.stringify(error.response?.data?.validationGuide, null, 2));
            console.log('Received Data:', JSON.stringify(error.response?.data?.receivedData, null, 2));
            
            // Let's see if we can identify the specific field causing issues
            if (error.response?.data?.errors) {
                console.log('\n📋 Specific validation errors:');
                error.response.data.errors.forEach((err, index) => {
                    console.log(`${index + 1}. Field: ${err.field || 'unknown'}`);
                    console.log(`   Message: ${err.message || err}`);
                    console.log(`   Context: ${err.context || 'N/A'}`);
                });
            }
        }
        
        // Also test with different employeeId formats
        console.log('\n3. Testing different Employee ID formats...');
        const testFormats = [
            'emp001',      // lowercase
            'EMP-001',     // with dash
            'E001',        // short
            'EMPLOYEE001', // long
            '001',         // numeric only
            'EMP_001'      // with underscore
        ];
        
        for (const empId of testFormats) {
            const testData = { ...testEmployee, employeeId: empId, email: `test.${empId.toLowerCase()}@example.com` };
            try {
                const response = await axios.post('http://localhost:8080/api/employees', testData, {
                    headers: token ? {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } : {
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`✅ ${empId}: Success`);
            } catch (error) {
                console.log(`❌ ${empId}: ${error.response?.data?.message || error.message}`);
            }
        }
        
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
    }
}

debugEmployeeCreationError().catch(console.error);