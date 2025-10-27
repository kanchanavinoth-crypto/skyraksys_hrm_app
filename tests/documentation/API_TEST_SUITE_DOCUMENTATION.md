# 🧪 HRM API Test Suite - Complete Documentation

## 📖 Overview

This comprehensive API test suite validates all user scenarios and workflows for the SkyRakSys HRM system, including employee creation, timesheet management, leave requests, and payroll processing with complete role-based access testing.

**Current Status**: 86.4% success rate (19/22 tests passing)  
**Recommended Suite**: `fixed-api-test-suite.js`

## Test Suite Components

### 1. Quick API Test (`quick-api-test.js`)
- **Purpose**: Fast smoke tests for basic API functionality
- **Duration**: ~30-60 seconds
- **Coverage**: Core endpoints, authentication, basic CRUD operations
- **Best for**: Initial validation, CI/CD pipelines, quick health checks

### 2. Comprehensive API Test Suite (`comprehensive-api-test-suite.js`)
- **Purpose**: Thorough testing of all API endpoints
- **Duration**: ~5-10 minutes
- **Coverage**: All endpoints, edge cases, error handling, security
- **Best for**: Full regression testing, pre-deployment validation

### 3. Workflow Test Suite (`workflow-test-suite.js`)
- **Purpose**: End-to-end business workflow testing
- **Duration**: ~3-5 minutes
- **Coverage**: Complete user journeys from start to finish
- **Best for**: User acceptance testing, business logic validation

## Tested Workflows

### Employee Management
- ✅ Employee creation (HR/Admin only)
- ✅ Employee profile updates
- ✅ Role-based access control
- ✅ Employee listing and filtering

### Timesheet Management
- ✅ Timesheet creation by employees
- ✅ Timesheet editing and updates
- ✅ Manager approval workflow
- ✅ Manager rejection with feedback
- ✅ Project and task associations

### Leave Management
- ✅ Leave balance checking
- ✅ Leave request creation
- ✅ Leave type validation
- ✅ Manager approval/rejection
- ✅ Leave request status tracking

### Payroll and Payslip Operations
- ✅ Payroll processing (HR/Admin)
- ✅ Payslip generation (individual and bulk)
- ✅ Employee payslip access
- ✅ Unauthorized access prevention

### Authentication and Security
- ✅ User login for all roles (admin, HR, manager, employee)
- ✅ JWT token validation
- ✅ Password change workflows
- ✅ Role-based access control
- ✅ Unauthorized access prevention

## Quick Start

### Prerequisites
1. **Backend Server Running**: Ensure the HRM backend server is running on `http://localhost:3001`
2. **Node.js Installed**: Version 14+ required
3. **Test Data**: Default test users should be available in the system

### Running Tests

#### Option 1: Interactive Menu (Windows)
```bash
# Double-click or run from command prompt
run-api-tests.bat
```

#### Option 2: Command Line
```bash
# Run all tests
node test-runner.js

# Run specific test suite
node test-runner.js quick
node test-runner.js comprehensive
node test-runner.js workflow

# Health check only
node test-runner.js health
```

#### Option 3: Individual Test Suites
```bash
# Quick tests
node quick-api-test.js

# Comprehensive tests
node comprehensive-api-test-suite.js

# Workflow tests
node workflow-test-suite.js
```

## Test Configuration

### Default Test Users
The test suite uses these default user accounts:

| Role | Username | Password | Permissions |
|------|----------|----------|------------|
| Admin | admin@company.com | Mv4pS9wE2nR6kA8j | Full system access |
| HR | hr@company.com | Mv4pS9wE2nR6kA8j | Employee management, payroll |
| Manager | manager@company.com | Mv4pS9wE2nR6kA8j | Team management, approvals |
| Employee | employee@company.com | Mv4pS9wE2nR6kA8j | Self-service features |

### Configuration File (`test-config.json`)
```json
{
  "api": {
    "baseUrl": "http://localhost:3001/api",
    "timeout": 10000
  },
  "testSuites": {
    "quick": { "enabled": true },
    "comprehensive": { "enabled": true },
    "workflow": { "enabled": true }
  }
}
```

## API Endpoints Tested

### Authentication (`/api/auth`)
- `POST /login` - User authentication
- `GET /profile` - User profile retrieval
- `PUT /change-password` - Password updates
- `POST /register` - User registration

### Employee Management (`/api/employees`)
- `GET /` - List employees (role-based filtering)
- `GET /:id` - Get employee details
- `POST /` - Create employee (HR/Admin only)
- `PUT /:id` - Update employee
- `DELETE /:id` - Delete employee (HR/Admin only)
- `GET /meta/departments` - Get departments
- `GET /meta/positions` - Get positions

