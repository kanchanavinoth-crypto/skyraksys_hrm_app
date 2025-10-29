# E2E Testing Guide with Playwright

## Overview
This guide explains how to run, write, and maintain end-to-end (E2E) tests for the SkyRakSys HRM application using Playwright.

## Table of Contents
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Page Object Model](#page-object-model)
- [Test Organization](#test-organization)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## Setup

### Prerequisites
- Node.js 18+ installed
- Backend server running on `http://localhost:5000`
- Frontend server running on `http://localhost:3000`
- PostgreSQL database with seed data

### Installation

```bash
cd frontend/e2e
npm install
```

### Install Playwright Browsers

```bash
# Using npm
npm run install:browsers

# Or using npx directly
npx playwright install

# Or using node (if npx blocked by PowerShell policy)
node node_modules\.bin\playwright install
```

**Browsers Installed:**
- Chromium (for Chrome/Edge testing)
- Firefox
- WebKit (for Safari testing)

### Environment Configuration

Create `.env` file in `frontend/e2e/`:

```bash
# Test environment configuration
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:5000/api

# Test credentials
TEST_ADMIN_EMAIL=admin@company.com
TEST_ADMIN_PASSWORD=password123
TEST_EMPLOYEE_EMAIL=employee@company.com
TEST_EMPLOYEE_PASSWORD=password123
TEST_MANAGER_EMAIL=manager@company.com
TEST_MANAGER_PASSWORD=password123

# Test timeouts (milliseconds)
DEFAULT_TIMEOUT=30000
NAVIGATION_TIMEOUT=30000

# Test options
HEADLESS=true
SLOWMO=0
TRACE=on-first-retry
```

## Running Tests

### Basic Commands

```bash
cd frontend/e2e

# Run all tests (headless)
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in debug mode (step through)
npm run test:debug
```

### Browser-Specific Tests

```bash
# Chromium only
npm run test:chrome

# Firefox only
npm run test:firefox

# WebKit only
npm run test:webkit

# All browsers
npm run test:all
```

### Test Category Selection

```bash
# Smoke tests only (critical paths)
npm run test:smoke

# Regression tests only (comprehensive)
npm run test:regression

# Feature-specific tests
npm run test:auth
npm run test:employee
npm run test:timesheet
npm run test:payroll
npm run test:leave
```

### Advanced Options

```bash
# Run specific test file
npx playwright test tests/auth/login.spec.js

# Run tests matching pattern
npx playwright test --grep "should login"

# Run tests excluding pattern
npx playwright test --grep-invert "slow"

# Run with retries
npx playwright test --retries=3

# Run with specific number of workers
npx playwright test --workers=4

# Generate HTML report
npx playwright test --reporter=html

# Generate JUnit XML report (for CI)
npx playwright test --reporter=junit
```

## Writing Tests

### Test Structure

```javascript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Feature Name @smoke', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    // Setup before each test
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigateTo();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
    await page.close();
  });

  test('should do something @regression', async ({ page }) => {
    // Arrange
    const credentials = {
      email: 'admin@company.com',
      password: 'password123'
    };

    // Act
    await loginPage.login(credentials.email, credentials.password);

    // Assert
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });
});
```

### Test Tags

Use tags to categorize tests:
- `@smoke` - Critical functionality, run on every commit
- `@regression` - Comprehensive tests, run before releases
- `@slow` - Long-running tests
- `@skip` - Temporarily disabled tests

```javascript
test('critical path @smoke', async ({ page }) => {
  // Test code
});

test('edge case @regression', async ({ page }) => {
  // Test code
});

test.skip('known issue @skip', async ({ page }) => {
  // Skipped test
});
```

### Assertions

```javascript
// Page assertions
await expect(page).toHaveURL('http://localhost:3000/dashboard');
await expect(page).toHaveTitle(/SkyRakSys HRM/);

// Element assertions
await expect(page.locator('#username')).toBeVisible();
await expect(page.locator('#username')).toBeEnabled();
await expect(page.locator('#username')).toHaveValue('John Doe');
await expect(page.locator('h1')).toHaveText('Dashboard');
await expect(page.locator('button')).toHaveClass(/btn-primary/);
await expect(page.locator('input')).toBeFocused();

// Count assertions
await expect(page.locator('.employee-row')).toHaveCount(10);

// Attribute assertions
await expect(page.locator('a')).toHaveAttribute('href', '/profile');

// Custom timeout
await expect(page.locator('.loading')).toBeHidden({ timeout: 10000 });
```

### Waiting Strategies

```javascript
// Wait for element
await page.waitForSelector('#employee-table');

// Wait for navigation
await page.waitForURL('**/dashboard');

// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for DOM content loaded
await page.waitForLoadState('domcontentloaded');

// Wait for custom condition
await page.waitForFunction(() => {
  return document.querySelectorAll('.employee-row').length > 0;
});

// Wait for timeout (avoid if possible)
await page.waitForTimeout(1000);
```

## Page Object Model

### Structure

```
frontend/e2e/
├── pages/
│   ├── BasePage.js          # Base class with common methods
│   ├── LoginPage.js         # Login page actions
│   ├── DashboardPage.js     # Dashboard page actions
│   ├── EmployeeListPage.js  # Employee list actions
│   └── LeaveManagementPage.js # Leave management actions
├── tests/
│   ├── auth/
│   │   └── login.spec.js
│   ├── employee/
│   │   └── employee-list.spec.js
│   └── leave/
│       └── leave-management.spec.js
└── playwright.config.js
```

### Base Page

**File:** `pages/BasePage.js`

```javascript
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async navigateTo(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async click(selector) {
    await this.page.click(selector);
  }

  async fill(selector, value) {
    await this.page.fill(selector, value);
  }

  async waitForElement(selector, options = {}) {
    await this.page.waitForSelector(selector, { 
      state: 'visible',
      ...options 
    });
  }

  async getText(selector) {
    return await this.page.textContent(selector);
  }

  async isVisible(selector) {
    return await this.page.isVisible(selector);
  }
}
```

### Feature Page

**File:** `pages/LeaveManagementPage.js`

```javascript
import { BasePage } from './BasePage';

export class LeaveManagementPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.leaveTypeSelect = '#leaveTypeId';
    this.startDateInput = '#startDate';
    this.endDateInput = '#endDate';
    this.reasonTextarea = '#reason';
    this.submitButton = 'button[type="submit"]';
    this.leaveRequestRow = '.leave-request-row';
    this.statusFilter = '#status-filter';
  }

  async navigateTo() {
    await super.navigateTo('/leave/request');
  }

  async fillLeaveRequestForm(data) {
    await this.page.selectOption(this.leaveTypeSelect, data.leaveType);
    await this.page.fill(this.startDateInput, data.startDate);
    await this.page.fill(this.endDateInput, data.endDate);
    await this.page.fill(this.reasonTextarea, data.reason);
  }

  async submitLeaveRequest() {
    await this.page.click(this.submitButton);
    await this.page.waitForLoadState('networkidle');
  }

  async filterLeavesByStatus(status) {
    await this.page.selectOption(this.statusFilter, status);
    await this.page.waitForTimeout(500); // Wait for filter to apply
  }

  async getLeaveRequestCount() {
    return await this.page.locator(this.leaveRequestRow).count();
  }

  async approveLeaveRequest(index) {
    const approveButton = this.page.locator('.approve-btn').nth(index);
    await approveButton.click();
    await this.page.waitForSelector('.success-message');
  }
}
```

### Using Page Objects in Tests

```javascript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LeaveManagementPage } from '../pages/LeaveManagementPage';

test.describe('Leave Management @smoke', () => {
  let loginPage;
  let leavePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    leavePage = new LeaveManagementPage(page);
    
    // Login before each test
    await loginPage.navigateTo();
    await loginPage.login('admin@company.com', 'password123');
  });

  test('should submit leave request', async () => {
    await leavePage.navigateTo();
    
    await leavePage.fillLeaveRequestForm({
      leaveType: 'Annual Leave',
      startDate: '2025-02-01',
      endDate: '2025-02-05',
      reason: 'Family vacation'
    });
    
    await leavePage.submitLeaveRequest();
    
    // Verify success message
    await expect(leavePage.page.locator('.success-message')).toBeVisible();
  });
});
```

## Test Organization

### Directory Structure

```
frontend/e2e/
├── .auth/                    # Stored authentication states
│   ├── admin.json
│   ├── employee.json
│   └── manager.json
├── fixtures/                 # Test data
│   ├── employees.json
│   ├── leave-requests.json
│   └── timesheets.json
├── pages/                    # Page Object Models
│   ├── BasePage.js
│   ├── LoginPage.js
│   └── ...
├── tests/                    # Test specifications
│   ├── auth/
│   │   ├── login.spec.js
│   │   └── registration.spec.js
│   ├── employee/
│   │   ├── employee-list.spec.js
│   │   └── employee-profile.spec.js
│   ├── leave/
│   │   └── leave-management.spec.js
│   ├── timesheet/
│   │   └── timesheet-entry.spec.js
│   └── payroll/
│       └── payslip.spec.js
├── utils/                    # Utility functions
│   ├── test-helpers.js
│   └── data-generators.js
├── .env                      # Environment configuration
├── playwright.config.js      # Playwright configuration
└── package.json
```

### Authentication State Reuse

Save authentication state to avoid logging in for every test:

```javascript
// global-setup.js
import { chromium } from '@playwright/test';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Login as admin
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'admin@company.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  // Save auth state
  await page.context().storageState({ path: '.auth/admin.json' });
  
  await browser.close();
}

export default globalSetup;
```

Use saved auth state in tests:

```javascript
// playwright.config.js
export default {
  projects: [
    {
      name: 'admin-tests',
      use: { 
        storageState: '.auth/admin.json'
      },
    },
  ],
};
```

## Best Practices

### 1. Use Stable Selectors
```javascript
// Good - data-testid
await page.click('[data-testid="submit-button"]');

// Good - ID
await page.click('#submit-button');

// Avoid - class names (can change)
await page.click('.btn.btn-primary.submit');

// Avoid - text (can change with i18n)
await page.click('text=Submit');
```

### 2. Wait for Elements Properly
```javascript
// Good - implicit waiting
await expect(page.locator('#result')).toBeVisible();

// Good - explicit waiting
await page.waitForSelector('#result', { state: 'visible' });

// Avoid - hard-coded timeouts
await page.waitForTimeout(3000);
```

### 3. Isolate Tests
```javascript
// Each test should be independent
test.beforeEach(async ({ page }) => {
  // Setup fresh state
  await setupTestData();
});

test.afterEach(async ({ page }) => {
  // Clean up
  await cleanupTestData();
});
```

### 4. Use Test Data Fixtures
```javascript
// fixtures/employees.json
{
  "validEmployee": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@test.com"
  }
}

// In test
import employees from '../fixtures/employees.json';

test('should create employee', async ({ page }) => {
  await employeePage.createEmployee(employees.validEmployee);
});
```

### 5. Handle Network Conditions
```javascript
// Wait for API response
const response = await page.waitForResponse(
  response => response.url().includes('/api/employees') && response.status() === 200
);

// Mock API response
await page.route('**/api/employees', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [] })
  });
});
```

## Troubleshooting

### Issue: Tests timing out
**Solution:**
```javascript
// Increase timeout in playwright.config.js
export default {
  timeout: 60000, // 60 seconds
  expect: {
    timeout: 10000 // 10 seconds for assertions
  }
};
```

### Issue: Element not found
**Solution:**
1. Verify selector using browser DevTools
2. Add explicit wait:
```javascript
await page.waitForSelector('#element', { state: 'attached' });
```
3. Check if element is in iframe:
```javascript
const frame = page.frameLocator('iframe[name="content"]');
await frame.locator('#element').click();
```

### Issue: Flaky tests
**Solutions:**
1. Use auto-waiting: `await expect(locator).toBeVisible()`
2. Avoid `waitForTimeout()`
3. Wait for network idle: `await page.waitForLoadState('networkidle')`
4. Increase retries in config:
```javascript
export default {
  retries: 2, // Retry failed tests
};
```

### Issue: PowerShell execution policy blocking npm
**Solution:**
```powershell
# Option 1: Use node directly
node node_modules\.bin\playwright test

# Option 2: Bypass execution policy (one-time)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Option 3: Enable scripts permanently (admin required)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Browser not installed
**Solution:**
```bash
npx playwright install
# or
node node_modules\@playwright\test\cli.js install
```

## CI/CD Integration

### GitHub Actions

**.github/workflows/e2e-tests.yml**

```yaml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: skyraksys_hrm_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
          
      - name: Install backend dependencies
        run: cd backend && npm install
        
      - name: Install frontend dependencies
        run: cd frontend && npm install
        
      - name: Install E2E dependencies
        run: cd frontend/e2e && npm install
        
      - name: Install Playwright browsers
        run: cd frontend/e2e && npx playwright install --with-deps
        
      - name: Setup database
        run: |
          cd backend
          npm run db:migrate
          npm run db:seed
          
      - name: Start backend
        run: cd backend && npm start &
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/skyraksys_hrm_test
          
      - name: Start frontend
        run: cd frontend && npm start &
        
      - name: Wait for services
        run: npx wait-on http://localhost:3000 http://localhost:5000/api/health
        
      - name: Run E2E tests
        run: cd frontend/e2e && npm test
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/e2e/playwright-report/
          retention-days: 30
          
      - name: Upload traces
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-traces
          path: frontend/e2e/test-results/
```

### Jenkins

```groovy
pipeline {
  agent any
  
  stages {
    stage('Setup') {
      steps {
        sh 'npm install'
        sh 'npx playwright install --with-deps'
      }
    }
    
    stage('Start Services') {
      steps {
        sh 'docker-compose up -d'
        sh 'npm run wait-for-services'
      }
    }
    
    stage('Run Tests') {
      steps {
        sh 'cd frontend/e2e && npm test'
      }
    }
  }
  
  post {
    always {
      publishHTML([
        reportDir: 'frontend/e2e/playwright-report',
        reportFiles: 'index.html',
        reportName: 'Playwright Report'
      ])
    }
  }
}
```

## Reporting

### View HTML Report
```bash
npm run report
# Opens http://localhost:9323
```

### Generate Custom Reports
```javascript
// playwright.config.js
export default {
  reporter: [
    ['html'],                          // HTML report
    ['junit', { outputFile: 'results.xml' }], // JUnit XML
    ['json', { outputFile: 'results.json' }], // JSON
    ['list']                           // Console output
  ],
};
```

## References

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- Project API Documentation: `http://localhost:5000/api/docs`

## Support

For questions or issues:
1. Check Playwright documentation
2. Review test traces: `npx playwright show-trace trace.zip`
3. Run in debug mode: `npm run test:debug`
4. Consult project E2E README: `frontend/e2e/README.md`

---

**Last Updated:** 2025-01-28
**Version:** 1.0.0
**Framework:** Playwright 1.40.0
