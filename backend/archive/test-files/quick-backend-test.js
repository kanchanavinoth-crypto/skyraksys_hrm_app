const axios = require('axios').default;

console.log('🔍 **QUICK BACKEND CONNECTION TEST**');
console.log('Testing connection to http://localhost:8080');

// Simple connection test
const testConnection = async () => {
    try {
        console.log('Testing basic connection...');
        const response = await axios.get('http://localhost:8080/health');
        console.log('✅ Backend is responding!');
        console.log('Response:', response.status, response.statusText);
        return true;
    } catch (error) {
        console.log('❌ Backend connection failed:', error.message);
        return false;
    }
};

// Test login endpoint
const testLogin = async () => {
    try {
        console.log('\nTesting login endpoint...');
        const loginData = {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        };
        
        const response = await axios.post('http://localhost:8080/auth/login', loginData);
        console.log('✅ Login successful!');
        console.log('Token received:', response.data.token ? 'Yes' : 'No');
        return response.data.token;
    } catch (error) {
        console.log('❌ Login failed:', error.response?.data?.message || error.message);
        return null;
    }
};

// Test employee reviews endpoint
const testReviewsEndpoint = async (token) => {
    try {
        console.log('\nTesting reviews endpoint...');
        const response = await axios.get('http://localhost:8080/reviews', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Reviews endpoint is working!');
        console.log('Reviews found:', response.data.length || 'N/A');
        return true;
    } catch (error) {
        console.log('❌ Reviews endpoint failed:', error.response?.status, error.response?.data?.message || error.message);
        return false;
    }
};

// Run all tests
const runTests = async () => {
    const connectionOk = await testConnection();
    if (!connectionOk) return;
    
    const token = await testLogin();
    if (!token) return;
    
    await testReviewsEndpoint(token);
};

runTests();
