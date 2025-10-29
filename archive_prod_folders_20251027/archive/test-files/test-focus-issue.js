const puppeteer = require('puppeteer');

async function testFocusIssue() {
    console.log('🔍 Testing Focus Issue in Employee Form');
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        defaultViewport: { width: 1280, height: 720 }
    });
    
    try {
        const page = await browser.newPage();
        
        // Login
        console.log('Step 1: Logging in...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
        await page.type('#email', 'admin@company.com');
        await page.type('#password', 'Kx9mP7qR2nF8sA5t');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // Go to add employee
        console.log('Step 2: Navigating to add employee...');
        await page.goto('http://localhost:3000/add-employee', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        // Test typing in first name field
        console.log('Step 3: Testing typing in First Name field...');
        const firstNameSelector = 'input[name="firstName"]';
        await page.waitForSelector(firstNameSelector);
        await page.focus(firstNameSelector);
        
        // Type slowly and check if focus is maintained
        const testText = 'TestEmployeeName';
        for (let i = 0; i < testText.length; i++) {
            await page.type(firstNameSelector, testText[i]);
            await page.waitForTimeout(200);
            
            // Check if focus is still on the field
            const isFocused = await page.evaluate((selector) => {
                return document.activeElement === document.querySelector(selector);
            }, firstNameSelector);
            
            if (!isFocused) {
                console.log(`❌ Focus lost at character ${i + 1} (${testText[i]})`);
                await page.screenshot({ path: './test-screenshots/FOCUS_LOST.png' });
                return false;
            }
        }
        
        console.log('✅ Focus maintained throughout typing!');
        await page.screenshot({ path: './test-screenshots/FOCUS_SUCCESS.png' });
        return true;
        
    } catch (error) {
        console.error('❌ Error testing focus:', error);
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testFocusIssue().then(result => {
    console.log('Focus test result:', result ? '✅ PASSED' : '❌ FAILED');
}).catch(console.error);
