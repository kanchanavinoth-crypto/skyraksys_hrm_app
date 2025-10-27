const axios = require('axios');

// Simple test to verify login works
async function testLogin() {
    try {
        console.log('🧪 Testing login functionality...');
        
        const response = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Login successful!');
        console.log('Response:', response.data);
        
        const token = response.data.data.accessToken;
        console.log('\n🔑 Testing with token...');
        
        // Test positions endpoint
        const positionsResponse = await axios.get('http://localhost:8080/api/positions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Positions endpoint working!');
        console.log(`Found ${positionsResponse.data.data.length} positions`);
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testLogin();
