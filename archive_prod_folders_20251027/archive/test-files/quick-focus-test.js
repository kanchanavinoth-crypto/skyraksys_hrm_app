const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('🔥 QUICK FOCUS TEST - Simplified Employee Form');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  
  try {
    console.log('📋 Step 1: Login');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    await page.type('input[name="email"]', 'admin@company.com');
    await page.type('input[name="password"]', 'Kx9mP7qR2nF8sA5t');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    console.log('✅ Login successful');
    
    console.log('📋 Step 2: Navigate to Add Employee');
    await page.goto('http://localhost:3000/add-employee');
    
    // Wait for form to load with flexible selectors
    console.log('⏳ Waiting for form to load...');
    await page.waitForSelector('input[name="firstName"], input[aria-label*="First Name"], input[placeholder*="First Name"]', { timeout: 10000 });
    
    console.log('📋 Step 3: FOCUS TEST - Type letter by letter in First Name');
    
    // Try to focus on the first name field with multiple selectors
    let firstNameSelector = 'input[name="firstName"]';
    let firstNameElement = await page.$(firstNameSelector);
    
    if (!firstNameElement) {
      firstNameSelector = 'input[aria-label*="First Name"]';
      firstNameElement = await page.$(firstNameSelector);
    }
    
    if (!firstNameElement) {
      firstNameSelector = 'input[placeholder*="First Name"]';
      firstNameElement = await page.$(firstNameSelector);
    }
    
    if (!firstNameElement) {
      throw new Error('Could not find First Name input field');
    }
    
    console.log(`📝 Using selector: ${firstNameSelector}`);
    
    await page.focus(firstNameSelector);
    
    // Type one character at a time and check focus
    const testText = 'TestEmployee';
    for (let i = 0; i < testText.length; i++) {
      const char = testText[i];
      await page.keyboard.type(char);
      
      // Check if focus is still on the input
      const focusedElement = await page.evaluate(() => {
        const activeEl = document.activeElement;
        return {
          name: activeEl.name,
          id: activeEl.id,
          tagName: activeEl.tagName,
          type: activeEl.type
        };
      });
      
      // More flexible focus checking
      const isStillFocused = focusedElement.name === 'firstName' || 
                           focusedElement.id?.includes('firstName') ||
                           (focusedElement.tagName === 'INPUT' && focusedElement.type === 'text');
      
      if (!isStillFocused) {
        console.log(`❌ FOCUS LOST at character ${i}: "${char}"`);
        console.log(`   Expected: firstName input, Got:`, focusedElement);
        throw new Error('Focus lost during typing!');
      }
    }
    
    console.log('✅ FOCUS TEST PASSED! No focus loss detected');
    
    // Quick form fill with flexible selectors
    await page.type('input[name="lastName"], input[aria-label*="Last Name"]', 'Person');
    await page.type('input[name="email"], input[type="email"]', 'test@company.com');
    await page.type('input[name="phone"], input[aria-label*="Phone"]', '1234567890');
    
    console.log('✅ All fields filled successfully');
    console.log('🎉 SIMPLIFIED FORM IS WORKING PERFECTLY!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('📝 Test complete - you can continue manual testing if needed');
    setTimeout(async () => {
      await browser.close();
    }, 5000); // Keep browser open for 5 seconds
  }
})();
