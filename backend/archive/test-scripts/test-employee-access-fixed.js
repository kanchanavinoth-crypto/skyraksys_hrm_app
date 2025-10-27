const axios = require('axios');

async function testEmployeeTaskAccess() {
    try {
        console.log('\n=== Testing Employee Task Access Validation ===\n');

        // Test login with regular employee
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'employee@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });

        console.log('✅ Login successful for employee:', loginResponse.data.data.user.email);
        const token = loginResponse.data.data.accessToken;
        const employeeId = loginResponse.data.data.user.employeeId;

        // Check what tasks this employee can see
        const tasksResponse = await axios.get('http://localhost:8080/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const tasks = tasksResponse.data.data;
        console.log('\n📋 Tasks available to employee:');
        tasks.forEach(task => {
            console.log(`  - Task ${task.id.split('-')[4]}: ${task.name} (availableToAll: ${task.availableToAll}, assignedTo: ${task.assignedTo ? 'employee' : 'none'})`);
        });

        // Try to submit timesheet for Task 3 (restricted task - Database Design)
        console.log('\n🚫 Attempting to submit timesheet for restricted Task 3 (Database Design)...');
        
        const timesheetData = {
            weekStartDate: '2024-12-16',
            projectId: '12345678-1234-1234-1234-123456789001',
            taskId: '12345678-1234-1234-1234-123456789013', // Database Design - restricted
            mondayHours: 8,
            tuesdayHours: 8,
            wednesdayHours: 8,
            thursdayHours: 8,
            fridayHours: 8,
            saturdayHours: 0,
            sundayHours: 0
        };

        try {
            const submitResponse = await axios.post('http://localhost:8080/api/timesheets', timesheetData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('⚠️  Timesheet submission succeeded (this should NOT happen!):', submitResponse.data);

        } catch (submitError) {
            if (submitError.response) {
                console.log('❌ Timesheet submission blocked (as expected):', submitError.response.data.message);
            } else {
                console.log('❌ Timesheet submission error:', submitError.message);
            }
        }

        // Try to submit timesheet for Task 1 (available to all - Frontend Development)
        console.log('\n✅ Attempting to submit timesheet for available Task 1 (Frontend Development)...');
        
        const validTimesheetData = {
            weekStartDate: '2024-12-23',
            projectId: '12345678-1234-1234-1234-123456789001',
            taskId: '12345678-1234-1234-1234-123456789011', // Frontend Development - available to all
            mondayHours: 6,
            tuesdayHours: 7,
            wednesdayHours: 8,
            thursdayHours: 5,
            fridayHours: 4,
            saturdayHours: 0,
            sundayHours: 0
        };

        try {
            const validSubmitResponse = await axios.post('http://localhost:8080/api/timesheets', validTimesheetData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Valid timesheet submission succeeded:', validSubmitResponse.data.success);

        } catch (validError) {
            if (validError.response) {
                console.log('❌ Valid timesheet submission failed:', validError.response.data.message);
            } else {
                console.log('❌ Valid timesheet submission error:', validError.message);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testEmployeeTaskAccess();