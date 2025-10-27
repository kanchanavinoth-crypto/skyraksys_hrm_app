/**
 * COMPREHENSIVE SYSTEM TESTING - PHASE 2
 * Advanced testing after Steps 1 & 2 completion
 * Focus: Performance, Integration, and Advanced Features
 */

const axios = require('axios');

class AdvancedSystemTester {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = null;
        this.testResults = {
            performance: [],
            integration: [],
            dataIntegrity: [],
            concurrency: [],
            errorHandling: []
        };
    }

    log(message) {
        console.log(message);
    }

    async authenticate() {
        try {
            const response = await axios.post(`${this.baseURL}/auth/login`, {
                email: 'admin@company.com',
                password: 'Kx9mP7qR2nF8sA5t'
            });
            this.token = response.data.data.accessToken;
            this.log('✅ Authentication successful');
            return true;
        } catch (error) {
            this.log(`❌ Authentication failed: ${error.response?.data?.message || error.message}`);
            return false;
        }
    }

    getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    async testSystemStatus() {
        this.log('\n🔍 SYSTEM STATUS VERIFICATION');
        this.log('============================');

        try {
            // Check employees
            const employeesResponse = await axios.get(`${this.baseURL}/employees`, { headers: this.getHeaders() });
            const employees = employeesResponse.data.data || [];
            this.log(`👥 Employees: ${employees.length}`);

            // Check departments
            const departmentsResponse = await axios.get(`${this.baseURL}/departments`, { headers: this.getHeaders() });
            const departments = departmentsResponse.data.data || [];
            this.log(`📁 Departments: ${departments.length}`);

            // Check salary structures
            const salaryResponse = await axios.get(`${this.baseURL}/salary-structures`, { headers: this.getHeaders() });
            const salaryStructures = salaryResponse.data.data || [];
            this.log(`💰 Salary Structures: ${salaryStructures.length}`);

            // Check projects
            const projectsResponse = await axios.get(`${this.baseURL}/projects`, { headers: this.getHeaders() });
            const projects = projectsResponse.data.data || [];
            this.log(`📋 Projects: ${projects.length}`);

            // Check timesheets
            const timesheetsResponse = await axios.get(`${this.baseURL}/timesheets`, { headers: this.getHeaders() });
            const timesheets = timesheetsResponse.data.data || [];
            this.log(`⏰ Timesheets: ${timesheets.length}`);

            return {
                employees: employees.length,
                departments: departments.length,
                salaryStructures: salaryStructures.length,
                projects: projects.length,
                timesheets: timesheets.length
            };

        } catch (error) {
            this.log(`❌ System status check failed: ${error.message}`);
            return null;
        }
    }

    async testPerformance() {
        this.log('\n🚀 PERFORMANCE TESTING');
        this.log('======================');

        const performanceTests = [
            { name: 'Employee List', endpoint: '/employees' },
            { name: 'Department List', endpoint: '/departments' },
            { name: 'Salary Structures', endpoint: '/salary-structures' },
            { name: 'Projects List', endpoint: '/projects' }
        ];

        for (const test of performanceTests) {
            try {
                const startTime = Date.now();
                const response = await axios.get(`${this.baseURL}${test.endpoint}`, { headers: this.getHeaders() });
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                const recordCount = response.data.data?.length || 0;

                this.testResults.performance.push({
                    test: test.name,
                    responseTime,
                    recordCount,
                    success: true
                });

                this.log(`✅ ${test.name}: ${responseTime}ms (${recordCount} records)`);

            } catch (error) {
                this.testResults.performance.push({
                    test: test.name,
                    success: false,
                    error: error.message
                });
                this.log(`❌ ${test.name}: Failed - ${error.message}`);
            }
        }
    }

    async testDataIntegrity() {
        this.log('\n🔒 DATA INTEGRITY TESTING');
        this.log('=========================');

        try {
            // Test 1: Employee-Department relationship
            this.log('\n🧪 Testing Employee-Department relationships...');
            const employees = await axios.get(`${this.baseURL}/employees`, { headers: this.getHeaders() });
            const departments = await axios.get(`${this.baseURL}/departments`, { headers: this.getHeaders() });
            
            const employeeList = employees.data.data || [];
            const departmentList = departments.data.data || [];
            const departmentIds = departmentList.map(d => d.id);

            let validRelationships = 0;
            let invalidRelationships = 0;

            for (const employee of employeeList) {
                if (departmentIds.includes(employee.departmentId)) {
                    validRelationships++;
                } else {
                    invalidRelationships++;
                    this.log(`   ⚠️  Employee ${employee.employeeId} has invalid departmentId`);
                }
            }

            this.testResults.dataIntegrity.push({
                test: 'Employee-Department Relationships',
                valid: validRelationships,
                invalid: invalidRelationships,
                success: invalidRelationships === 0
            });

            this.log(`   ✅ Valid relationships: ${validRelationships}`);
            this.log(`   ❌ Invalid relationships: ${invalidRelationships}`);

            // Test 2: Salary Structure completeness
            this.log('\n🧪 Testing Salary Structure completeness...');
            const salaryStructures = await axios.get(`${this.baseURL}/salary-structures`, { headers: this.getHeaders() });
            const salaryList = salaryStructures.data.data || [];
            
            let completeSalaryStructures = 0;
            let incompleteSalaryStructures = 0;

            for (const salary of salaryList) {
                const requiredFields = ['basicSalary', 'hra', 'da', 'providentFund'];
                const hasAllFields = requiredFields.every(field => salary[field] !== null && salary[field] !== undefined);
                
                if (hasAllFields) {
                    completeSalaryStructures++;
                } else {
                    incompleteSalaryStructures++;
                }
            }

            this.testResults.dataIntegrity.push({
                test: 'Salary Structure Completeness',
                complete: completeSalaryStructures,
                incomplete: incompleteSalaryStructures,
                success: incompleteSalaryStructures === 0
            });

            this.log(`   ✅ Complete salary structures: ${completeSalaryStructures}`);
            this.log(`   ❌ Incomplete salary structures: ${incompleteSalaryStructures}`);

        } catch (error) {
            this.log(`❌ Data integrity test failed: ${error.message}`);
        }
    }

    async testErrorHandling() {
        this.log('\n🛡️  ERROR HANDLING TESTING');
        this.log('==========================');

        const errorTests = [
            {
                name: 'Invalid Employee Creation',
                test: async () => {
                    return axios.post(`${this.baseURL}/employees`, {
                        firstName: 'Test',
                        // Missing required fields
                    }, { headers: this.getHeaders() });
                }
            },
            {
                name: 'Duplicate Email Employee',
                test: async () => {
                    return axios.post(`${this.baseURL}/employees`, {
                        firstName: 'Duplicate',
                        lastName: 'Test',
                        email: 'amanda.davis@company.com', // Existing email
                        phone: '9876543999',
                        hireDate: '2024-01-01',
                        departmentId: '2b45097a-89cd-45fe-bd66-0107d3ef849b',
                        positionId: '5ca16ce4-6b59-4d86-a383-22f799027c3b'
                    }, { headers: this.getHeaders() });
                }
            },
            {
                name: 'Invalid Phone Format',
                test: async () => {
                    return axios.post(`${this.baseURL}/employees`, {
                        firstName: 'Test',
                        lastName: 'Phone',
                        email: 'test.phone@company.com',
                        phone: '555-INVALID',
                        hireDate: '2024-01-01',
                        departmentId: '2b45097a-89cd-45fe-bd66-0107d3ef849b',
                        positionId: '5ca16ce4-6b59-4d86-a383-22f799027c3b'
                    }, { headers: this.getHeaders() });
                }
            },
            {
                name: 'Non-existent Resource Access',
                test: async () => {
                    return axios.get(`${this.baseURL}/employees/non-existent-id`, { headers: this.getHeaders() });
                }
            }
        ];

        for (const errorTest of errorTests) {
            try {
                await errorTest.test();
                this.testResults.errorHandling.push({
                    test: errorTest.name,
                    success: false,
                    reason: 'Expected error but got success'
                });
                this.log(`❌ ${errorTest.name}: Expected error but got success`);
            } catch (error) {
                const isValidError = error.response && error.response.status >= 400;
                this.testResults.errorHandling.push({
                    test: errorTest.name,
                    success: isValidError,
                    statusCode: error.response?.status,
                    message: error.response?.data?.message
                });

                if (isValidError) {
                    this.log(`✅ ${errorTest.name}: Properly handled (${error.response.status})`);
                } else {
                    this.log(`❌ ${errorTest.name}: Unexpected error - ${error.message}`);
                }
            }
        }
    }

    async testAdvancedPayrollFeatures() {
        this.log('\n💼 ADVANCED PAYROLL TESTING');
        this.log('===========================');

        try {
            // Get a test employee
            const employees = await axios.get(`${this.baseURL}/employees`, { headers: this.getHeaders() });
            const employeeList = employees.data.data || [];
            const testEmployee = employeeList.find(emp => emp.email.includes('amanda.davis'));

            if (!testEmployee) {
                this.log('❌ No test employee found for payroll testing');
                return;
            }

            this.log(`🧮 Testing payroll features for: ${testEmployee.firstName} ${testEmployee.lastName}`);

            // Test different payroll endpoints
            const payrollEndpoints = [
                { name: 'Payroll List', method: 'GET', endpoint: '/payroll', data: null },
                { name: 'Payslip Generation', method: 'POST', endpoint: '/payslips/generate', data: { employeeId: testEmployee.id, month: 12, year: 2024 } },
                { name: 'Salary Calculation', method: 'POST', endpoint: '/payroll/calculate', data: { employeeId: testEmployee.id, month: 12, year: 2024 } }
            ];

            for (const endpoint of payrollEndpoints) {
                try {
                    let response;
                    if (endpoint.method === 'GET') {
                        response = await axios.get(`${this.baseURL}${endpoint.endpoint}`, { headers: this.getHeaders() });
                    } else {
                        response = await axios.post(`${this.baseURL}${endpoint.endpoint}`, endpoint.data, { headers: this.getHeaders() });
                    }

                    this.log(`✅ ${endpoint.name}: Success`);
                    if (response.data.data) {
                        this.log(`   📊 Response contains data: ${Array.isArray(response.data.data) ? response.data.data.length + ' records' : 'Object'}`);
                    }

                } catch (error) {
                    this.log(`❌ ${endpoint.name}: ${error.response?.status || 'Error'} - ${error.response?.data?.message || error.message}`);
                }
            }

        } catch (error) {
            this.log(`❌ Advanced payroll testing failed: ${error.message}`);
        }
    }

    async testTimesheetWorkflow() {
        this.log('\n⏰ TIMESHEET WORKFLOW TESTING');
        this.log('=============================');

        try {
            // Get test data
            const employees = await axios.get(`${this.baseURL}/employees`, { headers: this.getHeaders() });
            const projects = await axios.get(`${this.baseURL}/projects`, { headers: this.getHeaders() });
            
            const employeeList = employees.data.data || [];
            const projectList = projects.data.data || [];

            if (employeeList.length === 0 || projectList.length === 0) {
                this.log('❌ Insufficient data for timesheet testing');
                return;
            }

            const testEmployee = employeeList.find(emp => emp.email.includes('amanda.davis'));
            const testProject = projectList[0];

            if (!testEmployee || !testProject) {
                this.log('❌ Missing test employee or project');
                return;
            }

            this.log(`🧪 Testing timesheet workflow for: ${testEmployee.firstName} ${testEmployee.lastName}`);
            this.log(`📋 Using project: ${testProject.name}`);

            // Test daily timesheet entry
            const timesheetData = {
                employeeId: testEmployee.id,
                projectId: testProject.id,
                workDate: '2024-12-01',
                hoursWorked: 8,
                description: 'Software development tasks',
                status: 'Draft'
            };

            try {
                const response = await axios.post(`${this.baseURL}/timesheets`, timesheetData, { headers: this.getHeaders() });
                this.log('✅ Daily timesheet entry: Success');
                this.log(`   📄 Timesheet ID: ${response.data.data?.id}`);
            } catch (error) {
                this.log(`❌ Daily timesheet entry: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
                
                // If the above format fails, try the monthly format we discovered earlier
                this.log('\n🧪 Trying monthly timesheet format...');
                const monthlyTimesheet = {
                    employeeId: testEmployee.id,
                    projectId: testProject.id,
                    year: 2024,
                    month: 12,
                    totalWorkingDays: 21,
                    totalWorkedDays: 20,
                    totalAbsentDays: 1,
                    totalLeaveDays: 0,
                    totalOvertimeHours: 5,
                    notes: 'Monthly timesheet test'
                };

                try {
                    const monthlyResponse = await axios.post(`${this.baseURL}/timesheets`, monthlyTimesheet, { headers: this.getHeaders() });
                    this.log('✅ Monthly timesheet entry: Success');
                    this.log(`   📄 Timesheet ID: ${monthlyResponse.data.data?.id}`);
                } catch (monthlyError) {
                    this.log(`❌ Monthly timesheet entry: ${monthlyError.response?.status} - ${monthlyError.response?.data?.message || monthlyError.message}`);
                }
            }

        } catch (error) {
            this.log(`❌ Timesheet workflow testing failed: ${error.message}`);
        }
    }

    async generateAdvancedReport() {
        this.log('\n📊 ADVANCED TESTING REPORT');
        this.log('==========================');

        // Performance Summary
        const performanceResults = this.testResults.performance;
        const avgResponseTime = performanceResults.length > 0 
            ? performanceResults.reduce((sum, test) => sum + (test.responseTime || 0), 0) / performanceResults.length 
            : 0;
        
        this.log('\n🚀 PERFORMANCE RESULTS:');
        this.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
        this.log(`   Successful Tests: ${performanceResults.filter(t => t.success).length}/${performanceResults.length}`);

        // Data Integrity Summary
        const integrityResults = this.testResults.dataIntegrity;
        this.log('\n🔒 DATA INTEGRITY RESULTS:');
        integrityResults.forEach(test => {
            this.log(`   ${test.test}: ${test.success ? '✅ PASS' : '❌ FAIL'}`);
        });

        // Error Handling Summary
        const errorResults = this.testResults.errorHandling;
        this.log('\n🛡️  ERROR HANDLING RESULTS:');
        this.log(`   Proper Error Responses: ${errorResults.filter(t => t.success).length}/${errorResults.length}`);

        // Overall Assessment
        this.log('\n🎯 OVERALL ASSESSMENT:');
        this.log('======================');
        
        const performanceScore = performanceResults.filter(t => t.success).length / Math.max(performanceResults.length, 1);
        const integrityScore = integrityResults.filter(t => t.success).length / Math.max(integrityResults.length, 1);
        const errorScore = errorResults.filter(t => t.success).length / Math.max(errorResults.length, 1);
        
        const overallScore = (performanceScore + integrityScore + errorScore) / 3;

        this.log(`Performance Score: ${(performanceScore * 100).toFixed(1)}%`);
        this.log(`Data Integrity Score: ${(integrityScore * 100).toFixed(1)}%`);
        this.log(`Error Handling Score: ${(errorScore * 100).toFixed(1)}%`);
        this.log(`Overall System Health: ${(overallScore * 100).toFixed(1)}%`);

        if (overallScore >= 0.8) {
            this.log('\n🎉 EXCELLENT: System is performing very well!');
        } else if (overallScore >= 0.6) {
            this.log('\n👍 GOOD: System is stable with room for improvement');
        } else {
            this.log('\n⚠️  NEEDS ATTENTION: System requires optimization');
        }
    }

    async execute() {
        try {
            this.log('🚀 STARTING ADVANCED SYSTEM TESTING');
            this.log('===================================');

            // Authenticate
            const authenticated = await this.authenticate();
            if (!authenticated) return;

            // Check system status
            const systemStatus = await this.testSystemStatus();
            if (!systemStatus) return;

            // Run comprehensive tests
            await this.testPerformance();
            await this.testDataIntegrity();
            await this.testErrorHandling();
            await this.testAdvancedPayrollFeatures();
            await this.testTimesheetWorkflow();

            // Generate report
            await this.generateAdvancedReport();

            this.log('\n✨ ADVANCED TESTING COMPLETED');

        } catch (error) {
            this.log(`❌ Critical error: ${error.message}`);
        }
    }
}

// Execute advanced testing
const tester = new AdvancedSystemTester();
tester.execute().catch(console.error);
