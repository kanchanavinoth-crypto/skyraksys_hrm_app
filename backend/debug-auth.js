console.log('🔍 DEBUGGING AUTHENTICATION RESPONSE\n');

const axios = require('axios');

async function debugAuth() {
    try {
        console.log('Testing login and examining full response...');
        
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'employee@company.com',
            password: 'password123'
        });

        console.log('Full login response:');
        console.log(JSON.stringify(loginResponse.data, null, 2));

        if (loginResponse.data.data.accessToken) {
            console.log('\nToken is present, testing direct API call...');
            
            try {
                const testResponse = await axios.get('http://localhost:8080/api/timesheets?page=1&limit=1', {
                    headers: {
                        'Authorization': `Bearer ${loginResponse.data.data.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('✅ API call successful:', testResponse.data.success);
                console.log('   Timesheets found:', testResponse.data.data?.length || 0);
            } catch (apiError) {
                console.log('❌ API call failed:', apiError.response?.data || apiError.message);
            }
        }

    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
    }
}

debugAuth();