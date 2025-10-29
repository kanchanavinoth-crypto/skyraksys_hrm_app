const axios = require('axios');

async function testRestrictedTaskSubmission() {
    try {
        console.log('Starting test...');
        
        // Login
        console.log('Attempting login...');
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'employee@company.com',
            password: 'Mv4pS9wE2nR6kA8j'
        });

        console.log('Login response status:', loginResponse.status);
        const token = loginResponse.data.data.accessToken;
        console.log('✅ Login successful, token received');

        // Try to submit timesheet for restricted task
        const timesheetData = {
            weekStartDate: '2024-12-30', // Different week to avoid duplicate
            projectId: '12345678-1234-1234-1234-123456789001',
            taskId: '12345678-1234-1234-1234-123456789013', // Database Design - restricted
            mondayHours: 4,
            tuesdayHours: 4,
            wednesdayHours: 4,
            thursdayHours: 4,
            fridayHours: 4,
            saturdayHours: 0,
            sundayHours: 0
        };

        try {
            const response = await axios.post('http://localhost:8080/api/timesheets', timesheetData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('⚠️  SECURITY ISSUE: Submission succeeded when it should be blocked!');
            console.log('Response:', response.data.success);
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ SECURITY WORKING: Access correctly denied');
                console.log('Message:', error.response.data.message);
            } else {
                console.log('❓ Unexpected error:', error.response?.data || error.message);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testRestrictedTaskSubmission();