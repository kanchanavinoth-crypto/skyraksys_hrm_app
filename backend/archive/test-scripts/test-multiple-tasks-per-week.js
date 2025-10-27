const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';

// Test the new multiple task per week functionality
async function testMultipleTasksPerWeek() {
    try {
        console.log('🔄 Testing Multiple Tasks Per Week Functionality...\n');

        // First, login as an employee
        console.log('1. Logging in as test employee...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'john.employee@company.com',
            password: 'password123'
        });
        
        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }
        
        const token = loginResponse.data.token;
        const employeeId = loginResponse.data.employee.id;
        
        console.log('✅ Login successful');
        console.log('   Employee:', loginResponse.data.employee.firstName, loginResponse.data.employee.lastName);
        console.log('   Employee ID:', employeeId);
        
        const headers = { Authorization: `Bearer ${token}` };

        // Get available tasks
        console.log('\n2. Getting available tasks...');
        const tasksResponse = await axios.get(`${API_BASE}/tasks/available`, { headers });
        const availableTasks = tasksResponse.data.tasks;
        
        console.log('✅ Available tasks found:', availableTasks.length);
        availableTasks.slice(0, 3).forEach((task, index) => {
            console.log(`   ${index + 1}. ${task.name} (Project: ${task.project?.name})`);
        });

        // Define the week we want to test (July 28 - August 3, 2025)
        const weekStartDate = '2025-07-28';
        const weekEndDate = '2025-08-03';

        // Delete any existing timesheets for this week first
        console.log('\n3. Cleaning up existing timesheets for the test week...');
        try {
            const existingResponse = await axios.get(`${API_BASE}/timesheets/weekly?weekStartDate=${weekStartDate}`, { headers });
            const existingTimesheets = existingResponse.data.timesheets || [];
            
            for (const timesheet of existingTimesheets) {
                await axios.delete(`${API_BASE}/timesheets/${timesheet.id}`, { headers });
                console.log('   Deleted existing timesheet:', timesheet.id);
            }
        } catch (error) {
            console.log('   No existing timesheets to clean up');
        }

        // Create 3 timesheets for the same week with different tasks
        console.log('\n4. Creating 3 timesheets for the same week...');
        const timesheetIds = [];
        
        for (let i = 0; i < 3; i++) {
            const task = availableTasks[i];
            if (!task) {
                throw new Error(`Not enough available tasks. Need at least 3, found ${availableTasks.length}`);
            }
            
            const timesheetData = {
                projectId: task.projectId,
                taskId: task.id,
                weekStartDate: weekStartDate,
                weekEndDate: weekEndDate,
                year: 2025,
                hoursWorked: {
                    monday: i === 0 ? 8 : 0,
                    tuesday: i === 1 ? 8 : 0,
                    wednesday: i === 2 ? 8 : 0,
                    thursday: 0,
                    friday: 0,
                    saturday: 0,
                    sunday: 0
                },
                totalHoursWorked: 8,
                description: `Test timesheet ${i + 1} for task: ${task.name}`,
                status: 'Draft'
            };
            
            console.log(`   Creating timesheet ${i + 1} for task: ${task.name}`);
            const createResponse = await axios.post(`${API_BASE}/timesheets`, timesheetData, { headers });
            
            if (createResponse.data.success) {
                timesheetIds.push(createResponse.data.timesheet.id);
                console.log(`   ✅ Timesheet ${i + 1} created successfully: ${createResponse.data.timesheet.id}`);
            } else {
                console.log(`   ❌ Failed to create timesheet ${i + 1}:`, createResponse.data.message);
            }
        }

        console.log(`\n✅ Successfully created ${timesheetIds.length} timesheets for the same week`);

        // Test individual submission (should fail for multiple tasks)
        if (timesheetIds.length > 1) {
            console.log('\n5. Testing individual submission (should fail with multiple tasks)...');
            try {
                const submitResponse = await axios.put(`${API_BASE}/timesheets/${timesheetIds[0]}/submit`, {}, { headers });
                console.log('❌ Individual submission should have failed but succeeded:', submitResponse.data);
            } catch (error) {
                if (error.response && error.response.data.requiresBulkSubmission) {
                    console.log('✅ Individual submission correctly blocked for multiple tasks');
                    console.log('   Message:', error.response.data.message);
                    console.log('   Task Count:', error.response.data.taskCount);
                } else {
                    console.log('❌ Unexpected error in individual submission:', error.response?.data || error.message);
                }
            }
        }

        // Test bulk submission (should succeed)
        console.log('\n6. Testing bulk submission (should succeed)...');
        try {
            const bulkSubmitResponse = await axios.post(`${API_BASE}/timesheets/bulk-submit`, {
                timesheetIds: timesheetIds,
                weekStartDate: weekStartDate
            }, { headers });
            
            if (bulkSubmitResponse.data.success) {
                console.log('✅ Bulk submission successful');
                console.log('   Submitted timesheets:', bulkSubmitResponse.data.results.length);
                bulkSubmitResponse.data.results.forEach((result, index) => {
                    console.log(`   ${index + 1}. ${result.success ? '✅' : '❌'} ${result.timesheetId}: ${result.message}`);
                });
            } else {
                console.log('❌ Bulk submission failed:', bulkSubmitResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Bulk submission error:', error.response?.data || error.message);
        }

        // Verify final status
        console.log('\n7. Verifying final timesheet status...');
        const finalResponse = await axios.get(`${API_BASE}/timesheets/weekly?weekStartDate=${weekStartDate}`, { headers });
        const finalTimesheets = finalResponse.data.timesheets || [];
        
        console.log(`✅ Final verification: ${finalTimesheets.length} timesheets for the week`);
        finalTimesheets.forEach((timesheet, index) => {
            console.log(`   ${index + 1}. Status: ${timesheet.status}, Task: ${timesheet.task?.name}, Project: ${timesheet.project?.name}`);
        });

        console.log('\n🎉 Multiple tasks per week test completed successfully!');

    } catch (error) {
        console.error('💥 Test failed:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testMultipleTasksPerWeek();