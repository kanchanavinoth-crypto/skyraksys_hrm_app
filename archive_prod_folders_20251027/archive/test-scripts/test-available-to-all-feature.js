/**
 * Comprehensive Test for "Available to All Employees" Feature
 * Tests the complete workflow of creating tasks with availableToAll checkbox
 */

const http = require('http');

// Configuration
const API_BASE = 'localhost:8080';
const ADMIN_CREDENTIALS = {
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t'
};

let authToken = '';
let testProjectId = '';

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
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || responseData}`));
                    }
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

// Login function
async function login() {
    console.log('🔐 Logging in as admin...');
    
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    try {
        const response = await makeRequest(options, ADMIN_CREDENTIALS);
        authToken = response.accessToken;
        console.log('✅ Login successful');
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        return false;
    }
}

// Get first available project
async function getTestProject() {
    console.log('📂 Getting test project...');
    
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/projects',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    try {
        const response = await makeRequest(options);
        if (response.success && response.data.length > 0) {
            testProjectId = response.data[0].id;
            console.log(`✅ Using project: ${response.data[0].name} (ID: ${testProjectId})`);
            return true;
        } else {
            console.log('❌ No projects found, creating one...');
            return await createTestProject();
        }
    } catch (error) {
        console.error('❌ Failed to get projects:', error.message);
        return false;
    }
}

// Create a test project if needed
async function createTestProject() {
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/projects',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    const projectData = {
        name: 'Available-to-All Test Project',
        description: 'Test project for testing available-to-all feature',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'Active'
    };
    
    try {
        const response = await makeRequest(options, projectData);
        if (response.success) {
            testProjectId = response.data.id;
            console.log(`✅ Created test project: ${response.data.name} (ID: ${testProjectId})`);
            return true;
        }
    } catch (error) {
        console.error('❌ Failed to create test project:', error.message);
        return false;
    }
}

// Test 1: Create task with availableToAll = true
async function testCreateAvailableToAllTask() {
    console.log('\n🧪 TEST 1: Creating task with availableToAll = true');
    
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/tasks',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    const taskData = {
        name: 'Available to All Test Task',
        description: 'This task should be available to all employees',
        projectId: testProjectId,
        availableToAll: true,
        status: 'Not Started',
        priority: 'Medium',
        estimatedHours: 10
    };
    
    try {
        const response = await makeRequest(options, taskData);
        if (response.success) {
            console.log('✅ Task created successfully');
            console.log(`   - Task ID: ${response.data.id}`);
            console.log(`   - Available to All: ${response.data.availableToAll}`);
            console.log(`   - Assigned To: ${response.data.assignedTo || 'None (as expected)'}`);
            
            // Verify the task was created correctly
            if (response.data.availableToAll === true && response.data.assignedTo === null) {
                console.log('✅ Task correctly created with availableToAll=true and no assignment');
                return response.data.id;
            } else {
                console.log('❌ Task not created correctly - availableToAll or assignment mismatch');
                return null;
            }
        } else {
            console.log('❌ Failed to create task:', response.message);
            return null;
        }
    } catch (error) {
        console.error('❌ Error creating task:', error.message);
        return null;
    }
}

// Test 2: Create task with availableToAll = false and specific assignment
async function testCreateAssignedTask() {
    console.log('\n🧪 TEST 2: Creating task with availableToAll = false and specific assignment');
    
    // First get an employee to assign to
    const employeeOptions = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/employees',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    try {
        const employeeResponse = await makeRequest(employeeOptions);
        if (!employeeResponse.success || employeeResponse.data.length === 0) {
            console.log('❌ No employees found to assign task to');
            return null;
        }
        
        const assigneeId = employeeResponse.data[0].id;
        console.log(`   Using employee: ${employeeResponse.data[0].firstName} ${employeeResponse.data[0].lastName} (ID: ${assigneeId})`);
        
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/api/tasks',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        };
        
        const taskData = {
            name: 'Assigned Task Test',
            description: 'This task should be assigned to a specific employee',
            projectId: testProjectId,
            assignedTo: assigneeId,
            availableToAll: false,
            status: 'Not Started',
            priority: 'Medium',
            estimatedHours: 8
        };
        
        const response = await makeRequest(options, taskData);
        if (response.success) {
            console.log('✅ Assigned task created successfully');
            console.log(`   - Task ID: ${response.data.id}`);
            console.log(`   - Available to All: ${response.data.availableToAll}`);
            console.log(`   - Assigned To: ${response.data.assignedTo}`);
            
            // Verify the task was created correctly
            if (response.data.availableToAll === false && response.data.assignedTo === assigneeId) {
                console.log('✅ Task correctly created with specific assignment');
                return response.data.id;
            } else {
                console.log('❌ Task not created correctly - assignment mismatch');
                return null;
            }
        } else {
            console.log('❌ Failed to create assigned task:', response.message);
            return null;
        }
    } catch (error) {
        console.error('❌ Error creating assigned task:', error.message);
        return null;
    }
}

// Test 3: Update task from assigned to availableToAll
async function testUpdateToAvailableToAll(taskId) {
    console.log('\n🧪 TEST 3: Updating task from assigned to availableToAll = true');
    
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: `/api/tasks/${taskId}`,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    const updateData = {
        availableToAll: true
    };
    
    try {
        const response = await makeRequest(options, updateData);
        if (response.success) {
            console.log('✅ Task updated successfully');
            console.log(`   - Available to All: ${response.data.availableToAll}`);
            console.log(`   - Assigned To: ${response.data.assignedTo || 'None (as expected)'}`);
            
            // Verify the assignment was cleared when availableToAll was set to true
            if (response.data.availableToAll === true && response.data.assignedTo === null) {
                console.log('✅ Task correctly updated - assignment cleared when availableToAll set to true');
                return true;
            } else {
                console.log('❌ Task update failed - assignment not cleared');
                return false;
            }
        } else {
            console.log('❌ Failed to update task:', response.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error updating task:', error.message);
        return false;
    }
}

// Test 4: Verify task access validation
async function testTaskAccessValidation(availableToAllTaskId) {
    console.log('\n🧪 TEST 4: Testing task access validation');
    
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: `/api/tasks/${availableToAllTaskId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    try {
        const response = await makeRequest(options);
        if (response.success) {
            console.log('✅ Task retrieved successfully');
            console.log(`   - Task Name: ${response.data.name}`);
            console.log(`   - Available to All: ${response.data.availableToAll}`);
            
            if (response.data.availableToAll === true) {
                console.log('✅ Task is correctly marked as available to all employees');
                return true;
            } else {
                console.log('❌ Task availableToAll flag is incorrect');
                return false;
            }
        } else {
            console.log('❌ Failed to retrieve task:', response.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error retrieving task:', error.message);
        return false;
    }
}

// Main test execution
async function runTests() {
    console.log('🚀 Starting Available-to-All Feature Tests\n');
    
    let testResults = {
        login: false,
        project: false,
        createAvailableToAll: false,
        createAssigned: false,
        updateToAvailableToAll: false,
        accessValidation: false
    };
    
    // Test login
    testResults.login = await login();
    if (!testResults.login) {
        console.log('\n❌ Cannot continue tests without authentication');
        return;
    }
    
    // Get or create test project
    testResults.project = await getTestProject();
    if (!testResults.project) {
        console.log('\n❌ Cannot continue tests without a project');
        return;
    }
    
    // Test 1: Create availableToAll task
    const availableToAllTaskId = await testCreateAvailableToAllTask();
    testResults.createAvailableToAll = availableToAllTaskId !== null;
    
    // Test 2: Create assigned task
    const assignedTaskId = await testCreateAssignedTask();
    testResults.createAssigned = assignedTaskId !== null;
    
    // Test 3: Update assigned task to availableToAll
    if (assignedTaskId) {
        testResults.updateToAvailableToAll = await testUpdateToAvailableToAll(assignedTaskId);
    }
    
    // Test 4: Verify task access validation
    if (availableToAllTaskId) {
        testResults.accessValidation = await testTaskAccessValidation(availableToAllTaskId);
    }
    
    // Print test results summary
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`✅ Login: ${testResults.login ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Project Setup: ${testResults.project ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Create Available-to-All Task: ${testResults.createAvailableToAll ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Create Assigned Task: ${testResults.createAssigned ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Update to Available-to-All: ${testResults.updateToAvailableToAll ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Access Validation: ${testResults.accessValidation ? 'PASS' : 'FAIL'}`);
    
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.values(testResults).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! The "Available to All Employees" feature is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the implementation.');
    }
}

// Run the tests
runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
});