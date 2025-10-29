console.log('🔍 TESTING FRONTEND TOKEN STORAGE\n');

// This script will check the expected frontend token storage mechanism

const axios = require('axios');
const fs = require('fs');

async function checkFrontendTokenMechanism() {
    try {
        // Get a valid token first
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'employee@company.com',
            password: 'password123'
        });

        const validToken = loginResponse.data.data.accessToken;
        console.log('✅ Got valid token for testing');

        // Test what happens when we use an invalid/missing token
        console.log('\n1. Testing API call with no Authorization header...');
        try {
            const noTokenResponse = await axios.get('http://localhost:8080/api/timesheets', {
                headers: {
                    'Content-Type': 'application/json'
                    // No Authorization header
                }
            });
            console.log('❌ Unexpected: No token request succeeded');
        } catch (error) {
            console.log('✅ Expected: No token request failed:', error.response?.status, error.response?.data?.message);
        }

        // Test with invalid token
        console.log('\n2. Testing API call with invalid token...');
        try {
            const invalidTokenResponse = await axios.get('http://localhost:8080/api/timesheets', {
                headers: {
                    'Authorization': 'Bearer invalid-token',
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ Unexpected: Invalid token request succeeded');
        } catch (error) {
            console.log('✅ Expected: Invalid token request failed:', error.response?.status, error.response?.data?.message);
        }

        // Test with valid token
        console.log('\n3. Testing API call with valid token...');
        try {
            const validTokenResponse = await axios.get('http://localhost:8080/api/timesheets?limit=5', {
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Valid token request succeeded:', validTokenResponse.data.success);
            console.log('   Timesheets returned:', validTokenResponse.data.data?.length || 0);
        } catch (error) {
            console.log('❌ Unexpected: Valid token request failed:', error.response?.status, error.response?.data?.message);
        }

        // Check if localStorage simulation works (for frontend debugging)
        console.log('\n4. Testing localStorage token simulation...');
        
        // Simulate what the frontend http-common.js does
        const mockLocalStorage = {
            getItem: (key) => {
                if (key === 'accessToken') {
                    return validToken; // Simulate stored token
                }
                return null;
            }
        };

        const tokenFromStorage = mockLocalStorage.getItem('accessToken');
        console.log('   Token from simulated localStorage:', tokenFromStorage ? 'Found' : 'Not found');

        if (tokenFromStorage) {
            console.log('\n5. Testing with localStorage token...');
            try {
                const storageTokenResponse = await axios.get('http://localhost:8080/api/timesheets?limit=3', {
                    headers: {
                        'Authorization': `Bearer ${tokenFromStorage}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('✅ localStorage token works:', storageTokenResponse.data.success);
            } catch (error) {
                console.log('❌ localStorage token failed:', error.response?.status, error.response?.data?.message);
            }
        }

        console.log('\n💡 FRONTEND DEBUGGING TIPS:');
        console.log('   1. Check browser console for authentication errors');
        console.log('   2. Check Network tab in DevTools for failed API calls');
        console.log('   3. Check Application > Local Storage for "accessToken"');
        console.log('   4. Verify the token is being sent in Authorization header');
        console.log('   5. Make sure you\'re logged in as employee@company.com');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkFrontendTokenMechanism();