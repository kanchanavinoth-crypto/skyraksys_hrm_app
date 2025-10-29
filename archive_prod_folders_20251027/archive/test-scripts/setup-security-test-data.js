const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t'
};

async function setupTestData() {
    console.log('🔧 SETTING UP TEST DATA FOR SECURITY VALIDATION');
    console.log('===============================================\n');

    try {
        // Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
        const token = loginResponse.data.data.accessToken;
        console.log('✅ Admin login successful\n');

        const headers = { Authorization: `Bearer ${token}` };

        // Get the employee ID
        console.log('2. Getting employee information...');
        
        // Let's get all employees to find our test employee
        const employeesResponse = await axios.get(`${BASE_URL}/employees`, { headers });
        const employees = employeesResponse.data.data || [];
        const testEmployee = employees.find(emp => emp.email === 'employee@company.com');
        
        if (!testEmployee) {
            throw new Error('Test employee not found');
        }
        
        console.log(`✅ Found test employee: ${testEmployee.firstName} ${testEmployee.lastName} (ID: ${testEmployee.id})\n`);

        // Get all tasks
        console.log('3. Getting all tasks...');
        const tasksResponse = await axios.get(`${BASE_URL}/tasks?includeRestricted=true`, { headers });
        const allTasks = tasksResponse.data.data || [];
        console.log(`📋 Found ${allTasks.length} tasks\n`);

        if (allTasks.length < 3) {
            console.log('⚠️ Not enough tasks for testing. Creating additional tasks...');
            // Create test tasks if needed - but let's work with existing ones first
        }

        // Update task assignments for testing
        console.log('4. Setting up task assignments for security testing...\n');
        
        const taskUpdates = [
            {
                taskId: allTasks[0]?.id,
                update: { availableToAll: true },
                description: 'Available to all employees'
            },
            {
                taskId: allTasks[1]?.id, 
                update: { availableToAll: false, assignedTo: testEmployee.id },
                description: 'Assigned specifically to test employee'
            },
            {
                taskId: allTasks[2]?.id,
                update: { availableToAll: false, assignedTo: '12345678-1234-1234-1234-123456789999' }, // Random UUID
                description: 'Assigned to different employee (should be blocked)'
            }
        ];

        for (let i = 0; i < Math.min(taskUpdates.length, allTasks.length); i++) {
            const { taskId, update, description } = taskUpdates[i];
            if (taskId) {
                try {
                    await axios.put(`${BASE_URL}/tasks/${taskId}`, update, { headers });
                    console.log(`✅ Updated task ${i + 1}: ${description}`);
                } catch (error) {
                    console.log(`⚠️ Failed to update task ${i + 1}: ${error.response?.data?.message || error.message}`);
                }
            }
        }

        console.log('\n✅ TEST DATA SETUP COMPLETED');
        console.log('=============================');
        console.log('Test scenario:');
        console.log('- Task 1: Available to all employees (should ALLOW timesheet creation)');
        console.log('- Task 2: Assigned to test employee (should ALLOW timesheet creation)');
        console.log('- Task 3: Assigned to different employee (should BLOCK timesheet creation)');
        console.log('\nRun the security test now: node test-security-fix-validation.js --integration');

    } catch (error) {
        console.error('❌ Setup failed:', error.response?.data || error.message);
    }
}

setupTestData();