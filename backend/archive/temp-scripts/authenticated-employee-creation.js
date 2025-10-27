const puppeteer = require('puppeteer');

async function authenticatedEmployeeCreation() {
    console.log('🚀 Authenticated Employee Creation Test');
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 300,
        defaultViewport: { width: 1280, height: 720 }
    });
    
    try {
        const page = await browser.newPage();
        
        // Enable request interception to maintain auth headers
        await page.setRequestInterception(true);
        let authToken = null;
        
        page.on('request', (request) => {
            const headers = { ...request.headers() };
            if (authToken && !headers.authorization) {
                headers.authorization = `Bearer ${authToken}`;
            }
            request.continue({ headers });
        });
        
        // Capture auth token from responses
        page.on('response', async (response) => {
            if (response.url().includes('/api/auth/login') && response.status() === 200) {
                try {
                    const responseData = await response.json();
                    if (responseData.token) {
                        authToken = responseData.token;
                        console.log('🔑 Auth token captured');
                    }
                } catch (e) {
                    // Ignore JSON parsing errors
                }
            }
        });
        
        // Step 1: Login with correct credentials
        console.log('Step 1: Admin login with auth handling...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: './test-screenshots/AUTH_01_login_page.png' });
        
        // Wait for and fill login form
        await page.waitForSelector('#email', { timeout: 10000 });
        await page.type('#email', 'admin@company.com', { delay: 50 });
        
        await page.waitForSelector('#password', { timeout: 5000 });
        await page.type('#password', 'Kx9mP7qR2nF8sA5t', { delay: 50 });
        
        await page.screenshot({ path: './test-screenshots/AUTH_01_credentials.png' });
        
        // Submit login and wait for response
        const [response] = await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
            page.click('button[type="submit"]')
        ]);
        
        await page.screenshot({ path: './test-screenshots/AUTH_01_after_login.png' });
        
        // Verify login was successful
        const currentURL = page.url();
        console.log('Current URL after login:', currentURL);
        
        if (currentURL.includes('/login')) {
            throw new Error('Login failed - still on login page');
        }
        
        console.log('✅ Login successful');
        
        // Step 2: Navigate to add employee with session preservation
        console.log('Step 2: Navigating to add employee with session...');
        
        // Set local storage token if available
        if (authToken) {
            await page.evaluate((token) => {
                localStorage.setItem('authToken', token);
                localStorage.setItem('token', token);
            }, authToken);
        }
        
        await page.goto('http://localhost:3000/add-employee', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        // Check if we got redirected back to login
        const addEmployeeURL = page.url();
        console.log('Add employee URL:', addEmployeeURL);
        
        if (addEmployeeURL.includes('/login')) {
            console.log('⚠️ Got redirected to login, re-authenticating...');
            await page.type('#email', 'admin@company.com');
            await page.type('#password', 'Kx9mP7qR2nF8sA5t');
            await page.click('button[type="submit"]');
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            
            // Try add-employee again
            await page.goto('http://localhost:3000/add-employee', { waitUntil: 'networkidle2' });
        }
        
        await page.screenshot({ path: './test-screenshots/AUTH_02_add_employee_form.png' });
        
        // Step 3: Fill employee form quickly
        console.log('Step 3: Filling employee form...');
        
        // Wait for the form to load
        await page.waitForSelector('input[name="firstName"]', { timeout: 10000 });
        
        // Fill personal information
        await page.type('input[name="firstName"]', 'Automated', { delay: 20 });
        await page.type('input[name="lastName"]', 'TestUser', { delay: 20 });
        await page.type('input[name="email"]', `auto.test${Date.now()}@company.com`, { delay: 20 });
        await page.type('input[name="phone"]', '9876543210', { delay: 20 });
        
        await page.screenshot({ path: './test-screenshots/AUTH_03_personal_filled.png' });
        
        // Click Next button
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(btn => btn.textContent?.includes('Next'));
            if (nextBtn) nextBtn.click();
        });
        
        await page.waitForTimeout(1500);
        
        // Fill employment details
        console.log('Step 4: Employment details...');
        await page.waitForSelector('input[name="employeeId"]', { timeout: 5000 });
        
        const empId = 'AUTO' + Date.now().toString().slice(-6);
        await page.type('input[name="employeeId"]', empId, { delay: 20 });
        await page.type('input[name="hireDate"]', '2024-08-09', { delay: 20 });
        
        // Select department - try multiple approaches
        try {
            await page.click('div[id*="department"]', { delay: 100 });
            await page.waitForTimeout(500);
            await page.click('li[data-value="Engineering"]');
        } catch (e) {
            console.log('Department selection fallback...');
            await page.evaluate(() => {
                const selects = document.querySelectorAll('select, [role="combobox"]');
                for (let select of selects) {
                    if (select.name?.includes('department') || select.id?.includes('department')) {
                        select.value = 'Engineering';
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            });
        }
        
        // Select position
        try {
            await page.click('div[id*="position"]', { delay: 100 });
            await page.waitForTimeout(500);
            await page.click('li[data-value="Software Engineer"]');
        } catch (e) {
            console.log('Position selection fallback...');
        }
        
        await page.screenshot({ path: './test-screenshots/AUTH_04_employment_filled.png' });
        
        // Continue through remaining steps quickly
        for (let step = 0; step < 3; step++) {
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const nextBtn = buttons.find(btn => btn.textContent?.includes('Next'));
                if (nextBtn) nextBtn.click();
            });
            await page.waitForTimeout(800);
            
            // Fill required fields for compensation step
            if (step === 1) {
                try {
                    await page.waitForSelector('input[name="salary"]', { timeout: 3000 });
                    await page.type('input[name="salary"]', '75000', { delay: 20 });
                    await page.type('input[name="emergencyContactName"]', 'Test Contact', { delay: 20 });
                    await page.type('input[name="emergencyContactPhone"]', '9876543211', { delay: 20 });
                } catch (e) {
                    console.log('Compensation fields not found, continuing...');
                }
            }
        }
        
        // Submit the form
        console.log('Step 5: Submitting employee form...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const submitBtn = buttons.find(btn => 
                btn.textContent?.toLowerCase().includes('submit') ||
                btn.textContent?.toLowerCase().includes('save') ||
                btn.textContent?.toLowerCase().includes('add employee')
            );
            console.log('Submit button text:', submitBtn?.textContent);
            if (submitBtn) submitBtn.click();
        });
        
        // Wait for response
        await page.waitForTimeout(4000);
        await page.screenshot({ path: './test-screenshots/AUTH_05_submission_result.png' });
        
        // Check for success/error
        const result = await page.evaluate(() => {
            // Check for success messages
            const successSelectors = [
                '.MuiAlert-root',
                '[role="alert"]',
                '.alert',
                '.success-message',
                '.notification'
            ];
            
            for (let selector of successSelectors) {
                const elements = document.querySelectorAll(selector);
                for (let el of elements) {
                    const text = el.textContent?.toLowerCase() || '';
                    if (text.includes('success') || text.includes('created') || text.includes('added')) {
                        return { success: true, message: el.textContent };
                    }
                    if (text.includes('error') || text.includes('failed')) {
                        return { success: false, message: el.textContent };
                    }
                }
            }
            
            // Check URL change
            if (window.location.pathname.includes('/employees')) {
                return { success: true, message: 'Redirected to employees list' };
            }
            
            // Check if form is still visible (might indicate validation errors)
            const form = document.querySelector('form');
            if (form && form.offsetHeight > 0) {
                return { success: false, message: 'Form still visible - possible validation error' };
            }
            
            return { success: null, message: 'No clear indication of result' };
        });
        
        console.log('\n=== FINAL RESULT ===');
        console.log('Employee ID used:', empId);
        console.log('Result:', result);
        console.log('Final URL:', page.url());
        
        if (result.success === true) {
            console.log('🎉 SUCCESS: Employee created successfully!');
            return true;
        } else if (result.success === false) {
            console.log('❌ FAILED: Employee creation failed');
            console.log('Error details:', result.message);
            return false;
        } else {
            console.log('⚠️ UNCLEAR: Result uncertain');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Test Error:', error.message);
        const page = browser.pages()[0];
        if (page) {
            await page.screenshot({ path: './test-screenshots/AUTH_ERROR.png' });
        }
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
authenticatedEmployeeCreation().then(result => {
    if (result === true) {
        console.log('\n✅ EMPLOYEE CREATION: SUCCESS');
        
        // Update main automation file with working approach
        console.log('📝 Ready to update main test automation with this working flow');
    } else {
        console.log('\n❌ EMPLOYEE CREATION: FAILED');
        console.log('Need to investigate further or adjust approach');
    }
}).catch(console.error);
