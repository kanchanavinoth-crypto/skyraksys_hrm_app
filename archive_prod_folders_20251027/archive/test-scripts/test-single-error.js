const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';
const TEST_CREDENTIALS = {
    email: 'employee@company.com',
    password: 'Mv4pS9wE2nR6kA8j'
};

async function testSingleError() {
    try {
        // Login first
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
        const token = loginResponse.data.data.accessToken;
        const headers = { Authorization: `Bearer ${token}` };

        // Test old daily format detection
        console.log('Testing old daily format detection...');
        try {
            const response = await axios.post(`${BASE_URL}/timesheets`, {
                workDate: '2024-01-15',
                hoursWorked: 8,
                projectId: '12345678-1234-1234-1234-123456789001'
            }, { headers });
        } catch (error) {
            console.log('\n=== ERROR RESPONSE ===');
            console.log('Status:', error.response?.status);
            console.log('Data:', JSON.stringify(error.response?.data, null, 2));
            console.log('======================\n');
        }

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testSingleError();