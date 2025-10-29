const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';
const TEST_CREDENTIALS = {
    email: 'employee@company.com',
    password: 'Mv4pS9wE2nR6kA8j'
};

async function testEnhancedErrorMessages() {
    console.log('🔧 TESTING ENHANCED TIMESHEET ERROR MESSAGES');
    console.log('=============================================\n');

    try {
        // Login first
        console.log('1. Logging in as employee...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
        const token = loginResponse.data.data.accessToken;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Login successful\n');

        // Test 1: Empty request body
        console.log('📋 Test 1: Empty request body');
        try {
            await axios.post(`${BASE_URL}/timesheets`, {}, { headers });
        } catch (error) {
            console.log('❌ Expected Error Response:');
            console.log(JSON.stringify(error.response.data, null, 2));
        }
        console.log('\n');

        // Test 2: Old daily format (should be detected and rejected)
        console.log('📋 Test 2: Old daily format (workDate + hoursWorked)');
        try {
            await axios.post(`${BASE_URL}/timesheets`, {
                workDate: '2024-01-15',
                hoursWorked: 8,
                projectId: '12345678-1234-1234-1234-123456789001',
                description: 'Testing old format'
            }, { headers });
        } catch (error) {
            console.log('❌ Expected Error Response:');
            console.log(JSON.stringify(error.response.data, null, 2));
        }
        console.log('\n');

        // Test 3: Missing required fields
        console.log('📋 Test 3: Missing required fields');
        try {
            await axios.post(`${BASE_URL}/timesheets`, {
                weekStartDate: '2024-01-15',
                mondayHours: 8
                // Missing projectId and taskId
            }, { headers });
        } catch (error) {
            console.log('❌ Expected Error Response:');
            console.log(JSON.stringify(error.response.data, null, 2));
        }
        console.log('\n');

        // Test 4: Invalid week start date (not a Monday)
        console.log('📋 Test 4: Invalid week start date (not a Monday)');
        try {
            await axios.post(`${BASE_URL}/timesheets`, {
                projectId: '12345678-1234-1234-1234-123456789001',
                taskId: '12345678-1234-1234-1234-123456789011',
                weekStartDate: '2024-01-16', // Tuesday instead of Monday
                mondayHours: 8
            }, { headers });
        } catch (error) {
            console.log('❌ Expected Error Response:');
            console.log(JSON.stringify(error.response.data, null, 2));
        }
        console.log('\n');

        // Test 5: Invalid project ID
        console.log('📋 Test 5: Invalid project ID');
        try {
            await axios.post(`${BASE_URL}/timesheets`, {
                projectId: '99999999-1234-1234-1234-123456789001', // Non-existent
                taskId: '12345678-1234-1234-1234-123456789011',
                weekStartDate: '2024-01-15', // Monday
                mondayHours: 8
            }, { headers });
        } catch (error) {
            console.log('❌ Expected Error Response:');
            console.log(JSON.stringify(error.response.data, null, 2));
        }
        console.log('\n');

        // Test 6: Successful creation (with proper format)
        console.log('📋 Test 6: Successful creation with proper format');
        try {
            const response = await axios.post(`${BASE_URL}/timesheets`, {
                projectId: '12345678-1234-1234-1234-123456789001',
                taskId: '12345678-1234-1234-1234-123456789011',
                weekStartDate: '2024-02-19', // Monday
                mondayHours: 8,
                tuesdayHours: 7.5,
                wednesdayHours: 8,
                thursdayHours: 8,
                fridayHours: 6,
                description: 'Weekly development work'
            }, { headers });
            
            console.log('✅ Success Response:');
            console.log(JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.log('❌ Unexpected Error:');
            console.log(JSON.stringify(error.response?.data || error.message, null, 2));
        }
        console.log('\n');

        console.log('🎉 ERROR MESSAGE TESTING COMPLETED');
        console.log('==================================');

    } catch (error) {
        console.error('❌ Test setup failed:', error.response?.data || error.message);
    }
}

testEnhancedErrorMessages();