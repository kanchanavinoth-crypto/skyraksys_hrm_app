const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AutomatedTestScenariosRunner {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = [];
        this.testData = {
            admin: { email: 'admin@test.com', password: 'admin123' },
            employee: { email: 'john.smith@company.com', password: 'employee123', name: 'John Smith' },
            manager: { email: 'jane.manager@company.com', password: 'manager123', name: 'Jane Manager' }
        };
        this.startTime = new Date();
    }

    async init() {
        console.log('🚀 Starting Automated Test Scenarios Runner...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1366, height: 768 },
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        this.page = await this.browser.newPage();
        
        await this.page.setDefaultTimeout(10000);
        await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    }

    async runTestScenario(testId, section, scenario, testData, expectedResult, priority) {
        const startTime = Date.now();
        let result = {
            testId,
            section,
            scenario,
            testData,
            expectedResult,
            actualResult: '',
            status: 'FAILED',
            comments: '',
            priority,
            duration: 0,
            timestamp: new Date().toISOString(),
            screenshot: ''
        };

        try {
            console.log(`\n📋 Executing ${testId}: ${scenario}`);
            
            // Route to appropriate test handler
            switch (section) {
                case 'Admin Operations':
                    result = await this.runAdminTest(testId, scenario, testData, expectedResult, result);
                    break;
                case 'Employee Operations':
                    result = await this.runEmployeeTest(testId, scenario, testData, expectedResult, result);
                    break;
                case 'Manager Operations':
                    result = await this.runManagerTest(testId, scenario, testData, expectedResult, result);
                    break;
                case 'System Integration':
                    result = await this.runIntegrationTest(testId, scenario, testData, expectedResult, result);
                    break;
                case 'Error Handling':
                    result = await this.runErrorTest(testId, scenario, testData, expectedResult, result);
                    break;
            }

            // Take screenshot
            const screenshotPath = `test-${testId.toLowerCase()}-${Date.now()}.png`;
            await this.page.screenshot({ 
                path: path.join(__dirname, screenshotPath),
                fullPage: true 
            });
            result.screenshot = screenshotPath;

        } catch (error) {
            result.actualResult = `Error: ${error.message}`;
            result.comments = `Exception during test execution: ${error.stack}`;
            console.log(`❌ ${testId} FAILED: ${error.message}`);
        }

        result.duration = Date.now() - startTime;
        this.results.push(result);
        
        // Log result
        const statusIcon = result.status === 'PASSED' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
        console.log(`${statusIcon} ${testId} ${result.status}: ${result.actualResult}`);
        
        return result;
    }

    async runAdminTest(testId, scenario, testData, expectedResult, result) {
        switch (testId) {
            case 'A001': // Admin Login
                await this.logout();
                await this.loginAs('admin');
                if (await this.isAdminDashboard()) {
                    result.status = 'PASSED';
                    result.actualResult = 'Admin login successful, dashboard accessible';
                }
                break;

            case 'A002': // Create Employee
                await this.ensureAdminLogin();
                const employeeCreated = await this.createEmployee(this.testData.employee);
                if (employeeCreated) {
                    result.status = 'PASSED';
                    result.actualResult = 'Employee record created successfully';
                }
                break;

            case 'A003': // Set Employee Credentials
                await this.ensureAdminLogin();
                const credentialsSet = await this.setEmployeeCredentials(this.testData.employee);
                if (credentialsSet) {
                    result.status = 'PASSED';
                    result.actualResult = 'Employee login credentials configured';
                }
                break;

            case 'A004': // Configure Payslip
                await this.ensureAdminLogin();
                const payslipConfigured = await this.configurePayslip(this.testData.employee);
                if (payslipConfigured) {
                    result.status = 'PASSED';
                    result.actualResult = 'Payslip configuration saved';
                }
                break;

            case 'A005': // Create Manager
                await this.ensureAdminLogin();
                const managerCreated = await this.createEmployee(this.testData.manager, 'Manager');
                if (managerCreated) {
                    result.status = 'PASSED';
                    result.actualResult = 'Manager record created successfully';
                }
                break;

            default:
                result.status = 'WARNING';
                result.actualResult = 'Test scenario not yet implemented';
                break;
        }
        return result;
    }

    async runEmployeeTest(testId, scenario, testData, expectedResult, result) {
        switch (testId) {
            case 'B001': // Employee Login
                await this.logout();
                await this.loginAs('employee');
                if (await this.isEmployeeDashboard()) {
                    result.status = 'PASSED';
                    result.actualResult = 'Employee login successful, dashboard accessible';
                }
                break;

            case 'B002': // Access Dashboard
                await this.ensureEmployeeLogin();
                if (await this.page.$('[data-testid="employee-dashboard"], .dashboard, .employee-home')) {
                    result.status = 'PASSED';
                    result.actualResult = 'Employee dashboard loaded successfully';
                }
                break;

            case 'B004': // Access Timesheet
                await this.ensureEmployeeLogin();
                const timesheetAccess = await this.navigateToTimesheet();
                if (timesheetAccess) {
                    result.status = 'PASSED';
                    result.actualResult = 'Timesheet module accessible';
                }
                break;

            case 'B005': // Submit Timesheet Entry
                await this.ensureEmployeeLogin();
                const timesheetSubmitted = await this.submitTimesheetEntry();
                if (timesheetSubmitted) {
                    result.status = 'PASSED';
                    result.actualResult = 'Timesheet entry submitted successfully';
                }
                break;

            case 'B007': // Access Leave Requests
                await this.ensureEmployeeLogin();
                const leaveAccess = await this.navigateToLeaveRequests();
                if (leaveAccess) {
                    result.status = 'PASSED';
                    result.actualResult = 'Leave request module accessible';
                }
                break;

            case 'B008': // Submit Leave Request
                await this.ensureEmployeeLogin();
                const leaveSubmitted = await this.submitLeaveRequest();
                if (leaveSubmitted) {
                    result.status = 'PASSED';
                    result.actualResult = 'Leave request submitted successfully';
                }
                break;

            case 'B011': // Access Payslip
                await this.ensureEmployeeLogin();
                const payslipAccess = await this.navigateToPayslip();
                if (payslipAccess) {
                    result.status = 'PASSED';
                    result.actualResult = 'Payslip module accessible';
                }
                break;

            default:
                result.status = 'WARNING';
                result.actualResult = 'Test scenario not yet implemented';
                break;
        }
        return result;
    }

    async runManagerTest(testId, scenario, testData, expectedResult, result) {
        switch (testId) {
            case 'C001': // Manager Login
                await this.logout();
                await this.loginAs('manager');
                if (await this.isManagerDashboard()) {
                    result.status = 'PASSED';
                    result.actualResult = 'Manager login successful, dashboard accessible';
                }
                break;

            case 'C003': // View Team Timesheets
                await this.ensureManagerLogin();
                const timesheetAccess = await this.navigateToTeamTimesheets();
                if (timesheetAccess) {
                    result.status = 'PASSED';
                    result.actualResult = 'Team timesheets accessible';
                }
                break;

            case 'C004': // Approve Timesheet
                await this.ensureManagerLogin();
                const approvalSuccess = await this.approveTimesheet();
                if (approvalSuccess) {
                    result.status = 'PASSED';
                    result.actualResult = 'Timesheet approved successfully';
                }
                break;

            case 'C006': // View Leave Requests
                await this.ensureManagerLogin();
                const leaveAccess = await this.navigateToLeaveApprovals();
                if (leaveAccess) {
                    result.status = 'PASSED';
                    result.actualResult = 'Leave requests accessible';
                }
                break;

            case 'C007': // Approve Leave Request
                await this.ensureManagerLogin();
                const leaveApproval = await this.approveLeaveRequest();
                if (leaveApproval) {
                    result.status = 'PASSED';
                    result.actualResult = 'Leave request approved successfully';
                }
                break;

            default:
                result.status = 'WARNING';
                result.actualResult = 'Test scenario not yet implemented';
                break;
        }
        return result;
    }

    async runIntegrationTest(testId, scenario, testData, expectedResult, result) {
        result.status = 'WARNING';
        result.actualResult = 'Integration test scenarios require specific implementation';
        return result;
    }

    async runErrorTest(testId, scenario, testData, expectedResult, result) {
        switch (testId) {
            case 'E001': // Invalid Login
                await this.logout();
                const loginFailed = await this.attemptInvalidLogin();
                if (loginFailed) {
                    result.status = 'PASSED';
                    result.actualResult = 'Invalid login properly rejected with error message';
                }
                break;

            default:
                result.status = 'WARNING';
                result.actualResult = 'Error test scenario not yet implemented';
                break;
        }
        return result;
    }

    // Helper Methods
    async loginAs(role) {
        try {
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
            
            const credentials = this.testData[role];
            await this.page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 5000 });
            
            await this.page.type('input[type="email"], input[name="email"], #email', credentials.email);
            await this.page.type('input[type="password"], input[name="password"], #password', credentials.password);
            
            await this.page.click('button[type="submit"], .login-btn, .btn-primary');
            await this.page.waitForTimeout(2000);
            
            return true;
        } catch (error) {
            console.log(`Login failed for ${role}: ${error.message}`);
            return false;
        }
    }

    async logout() {
        try {
            const logoutButton = await this.page.$('.logout, .signout, button[title*="logout" i]');
            if (logoutButton) {
                await logoutButton.click();
                await this.page.waitForTimeout(1000);
            }
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
            return true;
        } catch (error) {
            return false;
        }
    }

    async isAdminDashboard() {
        try {
            await this.page.waitForTimeout(2000);
            const adminElements = await this.page.$('[data-testid*="admin"], .admin-dashboard, .admin-panel, [class*="admin"]');
            return !!adminElements;
        } catch {
            return false;
        }
    }

    async isEmployeeDashboard() {
        try {
            await this.page.waitForTimeout(2000);
            const employeeElements = await this.page.$('[data-testid*="employee"], .employee-dashboard, .employee-panel, [class*="employee"]');
            return !!employeeElements;
        } catch {
            return false;
        }
    }

    async isManagerDashboard() {
        try {
            await this.page.waitForTimeout(2000);
            const managerElements = await this.page.$('[data-testid*="manager"], .manager-dashboard, .manager-panel, [class*="manager"]');
            return !!managerElements;
        } catch {
            return false;
        }
    }

    async ensureAdminLogin() {
        if (!(await this.isAdminDashboard())) {
            await this.loginAs('admin');
        }
    }

    async ensureEmployeeLogin() {
        if (!(await this.isEmployeeDashboard())) {
            await this.loginAs('employee');
        }
    }

    async ensureManagerLogin() {
        if (!(await this.isManagerDashboard())) {
            await this.loginAs('manager');
        }
    }

    async navigateToTimesheet() {
        try {
            const timesheetLink = await this.page.$('a[href*="timesheet"], .timesheet, [data-testid*="timesheet"]');
            if (timesheetLink) {
                await timesheetLink.click();
                await this.page.waitForTimeout(2000);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    async navigateToLeaveRequests() {
        try {
            const leaveLink = await this.page.$('a[href*="leave"], .leave, [data-testid*="leave"]');
            if (leaveLink) {
                await leaveLink.click();
                await this.page.waitForTimeout(2000);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    async navigateToPayslip() {
        try {
            const payslipLink = await this.page.$('a[href*="payslip"], a[href*="salary"], .payslip, [data-testid*="payslip"]');
            if (payslipLink) {
                await payslipLink.click();
                await this.page.waitForTimeout(2000);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    async createEmployee(employeeData, role = 'Employee') {
        // Implementation for creating employee through admin interface
        return false; // Placeholder
    }

    async setEmployeeCredentials(employeeData) {
        // Implementation for setting employee credentials
        return false; // Placeholder
    }

    async configurePayslip(employeeData) {
        // Implementation for configuring payslip
        return false; // Placeholder
    }

    async submitTimesheetEntry() {
        // Implementation for submitting timesheet entry
        return false; // Placeholder
    }

    async submitLeaveRequest() {
        // Implementation for submitting leave request
        return false; // Placeholder
    }

    async navigateToTeamTimesheets() {
        // Implementation for accessing team timesheets as manager
        return false; // Placeholder
    }

    async approveTimesheet() {
        // Implementation for approving timesheet
        return false; // Placeholder
    }

    async navigateToLeaveApprovals() {
        // Implementation for accessing leave approvals
        return false; // Placeholder
    }

    async approveLeaveRequest() {
        // Implementation for approving leave request
        return false; // Placeholder
    }

    async attemptInvalidLogin() {
        try {
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
            await this.page.type('input[type="email"], input[name="email"], #email', 'invalid@test.com');
            await this.page.type('input[type="password"], input[name="password"], #password', 'wrongpassword');
            await this.page.click('button[type="submit"], .login-btn, .btn-primary');
            
            await this.page.waitForTimeout(2000);
            
            const errorMessage = await this.page.$('.error, .alert-danger, [class*="error"]');
            return !!errorMessage;
        } catch {
            return false;
        }
    }

    async generateReport() {
        const endTime = new Date();
        const duration = endTime - this.startTime;
        
        const passed = this.results.filter(r => r.status === 'PASSED').length;
        const failed = this.results.filter(r => r.status === 'FAILED').length;
        const warnings = this.results.filter(r => r.status === 'WARNING').length;
        const total = this.results.length;
        
        const report = {
            summary: {
                total,
                passed,
                failed,
                warnings,
                successRate: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
                totalDuration: duration,
                timestamp: endTime.toISOString()
            },
            results: this.results
        };

        // Save detailed report
        fs.writeFileSync(
            path.join(__dirname, 'automated-test-results.json'),
            JSON.stringify(report, null, 2)
        );

        // Update CSV with results
        await this.updateCSVResults();

        console.log('\n📊 AUTOMATED TEST EXECUTION COMPLETE');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
        console.log(`❌ Failed: ${failed} (${((failed/total)*100).toFixed(1)}%)`);
        console.log(`⚠️  Warnings: ${warnings} (${((warnings/total)*100).toFixed(1)}%)`);
        console.log(`🎯 Success Rate: ${report.summary.successRate}%`);
        console.log(`⏱️  Duration: ${(duration/1000).toFixed(2)} seconds`);
        console.log(`📄 Detailed report: automated-test-results.json`);

        return report;
    }

    async updateCSVResults() {
        try {
            const csvPath = path.join(__dirname, '..', 'TEST_SCENARIOS_SPREADSHEET.csv');
            let csvContent = fs.readFileSync(csvPath, 'utf8');
            
            this.results.forEach(result => {
                const regex = new RegExp(`^${result.testId},`, 'm');
                if (csvContent.match(regex)) {
                    // Update the existing row
                    csvContent = csvContent.replace(
                        regex,
                        `${result.testId},${result.section},"${result.scenario}","${result.testData}","${result.expectedResult}","${result.actualResult}",${result.status},"${result.comments}",${result.priority},"AutoTest","${new Date().toLocaleDateString()}"`
                    );
                }
            });
            
            fs.writeFileSync(csvPath, csvContent);
            console.log('✅ CSV results updated successfully');
        } catch (error) {
            console.log('⚠️ Could not update CSV:', error.message);
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Test Scenarios Data
const testScenarios = [
    // Admin Operations (Priority tests)
    { id: 'A001', section: 'Admin Operations', scenario: 'Admin Login and Authentication', testData: 'admin@test.com / admin123', expected: 'Successful login, admin dashboard access', priority: 'P1' },
    { id: 'A002', section: 'Admin Operations', scenario: 'Create New Employee Record', testData: 'John Smith, john.smith@company.com', expected: 'Employee record created', priority: 'P1' },
    { id: 'A003', section: 'Admin Operations', scenario: 'Set Employee Login Credentials', testData: 'john.smith@company.com / employee123', expected: 'Login credentials configured', priority: 'P1' },
    { id: 'A004', section: 'Admin Operations', scenario: 'Configure Employee Payslip Details', testData: 'Salary: $5000, Tax: 20%', expected: 'Payslip configuration saved', priority: 'P1' },
    { id: 'A005', section: 'Admin Operations', scenario: 'Create Manager Employee', testData: 'Jane Manager, jane.manager@company.com', expected: 'Manager record created', priority: 'P1' },

    // Employee Operations (Priority tests)
    { id: 'B001', section: 'Employee Operations', scenario: 'Employee First Login', testData: 'john.smith@company.com / employee123', expected: 'Successful login, employee dashboard', priority: 'P1' },
    { id: 'B002', section: 'Employee Operations', scenario: 'Access Employee Dashboard', testData: 'Navigate after login', expected: 'Dashboard loads with widgets', priority: 'P1' },
    { id: 'B004', section: 'Employee Operations', scenario: 'Access Timesheet Module', testData: 'Navigate to Timesheets', expected: 'Timesheet page loads', priority: 'P1' },
    { id: 'B005', section: 'Employee Operations', scenario: 'Submit Daily Timesheet Entry', testData: '9:00 AM - 5:00 PM, Development work', expected: 'Timesheet entry saved', priority: 'P1' },
    { id: 'B007', section: 'Employee Operations', scenario: 'Access Leave Request Module', testData: 'Navigate to Leave Requests', expected: 'Leave request page accessible', priority: 'P1' },
    { id: 'B008', section: 'Employee Operations', scenario: 'Submit Annual Leave Request', testData: 'Next Monday-Friday, 5 days vacation', expected: 'Leave request submitted', priority: 'P1' },
    { id: 'B011', section: 'Employee Operations', scenario: 'Access Payslip Module', testData: 'Navigate to Payslip section', expected: 'Payslip page loads', priority: 'P1' },

    // Manager Operations (Priority tests)
    { id: 'C001', section: 'Manager Operations', scenario: 'Manager Login and Authentication', testData: 'jane.manager@company.com / manager123', expected: 'Manager login, dashboard access', priority: 'P1' },
    { id: 'C003', section: 'Manager Operations', scenario: 'View Team Timesheets', testData: 'Navigate to team timesheet section', expected: 'Employee timesheets for approval', priority: 'P1' },
    { id: 'C004', section: 'Manager Operations', scenario: 'Approve Employee Timesheet', testData: 'John Smith current week timesheet', expected: 'Timesheet approved, status updated', priority: 'P1' },
    { id: 'C006', section: 'Manager Operations', scenario: 'View Pending Leave Requests', testData: 'Navigate to leave approval section', expected: 'Pending requests displayed', priority: 'P1' },
    { id: 'C007', section: 'Manager Operations', scenario: 'Approve Annual Leave Request', testData: 'John Smith 5-day annual leave', expected: 'Leave approved, calendar updated', priority: 'P1' },

    // Error Handling (Sample test)
    { id: 'E001', section: 'Error Handling', scenario: 'Invalid Login Credentials', testData: 'invalid@test.com / wrongpassword', expected: 'Error message, login denied', priority: 'P1' }
];

// Main execution
async function runAllTests() {
    const runner = new AutomatedTestScenariosRunner();
    
    try {
        await runner.init();
        
        console.log(`🎯 Running ${testScenarios.length} Priority Test Scenarios...`);
        console.log('=' * 60);
        
        for (const testScenario of testScenarios) {
            await runner.runTestScenario(
                testScenario.id,
                testScenario.section,
                testScenario.scenario,
                testScenario.testData,
                testScenario.expected,
                testScenario.priority
            );
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const report = await runner.generateReport();
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
    } finally {
        await runner.close();
    }
}

// Run if called directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = AutomatedTestScenariosRunner;
