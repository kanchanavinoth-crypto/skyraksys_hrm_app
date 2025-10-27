const puppeteer = require('puppeteer');

async function testSimplifiedEmployeeCreation() {
    console.log('🚀 Testing Simplified Employee Creation Form');
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 300,
        defaultViewport: { width: 1280, height: 720 }
    });
    
    try {
        const page = await browser.newPage();
        
        // Step 1: Login
        console.log('Step 1: Admin login...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
        await page.type('#email', 'admin@company.com', { delay: 50 });
        await page.type('#password', 'Kx9mP7qR2nF8sA5t', { delay: 50 });
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        console.log('✅ Logged in');
        
        // Step 2: Navigate to simplified form
        console.log('Step 2: Navigate to add employee...');
        await page.goto('http://localhost:3000/add-employee', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: './test-screenshots/SIMPLIFIED_01_form.png' });
        
        // Step 3: Test Personal Information (Step 1)
        console.log('Step 3: Testing Personal Information step...');
        
        // Test focus stability by typing character by character
        const firstName = 'TestEmployee';
        await page.click('input[value=""][label="First Name"], input:first-of-type');
        await page.waitForTimeout(500);
        
        for (let i = 0; i < firstName.length; i++) {
            await page.type('body', firstName[i], { delay: 100 });
            // Check if we're still focused on the right element
            const focusedElement = await page.evaluate(() => document.activeElement.tagName);
            console.log(`Character ${i + 1}: ${firstName[i]}, focused on: ${focusedElement}`);
        }
        
        await page.screenshot({ path: './test-screenshots/SIMPLIFIED_02_firstname.png' });
        
        // Fill remaining personal info
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input');
            if (inputs.length >= 2) inputs[1].focus();
        });
        await page.type('body', 'Employee', { delay: 50 });
        
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input');
            if (inputs.length >= 3) inputs[2].focus();
        });
        await page.type('body', 'test.emp@company.com', { delay: 50 });
        
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input');
            if (inputs.length >= 4) inputs[3].focus();
        });
        await page.type('body', '9876543210', { delay: 50 });
        
        await page.screenshot({ path: './test-screenshots/SIMPLIFIED_03_personal_filled.png' });
        
        // Click Next
        console.log('Step 4: Moving to employment step...');
        await page.click('button:contains("Next"), button[type="button"]:last-of-type');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: './test-screenshots/SIMPLIFIED_04_employment_step.png' });
        
        // Fill employment info
        console.log('Step 5: Filling employment details...');
        const empId = 'EMP' + Date.now().toString().slice(-6);
        await page.evaluate((id) => {
            const inputs = document.querySelectorAll('input');
            if (inputs[0]) {
                inputs[0].focus();
                inputs[0].value = id;
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, empId);
        
        // Fill hire date
        await page.evaluate(() => {
            const dateInputs = document.querySelectorAll('input[type="date"]');
            if (dateInputs[0]) {
                dateInputs[0].focus();
                dateInputs[0].value = '2024-01-15';
                dateInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        
        // Select department
        await page.click('div[role="button"]:has-text("Department"), .MuiSelect-select:first-of-type');
        await page.waitForTimeout(500);
        await page.click('li:has-text("Engineering"), li[data-value="Engineering"]');
        
        // Select position  
        await page.click('div[role="button"]:has-text("Position"), .MuiSelect-select:nth-of-type(2)');
        await page.waitForTimeout(500);
        await page.click('li:has-text("Software Engineer"), li[data-value="Software Engineer"]');
        
        await page.screenshot({ path: './test-screenshots/SIMPLIFIED_05_employment_filled.png' });
        
        // Move to final step
        console.log('Step 6: Moving to compensation step...');
        await page.click('button:contains("Next")');
        await page.waitForTimeout(2000);
        
        // Fill compensation
        console.log('Step 7: Filling compensation...');
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input');
            // Find salary input
            const salaryInput = Array.from(inputs).find(input => 
                input.type === 'number' || 
                input.getAttribute('label') === 'Salary' ||
                input.closest('[label="Salary"]')
            );
            if (salaryInput) {
                salaryInput.focus();
                salaryInput.value = '50000';
                salaryInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        
        // Fill emergency contact
        const emergencyInputs = await page.$$('input:not([type="number"]):not([type="date"])');
        if (emergencyInputs.length >= 2) {
            await emergencyInputs[1].type('Emergency Contact');
            await emergencyInputs[2].type('9876543211');
        }
        
        await page.screenshot({ path: './test-screenshots/SIMPLIFIED_06_compensation_filled.png' });
        
        // Submit form
        console.log('Step 8: Submitting form...');
        await page.click('button:contains("Add Employee"), button[type="submit"]');
        await page.waitForTimeout(5000);
        
        await page.screenshot({ path: './test-screenshots/SIMPLIFIED_07_result.png' });
        
        // Check for success
        const success = await page.evaluate(() => {
            const alerts = document.querySelectorAll('.MuiAlert-root, [role="alert"]');
            for (let alert of alerts) {
                if (alert.textContent.toLowerCase().includes('success')) {
                    return true;
                }
            }
            return window.location.pathname.includes('/employees');
        });
        
        console.log(success ? '🎉 SUCCESS: Employee created!' : '❌ FAILED: No success indication');
        return success;
        
    } catch (error) {
        console.error('❌ Test error:', error);
        await page.screenshot({ path: './test-screenshots/SIMPLIFIED_ERROR.png' });
        return false;
    } finally {
        await browser.close();
    }
}

// Run test
testSimplifiedEmployeeCreation().then(result => {
    console.log('\n=== SIMPLIFIED FORM TEST RESULT ===');
    console.log(result ? '✅ PASSED' : '❌ FAILED');
    console.log('===================================');
}).catch(console.error);
