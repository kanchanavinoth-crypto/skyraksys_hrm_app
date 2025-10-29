# Manual API Tests

This directory contains scripts for manually testing API endpoints during development.

## 📋 Purpose
These scripts simulate frontend requests to test:
- API endpoint functionality
- Authentication and authorization
- Request/response formats
- Error handling
- Bulk operations
- Edge cases

## 🧪 Script Categories

### Authentication Tests (`test-*-auth.js`, `test-*-token.js`)
Test authentication flows:
- **test-auth-token.js** - Verify JWT token generation
- **test-backend-auth.js** - Test backend authentication
- **test-frontend-token.js** - Simulate frontend auth
- **test-security-session.js** - Test session management

### Timesheet Tests (`test-timesheet-*.js`)
Test timesheet functionality:
- **test-timesheet-workflow.js** - Full timesheet lifecycle
- **test-timesheet-loading.js** - Test timesheet retrieval
- **test-timesheets-api.js** - General timesheet API tests
- **test-date-filters.js** - Test date range filtering

### Bulk Operation Tests (`test-bulk-*.js`)
Test batch operations:
- **test-bulk-operations.js** - Bulk approve/reject timesheets
- **test-bulk-submission.js** - Bulk timesheet submission
- **test-auto-bulk-submission.js** - Automated bulk submit

### History Tests (`test-*-history-*.js`)
Test audit/history features:
- **test-history-api.js** - Test history endpoint
- **test-fixed-history-api.js** - Verify history fixes

### Access Control Tests (`test-*-access.js`)
Test permissions and RBAC:
- **test-employee-access.js** - Test employee permissions
- **test-security-session-fix.js** - Verify security patches

### Feature Tests (`test-*.js`)
Test specific features:
- **test-projects-tasks.js** - Project and task APIs
- **test-task-availability.js** - Task assignment rules
- **test-multiple-tasks.js** - Multi-task handling
- **test-file-upload-sync.js** - File upload functionality
- **test-fresh-week.js** - New week creation
- **test-frontend-simulation.js** - Simulate frontend behavior

## 🚀 Running Tests

### Prerequisites
```bash
# Ensure backend is running
cd backend
npm run dev

# Or in another terminal
node server.js
```

### Basic Usage
```bash
cd backend
node tests/manual/test-auth-token.js
node tests/manual/test-timesheet-workflow.js
```

### With Configuration
```bash
# Test against specific environment
API_URL="http://localhost:5000" node tests/manual/test-bulk-operations.js

# Use specific test user
TEST_USER_EMAIL="manager@test.com" node tests/manual/test-employee-access.js
```

## 📝 Test Structure

### Standard Test Format
```javascript
/**
 * test-example.js
 * 
 * Purpose: Test example API endpoint
 * Prerequisites: 
 * - Backend running on port 5000
 * - Test user exists in database
 * 
 * Usage: node tests/manual/test-example.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testExample() {
    try {
        // 1. Login
        const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
            email: 'test@example.com',
            password: 'password123'
        });
        
        const token = loginRes.data.token;
        console.log('✅ Login successful');
        
        // 2. Test endpoint
        const response = await axios.get(`${API_URL}/api/example`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Test passed:', response.data);
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

testExample();
```

### Test Suite Format
For comprehensive testing:
```javascript
async function runTests() {
    console.log('🧪 Starting test suite...\n');
    
    const tests = [
        { name: 'Login', fn: testLogin },
        { name: 'Create Record', fn: testCreate },
        { name: 'Read Record', fn: testRead },
        { name: 'Update Record', fn: testUpdate },
        { name: 'Delete Record', fn: testDelete }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            await test.fn();
            console.log(`✅ ${test.name} - PASSED\n`);
            passed++;
        } catch (error) {
            console.error(`❌ ${test.name} - FAILED:`, error.message, '\n');
            failed++;
        }
    }
    
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}
```

## 🎯 Best Practices

