const puppeteer = require('puppeteer');

async function quickEmployeeCreation() {
    console.log('🚀 Quick Employee Creation Test');
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 250, // Faster than before
        defaultViewport: { width: 1280, height: 720 }
    });
    
    try {
        const page = await browser.newPage();
        
        // Step 1: Quick Login as Admin
        console.log('Step 1: Admin login...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
        
        // Use correct login selectors - email field uses id="email"
        await page.waitForSelector('#email', { timeout: 5000 });
        await page.type('#email', 'admin@company.com');
        
        await page.waitForSelector('#password');
        await page.type('#password', 'Kx9mP7qR2nF8sA5t');
        
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        console.log('✅ Admin logged in');
        
        // Step 2: Navigate to Add Employee
        console.log('Step 2: Going to add employee...');
        await page.goto('http://localhost:3000/add-employee', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: './test-screenshots/QUICK_01_form.png' });
        
        // Step 3: Fill Personal Info (required fields only)
        console.log('Step 3: Filling required fields...');
        await page.waitForSelector('input[name="firstName"]', { timeout: 5000 });
        
        await page.type('input[name="firstName"]', 'Test');
        await page.type('input[name="lastName"]', 'Employee');
        await page.type('input[name="email"]', 'test.emp@company.com');
        await page.type('input[name="phone"]', '9876543210');
        
        await page.screenshot({ path: './test-screenshots/QUICK_02_personal.png' });
        console.log('✅ Personal info filled');
        
        // Step 4: Move to next step
        console.log('Step 4: Moving to employment step...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(btn => btn.textContent?.includes('Next'));
            if (nextBtn) nextBtn.click();
        });
        await page.waitForTimeout(1000);
        
        // Step 5: Fill Employment Info (required fields)
        console.log('Step 5: Filling employment details...');
        await page.waitForSelector('input[name="employeeId"]', { timeout: 5000 });
        
        await page.type('input[name="employeeId"]', 'EMP' + Date.now());
        await page.type('input[name="hireDate"]', '2024-01-15');
        
        // Select department
        await page.click('div[id*="department"]');
        await page.waitForTimeout(500);
        await page.evaluate(() => {
            const options = Array.from(document.querySelectorAll('li[data-value]'));
            const engineering = options.find(opt => opt.textContent?.includes('Engineering'));
            if (engineering) engineering.click();
        });
        
        // Select position
        await page.click('div[id*="position"]');
        await page.waitForTimeout(500);
        await page.evaluate(() => {
            const options = Array.from(document.querySelectorAll('li[data-value]'));
            const engineer = options.find(opt => opt.textContent?.includes('Software Engineer'));
            if (engineer) engineer.click();
        });
        
        await page.screenshot({ path: './test-screenshots/QUICK_03_employment.png' });
        console.log('✅ Employment details filled');
        
        // Step 6: Skip Statutory step
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(btn => btn.textContent?.includes('Next'));
            if (nextBtn) nextBtn.click();
        });
        await page.waitForTimeout(1000);
        
        // Step 7: Skip to compensation step and fill required fields
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(btn => btn.textContent?.includes('Next'));
            if (nextBtn) nextBtn.click();
        });
        await page.waitForTimeout(1000);
        
        // Fill compensation required fields
        console.log('Step 7: Filling compensation...');
        await page.waitForSelector('input[name="salary"]', { timeout: 5000 });
        
        await page.type('input[name="salary"]', '50000');
        await page.type('input[name="emergencyContactName"]', 'Emergency Contact');
        await page.type('input[name="emergencyContactPhone"]', '9876543211');
        
        await page.screenshot({ path: './test-screenshots/QUICK_04_compensation.png' });
        console.log('✅ Compensation filled');
        
        // Step 8: Final step and submit
        console.log('Step 8: Moving to final step...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(btn => btn.textContent?.includes('Next'));
            if (nextBtn) nextBtn.click();
        });
        await page.waitForTimeout(1000);
        
        // Submit the form
        console.log('Step 9: Submitting form...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const submitBtn = buttons.find(btn => 
                btn.textContent?.toLowerCase().includes('submit') ||
                btn.textContent?.toLowerCase().includes('save') ||
                btn.textContent?.toLowerCase().includes('add')
            );
            console.log('Submit button found:', submitBtn?.textContent);
            if (submitBtn) submitBtn.click();
        });
        
        // Wait for result
        await page.waitForTimeout(3000);
        await page.screenshot({ path: './test-screenshots/QUICK_05_result.png' });
        
        // Check for success/error messages
        const result = await page.evaluate(() => {
            const alerts = document.querySelectorAll('.MuiAlert-root, [role="alert"], .alert');
            for (let alert of alerts) {
                const text = alert.textContent.toLowerCase();
                if (text.includes('success') || text.includes('created') || text.includes('added')) {
                    return { success: true, message: alert.textContent };
                }
                if (text.includes('error') || text.includes('failed')) {
                    return { success: false, message: alert.textContent };
                }
            }
            
            // Check URL change
            if (window.location.pathname.includes('/employees')) {
                return { success: true, message: 'Redirected to employees page' };
            }
            
            return { success: null, message: 'No clear result' };
        });
        
        console.log('Result:', result);
        
        if (result.success === true) {
            console.log('🎉 SUCCESS: Employee created successfully!');
            console.log('Message:', result.message);
            return true;
        } else if (result.success === false) {
            console.log('❌ FAILED: Employee creation failed');
            console.log('Error:', result.message);
            return false;
        } else {
            console.log('⚠️ UNCLEAR: No definitive result');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        const page = browser.pages()[0];
        if (page) {
            await page.screenshot({ path: './test-screenshots/QUICK_ERROR.png' });
        }
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
quickEmployeeCreation().then(result => {
    console.log('Final result:', result ? '✅ SUCCESS' : '❌ FAILED');
}).catch(console.error);
