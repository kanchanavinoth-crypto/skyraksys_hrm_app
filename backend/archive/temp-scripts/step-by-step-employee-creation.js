const puppeteer = require('puppeteer');

async function stepByStepEmployeeCreation() {
    console.log('🚀 Starting Step-by-Step Employee Creation Test');
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 500,
        defaultViewport: { width: 1280, height: 720 }
    });
    
    try {
        const page = await browser.newPage();
        
        // Step 1: Login as Admin
        console.log('Step 1: Logging in as admin...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: './test-screenshots/STEP_01_login_page.png' });
        
        await page.type('input[name="username"]', 'admin');
        await page.type('input[name="password"]', 'Kx9mP7qR2nF8sA5t');
        await page.screenshot({ path: './test-screenshots/STEP_01_credentials_entered.png' });
        
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await page.screenshot({ path: './test-screenshots/STEP_01_admin_dashboard.png' });
        console.log('✅ Admin login successful');
        
        // Step 2: Navigate to Add Employee
        console.log('Step 2: Navigating to add employee page...');
        await page.goto('http://localhost:3000/add-employee', { waitUntil: 'networkidle0' });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: './test-screenshots/STEP_02_add_employee_page.png' });
        
        // Step 3: Analyze Form Structure
        console.log('Step 3: Analyzing form structure...');
        const formHTML = await page.evaluate(() => document.body.innerHTML);
        console.log('Form HTML snippet (first 1000 chars):', formHTML.substring(0, 1000));
        
        // Check for stepper
        const stepperExists = await page.evaluate(() => {
            return document.querySelector('.MuiStepper-root') !== null;
        });
        console.log('Stepper component exists:', stepperExists);
        
        // Get all input fields
        const inputFields = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
            return inputs.map(input => ({
                type: input.type || input.tagName,
                name: input.name || 'no-name',
                id: input.id || 'no-id',
                placeholder: input.placeholder || 'no-placeholder',
                className: input.className,
                visible: input.offsetHeight > 0
            }));
        });
        console.log('Available input fields:', JSON.stringify(inputFields, null, 2));
        
        // Get all buttons
        const buttons = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.map(btn => ({
                text: btn.textContent?.trim(),
                className: btn.className,
                visible: btn.offsetHeight > 0,
                disabled: btn.disabled
            }));
        });
        console.log('Available buttons:', JSON.stringify(buttons, null, 2));
        
        // Step 4: Try to fill first step (Personal Information)
        console.log('Step 4: Attempting to fill personal information...');
        
        // Try different selectors for First Name
        const firstNameSelectors = [
            'input[name="firstName"]',
            'input[placeholder*="First"]',
            'input[id*="first"]',
            '.MuiTextField-root input:first-of-type',
            'form input:first-of-type'
        ];
        
        let firstNameFilled = false;
        for (const selector of firstNameSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 2000 });
                await page.type(selector, 'Test');
                console.log(`✅ First name filled using selector: ${selector}`);
                firstNameFilled = true;
                break;
            } catch (error) {
                console.log(`❌ Failed to fill first name with selector: ${selector}`);
            }
        }
        
        if (firstNameFilled) {
            await page.screenshot({ path: './test-screenshots/STEP_04_first_name_filled.png' });
        }
        
        // Try to fill Last Name
        const lastNameSelectors = [
            'input[name="lastName"]',
            'input[placeholder*="Last"]',
            'input[id*="last"]'
        ];
        
        let lastNameFilled = false;
        for (const selector of lastNameSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 2000 });
                await page.type(selector, 'Employee');
                console.log(`✅ Last name filled using selector: ${selector}`);
                lastNameFilled = true;
                break;
            } catch (error) {
                console.log(`❌ Failed to fill last name with selector: ${selector}`);
            }
        }
        
        if (lastNameFilled) {
            await page.screenshot({ path: './test-screenshots/STEP_04_last_name_filled.png' });
        }
        
        // Try to fill Email
        const emailSelectors = [
            'input[name="email"]',
            'input[type="email"]',
            'input[placeholder*="Email"]',
            'input[placeholder*="email"]'
        ];
        
        let emailFilled = false;
        for (const selector of emailSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 2000 });
                await page.type(selector, 'test.employee@company.com');
                console.log(`✅ Email filled using selector: ${selector}`);
                emailFilled = true;
                break;
            } catch (error) {
                console.log(`❌ Failed to fill email with selector: ${selector}`);
            }
        }
        
        if (emailFilled) {
            await page.screenshot({ path: './test-screenshots/STEP_04_email_filled.png' });
        }
        
        // Step 5: Try to proceed to next step
        console.log('Step 5: Attempting to proceed to next step...');
        
        const nextButtonSelectors = [
            'button[type="button"]:contains("Next")',
            'button:contains("Next")',
            'button[aria-label*="next"]',
            '.MuiButton-root:contains("Next")',
            'button:last-of-type'
        ];
        
        let nextClicked = false;
        for (const selector of nextButtonSelectors) {
            try {
                await page.evaluate((sel) => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const nextBtn = buttons.find(btn => btn.textContent?.toLowerCase().includes('next'));
                    if (nextBtn) nextBtn.click();
                }, selector);
                console.log(`✅ Next button clicked`);
                nextClicked = true;
                break;
            } catch (error) {
                console.log(`❌ Failed to click next with selector: ${selector}`);
            }
        }
        
        if (nextClicked) {
            await page.waitForTimeout(2000);
            await page.screenshot({ path: './test-screenshots/STEP_05_next_step.png' });
        }
        
        // Step 6: Final analysis
        console.log('Step 6: Final analysis...');
        const finalURL = page.url();
        const finalTitle = await page.title();
        console.log('Final URL:', finalURL);
        console.log('Final page title:', finalTitle);
        
        await page.screenshot({ path: './test-screenshots/STEP_06_final_state.png' });
        
        console.log('✅ Step-by-step employee creation test completed');
        
    } catch (error) {
        console.error('❌ Error during step-by-step test:', error);
        const page = browser.pages()[0];
        if (page) {
            await page.screenshot({ path: './test-screenshots/STEP_ERROR.png' });
        }
    } finally {
        await browser.close();
    }
}

// Run the test
stepByStepEmployeeCreation().catch(console.error);
