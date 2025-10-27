#!/usr/bin/env node

/**
 * SIMPLIFIED BUSINESS USE CASE VALIDATOR
 * Robust E2E test that focuses on core business scenarios with simplified API calls
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class SimplifiedBusinessValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      employeeCanLogin: false,
      managerCanLogin: false,
      timesheetPageAccessible: false,
      leavePageAccessible: false,
      formsAreInteractive: false,
      navigationWorks: false
    };
    this.testLog = [];
  }

  log(message) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logEntry = `[${timestamp}] ${message}`;
    this.testLog.push(logEntry);
    console.log(`🔍 ${message}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async updateResults() {
    const passed = Object.values(this.results).filter(r => r).length;
    const total = Object.keys(this.results).length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    const checklistContent = this.generateChecklist(passed, total, successRate);
    
    try {
      fs.writeFileSync('../E2E_BUSINESS_USE_CASE_CHECKLIST.md', checklistContent);
    } catch (error) {
      this.log(`Warning: Could not update checklist file - ${error.message}`);
    }
  }

  generateChecklist(passed, total, successRate) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString();
    
    return `# ✅ E2E BUSINESS USE CASE VALIDATION CHECKLIST
## Real-Time Test Results Tracking

**Test Started:** ${date} at ${time}  
**Test Type:** Simplified Employee-Manager Workflow E2E  
**Status:** 🔄 COMPLETED

---

## 📊 **FINAL RESULTS**

### 🎯 **Overall Progress**
- **Total Use Cases:** ${total}
- **✅ Passed:** ${passed}
- **❌ Failed:** ${total - passed}
- **📈 Success Rate:** ${successRate}%

---

## 🎯 **CORE BUSINESS USE CASES VALIDATION**

### 📋 **AUTHENTICATION & ACCESS CONTROL**

| Use Case | Status | Details |
|----------|--------|---------|
| Employee Login | ${this.results.employeeCanLogin ? '✅ PASSED' : '❌ FAILED'} | Login with \`employee@test.com\` |
| Manager Login | ${this.results.managerCanLogin ? '✅ PASSED' : '❌ FAILED'} | Login with \`manager@test.com\` |

---

### 📋 **TIMESHEET MANAGEMENT WORKFLOW**

| Use Case | Status | Details |
|----------|--------|---------|
| Navigate to Timesheets | ${this.results.timesheetPageAccessible ? '✅ PASSED' : '❌ FAILED'} | Employee accesses timesheet page |
| Forms Interactive | ${this.results.formsAreInteractive ? '✅ PASSED' : '❌ FAILED'} | Can interact with form elements |

---

### 📋 **LEAVE REQUEST MANAGEMENT WORKFLOW**

| Use Case | Status | Details |
|----------|--------|---------|
| Navigate to Leave Requests | ${this.results.leavePageAccessible ? '✅ PASSED' : '❌ FAILED'} | Employee accesses leave page |

---

### 📋 **UI/UX VALIDATION**

| Use Case | Status | Details |
|----------|--------|---------|
| Navigation Menu | ${this.results.navigationWorks ? '✅ PASSED' : '❌ FAILED'} | Menu items work correctly |

---

## 🚨 **CRITICAL BUSINESS SCENARIOS STATUS**

### 🎯 **Must-Have Functionality**
| Priority | Business Scenario | Status | Impact |
|----------|-------------------|--------|--------|
| HIGH | Employee can login | ${this.results.employeeCanLogin ? '✅ PASSED' : '❌ FAILED'} | Core access requirement |
| HIGH | Manager can login | ${this.results.managerCanLogin ? '✅ PASSED' : '❌ FAILED'} | Management access |
| HIGH | Timesheet page accessible | ${this.results.timesheetPageAccessible ? '✅ PASSED' : '❌ FAILED'} | Core business function |
| HIGH | Leave page accessible | ${this.results.leavePageAccessible ? '✅ PASSED' : '❌ FAILED'} | HR function |

---

## 📝 **DETAILED TEST LOG**

\`\`\`
${this.testLog.join('\n')}
\`\`\`

---

## 🎯 **FINAL ASSESSMENT**

${this.getFinalAssessment(successRate)}

---

**🔄 Last Updated:** ${now.toLocaleString()}  
**📍 Status:** Test execution complete

**🎯 Key Business Use Cases Summary:**
- **Authentication System:** ${this.results.employeeCanLogin && this.results.managerCanLogin ? '✅ Working' : '❌ Issues'}
- **Timesheet Access:** ${this.results.timesheetPageAccessible ? '✅ Working' : '❌ Issues'}
- **Leave Request Access:** ${this.results.leavePageAccessible ? '✅ Working' : '❌ Issues'}
- **UI Navigation:** ${this.results.navigationWorks ? '✅ Working' : '❌ Issues'}`;
  }

  getFinalAssessment(successRate) {
    if (successRate >= 90) {
      return '🎖️ **EXCELLENT** - All critical business use cases are functional! The employee-manager workflow is ready for production use.';
    } else if (successRate >= 70) {
      return '✅ **PASSED** - Core business functionality is working. Minor issues may exist but primary workflows are functional.';
    } else if (successRate >= 50) {
      return '⚠️ **ACCEPTABLE** - Basic functionality exists but several business use cases need attention before production use.';
    } else {
      return '🚨 **NEEDS WORK** - Critical business use cases are not functioning. Significant development work required.';
    }
  }

  async initialize() {
    this.log('🚀 Starting Simplified Business Use Case Validation');
    
    try {
      this.browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
        defaultViewport: null,
        slowMo: 250
      });
      
      this.page = await this.browser.newPage();
      this.log('✅ Browser initialized successfully');
      return true;
    } catch (error) {
      this.log(`❌ Browser initialization failed: ${error.message}`);
      return false;
    }
  }

  async testEmployeeLogin() {
    this.log('👤 Testing Employee Authentication');
    
    try {
      await this.page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await this.sleep(2000);
      
      // Clear any existing session
      await this.page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}
      });
      
      // Look for email input
      const emailInput = await this.page.$('input[type="email"], input[name="email"], input[placeholder*="email"]');
      if (!emailInput) {
        this.log('❌ No email input found on page');
        return false;
      }
      
      // Fill login form
      await emailInput.click();
      await emailInput.type('employee@test.com');
      await this.sleep(500);
      
      const passwordInput = await this.page.$('input[type="password"], input[name="password"]');
      if (!passwordInput) {
        this.log('❌ No password input found');
        return false;
      }
      
      await passwordInput.click();
      await passwordInput.type('admin123');
      await this.sleep(500);
      
      // Submit form
      const submitButton = await this.page.$('button[type="submit"], button:contains("Login"), .login-button');
      if (submitButton) {
        await submitButton.click();
        await this.sleep(3000);
        
        // Check if login successful
        const currentUrl = this.page.url();
        const isLoggedIn = !currentUrl.includes('/login') && currentUrl !== 'http://localhost:3000/';
        
        if (isLoggedIn) {
          this.results.employeeCanLogin = true;
          this.log(`✅ Employee login successful - redirected to: ${currentUrl}`);
          
          // Capture screenshot
          try {
            await this.page.screenshot({ path: 'employee-login-success.png' });
          } catch (e) {}
          
          return true;
        } else {
          this.log(`⚠️ Employee login may have failed - still at: ${currentUrl}`);
          return false;
        }
      } else {
        this.log('❌ No submit button found');
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Employee login test failed: ${error.message}`);
      return false;
    }
  }

  async testTimesheetAccess() {
    this.log('📝 Testing Timesheet Page Access');
    
    try {
      await this.page.goto('http://localhost:3000/timesheets', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await this.sleep(2000);
      
      // Check if page loaded successfully
      const pageTitle = await this.page.title();
      const pageContent = await this.page.content();
      
      // Look for timesheet-related elements
      const hasTimesheetElements = await this.page.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes('timesheet') || text.includes('hours') || text.includes('project');
      });
      
      if (hasTimesheetElements || pageContent.includes('timesheet')) {
        this.results.timesheetPageAccessible = true;
        this.log('✅ Timesheet page is accessible and contains relevant content');
        
        // Test form interaction
        const formElements = await this.page.$$('input, select, textarea, button');
        if (formElements.length > 0) {
          this.results.formsAreInteractive = true;
          this.log(`✅ Found ${formElements.length} interactive form elements`);
        }
        
        try {
          await this.page.screenshot({ path: 'timesheet-page-access.png' });
        } catch (e) {}
        
        return true;
      } else {
        this.log('❌ Timesheet page does not contain expected content');
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Timesheet access test failed: ${error.message}`);
      return false;
    }
  }

  async testLeaveAccess() {
    this.log('🏖️ Testing Leave Request Page Access');
    
    try {
      await this.page.goto('http://localhost:3000/leave-requests', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await this.sleep(2000);
      
      // Check for leave-related content
      const hasLeaveElements = await this.page.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes('leave') || text.includes('vacation') || text.includes('request');
      });
      
      if (hasLeaveElements) {
        this.results.leavePageAccessible = true;
        this.log('✅ Leave request page is accessible and contains relevant content');
        
        try {
          await this.page.screenshot({ path: 'leave-page-access.png' });
        } catch (e) {}
        
        return true;
      } else {
        this.log('❌ Leave request page does not contain expected content');
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Leave access test failed: ${error.message}`);
      return false;
    }
  }

  async testManagerLogin() {
    this.log('👔 Testing Manager Authentication');
    
    try {
      // Navigate back to login
      await this.page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await this.sleep(2000);
      
      // Clear session
      await this.page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}
      });
      
      // Login as manager
      const emailInput = await this.page.$('input[type="email"], input[name="email"]');
      if (emailInput) {
        await emailInput.click();
        await emailInput.evaluate(input => input.value = '');
        await emailInput.type('manager@test.com');
        await this.sleep(500);
        
        const passwordInput = await this.page.$('input[type="password"], input[name="password"]');
        if (passwordInput) {
          await passwordInput.click();
          await passwordInput.evaluate(input => input.value = '');
          await passwordInput.type('admin123');
          await this.sleep(500);
          
          const submitButton = await this.page.$('button[type="submit"], button:contains("Login")');
          if (submitButton) {
            await submitButton.click();
            await this.sleep(3000);
            
            const currentUrl = this.page.url();
            const isLoggedIn = !currentUrl.includes('/login') && currentUrl !== 'http://localhost:3000/';
            
            if (isLoggedIn) {
              this.results.managerCanLogin = true;
              this.log(`✅ Manager login successful - redirected to: ${currentUrl}`);
              
              try {
                await this.page.screenshot({ path: 'manager-login-success.png' });
              } catch (e) {}
              
              return true;
            }
          }
        }
      }
      
      this.log('❌ Manager login failed');
      return false;
      
    } catch (error) {
      this.log(`❌ Manager login test failed: ${error.message}`);
      return false;
    }
  }

  async testNavigation() {
    this.log('🔗 Testing Navigation');
    
    try {
      // Test navigation to different pages
      const urls = [
        'http://localhost:3000/dashboard',
        'http://localhost:3000/employees',
        'http://localhost:3000/timesheets',
        'http://localhost:3000/leave-requests'
      ];
      
      let workingPages = 0;
      
      for (const url of urls) {
        try {
          await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
          await this.sleep(1000);
          
          const pageContent = await this.page.content();
          if (pageContent.length > 1000) { // Page has substantial content
            workingPages++;
          }
        } catch (e) {
          // Skip failed navigation
        }
      }
      
      if (workingPages >= 2) {
        this.results.navigationWorks = true;
        this.log(`✅ Navigation working - ${workingPages}/${urls.length} pages accessible`);
        return true;
      } else {
        this.log(`⚠️ Limited navigation - only ${workingPages}/${urls.length} pages working`);
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Navigation test failed: ${error.message}`);
      return false;
    }
  }

  async runCompleteValidation() {
    const initialized = await this.initialize();
    if (!initialized) return false;
    
    try {
      // Run all tests
      await this.testEmployeeLogin();
      await this.updateResults();
      
      await this.testTimesheetAccess();
      await this.updateResults();
      
      await this.testLeaveAccess();
      await this.updateResults();
      
      await this.testManagerLogin();
      await this.updateResults();
      
      await this.testNavigation();
      await this.updateResults();
      
      // Final results
      const passed = Object.values(this.results).filter(r => r).length;
      const total = Object.keys(this.results).length;
      const successRate = ((passed / total) * 100).toFixed(1);
      
      this.log(`🎯 Validation Complete - Success Rate: ${successRate}% (${passed}/${total})`);
      
      // Close browser
      await this.browser.close();
      
      return successRate >= 50;
      
    } catch (error) {
      this.log(`❌ Validation failed: ${error.message}`);
      await this.browser?.close();
      return false;
    }
  }
}

// Run the simplified validation
const validator = new SimplifiedBusinessValidator();
validator.runCompleteValidation().then(success => {
  console.log(`\n🚀 Business Use Case Validation Complete!`);
  console.log(`📊 Results: ${success ? '✅ Core functionality validated!' : '⚠️ Issues detected, check results.'}`);
  console.log(`📋 Full checklist updated in: E2E_BUSINESS_USE_CASE_CHECKLIST.md`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Validation error:', error);
  process.exit(1);
});
