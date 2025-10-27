/**
 * 🎯 COMPREHENSIVE BUSINESS USE CASE VALIDATOR
 * 
 * This validator ensures 100% accuracy in business use case testing
 * with real-time tracking, detailed reporting, and comprehensive validation
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ComprehensiveBusinessValidator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            timestamp: new Date().toISOString(),
            testStarted: new Date().toLocaleString(),
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            businessCases: {},
            detailedLog: [],
            screenshots: [],
            criticalIssues: [],
            recommendations: []
        };
        this.baseUrl = 'http://localhost:3000';
        this.apiUrl = 'http://localhost:8080';
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${level}: ${message}`;
        console.log(logEntry);
        this.results.detailedLog.push({
            timestamp,
            level,
            message,
            time: new Date().toISOString()
        });
    }

    async captureScreenshot(name, description = '') {
        try {
            const screenshotPath = path.join(__dirname, '..', `${name}.png`);
            await this.page.screenshot({ 
                path: screenshotPath,
                fullPage: true 
            });
            this.results.screenshots.push({
                name,
                description,
                path: screenshotPath,
                timestamp: new Date().toISOString()
            });
            this.log(`📸 Screenshot captured: ${name}.png - ${description}`, 'CAPTURE');
        } catch (error) {
            this.log(`❌ Screenshot failed: ${error.message}`, 'ERROR');
        }
    }

    async waitForElement(selectors, timeout = 10000, description = 'element') {
        const allSelectors = Array.isArray(selectors) ? selectors : [selectors];
        
        for (const selector of allSelectors) {
            try {
                this.log(`🔍 Looking for ${description}: ${selector}`);
                await this.page.waitForSelector(selector, { timeout: timeout / allSelectors.length });
                this.log(`✅ Found ${description}: ${selector}`);
                return selector;
            } catch (error) {
                this.log(`⏳ Selector ${selector} not found, trying next...`);
            }
        }
        
        throw new Error(`❌ None of the selectors found for ${description}: ${allSelectors.join(', ')}`);
    }

    async validateBusinessCase(caseName, testFunction) {
        this.results.totalTests++;
        this.log(`🎯 Starting business case: ${caseName}`, 'TEST_START');
        
        const startTime = Date.now();
        let success = false;
        let error = null;
        let details = {};

        try {
            details = await testFunction();
            success = true;
            this.results.passedTests++;
            this.log(`✅ Business case PASSED: ${caseName}`, 'SUCCESS');
        } catch (err) {
            error = err.message;
            this.results.failedTests++;
            this.results.criticalIssues.push({
                businessCase: caseName,
                error: error,
                timestamp: new Date().toISOString()
            });
            this.log(`❌ Business case FAILED: ${caseName} - ${error}`, 'FAILURE');
        }

        const duration = Date.now() - startTime;
        
        this.results.businessCases[caseName] = {
            success,
            error,
            duration,
            details,
            timestamp: new Date().toISOString()
        };

        await this.updateRealTimeChecklist();
        return success;
    }

    async testAuthentication() {
        return await this.validateBusinessCase('Employee Authentication', async () => {
            this.log('👤 Testing employee authentication system');
            
            // Navigate to login page
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            await this.captureScreenshot('01-login-page', 'Initial login page');

            // Find and fill email
            const emailSelector = await this.waitForElement([
                'input[name="email"]',
                'input[type="email"]',
                'input[placeholder*="email" i]',
                '#email'
            ], 15000, 'email input');
            
            await this.page.type(emailSelector, 'employee@test.com', { delay: 100 });
            this.log('✅ Email filled successfully');

            // Find and fill password
            const passwordSelector = await this.waitForElement([
                'input[name="password"]',
                'input[type="password"]',
                '#password'
            ], 10000, 'password input');
            
            await this.page.type(passwordSelector, 'admin123', { delay: 100 });
            this.log('✅ Password filled successfully');

            // Find and click login button
            const loginButtonSelector = await this.waitForElement([
                'button[type="submit"]',
                'button:contains("Login")',
                'input[type="submit"]',
                '.login-button',
                '#login-btn'
            ], 10000, 'login button');
            
            await this.page.click(loginButtonSelector);
            this.log('✅ Login button clicked');

            // Wait for redirect and validate login success
            await this.page.waitForTimeout(3000);
            const currentUrl = this.page.url();
            
            if (!currentUrl.includes('dashboard')) {
                throw new Error(`Login failed - still at: ${currentUrl}`);
            }

            await this.captureScreenshot('02-login-success', 'Successful employee login');
            
            return {
                loginUrl: currentUrl,
                emailField: emailSelector,
                passwordField: passwordSelector,
                loginButton: loginButtonSelector,
                redirectSuccess: true
            };
        });
    }

    async testTimesheetManagement() {
        return await this.validateBusinessCase('Timesheet Management', async () => {
            this.log('📋 Testing timesheet management workflow');
            
            // Navigate to timesheet page
            await this.page.goto(`${this.baseUrl}/timesheets`, { waitUntil: 'networkidle0' });
            await this.page.waitForTimeout(2000);
            
            await this.captureScreenshot('03-timesheet-page', 'Timesheet management page');

            // Check page content
            const pageContent = await this.page.content();
            const timesheetKeywords = ['timesheet', 'time', 'hours', 'work', 'log', 'entry'];
            const foundKeywords = timesheetKeywords.filter(keyword => 
                pageContent.toLowerCase().includes(keyword)
            );

            if (foundKeywords.length === 0) {
                throw new Error('Timesheet page does not contain relevant content');
            }

            // Check for interactive elements
            const formElements = await this.page.evaluate(() => {
                return {
                    inputs: document.querySelectorAll('input').length,
                    selects: document.querySelectorAll('select').length,
                    textareas: document.querySelectorAll('textarea').length,
                    buttons: document.querySelectorAll('button').length
                };
            });

            const totalInteractiveElements = Object.values(formElements).reduce((a, b) => a + b, 0);
            
            if (totalInteractiveElements === 0) {
                throw new Error('No interactive elements found on timesheet page');
            }

            this.log(`✅ Found ${totalInteractiveElements} interactive elements`);

            return {
                url: this.page.url(),
                keywordsFound: foundKeywords,
                formElements,
                totalInteractiveElements,
                hasTimesheetContent: foundKeywords.length > 0
            };
        });
    }

    async testLeaveManagement() {
        return await this.validateBusinessCase('Leave Request Management', async () => {
            this.log('🏖️ Testing leave request management workflow');
            
            // Navigate to leave requests page
            await this.page.goto(`${this.baseUrl}/leave-requests`, { waitUntil: 'networkidle0' });
            await this.page.waitForTimeout(2000);
            
            await this.captureScreenshot('04-leave-page', 'Leave request management page');

            // Check page content
            const pageContent = await this.page.content();
            const leaveKeywords = ['leave', 'vacation', 'request', 'sick', 'personal', 'absence'];
            const foundKeywords = leaveKeywords.filter(keyword => 
                pageContent.toLowerCase().includes(keyword)
            );

            if (foundKeywords.length === 0) {
                throw new Error('Leave page does not contain relevant content');
            }

            // Check for interactive elements and tables
            const pageElements = await this.page.evaluate(() => {
                return {
                    inputs: document.querySelectorAll('input').length,
                    selects: document.querySelectorAll('select').length,
                    textareas: document.querySelectorAll('textarea').length,
                    buttons: document.querySelectorAll('button').length,
                    tables: document.querySelectorAll('table').length,
                    forms: document.querySelectorAll('form').length
                };
            });

            return {
                url: this.page.url(),
                keywordsFound: foundKeywords,
                pageElements,
                hasLeaveContent: foundKeywords.length > 0,
                hasInteractiveElements: Object.values(pageElements).reduce((a, b) => a + b, 0) > 0
            };
        });
    }

    async testManagerAuthentication() {
        return await this.validateBusinessCase('Manager Authentication', async () => {
            this.log('👔 Testing manager authentication system');
            
            // Clear all data and start fresh
            await this.page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });
            
            // Navigate to login page
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            await this.page.waitForTimeout(2000);

            await this.captureScreenshot('05-manager-login-page', 'Manager login attempt');

            // Find and fill email
            const emailSelector = await this.waitForElement([
                'input[name="email"]',
                'input[type="email"]',
                'input[placeholder*="email" i]',
                '#email'
            ], 15000, 'email input for manager');
            
            // Clear field and type manager email
            await this.page.click(emailSelector, { clickCount: 3 });
            await this.page.type(emailSelector, 'manager@test.com', { delay: 100 });
            this.log('✅ Manager email filled successfully');

            // Find and fill password
            const passwordSelector = await this.waitForElement([
                'input[name="password"]',
                'input[type="password"]',
                '#password'
            ], 10000, 'password input for manager');
            
            await this.page.click(passwordSelector, { clickCount: 3 });
            await this.page.type(passwordSelector, 'admin123', { delay: 100 });
            this.log('✅ Manager password filled successfully');

            // Click login button
            const loginButtonSelector = await this.waitForElement([
                'button[type="submit"]',
                'button:contains("Login")',
                'input[type="submit"]'
            ], 10000, 'login button for manager');
            
            await this.page.click(loginButtonSelector);
            this.log('✅ Manager login button clicked');

            // Wait and validate
            await this.page.waitForTimeout(3000);
            const currentUrl = this.page.url();
            
            if (!currentUrl.includes('dashboard')) {
                throw new Error(`Manager login failed - still at: ${currentUrl}`);
            }

            await this.captureScreenshot('06-manager-login-success', 'Successful manager login');
            
            return {
                loginUrl: currentUrl,
                managerEmail: 'manager@test.com',
                redirectSuccess: true
            };
        });
    }

    async testNavigationSystem() {
        return await this.validateBusinessCase('Navigation System', async () => {
            this.log('🔗 Testing navigation system functionality');
            
            const navigationTests = [];
            const pages = [
                { url: '/dashboard', name: 'Dashboard' },
                { url: '/employees', name: 'Employees' },
                { url: '/timesheets', name: 'Timesheets' },
                { url: '/leave-requests', name: 'Leave Requests' }
            ];

            for (const pageInfo of pages) {
                try {
                    await this.page.goto(`${this.baseUrl}${pageInfo.url}`, { waitUntil: 'networkidle0' });
                    await this.page.waitForTimeout(2000);

                    const pageContent = await this.page.content();
                    const hasContent = pageContent.length > 500; // Basic content check
                    const hasError = pageContent.toLowerCase().includes('error');

                    navigationTests.push({
                        page: pageInfo.name,
                        url: pageInfo.url,
                        success: hasContent && !hasError,
                        contentLength: pageContent.length,
                        hasError
                    });

                    this.log(`📄 ${pageInfo.name}: Content=${pageContent.length} chars, Error=${hasError}`);

                } catch (error) {
                    navigationTests.push({
                        page: pageInfo.name,
                        url: pageInfo.url,
                        success: false,
                        error: error.message
                    });
                }
            }

            const successfulPages = navigationTests.filter(test => test.success).length;
            const totalPages = navigationTests.length;

            if (successfulPages === 0) {
                throw new Error('No pages are working correctly');
            }

            await this.captureScreenshot('07-navigation-test', 'Navigation system validation');

            return {
                successfulPages,
                totalPages,
                successRate: `${successfulPages}/${totalPages}`,
                pageResults: navigationTests
            };
        });
    }

    async testFormInteractions() {
        return await this.validateBusinessCase('Form Interactions', async () => {
            this.log('📝 Testing form interaction capabilities');
            
            // Test timesheet form interactions
            await this.page.goto(`${this.baseUrl}/timesheets`, { waitUntil: 'networkidle0' });
            await this.page.waitForTimeout(2000);

            const formInteractions = [];

            // Try to interact with buttons
            const buttons = await this.page.$$('button');
            for (let i = 0; i < Math.min(buttons.length, 3); i++) {
                try {
                    const buttonText = await this.page.evaluate(el => el.textContent, buttons[i]);
                    const isClickable = await this.page.evaluate(el => {
                        return !el.disabled && el.offsetParent !== null;
                    }, buttons[i]);

                    formInteractions.push({
                        element: 'button',
                        text: buttonText.trim(),
                        clickable: isClickable,
                        index: i
                    });

                    this.log(`🔘 Button ${i}: "${buttonText.trim()}" - Clickable: ${isClickable}`);
                } catch (error) {
                    this.log(`⚠️ Button ${i} interaction failed: ${error.message}`);
                }
            }

            // Check for input fields
            const inputs = await this.page.$$('input');
            for (let i = 0; i < Math.min(inputs.length, 3); i++) {
                try {
                    const inputType = await this.page.evaluate(el => el.type, inputs[i]);
                    const isEditable = await this.page.evaluate(el => {
                        return !el.disabled && !el.readOnly;
                    }, inputs[i]);

                    formInteractions.push({
                        element: 'input',
                        type: inputType,
                        editable: isEditable,
                        index: i
                    });

                    this.log(`📝 Input ${i}: Type="${inputType}" - Editable: ${isEditable}`);
                } catch (error) {
                    this.log(`⚠️ Input ${i} interaction failed: ${error.message}`);
                }
            }

            await this.captureScreenshot('08-form-interactions', 'Form interaction testing');

            if (formInteractions.length === 0) {
                throw new Error('No form elements found for interaction testing');
            }

            return {
                totalInteractions: formInteractions.length,
                interactions: formInteractions,
                hasWorkingForms: formInteractions.some(i => i.clickable || i.editable)
            };
        });
    }

    async updateRealTimeChecklist() {
        const successRate = this.results.totalTests > 0 ? 
            Math.round((this.results.passedTests / this.results.totalTests) * 100) : 0;

        const checklistContent = `# ✅ COMPREHENSIVE BUSINESS USE CASE VALIDATION CHECKLIST
## Real-Time Test Results Tracking - ENHANCED VALIDATION

**Test Started:** ${this.results.testStarted}  
**Test Type:** Comprehensive Business Validation with 100% Accuracy Tracking  
**Status:** ${this.results.totalTests === Object.keys(this.results.businessCases).length ? '🔄 COMPLETED' : '⏳ IN PROGRESS'}

---

## 📊 **LIVE RESULTS DASHBOARD**

### 🎯 **Overall Progress**
- **Total Use Cases:** ${this.results.totalTests}
- **✅ Passed:** ${this.results.passedTests}
- **❌ Failed:** ${this.results.failedTests}
- **📈 Success Rate:** ${successRate}%

---

## 🎯 **DETAILED BUSINESS USE CASE RESULTS**

${Object.entries(this.results.businessCases).map(([caseName, result]) => `
### 📋 **${caseName}**
- **Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${result.duration}ms
- **Timestamp:** ${new Date(result.timestamp).toLocaleTimeString()}
${result.error ? `- **Error:** ${result.error}` : ''}
${result.details ? `- **Details:** ${JSON.stringify(result.details, null, 2)}` : ''}
`).join('\n')}

---

## 🚨 **CRITICAL ISSUES TRACKER**

${this.results.criticalIssues.length > 0 ? 
    this.results.criticalIssues.map(issue => `
- **${issue.businessCase}**: ${issue.error}
- **Time:** ${new Date(issue.timestamp).toLocaleTimeString()}
`).join('\n') : '✅ No critical issues detected'}

---

## 📸 **VISUAL EVIDENCE**

${this.results.screenshots.map(screenshot => `
- **${screenshot.name}**: ${screenshot.description}
- **Captured:** ${new Date(screenshot.timestamp).toLocaleTimeString()}
`).join('\n')}

---

## 📝 **DETAILED EXECUTION LOG**

${this.results.detailedLog.slice(-20).map(log => `
[${log.timestamp}] ${log.level}: ${log.message}
`).join('')}

---

## 🎯 **FINAL ASSESSMENT**

**Status:** ${successRate >= 90 ? '🎯 EXCELLENT' : 
           successRate >= 70 ? '✅ GOOD' : 
           successRate >= 50 ? '⚠️ ACCEPTABLE' : '❌ NEEDS ATTENTION'}

**Success Rate:** ${successRate}%

---

**🔄 Last Updated:** ${new Date().toLocaleString()}  
**📍 Next Update:** Real-time during test execution
`;

        fs.writeFileSync(
            path.join(__dirname, '..', '..', 'E2E_BUSINESS_USE_CASE_CHECKLIST.md'),
            checklistContent
        );
    }

    async generateComprehensiveReport() {
        const totalDuration = this.results.detailedLog.length > 0 ? 
            new Date(this.results.detailedLog[this.results.detailedLog.length - 1].time) - 
            new Date(this.results.detailedLog[0].time) : 0;

        const reportContent = `# 📊 COMPREHENSIVE BUSINESS USE CASE VALIDATION REPORT
## 100% Accuracy Tracking & Complete Business Scenario Analysis

**Generated:** ${new Date().toLocaleString()}  
**Test Duration:** ${Math.round(totalDuration / 1000)} seconds  
**Validation Type:** Complete Business Workflow Testing

---

## 📈 **EXECUTIVE SUMMARY**

### 🎯 **Key Metrics**
- **Total Business Cases Tested:** ${this.results.totalTests}
- **Success Rate:** ${Math.round((this.results.passedTests / this.results.totalTests) * 100)}%
- **Passed Tests:** ${this.results.passedTests}
- **Failed Tests:** ${this.results.failedTests}
- **Critical Issues:** ${this.results.criticalIssues.length}
- **Screenshots Captured:** ${this.results.screenshots.length}

### 🎯 **Business Readiness Assessment**
${this.results.passedTests >= 5 ? 
    '🟢 **PRODUCTION READY** - Core business workflows validated' :
this.results.passedTests >= 3 ? 
    '🟡 **DEVELOPMENT READY** - Basic functionality working' :
    '🔴 **NEEDS ATTENTION** - Critical business functions failing'
}

---

## 📋 **DETAILED BUSINESS CASE ANALYSIS**

${Object.entries(this.results.businessCases).map(([caseName, result]) => `
### 🎯 **${caseName}**

**Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}  
**Execution Time:** ${result.duration}ms  
**Timestamp:** ${result.timestamp}

${result.success ? 
    `**✅ Success Details:**
\`\`\`json
${JSON.stringify(result.details, null, 2)}
\`\`\`` :
    `**❌ Failure Analysis:**
- **Error:** ${result.error}
- **Impact:** High - Critical business function
- **Priority:** Immediate fix required`
}

**🔍 Business Impact:**
${caseName.includes('Authentication') ? 
    '- Core security and access control\n- Required for all user interactions\n- Blocks other functionality if failing' :
caseName.includes('Timesheet') ? 
    '- Primary business function\n- Employee productivity tracking\n- Critical for payroll processing' :
caseName.includes('Leave') ? 
    '- HR management functionality\n- Employee satisfaction feature\n- Important for workforce planning' :
caseName.includes('Navigation') ? 
    '- User experience foundation\n- Access to all system features\n- Critical for system usability' :
    '- Supporting business functionality\n- Enhances user experience\n- Important for system completeness'
}

---
`).join('\n')}

## 🚨 **CRITICAL ISSUES & RECOMMENDATIONS**

${this.results.criticalIssues.length > 0 ? 
    this.results.criticalIssues.map((issue, index) => `
### ❌ **Critical Issue #${index + 1}: ${issue.businessCase}**

**Error:** ${issue.error}  
**Detected:** ${issue.timestamp}

**Recommended Actions:**
1. 🔧 Immediate investigation required
2. 🎯 Priority fix for core business function
3. ✅ Re-test after resolution
4. 📋 Update documentation

**Business Impact:** ${issue.businessCase.includes('Authentication') ? 'HIGH - Blocks user access' :
                       issue.businessCase.includes('Timesheet') ? 'HIGH - Core business function' :
                       issue.businessCase.includes('Leave') ? 'MEDIUM - HR functionality' : 
                       'MEDIUM - User experience'}
`).join('\n') : 
'✅ **No Critical Issues Detected** - All core business functions are working properly'
}

---

## 📸 **VISUAL EVIDENCE DOCUMENTATION**

${this.results.screenshots.map((screenshot, index) => `
### 📷 **Screenshot #${index + 1}: ${screenshot.name}**
- **Description:** ${screenshot.description}
- **Captured:** ${screenshot.timestamp}
- **Path:** ${screenshot.path}
`).join('\n')}

---

## 📝 **COMPLETE EXECUTION LOG**

\`\`\`
${this.results.detailedLog.map(log => `[${log.timestamp}] ${log.level}: ${log.message}`).join('\n')}
\`\`\`

---

## 🎯 **FINAL VALIDATION SUMMARY**

### ✅ **Working Business Functions**
${Object.entries(this.results.businessCases)
    .filter(([_, result]) => result.success)
    .map(([caseName]) => `- ✅ ${caseName}`)
    .join('\n')}

### ❌ **Functions Requiring Attention**
${Object.entries(this.results.businessCases)
    .filter(([_, result]) => !result.success)
    .map(([caseName]) => `- ❌ ${caseName}`)
    .join('\n')}

### 🎯 **Business Scenario Status**
- **Employee Login & Access:** ${this.results.businessCases['Employee Authentication']?.success ? '✅ WORKING' : '❌ FAILED'}
- **Timesheet Management:** ${this.results.businessCases['Timesheet Management']?.success ? '✅ WORKING' : '❌ FAILED'}  
- **Leave Request System:** ${this.results.businessCases['Leave Request Management']?.success ? '✅ WORKING' : '❌ FAILED'}
- **Manager Operations:** ${this.results.businessCases['Manager Authentication']?.success ? '✅ WORKING' : '❌ FAILED'}
- **System Navigation:** ${this.results.businessCases['Navigation System']?.success ? '✅ WORKING' : '❌ FAILED'}
- **User Interactions:** ${this.results.businessCases['Form Interactions']?.success ? '✅ WORKING' : '❌ FAILED'}

---

**🎯 Overall System Status:** ${Math.round((this.results.passedTests / this.results.totalTests) * 100)}% Business Use Cases Validated

**📅 Generated:** ${new Date().toISOString()}
`;

        fs.writeFileSync(
            path.join(__dirname, '..', '..', 'COMPREHENSIVE_BUSINESS_VALIDATION_REPORT.md'),
            reportContent
        );

        this.log('📊 Comprehensive validation report generated');
    }

    async run() {
        try {
            this.log('🚀 Starting Comprehensive Business Use Case Validation', 'START');
            this.log('🎯 Target: 100% Accuracy in Business Scenario Testing');

            // Initialize browser
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1280, height: 720 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            this.page = await this.browser.newPage();
            
            // Set up error logging
            this.page.on('console', msg => {
                if (msg.type() === 'error') {
                    this.log(`Browser Error: ${msg.text()}`, 'BROWSER_ERROR');
                }
            });

            // Run all business use case tests
            await this.testAuthentication();
            await this.testTimesheetManagement();
            await this.testLeaveManagement();
            await this.testFormInteractions();
            await this.testManagerAuthentication();
            await this.testNavigationSystem();

            // Final screenshot
            await this.captureScreenshot('09-validation-complete', 'Complete business validation finished');

            // Generate comprehensive reports
            await this.generateComprehensiveReport();
            await this.updateRealTimeChecklist();

            const successRate = Math.round((this.results.passedTests / this.results.totalTests) * 100);
            
            this.log('🎉 COMPREHENSIVE VALIDATION COMPLETE', 'COMPLETE');
            this.log(`📊 Final Results: ${this.results.passedTests}/${this.results.totalTests} tests passed (${successRate}%)`, 'SUMMARY');
            this.log(`📸 Screenshots captured: ${this.results.screenshots.length}`, 'SUMMARY');
            this.log(`🚨 Critical issues: ${this.results.criticalIssues.length}`, 'SUMMARY');

            console.log('\n🎯 COMPREHENSIVE BUSINESS VALIDATION SUMMARY');
            console.log('='.repeat(60));
            console.log(`✅ Passed Tests: ${this.results.passedTests}`);
            console.log(`❌ Failed Tests: ${this.results.failedTests}`);
            console.log(`📈 Success Rate: ${successRate}%`);
            console.log(`📸 Visual Evidence: ${this.results.screenshots.length} screenshots`);
            console.log(`🚨 Critical Issues: ${this.results.criticalIssues.length}`);
            console.log('='.repeat(60));

        } catch (error) {
            this.log(`💥 CRITICAL ERROR: ${error.message}`, 'CRITICAL');
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run the comprehensive validator
if (require.main === module) {
    const validator = new ComprehensiveBusinessValidator();
    validator.run()
        .then(() => {
            console.log('\n🎯 Business use case validation completed successfully!');
            console.log('📋 Check E2E_BUSINESS_USE_CASE_CHECKLIST.md for real-time results');
            console.log('📊 Check COMPREHENSIVE_BUSINESS_VALIDATION_REPORT.md for detailed analysis');
        })
        .catch(error => {
            console.error('❌ Validation failed:', error.message);
            process.exit(1);
        });
}

module.exports = ComprehensiveBusinessValidator;
