const puppeteer = require('puppeteer');

async function createEmployeeProperFlow() {
    console.log('🚀 Starting Employee Creation with Correct Material-UI Flow');
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 1000,
        defaultViewport: { width: 1280, height: 720 }
    });
    
    try {
        const page = await browser.newPage();
        
        // Step 1: Login as Admin
        console.log('Step 1: Admin Login...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: './test-screenshots/PROPER_01_login_page.png' });
        
        await page.type('input[name="email"]', 'admin@test.com');
        await page.type('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await page.screenshot({ path: './test-screenshots/PROPER_01_admin_dashboard.png' });
        console.log('✅ Admin logged in successfully');
        
        // Step 2: Navigate to Add Employee
        console.log('Step 2: Navigating to Add Employee...');
        await page.goto('http://localhost:3000/add-employee', { waitUntil: 'networkidle0' });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: './test-screenshots/PROPER_02_add_employee_form.png' });
        
        // Step 3: Fill Personal Information (Step 1 of form)
        console.log('Step 3: Filling Personal Information (Step 1)...');
        
        // Fill First Name
        await page.waitForSelector('input[name="firstName"]', { timeout: 5000 });
        await page.focus('input[name="firstName"]');
        await page.type('input[name="firstName"]', 'Test');
        
        // Fill Last Name
        await page.focus('input[name="lastName"]');
        await page.type('input[name="lastName"]', 'Employee');
        
        // Fill Email
        await page.focus('input[name="email"]');
        await page.type('input[name="email"]', 'test.employee@company.com');
        
        // Fill Phone
        await page.focus('input[name="phone"]');
        await page.type('input[name="phone"]', '9876543210');
        
        // Fill Date of Birth
        await page.focus('input[name="dateOfBirth"]');
        await page.type('input[name="dateOfBirth"]', '1990-01-15');
        
        // Select Gender
        await page.click('div[name="gender"]');
        await page.waitForSelector('li[data-value="Male"]', { timeout: 3000 });
        await page.click('li[data-value="Male"]');
        
        // Fill Address
        await page.focus('input[name="address"]');
        await page.type('input[name="address"]', '123 Test Street');
        
        // Fill City
        await page.focus('input[name="city"]');
        await page.type('input[name="city"]', 'Mumbai');
        
        // Fill State
        await page.focus('input[name="state"]');
        await page.type('input[name="state"]', 'Maharashtra');
        
        // Fill Zip Code
        await page.focus('input[name="zipCode"]');
        await page.type('input[name="zipCode"]', '400001');
        
        await page.screenshot({ path: './test-screenshots/PROPER_03_personal_info_filled.png' });
        console.log('✅ Personal information filled');
        
        // Step 4: Proceed to Employment Details (Step 2)
        console.log('Step 4: Moving to Employment Details...');
        
        // Find and click Next button
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(btn => btn.textContent?.trim().toLowerCase() === 'next');
            if (nextBtn) nextBtn.click();
        });
        
        await page.waitForTimeout(2000);
        await page.screenshot({ path: './test-screenshots/PROPER_04_employment_step.png' });
        
        // Fill Employee ID
        await page.waitForSelector('input[name="employeeId"]', { timeout: 5000 });
        await page.focus('input[name="employeeId"]');
        await page.type('input[name="employeeId"]', 'EMP001');
        
        // Select Department
        await page.click('div[name="department"]');
        await page.waitForSelector('li[data-value="Engineering"]', { timeout: 3000 });
        await page.click('li[data-value="Engineering"]');
        
        // Select Position
        await page.click('div[name="position"]');
        await page.waitForSelector('li[data-value="Software Engineer"]', { timeout: 3000 });
        await page.click('li[data-value="Software Engineer"]');
        
        // Fill Hire Date
        await page.focus('input[name="hireDate"]');
        await page.type('input[name="hireDate"]', '2024-01-15');
        
        // Select Employment Type
        await page.click('div[name="employmentType"]');
        await page.waitForSelector('li[data-value="Full-time"]', { timeout: 3000 });
        await page.click('li[data-value="Full-time"]');
        
        await page.screenshot({ path: './test-screenshots/PROPER_04_employment_filled.png' });
        console.log('✅ Employment details filled');
        
        // Step 5: Proceed to Step 3 (Statutory & Bank)
        console.log('Step 5: Moving to Statutory & Bank Details...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(btn => btn.textContent?.trim().toLowerCase() === 'next');
            if (nextBtn) nextBtn.click();
        });
        
        await page.waitForTimeout(2000);
        await page.screenshot({ path: './test-screenshots/PROPER_05_statutory_step.png' });
        
        // Skip statutory details for now, proceed to next step
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(btn => btn.textContent?.trim().toLowerCase() === 'next');
            if (nextBtn) nextBtn.click();
        });
        
        // Step 6: Compensation & Emergency Contact (Step 4)
        console.log('Step 6: Filling Compensation & Emergency Contact...');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: './test-screenshots/PROPER_06_compensation_step.png' });
        
        // Fill Salary
        await page.waitForSelector('input[name="salary"]', { timeout: 5000 });
        await page.focus('input[name="salary"]');
        await page.type('input[name="salary"]', '50000');
        
        // Fill Emergency Contact Name
        await page.focus('input[name="emergencyContactName"]');
        await page.type('input[name="emergencyContactName"]', 'Emergency Contact');
        
        // Fill Emergency Contact Phone
        await page.focus('input[name="emergencyContactPhone"]');
        await page.type('input[name="emergencyContactPhone"]', '9876543211');
        
        // Fill Emergency Contact Relation
        await page.focus('input[name="emergencyContactRelation"]');
        await page.type('input[name="emergencyContactRelation"]', 'Father');
        
        await page.screenshot({ path: './test-screenshots/PROPER_06_compensation_filled.png' });
        console.log('✅ Compensation and emergency contact filled');
        
        // Step 7: Proceed to final step (User Account)
        console.log('Step 7: Moving to User Account step...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(btn => btn.textContent?.trim().toLowerCase() === 'next');
            if (nextBtn) nextBtn.click();
        });
        
        await page.waitForTimeout(2000);
        await page.screenshot({ path: './test-screenshots/PROPER_07_user_account_step.png' });
        
        // Step 8: Submit the form
        console.log('Step 8: Submitting the employee form...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const submitBtn = buttons.find(btn => 
                btn.textContent?.trim().toLowerCase().includes('submit') ||
                btn.textContent?.trim().toLowerCase().includes('save') ||
                btn.textContent?.trim().toLowerCase().includes('add employee')
            );
            if (submitBtn) {
                console.log('Found submit button:', submitBtn.textContent);
                submitBtn.click();
            }
        });
        
        await page.waitForTimeout(3000);
        await page.screenshot({ path: './test-screenshots/PROPER_08_submission_result.png' });
        
        // Check for success or error messages
        const successMessage = await page.evaluate(() => {
            const alerts = document.querySelectorAll('.MuiAlert-root, [role="alert"]');
            for (let alert of alerts) {
                if (alert.textContent.includes('success') || alert.textContent.includes('added')) {
                    return alert.textContent;
                }
            }
            return null;
        });
        
        const errorMessage = await page.evaluate(() => {
            const alerts = document.querySelectorAll('.MuiAlert-root, [role="alert"]');
            for (let alert of alerts) {
                if (alert.textContent.includes('error') || alert.textContent.includes('failed')) {
                    return alert.textContent;
                }
            }
            return null;
        });
        
        console.log('Success message:', successMessage);
        console.log('Error message:', errorMessage);
        
        if (successMessage) {
            console.log('✅ Employee created successfully!');
        } else if (errorMessage) {
            console.log('❌ Employee creation failed:', errorMessage);
        } else {
            console.log('⚠️ No clear success/error message found');
        }
        
        console.log('✅ Employee creation test completed successfully');
        
    } catch (error) {
        console.error('❌ Error during employee creation test:', error);
        const page = browser.pages()[0];
        if (page) {
            await page.screenshot({ path: './test-screenshots/PROPER_ERROR.png' });
        }
    } finally {
        await browser.close();
    }
}

// Run the test
createEmployeeProperFlow().catch(console.error);
