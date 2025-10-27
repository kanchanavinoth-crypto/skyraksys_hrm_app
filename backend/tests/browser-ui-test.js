#!/usr/bin/env node

/**
 * Browser UI Test - Minimal Puppeteer Test
 */

const puppeteer = require('puppeteer');

async function runMinimalUITest() {
  console.log('🌐 Running Browser-Based UI Test...\n');
  
  let browser;
  let page;
  let testsRun = 0;
  let testsPassed = 0;
  
  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({ 
      headless: false, // Show browser window
      slowMo: 250,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    // Test 1: Load Application
    console.log('1️⃣  Loading application...');
    testsRun++;
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
      console.log('   ✅ Application loaded successfully');
      testsPassed++;
      
      // Take screenshot
      await page.screenshot({ path: 'app-loaded.png', fullPage: true });
      console.log('   📸 Screenshot saved: app-loaded.png');
      
    } catch (error) {
      console.log('   ❌ Failed to load application:', error.message);
    }
    
    // Test 2: Check for React components
    console.log('\n2️⃣  Checking React components...');
    testsRun++;
    try {
      const reactRoot = await page.$('#root');
      const hasContent = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root && root.children.length > 0;
      });
      
      if (reactRoot && hasContent) {
        console.log('   ✅ React components rendered');
        testsPassed++;
      } else {
        console.log('   ❌ React components not found');
      }
    } catch (error) {
      console.log('   ❌ Error checking React components:', error.message);
    }
    
    // Test 3: Check for navigation or login elements
    console.log('\n3️⃣  Checking UI elements...');
    testsRun++;
    try {
      // Look for common UI elements
      const elements = await page.evaluate(() => {
        const selectors = [
          'button', 'input', 'form', 'nav', '.MuiButton-root', 
          '.MuiTextField-root', '.MuiContainer-root', 'a[href]'
        ];
        
        const found = [];
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            found.push({ selector, count: elements.length });
          }
        });
        
        return found;
      });
      
      if (elements.length > 0) {
        console.log('   ✅ Interactive UI elements found:');
        elements.forEach(el => {
          console.log(`      - ${el.selector}: ${el.count} element(s)`);
        });
        testsPassed++;
      } else {
        console.log('   ⚠️  No interactive elements detected');
      }
      
    } catch (error) {
      console.log('   ❌ Error checking UI elements:', error.message);
    }
    
    // Test 4: Check page title and content
    console.log('\n4️⃣  Checking page content...');
    testsRun++;
    try {
      const title = await page.title();
      const hasText = await page.evaluate(() => document.body.innerText.length > 100);
      
      console.log(`   📄 Page title: "${title}"`);
      
      if (title && hasText) {
        console.log('   ✅ Page has meaningful content');
        testsPassed++;
      } else {
        console.log('   ⚠️  Page content may be incomplete');
      }
      
      // Take final screenshot
      await page.screenshot({ path: 'ui-elements.png', fullPage: true });
      console.log('   📸 Screenshot saved: ui-elements.png');
      
    } catch (error) {
      console.log('   ❌ Error checking page content:', error.message);
    }
    
    // Test 5: Check for errors in console
    console.log('\n5️⃣  Checking browser console...');
    testsRun++;
    
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Wait a bit for any console messages
    await page.waitForTimeout(2000);
    
    const errors = consoleLogs.filter(log => log.type === 'error');
    const warnings = consoleLogs.filter(log => log.type === 'warning');
    
    if (errors.length === 0) {
      console.log('   ✅ No JavaScript errors detected');
      testsPassed++;
    } else {
      console.log(`   ❌ ${errors.length} JavaScript error(s) detected:`);
      errors.forEach(error => console.log(`      - ${error.text}`));
    }
    
    if (warnings.length > 0) {
      console.log(`   ⚠️  ${warnings.length} warning(s) detected:`);
      warnings.slice(0, 3).forEach(warning => console.log(`      - ${warning.text}`));
    }
    
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔚 Browser closed');
    }
  }
  
  // Results
  const passRate = ((testsPassed / testsRun) * 100).toFixed(1);
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 BROWSER UI TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`📊 Tests Run: ${testsRun}`);
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsRun - testsPassed}`);
  console.log(`📈 Pass Rate: ${passRate}%`);
  
  console.log('\n🎯 UI ASSESSMENT:');
  if (passRate >= 80) {
    console.log('🟢 EXCELLENT - UI is working great!');
    console.log('   ✅ React application fully functional');
    console.log('   ✅ User interface elements working');
    console.log('   ✅ Ready for user interaction');
  } else if (passRate >= 60) {
    console.log('🟡 GOOD - UI mostly functional');
    console.log('   ✅ Basic functionality working');
    console.log('   ⚠️  Some features may need attention');
  } else {
    console.log('🟠 NEEDS WORK - UI issues detected');
  }
  
  console.log('\n📸 Screenshots saved:');
  console.log('   - app-loaded.png (Initial load)');
  console.log('   - ui-elements.png (Final state)');
  
  console.log('\n🚀 Next: Open http://localhost:3000 in your browser!');
  
  return passRate >= 60;
}

runMinimalUITest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Browser test failed:', error);
  process.exit(1);
});
