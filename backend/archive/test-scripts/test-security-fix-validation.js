const axios = require('axios');

// Test script to validate the security fix for task availability
const BASE_URL = 'http://localhost:8080/api';
const TEST_CREDENTIALS = {
    email: 'employee@company.com',
    password: 'Mv4pS9wE2nR6kA8j'  // Updated password from server output
};

async function testSecurityFix() {
    console.log('🔒 TESTING TASK AVAILABILITY SECURITY FIX');
    console.log('===========================================\n');

    try {
        // Step 1: Login to get token
        console.log('1. Logging in as employee...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
        const token = loginResponse.data.data.accessToken;
        const employeeId = loginResponse.data.data.user.employeeId;
        console.log(`✅ Login successful - Employee ID: ${employeeId}\n`);

        const headers = { Authorization: `Bearer ${token}` };

        // Step 2: Get available tasks
        console.log('2. Fetching available tasks...');
        const tasksResponse = await axios.get(`${BASE_URL}/tasks`, { headers });
        const tasks = tasksResponse.data.data || [];
        console.log(`📋 Found ${tasks.length} tasks\n`);

        // Display task availability status
        tasks.forEach((task, index) => {
            console.log(`Task ${index + 1}: ${task.name}`);
            console.log(`  - Available to all: ${task.availableToAll}`);
            console.log(`  - Assigned to: ${task.assignedTo || 'None'}`);
            console.log(`  - Can employee access: ${task.availableToAll || task.assignedTo === employeeId}\n`);
        });

        // Step 3: Test timesheet creation with different task types
        console.log('3. Testing timesheet creation with task access validation...\n');

        for (const task of tasks.slice(0, 3)) { // Test first 3 tasks
            console.log(`Testing task: ${task.name}`);
            console.log(`Available to all: ${task.availableToAll}, Assigned to: ${task.assignedTo}`);
            
            const canAccess = task.availableToAll || task.assignedTo === employeeId;
            console.log(`Expected result: ${canAccess ? 'ALLOWED' : 'BLOCKED'}`);

            try {
                const timesheetData = {
                    projectId: task.projectId,
                    taskId: task.id,
                    weekStartDate: '2024-01-01',
                    mondayHours: 8,
                    tuesdayHours: 8,
                    wednesdayHours: 8,
                    thursdayHours: 8,
                    fridayHours: 8,
                    description: `Test timesheet for ${task.name}`
                };

                const response = await axios.post(`${BASE_URL}/timesheets`, timesheetData, { headers });
                
                if (canAccess) {
                    console.log(`✅ CORRECT: Timesheet creation allowed (${response.status})\n`);
                } else {
                    console.log(`❌ SECURITY BUG: Timesheet creation should have been blocked but was allowed!\n`);
                }
            } catch (error) {
                if (!canAccess && error.response?.status === 403) {
                    console.log(`✅ CORRECT: Timesheet creation blocked (403 Forbidden)\n`);
                } else if (canAccess) {
                    console.log(`❌ ERROR: Timesheet creation should have been allowed but failed: ${error.response?.data?.message}\n`);
                } else {
                    console.log(`⚠️  Unexpected error: ${error.response?.data?.message}\n`);
                }
            }
        }

        console.log('🔒 SECURITY TEST COMPLETED');
        console.log('=========================');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Helper function to test the validation helper directly
function testValidationHelper() {
    console.log('\n🧪 TESTING VALIDATION HELPER LOGIC');
    console.log('=====================================\n');

    // Mock validation function (copy from routes)
    function validateTaskAccess(task, employeeId, context = 'operation') {
        if (!task) {
            return { 
                allowed: false, 
                message: 'Task not found or invalid.' 
            };
        }

        if (task.availableToAll) {
            return { allowed: true };
        }

        if (!task.assignedTo) {
            return { 
                allowed: false, 
                message: 'This task is not available to any employees. Please contact your manager.' 
            };
        }

        const taskAssignedTo = task.assignedTo.toString();
        const currentEmployeeId = employeeId.toString();

        if (taskAssignedTo === currentEmployeeId) {
            return { allowed: true };
        }

        return { 
            allowed: false, 
            message: `You are not authorized to work on this task during ${context}. Please contact your manager.` 
        };
    }

    // Test cases
    const testCases = [
        {
            name: 'Task available to all',
            task: { availableToAll: true, assignedTo: 'other-employee-id' },
            employeeId: 'test-employee-id',
            expected: true
        },
        {
            name: 'Task assigned to current employee (UUID)',
            task: { availableToAll: false, assignedTo: '123e4567-e89b-12d3-a456-426614174000' },
            employeeId: '123e4567-e89b-12d3-a456-426614174000',
            expected: true
        },
        {
            name: 'Task assigned to current employee (string)',
            task: { availableToAll: false, assignedTo: 'test-employee-id' },
            employeeId: 'test-employee-id',
            expected: true
        },
        {
            name: 'Task assigned to other employee',
            task: { availableToAll: false, assignedTo: 'other-employee-id' },
            employeeId: 'test-employee-id',
            expected: false
        },
        {
            name: 'Task not assigned to anyone',
            task: { availableToAll: false, assignedTo: null },
            employeeId: 'test-employee-id',
            expected: false
        }
    ];

    testCases.forEach((testCase, index) => {
        const result = validateTaskAccess(testCase.task, testCase.employeeId);
        const passed = result.allowed === testCase.expected;
        
        console.log(`Test ${index + 1}: ${testCase.name}`);
        console.log(`Expected: ${testCase.expected ? 'ALLOWED' : 'BLOCKED'}`);
        console.log(`Result: ${result.allowed ? 'ALLOWED' : 'BLOCKED'}`);
        console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
        if (!result.allowed) {
            console.log(`Message: ${result.message}`);
        }
        console.log('');
    });
}

// Run tests
testValidationHelper();
if (process.argv.includes('--integration')) {
    testSecurityFix();
}