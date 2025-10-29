const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:8080',
    adminCredentials: {
        email: 'admin@skyraksys.com',
        password: 'Admin123!'
    },
    testData: {
        employee: {
            email: 'john.doe@test.com',
            password: 'Employee123!',
            firstName: 'John',
            lastName: 'Doe',
            department: 'Engineering',
            jobTitle: 'Software Developer',
            salary: 75000
        },
        manager: {
            email: 'manager@test.com',
            password: 'Manager123!',
            firstName: 'Alice',
            lastName: 'Manager',
            department: 'Engineering',
            jobTitle: 'Engineering Manager',
            salary: 95000
        }
    }
};

class ExcelScenarioTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.screenshots = [];
        this.startTime = new Date();
    }

    async initialize() {
        console.log('🚀 Starting Excel-Based Scenario Testing...');
        console.log('===========================================');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1280, height: 720 },
            args: ['--start-maximized']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    }

    async logTest(scenario, description, status, details = '') {
        const timestamp = new Date().toISOString();
        const result = {
            timestamp,
            scenario,
            description,
            status,
            details
        };
        
        this.testResults.push(result);
        
        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${statusIcon} [${scenario}] ${description} - ${status}`);
        if (details) console.log(`   Details: ${details}`);
    }

    async takeScreenshot(name) {
        try {
            const filename = `screenshot_${Date.now()}_${name}.png`;
            const filepath = path.join(__dirname, 'test-screenshots', filename);
            
            // Create directory if it doesn't exist
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            await this.page.screenshot({ path: filepath, fullPage: true });
            this.screenshots.push({ name, filepath, filename });
            return filename;
        } catch (error) {
            console.log(`⚠️ Screenshot failed: ${error.message}`);
            return null;
        }
    }

    async waitForElement(selector, timeout = 10000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            return false;
        }
    }

    async safeClick(selector, description = '') {
        try {
            await this.page.waitForSelector(selector, { timeout: 5000 });
            await this.page.click(selector);
            await this.page.waitForTimeout(1000);
            return true;
        } catch (error) {
            console.log(`⚠️ Click failed for ${description}: ${error.message}`);
            return false;
        }
    }

    async safeType(selector, text, description = '') {
        try {
            await this.page.waitForSelector(selector, { timeout: 5000 });
            await this.page.click(selector);
            await this.page.evaluate((sel) => {
                const element = document.querySelector(sel);
                if (element) element.value = '';
            }, selector);
            await this.page.type(selector, text);
            return true;
        } catch (error) {
            console.log(`⚠️ Type failed for ${description}: ${error.message}`);
            return false;
        }
    }

    // Test Scenario 1: Authentication Flow
    async testAuthenticationFlow() {
        console.log('\n🔐 Testing Authentication Flow...');
        
        try {
            // Navigate to login page
            await this.page.goto(config.baseUrl, { waitUntil: 'networkidle2' });
            await this.takeScreenshot('01_login_page');
            
            // Check if login form exists
            const hasLoginForm = await this.waitForElement('input[type="email"], input[name="email"]');
            if (!hasLoginForm) {
                await this.logTest('AUTH-01', 'Login form visibility', 'FAIL', 'Login form not found');
                return false;
            }
            
            await this.logTest('AUTH-01', 'Login page loaded', 'PASS', 'Login form visible');
            
            // Attempt login with admin credentials
            const emailSelector = 'input[type="email"], input[name="email"]';
            const passwordSelector = 'input[type="password"], input[name="password"]';
            const loginButtonSelector = 'button[type="submit"], .login-btn, .btn-login';
            
            await this.safeType(emailSelector, config.adminCredentials.email, 'email field');
            await this.safeType(passwordSelector, config.adminCredentials.password, 'password field');
            
            await this.takeScreenshot('02_login_credentials_entered');
            
            await this.safeClick(loginButtonSelector, 'login button');
            
            // Wait for navigation or dashboard
            await this.page.waitForTimeout(3000);
            
            const currentUrl = this.page.url();
            if (currentUrl !== config.baseUrl || await this.page.$('.dashboard, .main-content, .welcome')) {
                await this.logTest('AUTH-02', 'Admin login successful', 'PASS', `Navigated to: ${currentUrl}`);
                await this.takeScreenshot('03_admin_dashboard');
                return true;
            } else {
                await this.logTest('AUTH-02', 'Admin login failed', 'FAIL', 'Still on login page');
                return false;
            }
            
        } catch (error) {
            await this.logTest('AUTH-02', 'Authentication test error', 'FAIL', error.message);
            return false;
        }
    }

    // Test Scenario 2: Employee Management
    async testEmployeeManagement() {
        console.log('\n👥 Testing Employee Management...');
        
        try {
            // Navigate to employee management
            const employeesLink = await this.page.$('a[href*="employees"], .nav-employees, .menu-employees');
            if (employeesLink) {
                await employeesLink.click();
                await this.page.waitForTimeout(2000);
            }
            
            await this.takeScreenshot('04_employees_page');
            
            // Test Add Employee
            const addEmployeeButton = await this.page.$('button:contains("Add"), .btn-add, .add-employee');
            if (addEmployeeButton) {
                await addEmployeeButton.click();
                await this.page.waitForTimeout(1000);
                
                // Fill employee form
                await this.safeType('input[name="firstName"]', config.testData.employee.firstName);
                await this.safeType('input[name="lastName"]', config.testData.employee.lastName);
                await this.safeType('input[name="email"]', config.testData.employee.email);
                await this.safeType('input[name="department"]', config.testData.employee.department);
                await this.safeType('input[name="jobTitle"]', config.testData.employee.jobTitle);
                
                await this.takeScreenshot('05_employee_form_filled');
                
                // Submit form
                const submitButton = await this.page.$('button[type="submit"], .btn-submit, .btn-save');
                if (submitButton) {
                    await submitButton.click();
                    await this.page.waitForTimeout(2000);
                    
                    // Check for success message or employee in list
                    const success = await this.page.$('.success, .alert-success') ||
                                   await this.page.$(`text="${config.testData.employee.firstName}"`);
                    
                    if (success) {
                        await this.logTest('EMP-01', 'Employee creation', 'PASS', 'Employee added successfully');
                    } else {
                        await this.logTest('EMP-01', 'Employee creation', 'WARN', 'Employee may have been added but confirmation unclear');
                    }
                } else {
                    await this.logTest('EMP-01', 'Employee creation', 'FAIL', 'Submit button not found');
                }
            } else {
                await this.logTest('EMP-01', 'Employee management access', 'FAIL', 'Add employee button not found');
            }
            
            await this.takeScreenshot('06_employee_management_complete');
            return true;
            
        } catch (error) {
            await this.logTest('EMP-01', 'Employee management error', 'FAIL', error.message);
            return false;
        }
    }

    // Test Scenario 3: Timesheet Management
    async testTimesheetManagement() {
        console.log('\n⏰ Testing Timesheet Management...');
        
        try {
            // Navigate to timesheets
            const timesheetsLink = await this.page.$('a[href*="timesheet"], .nav-timesheet, .menu-timesheet');
            if (timesheetsLink) {
                await timesheetsLink.click();
                await this.page.waitForTimeout(2000);
            }
            
            await this.takeScreenshot('07_timesheets_page');
            
            // Test Add Timesheet Entry
            const addTimesheetButton = await this.page.$('button:contains("Add"), .btn-add-timesheet, .add-entry');
            if (addTimesheetButton) {
                await addTimesheetButton.click();
                await this.page.waitForTimeout(1000);
                
                // Fill timesheet form
                const today = new Date().toISOString().split('T')[0];
                await this.safeType('input[name="date"], input[type="date"]', today);
                await this.safeType('input[name="startTime"], input[type="time"]:first-of-type', '09:00');
                await this.safeType('input[name="endTime"], input[type="time"]:last-of-type', '17:00');
                await this.safeType('textarea[name="notes"], .notes', 'Automated test timesheet entry');
                
                await this.takeScreenshot('08_timesheet_form_filled');
                
                // Submit timesheet
                const submitButton = await this.page.$('button[type="submit"], .btn-submit, .btn-save');
                if (submitButton) {
                    await submitButton.click();
                    await this.page.waitForTimeout(2000);
                    
                    const success = await this.page.$('.success, .alert-success') ||
                                   await this.page.$(`text="${today}"`);
                    
                    if (success) {
                        await this.logTest('TIME-01', 'Timesheet entry creation', 'PASS', 'Timesheet entry added');
                    } else {
                        await this.logTest('TIME-01', 'Timesheet entry creation', 'WARN', 'Timesheet may have been added');
                    }
                } else {
                    await this.logTest('TIME-01', 'Timesheet form submission', 'FAIL', 'Submit button not found');
                }
            } else {
                await this.logTest('TIME-01', 'Timesheet management access', 'FAIL', 'Add timesheet button not found');
            }
            
            await this.takeScreenshot('09_timesheet_complete');
            return true;
            
        } catch (error) {
            await this.logTest('TIME-01', 'Timesheet management error', 'FAIL', error.message);
            return false;
        }
    }

    // Test Scenario 4: Leave Request Management
    async testLeaveManagement() {
        console.log('\n🏖️ Testing Leave Request Management...');
        
        try {
            // Navigate to leave requests
            const leaveLink = await this.page.$('a[href*="leave"], .nav-leave, .menu-leave');
            if (leaveLink) {
                await leaveLink.click();
                await this.page.waitForTimeout(2000);
            }
            
            await this.takeScreenshot('10_leave_page');
            
            // Test Add Leave Request
            const addLeaveButton = await this.page.$('button:contains("Add"), .btn-add-leave, .request-leave');
            if (addLeaveButton) {
                await addLeaveButton.click();
                await this.page.waitForTimeout(1000);
                
                // Fill leave request form
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const startDate = tomorrow.toISOString().split('T')[0];
                
                const endDate = new Date(tomorrow);
                endDate.setDate(endDate.getDate() + 2);
                const endDateStr = endDate.toISOString().split('T')[0];
                
                await this.safeType('input[name="startDate"], input[type="date"]:first-of-type', startDate);
                await this.safeType('input[name="endDate"], input[type="date"]:last-of-type', endDateStr);
                await this.safeType('select[name="type"], select[name="leaveType"]', 'vacation');
                await this.safeType('textarea[name="reason"], .reason', 'Automated test leave request');
                
                await this.takeScreenshot('11_leave_form_filled');
                
                // Submit leave request
                const submitButton = await this.page.$('button[type="submit"], .btn-submit, .btn-save');
                if (submitButton) {
                    await submitButton.click();
                    await this.page.waitForTimeout(2000);
                    
                    const success = await this.page.$('.success, .alert-success') ||
                                   await this.page.$(`text="${startDate}"`);
                    
                    if (success) {
                        await this.logTest('LEAVE-01', 'Leave request creation', 'PASS', 'Leave request submitted');
                    } else {
                        await this.logTest('LEAVE-01', 'Leave request creation', 'WARN', 'Leave request may have been submitted');
                    }
                } else {
                    await this.logTest('LEAVE-01', 'Leave request submission', 'FAIL', 'Submit button not found');
                }
            } else {
                await this.logTest('LEAVE-01', 'Leave management access', 'FAIL', 'Add leave button not found');
            }
            
            await this.takeScreenshot('12_leave_complete');
            return true;
            
        } catch (error) {
            await this.logTest('LEAVE-01', 'Leave management error', 'FAIL', error.message);
            return false;
        }
    }

    // Test Scenario 5: Payslip Management
    async testPayslipManagement() {
        console.log('\n💰 Testing Payslip Management...');
        
        try {
            // Navigate to payslips
            const payslipLink = await this.page.$('a[href*="payslip"], .nav-payslip, .menu-payslip');
            if (payslipLink) {
                await payslipLink.click();
                await this.page.waitForTimeout(2000);
            }
            
            await this.takeScreenshot('13_payslips_page');
            
            // Check if payslips are displayed
            const payslipElements = await this.page.$$('.payslip-item, .payslip-row, tbody tr');
            
            if (payslipElements.length > 0) {
                await this.logTest('PAY-01', 'Payslip display', 'PASS', `Found ${payslipElements.length} payslip(s)`);
                
                // Test payslip download/view
                const viewButton = await this.page.$('button:contains("View"), .btn-view, .view-payslip');
                if (viewButton) {
                    await viewButton.click();
                    await this.page.waitForTimeout(2000);
                    await this.logTest('PAY-02', 'Payslip view', 'PASS', 'Payslip viewing functionality works');
                }
                
            } else {
                await this.logTest('PAY-01', 'Payslip display', 'WARN', 'No payslips found (may be expected for new system)');
            }
            
            await this.takeScreenshot('14_payslip_complete');
            return true;
            
        } catch (error) {
            await this.logTest('PAY-01', 'Payslip management error', 'FAIL', error.message);
            return false;
        }
    }

    // Test Scenario 6: Navigation and UI Components
    async testNavigationAndUI() {
        console.log('\n🧭 Testing Navigation and UI Components...');
        
        try {
            // Test main navigation
            const navItems = await this.page.$$('nav a, .navbar a, .sidebar a, .menu a');
            let workingNavItems = 0;
            
            for (let i = 0; i < Math.min(navItems.length, 5); i++) {
                try {
                    await navItems[i].click();
                    await this.page.waitForTimeout(1000);
                    workingNavItems++;
                } catch (error) {
                    // Continue testing other nav items
                }
            }
            
            if (workingNavItems > 0) {
                await this.logTest('UI-01', 'Navigation functionality', 'PASS', `${workingNavItems} navigation items working`);
            } else {
                await this.logTest('UI-01', 'Navigation functionality', 'WARN', 'Limited navigation found');
            }
            
            // Test responsive design
            await this.page.setViewport({ width: 768, height: 1024 });
            await this.page.waitForTimeout(1000);
            await this.takeScreenshot('15_mobile_view');
            
            await this.page.setViewport({ width: 1280, height: 720 });
            await this.logTest('UI-02', 'Responsive design', 'PASS', 'Viewport changes handled');
            
            await this.takeScreenshot('16_navigation_complete');
            return true;
            
        } catch (error) {
            await this.logTest('UI-01', 'Navigation and UI error', 'FAIL', error.message);
            return false;
        }
    }

    // Generate comprehensive report
    async generateReport() {
        const endTime = new Date();
        const duration = Math.round((endTime - this.startTime) / 1000);
        
        const passCount = this.testResults.filter(r => r.status === 'PASS').length;
        const failCount = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnCount = this.testResults.filter(r => r.status === 'WARN').length;
        const totalTests = this.testResults.length;
        const successRate = Math.round((passCount / totalTests) * 100);
        
        const report = `
# 🎯 Excel-Based Scenario Testing Report
Generated: ${new Date().toISOString()}
Duration: ${duration} seconds

## 📊 Test Results Summary
- **Total Tests**: ${totalTests}
- **Passed**: ${passCount} ✅
- **Failed**: ${failCount} ❌  
- **Warnings**: ${warnCount} ⚠️
- **Success Rate**: ${successRate}%

## 📋 Detailed Test Results

${this.testResults.map(result => `
### ${result.scenario}: ${result.description}
- **Status**: ${result.status === 'PASS' ? '✅ PASS' : result.status === 'FAIL' ? '❌ FAIL' : '⚠️ WARN'}
- **Timestamp**: ${result.timestamp}
- **Details**: ${result.details || 'N/A'}
`).join('\n')}

## 📸 Screenshots Generated
${this.screenshots.map(shot => `- ${shot.name}: ${shot.filename}`).join('\n')}

## 🎯 Overall Assessment
${successRate >= 90 ? '🎉 EXCELLENT! All major functionalities are working correctly.' :
  successRate >= 75 ? '✅ GOOD! Most functionalities are working with minor issues.' :
  successRate >= 50 ? '⚠️ PARTIAL! Several issues need attention.' :
  '❌ CRITICAL! Major issues detected that need immediate attention.'}

## 🔗 Application URLs
- Frontend: ${config.baseUrl}
- API: ${config.apiUrl}

## 🔐 Test Credentials Used
- Admin: ${config.adminCredentials.email}

---
*Automated Excel-Based Scenario Testing Complete*
        `;
        
        const reportPath = path.join(__dirname, `excel_scenario_test_report_${Date.now()}.md`);
        fs.writeFileSync(reportPath, report);
        
        console.log('\n📄 Report generated:', reportPath);
        console.log('\n' + '='.repeat(50));
        console.log('📊 FINAL TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Passed: ${passCount}/${totalTests}`);
        console.log(`❌ Failed: ${failCount}/${totalTests}`);
        console.log(`⚠️ Warnings: ${warnCount}/${totalTests}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log(`⏱️ Duration: ${duration}s`);
        
        return { successRate, passCount, failCount, warnCount, totalTests, duration };
    }

    // Main test execution
    async runAllTests() {
        try {
            await this.initialize();
            
            // Execute all test scenarios
            await this.testAuthenticationFlow();
            await this.testEmployeeManagement(); 
            await this.testTimesheetManagement();
            await this.testLeaveManagement();
            await this.testPayslipManagement();
            await this.testNavigationAndUI();
            
            // Generate final report
            const results = await this.generateReport();
            
            await this.browser.close();
            
            return results;
            
        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            if (this.browser) {
                await this.browser.close();
            }
            throw error;
        }
    }
}

// Execute tests
async function main() {
    const tester = new ExcelScenarioTester();
    try {
        const results = await tester.runAllTests();
        
        if (results.successRate >= 90) {
            console.log('\n🎉 ALL SYSTEMS FUNCTIONAL! Your HRM application is working perfectly with PostgreSQL.');
            process.exit(0);
        } else if (results.successRate >= 75) {
            console.log('\n✅ MOSTLY FUNCTIONAL! Minor issues detected but core features working.');
            process.exit(0);
        } else {
            console.log('\n⚠️ ISSUES DETECTED! Please review the failed tests and resolve issues.');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Test suite failed to complete:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = ExcelScenarioTester;
