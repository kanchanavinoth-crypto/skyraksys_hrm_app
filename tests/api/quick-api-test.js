/**
 * Quick API Test Runner for HRM System
 * Simplified version for immediate execution and testing
 */

const axios = require('axios');

// Configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    USERS: {
        admin: { email: 'admin@company.com', password: 'Kx9mP7qR2nF8sA5t' },
        hr: { email: 'hr@company.com', password: 'Lw3nQ6xY8mD4vB7h' },
        manager: { email: 'hr@company.com', password: 'Lw3nQ6xY8mD4vB7h' }, // Using HR as manager for testing
        employee: { email: 'employee@company.com', password: 'Mv4pS9wE2nR6kA8j' }
    },
    TIMEOUT: 10000
};

class QuickAPITester {
    constructor() {
        this.tokens = {};
        this.results = { passed: 0, failed: 0, total: 0 };
    }

    log(message, emoji = '📝') {
        console.log(`${emoji} ${message}`);
    }

    async request(method, endpoint, data = null, token = null) {
        try {
            const config = {
                method,
                url: `${CONFIG.API_BASE_URL}${endpoint}`,
                timeout: CONFIG.TIMEOUT,
                headers: {}
            };

            if (token) config.headers.Authorization = `Bearer ${token}`;
            if (data) {
                config.data = data;
                config.headers['Content-Type'] = 'application/json';
            }

            const response = await axios(config);
            return { success: true, data: response.data, status: response.status };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                status: error.response?.status || 500
            };
        }
    }

    test(name, passed, details = '') {
        this.results.total++;
        if (passed) {
            this.results.passed++;
            this.log(`✅ ${name} ${details}`, '✅');
        } else {
            this.results.failed++;
            this.log(`❌ ${name} ${details}`, '❌');
        }
    }

    async authenticateAll() {
        this.log('🔐 Testing Authentication...', '🔐');
        
        for (const [role, creds] of Object.entries(CONFIG.USERS)) {
            const result = await this.request('POST', '/auth/login', creds);
            if (result.success && result.data.data.accessToken) {
                this.tokens[role] = result.data.data.accessToken;
                this.test(`Login as ${role}`, true, `(User ID: ${result.data.data.user.id})`);
            } else {
                this.test(`Login as ${role}`, false, `(Error: ${result.error})`);
            }
        }
    }

    async testHealthCheck() {
        this.log('🏥 Testing System Health...', '🏥');
        
        const result = await this.request('GET', '/health');
        this.test('Health Check', result.success, result.success ? `(${result.data.status})` : `(${result.error})`);
    }

    async testEmployeeWorkflows() {
        this.log('👥 Testing Employee Workflows...', '👥');
        
        // Create employee
        const newEmployee = {
            firstName: 'API',
            lastName: 'Test',
            email: `apitest.${Date.now()}@company.com`,
            phone: '555-9999',
            position: 'QA Tester',
            department: 'IT',
            hireDate: new Date().toISOString().split('T')[0],
            salary: 70000,
            status: 'active'
        };

        const createResult = await this.request('POST', '/employees', newEmployee, this.tokens.admin);
        this.test('Create Employee (Admin)', createResult.success, 
            createResult.success ? `(ID: ${createResult.data.data?.id})` : `(${createResult.error})`);

        // Test unauthorized creation
        const unauthorizedResult = await this.request('POST', '/employees', newEmployee, this.tokens.employee);
        this.test('Block Unauthorized Employee Creation', !unauthorizedResult.success && unauthorizedResult.status === 403);

        // List employees
        const listResult = await this.request('GET', '/employees', null, this.tokens.hr);
        this.test('List Employees (HR)', listResult.success, 
            listResult.success ? `(Count: ${listResult.data.data?.length})` : `(${listResult.error})`);

        return createResult.success ? createResult.data.data : null;
    }

    async testTimesheetWorkflows() {
        this.log('⏰ Testing Timesheet Workflows...', '⏰');

        // Create project first
        const project = {
            name: `Quick Test Project ${Date.now()}`,
            description: 'Project for quick API testing',
            startDate: new Date().toISOString().split('T')[0],
            status: 'active'
        };

        const projectResult = await this.request('POST', '/projects', project, this.tokens.admin);
        this.test('Create Project', projectResult.success);

        // Create task
        const task = {
            title: `Quick Test Task ${Date.now()}`,
            description: 'Task for quick API testing',
            projectId: projectResult.data?.data?.id,
            status: 'active'
        };

        const taskResult = await this.request('POST', '/tasks', task, this.tokens.admin);
        this.test('Create Task', taskResult.success);

        // Create timesheet
        const timesheet = {
            workDate: new Date().toISOString().split('T')[0],
            hoursWorked: 8.0,
            description: 'Quick API testing work',
            projectId: projectResult.data?.data?.id,
            taskId: taskResult.data?.data?.id
        };

        const timesheetResult = await this.request('POST', '/timesheets', timesheet, this.tokens.employee);
        this.test('Create Timesheet (Employee)', timesheetResult.success);

        // List timesheets
        const listResult = await this.request('GET', '/timesheets', null, this.tokens.manager);
        this.test('List Timesheets (Manager)', listResult.success);

        // Approve timesheet
        if (timesheetResult.success) {
            const timesheetId = timesheetResult.data.data?.id;
            const approvalData = { status: 'approved', comments: 'Quick test approval' };
            const approvalResult = await this.request('PUT', `/timesheets/${timesheetId}/status`, approvalData, this.tokens.manager);
            this.test('Approve Timesheet (Manager)', approvalResult.success);
        }

        return { project: projectResult.data?.data, task: taskResult.data?.data, timesheet: timesheetResult.data?.data };
    }

    async testLeaveWorkflows() {
        this.log('🏖️ Testing Leave Workflows...', '🏖️');

        // Get leave types
        const typesResult = await this.request('GET', '/leave/meta/types', null, this.tokens.employee);
        this.test('Get Leave Types', typesResult.success);

        // Get leave balance
        const balanceResult = await this.request('GET', '/leave/meta/balance', null, this.tokens.employee);
        this.test('Get Leave Balance', balanceResult.success);

        // Create leave request
        const leaveRequest = {
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            leaveType: 'Annual Leave',
            reason: 'Quick test leave request',
            totalDays: 3
        };

        const createResult = await this.request('POST', '/leave', leaveRequest, this.tokens.employee);
        this.test('Create Leave Request (Employee)', createResult.success);

        // List leave requests
        const listResult = await this.request('GET', '/leave', null, this.tokens.manager);
        this.test('List Leave Requests (Manager)', listResult.success);

        // Approve leave
        if (createResult.success) {
            const leaveId = createResult.data.data?.id;
            const approvalData = { status: 'approved', comments: 'Quick test approval' };
            const approvalResult = await this.request('PUT', `/leave/${leaveId}/status`, approvalData, this.tokens.manager);
            this.test('Approve Leave Request (Manager)', approvalResult.success);
        }

        return createResult.data?.data;
    }

    async testPayrollWorkflows() {
        this.log('💰 Testing Payroll Workflows...', '💰');

        // Test payroll creation
        const payrollData = {
            payPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            payPeriodEnd: new Date().toISOString().split('T')[0],
            description: 'Quick test payroll run'
        };

        const createResult = await this.request('POST', '/payrolls', payrollData, this.tokens.admin);
        this.test('Create Payroll (Admin)', createResult.success);

        // List payrolls
        const listResult = await this.request('GET', '/payrolls', null, this.tokens.hr);
        this.test('List Payrolls (HR)', listResult.success);

        // Test employee access (should be restricted)
        const employeeAccessResult = await this.request('GET', '/payrolls', null, this.tokens.employee);
        this.test('Block Employee Payroll Access', !employeeAccessResult.success && employeeAccessResult.status === 403);

        return createResult.data?.data;
    }

    async testRoleBasedAccess() {
        this.log('🔒 Testing Role-Based Access Control...', '🔒');

        // Test admin access to employees
        const adminEmployeeAccess = await this.request('GET', '/employees', null, this.tokens.admin);
        this.test('Admin Employee Access', adminEmployeeAccess.success);

        // Test HR access to employees
        const hrEmployeeAccess = await this.request('GET', '/employees', null, this.tokens.hr);
        this.test('HR Employee Access', hrEmployeeAccess.success);

        // Test manager access to timesheets
        const managerTimesheetAccess = await this.request('GET', '/timesheets', null, this.tokens.manager);
        this.test('Manager Timesheet Access', managerTimesheetAccess.success);

        // Test employee limited access
        const employeeProfileAccess = await this.request('GET', '/auth/profile', null, this.tokens.employee);
        this.test('Employee Profile Access', employeeProfileAccess.success);
    }

    async testErrorHandling() {
        this.log('🚫 Testing Error Handling...', '🚫');

        // Test invalid token
        const invalidTokenResult = await this.request('GET', '/auth/profile', null, 'invalid-token');
        this.test('Invalid Token Rejection', !invalidTokenResult.success && invalidTokenResult.status === 401);

        // Test non-existent resource
        const notFoundResult = await this.request('GET', '/employees/99999', null, this.tokens.admin);
        this.test('Non-Existent Resource (404)', !notFoundResult.success && notFoundResult.status === 404);

        // Test malformed data
        const malformedData = { firstName: '', email: 'invalid' };
        const validationResult = await this.request('POST', '/employees', malformedData, this.tokens.admin);
        this.test('Data Validation', !validationResult.success && validationResult.status === 400);
    }

    async runQuickTests() {
        console.log('\n🚀 Starting Quick API Test Suite for HRM System...\n');
        
        const startTime = Date.now();

        try {
            await this.testHealthCheck();
            await this.authenticateAll();
            
            if (Object.keys(this.tokens).length > 0) {
                await this.testEmployeeWorkflows();
                await this.testTimesheetWorkflows();
                await this.testLeaveWorkflows();
                await this.testPayrollWorkflows();
                await this.testRoleBasedAccess();
                await this.testErrorHandling();
            } else {
                this.log('❌ Authentication failed, skipping workflow tests', '❌');
            }

        } catch (error) {
            this.log(`💥 Unexpected error: ${error.message}`, '💥');
        }

        const duration = (Date.now() - startTime) / 1000;
        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);

        console.log('\n📊 Quick Test Results:');
        console.log(`   Total Tests: ${this.results.total}`);
        console.log(`   Passed: ${this.results.passed}`);
        console.log(`   Failed: ${this.results.failed}`);
        console.log(`   Success Rate: ${successRate}%`);
        console.log(`   Duration: ${duration}s\n`);

        if (this.results.failed > 0) {
            console.log('❗ Some tests failed. Check the output above for details.');
        } else {
            console.log('🎉 All tests passed! Your API is working correctly.');
        }

        return this.results;
    }
}

// Execute if run directly
if (require.main === module) {
    const tester = new QuickAPITester();
    tester.runQuickTests()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Test runner failed:', error);
            process.exit(1);
        });
}

module.exports = QuickAPITester;
