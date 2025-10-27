const axios = require('axios');
const fs = require('fs');

class ComprehensiveUserRoleTest {
    constructor() {
        this.baseURL = 'http://localhost:8080/api';
        this.users = {
            admin: { email: 'admin@company.com', password: 'Kx9mP7qR2nF8sA5t', role: 'admin' },
            hr: { email: 'hr@company.com', password: 'Lw3nQ6xY8mD4vB7h', role: 'hr' },
            employee: { email: 'employee@company.com', password: 'Mv4pS9wE2nR6kA8j', role: 'employee' }
        };
        this.tokens = {};
        this.testResults = {
            summary: { total: 0, passed: 0, failed: 0 },
            byRole: { admin: [], hr: [], employee: [] },
            byFunction: { auth: [], crud: [], permissions: [], integration: [] }
        };
    }

    async authenticateAllUsers() {
        console.log('🔐 AUTHENTICATING ALL USER ROLES...\n');
        
        for (const [role, credentials] of Object.entries(this.users)) {
            try {
                const response = await axios.post(`${this.baseURL}/auth/login`, {
                    email: credentials.email,
                    password: credentials.password
                });
                
                this.tokens[role] = response.data.data.accessToken;
                this.logTest('auth', `${role.toUpperCase()} Authentication`, true, `Token obtained successfully`);
            } catch (error) {
                this.logTest('auth', `${role.toUpperCase()} Authentication`, false, error.message);
            }
        }
    }

    async testAdminFunctionalities() {
        console.log('\n👑 TESTING ADMIN FUNCTIONALITIES...\n');
        const token = this.tokens.admin;
        if (!token) return;

        // Test 1: User Management
        await this.testEndpoint('admin', 'GET /users', 'GET', '/users', null, token);
        
        // Test 2: Employee Management
        await this.testEndpoint('admin', 'GET /employees', 'GET', '/employees', null, token);
        await this.testEndpoint('admin', 'POST /employees', 'POST', '/employees', {
            employeeId: 'TEST001',
            firstName: 'Test',
            lastName: 'Admin',
            email: 'test.admin@company.com',
            hireDate: '2025-09-07',
            userId: null,
            departmentId: '081aa632-2b0b-4457-b718-6236d026d83e',
            positionId: '9bc22324-323a-480c-b6be-5f2a3596bb78'
        }, token);

        // Test 3: Department Management
        await this.testEndpoint('admin', 'GET /departments', 'GET', '/departments', null, token);
        await this.testEndpoint('admin', 'POST /departments', 'POST', '/departments', {
            name: 'Marketing',
            description: 'Marketing Department'
        }, token);

        // Test 4: Position Management
        await this.testEndpoint('admin', 'GET /positions', 'GET', '/positions', null, token);
        await this.testEndpoint('admin', 'POST /positions', 'POST', '/positions', {
            title: 'Marketing Manager',
            description: 'Marketing team leader',
            level: 'Manager',
            departmentId: '081aa632-2b0b-4457-b718-6236d026d83e'
        }, token);

        // Test 5: Payroll Management
        await this.testEndpoint('admin', 'GET /payrolls', 'GET', '/payrolls', null, token);
        await this.testEndpoint('admin', 'GET /salary-structures', 'GET', '/salary-structures', null, token);

        // Test 6: Project Management
        await this.testEndpoint('admin', 'GET /projects', 'GET', '/projects', null, token);
        await this.testEndpoint('admin', 'POST /projects', 'POST', '/projects', {
            name: 'System Upgrade',
            description: 'Upgrading core systems',
            startDate: '2025-09-07',
            endDate: '2025-12-31',
            managerId: 'c24ac87d-1c2e-4fff-904e-0ee63d64e093'
        }, token);

        // Test 7: Task Management
        await this.testEndpoint('admin', 'GET /tasks', 'GET', '/tasks', null, token);

        // Test 8: Leave Management
        await this.testEndpoint('admin', 'GET /leave', 'GET', '/leave', null, token);

        // Test 9: Timesheet Management
        await this.testEndpoint('admin', 'GET /timesheets', 'GET', '/timesheets', null, token);
    }

