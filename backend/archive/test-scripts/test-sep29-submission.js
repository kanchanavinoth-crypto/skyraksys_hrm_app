const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';

async function testSep29Submission() {
    try {
        console.log('🔄 === TESTING SEP 29 - OCT 5, 2025 SUBMISSION ===\n');

        // Login first
        console.log('1. 🔐 Logging in...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@company.com',
            password: 'password123'
        });
        
        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }
        
        const token = loginResponse.data.data.accessToken;
        const userId = loginResponse.data.data.user.id;
        const employeeId = loginResponse.data.data.user.employeeId;
        
        console.log('✅ Login successful');
        console.log('   User ID:', userId);
        console.log('   Employee ID:', employeeId);
        
        const headers = { Authorization: `Bearer ${token}` };

        // Get available tasks
        console.log('\n2. 📋 Getting available tasks...');
        const tasksResponse = await axios.get(`${API_BASE}/tasks/available`, { headers });
        const availableTasks = tasksResponse.data.tasks;
        
        console.log('✅ Available tasks found:', availableTasks.length);
        if (availableTasks.length > 0) {
            console.log('   Sample tasks:');
            availableTasks.slice(0, 3).forEach((task, index) => {
                console.log(`   ${index + 1}. ${task.name} (Project: ${task.project?.name})`);
            });
        }

        // Clean up any existing timesheets for Sep 29 - Oct 5, 2025 first
        const weekStartDate = '2025-09-29';
        const weekEndDate = '2025-10-05';
        
        console.log('\n3. 🧹 Cleaning up existing timesheets for Sep 29 - Oct 5, 2025...');
        try {
            const existingResponse = await axios.get(`${API_BASE}/timesheets/weekly?weekStartDate=${weekStartDate}`, { headers });
            const existingTimesheets = existingResponse.data.timesheets || [];
            
            if (existingTimesheets.length > 0) {
                console.log(`   Found ${existingTimesheets.length} existing timesheet(s), cleaning up...`);
                for (const timesheet of existingTimesheets) {
                    await axios.delete(`${API_BASE}/timesheets/${timesheet.id}`, { headers });
                    console.log('   ✅ Deleted existing timesheet:', timesheet.id);
                }
            } else {
                console.log('   ✅ No existing timesheets to clean up');
            }
        } catch (error) {
            console.log('   ℹ️  No existing timesheets found (expected for new week)');
        }

        // Create 2 timesheets for the same week (Sep 29 - Oct 5, 2025)
        console.log('\n4. 📝 Creating 2 timesheets for Sep 29 - Oct 5, 2025...');
        const timesheetIds = [];
        
        if (availableTasks.length < 2) {
            throw new Error(`Need at least 2 available tasks, found ${availableTasks.length}`);
        }
        
        for (let i = 0; i < 2; i++) {
            const task = availableTasks[i];
            
            const timesheetData = {
                projectId: task.projectId,
                taskId: task.id,
                weekStartDate: weekStartDate,
                weekEndDate: weekEndDate,
                year: 2025,
                hoursWorked: {
                    monday: i === 0 ? 8 : 0,
                    tuesday: i === 1 ? 8 : 0,
                    wednesday: 0,
                    thursday: 0,
                    friday: 0,
                    saturday: 0,
                    sunday: 0
                },
                totalHoursWorked: 8,
                description: `Test timesheet ${i + 1} for Sep 29-Oct 5, 2025 - Task: ${task.name}`,
                status: 'Draft'
            };
            
            console.log(`\n   📋 Creating timesheet ${i + 1} for task: ${task.name}`);
            console.log('   📊 Timesheet data:', JSON.stringify(timesheetData, null, 4));
            
            try {
                const createResponse = await axios.post(`${API_BASE}/timesheets`, timesheetData, { headers });
                
                if (createResponse.data.success) {
                    timesheetIds.push(createResponse.data.timesheet.id);
                    console.log(`   ✅ Timesheet ${i + 1} created successfully`);
                    console.log(`      ID: ${createResponse.data.timesheet.id}`);
                    console.log(`      Status: ${createResponse.data.timesheet.status}`);
                } else {
                    console.log(`   ❌ Failed to create timesheet ${i + 1}:`, createResponse.data.message);
                    console.log(`      Response:`, JSON.stringify(createResponse.data, null, 2));
                }
            } catch (error) {
                console.log(`   💥 Error creating timesheet ${i + 1}:`, error.response?.data || error.message);
                if (error.response?.data) {
                    console.log(`      Full error response:`, JSON.stringify(error.response.data, null, 2));
                }
            }
        }

        console.log(`\n📈 Created ${timesheetIds.length} timesheets total`);

        if (timesheetIds.length === 0) {
            console.log('❌ No timesheets were created successfully. Cannot proceed with submission test.');
            return;
        }

        // Test individual submission (should fail with multiple tasks)
        if (timesheetIds.length > 1) {
            console.log('\n5. 🚫 Testing individual submission (should fail with multiple tasks)...');
            try {
                console.log(`   Attempting to submit timesheet: ${timesheetIds[0]}`);
                const submitResponse = await axios.put(`${API_BASE}/timesheets/${timesheetIds[0]}/submit`, {}, { headers });
                console.log('❌ Individual submission should have failed but succeeded:', submitResponse.data);
            } catch (error) {
                if (error.response && error.response.data.requiresBulkSubmission) {
                    console.log('   ✅ Individual submission correctly blocked for multiple tasks');
                    console.log('   📝 Message:', error.response.data.message);
                    console.log('   📊 Task Count:', error.response.data.taskCount);
                } else {
                    console.log('   ❌ Unexpected error in individual submission:', error.response?.data || error.message);
                }
            }
        }

        // Test bulk submission (should succeed)
        console.log('\n6. 📤 Testing bulk submission...');
        try {
            console.log(`   Submitting ${timesheetIds.length} timesheets in bulk`);
            console.log(`   Timesheet IDs:`, timesheetIds);
            
            const bulkSubmitData = {
                timesheetIds: timesheetIds,
                weekStartDate: weekStartDate
            };
            
            console.log('   📊 Bulk submit payload:', JSON.stringify(bulkSubmitData, null, 2));
            
            const bulkSubmitResponse = await axios.post(`${API_BASE}/timesheets/bulk-submit`, bulkSubmitData, { headers });
            
            if (bulkSubmitResponse.data.success) {
                console.log('   ✅ Bulk submission successful');
                console.log('   📈 Submitted timesheets:', bulkSubmitResponse.data.results.length);
                bulkSubmitResponse.data.results.forEach((result, index) => {
                    console.log(`      ${index + 1}. ${result.success ? '✅' : '❌'} ${result.timesheetId}: ${result.message}`);
                });
            } else {
                console.log('   ❌ Bulk submission failed:', bulkSubmitResponse.data.message);
                console.log('   📄 Full response:', JSON.stringify(bulkSubmitResponse.data, null, 2));
            }
        } catch (error) {
            console.log('   💥 Bulk submission error:', error.response?.data || error.message);
            if (error.response?.data) {
                console.log('   📄 Full error response:', JSON.stringify(error.response.data, null, 2));
            }
        }

        // Verify final status
        console.log('\n7. 🔍 Verifying final timesheet status...');
        try {
            const finalResponse = await axios.get(`${API_BASE}/timesheets/weekly?weekStartDate=${weekStartDate}`, { headers });
            const finalTimesheets = finalResponse.data.timesheets || [];
            
            console.log(`   📊 Final verification: ${finalTimesheets.length} timesheets for Sep 29 - Oct 5, 2025`);
            finalTimesheets.forEach((timesheet, index) => {
                console.log(`      ${index + 1}. Status: ${timesheet.status}`);
                console.log(`         Task: ${timesheet.task?.name}`);
                console.log(`         Project: ${timesheet.project?.name}`);
                console.log(`         Hours: ${timesheet.totalHoursWorked}`);
                if (timesheet.submittedAt) {
                    console.log(`         Submitted: ${new Date(timesheet.submittedAt).toLocaleString()}`);
                }
            });
        } catch (error) {
            console.log('   ❌ Error verifying final status:', error.response?.data || error.message);
        }

        console.log('\n🎉 === SEP 29 - OCT 5, 2025 SUBMISSION TEST COMPLETED ===');

    } catch (error) {
        console.error('💥 Test failed:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('📄 Full error response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testSep29Submission();