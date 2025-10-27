# 🧪 E2E Test Automation - SkyRakSys HRM

**Framework**: Playwright  
**Version**: 1.0.0  
**Last Updated**: October 26, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Running Tests](#running-tests)
4. [Test Structure](#test-structure)
5. [Page Objects](#page-objects)
6. [Test Categories](#test-categories)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This E2E test suite uses **Playwright** to test the SkyRakSys HRM application across multiple browsers and devices. The tests follow the **Page Object Model** pattern for maintainability and reusability.

### Why Playwright?

- ✅ Cross-browser testing (Chromium, Firefox, WebKit)
- ✅ Mobile and tablet emulation
- ✅ Fast and reliable
- ✅ Auto-wait for elements
- ✅ Excellent debugging tools
- ✅ Built-in test reporter
- ✅ Video and screenshot capture on failure

---

## 🚀 Setup

### Prerequisites

- Node.js 18+ installed
- Frontend application running on `http://localhost:3000`
- Backend API running on `http://localhost:5000`

### Installation

```bash
# Navigate to e2e directory
cd frontend/e2e

# Install dependencies
npm install

# Install Playwright browsers
npm run install:browsers

# Or install specific browser
npx playwright install chromium
```

### Environment Configuration

Create a `.env` file in the `e2e` directory:

```env
# Application URLs
REACT_APP_API_URL=http://localhost:3000
API_BASE_URL=http://localhost:5000

# Test credentials
TEST_ADMIN_USERNAME=admin
TEST_ADMIN_PASSWORD=admin123

TEST_EMPLOYEE_USERNAME=SKYT001
TEST_EMPLOYEE_PASSWORD=password123

TEST_MANAGER_USERNAME=SKYT002
TEST_MANAGER_PASSWORD=password123

# Test configuration
TEST_TIMEOUT=30000
TEST_RETRIES=2
```

---

## 🏃 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Run specific browser
npm run test:chrome
npm run test:firefox
npm run test:webkit

# Run mobile tests
npm run test:mobile

# Run all browsers
npm run test:all
```

### Test by Category

```bash
# Smoke tests (critical paths)
npm run test:smoke

# Regression tests (all features)
npm run test:regression

# By module
npm run test:auth
npm run test:employee
npm run test:timesheet
npm run test:payroll
npm run test:leave
```

### Test Specific Files

```bash
# Run specific test file
npx playwright test tests/auth/login.spec.js

# Run tests matching pattern
npx playwright test --grep "login"

# Run tests with specific tag
npx playwright test --grep @smoke
```

---

## 📁 Test Structure

```
e2e/
├── tests/                      # Test files
│   ├── auth/                  # Authentication tests
│   │   └── login.spec.js
│   ├── dashboard/             # Dashboard tests
│   │   └── dashboard.spec.js
│   ├── employee/              # Employee module tests
│   │   └── employee.spec.js
│   ├── timesheet/             # Timesheet tests
│   │   └── timesheet.spec.js
│   ├── leave/                 # Leave management tests
│   └── payroll/               # Payroll tests
│
├── pages/                      # Page Object Models
│   ├── BasePage.js            # Base page class
│   ├── LoginPage.js
│   ├── DashboardPage.js
│   ├── EmployeePage.js
│   └── TimesheetPage.js
│
├── fixtures/                   # Test data fixtures
├── utils/                      # Helper utilities
├── playwright/.auth/           # Authentication states
├── playwright-report/          # HTML test reports
├── test-results/              # Test artifacts
│
├── playwright.config.js        # Playwright configuration
├── global.setup.js            # Global test setup
└── package.json               # Dependencies

```

---

## 📄 Page Objects

### BasePage

Base class with common functionality:

```javascript
import { BasePage } from '../pages/BasePage';

class MyPage extends BasePage {
  constructor(page) {
    super(page);
    this.mySelector = 'button.my-button';
  }

  async clickMyButton() {
    await this.click(this.mySelector);
  }
}
```

### Available Page Objects

- **LoginPage** - Login and authentication
- **DashboardPage** - Dashboard navigation
- **EmployeePage** - Employee management
- **TimesheetPage** - Timesheet operations

### Creating New Page Objects

1. Extend `BasePage`
2. Define selectors in constructor
3. Create methods for page actions
4. Keep selectors flexible for different implementations

---

## 🏷️ Test Categories

### Smoke Tests (`@smoke`)

Critical path tests that must pass:
- Login/logout
- Dashboard access
- Basic navigation
- Essential workflows

```javascript
test.describe('Login Tests @smoke', () => {
  test('should login successfully', async ({ page }) => {
    // Test code
  });
});
```

### Regression Tests (`@regression`)

Complete feature testing:
- All employee operations
- Complete timesheet workflows
- Leave management
- Payroll operations

```javascript
test.describe('Employee Tests @regression', () => {
  test('should add employee', async ({ page }) => {
    // Test code
  });
});
```

---

## 🔄 CI/CD Integration

### GitHub Actions

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend/e2e
          npm ci
      
      - name: Install Playwright browsers
        run: |
          cd frontend/e2e
          npx playwright install --with-deps
      
      - name: Run E2E tests
        run: |
          cd frontend/e2e
          npm test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/e2e/playwright-report/
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Setup') {
            steps {
                sh 'cd frontend/e2e && npm ci'
                sh 'cd frontend/e2e && npx playwright install'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'cd frontend/e2e && npm test'
            }
        }
        
        stage('Publish Report') {
            steps {
                publishHTML([
                    reportDir: 'frontend/e2e/playwright-report',
                    reportFiles: 'index.html',
                    reportName: 'Playwright Report'
                ])
            }
        }
    }
}
```

---

## ✅ Best Practices

### 1. Use Page Objects

```javascript
// ✅ Good
const loginPage = new LoginPage(page);
await loginPage.login('user', 'pass');

// ❌ Bad
await page.fill('#username', 'user');
await page.fill('#password', 'pass');
```

### 2. Use Flexible Selectors

```javascript
// ✅ Good - Multiple fallbacks
this.loginButton = 'button[type="submit"], button:has-text("Login")';

// ❌ Bad - Brittle
this.loginButton = '#login-btn-123';
```

### 3. Wait for Elements Properly

```javascript
// ✅ Good - Let Playwright auto-wait
await page.click('button.submit');

// ❌ Bad - Manual waits
await page.waitForTimeout(5000);
await page.click('button.submit');
```

### 4. Use Test Isolation

```javascript
test.beforeEach(async ({ page }) => {
  // Fresh state for each test
  await page.goto('/dashboard');
});
```

### 5. Handle Dynamic Content

```javascript
// Wait for API response
await page.waitForResponse('**/api/employees');

// Wait for specific state
await page.waitForSelector('.employee-loaded');
```

### 6. Use Descriptive Test Names

```javascript
// ✅ Good
test('should display validation error when submitting empty form', async () => {});

// ❌ Bad
test('test1', async () => {});
```

---

## 🐛 Troubleshooting

### Tests Failing Locally

**Problem**: Tests pass in CI but fail locally

**Solution**:
```bash
# Clear cache
rm -rf node_modules
npm install

# Reinstall browsers
npx playwright install --force
```

### Element Not Found

**Problem**: `TimeoutError: Waiting for selector "button.submit"`

**Solution**:
```javascript
// Use flexible selectors
'button[type="submit"], button:has-text("Submit")'

// Increase timeout
await page.click('button', { timeout: 30000 });

// Check if element exists first
if (await page.isVisible('button')) {
  await page.click('button');
}
```

### Authentication Issues

**Problem**: Tests fail with authentication errors

**Solution**:
```bash
# Delete auth state and re-run setup
rm -rf playwright/.auth
npm test
```

### Flaky Tests

**Problem**: Tests fail intermittently

**Solution**:
```javascript
// Add proper waits
await page.waitForLoadState('networkidle');

// Wait for specific API calls
await page.waitForResponse('**/api/data');

// Use retry configuration
test.describe.configure({ retries: 2 });
```

### Debugging Tests

```bash
# Run in debug mode
npm run test:debug

# Run with headed browser
npm run test:headed

# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Screenshots and Videos

Tests automatically capture:
- ✅ Screenshots on failure
- ✅ Videos on retry
- ✅ Traces on first retry

Find in: `test-results/`

---

## 📊 Test Reports

### View HTML Report

```bash
# Generate and view report
npm run report

# Or manually
npx playwright show-report
```

### Report Location

- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results/results.json`
- **JUnit XML**: `test-results/junit.xml`

---

## 🔧 Configuration

### Playwright Config

Edit `playwright.config.js`:

```javascript
export default defineConfig({
  timeout: 30 * 1000,        // Test timeout
  retries: process.env.CI ? 2 : 0,  // Retries in CI
  workers: process.env.CI ? 1 : undefined,  // Parallel workers
  
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
});
```

---

## 📚 Resources

### Documentation

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

### Tutorials

- [Getting Started](https://playwright.dev/docs/intro)
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [Page Object Model](https://playwright.dev/docs/pom)

---

## 🤝 Contributing

### Adding New Tests

1. Determine the module (auth, employee, timesheet, etc.)
2. Create or update page object if needed
3. Write test in appropriate directory
4. Add proper tags (@smoke, @regression)
5. Update this documentation

### Test Review Checklist

- [ ] Tests are isolated and independent
- [ ] Using page objects
- [ ] Flexible selectors used
- [ ] Proper waits (no arbitrary timeouts)
- [ ] Descriptive test names
- [ ] Error scenarios covered
- [ ] Tests pass locally and in CI

---

## 📞 Support

### Issues

- Check troubleshooting section
- Review test logs in `test-results/`
- Check Playwright documentation

### Questions

- Create issue in repository
- Check team documentation
- Review similar test cases

---

**Happy Testing! 🎉**

*For more information, see the [Playwright documentation](https://playwright.dev) or contact the QA team.*