### Timesheet Management (`/api/timesheets`)
- `GET /` - List timesheets (role-based)
- `GET /:id` - Get timesheet details
- `POST /` - Create timesheet
- `PUT /:id` - Update timesheet
- `PUT /:id/status` - Approve/reject timesheet (Manager+)
- `GET /meta/projects` - Get projects
- `GET /meta/tasks` - Get tasks

### Leave Management (`/api/leave`)
- `GET /` - List leave requests (role-based)
- `GET /:id` - Get leave request details
- `POST /` - Create leave request
- `PUT /:id/status` - Approve/reject leave (Manager+)
- `GET /meta/types` - Get leave types
- `GET /meta/balance` - Get leave balance

### Payroll Management (`/api/payrolls`)
- `GET /` - List payrolls (HR/Admin only)
- `POST /` - Process payroll (HR/Admin only)

### System Health (`/api/health`)
- `GET /` - System health check

## Test Results and Reporting

### Console Output
- Real-time test execution with colored output
- Progress indicators and status messages
- Immediate pass/fail feedback

### JSON Reports
- `test-results.json` - Comprehensive test results
- `workflow-test-report.json` - Workflow-specific results
- `test-summary-report.json` - Combined summary report

### Report Contents
- Test execution summary
- Individual test results
- Performance metrics
- Error details and debugging information
- Recommendations for failed tests

## Common Test Scenarios

### 1. Employee Onboarding Workflow
1. HR creates new employee record
2. Employee accesses their profile
3. Employee updates personal information
4. HR sets up salary structure
5. System generates user account

### 2. Timesheet Approval Cycle
1. Employee creates timesheet entry
2. Employee edits timesheet details
3. Manager reviews pending timesheets
4. Manager approves/rejects with comments
5. Employee views approval status

### 3. Leave Request Process
1. Employee checks leave balance
2. Employee submits leave request
3. Manager reviews pending requests
4. Manager approves/rejects with reason
5. System updates leave balance

### 4. Payroll Processing
1. HR processes monthly payroll
2. System generates payslips
3. Employees access their payslips
4. Unauthorized access is blocked

## Troubleshooting

### Common Issues

#### Server Not Running
```
❌ Server health check failed
```
**Solution**: Start the backend server:
```bash
cd backend
npm start
```

#### Authentication Failures
```
❌ Login as [role] failed
```
**Solution**: Verify test user accounts exist in the database

#### Permission Errors
```
❌ Access denied (403)
```
**Solution**: Check role-based access control is working correctly

#### Database Connection Issues
```
❌ Database connection failed
```
**Solution**: Ensure PostgreSQL is running and configured

### Debugging Tips

1. **Check Server Logs**: Monitor backend console for error messages
2. **Verify Database**: Ensure test data exists
3. **Network Issues**: Confirm API endpoints are accessible
4. **Token Expiry**: Check JWT token validity periods

## Test Development Guidelines

### Adding New Tests

1. **Follow Naming Convention**: Use descriptive test names
2. **Include Error Handling**: Test both success and failure scenarios
3. **Clean Up**: Remove test data after execution
4. **Document**: Add comments explaining test purpose

### Test Structure
```javascript
async testNewFeature() {
    await this.log('Testing new feature...', 'process');
    
    try {
        // Test implementation
        const result = await this.makeRequest('POST', '/endpoint', data, token);
        
        await this.recordTest(
            'Feature test description',
            result.success,
            result.success ? 'Success details' : result.error
        );
        
    } catch (error) {
        await this.recordTest('Feature test', false, error.message);
    }
}
```

## Performance Benchmarks

### Expected Execution Times
- Quick Tests: 30-60 seconds
- Comprehensive Tests: 5-10 minutes
- Workflow Tests: 3-5 minutes
- All Tests Combined: 8-15 minutes

### Success Rate Targets
- Quick Tests: >95% pass rate
- Comprehensive Tests: >90% pass rate
- Workflow Tests: >85% pass rate

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Start Backend
        run: |
          cd backend
          npm install
          npm start &
      - name: Run API Tests
        run: node test-runner.js quick
```

## Support and Maintenance

### Regular Maintenance Tasks
1. Update test data as business rules change
2. Add tests for new API endpoints
3. Update user credentials if changed
4. Review and update test timeouts
5. Maintain test documentation

### Getting Help
- Check console output for detailed error messages
- Review generated JSON reports for debugging information
- Verify backend server logs for API errors
- Ensure database connectivity and test data availability

---

## Quick Reference Commands

```bash
# Health check
node test-runner.js health

# Quick validation
node test-runner.js quick

# Full testing
node test-runner.js

# Workflow testing only
node test-runner.js workflow

# Windows interactive menu
run-api-tests.bat
```

This test suite provides comprehensive coverage of your HRM system's API functionality and ensures reliable operation across all user roles and business workflows.
