# Testing Guide

## Overview
This document outlines testing procedures and practices for the SkyRakSys HRM system.

## Test Structure

### 1. Unit Tests
Located in `__tests__` directories within each module:
```
backend/
  └── __tests__/
      ├── controllers/
      ├── services/
      └── utils/

frontend/
  └── __tests__/
      ├── components/
      ├── services/
      └── utils/
```

### 2. Integration Tests
Located in `tests/integration/`:
- API endpoint testing
- Database operations
- Authentication flow
- Business logic flow

### 3. End-to-End Tests
Located in `tests/e2e/`:
- User workflows
- UI interactions
- Cross-module functionality

## Testing Setup

### 1. Test Environment
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.js'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    }
  }
};
```

### 2. Test Database Configuration
```env
# .env.test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_test
DB_USER=test_user
DB_PASSWORD=test_password
```

## Writing Tests

### 1. Unit Test Example
```javascript
// User Service Test
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        role: 'employee'
      };
      const user = await UserService.createUser(userData);
      expect(user).toHaveProperty('id');
      expect(user.email).toBe(userData.email);
    });

    it('should throw error with invalid data', async () => {
      const userData = {
        email: 'invalid-email',
        password: '123'
      };
      await expect(UserService.createUser(userData))
        .rejects
        .toThrow('ValidationError');
    });
  });
});
```

### 2. Integration Test Example
```javascript
// Leave Request API Test
describe('Leave Request API', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Setup test user and get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!'
      });
    token = response.body.data.token;
    userId = response.body.data.user.id;
  });

  it('should create leave request', async () => {
    const leaveData = {
      startDate: '2025-10-01',
      endDate: '2025-10-05',
      leaveType: 'vacation'
    };

    const response = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${token}`)
      .send(leaveData);

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### 3. E2E Test Example
```javascript
// Leave Request Workflow Test
describe('Leave Request Workflow', () => {
  it('should complete full leave request workflow', async () => {
    // Login as employee
    await page.goto('/login');
    await page.fill('#email', 'employee@example.com');
    await page.fill('#password', 'Employee123!');
    await page.click('button[type="submit"]');

    // Navigate to leave requests
    await page.click('a[href="/leaves"]');
    await page.click('button[data-testid="new-leave"]');

    // Fill leave request form
    await page.fill('#startDate', '2025-10-01');
    await page.fill('#endDate', '2025-10-05');
    await page.selectOption('#leaveType', 'vacation');
    await page.click('button[type="submit"]');

    // Verify success message
    const success = await page.textContent('.alert-success');
    expect(success).toContain('Leave request submitted');
  });
});
```

## Test Coverage

### 1. Coverage Requirements
- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%

### 2. Running Coverage Reports
```bash
# Backend coverage
npm run test:coverage

# Frontend coverage
cd frontend && npm run test:coverage
```

## Test Scripts

### Backend Tests
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --config jest.config.e2e.js",
    "test:integration": "jest --config jest.config.integration.js"
  }
}
```

### Frontend Tests
```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open"
  }
}
```

## Test Data Management

### 1. Test Fixtures
Located in `tests/fixtures/`:
- User data
- Employee data
- Leave request data
- Project data

### 2. Database Seeding
```javascript
// tests/setup/seed.js
async function seedTestData() {
  await User.bulkCreate(userFixtures);
  await Employee.bulkCreate(employeeFixtures);
  await Project.bulkCreate(projectFixtures);
}
```

## Testing Best Practices

1. **Test Organization**
   - Group related tests
   - Clear test descriptions
   - Proper setup and teardown
   - Isolated test cases

2. **Test Data**
   - Use fixtures
   - Avoid hard-coded values
   - Clean up after tests
   - Use meaningful test data

3. **Test Performance**
   - Mock external services
   - Use test database
   - Optimize test runs
   - Parallel test execution

4. **Test Maintenance**
   - Regular updates
   - Remove obsolete tests
   - Keep tests simple
   - Document complex tests

## Continuous Integration

### 1. GitHub Actions Configuration
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:12
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: skyraksys_hrm_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16.x'
    - run: npm ci
    - run: npm run test:ci
```

### 2. Test Reports
- JUnit XML reports
- Coverage reports
- Test execution time
- Failed test details

## References
- [API Documentation](../api/API_DOCUMENTATION.md)
- [Development Setup](../../DEVELOPMENT_SETUP.md)
- [Error Handling](./ERROR_HANDLING.md)
- [CI/CD Guide](../deployment/CICD_GUIDE.md)