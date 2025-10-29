const axios = require('axios');

async function testTasksAPI() {
    try {
        // Login first
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'employee@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });

        const token = loginResponse.data.data.accessToken;
        console.log('✅ Login successful');

        // Get tasks
        const tasksResponse = await axios.get('http://localhost:8080/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Tasks response:', JSON.stringify(tasksResponse.data, null, 2));

    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }
}

testTasksAPI();