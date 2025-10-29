# 🧪 Testing Guide

**Version**: 2.0.0  
**Last Updated**: October 27, 2025  
**Testing Framework**: Playwright (E2E), Jest (Unit)

---

## 📋 Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [E2E Testing with Playwright](#e2e-testing-with-playwright)
4. [Unit Testing](#unit-testing)
5. [Test Execution](#test-execution)
6. [CI/CD Integration](#cicd-integration)
7. [Writing New Tests](#writing-new-tests)
8. [Best Practices](#best-practices)

---

## 🎯 Testing Overview

### Test Pyramid

```
         ┌─────────────┐
         │    E2E      │  (10-20%)
         │  Playwright │
         └─────────────┘
              △
             ╱ ╲
            ╱   ╲
           ╱     ╲
          ╱       ╲
         ╱         ╲
        ╱           ╲
       ╱             ╲
      ╱               ╲
     ╱                 ╲
    ╱    Integration   ╲  (30-40%)
   ╱      API Tests     ╲
  └─────────────────────┘
             △
            ╱ ╲
           ╱   ╲
          ╱     ╲
         ╱       ╲
        ╱         ╲
       ╱           ╲
      ╱             ╲
     ╱    Unit Tests ╲  (50-60%)
    ╱       (Jest)    ╲
   └───────────────────┘
```

### Test Coverage

| Module | E2E Tests | Unit Tests | Coverage |
|--------|-----------|------------|----------|
| **Authentication** | 5 | 12 | 85% |
| **Employee Management** | 10 | 20 | 78% |
| **Timesheet** | 8 | 15 | 82% |
| **Leave Management** | 8 | 18 | 80% |
| **Payroll** | 6 | 14 | 75% |
| **Total** | **37** | **79** | **80%** |

---

## 🛠️ Test Environment Setup

### Prerequisites

```bash
# Ensure backend and frontend dependencies are installed
cd backend && npm install
cd ../frontend && npm install

# Install Playwright browsers
cd frontend/e2e
npm install
npx playwright install
```

### Test Environment Configuration

**Backend Test Environment** (`.env.test`):
```bash
NODE_ENV=test
PORT=5001
DB_HOST=localhost
DB_NAME=skyraksys_hrm_test
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=test-secret-key
```

**Frontend Test Environment** (`.env.test`):
```bash
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_ENV=test
```

### Test Database Setup

```bash
# Create test database
psql -U postgres -c "CREATE DATABASE skyraksys_hrm_test;"

# Run migrations
cd backend
NODE_ENV=test npx sequelize-cli db:migrate

# Seed test data
NODE_ENV=test npx sequelize-cli db:seed:all
```

---

## 🎭 E2E Testing with Playwright

### Directory Structure

```
frontend/e2e/
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── password-change.spec.ts
│   ├── employees/
│   │   ├── employee-creation.spec.ts
│   │   ├── employee-listing.spec.ts
│   │   └── employee-editing.spec.ts
│   ├── timesheets/
│   │   ├── timesheet-creation.spec.ts
│   │   ├── timesheet-submission.spec.ts
│   │   └── timesheet-approval.spec.ts
│   └── leaves/
│       ├── leave-application.spec.ts
│       └── leave-approval.spec.ts
├── pages/
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── EmployeePage.ts
│   └── TimesheetPage.ts
├── fixtures/
│   ├── auth.ts
│   └── test-data.ts
├── utils/
│   ├── helpers.ts
│   └── constants.ts
├── playwright.config.ts
└── package.json
```

### Playwright Configuration

**playwright.config.ts**:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Page Object Model (POM)

**Example: LoginPage.ts**
```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }

  async isLoginSuccessful() {
    await this.page.waitForURL('/dashboard');
    return this.page.url().includes('/dashboard');
  }
}
```

### Test Examples

**Authentication Test**:
```typescript
// tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Login Functionality', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should login with valid credentials @smoke', async () => {
    await loginPage.login('admin@skyraksys.com', 'admin123');
    
    expect(await loginPage.isLoginSuccessful()).toBe(true);
  });

  test('should show error with invalid credentials', async () => {
    await loginPage.login('invalid@test.com', 'wrongpassword');
    
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Invalid credentials');
  });

  test('should validate empty fields', async () => {
    await loginPage.loginButton.click();
    
    expect(await loginPage.emailInput).toHaveAttribute('required');
    expect(await loginPage.passwordInput).toHaveAttribute('required');
  });
});
```

**Employee Creation Test**:
```typescript
// tests/employees/employee-creation.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { EmployeePage } from '../../pages/EmployeePage';

test.describe('Employee Creation', () => {
  test.use({ storageState: 'auth/admin.json' }); // Use saved auth state

  test('should create new employee @regression', async ({ page }) => {
    const employeePage = new EmployeePage(page);
    await employeePage.goto();
    
    await employeePage.clickAddEmployee();
    await employeePage.fillEmployeeForm({
      employeeId: 'SKYT999',
      firstName: 'Test',
      lastName: 'Employee',
      email: 'test.employee@test.com',
      phone: '9999999999',
      department: 'Engineering',
      position: 'Software Engineer',
      hireDate: '2025-11-01',
      basicSalary: '50000'
    });
    
    await employeePage.submitForm();
    
    await expect(page.locator('.success-message')).toContainText(
      'Employee created successfully'
    );
  });

  test('should validate required fields', async ({ page }) => {
    const employeePage = new EmployeePage(page);
    await employeePage.goto();
    await employeePage.clickAddEmployee();
    await employeePage.submitForm();
    
    await expect(page.locator('.error-message')).toContainText(
      'Please fill all required fields'
    );
  });
});
```

**Timesheet Workflow Test**:
```typescript
// tests/timesheets/timesheet-submission.spec.ts
import { test, expect } from '@playwright/test';
import { TimesheetPage } from '../../pages/TimesheetPage';

test.describe('Timesheet Submission Workflow', () => {
  test.use({ storageState: 'auth/employee.json' });

  test('should submit weekly timesheet @smoke', async ({ page }) => {
    const timesheetPage = new TimesheetPage(page);
    await timesheetPage.goto();
    
    await timesheetPage.createTimesheet({
      weekStart: '2025-10-28',
      project: 'Website Redesign',
      task: 'Frontend Development',
      hours: {
        monday: '8',
        tuesday: '8',
        wednesday: '8',
        thursday: '8',
        friday: '8'
      },
      description: 'Development work on responsive design'
    });
    
    await timesheetPage.submitForApproval();
    
    await expect(page.locator('.status-badge')).toContainText('Submitted');
  });
});
```

### Test Tags

Tests are organized with tags for selective execution:

| Tag | Purpose | Example |
|-----|---------|---------|
| `@smoke` | Quick sanity tests | Login, critical paths |
| `@regression` | Full test suite | All features |
| `@wip` | Work in progress | New tests being developed |
| `@skip` | Temporarily disabled | Known issues |

**Run tests by tag**:
```bash
# Run only smoke tests
npx playwright test --grep @smoke

# Run all except WIP
npx playwright test --grep-invert @wip
```

---

## 🧩 Unit Testing

### Jest Configuration

**jest.config.js**:
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '**/tests/**/*.test.js',
  ],
};
```

### Example Unit Tests

**Controller Test**:
```javascript
// tests/controllers/employee.controller.test.js
const { createEmployee, getEmployee } = require('../../controllers/employee.controller');
const { Employee, Department, Position } = require('../../models');

jest.mock('../../models');

describe('Employee Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 'admin-uuid', role: 'admin' },
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEmployee', () => {
    it('should create employee successfully', async () => {
      const mockEmployee = {
        id: 'uuid',
        employeeId: 'SKYT001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com'
      };

      Employee.findOne.mockResolvedValue(null);
      Employee.create.mockResolvedValue(mockEmployee);

      req.validatedData = mockEmployee;

      await createEmployee(req, res, next);

      expect(Employee.create).toHaveBeenCalledWith(mockEmployee);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Employee created successfully',
        data: mockEmployee
      });
    });

    it('should reject duplicate email', async () => {
      const existingEmployee = { id: 'existing-uuid', email: 'john@test.com' };
      Employee.findOne.mockResolvedValue(existingEmployee);

      req.validatedData = { email: 'john@test.com' };

      await createEmployee(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('already exists') })
      );
    });
  });

  describe('getEmployee', () => {
    it('should return employee by ID', async () => {
      const mockEmployee = {
        id: 'uuid',
        employeeId: 'SKYT001',
        firstName: 'John',
        department: { name: 'Engineering' },
        position: { title: 'Software Engineer' }
      };

      Employee.findByPk.mockResolvedValue(mockEmployee);
      req.params.id = 'uuid';

      await getEmployee(req, res, next);

      expect(Employee.findByPk).toHaveBeenCalledWith('uuid', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockEmployee
      });
    });

    it('should return 404 if employee not found', async () => {
      Employee.findByPk.mockResolvedValue(null);
      req.params.id = 'invalid-uuid';

      await getEmployee(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 })
      );
    });
  });
});
```

**Utility Function Test**:
```javascript
// tests/utils/helpers.test.js
const { calculateWorkingDays, calculateNetSalary } = require('../../utils/helpers');