### Writing Tests
- ✅ Test one feature/endpoint per script
- ✅ Include setup and teardown
- ✅ Use descriptive console output
- ✅ Handle both success and error cases
- ✅ Clean up test data after running
- ✅ Make tests idempotent when possible

### Test Data
- ✅ Use test accounts (avoid production data)
- ✅ Create temporary records with unique identifiers
- ✅ Clean up after tests complete
- ✅ Don't hardcode production IDs

### Error Handling
```javascript
try {
    const response = await axios.post(url, data, config);
    console.log('✅ Success:', response.data);
} catch (error) {
    if (error.response) {
        // API returned error response
        console.error('❌ API Error:', error.response.status);
        console.error('Message:', error.response.data.message);
    } else if (error.request) {
        // No response received
        console.error('❌ No response from server');
    } else {
        // Request setup error
        console.error('❌ Request error:', error.message);
    }
    process.exit(1);
}
```

## 🔍 Debugging Tests

### Enable Verbose Logging
```bash
# See all HTTP requests/responses
DEBUG=axios node tests/manual/test-example.js

# Enable application debug logs
DEBUG=* node tests/manual/test-example.js
```

### Check Backend Logs
```bash
# In another terminal, watch server logs
tail -f backend/logs/combined.log
```

### Use Postman/Insomnia
For interactive testing:
1. Export requests from test script
2. Import to Postman
3. Manually verify responses

## 📊 Test Coverage

### What to Test
- ✅ Happy path (expected input/output)
- ✅ Error cases (invalid input, missing data)
- ✅ Authorization (correct permissions required)
- ✅ Edge cases (boundary values, empty arrays)
- ✅ Performance (response time acceptable)

### Test Checklist
```markdown
## API Endpoint Test Checklist

### Authentication
- [ ] Works with valid token
- [ ] Rejects invalid/expired token
- [ ] Rejects missing token

### Authorization
- [ ] Admin can access
- [ ] Manager can access their data
- [ ] Employee can access only their data
- [ ] Rejects unauthorized roles

### Input Validation
- [ ] Accepts valid input
- [ ] Rejects invalid types
- [ ] Handles missing required fields
- [ ] Validates data constraints

### Business Logic
- [ ] Creates/updates correctly
- [ ] Enforces business rules
- [ ] Handles edge cases
- [ ] Prevents invalid state

### Response Format
- [ ] Returns correct status codes
- [ ] Response matches schema
- [ ] Error messages are clear
- [ ] Success data is complete
```

## 🔄 Integration with Automated Tests

### Converting to Automated
Manual tests can be converted to:
- **Unit tests** (Jest/Mocha) - Test individual functions
- **Integration tests** (Supertest) - Test API endpoints
- **E2E tests** (Playwright) - Test full user flows

### When to Automate
Automate tests that:
- ✅ Run frequently
- ✅ Test critical functionality
- ✅ Are stable and repeatable
- ✅ Catch regressions

Keep manual for:
- ⏸️ One-time investigations
- ⏸️ Interactive debugging
- ⏸️ Exploratory testing
- ⏸️ Tests requiring human judgment

## 🗑️ Cleanup Policy

### Regular Review
- **After bug fixes**: Remove tests created for one-time issues
- **After features**: Move to automated test suite
- **Monthly**: Archive obsolete tests

### Keep If
- Useful for debugging recurring issues
- Tests complex workflows not covered by automation
- Serves as example/documentation
- Used in development workflow

### Archive If
- Feature no longer exists
- Covered by automated tests
- Hasn't been used in 6+ months
- Tests deprecated APIs

## 📚 Related Documentation
- [E2E Tests](../../../frontend/e2e/README.md) - Playwright automated tests
- [Backend Tests](../tests/README.md) - Unit and integration tests
- [API Documentation](../../docs/api/README.md) - API endpoint reference
- [Debug Scripts](../utils/debug/README.md) - Database inspection tools

---

**Last Updated**: October 28, 2025  
**Maintainer**: Tech Lead  
**Status**: Active  
**Environment**: Development only - not for production
