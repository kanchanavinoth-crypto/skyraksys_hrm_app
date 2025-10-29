// Debug script to test employee creation and identify 500 error
const axios = require('axios');

async function testEmployeeCreation() {
    console.log('Testing employee creation to identify 500 error...');
    
    // First, login to get a token
    try {
        console.log('1. Attempting login...');
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'admin@example.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful, token obtained');
        
        // Test employee creation with minimal data
        console.log('\n2. Testing employee creation with minimal data...');
        const minimalEmployee = {
            firstName: 'Test',
            lastName: 'Employee',
            email: 'test.employee@example.com',
            employeeId: 'TEST001',
            department: 'IT',
            position: 'Developer',
            hireDate: '2024-01-01',
            status: 'active'
        };
        
        try {
            const response = await axios.post('http://localhost:8080/api/employees', minimalEmployee, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Employee creation successful:', response.data);
        } catch (error) {
            console.log('❌ Employee creation failed with minimal data:');
            console.log('Status:', error.response?.status);
            console.log('Error message:', error.response?.data?.message || error.message);
            console.log('Validation errors:', error.response?.data?.errors);
            console.log('Full error response:', JSON.stringify(error.response?.data, null, 2));
        }
        
        // Test with salary data
        console.log('\n3. Testing employee creation with salary data...');
        const employeeWithSalary = {
            firstName: 'Test',
            lastName: 'Employee2',
            email: 'test.employee2@example.com',
            employeeId: 'TEST002',
            department: 'IT',
            position: 'Developer',
            hireDate: '2024-01-01',
            status: 'active',
            salary: {
                basicSalary: 50000,
                currency: 'USD',
                payFrequency: 'monthly',
                allowances: [
                    { type: 'transport', amount: 500 }
                ],
                deductions: [
                    { type: 'tax', amount: 5000 }
                ],
                benefits: [
                    { type: 'health', description: 'Health insurance' }
                ]
            }
        };
        
        try {
            const response = await axios.post('http://localhost:8080/api/employees', employeeWithSalary, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Employee with salary creation successful:', response.data);
        } catch (error) {
            console.log('❌ Employee with salary creation failed:');
            console.log('Status:', error.response?.status);
            console.log('Error message:', error.response?.data?.message || error.message);
            console.log('Validation errors:', error.response?.data?.errors);
            console.log('Full error response:', JSON.stringify(error.response?.data, null, 2));
        }
        
    } catch (loginError) {
        console.log('❌ Login failed:', loginError.response?.data || loginError.message);
        return;
    }
}

// Run the test
testEmployeeCreation().catch(console.error);