describe('Helper Functions', () => {
  describe('calculateWorkingDays', () => {
    it('should calculate working days excluding weekends', () => {
      const startDate = new Date('2025-10-20'); // Monday
      const endDate = new Date('2025-10-31'); // Friday
      
      const workingDays = calculateWorkingDays(startDate, endDate);
      
      expect(workingDays).toBe(10); // 2 weeks = 10 working days
    });

    it('should handle single day', () => {
      const date = new Date('2025-10-20');
      
      const workingDays = calculateWorkingDays(date, date);
      
      expect(workingDays).toBe(1);
    });
  });

  describe('calculateNetSalary', () => {
    it('should calculate net salary correctly', () => {
      const salaryData = {
        basicSalary: 50000,
        hra: 25000,
        allowances: 25000,
        pfDeduction: 6000,
        tax: 5000
      };

      const netSalary = calculateNetSalary(salaryData);

      expect(netSalary).toBe(89000); // 100000 - 11000
    });
  });
});
```

---

## 🚀 Test Execution

### Running E2E Tests

```bash
cd frontend/e2e

# Run all tests
npm test

# Run specific test file
npx playwright test tests/auth/login.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in UI mode (interactive)
npx playwright test --ui

# Run smoke tests only
npx playwright test --grep @smoke

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests in parallel
npx playwright test --workers=4

