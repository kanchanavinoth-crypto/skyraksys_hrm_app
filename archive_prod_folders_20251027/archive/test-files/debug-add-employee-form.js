const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 **DEBUG: Add Employee Form Loading Test**');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  
  try {
    console.log('📋 Step 1: Login');
    await page.goto('http://localhost:3000/login');
    
    // Check if login form loads
    const loginFormExists = await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    console.log('✅ Login form loaded');
    
    await page.type('input[name="email"], input[type="email"]', 'admin@company.com');
    await page.type('input[name="password"], input[type="password"]', 'Kx9mP7qR2nF8sA5t');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    console.log('✅ Login successful');
    
    console.log('📋 Step 2: Navigate to Add Employee');
    await page.goto('http://localhost:3000/add-employee');
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    console.log('🔍 Debug: Checking what\'s on the page...');
    
    // Get the page title and URL
    const pageTitle = await page.title();
    const currentUrl = await page.url();
    console.log(`📄 Page Title: ${pageTitle}`);
    console.log(`🌐 Current URL: ${currentUrl}`);
    
    // Check for any form elements
    const formElements = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        ariaLabel: input.getAttribute('aria-label')
      }));
      
      const selects = Array.from(document.querySelectorAll('select')).map(select => ({
        name: select.name,
        id: select.id
      }));
      
      const textareas = Array.from(document.querySelectorAll('textarea')).map(textarea => ({
        name: textarea.name,
        id: textarea.id
      }));
      
      return { inputs, selects, textareas };
    });
    
    console.log('📝 Found Form Elements:');
    console.log('  Inputs:', formElements.inputs.length);
    formElements.inputs.forEach((input, i) => {
      console.log(`    ${i+1}. ${input.type} - name:"${input.name}" id:"${input.id}" placeholder:"${input.placeholder}"`);
    });
    
    console.log('  Selects:', formElements.selects.length);
    formElements.selects.forEach((select, i) => {
      console.log(`    ${i+1}. name:"${select.name}" id:"${select.id}"`);
    });
    
    console.log('  Textareas:', formElements.textareas.length);
    
    // Check for any error messages or loading states
    const errorMessages = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('.error, .alert, .warning, [class*="error"], [class*="alert"]'))
        .map(el => el.textContent);
      return errors;
    });
    
    if (errorMessages.length > 0) {
      console.log('⚠️  Found error messages:', errorMessages);
    }
    
    // Check for loading indicators
    const loadingIndicators = await page.evaluate(() => {
      const loading = Array.from(document.querySelectorAll('[class*="loading"], [class*="spinner"], .loading, .spinner'))
        .map(el => el.textContent || el.className);
      return loading;
    });
    
    if (loadingIndicators.length > 0) {
      console.log('⏳ Found loading indicators:', loadingIndicators);
    }
    
    // Try to find any text that might indicate the form type
    const headings = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => h.textContent);
    });
    
    console.log('📋 Page headings:', headings);
    
    // Check if we can find the first name field with various selectors
    const firstNameSelectors = [
      'input[name="firstName"]',
      'input[aria-label*="First Name"]',
      'input[placeholder*="First Name"]',
      'input[placeholder*="first name"]',
      'input[id*="firstName"]',
      'input[id*="first-name"]'
    ];
    
    console.log('🔍 Testing First Name field selectors:');
    for (const selector of firstNameSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✅ Found with selector: ${selector}`);
          break;
        } else {
          console.log(`❌ Not found with selector: ${selector}`);
        }
      } catch (err) {
        console.log(`❌ Error with selector ${selector}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  } finally {
    console.log('📝 Debug test complete - keeping browser open for inspection');
    setTimeout(async () => {
      await browser.close();
    }, 10000); // Keep open for 10 seconds
  }
})();
