const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login...');
        
        const response = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'employee@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });

        console.log('✅ Login successful:', response.data);

    } catch (error) {
        console.log('❌ Login failed');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testLogin();