# Generate HTML report
npx playwright test --reporter=html
npx playwright show-report
```

### Running Unit Tests

```bash
cd backend

# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/controllers/employee.controller.test.js

# Run tests in watch mode
npm test -- --watch

# Run tests matching pattern
npm test -- --testNamePattern="create employee"
```

### Test Reports

**E2E Report**:
```bash
npx playwright show-report
# Opens HTML report in browser
```

**Unit Test Coverage**:
```bash
npm run test:coverage
# Coverage report in coverage/lcov-report/index.html
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

**.github/workflows/tests.yml**:
```yaml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: skyraksys_hrm_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install backend dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run unit tests
        run: |
          cd backend
          npm test
        env:
          DB_HOST: localhost
          DB_NAME: skyraksys_hrm_test
          DB_USER: postgres
          DB_PASSWORD: password
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  e2e-tests:
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
          npx playwright install --with-deps
      
      - name: Run E2E tests
        run: |
          cd frontend/e2e
          npx playwright test --grep @smoke
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/e2e/playwright-report
```

---

## ✍️ Writing New Tests

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';
import { YourPage } from '../../pages/YourPage';

test.describe('Feature Description', () => {
  // Use appropriate auth state
  test.use({ storageState: 'auth/role.json' });

  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should perform expected action @tag', async ({ page }) => {
    // Arrange
    const yourPage = new YourPage(page);
    await yourPage.goto();

    // Act
    await yourPage.performAction();

    // Assert
    await expect(page.locator('.result')).toContainText('Expected Result');
  });
});
```

### Unit Test Template

```javascript
const { functionToTest } = require('../path/to/module');

describe('Module Name', () => {
  describe('functionToTest', () => {
    it('should behave as expected', () => {
      // Arrange
      const input = 'test data';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected output');
    });

    it('should handle edge case', () => {
      // Test edge cases
    });
  });
});
```

---

## ✅ Best Practices

### E2E Testing Best Practices

1. **Use Page Object Model**: Encapsulate page interactions
2. **Independent Tests**: Each test should be self-contained
3. **Meaningful Selectors**: Use data-testid attributes
4. **Wait Appropriately**: Use Playwright's auto-waiting
5. **Test User Journeys**: Focus on real user workflows
6. **Tag Tests**: Use @smoke, @regression for organization
7. **Clean Test Data**: Reset state between tests

### Unit Testing Best Practices

1. **Test One Thing**: Each test should have single assertion focus
2. **Mock Dependencies**: Isolate unit under test
3. **Descriptive Names**: Test names should describe behavior
4. **AAA Pattern**: Arrange, Act, Assert
5. **Edge Cases**: Test boundary conditions and errors
6. **No Logic in Tests**: Tests should be simple and readable
7. **Fast Execution**: Unit tests should run quickly

---

**Next**: [Recommendations](./10-RECOMMENDATIONS.md)
