const axios = require('axios');

async function testBackendAuth() {
    console.log('🔐 Testing Backend Authentication API...');
    console.log('=======================================');
    
    const baseUrl = 'http://localhost:8080/api';
    
    // Test users with strong passwords
    const testUsers = [
        { email: 'admin@company.com', password: 'Kx9mP7qR2nF8sA5t', role: 'admin' },
        { email: 'hr@company.com', password: 'Lw3nQ6xY8mD4vB7h', role: 'hr' },
        { email: 'employee@company.com', password: 'Mv4pS9wE2nR6kA8j', role: 'employee' },
        { email: 'manager@test.com', password: 'Qy8nR6wA2mS5kD7j', role: 'manager' }
    ];
    
    for (const user of testUsers) {
        try {
            console.log(`\n🧪 Testing ${user.role}: ${user.email}`);
            
            const response = await axios.post(`${baseUrl}/auth/login`, {
                email: user.email,
                password: user.password
            }, {
                timeout: 10000,
                validateStatus: function (status) {
                    return true; // Don't throw on any status
                }
            });
            
            console.log(`📊 Status: ${response.status}`);
            
            if (response.status === 200) {
                console.log(`✅ ${user.role.toUpperCase()} LOGIN SUCCESS`);
                console.log(`🎟️  Token received: ${response.data.token ? 'YES' : 'NO'}`);
                if (response.data.user) {
                    console.log(`👤 User data: ${response.data.user.firstName} ${response.data.user.lastName}`);
                }
            } else {
                console.log(`❌ ${user.role.toUpperCase()} LOGIN FAILED`);
                console.log(`💬 Error: ${response.data?.message || response.statusText}`);
            }
            
        } catch (error) {
            console.log(`💥 ${user.role.toUpperCase()} API ERROR: ${error.message}`);
            if (error.response) {
                console.log(`📊 Status: ${error.response.status}`);
                console.log(`💬 Response: ${JSON.stringify(error.response.data)}`);
            }
        }
    }
    
    console.log('\n🏁 Backend authentication test completed!');
}

testBackendAuth();
