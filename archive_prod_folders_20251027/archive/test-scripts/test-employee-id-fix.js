// Create a test user account for debugging
const axios = require('axios');

async function createTestUser() {
    console.log('Creating test user for debugging...');
    
    try {
        // Try to register a test user
        const registerData = {
            firstName: 'Test',
            lastName: 'Admin',
            email: 'test.admin@company.com',
            password: 'password123',
            role: 'admin',
            employeeId: 'ADMIN001'
        };
        
        console.log('Attempting to register test user...');
        const registerResponse = await axios.post('http://localhost:8080/api/auth/register', registerData);
        console.log('✅ Test user registration successful:', registerResponse.data);
        
        // Try login with new user
        console.log('\nTesting login with new user...');
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'test.admin@company.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('Token obtained:', token ? 'Yes' : 'No');
        
        // Now test employee creation with the fix
        console.log('\n🧪 Testing employee creation with Employee ID fix...');
        const testEmployee = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@company.com',
            employeeId: 'EMP001',
            hireDate: '2024-01-01',
            departmentId: '123e4567-e89b-12d3-a456-426614174000',
            positionId: '123e4567-e89b-12d3-a456-426614174001'
        };
        
        console.log('Sending employee data with employeeId:', testEmployee.employeeId);
        
        const response = await axios.post('http://localhost:8080/api/employees', testEmployee, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Employee creation successful!');
        console.log('Created employee:', response.data);
        
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
        
        if (error.response?.data?.errors) {
            console.log('Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
        }
    }
}

createTestUser().catch(console.error);