    async testHRFunctionalities() {
        console.log('\n👥 TESTING HR FUNCTIONALITIES...\n');
        const token = this.tokens.hr;
        if (!token) return;

        // Test 1: Employee Access (HR should have access)
        await this.testEndpoint('hr', 'GET /employees', 'GET', '/employees', null, token);
        
        // Test 2: Department Access
        await this.testEndpoint('hr', 'GET /departments', 'GET', '/departments', null, token);
        
        // Test 3: Position Management (HR should be able to manage)
        await this.testEndpoint('hr', 'GET /positions', 'GET', '/positions', null, token);
        await this.testEndpoint('hr', 'POST /positions', 'POST', '/positions', {
            title: 'HR Specialist',
            description: 'Human Resources Specialist',
            level: 'Mid',
            departmentId: '61d25f39-4f2b-484a-93f2-ab4ade89e112'
        }, token);

        // Test 4: Leave Management (HR core function)
        await this.testEndpoint('hr', 'GET /leave', 'GET', '/leave', null, token);

        // Test 5: Payroll Access (HR should have access)
        await this.testEndpoint('hr', 'GET /payrolls', 'GET', '/payrolls', null, token);
        
        // Test 6: User Management (HR might have limited access)
        await this.testEndpoint('hr', 'GET /users', 'GET', '/users', null, token);
        
        // Test 7: Projects (HR should have read access)
        await this.testEndpoint('hr', 'GET /projects', 'GET', '/projects', null, token);
    }

    async testEmployeeFunctionalities() {
        console.log('\n👤 TESTING EMPLOYEE FUNCTIONALITIES...\n');
        const token = this.tokens.employee;
        if (!token) return;

        // Test 1: View Own Profile
        await this.testEndpoint('employee', 'GET /employees', 'GET', '/employees', null, token);
        
        // Test 2: View Departments (should have read access)
        await this.testEndpoint('employee', 'GET /departments', 'GET', '/departments', null, token);
        
        // Test 3: View Positions (should have read access)
        await this.testEndpoint('employee', 'GET /positions', 'GET', '/positions', null, token);
        
        // Test 4: Leave Requests (employee core function)
        await this.testEndpoint('employee', 'GET /leave', 'GET', '/leave', null, token);
        
        // Test 5: View Own Payslips
        await this.testEndpoint('employee', 'GET /payrolls', 'GET', '/payrolls', null, token);
        
        // Test 6: View Projects (should have read access)
        await this.testEndpoint('employee', 'GET /projects', 'GET', '/projects', null, token);
        
        // Test 7: View Tasks
        await this.testEndpoint('employee', 'GET /tasks', 'GET', '/tasks', null, token);
        
        // Test 8: Timesheet Management (employee core function)
        await this.testEndpoint('employee', 'GET /timesheets', 'GET', '/timesheets', null, token);
    }

    async testPermissionRestrictions() {
        console.log('\n🔒 TESTING PERMISSION RESTRICTIONS...\n');
        
        // Test 1: Employee trying to create users (should fail)
        await this.testEndpoint('employee', 'POST /users (SHOULD FAIL)', 'POST', '/users', {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@test.com',
            password: 'test123',
            role: 'employee'
        }, this.tokens.employee, true);

        // Test 2: Employee trying to create departments (should fail)
        await this.testEndpoint('employee', 'POST /departments (SHOULD FAIL)', 'POST', '/departments', {
            name: 'Test Dept',
            description: 'Should fail'
        }, this.tokens.employee, true);

        // Test 3: HR trying to access sensitive admin functions
        await this.testEndpoint('hr', 'Admin-only endpoint access', 'GET', '/users', null, this.tokens.hr);
    }

