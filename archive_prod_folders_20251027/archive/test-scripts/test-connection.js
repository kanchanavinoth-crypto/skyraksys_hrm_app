const axios = require('axios');

async function testConnection() {
    try {
        console.log('Testing backend connectivity...');
        const response = await axios.get('http://localhost:8080/api/health');
        console.log('✅ Backend is accessible');
        console.log('Health check response:', response.data);
    } catch (error) {
        console.log('❌ Backend connection failed');
        if (error.code) {
            console.log('Error code:', error.code);
        }
        if (error.response) {
            console.log('Response status:', error.response.status);
        } else {
            console.log('No response received');
        }
    }
}

testConnection();