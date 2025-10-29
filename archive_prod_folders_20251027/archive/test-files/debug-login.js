const axios = require('axios').default;

const BASE_URL = 'http://localhost:8080/api';

const debugLogin = async () => {
    console.log('🔍 **DEBUG LOGIN RESPONSE**');
    console.log('=' .repeat(40));
    
    try {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });
        
        console.log('✅ Login successful');
        console.log('📊 Full response data:');
        console.log(JSON.stringify(loginResponse.data, null, 2));
        console.log('📊 Response headers:');
        console.log(JSON.stringify(loginResponse.headers, null, 2));
        console.log('📊 Status:', loginResponse.status);
        
    } catch (error) {
        console.log('❌ Login failed:');
        console.log('Error data:', error.response?.data);
        console.log('Error status:', error.response?.status);
        console.log('Error message:', error.message);
    }
};

debugLogin();
