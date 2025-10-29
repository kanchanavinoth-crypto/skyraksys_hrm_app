const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class HRM_DebugTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.config = {
            baseUrl: 'http://localhost:3000',
            timeout: 30000,
            screenshotPath: './test-screenshots'
        };
        
        // Strong passwords matching our database
        this.credentials = {
            admin: { email: 'admin@company.com', password: 'Kx9mP7qR2nF8sA5t' },
            hr: { email: 'hr@company.com', password: 'Lw3nQ6xY8mD4vB7h' },
            employee: { email: 'employee@company.com', password: 'Mv4pS9wE2nR6kA8j' },
            manager: { email: 'manager@test.com', password: 'Qy8nR6wA2mS5kD7j' }
        };
    }

    async init() {
        console.log('🔍 HRM Debug Testing - Employee Creation & Login Issues');
        console.log('=====================================================');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1366, height: 768 },
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });

        this.page = await this.browser.newPage();
        await this.page.setDefaultTimeout(this.config.timeout);
        
        console.log('✅ Browser initialized for debugging');
    }

    async takeScreenshot(name, description = '') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `DEBUG_${name}_${timestamp}_${description}.png`;
        const filepath = path.join(this.config.screenshotPath, filename);
        
        try {
            await this.page.screenshot({ path: filepath, fullPage: true });
            console.log(`📸 Screenshot saved: ${filename}`);
            return filepath;
        } catch (error) {
            console.log(`⚠️  Screenshot failed: ${error.message}`);
            return null;
        }
    }

    async debugLogin(userType) {
        console.log(`\n🔐 DEBUG: Testing ${userType} login...`);
        
        try {
            await this.page.goto(this.config.baseUrl, { waitUntil: 'networkidle2' });
            await this.takeScreenshot('LOGIN_START', `${userType}_login_page`);
            
            const creds = this.credentials[userType];
            console.log(`📧 Using email: ${creds.email}`);
            console.log(`🔑 Using password: ${creds.password}`);
            
            // Wait for and fill login form
            await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
            
            // Clear and type email
            const emailInput = await this.page.$('input[type="email"], input[name="email"]');
            await emailInput.click({ clickCount: 3 });
            await emailInput.type(creds.email);
            console.log(`✅ Email entered: ${creds.email}`);
            
            // Clear and type password
            const passwordInput = await this.page.$('input[type="password"], input[name="password"]');
            await passwordInput.click({ clickCount: 3 });
            await passwordInput.type(creds.password);
            console.log(`✅ Password entered`);
            
            await this.takeScreenshot('LOGIN_FORM', `${userType}_credentials_entered`);
            
            // Submit form
            await this.page.click('button[type="submit"], .login-button, .btn-login');
            console.log(`🚀 Login form submitted`);
            
            // Wait for response
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const currentUrl = await this.page.url();
            await this.takeScreenshot('LOGIN_RESULT', `${userType}_after_login`);
            
            console.log(`🌐 Current URL after login: ${currentUrl}`);
            
            // Check if login was successful
            if (currentUrl.includes('/login')) {
                console.log(`❌ ${userType} login FAILED - still on login page`);
                
                // Check for error messages
                const errorMessages = await this.page.evaluate(() => {
                    const errors = [];
                    const errorElements = document.querySelectorAll('.error, .alert-danger, .error-message, .login-error');
                    errorElements.forEach(el => errors.push(el.textContent.trim()));
                    return errors;
                });
                
                if (errorMessages.length > 0) {
                    console.log(`💬 Error messages found: ${errorMessages.join(', ')}`);
                }
                
                return false;
            } else {
                console.log(`✅ ${userType} login SUCCESS - redirected to: ${currentUrl}`);
                return true;
            }
            
        } catch (error) {
            console.log(`💥 ${userType} login ERROR: ${error.message}`);
            await this.takeScreenshot('LOGIN_ERROR', `${userType}_login_exception`);
            return false;
        }
    }

    async debugEmployeeCreation() {
        console.log(`\n👥 DEBUG: Testing employee creation...`);
        
        try {
            // First login as admin/HR
            const adminLoggedIn = await this.debugLogin('admin');
            if (!adminLoggedIn) {
                console.log(`❌ Admin login failed - cannot test employee creation`);
                return false;
            }
            
            console.log(`🔍 Looking for employee creation functionality...`);
            
            // Try to navigate to employee management
            const navigationAttempts = [
                '/employees',
                '/admin/employees', 
                '/employee-management',
                '/users',
                '/admin/users'
            ];
            
            for (const path of navigationAttempts) {
                try {
                    console.log(`🌐 Trying navigation to: ${this.config.baseUrl}${path}`);
                    await this.page.goto(`${this.config.baseUrl}${path}`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const currentUrl = await this.page.url();
                    console.log(`📍 Current URL: ${currentUrl}`);
                    
                    await this.takeScreenshot('EMPLOYEE_PAGE', `navigation_to_${path.replace(/\//g, '_')}`);
                    
                    // Look for employee creation buttons
                    const createButtons = await this.page.$$eval('button, a', elements => 
                        elements.filter(el => 
                            el.textContent.toLowerCase().includes('add') ||
                            el.textContent.toLowerCase().includes('create') ||
                            el.textContent.toLowerCase().includes('new employee')
                        ).map(el => ({
                            text: el.textContent.trim(),
                            tag: el.tagName,
                            href: el.href || 'N/A'
                        }))
                    );
                    
                    console.log(`🔍 Found ${createButtons.length} potential create buttons:`);
                    createButtons.forEach((btn, idx) => {
                        console.log(`   ${idx + 1}. ${btn.tag}: "${btn.text}" (${btn.href})`);
                    });
                    
                    if (createButtons.length > 0) {
                        console.log(`✅ Found employee management page with create buttons`);
                        return true;
                    }
                    
                } catch (e) {
                    console.log(`⚠️  Navigation to ${path} failed: ${e.message}`);
                }
            }
            
            console.log(`❌ No employee creation functionality found`);
            return false;
            
        } catch (error) {
            console.log(`💥 Employee creation DEBUG ERROR: ${error.message}`);
            await this.takeScreenshot('CREATION_ERROR', 'employee_creation_exception');
            return false;
        }
    }

    async runDebugTests() {
        try {
            await this.init();
            
            console.log(`\n🧪 PHASE 1: Login Testing`);
            console.log(`========================`);
            
            const loginResults = {};
            for (const userType of ['admin', 'hr', 'employee', 'manager']) {
                loginResults[userType] = await this.debugLogin(userType);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            console.log(`\n📊 LOGIN TEST RESULTS:`);
            Object.entries(loginResults).forEach(([type, success]) => {
                console.log(`   ${success ? '✅' : '❌'} ${type}: ${success ? 'SUCCESS' : 'FAILED'}`);
            });
            
            console.log(`\n🧪 PHASE 2: Employee Creation Testing`);
            console.log(`====================================`);
            
            const creationSuccess = await this.debugEmployeeCreation();
            console.log(`📊 EMPLOYEE CREATION RESULT: ${creationSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
            
        } catch (error) {
            console.error('💥 Debug testing failed:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

const debugTester = new HRM_DebugTester();
debugTester.runDebugTests();
