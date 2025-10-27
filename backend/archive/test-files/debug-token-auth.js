/**
 * Debug Token Validation - Quick check to see what's wrong with the token
 */

const axios = require('axios');

async function debugTokenAuth() {
    console.log('🔍 DEBUGGING TOKEN AUTHENTICATION');
    console.log('=====================================\n');

    try {
        // Step 1: Try to login
        console.log('1️⃣ Testing Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });
        
        console.log('✅ Login successful');
        console.log('📝 Response data:', JSON.stringify(loginResponse.data, null, 2));
        
        const token = loginResponse.data.data.accessToken;
        console.log(`🔑 Token received: ${token.substring(0, 20)}...`);
        
        // Step 2: Test the token with a simple endpoint
        console.log('\n2️⃣ Testing token with /api/auth/me...');
        try {
            const meResponse = await axios.get('http://localhost:5000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ /api/auth/me successful');
            console.log('👤 User data:', JSON.stringify(meResponse.data, null, 2));
        } catch (meError) {
            console.log('❌ /api/auth/me failed');
            console.log('📄 Status:', meError.response?.status);
            console.log('📄 Response:', meError.response?.data);
        }

        // Step 3: Test the token with departments endpoint
        console.log('\n3️⃣ Testing token with /api/departments (GET)...');
        try {
            const deptGetResponse = await axios.get('http://localhost:5000/api/departments', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ GET /api/departments successful');
            console.log('🏢 Departments data:', JSON.stringify(deptGetResponse.data, null, 2));
        } catch (deptError) {
            console.log('❌ GET /api/departments failed');
            console.log('📄 Status:', deptError.response?.status);
            console.log('📄 Response:', deptError.response?.data);
        }

        // Step 4: Test creating a department
        console.log('\n4️⃣ Testing token with /api/departments (POST)...');
        try {
            const deptPostResponse = await axios.post('http://localhost:5000/api/departments', {
                name: 'Test Department',
                description: 'A test department for debugging'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ POST /api/departments successful');
            console.log('🏢 Created department:', JSON.stringify(deptPostResponse.data, null, 2));
        } catch (deptPostError) {
            console.log('❌ POST /api/departments failed');
            console.log('📄 Status:', deptPostError.response?.status);
            console.log('📄 Response:', deptPostError.response?.data);
            console.log('📄 Full error:', deptPostError.message);
        }

    } catch (error) {
        console.log('❌ Login failed:', error.response?.data || error.message);
    }
}

debugTokenAuth().catch(console.error);