    async testCrossRoleIntegration() {
        console.log('\n🔗 TESTING CROSS-ROLE INTEGRATION...\n');
        
        // Test 1: Admin creates, HR manages, Employee views
        const adminToken = this.tokens.admin;
        const hrToken = this.tokens.hr;
        const employeeToken = this.tokens.employee;

        if (adminToken && hrToken && employeeToken) {
            // Admin creates a project
            const projectResponse = await this.testEndpoint('integration', 'Admin creates project', 'POST', '/projects', {
                name: 'Integration Test Project',
                description: 'Testing cross-role functionality',
                startDate: '2025-09-07',
                endDate: '2025-12-31'
            }, adminToken);

            // HR views the project
            await this.testEndpoint('integration', 'HR views projects', 'GET', '/projects', null, hrToken);

            // Employee views the project
            await this.testEndpoint('integration', 'Employee views projects', 'GET', '/projects', null, employeeToken);
        }
    }

    async testEndpoint(role, testName, method, endpoint, data, token, expectError = false) {
        this.testResults.summary.total++;
        
        try {
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            
            if (expectError) {
                this.logTest('permissions', testName, false, 'Expected error but request succeeded');
            } else {
                this.logTest('crud', testName, true, `${method} successful - ${response.data.message || 'OK'}`);
            }
            
        } catch (error) {
            if (expectError) {
                this.logTest('permissions', testName, true, `Correctly blocked: ${error.response?.data?.message || error.message}`);
            } else {
                this.logTest('crud', testName, false, `${error.response?.data?.message || error.message}`);
            }
        }
    }

    logTest(category, testName, passed, details) {
        const result = { testName, passed, details, timestamp: new Date().toISOString() };
        
        if (passed) {
            this.testResults.summary.passed++;
            console.log(`✅ ${testName}: ${details}`);
        } else {
            this.testResults.summary.failed++;
            console.log(`❌ ${testName}: ${details}`);
        }

        this.testResults.byFunction[category] = this.testResults.byFunction[category] || [];
        this.testResults.byFunction[category].push(result);
    }

    async generateReport() {
        console.log('\n📊 COMPREHENSIVE TEST REPORT');
        console.log('='.repeat(50));
        
        const { total, passed, failed } = this.testResults.summary;
        const successRate = ((passed / total) * 100).toFixed(1);
        
        console.log(`\n🎯 OVERALL RESULTS:`);
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${successRate}%`);
        
        console.log(`\n📋 BY CATEGORY:`);
        for (const [category, tests] of Object.entries(this.testResults.byFunction)) {
            const categoryPassed = tests.filter(t => t.passed).length;
            const categoryTotal = tests.length;
            if (categoryTotal > 0) {
                console.log(`${category.toUpperCase()}: ${categoryPassed}/${categoryTotal} (${((categoryPassed/categoryTotal)*100).toFixed(1)}%)`);
            }
        }

        console.log(`\n🔐 USER AUTHENTICATION STATUS:`);
        for (const [role, token] of Object.entries(this.tokens)) {
            console.log(`${role.toUpperCase()}: ${token ? '✅ Authenticated' : '❌ Failed'}`);
        }

        // Save detailed report
        const reportData = {
            summary: this.testResults.summary,
            successRate: successRate,
            testResults: this.testResults,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync('comprehensive-test-report.json', JSON.stringify(reportData, null, 2));
        console.log(`\n📄 Detailed report saved to: comprehensive-test-report.json`);
        
        if (successRate >= 90) {
            console.log('\n🎉 SYSTEM STATUS: EXCELLENT');
        } else if (successRate >= 75) {
            console.log('\n✅ SYSTEM STATUS: GOOD');
        } else if (successRate >= 60) {
            console.log('\n⚠️  SYSTEM STATUS: NEEDS IMPROVEMENT');
        } else {
            console.log('\n❌ SYSTEM STATUS: CRITICAL ISSUES');
        }
    }

    async runAllTests() {
        console.log('🧪 COMPREHENSIVE USER ROLE & FUNCTIONALITY TEST');
        console.log('='.repeat(60));
        console.log('Testing all functionalities across all user roles...\n');

        await this.authenticateAllUsers();
        await this.testAdminFunctionalities();
        await this.testHRFunctionalities();
        await this.testEmployeeFunctionalities();
        await this.testPermissionRestrictions();
        await this.testCrossRoleIntegration();
        await this.generateReport();
    }
}

// Run the comprehensive test
const comprehensiveTest = new ComprehensiveUserRoleTest();
comprehensiveTest.runAllTests().catch(console.error);
