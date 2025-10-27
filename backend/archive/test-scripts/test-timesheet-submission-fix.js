/**
 * Test script to verify timesheet submission fix
 */

const http = require('http');

// Configuration
const API_BASE = 'localhost:8080';
const EMPLOYEE_CREDENTIALS = {
    email: 'employee@company.com',
    password: 'Mv4pS9wE2nR6kA8j'
};

let authToken = '';

// Helper function to make API requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (error) {
                    reject(new Error(`Parse error: ${error.message}\nResponse: ${responseData.substring(0, 200)}`));
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testTimesheetWorkflow() {
    console.log('🧪 Testing Timesheet Submission Workflow Fix\n');
    
    // Step 1: Login as employee
    console.log('1. 🔐 Logging in as employee...');
    const loginOptions = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    try {
        const loginResponse = await makeRequest(loginOptions, EMPLOYEE_CREDENTIALS);
        if (loginResponse.status === 200 && loginResponse.data.accessToken) {
            authToken = loginResponse.data.accessToken;
            console.log('   ✅ Login successful\n');
        } else {
            console.log('   ❌ Login failed:', loginResponse.data.message);
            return;
        }
    } catch (error) {
        console.error('   ❌ Login error:', error.message);
        return;
    }
    
    // Step 2: Get available projects and tasks
    console.log('2. 📂 Getting projects and tasks...');
    const projectOptions = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/projects',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    let testProjectId = '';
    let testTaskId = '';
    
    try {
        const projectResponse = await makeRequest(projectOptions);
        if (projectResponse.status === 200 && projectResponse.data.success) {
            const projects = projectResponse.data.data;
            const projectWithTask = projects.find(p => p.tasks && p.tasks.length > 0);
            
            if (projectWithTask && projectWithTask.tasks[0]) {
                testProjectId = projectWithTask.id;
                testTaskId = projectWithTask.tasks[0].id;
                console.log(`   ✅ Using project: ${projectWithTask.name}`);
                console.log(`   ✅ Using task: ${projectWithTask.tasks[0].name}\n`);
            } else {
                console.log('   ❌ No projects with tasks found');
                return;
            }
        } else {
            console.log('   ❌ Failed to get projects');
            return;
        }
    } catch (error) {
        console.error('   ❌ Error getting projects:', error.message);
        return;
    }
    
    // Step 3: Create weekly timesheet (correct format)
    console.log('3. 📝 Creating weekly timesheet...');
    const timesheetOptions = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/timesheets',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    // Get Monday of current week
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    const weekStartDate = monday.toISOString().split('T')[0];
    
    const timesheetData = {
        projectId: testProjectId,
        taskId: testTaskId,
        weekStartDate: weekStartDate,
        mondayHours: 8,
        tuesdayHours: 8,
        wednesdayHours: 8,
        thursdayHours: 8,
        fridayHours: 8,
        saturdayHours: 0,
        sundayHours: 0,
        description: 'Weekly timesheet submission test'
    };
    
    let timesheetId = '';
    
    try {
        const timesheetResponse = await makeRequest(timesheetOptions, timesheetData);
        if (timesheetResponse.status === 201 && timesheetResponse.data.success) {
            timesheetId = timesheetResponse.data.data.id;
            console.log(`   ✅ Timesheet created successfully`);
            console.log(`   📋 Timesheet ID: ${timesheetId}`);
            console.log(`   📊 Total Hours: ${timesheetResponse.data.data.totalHoursWorked}`);
            console.log(`   📅 Status: ${timesheetResponse.data.data.status}\n`);
        } else {
            console.log('   ❌ Failed to create timesheet:', timesheetResponse.data.message);
            if (timesheetResponse.data.errors) {
                timesheetResponse.data.errors.forEach(err => {
                    console.log(`      - ${err.field}: ${err.message}`);
                });
            }
            return;
        }
    } catch (error) {
        console.error('   ❌ Error creating timesheet:', error.message);
        return;
    }
    
    // Step 4: Submit timesheet for approval
    console.log('4. 🚀 Submitting timesheet for approval...');
    const submitOptions = {
        hostname: 'localhost',
        port: 8080,
        path: `/api/timesheets/${timesheetId}/submit`,
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    try {
        const submitResponse = await makeRequest(submitOptions);
        if (submitResponse.status === 200 && submitResponse.data.success) {
            console.log('   ✅ Timesheet submitted successfully!');
            console.log(`   📩 Message: ${submitResponse.data.message}\n`);
        } else {
            console.log('   ❌ Failed to submit timesheet:', submitResponse.data.message);
            return;
        }
    } catch (error) {
        console.error('   ❌ Error submitting timesheet:', error.message);
        return;
    }
    
    // Step 5: Verify submission
    console.log('5. ✅ Verifying submission...');
    const verifyOptions = {
        hostname: 'localhost',
        port: 8080,
        path: `/api/timesheets/${timesheetId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    try {
        const verifyResponse = await makeRequest(verifyOptions);
        if (verifyResponse.status === 200 && verifyResponse.data.success) {
            const timesheet = verifyResponse.data.data;
            console.log(`   📋 Final Status: ${timesheet.status}`);
            console.log(`   📅 Submitted At: ${timesheet.submittedAt}`);
            console.log(`   📊 Total Hours: ${timesheet.totalHoursWorked}\n`);
            
            if (timesheet.status === 'Submitted') {
                console.log('🎉 SUCCESS: Timesheet submission workflow is working correctly!');
                console.log('✅ The frontend timesheet submission fix has resolved the issue.');
            } else {
                console.log('❌ ISSUE: Timesheet was not properly submitted');
            }
        } else {
            console.log('   ❌ Failed to verify timesheet');
        }
    } catch (error) {
        console.error('   ❌ Error verifying timesheet:', error.message);
    }
}

// Run the test
testTimesheetWorkflow().catch(error => {
    console.error('❌ Test execution failed:', error);
});