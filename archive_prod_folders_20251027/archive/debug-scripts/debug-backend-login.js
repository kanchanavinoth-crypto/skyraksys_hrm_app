// Check existing users and try different login approaches
const axios = require('axios');

async function checkBackendStatus() {
    console.log('Checking backend status and login options...');
    
    try {
        // Test basic connection
        console.log('1. Testing basic connection...');
        const healthResponse = await axios.get('http://localhost:8080/api/health').catch(() => null);
        if (healthResponse) {
            console.log('✅ Backend health check passed');
        } else {
            console.log('❌ Backend health check failed');
        }
        
        // Try login with different credentials
        const loginAttempts = [
            { email: 'admin@example.com', password: 'password123' },
            { email: 'admin@company.com', password: 'admin123' },
            { email: 'admin', password: 'admin' },
            { email: 'test@example.com', password: 'password' }
        ];
        
        let token = null;
        for (const creds of loginAttempts) {
            try {
                console.log(`\n2. Trying login with ${creds.email}...`);
                const loginResponse = await axios.post('http://localhost:8080/api/auth/login', creds);
                token = loginResponse.data.token;
                console.log('✅ Login successful with:', creds.email);
                console.log('User data:', JSON.stringify(loginResponse.data.user, null, 2));
                break;
            } catch (error) {
                console.log(`❌ Login failed with ${creds.email}:`, error.response?.data?.message || error.message);
            }
        }
        
        if (!token) {
            console.log('\n❌ No successful login found. Checking if we can create a test user...');
            
            // Try to register a test user
            try {
                const registerResponse = await axios.post('http://localhost:8080/api/auth/register', {
                    firstName: 'Test',
                    lastName: 'Admin',
                    email: 'test.admin@example.com',
                    password: 'password123',
                    role: 'admin',
                    employeeId: 'ADMIN001'
                });
                console.log('✅ Test user registration successful:', registerResponse.data);
                
                // Try login with new user
                const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
                    email: 'test.admin@example.com',
                    password: 'password123'
                });
                token = loginResponse.data.token;
                console.log('✅ Login successful with new test user');
            } catch (regError) {
                console.log('❌ Registration failed:', regError.response?.data || regError.message);
                return;
            }
        }
        
        // Now test employee creation with valid token
        console.log('\n3. Testing employee creation with valid token...');
        const testEmployee = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            employeeId: 'EMP001',
            department: 'IT',
            position: 'Developer',
            hireDate: '2024-01-01',
            status: 'active'
        };
        
        try {
            const response = await axios.post('http://localhost:8080/api/employees', testEmployee, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Employee creation successful:', response.data);
        } catch (error) {
            console.log('❌ Employee creation failed:');
            console.log('Status:', error.response?.status);
            console.log('Error message:', error.response?.data?.message || error.message);
            console.log('Validation errors:', error.response?.data?.errors);
            console.log('Full error response:', JSON.stringify(error.response?.data, null, 2));
            
            // If it's a validation error, let's see what fields are expected
            if (error.response?.status === 400) {
                console.log('\n📋 This appears to be a validation error. Checking validation schema...');
            }
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

checkBackendStatus().catch(console.error);