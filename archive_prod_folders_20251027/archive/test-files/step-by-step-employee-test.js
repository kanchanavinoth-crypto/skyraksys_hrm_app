const puppeteer = require('puppeteer');

class StepByStepEmployeeCreation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.config = {
            baseUrl: 'http://localhost:3000',
            timeout: 30000
        };
        this.credentials = {
            admin: { email: 'admin@company.com', password: 'Kx9mP7qR2nF8sA5t' }
        };
    }

    async init() {
        console.log('🚀 Step-by-Step Employee Creation Test');
        console.log('======================================');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1366, height: 768 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.page = await this.browser.newPage();
        await this.page.setDefaultTimeout(this.config.timeout);
        
        // Enable console logging from the page
        this.page.on('console', msg => console.log('🌐 PAGE LOG:', msg.text()));
    }

    async step1_AdminLogin() {
        console.log('\n📍 STEP 1: Admin Login');
        console.log('======================');
        
        try {
            console.log('🔗 Navigating to login page...');
            await this.page.goto(`${this.config.baseUrl}/login`);
            await this.page.waitForTimeout(2000);
            
            console.log('📄 Current URL:', await this.page.url());
            
            console.log('🔍 Looking for login form...');
            await this.page.waitForSelector('input[name="email"]', { timeout: 10000 });
            
            console.log('📝 Filling admin credentials...');
            await this.page.type('input[name="email"]', this.credentials.admin.email);
            await this.page.type('input[name="password"]', this.credentials.admin.password);
            
            console.log('🔘 Clicking login button...');
            await this.page.click('button[type="submit"]');
            
            console.log('⏳ Waiting for navigation...');
            await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
            
            const currentUrl = await this.page.url();
            console.log('📄 After login URL:', currentUrl);
            
            if (currentUrl.includes('/dashboard') || currentUrl.includes('/login') === false) {
                console.log('✅ STEP 1: Admin login successful!');
                return true;
            } else {
                console.log('❌ STEP 1: Login failed - still on login page');
                return false;
            }
            
        } catch (error) {
            console.log('❌ STEP 1: Login error:', error.message);
            return false;
        }
    }

    async step2_NavigateToEmployees() {
        console.log('\n📍 STEP 2: Navigate to Employees Page');
        console.log('=====================================');
        
        try {
            console.log('⏳ Waiting for dashboard to load...');
            await this.page.waitForTimeout(3000);
            
            console.log('🔍 Analyzing page structure...');
            const pageAnalysis = await this.page.evaluate(() => {
                // Look for navigation elements
                const navElements = [];
                
                // Find all clickable elements that might lead to employees
                const allElements = document.querySelectorAll('*');
                allElements.forEach(el => {
                    const text = el.textContent;
                    if (text && text.toLowerCase().includes('employee') && 
                        (el.tagName === 'A' || el.tagName === 'BUTTON' || el.onclick || el.href)) {
                        navElements.push({
                            tag: el.tagName,
                            text: text.trim().substring(0, 50),
                            href: el.href || 'no href',
                            id: el.id || 'no id',
                            className: el.className || 'no class'
                        });
                    }
                });
                
                return {
                    url: window.location.href,
                    title: document.title,
                    employeeElements: navElements
                };
            });
            
            console.log('📊 Page Analysis:');
            console.log('  Current URL:', pageAnalysis.url);
            console.log('  Page Title:', pageAnalysis.title);
            console.log('  Employee-related elements found:', pageAnalysis.employeeElements.length);
            
            pageAnalysis.employeeElements.forEach((el, i) => {
                console.log(`    ${i + 1}. ${el.tag}: "${el.text}" | href: ${el.href}`);
            });
            
            // Try different approaches to navigate to employees
            console.log('🔍 Attempting navigation to employees...');
            
            // Approach 1: Direct URL
            console.log('📍 Approach 1: Direct navigation to /employees');
            await this.page.goto(`${this.config.baseUrl}/employees`);
            await this.page.waitForTimeout(2000);
            
            const currentUrl = await this.page.url();
            console.log('📄 Current URL after navigation:', currentUrl);
            
            if (currentUrl.includes('/employees')) {
                console.log('✅ STEP 2: Successfully navigated to employees page!');
                return true;
            } else {
                console.log('❌ STEP 2: Direct navigation failed');
                
                // Approach 2: Try clicking navigation elements
                console.log('📍 Approach 2: Trying to click navigation elements...');
                
                for (const element of pageAnalysis.employeeElements) {
                    try {
                        if (element.href && element.href !== 'no href') {
                            console.log(`🔗 Trying to click: ${element.text}`);
                            await this.page.goto(element.href);
                            await this.page.waitForTimeout(2000);
                            
                            const newUrl = await this.page.url();
                            if (newUrl.includes('/employees')) {
                                console.log(`✅ STEP 2: Navigation successful via: ${element.text}`);
                                return true;
                            }
                        }
                    } catch (error) {
                        console.log(`⚠️ Failed to navigate via ${element.text}:`, error.message);
                    }
                }
                
                return false;
            }
            
        } catch (error) {
            console.log('❌ STEP 2: Navigation error:', error.message);
            return false;
        }
    }

    async step3_FindAddEmployeeButton() {
        console.log('\n📍 STEP 3: Find Add Employee Button');
        console.log('===================================');
        
        try {
            console.log('⏳ Waiting for employees page to load...');
            await this.page.waitForTimeout(3000);
            
            console.log('📷 Taking screenshot of employees page...');
            await this.page.screenshot({ path: 'step3-employees-page.png', fullPage: true });
            
            console.log('🔍 Analyzing employees page...');
            const pageContent = await this.page.evaluate(() => {
                const buttons = [];
                const links = [];
                
                // Find all buttons
                document.querySelectorAll('button').forEach(btn => {
                    buttons.push({
                        text: btn.textContent.trim(),
                        id: btn.id || 'no id',
                        className: btn.className || 'no class',
                        type: btn.type || 'no type'
                    });
                });
                
                // Find all links
                document.querySelectorAll('a').forEach(link => {
                    links.push({
                        text: link.textContent.trim(),
                        href: link.href || 'no href',
                        id: link.id || 'no id',
                        className: link.className || 'no class'
                    });
                });
                
                return {
                    url: window.location.href,
                    pageText: document.body.textContent.substring(0, 500),
                    buttons: buttons.slice(0, 10), // First 10 buttons
                    links: links.filter(l => l.href.includes('add') || l.text.toLowerCase().includes('add') || 
                                        l.text.toLowerCase().includes('new') || l.text.toLowerCase().includes('create'))
                };
            });
            
            console.log('📊 Employees Page Analysis:');
            console.log('  URL:', pageContent.url);
            console.log('  Page preview:', pageContent.pageText.substring(0, 200) + '...');
            console.log('  Total buttons found:', pageContent.buttons.length);
            console.log('  Add-related links found:', pageContent.links.length);
            
            console.log('\n📝 Available buttons:');
            pageContent.buttons.forEach((btn, i) => {
                console.log(`  ${i + 1}. "${btn.text}" (${btn.type}) - ${btn.className}`);
            });
            
            console.log('\n🔗 Add-related links:');
            pageContent.links.forEach((link, i) => {
                console.log(`  ${i + 1}. "${link.text}" -> ${link.href}`);
            });
            
            // Try to find and click Add Employee functionality
            console.log('\n🔍 Looking for Add Employee functionality...');
            
            // Approach 1: Direct navigation to add-employee
            console.log('📍 Approach 1: Direct navigation to /add-employee');
            await this.page.goto(`${this.config.baseUrl}/add-employee`);
            await this.page.waitForTimeout(2000);
            
            const addPageUrl = await this.page.url();
            console.log('📄 Add employee page URL:', addPageUrl);
            
            if (addPageUrl.includes('/add-employee')) {
                console.log('✅ STEP 3: Successfully reached add-employee page!');
                return true;
            } else {
                console.log('❌ STEP 3: Direct navigation to add-employee failed');
                return false;
            }
            
        } catch (error) {
            console.log('❌ STEP 3: Error finding add employee button:', error.message);
            return false;
        }
    }

    async step4_AnalyzeAddEmployeeForm() {
        console.log('\n📍 STEP 4: Analyze Add Employee Form');
        console.log('====================================');
        
        try {
            console.log('⏳ Waiting for form to load...');
            await this.page.waitForTimeout(3000);
            
            console.log('📷 Taking screenshot of add employee form...');
            await this.page.screenshot({ path: 'step4-add-employee-form.png', fullPage: true });
            
            console.log('🔍 Analyzing form structure...');
            const formAnalysis = await this.page.evaluate(() => {
                const inputs = [];
                const selects = [];
                const buttons = [];
                const steppers = [];
                
                // Find all input fields
                document.querySelectorAll('input').forEach(input => {
                    inputs.push({
                        name: input.name || 'no name',
                        type: input.type || 'text',
                        placeholder: input.placeholder || 'no placeholder',
                        id: input.id || 'no id',
                        required: input.required,
                        value: input.value || ''
                    });
                });
                
                // Find all select/dropdown fields
                document.querySelectorAll('select, [role="combobox"], .MuiSelect-root').forEach(select => {
                    selects.push({
                        name: select.name || 'no name',
                        id: select.id || 'no id',
                        className: select.className || '',
                        role: select.getAttribute('role') || 'no role'
                    });
                });
                
                // Find all buttons
                document.querySelectorAll('button').forEach(btn => {
                    buttons.push({
                        text: btn.textContent.trim(),
                        type: btn.type || 'button',
                        id: btn.id || 'no id',
                        className: btn.className || '',
                        disabled: btn.disabled
                    });
                });
                
                // Look for stepper/step indicators
                document.querySelectorAll('.MuiStepper-root, .stepper, .steps, [role="tablist"]').forEach(stepper => {
                    steppers.push({
                        className: stepper.className,
                        id: stepper.id || 'no id',
                        text: stepper.textContent.substring(0, 100)
                    });
                });
                
                return {
                    url: window.location.href,
                    hasForm: !!document.querySelector('form'),
                    inputs: inputs,
                    selects: selects,
                    buttons: buttons,
                    steppers: steppers,
                    bodyText: document.body.textContent.substring(0, 300)
                };
            });
            
            console.log('📊 Form Analysis Results:');
            console.log('  URL:', formAnalysis.url);
            console.log('  Has <form> element:', formAnalysis.hasForm);
            console.log('  Input fields found:', formAnalysis.inputs.length);
            console.log('  Select fields found:', formAnalysis.selects.length);
            console.log('  Buttons found:', formAnalysis.buttons.length);
            console.log('  Stepper elements found:', formAnalysis.steppers.length);
            
            console.log('\n📝 Input Fields:');
            formAnalysis.inputs.forEach((input, i) => {
                console.log(`  ${i + 1}. name="${input.name}" type="${input.type}" placeholder="${input.placeholder}" required=${input.required}`);
            });
            
            console.log('\n🔽 Select/Dropdown Fields:');
            formAnalysis.selects.forEach((select, i) => {
                console.log(`  ${i + 1}. name="${select.name}" role="${select.role}" class="${select.className.substring(0, 30)}..."`);
            });
            
            console.log('\n🔘 Buttons:');
            formAnalysis.buttons.forEach((btn, i) => {
                console.log(`  ${i + 1}. "${btn.text}" type="${btn.type}" disabled=${btn.disabled}`);
            });
            
            console.log('\n🚶 Stepper Elements:');
            formAnalysis.steppers.forEach((stepper, i) => {
                console.log(`  ${i + 1}. "${stepper.text.substring(0, 50)}..."`);
            });
            
            if (formAnalysis.inputs.length > 0) {
                console.log('✅ STEP 4: Form analysis complete - found input fields!');
                return { success: true, formData: formAnalysis };
            } else {
                console.log('❌ STEP 4: No input fields found on the form');
                return { success: false, formData: formAnalysis };
            }
            
        } catch (error) {
            console.log('❌ STEP 4: Form analysis error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async step5_FillBasicFields() {
        console.log('\n📍 STEP 5: Fill Basic Employee Fields');
        console.log('=====================================');
        
        try {
            const timestamp = Date.now();
            const testEmployee = {
                firstName: `TestEmp${timestamp}`,
                lastName: 'Automation',
                email: `test.emp.${timestamp}@company.com`,
                phone: '9876543210'
            };
            
            console.log('📝 Test Employee Data:');
            console.log('  First Name:', testEmployee.firstName);
            console.log('  Last Name:', testEmployee.lastName);
            console.log('  Email:', testEmployee.email);
            console.log('  Phone:', testEmployee.phone);
            
            // Try to fill firstName
            console.log('\n🔤 Filling firstName...');
            const firstNameSelectors = [
                'input[name="firstName"]',
                'input[id="firstName"]',
                'input[placeholder*="First"]',
                '.MuiTextField-root input[name="firstName"]'
            ];
            
            let firstNameFilled = false;
            for (const selector of firstNameSelectors) {
                try {
                    console.log(`  Trying selector: ${selector}`);
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    await this.page.click(selector);
                    await this.page.keyboard.down('Control');
                    await this.page.keyboard.press('KeyA');
                    await this.page.keyboard.up('Control');
                    await this.page.type(selector, testEmployee.firstName);
                    console.log(`  ✅ FirstName filled successfully with: ${selector}`);
                    firstNameFilled = true;
                    break;
                } catch (error) {
                    console.log(`  ❌ Failed with ${selector}:`, error.message);
                }
            }
            
            // Try to fill lastName
            console.log('\n🔤 Filling lastName...');
            const lastNameSelectors = [
                'input[name="lastName"]',
                'input[id="lastName"]',
                'input[placeholder*="Last"]',
                '.MuiTextField-root input[name="lastName"]'
            ];
            
            let lastNameFilled = false;
            for (const selector of lastNameSelectors) {
                try {
                    console.log(`  Trying selector: ${selector}`);
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    await this.page.click(selector);
                    await this.page.keyboard.down('Control');
                    await this.page.keyboard.press('KeyA');
                    await this.page.keyboard.up('Control');
                    await this.page.type(selector, testEmployee.lastName);
                    console.log(`  ✅ LastName filled successfully with: ${selector}`);
                    lastNameFilled = true;
                    break;
                } catch (error) {
                    console.log(`  ❌ Failed with ${selector}:`, error.message);
                }
            }
            
            // Try to fill email
            console.log('\n📧 Filling email...');
            const emailSelectors = [
                'input[name="email"]',
                'input[type="email"]',
                'input[id="email"]',
                'input[placeholder*="email"]',
                '.MuiTextField-root input[name="email"]'
            ];
            
            let emailFilled = false;
            for (const selector of emailSelectors) {
                try {
                    console.log(`  Trying selector: ${selector}`);
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    await this.page.click(selector);
                    await this.page.keyboard.down('Control');
                    await this.page.keyboard.press('KeyA');
                    await this.page.keyboard.up('Control');
                    await this.page.type(selector, testEmployee.email);
                    console.log(`  ✅ Email filled successfully with: ${selector}`);
                    emailFilled = true;
                    break;
                } catch (error) {
                    console.log(`  ❌ Failed with ${selector}:`, error.message);
                }
            }
            
            console.log('\n📊 Field Fill Results:');
            console.log('  First Name:', firstNameFilled ? '✅ SUCCESS' : '❌ FAILED');
            console.log('  Last Name:', lastNameFilled ? '✅ SUCCESS' : '❌ FAILED');
            console.log('  Email:', emailFilled ? '✅ SUCCESS' : '❌ FAILED');
            
            const successCount = [firstNameFilled, lastNameFilled, emailFilled].filter(Boolean).length;
            
            if (successCount >= 2) {
                console.log(`✅ STEP 5: Successfully filled ${successCount}/3 basic fields!`);
                
                console.log('📷 Taking screenshot after filling fields...');
                await this.page.screenshot({ path: 'step5-form-filled.png', fullPage: true });
                
                return { success: true, fieldsFilled: successCount, testEmployee };
            } else {
                console.log(`❌ STEP 5: Only filled ${successCount}/3 fields - insufficient for proceeding`);
                return { success: false, fieldsFilled: successCount };
            }
            
        } catch (error) {
            console.log('❌ STEP 5: Field filling error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async step6_SubmitForm() {
        console.log('\n📍 STEP 6: Submit Employee Form');
        console.log('===============================');
        
        try {
            console.log('🔍 Looking for submit/save buttons...');
            
            const submitButtons = await this.page.evaluate(() => {
                const buttons = [];
                document.querySelectorAll('button').forEach(btn => {
                    const text = btn.textContent.toLowerCase();
                    if (text.includes('submit') || text.includes('save') || 
                        text.includes('create') || text.includes('add') ||
                        text.includes('next') || btn.type === 'submit') {
                        buttons.push({
                            text: btn.textContent.trim(),
                            type: btn.type,
                            disabled: btn.disabled,
                            className: btn.className
                        });
                    }
                });
                return buttons;
            });
            
            console.log('📝 Submit-related buttons found:');
            submitButtons.forEach((btn, i) => {
                console.log(`  ${i + 1}. "${btn.text}" (${btn.type}) disabled=${btn.disabled}`);
            });
            
            // Try different submit approaches
            const submitAttempts = [
                'button[type="submit"]',
                'button:contains("Submit")',
                'button:contains("Save")',
                'button:contains("Create")',
                'button:contains("Add Employee")',
                'button:contains("Next")',
                '.MuiButton-root[type="submit"]'
            ];
            
            let submitSuccess = false;
            for (const selector of submitAttempts) {
                try {
                    console.log(`🔘 Trying to submit with: ${selector}`);
                    
                    if (selector.includes('contains')) {
                        // Text-based selector - find manually
                        const buttons = await this.page.$$('button');
                        for (const button of buttons) {
                            const text = await button.evaluate(el => el.textContent);
                            const searchText = selector.match(/contains\("([^"]+)"\)/)[1];
                            if (text.toLowerCase().includes(searchText.toLowerCase())) {
                                console.log(`  Found button with text: "${text}"`);
                                await button.click();
                                submitSuccess = true;
                                break;
                            }
                        }
                    } else {
                        // CSS selector
                        await this.page.waitForSelector(selector, { timeout: 2000 });
                        await this.page.click(selector);
                        submitSuccess = true;
                    }
                    
                    if (submitSuccess) {
                        console.log(`  ✅ Successfully clicked submit button: ${selector}`);
                        break;
                    }
                    
                } catch (error) {
                    console.log(`  ❌ Failed with ${selector}:`, error.message);
                }
            }
            
            if (submitSuccess) {
                console.log('⏳ Waiting for form submission...');
                await this.page.waitForTimeout(5000);
                
                const currentUrl = await this.page.url();
                console.log('📄 URL after submission:', currentUrl);
                
                // Check for success indicators
                const successCheck = await this.page.evaluate(() => {
                    const bodyText = document.body.textContent.toLowerCase();
                    return {
                        hasSuccess: bodyText.includes('success') || bodyText.includes('created') || 
                                   bodyText.includes('added') || bodyText.includes('employee created'),
                        currentUrl: window.location.href,
                        bodyPreview: bodyText.substring(0, 200)
                    };
                });
                
                console.log('📊 Success Check Results:');
                console.log('  Success indicators found:', successCheck.hasSuccess);
                console.log('  Current URL:', successCheck.currentUrl);
                console.log('  Body preview:', successCheck.bodyPreview);
                
                console.log('📷 Taking final screenshot...');
                await this.page.screenshot({ path: 'step6-after-submit.png', fullPage: true });
                
                if (successCheck.hasSuccess || !currentUrl.includes('/add-employee')) {
                    console.log('✅ STEP 6: Form submission appears successful!');
                    return { success: true, redirected: !currentUrl.includes('/add-employee') };
                } else {
                    console.log('⚠️ STEP 6: Form submitted but unclear if successful');
                    return { success: false, submitted: true };
                }
                
            } else {
                console.log('❌ STEP 6: Could not find or click submit button');
                return { success: false, submitted: false };
            }
            
        } catch (error) {
            console.log('❌ STEP 6: Form submission error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async cleanup() {
        if (this.browser) {
            console.log('\n🧹 Cleaning up...');
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.init();
            
            const step1Result = await this.step1_AdminLogin();
            if (!step1Result) {
                console.log('❌ Cannot proceed - Admin login failed');
                return;
            }
            
            const step2Result = await this.step2_NavigateToEmployees();
            if (!step2Result) {
                console.log('❌ Cannot proceed - Navigation to employees failed');
                return;
            }
            
            const step3Result = await this.step3_FindAddEmployeeButton();
            if (!step3Result) {
                console.log('❌ Cannot proceed - Could not reach add employee page');
                return;
            }
            
            const step4Result = await this.step4_AnalyzeAddEmployeeForm();
            if (!step4Result.success) {
                console.log('❌ Cannot proceed - Form analysis failed');
                return;
            }
            
            const step5Result = await this.step5_FillBasicFields();
            if (!step5Result.success) {
                console.log('❌ Cannot proceed - Field filling failed');
                return;
            }
            
            const step6Result = await this.step6_SubmitForm();
            
            console.log('\n🏁 FINAL RESULTS');
            console.log('================');
            console.log('Step 1 - Admin Login:', step1Result ? '✅ PASS' : '❌ FAIL');
            console.log('Step 2 - Navigate to Employees:', step2Result ? '✅ PASS' : '❌ FAIL');
            console.log('Step 3 - Find Add Employee:', step3Result ? '✅ PASS' : '❌ FAIL');
            console.log('Step 4 - Analyze Form:', step4Result.success ? '✅ PASS' : '❌ FAIL');
            console.log('Step 5 - Fill Fields:', step5Result.success ? '✅ PASS' : '❌ FAIL');
            console.log('Step 6 - Submit Form:', step6Result.success ? '✅ PASS' : '❌ FAIL');
            
            const overallSuccess = [step1Result, step2Result, step3Result, step4Result.success, step5Result.success, step6Result.success].every(Boolean);
            console.log('\n🎯 OVERALL RESULT:', overallSuccess ? '✅ SUCCESS!' : '❌ NEEDS WORK');
            
            if (overallSuccess) {
                console.log('🎉 Employee creation process working end-to-end!');
            } else {
                console.log('🔧 Check the screenshots and logs above to identify issues');
            }
            
        } catch (error) {
            console.log('❌ Test execution error:', error.message);
        } finally {
            await this.cleanup();
        }
    }
}

// Run the step-by-step test
const test = new StepByStepEmployeeCreation();
test.run();
