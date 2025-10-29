const axios = require('axios');

async function testEmployeeTaskAccess() {
    try {
        console.log('\n=== Testing Employee Task Access Validation ===\n');

        // Test login with regular employee
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'employee@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });

        console.log('✅ Login successful for employee:', loginResponse.data.user.email);
        const token = loginResponse.data.token;
        const employeeId = loginResponse.data.user.employeeId;

        // Check what tasks this employee can see
        const tasksResponse = await axios.get('http://localhost:8080/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const tasks = tasksResponse.data;
        console.log('\n📋 Tasks available to employee:');
        tasks.forEach(task => {
            console.log(`  - Task ${task.id}: ${task.name} (availableToAll: ${task.availableToAll})`);
        });

        // Try to submit timesheet for Task 2 (restricted task)
        console.log('\n🚫 Attempting to submit timesheet for restricted Task 2...');
        
        const timesheetData = {
            weekStartDate: '2024-12-16',
            weekEndDate: '2024-12-22',
            weekNumber: 51,
            year: 2024,
            hoursWorked: {
                monday: { taskId: 2, hours: 8 },
                tuesday: { taskId: 2, hours: 8 },
                wednesday: { taskId: 2, hours: 8 },
                thursday: { taskId: 2, hours: 8 },
                friday: { taskId: 2, hours: 8 },
                saturday: { taskId: 2, hours: 0 },
                sunday: { taskId: 2, hours: 0 }
            },
            totalHours: 40,
            status: 'draft'
        };

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

    try {

        // Try to submit timesheet for Task 1 (available to all)
        console.log('\n✅ Attempting to submit timesheet for available Task 1...');
        
        const validTimesheetData = {
            weekStartDate: '2024-12-23',
            weekEndDate: '2024-12-29',
            weekNumber: 52,
            year: 2024,
            hoursWorked: {
                monday: { taskId: 1, hours: 8 },
                tuesday: { taskId: 1, hours: 8 },
                wednesday: { taskId: 1, hours: 8 },
                thursday: { taskId: 1, hours: 8 },
                friday: { taskId: 1, hours: 8 },
                saturday: { taskId: 1, hours: 0 },
                sunday: { taskId: 1, hours: 0 }
            },
            totalHours: 40,
            status: 'draft'
        };

        const validSubmitResponse = await axios.post('http://localhost:8080/api/timesheets', validTimesheetData, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Valid timesheet submission succeeded:', validSubmitResponse.data.id);

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