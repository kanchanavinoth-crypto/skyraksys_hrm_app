// Test employee trying to submit timesheet for restricted task
const axios = require('axios');

async function testRestrictedTaskSubmission() {
    try {
        console.log('\n🔐 Testing Restricted Task Submission Security...\n');

        // 1. Login as employee
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'employee@company.com',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Logged in as employee EMP003 (employee@company.com)');

        // 2. Get available tasks (should only see available ones)
        const tasksResponse = await axios.get('http://localhost:8080/api/tasks', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('\n📋 Available tasks for employee EMP003:');
        tasksResponse.data.data.forEach(task => {
            console.log(`  - Task ${task.id}: ${task.name} (availableToAll: ${task.availableToAll})`);
        });

        // 3. Try to submit timesheet for restricted Task 2 (that employee can't see)
        console.log('\n🚫 Attempting to submit timesheet for restricted Task 2...');

        const restrictedTimesheetData = {
            weekStartDate: '2024-01-15',
            weekEndDate: '2024-01-21',
            weekNumber: 3,
            year: 2024,
            entries: [
                {
                    taskId: 2, // This is the restricted task
                    mondayHours: 8,
                    tuesdayHours: 0,
                    wednesdayHours: 0,
                    thursdayHours: 0,
                    fridayHours: 0,
                    saturdayHours: 0,
                    sundayHours: 0,
                    totalHours: 8
                }
            ]
        };

        try {
            const submitResponse = await axios.post('http://localhost:8080/api/timesheets', 
                restrictedTimesheetData, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('❌ SECURITY ISSUE: Submission should have been blocked!');
            console.log('Response:', submitResponse.data);
        } catch (submitError) {
            if (submitError.response && submitError.response.status === 400) {
                console.log('✅ SECURITY WORKING: Submission correctly blocked');
                console.log('Error message:', submitError.response.data.message);
            } else {
                console.log('❓ Unexpected error:', submitError.message);
            }
        }

        // 4. Test submitting for an available task (should work)
        console.log('\n✅ Testing submission for available Task 1...');

        const validTimesheetData = {
            weekStartDate: '2024-01-22',
            weekEndDate: '2024-01-28',
            weekNumber: 4,
            year: 2024,
            entries: [
                {
                    taskId: 1, // This is available to all
                    mondayHours: 6,
                    tuesdayHours: 7,
                    wednesdayHours: 8,
                    thursdayHours: 5,
                    fridayHours: 4,
                    saturdayHours: 0,
                    sundayHours: 0,
                    totalHours: 30
                }
            ]
        };

        try {
            const validResponse = await axios.post('http://localhost:8080/api/timesheets', 
                validTimesheetData, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ SUCCESS: Valid timesheet submitted');
            console.log('Timesheet ID:', validResponse.data.data.id);
        } catch (validError) {
            console.log('❌ UNEXPECTED: Valid submission failed');
            console.log('Error:', validError.response?.data || validError.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testRestrictedTaskSubmission();