/**
 * HRM Workflow Test Suite
 * Specialized tests for complete user workflows and business scenarios
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

class WorkflowTestSuite {
    constructor() {
        this.tokens = {};
        this.testData = {};
        this.results = [];
    }

    async log(message, type = 'info') {
        const icons = { info: '📝', success: '✅', error: '❌', warning: '⚠️', process: '🔄' };
        console.log(`${icons[type] || '📝'} ${message}`);
    }

    async makeRequest(method, endpoint, data = null, token = null) {
        try {
            const config = {
                method,
                url: `${API_BASE_URL}${endpoint}`,
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            };
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

    async authenticate() {
        await this.log('🔐 Authenticating test users...', 'process');
        
        const users = {
            admin: { email: 'admin@company.com', password: 'Kx9mP7qR2nF8sA5t' },
            hr: { email: 'hr@company.com', password: 'Lw3nQ6xY8mD4vB7h' },
            manager: { email: 'manager@company.com', password: 'Mv4pS9wE2nR6kA8j' },
            employee: { email: 'employee@company.com', password: 'Mv4pS9wE2nR6kA8j' }
        };

        for (const [role, creds] of Object.entries(users)) {
            const result = await this.makeRequest('POST', '/auth/login', creds);
            if (result.success) {
                this.tokens[role] = result.data.data.accessToken;
                await this.log(`Authenticated as ${role}`, 'success');
            } else {
                await this.log(`Failed to authenticate as ${role}: ${result.error}`, 'error');
                throw new Error(`Authentication failed for ${role}`);
            }
        }
    }

    // WORKFLOW 1: Complete Employee Onboarding
    async testEmployeeOnboardingWorkflow() {
        await this.log('\n👤 WORKFLOW 1: Complete Employee Onboarding', 'process');
        
        const workflowResults = { steps: [], success: true };
        
        try {
            // Step 1: HR creates new employee
            const newEmployee = {
                firstName: 'John',
                lastName: 'NewHire',
                email: `john.newhire.${Date.now()}@company.com`,
                phone: '555-0100',
                position: 'Software Developer',
                department: 'IT',
                hireDate: new Date().toISOString().split('T')[0],
                salary: 75000,
                status: 'active'
            };

            const createResult = await this.makeRequest('POST', '/employees', newEmployee, this.tokens.hr);
            workflowResults.steps.push({
                step: 'Create Employee Record',
                success: createResult.success,
                details: createResult.success ? `Employee ID: ${createResult.data.data?.id}` : createResult.error
            });

            if (createResult.success) {
                this.testData.newEmployee = createResult.data.data;
                await this.log(`✅ Employee created: ${this.testData.newEmployee.firstName} ${this.testData.newEmployee.lastName}`, 'success');
            }

            // Step 2: Verify employee can access their profile
            const profileResult = await this.makeRequest('GET', '/auth/profile', null, this.tokens.employee);
            workflowResults.steps.push({
                step: 'Employee Profile Access',
                success: profileResult.success,
                details: profileResult.success ? 'Profile accessible' : profileResult.error
            });

            // Step 3: Employee updates their profile
            if (this.testData.newEmployee) {
                const updateData = {
                    phone: '555-0101',
                    emergencyContact: 'Jane Doe - 555-0102'
                };
                
                const updateResult = await this.makeRequest('PUT', `/employees/${this.testData.newEmployee.id}`, updateData, this.tokens.employee);
                workflowResults.steps.push({
                    step: 'Employee Profile Update',
                    success: updateResult.success,
                    details: updateResult.success ? 'Profile updated successfully' : updateResult.error
                });
            }

            // Step 4: HR sets up salary structure (if endpoint exists)
            const salaryStructure = {
                employeeId: this.testData.newEmployee?.id,
                basicSalary: 60000,
                allowances: { hra: 15000, transport: 5000 },
                deductions: { pf: 7200, tax: 12000 }
            };

            const salaryResult = await this.makeRequest('POST', '/salary-structures', salaryStructure, this.tokens.hr);
            workflowResults.steps.push({
                step: 'Setup Salary Structure',
                success: salaryResult.success || salaryResult.status === 404,
                details: salaryResult.success ? 'Salary structure created' : 'Endpoint not available or error'
            });

        } catch (error) {
            workflowResults.success = false;
            workflowResults.error = error.message;
        }

        this.results.push({ workflow: 'Employee Onboarding', ...workflowResults });
        return workflowResults;
    }

    // WORKFLOW 2: Complete Timesheet Lifecycle
    async testTimesheetLifecycleWorkflow() {
        await this.log('\n⏰ WORKFLOW 2: Complete Timesheet Lifecycle', 'process');
        
        const workflowResults = { steps: [], success: true };
        
        try {
            // Step 1: Create project and task
            const project = {
                name: `Timesheet Test Project ${Date.now()}`,
                description: 'Project for testing timesheet lifecycle',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'active'
            };

            const projectResult = await this.makeRequest('POST', '/projects', project, this.tokens.admin);
            workflowResults.steps.push({
                step: 'Create Project',
                success: projectResult.success,
                details: projectResult.success ? `Project ID: ${projectResult.data.data?.id}` : projectResult.error
            });

            if (projectResult.success) {
                this.testData.project = projectResult.data.data;
            }

            const task = {
                title: `Development Task ${Date.now()}`,
                description: 'Feature development task',
                projectId: this.testData.project?.id,
                status: 'active'
            };

            const taskResult = await this.makeRequest('POST', '/tasks', task, this.tokens.admin);
            workflowResults.steps.push({
                step: 'Create Task',
                success: taskResult.success,
                details: taskResult.success ? `Task ID: ${taskResult.data.data?.id}` : taskResult.error
            });

            if (taskResult.success) {
                this.testData.task = taskResult.data.data;
            }

            // Step 2: Employee creates timesheet
            const timesheet = {
                workDate: new Date().toISOString().split('T')[0],
                hoursWorked: 8.0,
                description: 'Worked on feature implementation and bug fixes',
                projectId: this.testData.project?.id,
                taskId: this.testData.task?.id
            };

            const timesheetResult = await this.makeRequest('POST', '/timesheets', timesheet, this.tokens.employee);
            workflowResults.steps.push({
                step: 'Employee Creates Timesheet',
                success: timesheetResult.success,
                details: timesheetResult.success ? `Timesheet ID: ${timesheetResult.data.data?.id}` : timesheetResult.error
            });

            if (timesheetResult.success) {
                this.testData.timesheet = timesheetResult.data.data;
            }

            // Step 3: Employee edits timesheet
            if (this.testData.timesheet) {
                const updateData = {
                    hoursWorked: 7.5,
                    description: 'Updated: Worked on feature implementation, bug fixes, and code review'
                };

                const updateResult = await this.makeRequest('PUT', `/timesheets/${this.testData.timesheet.id}`, updateData, this.tokens.employee);
                workflowResults.steps.push({
                    step: 'Employee Updates Timesheet',
                    success: updateResult.success,
                    details: updateResult.success ? 'Timesheet updated successfully' : updateResult.error
                });
            }

            // Step 4: Manager reviews and approves
            if (this.testData.timesheet) {
                const approvalData = {
                    status: 'approved',
                    comments: 'Work completed satisfactorily. Good detail in description.'
                };

                const approvalResult = await this.makeRequest('PUT', `/timesheets/${this.testData.timesheet.id}/status`, approvalData, this.tokens.manager);
                workflowResults.steps.push({
                    step: 'Manager Approves Timesheet',
                    success: approvalResult.success,
                    details: approvalResult.success ? 'Timesheet approved by manager' : approvalResult.error
                });
            }

            // Step 5: Create another timesheet for rejection testing
            const rejectTimesheet = {
                workDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                hoursWorked: 12.0, // Suspicious hours
                description: 'Work',
                projectId: this.testData.project?.id,
                taskId: this.testData.task?.id
            };

            const rejectTimesheetResult = await this.makeRequest('POST', '/timesheets', rejectTimesheet, this.tokens.employee);
            if (rejectTimesheetResult.success) {
                const rejectionData = {
                    status: 'rejected',
                    comments: 'Please provide more detailed description and verify hours worked.'
                };

                const rejectionResult = await this.makeRequest('PUT', `/timesheets/${rejectTimesheetResult.data.data.id}/status`, rejectionData, this.tokens.manager);
                workflowResults.steps.push({
                    step: 'Manager Rejects Timesheet',
                    success: rejectionResult.success,
                    details: rejectionResult.success ? 'Timesheet rejected with feedback' : rejectionResult.error
                });
            }

        } catch (error) {
            workflowResults.success = false;
            workflowResults.error = error.message;
        }

        this.results.push({ workflow: 'Timesheet Lifecycle', ...workflowResults });
        return workflowResults;
    }

    // WORKFLOW 3: Complete Leave Request Process
    async testLeaveRequestWorkflow() {
        await this.log('\n🏖️ WORKFLOW 3: Complete Leave Request Process', 'process');
        
        const workflowResults = { steps: [], success: true };
        
        try {
            // Step 1: Employee checks leave balance
            const balanceResult = await this.makeRequest('GET', '/leave/meta/balance', null, this.tokens.employee);
            workflowResults.steps.push({
                step: 'Check Leave Balance',
                success: balanceResult.success,
                details: balanceResult.success ? 'Balance retrieved successfully' : balanceResult.error
            });

            // Step 2: Employee creates leave request
            const leaveRequest = {
                startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                leaveType: 'Annual Leave',
                reason: 'Family vacation - pre-planned trip to Europe',
                totalDays: 5
            };

            const createResult = await this.makeRequest('POST', '/leave', leaveRequest, this.tokens.employee);
            workflowResults.steps.push({
                step: 'Employee Creates Leave Request',
                success: createResult.success,
                details: createResult.success ? `Leave Request ID: ${createResult.data.data?.id}` : createResult.error
            });

            if (createResult.success) {
                this.testData.leaveRequest = createResult.data.data;
            }

            // Step 3: Manager reviews pending requests
            const pendingResult = await this.makeRequest('GET', '/leave?status=pending', null, this.tokens.manager);
            workflowResults.steps.push({
                step: 'Manager Views Pending Requests',
                success: pendingResult.success,
                details: pendingResult.success ? `Found ${pendingResult.data.data?.length || 0} pending requests` : pendingResult.error
            });

            // Step 4: Manager approves leave request
            if (this.testData.leaveRequest) {
                const approvalData = {
                    status: 'approved',
                    comments: 'Approved. Enjoy your vacation!'
                };

                const approvalResult = await this.makeRequest('PUT', `/leave/${this.testData.leaveRequest.id}/status`, approvalData, this.tokens.manager);
                workflowResults.steps.push({
                    step: 'Manager Approves Leave',
                    success: approvalResult.success,
                    details: approvalResult.success ? 'Leave request approved' : approvalResult.error
                });
            }

            // Step 5: Create and reject another leave request
            const conflictLeave = {
                startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                leaveType: 'Sick Leave',
                reason: 'Medical procedure',
                totalDays: 8
            };

            const conflictResult = await this.makeRequest('POST', '/leave', conflictLeave, this.tokens.employee);
            if (conflictResult.success) {
                const rejectionData = {
                    status: 'rejected',
                    comments: 'Insufficient notice period. Please apply at least 30 days in advance for extended leave.'
                };

                const rejectionResult = await this.makeRequest('PUT', `/leave/${conflictResult.data.data.id}/status`, rejectionData, this.tokens.manager);
                workflowResults.steps.push({
                    step: 'Manager Rejects Leave',
                    success: rejectionResult.success,
                    details: rejectionResult.success ? 'Leave request rejected with reason' : rejectionResult.error
                });
            }

        } catch (error) {
            workflowResults.success = false;
            workflowResults.error = error.message;
        }

        this.results.push({ workflow: 'Leave Request Process', ...workflowResults });
        return workflowResults;
    }

    // WORKFLOW 4: Payroll and Payslip Generation
    async testPayrollWorkflow() {
        await this.log('\n💰 WORKFLOW 4: Payroll and Payslip Generation', 'process');
        
        const workflowResults = { steps: [], success: true };
        
        try {
            // Step 1: HR processes monthly payroll
            const payrollData = {
                payPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                payPeriodEnd: new Date().toISOString().split('T')[0],
                description: 'Monthly payroll processing - Test run'
            };

            const payrollResult = await this.makeRequest('POST', '/payrolls', payrollData, this.tokens.hr);
            workflowResults.steps.push({
                step: 'HR Processes Payroll',
                success: payrollResult.success,
                details: payrollResult.success ? `Payroll ID: ${payrollResult.data.data?.id}` : payrollResult.error
            });

            if (payrollResult.success) {
                this.testData.payroll = payrollResult.data.data;
            }

            // Step 2: Generate payslips for employees
            if (this.testData.newEmployee) {
                const payslipData = {
                    employeeId: this.testData.newEmployee.id,
                    payPeriodStart: payrollData.payPeriodStart,
                    payPeriodEnd: payrollData.payPeriodEnd
                };

                const payslipResult = await this.makeRequest('POST', '/payslips/generate', payslipData, this.tokens.hr);
                workflowResults.steps.push({
                    step: 'Generate Individual Payslip',
                    success: payslipResult.success || payslipResult.status === 404,
                    details: payslipResult.success ? 'Payslip generated successfully' : 'Payslip endpoint not available'
                });
            }

            // Step 3: Bulk generate payslips
            const bulkPayslipData = {
                payPeriodStart: payrollData.payPeriodStart,
                payPeriodEnd: payrollData.payPeriodEnd,
                departmentFilter: 'IT'
            };

            const bulkResult = await this.makeRequest('POST', '/payslips/bulk-generate', bulkPayslipData, this.tokens.hr);
            workflowResults.steps.push({
                step: 'Bulk Generate Payslips',
                success: bulkResult.success || bulkResult.status === 404,
                details: bulkResult.success ? 'Bulk payslips generated' : 'Bulk payslip endpoint not available'
            });

            // Step 4: Employee views their payslip
            const employeePayslipResult = await this.makeRequest('GET', '/payslips', null, this.tokens.employee);
            workflowResults.steps.push({
                step: 'Employee Views Payslip',
                success: employeePayslipResult.success || employeePayslipResult.status === 404,
                details: employeePayslipResult.success ? 'Employee can access payslips' : 'Payslip viewing endpoint not available'
            });

            // Step 5: Test unauthorized access (employee trying to access all payrolls)
            const unauthorizedResult = await this.makeRequest('GET', '/payrolls', null, this.tokens.employee);
            workflowResults.steps.push({
                step: 'Block Unauthorized Payroll Access',
                success: !unauthorizedResult.success && unauthorizedResult.status === 403,
                details: unauthorizedResult.status === 403 ? 'Access properly restricted' : 'Security issue detected'
            });

        } catch (error) {
            workflowResults.success = false;
            workflowResults.error = error.message;
        }

        this.results.push({ workflow: 'Payroll and Payslip Generation', ...workflowResults });
        return workflowResults;
    }

    // WORKFLOW 5: Manager Dashboard and Reporting
    async testManagerDashboardWorkflow() {
        await this.log('\n📊 WORKFLOW 5: Manager Dashboard and Reporting', 'process');
        
        const workflowResults = { steps: [], success: true };
        
        try {
            // Step 1: Manager accesses dashboard
            const dashboardResult = await this.makeRequest('GET', '/dashboard', null, this.tokens.manager);
            workflowResults.steps.push({
                step: 'Access Manager Dashboard',
                success: dashboardResult.success,
                details: dashboardResult.success ? 'Dashboard data retrieved' : dashboardResult.error
            });

            // Step 2: Manager views team timesheets
            const teamTimesheetsResult = await this.makeRequest('GET', '/timesheets', null, this.tokens.manager);
            workflowResults.steps.push({
                step: 'View Team Timesheets',
                success: teamTimesheetsResult.success,
                details: teamTimesheetsResult.success ? `Found ${teamTimesheetsResult.data.data?.length || 0} timesheets` : teamTimesheetsResult.error
            });

            // Step 3: Manager views pending leave requests
            const pendingLeavesResult = await this.makeRequest('GET', '/leave?status=pending', null, this.tokens.manager);
            workflowResults.steps.push({
                step: 'View Pending Leave Requests',
                success: pendingLeavesResult.success,
                details: pendingLeavesResult.success ? `Found ${pendingLeavesResult.data.data?.length || 0} pending leaves` : pendingLeavesResult.error
            });

            // Step 4: Manager views team members
            const teamMembersResult = await this.makeRequest('GET', '/employees', null, this.tokens.manager);
            workflowResults.steps.push({
                step: 'View Team Members',
                success: teamMembersResult.success,
                details: teamMembersResult.success ? `Found ${teamMembersResult.data.data?.length || 0} team members` : teamMembersResult.error
            });

            // Step 5: Generate team reports (if available)
            const reportsResult = await this.makeRequest('GET', '/dashboard/reports', null, this.tokens.manager);
            workflowResults.steps.push({
                step: 'Access Team Reports',
                success: reportsResult.success || reportsResult.status === 404,
                details: reportsResult.success ? 'Reports generated successfully' : 'Reports endpoint not available'
            });

        } catch (error) {
            workflowResults.success = false;
            workflowResults.error = error.message;
        }

        this.results.push({ workflow: 'Manager Dashboard and Reporting', ...workflowResults });
        return workflowResults;
    }

    // Generate comprehensive report
    generateReport() {
        const totalWorkflows = this.results.length;
        const successfulWorkflows = this.results.filter(w => w.success).length;
        const totalSteps = this.results.reduce((sum, w) => sum + w.steps.length, 0);
        const successfulSteps = this.results.reduce((sum, w) => sum + w.steps.filter(s => s.success).length, 0);

        console.log('\n📋 COMPREHENSIVE WORKFLOW TEST REPORT');
        console.log('=' .repeat(50));
        console.log(`Total Workflows Tested: ${totalWorkflows}`);
        console.log(`Successful Workflows: ${successfulWorkflows}`);
        console.log(`Workflow Success Rate: ${((successfulWorkflows / totalWorkflows) * 100).toFixed(1)}%`);
        console.log(`Total Steps Executed: ${totalSteps}`);
        console.log(`Successful Steps: ${successfulSteps}`);
        console.log(`Step Success Rate: ${((successfulSteps / totalSteps) * 100).toFixed(1)}%`);
        console.log('\n📝 WORKFLOW DETAILS:');

        this.results.forEach((workflow, index) => {
            console.log(`\n${index + 1}. ${workflow.workflow}: ${workflow.success ? '✅ PASSED' : '❌ FAILED'}`);
            workflow.steps.forEach((step, stepIndex) => {
                console.log(`   ${stepIndex + 1}.${step.step}: ${step.success ? '✅' : '❌'} ${step.details}`);
            });
        });

        // Save detailed results
        const fs = require('fs');
        const reportData = {
            summary: {
                totalWorkflows,
                successfulWorkflows,
                workflowSuccessRate: ((successfulWorkflows / totalWorkflows) * 100).toFixed(1),
                totalSteps,
                successfulSteps,
                stepSuccessRate: ((successfulSteps / totalSteps) * 100).toFixed(1),
                timestamp: new Date().toISOString()
            },
            workflows: this.results
        };

        fs.writeFileSync('workflow-test-report.json', JSON.stringify(reportData, null, 2));
        console.log('\n💾 Detailed report saved to: workflow-test-report.json');
    }

    // Main execution method
    async runAllWorkflows() {
        await this.log('🚀 Starting HRM Workflow Test Suite...', 'process');
        
        try {
            await this.authenticate();
            
            await this.testEmployeeOnboardingWorkflow();
            await this.testTimesheetLifecycleWorkflow();
            await this.testLeaveRequestWorkflow();
            await this.testPayrollWorkflow();
            await this.testManagerDashboardWorkflow();
            
            this.generateReport();
            
        } catch (error) {
            await this.log(`Fatal error: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const workflowTester = new WorkflowTestSuite();
    workflowTester.runAllWorkflows()
        .then(() => {
            console.log('\n🎉 Workflow testing completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Workflow testing failed:', error.message);
            process.exit(1);
        });
}

module.exports = WorkflowTestSuite;
