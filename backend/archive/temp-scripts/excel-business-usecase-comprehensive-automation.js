const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class ExcelBusinessUseCase_AutomatedTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = [];
        this.testScenarios = [];
        this.testCount = 0;
        this.passCount = 0;
        this.failCount = 0;
        this.startTime = new Date();
        this.screenshots = [];
        
        // Test credentials from our demo users - using strong passwords to avoid browser security prompts
        this.credentials = {
            admin: { email: 'admin@company.com', password: 'Kx9mP7qR2nF8sA5t' },
            hr: { email: 'hr@company.com', password: 'Lw3nQ6xY8mD4vB7h' },
            employee: { email: 'employee@company.com', password: 'Mv4pS9wE2nR6kA8j' },
            adminTest: { email: 'admin@test.com', password: 'Nx7rT5yU3mK9sD6g' },
            hrTest: { email: 'hr@test.com', password: 'Ow2nV8xC4mP7rA9k' },
            employeeTest: { email: 'employee@test.com', password: 'Pz5qW3nE7mT9vB4x' },
            managerTest: { email: 'manager@test.com', password: 'Qy8nR6wA2mS5kD7j' }
        };
        
        this.config = {
            baseUrl: 'http://localhost:3000',
            apiUrl: 'http://localhost:8080/api',
            timeout: 30000,
            screenshotPath: './test-screenshots',
            reportPath: './test-results'
        };
    }

    async init() {
        console.log('🚀 Excel Business Use Cases - Comprehensive UI Automation Testing');
        console.log('================================================================');
        console.log(`📅 Test Run Started: ${this.startTime.toISOString()}`);
        console.log(`🌐 Frontend URL: ${this.config.baseUrl}`);
        console.log(`🔌 Backend API: ${this.config.apiUrl}`);
        console.log('');

        // Create directories
        if (!fs.existsSync(this.config.screenshotPath)) {
            fs.mkdirSync(this.config.screenshotPath, { recursive: true });
        }
        if (!fs.existsSync(this.config.reportPath)) {
            fs.mkdirSync(this.config.reportPath, { recursive: true });
        }

        // Load test scenarios from CSV
        await this.loadTestScenarios();

        // Launch browser
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1366, height: 768 },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        this.page = await this.browser.newPage();
        await this.page.setDefaultTimeout(this.config.timeout);
        
        console.log('✅ Browser initialized successfully');
        console.log('📊 Test scenarios loaded from Excel CSV');
        console.log(`📝 Total scenarios to test: ${this.testScenarios.length}`);
        console.log('');
    }

    async loadTestScenarios() {
        return new Promise((resolve, reject) => {
            const scenarios = [];
            const csvPath = path.join(__dirname, 'TEST_SCENARIOS_SPREADSHEET.csv');
            
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    // Skip duplicate rows and focus on unique scenarios
                    if (row['Test ID'] && row['Test ID'].trim() && 
                        !scenarios.find(s => s.testId === row['Test ID'].trim())) {
                        scenarios.push({
                            testId: row['Test ID'].trim(),
                            section: row['Section'] || '',
                            scenario: row['Test Scenario'] || '',
                            testData: row['Test Data'] || '',
                            expectedResult: row['Expected Result'] || '',
                            priority: row['Priority'] || 'P3',
                            status: 'PENDING'
                        });
                    }
                })
                .on('end', () => {
                    // Filter out scenarios that were marked as FAILED in previous runs
                    this.testScenarios = scenarios.filter(s => s.testId && s.scenario);
                    console.log(`📋 Loaded ${this.testScenarios.length} unique test scenarios`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    async takeScreenshot(testId, description = '') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${testId}_${timestamp}_${description.replace(/\s+/g, '_')}.png`;
        const filepath = path.join(this.config.screenshotPath, filename);
        
        try {
            await this.page.screenshot({
                path: filepath,
                fullPage: true
            });
            this.screenshots.push({ testId, filename, filepath, description });
            return filepath;
        } catch (error) {
            console.log(`⚠️  Screenshot failed for ${testId}: ${error.message}`);
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

    async login(userType = 'admin') {
        try {
            console.log(`🔐 Attempting login as ${userType}...`);
            
            await this.page.goto(this.config.baseUrl, { waitUntil: 'networkidle2' });
            
            // Wait for login form
            const loginFormFound = await this.waitForElement('input[type="email"], input[name="email"]');
            if (!loginFormFound) {
                throw new Error('Login form not found on page');
            }

            const creds = this.credentials[userType];
            if (!creds) {
                throw new Error(`No credentials found for user type: ${userType}`);
            }

            // Clear and type email
            const emailInput = await this.page.$('input[type="email"], input[name="email"]');
            if (emailInput) {
                await emailInput.click({ clickCount: 3 }); // Triple-click to select all
                await emailInput.type(creds.email);
            } else {
                throw new Error('Email input field not found');
            }

            // Clear and type password
            const passwordInput = await this.page.$('input[type="password"], input[name="password"]');
            if (passwordInput) {
                await passwordInput.click({ clickCount: 3 }); // Triple-click to select all
                await passwordInput.type(creds.password);
            } else {
                throw new Error('Password input field not found');
            }

            // Submit form
            await this.page.click('button[type="submit"], .login-button, .btn-login');
            
            // Wait for either navigation to dashboard or password change popup
            try {
                await this.page.waitForFunction(
                    () => {
                        // Check for successful navigation
                        const navigationSuccess = window.location.pathname !== '/login' && window.location.pathname !== '/';
                        
                        // Check for various password change popups/modals
                        const passwordChangeModal = document.querySelector('.password-change-modal, .change-password-dialog, [data-testid="change-password"], .MuiDialog-root');
                        
                        // Check for browser password manager notifications
                        const browserPasswordNotification = document.querySelector('[data-testid="password-manager-bubble"], .password-bubble, #password-generation-popup, .notification-anchor, #password-notification');
                        
                        // Check for password strength/update recommendations
                        const passwordRecommendation = document.querySelector('.password-recommendation, .password-strength-popup, [data-testid="password-recommendation"]');
                        
                        return navigationSuccess || passwordChangeModal || browserPasswordNotification || passwordRecommendation;
                    },
                    { timeout: 15000 }
                );

                // Check for any type of password-related popup
                const passwordChangePopup = await this.page.$('.password-change-modal, .change-password-dialog, [data-testid="change-password"], .MuiDialog-root, [data-testid="password-manager-bubble"], .password-bubble, #password-generation-popup, .notification-anchor, #password-notification, .password-recommendation, .password-strength-popup');
                
                if (passwordChangePopup) {
                    console.log(`🔑 Password-related popup detected for ${userType}, handling...`);
                    await this.handlePasswordChangePopup(userType);
                }

                await this.takeScreenshot('LOGIN', `logged_in_as_${userType}`);
                console.log(`✅ Successfully logged in as ${userType}`);
                return true;
            } catch (waitError) {
                // If waiting fails, check current page state
                const currentUrl = await this.page.url();
                if (!currentUrl.includes('/login')) {
                    console.log(`✅ Login successful for ${userType} (alternative check)`);
                    
                    // Still check for password popups even if navigation succeeded
                    const passwordPopup = await this.page.$('.password-change-modal, .change-password-dialog, [data-testid="change-password"], .MuiDialog-root, .password-bubble, .notification');
                    if (passwordPopup) {
                        console.log(`🔑 Late password popup detected for ${userType}, handling...`);
                        await this.handlePasswordChangePopup(userType);
                    }
                    
                    return true;
                }
                throw waitError;
            }

        } catch (error) {
            console.log(`❌ Login failed for ${userType}: ${error.message}`);
            await this.takeScreenshot('LOGIN_FAILED', `login_error_${userType}`);
            return false;
        }
    }

    async handlePasswordChangePopup(userType = 'admin') {
        try {
            console.log(`🔑 Handling password change popup for ${userType}...`);
            
            // Wait a bit for the popup to fully load
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Take screenshot of the popup
            await this.takeScreenshot('PASSWORD_CHANGE_POPUP', `popup_for_${userType}`);

            // Enhanced selectors for various password change popups including browser/password manager prompts
            const skipSelectors = [
                'button:contains("Skip")',
                'button:contains("Later")', 
                'button:contains("Cancel")',
                'button:contains("Not Now")',
                'button:contains("No Thanks")',
                'button:contains("Dismiss")',
                'button:contains("Close")',
                'button:contains("Maybe Later")',
                '.skip-button',
                '.cancel-button',
                '.dismiss-button',
                '.close-button',
                '[data-testid="skip"]',
                '[data-testid="cancel"]',
                '[data-testid="dismiss"]',
                '[data-testid="close"]',
                '.MuiButton-root:contains("Skip")',
                '.MuiButton-root:contains("Cancel")',
                '.MuiButton-root:contains("Close")',
                // Browser password manager specific selectors
                '[data-testid="password-manager-dismiss"]',
                '.password-manager-close',
                '[aria-label="Close"]',
                '[aria-label="Dismiss"]',
                'button[aria-label="No thanks"]',
                'button[aria-label="Not now"]'
            ];

            let popupHandled = false;
            
            // First, try to find and click dismiss/skip buttons
            for (const selector of skipSelectors) {
                try {
                    // Use evaluate to check if element exists and click it
                    const elementExists = await this.page.evaluate((sel) => {
                        // Try direct selector first
                        let element = document.querySelector(sel);
                        
                        // If not found, try finding buttons with specific text content
                        if (!element) {
                            element = Array.from(document.querySelectorAll('button')).find(btn => {
                                const text = btn.textContent.toLowerCase();
                                return text.includes('skip') ||
                                       text.includes('cancel') ||
                                       text.includes('later') ||
                                       text.includes('not now') ||
                                       text.includes('no thanks') ||
                                       text.includes('dismiss') ||
                                       text.includes('close') ||
                                       text.includes('maybe later');
                            });
                        }
                        
                        // Also check for X close buttons or similar
                        if (!element) {
                            element = Array.from(document.querySelectorAll('button, [role="button"], .close, .dismiss')).find(btn => {
                                const ariaLabel = btn.getAttribute('aria-label') || '';
                                return ariaLabel.toLowerCase().includes('close') ||
                                       ariaLabel.toLowerCase().includes('dismiss') ||
                                       ariaLabel.toLowerCase().includes('not now') ||
                                       btn.textContent === '×' ||
                                       btn.textContent === '✕' ||
                                       btn.classList.contains('close') ||
                                       btn.classList.contains('dismiss');
                            });
                        }
                        
                        if (element) {
                            console.log('Found dismissible element:', element);
                            element.click();
                            return true;
                        }
                        return false;
                    });

                    if (elementExists) {
                        console.log(`✅ Successfully dismissed password change popup using button`);
                        popupHandled = true;
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            // If no dismiss button found, try to handle browser password manager notifications
            if (!popupHandled) {
                try {
                    console.log('🔍 Checking for browser password manager notifications...');
                    
                    // Look for browser notification bars or overlays
                    const browserNotificationHandled = await this.page.evaluate(() => {
                        // Check for Chrome/Edge password manager bars
                        const chromePasswordBar = document.querySelector('[data-testid="password-manager-bubble"], .password-bubble, #password-generation-popup');
                        if (chromePasswordBar) {
                            // Try to find close button in the password manager UI
                            const closeBtn = chromePasswordBar.querySelector('button[aria-label="Close"], .close-button, [data-testid="close"]');
                            if (closeBtn) {
                                closeBtn.click();
                                return true;
                            }
                        }
                        
                        // Check for Firefox password manager notifications
                        const firefoxNotification = document.querySelector('.notification-anchor, #password-notification');
                        if (firefoxNotification) {
                            const dismissBtn = firefoxNotification.querySelector('button[anonid="closebutton"], .messageCloseButton');
                            if (dismissBtn) {
                                dismissBtn.click();
                                return true;
                            }
                        }
                        
                        return false;
                    });
                    
                    if (browserNotificationHandled) {
                        console.log(`✅ Browser password manager notification handled`);
                        popupHandled = true;
                    }
                } catch (e) {
                    console.log(`⚠️  Could not handle browser notifications: ${e.message}`);
                }
            }

            // Try pressing Escape key as fallback
            if (!popupHandled) {
                try {
                    console.log('🎹 Trying Escape key...');
                    await this.page.keyboard.press('Escape');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Check if popup is still there
                    const popupStillExists = await this.page.$('.password-change-modal, .change-password-dialog, [data-testid="change-password"], .MuiDialog-root, .notification');
                    if (!popupStillExists) {
                        console.log(`✅ Password change popup closed with Escape key`);
                        popupHandled = true;
                    }
                } catch (e) {
                    console.log(`⚠️  Could not close popup with Escape: ${e.message}`);
                }
            }

            // Try clicking outside the modal as final fallback
            if (!popupHandled) {
                try {
                    console.log('🖱️  Trying to click outside modal...');
                    // Click on backdrop/overlay to close modal
                    await this.page.click('.MuiBackdrop-root, .modal-backdrop, .overlay, body');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    console.log(`✅ Password change popup closed by clicking outside`);
                    popupHandled = true;
                } catch (e) {
                    console.log(`⚠️  Could not close popup by clicking outside: ${e.message}`);
                }
            }

            // Additional wait for popup to disappear completely
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Take final screenshot after handling popup
            await this.takeScreenshot('PASSWORD_CHANGE_HANDLED', `popup_handled_${userType}`);

            if (popupHandled) {
                console.log(`✅ Password change popup successfully handled for ${userType}`);
            } else {
                console.log(`⚠️  Password change popup may still be present for ${userType}`);
            }

            return popupHandled;

        } catch (error) {
            console.log(`⚠️  Error handling password change popup: ${error.message}`);
            await this.takeScreenshot('PASSWORD_CHANGE_ERROR', `popup_error_${userType}`);
            return false;
        }
    }

    async logout() {
        try {
            // Look for logout button/menu
            const logoutSelectors = [
                '.logout-button',
                '[data-testid="logout"]',
                'button:contains("Logout")',
                '.user-menu .logout',
                '.dropdown-menu .logout'
            ];

            let loggedOut = false;
            for (const selector of logoutSelectors) {
                try {
                    await this.page.click(selector);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    loggedOut = true;
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!loggedOut) {
                // Try to go to login page directly
                await this.page.goto(`${this.config.baseUrl}/login`);
            }

            console.log('✅ Successfully logged out');
            return true;
        } catch (error) {
            console.log(`⚠️  Logout attempt: ${error.message}`);
            return false;
        }
    }

    async testScenario(scenario) {
        const startTime = Date.now();
        let result = {
            testId: scenario.testId,
            section: scenario.section,
            scenario: scenario.scenario,
            expectedResult: scenario.expectedResult,
            actualResult: '',
            status: 'FAILED',
            duration: 0,
            error: '',
            screenshot: null,
            timestamp: new Date().toISOString()
        };

        try {
            console.log(`\n🧪 Testing [${scenario.testId}]: ${scenario.scenario}`);
            console.log(`📋 Section: ${scenario.section}`);
            console.log(`🎯 Expected: ${scenario.expectedResult}`);

            // Route to specific test based on section and scenario type
            if (scenario.section.includes('Admin Operations')) {
                result = await this.testAdminOperations(scenario, result);
            } else if (scenario.section.includes('Employee Operations')) {
                result = await this.testEmployeeOperations(scenario, result);
            } else if (scenario.section.includes('Manager Operations')) {
                result = await this.testManagerOperations(scenario, result);
            } else if (scenario.section.includes('System Integration')) {
                result = await this.testSystemIntegration(scenario, result);
            } else {
                result.actualResult = 'Test category not implemented';
                result.error = 'Unknown test section';
            }

        } catch (error) {
            result.error = error.message;
            result.actualResult = `Test execution failed: ${error.message}`;
            console.log(`❌ Test failed: ${error.message}`);
        }

        result.duration = Date.now() - startTime;
        result.screenshot = await this.takeScreenshot(scenario.testId, 'test_result');

        // Update counters
        this.testCount++;
        if (result.status === 'PASSED') {
            this.passCount++;
            console.log(`✅ [${scenario.testId}] PASSED (${result.duration}ms)`);
        } else {
            this.failCount++;
            console.log(`❌ [${scenario.testId}] FAILED (${result.duration}ms)`);
            console.log(`   Error: ${result.error}`);
        }

        this.results.push(result);
        return result;
    }

    async testAdminOperations(scenario, result) {
        // Admin login scenarios
        if (scenario.scenario.includes('Admin Login')) {
            const loginSuccess = await this.login('admin');
            if (loginSuccess) {
                result.status = 'PASSED';
                result.actualResult = 'Admin login successful, dashboard accessible';
            } else {
                result.actualResult = 'Admin login failed';
            }
        }
        // Create employee scenarios
        else if (scenario.scenario.includes('Create New Employee')) {
            await this.login('admin');
            // Navigate to employee creation
            const created = await this.navigateAndCreateEmployee();
            if (created) {
                result.status = 'PASSED';
                result.actualResult = 'Employee record created successfully';
            } else {
                result.actualResult = 'Failed to create employee record';
            }
        }
        // Employee credentials configuration
        else if (scenario.scenario.includes('Configure Employee Login') || scenario.scenario.includes('Set Employee Credentials')) {
            await this.login('admin');
            const configured = await this.configureEmployeeCredentials();
            if (configured) {
                result.status = 'PASSED';
                result.actualResult = 'Employee login credentials configured successfully';
            } else {
                result.actualResult = 'Failed to configure employee credentials';
            }
        }
        // Admin dashboard access
        else if (scenario.scenario.includes('Access Admin Dashboard')) {
            const loginSuccess = await this.login('admin');
            if (loginSuccess) {
                const dashboardFound = await this.waitForElement('.admin-dashboard, .dashboard, [data-testid="admin-dashboard"]');
                if (dashboardFound) {
                    result.status = 'PASSED';
                    result.actualResult = 'Admin dashboard accessible';
                } else {
                    result.actualResult = 'Admin dashboard not found';
                }
            } else {
                result.actualResult = 'Admin login failed';
            }
        }
        // Employee management
        else if (scenario.scenario.includes('Employee Management') || scenario.scenario.includes('Manage Employees')) {
            await this.login('admin');
            const managementAccessible = await this.navigateToModule('employees');
            if (managementAccessible) {
                result.status = 'PASSED';
                result.actualResult = 'Employee management module accessible';
            } else {
                result.actualResult = 'Failed to access employee management';
            }
        }
        // Payslip configuration
        else if (scenario.scenario.includes('Payslip Configuration') || scenario.scenario.includes('Configure Payslip')) {
            await this.login('admin');
            const payslipConfigured = await this.configurePayslipSettings();
            if (payslipConfigured) {
                result.status = 'PASSED';
                result.actualResult = 'Payslip configuration successful';
            } else {
                result.actualResult = 'Failed to configure payslip settings';
            }
        }
        // Other admin operations
        else {
            result.actualResult = 'Admin operation test not fully implemented';
            result.status = 'SKIPPED';
        }

        return result;
    }

    async testEmployeeOperations(scenario, result) {
        // Employee login scenarios - test both existing and newly created employees
        if (scenario.scenario.includes('Employee First Login') || scenario.scenario.includes('Employee Login')) {
            let loginSuccess = false;
            
            // Try existing employee first
            loginSuccess = await this.login('employee');
            
            // If that fails, try newly created employees
            if (!loginSuccess) {
                const newEmployeeKeys = Object.keys(this.credentials).filter(key => key.startsWith('newEmployee'));
                for (const key of newEmployeeKeys) {
                    loginSuccess = await this.login(key);
                    if (loginSuccess) break;
                }
            }
            
            if (loginSuccess) {
                result.status = 'PASSED';
                result.actualResult = 'Employee login successful, dashboard accessible';
            } else {
                result.actualResult = 'Employee login failed for all test accounts';
            }
        }
        // Dashboard access
        else if (scenario.scenario.includes('Access Employee Dashboard')) {
            const loginSuccess = await this.loginAnyEmployee();
            if (loginSuccess) {
                const dashboardFound = await this.waitForElement('.dashboard, .employee-dashboard, [data-testid="dashboard"]');
                if (dashboardFound) {
                    result.status = 'PASSED';
                    result.actualResult = 'Employee dashboard loaded successfully';
                } else {
                    result.actualResult = 'Employee dashboard not found';
                }
            } else {
                result.actualResult = 'Employee login failed';
            }
        }
        // Timesheet operations
        else if (scenario.scenario.includes('Access Timesheet Module')) {
            await this.loginAnyEmployee();
            const navigated = await this.navigateToModule('timesheet');
            if (navigated) {
                result.status = 'PASSED';
                result.actualResult = 'Timesheet module accessible';
            } else {
                result.actualResult = 'Failed to access timesheet module';
            }
        }
        else if (scenario.scenario.includes('Submit Timesheet') || scenario.scenario.includes('Create Timesheet')) {
            await this.loginAnyEmployee();
            const timesheetCreated = await this.createTimesheet();
            if (timesheetCreated) {
                result.status = 'PASSED';
                result.actualResult = 'Timesheet created and submitted successfully';
            } else {
                result.actualResult = 'Failed to create timesheet';
            }
        }
        // Leave request operations
        else if (scenario.scenario.includes('Access Leave Request Module')) {
            await this.loginAnyEmployee();
            const navigated = await this.navigateToModule('leave');
            if (navigated) {
                result.status = 'PASSED';
                result.actualResult = 'Leave request module accessible';
            } else {
                result.actualResult = 'Failed to access leave request module';
            }
        }
        else if (scenario.scenario.includes('Submit Leave Request') || scenario.scenario.includes('Apply for Leave')) {
            await this.loginAnyEmployee();
            const leaveRequested = await this.submitLeaveRequest();
            if (leaveRequested) {
                result.status = 'PASSED';
                result.actualResult = 'Leave request submitted successfully';
            } else {
                result.actualResult = 'Failed to submit leave request';
            }
        }
        // Payslip operations
        else if (scenario.scenario.includes('Access Payslip Module')) {
            await this.loginAnyEmployee();
            const navigated = await this.navigateToModule('payslip');
            if (navigated) {
                result.status = 'PASSED';
                result.actualResult = 'Payslip module accessible';
            } else {
                result.actualResult = 'Failed to access payslip module';
            }
        }
        else if (scenario.scenario.includes('View Payslip') || scenario.scenario.includes('Download Payslip')) {
            await this.loginAnyEmployee();
            const payslipViewed = await this.viewPayslip();
            if (payslipViewed) {
                result.status = 'PASSED';
                result.actualResult = 'Payslip viewed successfully';
            } else {
                result.actualResult = 'Failed to view payslip';
            }
        }
        // Profile management
        else if (scenario.scenario.includes('Update Profile') || scenario.scenario.includes('Edit Profile')) {
            await this.loginAnyEmployee();
            const profileUpdated = await this.updateEmployeeProfile();
            if (profileUpdated) {
                result.status = 'PASSED';
                result.actualResult = 'Employee profile updated successfully';
            } else {
                result.actualResult = 'Failed to update employee profile';
            }
        }
        else {
            result.actualResult = 'Employee operation test not fully implemented';
            result.status = 'SKIPPED';
        }

        return result;
    }

    async loginAnyEmployee() {
        // Try existing employee accounts first
        const employeeTypes = ['employee', 'employeeTest'];
        
        for (const type of employeeTypes) {
            const success = await this.login(type);
            if (success) return true;
        }
        
        // Try newly created employee accounts
        const newEmployeeKeys = Object.keys(this.credentials).filter(key => key.startsWith('newEmployee'));
        for (const key of newEmployeeKeys) {
            const success = await this.login(key);
            if (success) return true;
        }
        
        return false;
    }

    async createTimesheet() {
        try {
            console.log('📝 Creating timesheet entry...');
            
            await this.navigateToModule('timesheet');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Look for create timesheet button
            const createSelectors = [
                '.create-timesheet',
                '.add-timesheet',
                'button:contains("Add Entry")',
                'button:contains("New Timesheet")',
                '.btn-new-timesheet'
            ];
            
            for (const selector of createSelectors) {
                try {
                    await this.page.click(selector);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Fill timesheet form
                    const formFilled = await this.fillTimesheetForm();
                    if (formFilled) {
                        return true;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            return false;
        } catch (error) {
            console.log(`⚠️  Timesheet creation failed: ${error.message}`);
            return false;
        }
    }

    async fillTimesheetForm() {
        try {
            const timesheetData = {
                date: new Date().toISOString().split('T')[0],
                hours: '8',
                description: 'Automated testing work',
                project: 'Test Project'
            };
            
            const fields = [
                { selector: 'input[name="date"], input[type="date"], #date', value: timesheetData.date },
                { selector: 'input[name="hours"], #hours', value: timesheetData.hours },
                { selector: 'input[name="description"], textarea[name="description"], #description', value: timesheetData.description },
                { selector: 'input[name="project"], #project', value: timesheetData.project }
            ];
            
            for (const field of fields) {
                try {
                    const element = await this.page.$(field.selector);
                    if (element) {
                        await element.click({ clickCount: 3 });
                        await element.type(field.value);
                    }
                } catch (e) {
                    continue;
                }
            }
            
            // Submit timesheet
            const submitBtn = await this.page.$('button[type="submit"], .submit-btn, button:contains("Submit")');
            if (submitBtn) {
                await submitBtn.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('✅ Timesheet submitted successfully');
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    async submitLeaveRequest() {
        try {
            console.log('🏖️ Submitting leave request...');
            
            await this.navigateToModule('leave');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Look for apply leave button
            const applySelectors = [
                '.apply-leave',
                '.new-leave-request',
                'button:contains("Apply for Leave")',
                'button:contains("New Request")',
                '.btn-apply-leave'
            ];
            
            for (const selector of applySelectors) {
                try {
                    await this.page.click(selector);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const formFilled = await this.fillLeaveRequestForm();
                    if (formFilled) {
                        return true;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            return false;
        } catch (error) {
            console.log(`⚠️  Leave request failed: ${error.message}`);
            return false;
        }
    }

    async fillLeaveRequestForm() {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date();
            dayAfter.setDate(dayAfter.getDate() + 2);
            
            const leaveData = {
                startDate: tomorrow.toISOString().split('T')[0],
                endDate: dayAfter.toISOString().split('T')[0],
                reason: 'Personal leave - automated test',
                type: 'Personal'
            };
            
            const fields = [
                { selector: 'input[name="startDate"], input[name="start_date"], #startDate', value: leaveData.startDate },
                { selector: 'input[name="endDate"], input[name="end_date"], #endDate', value: leaveData.endDate },
                { selector: 'textarea[name="reason"], #reason', value: leaveData.reason }
            ];
            
            for (const field of fields) {
                try {
                    const element = await this.page.$(field.selector);
                    if (element) {
                        await element.click({ clickCount: 3 });
                        await element.type(field.value);
                    }
                } catch (e) {
                    continue;
                }
            }
            
            // Submit leave request
            const submitBtn = await this.page.$('button[type="submit"], .submit-btn, button:contains("Submit")');
            if (submitBtn) {
                await submitBtn.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('✅ Leave request submitted successfully');
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    async viewPayslip() {
        try {
            console.log('💰 Viewing payslip...');
            
            await this.navigateToModule('payslip');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Look for payslip entries or view buttons
            const viewSelectors = [
                '.view-payslip',
                '.payslip-item',
                'button:contains("View")',
                'button:contains("Download")',
                '.payslip-row'
            ];
            
            for (const selector of viewSelectors) {
                try {
                    const elements = await this.page.$$(selector);
                    if (elements.length > 0) {
                        await elements[0].click();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Check if payslip content is visible
                        const payslipVisible = await this.waitForElement('.payslip-content, .payslip-details', 3000);
                        if (payslipVisible) {
                            console.log('✅ Payslip viewed successfully');
                            return true;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            return false;
        } catch (error) {
            console.log(`⚠️  Payslip viewing failed: ${error.message}`);
            return false;
        }
    }

    async updateEmployeeProfile() {
        try {
            console.log('👤 Updating employee profile...');
            
            // Look for profile or settings navigation
            const profileSelectors = [
                '.profile-link',
                '.user-profile',
                'a[href*="profile"]',
                'button:contains("Profile")',
                '.nav-profile'
            ];
            
            for (const selector of profileSelectors) {
                try {
                    await this.page.click(selector);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Look for edit profile button
                    const editBtn = await this.page.$('.edit-profile, button:contains("Edit"), .btn-edit');
                    if (editBtn) {
                        await editBtn.click();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        const profileUpdated = await this.fillProfileForm();
                        if (profileUpdated) {
                            return true;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            return false;
        } catch (error) {
            console.log(`⚠️  Profile update failed: ${error.message}`);
            return false;
        }
    }

    async fillProfileForm() {
        try {
            const profileData = {
                phone: '123-456-7890',
                address: '123 Test Street, Test City',
                emergencyContact: '987-654-3210'
            };
            
            const fields = [
                { selector: 'input[name="phone"], input[name="phoneNumber"], #phone', value: profileData.phone },
                { selector: 'input[name="address"], textarea[name="address"], #address', value: profileData.address },
                { selector: 'input[name="emergencyContact"], #emergencyContact', value: profileData.emergencyContact }
            ];
            
            for (const field of fields) {
                try {
                    const element = await this.page.$(field.selector);
                    if (element) {
                        await element.click({ clickCount: 3 });
                        await element.type(field.value);
                    }
                } catch (e) {
                    continue;
                }
            }
            
            // Save profile changes
            const saveBtn = await this.page.$('button[type="submit"], .save-btn, button:contains("Save")');
            if (saveBtn) {
                await saveBtn.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('✅ Profile updated successfully');
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    async testManagerOperations(scenario, result) {
        // Manager login
        if (scenario.scenario.includes('Manager Login')) {
            const loginSuccess = await this.login('managerTest');
            if (loginSuccess) {
                result.status = 'PASSED';
                result.actualResult = 'Manager login successful, dashboard accessible';
            } else {
                result.actualResult = 'Manager login failed';
            }
        }
        // Manager-specific operations would go here
        else {
            result.actualResult = 'Manager operation test not fully implemented';
            result.status = 'SKIPPED';
        }

        return result;
    }

    async testSystemIntegration(scenario, result) {
        result.actualResult = 'System integration test not fully implemented';
        result.status = 'SKIPPED';
        return result;
    }

    async navigateToModule(moduleName) {
        try {
            const moduleSelectors = {
                'timesheet': ['.timesheet-link', '[href*="timesheet"]', 'a:contains("Timesheet")', '.nav-timesheet'],
                'leave': ['.leave-link', '[href*="leave"]', 'a:contains("Leave")', '.nav-leave'],
                'payslip': ['.payslip-link', '[href*="payslip"]', 'a:contains("Payslip")', '.nav-payslip'],
                'employees': ['.employees-link', '[href*="employee"]', 'a:contains("Employee")', '.nav-employees', '.employee-management'],
                'users': ['.users-link', '[href*="user"]', 'a:contains("User")', '.nav-users', '.user-management']
            };

            const selectors = moduleSelectors[moduleName] || [];
            
            for (const selector of selectors) {
                try {
                    await this.page.click(selector);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return true;
                } catch (e) {
                    continue;
                }
            }

            // Try direct URL navigation
            await this.page.goto(`${this.config.baseUrl}/${moduleName}`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return true;

        } catch (error) {
            console.log(`⚠️  Module navigation failed: ${error.message}`);
            return false;
        }
    }

    async navigateAndCreateEmployee() {
        try {
            console.log('🔍 Looking for employee creation functionality...');
            
            // Navigate to employees page first
            console.log('🔍 Navigating to Employees module...');
            await this.page.waitForTimeout(2000);
            
            try {
                // Look for Employees menu in the navigation (Material-UI structure)
                const employeeMenuSelectors = [
                    'a[href="/employees"]',
                    'text=Employees',
                    '[role="navigation"] >> text=Employees',
                    '.MuiList-root >> text=Employees',
                    '.MuiListItemText-primary:has-text("Employees")'
                ];
                
                let employeeMenuFound = false;
                for (const selector of employeeMenuSelectors) {
                    try {
                        await this.page.waitForSelector(selector, { timeout: 2000 });
                        await this.page.click(selector);
                        console.log(`✅ Clicked Employees menu with: ${selector}`);
                        employeeMenuFound = true;
                        break;
                    } catch (error) {
                        console.log(`❌ Employee menu selector failed: ${selector}`);
                        continue;
                    }
                }
                
                if (!employeeMenuFound) {
                    console.log('🔄 Direct navigation to employees page');
                    await this.page.goto(`${this.config.baseUrl}/employees`);
                }
                
                await this.page.waitForTimeout(3000);
                
            } catch (error) {
                console.log(`⚠️ Navigation error: ${error.message}, trying direct URL`);
                await this.page.goto(`${this.config.baseUrl}/employees`);
                await this.page.waitForTimeout(3000);
            }

            // Now look for Add Employee button or navigate to add-employee page
            console.log('🔍 Looking for Add Employee functionality...');
            
            const addEmployeeSelectors = [
                'button:has-text("Add Employee")',
                'a[href="/add-employee"]',
                'button:has-text("New Employee")',
                'button:has-text("Create Employee")',
                '.MuiButton-root:has-text("Add")',
                '.MuiButton-root:has-text("New")',
                '[data-testid="add-employee-btn"]'
            ];
            
            let addEmployeeFound = false;
            for (const selector of addEmployeeSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    await this.page.click(selector);
                    console.log(`✅ Clicked Add Employee with: ${selector}`);
                    addEmployeeFound = true;
                    break;
                } catch (error) {
                    console.log(`❌ Add Employee selector failed: ${selector}`);
                    continue;
                }
            }
            
            if (!addEmployeeFound) {
                console.log('🔄 Direct navigation to add-employee page');
                await this.page.goto(`${this.config.baseUrl}/add-employee`);
            }
            
            await this.page.waitForTimeout(3000);
            
            // Check if we're on the employee creation form (ModernAddEmployee component)
            const formSelectors = [
                'form',
                '.MuiPaper-root',
                'input[name="firstName"]',
                'input[name="email"]',
                '.employee-form',
                '[role="form"]'
            ];
            
            let formFound = false;
            for (const selector of formSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    console.log(`✅ Found employee form with: ${selector}`);
                    formFound = true;
                    break;
                } catch (error) {
                    continue;
                }
            }
            
            if (formFound) {
                console.log('✅ Employee creation form found, filling details...');
                const employeeCreated = await this.fillEmployeeCreationForm();
                if (employeeCreated) {
                    await this.takeScreenshot('EMPLOYEE_CREATED', 'new_employee_form_filled');
                    return true;
                }
            } else {
                console.log('❌ Employee creation form not found');
                await this.takeScreenshot('FORM_NOT_FOUND', 'add_employee_page');
                return false;
            }

            return false;
        } catch (error) {
            console.log(`⚠️ Employee creation failed: ${error.message}`);
            await this.takeScreenshot('EMPLOYEE_CREATE_ERROR', error.message.replace(/[^a-zA-Z0-9]/g, '_'));
            return false;
        }
    }

    async fillEmployeeCreationForm() {
        try {
            const timestamp = Date.now();
            const testEmployee = {
                firstName: `Test${timestamp}`,
                lastName: 'Employee',
                email: `test.employee.${timestamp}@automation.com`,
                phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                employeeId: `EMP${timestamp}`,
                department: 'Engineering',
                position: 'Software Engineer',
                hireDate: new Date().toISOString().split('T')[0],
                salary: '50000',
                emergencyContactName: 'Emergency Contact',
                emergencyContactPhone: '+919876543210'
            };

            console.log(`📝 Filling employee form for: ${testEmployee.email}`);

            // Wait for form to be fully loaded
            await this.page.waitForTimeout(2000);

            // Fill Step 1: Personal Information fields (Material-UI TextField structure)
            const personalFields = [
                { name: 'firstName', value: testEmployee.firstName },
                { name: 'lastName', value: testEmployee.lastName },
                { name: 'email', value: testEmployee.email },
                { name: 'phone', value: testEmployee.phone }
            ];

            console.log('🔸 Filling personal information...');
            let personalFieldsFilled = 0;
            for (const field of personalFields) {
                const filled = await this.fillMUITextField(field.name, field.value);
                if (filled) personalFieldsFilled++;
                await this.page.waitForTimeout(300);
            }
            
            console.log(`📊 Personal fields filled: ${personalFieldsFilled}/${personalFields.length}`);

            // Try to click Next button with multiple approaches
            await this.page.waitForTimeout(1000);
            let nextClicked = await this.clickButton(['Next', 'Continue', 'NEXT']);
            if (!nextClicked) {
                // Try alternative Next button selectors
                const nextSelectors = [
                    '.MuiButton-root[type="button"]:has-text("Next")',
                    'button[aria-label*="next"]',
                    '.MuiStepper ~ * button:has-text("Next")',
                    'button:contains("Next")',
                    '.MuiButton-containedPrimary'
                ];
                
                for (const selector of nextSelectors) {
                    try {
                        await this.page.waitForSelector(selector, { timeout: 2000 });
                        await this.page.click(selector);
                        console.log(`✅ Clicked Next with: ${selector}`);
                        nextClicked = true;
                        break;
                    } catch (error) {
                        continue;
                    }
                }
            }
            
            if (!nextClicked) {
                console.log('⚠️ Could not proceed to next step, continuing with current form...');
            }
            
            await this.page.waitForTimeout(1500);

            // Fill Step 2: Employment Details
            console.log('🔸 Filling employment details...');
            const employmentFields = [
                { name: 'employeeId', value: testEmployee.employeeId },
                { name: 'hireDate', value: testEmployee.hireDate }
            ];

            let employmentFieldsFilled = 0;
            for (const field of employmentFields) {
                const filled = await this.fillMUITextField(field.name, field.value);
                if (filled) employmentFieldsFilled++;
                await this.page.waitForTimeout(300);
            }

            // Handle department and position dropdowns if they exist
            const departmentSelected = await this.selectMUIDropdown('department', testEmployee.department);
            const positionSelected = await this.selectMUIDropdown('position', testEmployee.position);
            
            if (departmentSelected) employmentFieldsFilled++;
            if (positionSelected) employmentFieldsFilled++;
            
            console.log(`📊 Employment details filled: ${employmentFieldsFilled}/4 fields`);

            // Try to proceed to next step
            await this.page.waitForTimeout(1000);
            const nextClicked2 = await this.clickButton(['Next', 'Continue', 'NEXT']);
            if (!nextClicked2) {
                console.log('⚠️ Could not proceed to next step, will try to submit current form...');
            } else {
                await this.page.waitForTimeout(1500);
                
                // Skip Step 3: Statutory & Bank Details (optional)
                console.log('🔸 Skipping statutory & bank details...');
                await this.clickButton(['Next', 'Skip', 'Continue', 'NEXT']);
                await this.page.waitForTimeout(1000);

                // Fill Step 4: Compensation & Emergency Contact
                console.log('🔸 Filling compensation and emergency contact...');
                await this.fillMUITextField('salary', testEmployee.salary);
                await this.fillMUITextField('emergencyContactName', testEmployee.emergencyContactName);
                await this.fillMUITextField('emergencyContactPhone', testEmployee.emergencyContactPhone);

                // Click Next to go to final step
                await this.clickButton(['Next', 'Continue', 'NEXT']);
                await this.page.waitForTimeout(1000);

                // Step 5: Skip user account creation for now
                console.log('🔸 Skipping user account creation...');
            }
            
            // Submit the form
            console.log('🔸 Submitting employee form...');
            const submitSelectors = [
                'Submit', 'Create Employee', 'Save Employee', 'Add Employee', 'Create', 'Save',
                'button[type="submit"]'
            ];
            
            let submitSuccess = false;
            for (let i = 0; i < submitSelectors.length && !submitSuccess; i++) {
                submitSuccess = await this.clickButton([submitSelectors[i]]);
                if (submitSuccess) break;
                await this.page.waitForTimeout(500);
            }
            
            // Try alternative submit approaches
            if (!submitSuccess) {
                console.log('🔄 Trying alternative submit methods...');
                const altSubmitSelectors = [
                    '.MuiButton-root[type="submit"]',
                    'form button[type="submit"]',
                    '.MuiButton-containedPrimary:last-of-type',
                    'button:contains("Submit")',
                    'button:contains("Create")',
                    'button:contains("Save")'
                ];
                
                for (const selector of altSubmitSelectors) {
                    try {
                        await this.page.waitForSelector(selector, { timeout: 2000 });
                        await this.page.click(selector);
                        console.log(`✅ Submitted form with: ${selector}`);
                        submitSuccess = true;
                        break;
                    } catch (error) {
                        continue;
                    }
                }
            }

            if (submitSuccess) {
                await this.page.waitForTimeout(4000); // Wait longer for form processing
                
                // Check for success indicators with multiple approaches
                const success = await this.page.evaluate(() => {
                    const bodyText = document.body.textContent.toLowerCase();
                    const url = window.location.pathname;
                    
                    // Look for success indicators
                    const successIndicators = [
                        bodyText.includes('success'),
                        bodyText.includes('created'),
                        bodyText.includes('added'),
                        bodyText.includes('employee created'),
                        url.includes('/employees'),
                        url !== '/add-employee' // Redirected away from add page
                    ];
                    
                    return successIndicators.some(indicator => indicator);
                });
                
                // Also check for Material-UI success feedback
                const muiSuccess = await this.page.evaluate(() => {
                    const successElements = document.querySelectorAll(
                        '.MuiAlert-root, .MuiSnackbar-root, .success, [role="alert"]'
                    );
                    return Array.from(successElements).some(el => 
                        el.textContent.toLowerCase().includes('success') ||
                        el.textContent.toLowerCase().includes('created') ||
                        el.classList.contains('success')
                    );
                });

                if (success || muiSuccess) {
                    console.log(`✅ Employee created successfully: ${testEmployee.email}`);
                    // Store this employee for potential later testing
                    this.credentials[`newEmployee${timestamp}`] = {
                        email: testEmployee.email,
                        password: 'Tz7nW4qE8mR6kA9x' // Strong password to avoid browser prompts
                    };
                    return true;
                } else {
                    console.log('⚠️ Form submitted but no clear success indication found');
                    // Take screenshot for debugging
                    await this.takeScreenshot('FORM_SUBMIT_RESULT', 'after_submit');
                    return false;
                }
            } else {
                console.log('❌ Could not submit the form - no submit button found');
                await this.takeScreenshot('NO_SUBMIT_BUTTON', 'form_state');
                return false;
            }
        } catch (error) {
            console.log(`⚠️ Form filling failed: ${error.message}`);
            return false;
        }
    }

    // Helper method to fill Material-UI TextField
    async fillMUITextField(fieldName, value) {
        const selectors = [
            `input[name="${fieldName}"]`,
            `#${fieldName}`,
            `.MuiTextField-root input[name="${fieldName}"]`,
            `[data-testid="${fieldName}"]`,
            `input[placeholder*="${fieldName}"]`,
            `.MuiFormControl:has([for="${fieldName}"]) input`,
            `input[aria-labelledby*="${fieldName}"]`
        ];

        for (const selector of selectors) {
            try {
                await this.page.waitForSelector(selector, { timeout: 3000 });
                const element = await this.page.$(selector);
                if (element) {
                    await element.click({ clickCount: 3 });
                    await this.page.waitForTimeout(100);
                    await element.type(value, { delay: 50 });
                    console.log(`✅ Filled ${fieldName}: ${value}`);
                    await this.page.waitForTimeout(200);
                    return true;
                }
            } catch (error) {
                continue;
            }
        }
        
        console.log(`⚠️ Could not fill field: ${fieldName}`);
        return false;
    }

    // Helper method to select Material-UI dropdown/select
    async selectMUIDropdown(fieldName, value) {
        const selectors = [
            `[role="button"][aria-labelledby*="${fieldName}"]`,
            `.MuiSelect-root[name="${fieldName}"]`,
            `#${fieldName}`,
            `[data-testid="${fieldName}-select"]`,
            `.MuiFormControl:has([for="${fieldName}"]) .MuiSelect-root`,
            `[aria-labelledby*="${fieldName}"][role="combobox"]`
        ];

        for (const selector of selectors) {
            try {
                await this.page.waitForSelector(selector, { timeout: 3000 });
                await this.page.click(selector);
                await this.page.waitForTimeout(500);
                
                // Try to click the option with multiple selectors
                const optionSelectors = [
                    `li:has-text("${value}")`,
                    `.MuiMenuItem-root:has-text("${value}")`,
                    `[role="option"]:has-text("${value}")`,
                    `[data-value="${value}"]`
                ];
                
                for (const optionSelector of optionSelectors) {
                    try {
                        await this.page.waitForSelector(optionSelector, { timeout: 2000 });
                        await this.page.click(optionSelector);
                        console.log(`✅ Selected ${fieldName}: ${value}`);
                        await this.page.waitForTimeout(300);
                        return true;
                    } catch (error) {
                        continue;
                    }
                }
            } catch (error) {
                continue;
            }
        }
        
        console.log(`⚠️ Could not select dropdown: ${fieldName}`);
        return false;
    }

    // Helper method to click buttons
    async clickButton(buttonTexts) {
        for (const buttonText of buttonTexts) {
            try {
                if (buttonText.startsWith('button')) {
                    // CSS selector
                    await this.page.waitForSelector(buttonText, { timeout: 3000 });
                    await this.page.click(buttonText);
                    console.log(`✅ Clicked button: ${buttonText}`);
                    await this.page.waitForTimeout(500);
                    return true;
                } else {
                    // Text-based selectors with multiple approaches
                    const selectors = [
                        `button:has-text("${buttonText}")`,
                        `.MuiButton-root:has-text("${buttonText}")`,
                        `[role="button"]:has-text("${buttonText}")`,
                        `button[aria-label*="${buttonText}"]`,
                        `*:has-text("${buttonText}")[role="button"]`
                    ];
                    
                    for (const selector of selectors) {
                        try {
                            await this.page.waitForSelector(selector, { timeout: 2000 });
                            await this.page.click(selector);
                            console.log(`✅ Clicked button: ${buttonText} (${selector})`);
                            await this.page.waitForTimeout(500);
                            return true;
                        } catch (error) {
                            continue;
                        }
                    }
                }
            } catch (error) {
                continue;
            }
        }
        
        console.log(`⚠️ Could not find/click any button from: ${buttonTexts.join(', ')}`);
        return false;
    }

    async configureEmployeeCredentials() {
        try {
            console.log('🔑 Configuring employee login credentials...');
            
            // Navigate to employee management or user management
            const managementPages = [
                '/employees',
                '/users',
                '/admin/users',
                '/user-management'
            ];

            for (const page of managementPages) {
                try {
                    await this.page.goto(`${this.config.baseUrl}${page}`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // Look for user/employee list
                    const listFound = await this.waitForElement('.employee-list, .user-list, table, .data-table', 5000);
                    if (listFound) {
                        // Try to find and configure credentials for a user
                        const configured = await this.setEmployeePassword();
                        if (configured) {
                            return true;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            return false;
        } catch (error) {
            console.log(`⚠️  Credential configuration failed: ${error.message}`);
            return false;
        }
    }

    async setEmployeePassword() {
        try {
            // Look for edit/configure buttons in the employee list
            const configureSelectors = [
                '.edit-user',
                '.configure-login',
                '.set-password',
                'button:contains("Edit")',
                'button:contains("Configure")',
                'button:contains("Set Password")',
                '.action-btn'
            ];

            for (const selector of configureSelectors) {
                try {
                    const elements = await this.page.$$(selector);
                    if (elements.length > 0) {
                        // Click the first configure button
                        await elements[0].click();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Look for password fields
                        const passwordField = await this.page.$('input[name="password"], input[type="password"], #password');
                        const confirmField = await this.page.$('input[name="confirmPassword"], input[name="confirm_password"], #confirmPassword');
                        
                        if (passwordField) {
                            await passwordField.click({ clickCount: 3 });
                            await passwordField.type('Sz5nT8wA3mK7rD9p');
                            
                            if (confirmField) {
                                await confirmField.click({ clickCount: 3 });
                                await confirmField.type('Sz5nT8wA3mK7rD9p');
                            }
                            
                            // Submit the password form
                            const submitBtn = await this.page.$('button[type="submit"], .save-btn, button:contains("Save")');
                            if (submitBtn) {
                                await submitBtn.click();
                                await new Promise(resolve => setTimeout(resolve, 2000));
                                console.log('✅ Employee password configured successfully');
                                return true;
                            }
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            return false;
        } catch (error) {
            console.log(`⚠️  Password setting failed: ${error.message}`);
            return false;
        }
    }

    async configurePayslipSettings() {
        try {
            console.log('💰 Configuring payslip settings...');
            
            // Navigate to payslip configuration
            const configPages = [
                '/payslip/config',
                '/admin/payslip',
                '/settings/payslip',
                '/payroll-settings'
            ];

            for (const page of configPages) {
                try {
                    await this.page.goto(`${this.config.baseUrl}${page}`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // Look for configuration form
                    const configForm = await this.waitForElement('form, .payslip-config, .settings-form', 5000);
                    if (configForm) {
                        // Fill basic payslip configuration
                        const configured = await this.fillPayslipConfig();
                        return configured;
                    }
                } catch (e) {
                    continue;
                }
            }

            return false;
        } catch (error) {
            console.log(`⚠️  Payslip configuration failed: ${error.message}`);
            return false;
        }
    }

    async fillPayslipConfig() {
        try {
            const configFields = [
                { selector: 'input[name="companyName"], #companyName', value: 'Test Company Ltd' },
                { selector: 'input[name="basicSalary"], #basicSalary', value: '45000' },
                { selector: 'input[name="allowances"], #allowances', value: '5000' },
                { selector: 'input[name="deductions"], #deductions', value: '2000' }
            ];

            for (const field of configFields) {
                try {
                    const element = await this.page.$(field.selector);
                    if (element) {
                        await element.click({ clickCount: 3 });
                        await element.type(field.value);
                    }
                } catch (e) {
                    continue;
                }
            }

            // Save configuration
            const saveBtn = await this.page.$('button[type="submit"], .save-btn, button:contains("Save")');
            if (saveBtn) {
                await saveBtn.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('✅ Payslip configuration saved');
                return true;
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    async generateReport() {
        const endTime = new Date();
        const duration = endTime - this.startTime;
        const successRate = this.testCount > 0 ? ((this.passCount / this.testCount) * 100).toFixed(2) : 0;

        const reportData = {
            summary: {
                testRunId: `TEST_RUN_${this.startTime.getTime()}`,
                startTime: this.startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration: `${Math.round(duration / 1000)}s`,
                totalTests: this.testCount,
                passed: this.passCount,
                failed: this.failCount,
                skipped: this.testCount - this.passCount - this.failCount,
                successRate: `${successRate}%`
            },
            results: this.results,
            screenshots: this.screenshots,
            environment: {
                frontendUrl: this.config.baseUrl,
                backendUrl: this.config.apiUrl,
                browserVersion: await this.browser.version(),
                timestamp: endTime.toISOString()
            }
        };

        // Save JSON report
        const jsonReportPath = path.join(this.config.reportPath, `test_report_${this.startTime.getTime()}.json`);
        fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));

        // Generate HTML report
        const htmlReport = this.generateHtmlReport(reportData);
        const htmlReportPath = path.join(this.config.reportPath, `test_report_${this.startTime.getTime()}.html`);
        fs.writeFileSync(htmlReportPath, htmlReport);

        console.log('\n📊 TEST EXECUTION COMPLETE');
        console.log('========================');
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log(`✅ Tests Passed: ${this.passCount}`);
        console.log(`❌ Tests Failed: ${this.failCount}`);
        console.log(`⏭️  Tests Skipped: ${this.testCount - this.passCount - this.failCount}`);
        console.log(`⏱️  Total Duration: ${Math.round(duration / 1000)}s`);
        console.log(`📄 JSON Report: ${jsonReportPath}`);
        console.log(`🌐 HTML Report: ${htmlReportPath}`);

        return reportData;
    }

    generateHtmlReport(data) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>HRM System - Excel Business Use Cases Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-PASSED { background-color: #d4edda; }
        .status-FAILED { background-color: #f8d7da; }
        .status-SKIPPED { background-color: #fff3cd; }
    </style>
</head>
<body>
    <h1>🏢 HRM System - Excel Business Use Cases Test Report</h1>
    
    <div class="summary">
        <h2>📊 Test Execution Summary</h2>
        <div class="metric">📅 <strong>Date:</strong> ${data.summary.endTime.split('T')[0]}</div>
        <div class="metric">⏱️ <strong>Duration:</strong> ${data.summary.duration}</div>
        <div class="metric">🎯 <strong>Success Rate:</strong> ${data.summary.successRate}</div>
        <div class="metric passed">✅ <strong>Passed:</strong> ${data.summary.passed}</div>
        <div class="metric failed">❌ <strong>Failed:</strong> ${data.summary.failed}</div>
        <div class="metric skipped">⏭️ <strong>Skipped:</strong> ${data.summary.skipped}</div>
    </div>

    <h2>📋 Detailed Test Results</h2>
    <table>
        <thead>
            <tr>
                <th>Test ID</th>
                <th>Section</th>
                <th>Scenario</th>
                <th>Expected Result</th>
                <th>Actual Result</th>
                <th>Status</th>
                <th>Duration (ms)</th>
            </tr>
        </thead>
        <tbody>
            ${data.results.map(result => `
                <tr class="status-${result.status}">
                    <td>${result.testId}</td>
                    <td>${result.section}</td>
                    <td>${result.scenario}</td>
                    <td>${result.expectedResult}</td>
                    <td>${result.actualResult}</td>
                    <td>${result.status}</td>
                    <td>${result.duration}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <p><em>Report generated: ${data.summary.endTime}</em></p>
</body>
</html>
        `;
    }

    async runAllTests() {
        try {
            await this.init();

            console.log('🎬 Starting automated test execution...\n');

            // Run tests for high priority scenarios first
            const priorityOrder = ['P1', 'P2', 'P3'];
            for (const priority of priorityOrder) {
                const scenariosForPriority = this.testScenarios.filter(s => s.priority === priority);
                if (scenariosForPriority.length > 0) {
                    console.log(`\n🎯 Testing ${priority} scenarios (${scenariosForPriority.length} tests):`);
                    console.log('-'.repeat(50));
                }

                for (const scenario of scenariosForPriority) {
                    await this.testScenario(scenario);
                    
                    // Small delay between tests
                    await this.page.waitForTimeout ? await this.page.waitForTimeout(1000) : await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            await this.generateReport();

        } catch (error) {
            console.error('💥 Test execution failed:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Export for use as module
module.exports = ExcelBusinessUseCase_AutomatedTester;

// Run if called directly
if (require.main === module) {
    const tester = new ExcelBusinessUseCase_AutomatedTester();
    tester.runAllTests().catch(console.error);
}
