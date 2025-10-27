const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseURL: 'http://localhost:8080/api',
  timeout: 30000,
  frontendURL: 'http://localhost:3000'
};

// Test credentials from backend
const testCredentials = {
  admin: {
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t',
    role: 'admin'
  },
  hr: {
    email: 'hr@company.com', 
    password: 'Lw3nQ6xY8mD4vB7h',
    role: 'hr'
  },
  employee: {
    email: 'employee@company.com',
    password: 'Mv4pS9wE2nR6kA8j',
    role: 'employee'
  }
};

class FrontendAPIValidator {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      categories: {},
      recommendations: []
    };
    this.tokens = {};
  }

  // Utility function to make HTTP requests with proper error handling
  async makeRequest(method, url, data = null, token = null, role = null) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios({
        method,
        url: `${config.baseURL}${url}`,
        data,
        headers,
        timeout: config.timeout
      });

      return {
        success: true,
        status: response.status,
        data: response.data,
        role: role
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 0,
        data: error.response?.data || null,
        error: error.message,
        role: role
      };
    }
  }

  // Test authentication for all roles
  async testAuthentication() {
    const category = 'Authentication APIs';
    this.report.categories[category] = [];

    console.log('\n🔐 Testing Authentication APIs...');

    for (const [role, credentials] of Object.entries(testCredentials)) {
      const testName = `Login as ${role}`;
      console.log(`  Testing: ${testName}`);
      
      const result = await this.makeRequest('POST', '/auth/login', {
        email: credentials.email,
        password: credentials.password
      });

      if (result.success && result.data.success) {
        this.tokens[role] = result.data.data.accessToken;
        this.addTestResult(category, testName, 'PASS', `Successfully logged in as ${role}`, result);
        
        // Test profile retrieval
        const profileTest = `Get ${role} profile`;
        console.log(`  Testing: ${profileTest}`);
        const profileResult = await this.makeRequest('GET', '/auth/me', null, this.tokens[role], role);
        
        if (profileResult.success && profileResult.data.success) {
          this.addTestResult(category, profileTest, 'PASS', `Successfully retrieved ${role} profile`, profileResult);
        } else {
          this.addTestResult(category, profileTest, 'FAIL', `Failed to retrieve ${role} profile`, profileResult);
        }
      } else {
        this.addTestResult(category, testName, 'FAIL', `Failed to login as ${role}`, result);
      }
    }
  }

  // Test employee management APIs
  async testEmployeeAPIs() {
    const category = 'Employee Management APIs';
    this.report.categories[category] = [];

    console.log('\n👥 Testing Employee Management APIs...');

    for (const [role, token] of Object.entries(this.tokens)) {
      // Test getting all employees
      const testName = `GET /employees (${role})`;
      console.log(`  Testing: ${testName}`);
      
      const result = await this.makeRequest('GET', '/employees', null, token, role);
      
      if (result.success && result.data.success) {
        this.addTestResult(category, testName, 'PASS', `Successfully retrieved employees as ${role}`, result);
      } else {
        this.addTestResult(category, testName, 'FAIL', `Failed to retrieve employees as ${role}`, result);
      }

      // Test getting employee by ID (if employees exist)
      if (result.success && result.data.data && result.data.data.length > 0) {
        const employeeId = result.data.data[0].id;
        const testNameById = `GET /employees/:id (${role})`;
        console.log(`  Testing: ${testNameById}`);
        
        const byIdResult = await this.makeRequest('GET', `/employees/${employeeId}`, null, token, role);
        
        if (byIdResult.success && byIdResult.data.success) {
          this.addTestResult(category, testNameById, 'PASS', `Successfully retrieved employee by ID as ${role}`, byIdResult);
        } else {
          this.addTestResult(category, testNameById, 'FAIL', `Failed to retrieve employee by ID as ${role}`, byIdResult);
        }
      }

      // Test metadata endpoints
      const metaEndpoints = [
        '/employees/meta/departments',
        '/employees/meta/positions'
      ];

      for (const endpoint of metaEndpoints) {
        const testMeta = `GET ${endpoint} (${role})`;
        console.log(`  Testing: ${testMeta}`);
        
        const metaResult = await this.makeRequest('GET', endpoint, null, token, role);
        
        if (metaResult.success && metaResult.data.success) {
          this.addTestResult(category, testMeta, 'PASS', `Successfully retrieved metadata as ${role}`, metaResult);
        } else {
          this.addTestResult(category, testMeta, 'FAIL', `Failed to retrieve metadata as ${role}`, metaResult);
        }
      }

      // Test employee creation (admin/hr only)
      if (['admin', 'hr'].includes(role)) {
        const createTestName = `POST /employees (${role})`;
        console.log(`  Testing: ${createTestName}`);
        
        const newEmployee = {
          employeeId: `TEST${Date.now()}`,
          firstName: 'Test',
          lastName: 'Employee',
          email: `test.employee.${Date.now()}@company.com`,
          departmentId: null,
          positionId: null,
          hireDate: new Date().toISOString().split('T')[0],
          status: 'active',
          employmentType: 'full-time'
        };

        // First get departments and positions
        const deptResult = await this.makeRequest('GET', '/employees/meta/departments', null, token, role);
        const posResult = await this.makeRequest('GET', '/employees/meta/positions', null, token, role);

        if (deptResult.success && posResult.success && 
            deptResult.data.data.length > 0 && posResult.data.data.length > 0) {
          newEmployee.departmentId = deptResult.data.data[0].id;
          newEmployee.positionId = posResult.data.data[0].id;
        }

        const createResult = await this.makeRequest('POST', '/employees', newEmployee, token, role);
        
        if (createResult.success && createResult.data.success) {
          this.addTestResult(category, createTestName, 'PASS', `Successfully created employee as ${role}`, createResult);
        } else {
          this.addTestResult(category, createTestName, 'FAIL', `Failed to create employee as ${role}`, createResult);
        }
      }
    }
  }

  // Test leave management APIs
  async testLeaveAPIs() {
    const category = 'Leave Management APIs';
    this.report.categories[category] = [];

    console.log('\n🏖️ Testing Leave Management APIs...');

    for (const [role, token] of Object.entries(this.tokens)) {
      // Test getting all leave requests
      const testName = `GET /leaves (${role})`;
      console.log(`  Testing: ${testName}`);
      
      const result = await this.makeRequest('GET', '/leaves', null, token, role);
      
      if (result.success && result.data.success) {
        this.addTestResult(category, testName, 'PASS', `Successfully retrieved leaves as ${role}`, result);
      } else {
        this.addTestResult(category, testName, 'FAIL', `Failed to retrieve leaves as ${role}`, result);
      }

      // Test leave types endpoint
      const typesTest = `GET /leaves/types (${role})`;
      console.log(`  Testing: ${typesTest}`);
      
      const typesResult = await this.makeRequest('GET', '/leaves/types', null, token, role);
      
      if (typesResult.success && typesResult.data.success) {
        this.addTestResult(category, typesTest, 'PASS', `Successfully retrieved leave types as ${role}`, typesResult);
      } else {
        this.addTestResult(category, typesTest, 'FAIL', `Failed to retrieve leave types as ${role}`, typesResult);
      }

      // Test leave balance endpoint
      const balanceTest = `GET /leaves/balance (${role})`;
      console.log(`  Testing: ${balanceTest}`);
      
      const balanceResult = await this.makeRequest('GET', '/leaves/balance', null, token, role);
      
      if (balanceResult.success && balanceResult.data.success) {
        this.addTestResult(category, balanceTest, 'PASS', `Successfully retrieved leave balance as ${role}`, balanceResult);
      } else {
        this.addTestResult(category, balanceTest, 'FAIL', `Failed to retrieve leave balance as ${role}`, balanceResult);
      }

      // Test creating leave request
      const createLeaveTest = `POST /leaves (${role})`;
      console.log(`  Testing: ${createLeaveTest}`);
      
      // Get leave types first
      if (typesResult.success && typesResult.data.data && typesResult.data.data.length > 0) {
        const leaveTypeId = typesResult.data.data[0].id;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        
        const leaveRequest = {
          leaveTypeId: leaveTypeId,
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: dayAfterTomorrow.toISOString().split('T')[0],
          reason: 'API Testing leave request',
          isHalfDay: false
        };

        const createLeaveResult = await this.makeRequest('POST', '/leaves', leaveRequest, token, role);
        
        if (createLeaveResult.success && createLeaveResult.data.success) {
          this.addTestResult(category, createLeaveTest, 'PASS', `Successfully created leave request as ${role}`, createLeaveResult);
        } else {
          this.addTestResult(category, createLeaveTest, 'FAIL', `Failed to create leave request as ${role}`, createLeaveResult);
        }
      } else {
        this.addTestResult(category, createLeaveTest, 'SKIP', `Skipped leave creation - no leave types available`, {});
      }
    }
  }

  // Test timesheet management APIs
  async testTimesheetAPIs() {
    const category = 'Timesheet Management APIs';
    this.report.categories[category] = [];

    console.log('\n⏰ Testing Timesheet Management APIs...');

    for (const [role, token] of Object.entries(this.tokens)) {
      // Test getting all timesheets
      const testName = `GET /timesheets (${role})`;
      console.log(`  Testing: ${testName}`);
      
      const result = await this.makeRequest('GET', '/timesheets', null, token, role);
      
      if (result.success && result.data.success) {
        this.addTestResult(category, testName, 'PASS', `Successfully retrieved timesheets as ${role}`, result);
      } else {
        this.addTestResult(category, testName, 'FAIL', `Failed to retrieve timesheets as ${role}`, result);
      }

      // Test projects metadata
      const projectsTest = `GET /timesheets/meta/projects (${role})`;
      console.log(`  Testing: ${projectsTest}`);
      
      const projectsResult = await this.makeRequest('GET', '/timesheets/meta/projects', null, token, role);
      
      if (projectsResult.success && projectsResult.data.success) {
        this.addTestResult(category, projectsTest, 'PASS', `Successfully retrieved projects as ${role}`, projectsResult);
      } else {
        this.addTestResult(category, projectsTest, 'FAIL', `Failed to retrieve projects as ${role}`, projectsResult);
      }

      // Test creating timesheet
      const createTimesheetTest = `POST /timesheets (${role})`;
      console.log(`  Testing: ${createTimesheetTest}`);
      
      // Get projects first
      if (projectsResult.success && projectsResult.data.data && projectsResult.data.data.length > 0) {
        const projectId = projectsResult.data.data[0].id;
        const today = new Date().toISOString().split('T')[0];
        
        const timesheet = {
          date: today,
          projectId: projectId,
          taskDescription: 'API Testing task',
          hoursWorked: 8,
          comments: 'Testing timesheet creation via API'
        };

        const createResult = await this.makeRequest('POST', '/timesheets', timesheet, token, role);
        
        if (createResult.success && createResult.data.success) {
          this.addTestResult(category, createTimesheetTest, 'PASS', `Successfully created timesheet as ${role}`, createResult);
        } else {
          this.addTestResult(category, createTimesheetTest, 'FAIL', `Failed to create timesheet as ${role}`, createResult);
        }
      } else {
        this.addTestResult(category, createTimesheetTest, 'SKIP', `Skipped timesheet creation - no projects available`, {});
      }
    }
  }

  // Test payslip management APIs
  async testPayslipAPIs() {
    const category = 'Payslip Management APIs';
    this.report.categories[category] = [];

    console.log('\n💰 Testing Payslip Management APIs...');

    for (const [role, token] of Object.entries(this.tokens)) {
      // Test getting all payslips
      const testName = `GET /payslips (${role})`;
      console.log(`  Testing: ${testName}`);
      
      const result = await this.makeRequest('GET', '/payslips', null, token, role);
      
      if (result.success && result.data.success) {
        this.addTestResult(category, testName, 'PASS', `Successfully retrieved payslips as ${role}`, result);
      } else {
        this.addTestResult(category, testName, 'FAIL', `Failed to retrieve payslips as ${role}`, result);
      }

      // Test payroll generation (admin/hr only)
      if (['admin', 'hr'].includes(role)) {
        const generateTest = `POST /payslips/generate (${role})`;
        console.log(`  Testing: ${generateTest}`);
        
        // Get an employee first
        const employeesResult = await this.makeRequest('GET', '/employees', null, token, role);
        
        if (employeesResult.success && employeesResult.data.data && employeesResult.data.data.length > 0) {
          const employeeId = employeesResult.data.data[0].id;
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          
          const payrollData = {
            employeeId: employeeId,
            payPeriod: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
          };

          const generateResult = await this.makeRequest('POST', '/payslips/generate', payrollData, token, role);
          
          if (generateResult.success && generateResult.data.success) {
            this.addTestResult(category, generateTest, 'PASS', `Successfully generated payslip as ${role}`, generateResult);
          } else {
            this.addTestResult(category, generateTest, 'FAIL', `Failed to generate payslip as ${role}`, generateResult);
          }
        } else {
          this.addTestResult(category, generateTest, 'SKIP', `Skipped payslip generation - no employees available`, {});
        }
      }
    }
  }

  // Test frontend-specific endpoints
  async testFrontendSpecificAPIs() {
    const category = 'Frontend Integration APIs';
    this.report.categories[category] = [];

    console.log('\n🖥️ Testing Frontend Integration APIs...');

    // Test dashboard data endpoints
    const dashboardEndpoints = [
      '/employees/meta/dashboard',
      '/leaves/statistics',
      '/timesheets/summary',
      '/payslips/meta/dashboard'
    ];

    for (const [role, token] of Object.entries(this.tokens)) {
      for (const endpoint of dashboardEndpoints) {
        const testName = `GET ${endpoint} (${role})`;
        console.log(`  Testing: ${testName}`);
        
        const result = await this.makeRequest('GET', endpoint, null, token, role);
        
        if (result.success && result.data.success) {
          this.addTestResult(category, testName, 'PASS', `Successfully retrieved dashboard data as ${role}`, result);
        } else {
          this.addTestResult(category, testName, 'FAIL', `Failed to retrieve dashboard data as ${role}`, result);
        }
      }
    }
  }

  // Add test result to report
  addTestResult(category, testName, status, message, result) {
    const testResult = {
      test: testName,
      status: status,
      message: message,
      timestamp: new Date().toISOString(),
      details: {
        httpStatus: result.status,
        role: result.role,
        success: result.success,
        data: result.success ? (result.data?.data || result.data) : result.error
      }
    };

    if (!this.report.categories[category]) {
      this.report.categories[category] = [];
    }

    this.report.categories[category].push(testResult);
    
    this.report.summary.total++;
    if (status === 'PASS') {
      this.report.summary.passed++;
    } else if (status === 'FAIL') {
      this.report.summary.failed++;
    } else if (status === 'SKIP') {
      this.report.summary.warnings++;
    }

    // Console output with colors
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`    ${statusIcon} ${testName}: ${message}`);
  }

  // Generate recommendations based on test results
  generateRecommendations() {
    console.log('\n📋 Generating recommendations...');

    for (const [category, tests] of Object.entries(this.report.categories)) {
      const failedTests = tests.filter(t => t.status === 'FAIL');
      const passedTests = tests.filter(t => t.status === 'PASS');
      
      if (failedTests.length > 0) {
        this.report.recommendations.push({
          category: category,
          priority: 'HIGH',
          issue: `${failedTests.length} failed tests in ${category}`,
          recommendation: `Review and fix failed API endpoints in ${category}`
        });
      }

      if (passedTests.length === tests.length && tests.length > 0) {
        this.report.recommendations.push({
          category: category,
          priority: 'INFO',
          issue: 'All tests passed',
          recommendation: `${category} is working correctly`
        });
      }
    }

    // Overall system recommendations
    const successRate = (this.report.summary.passed / this.report.summary.total) * 100;
    
    if (successRate >= 90) {
      this.report.recommendations.push({
        category: 'Overall System',
        priority: 'INFO',
        issue: `Excellent API coverage (${successRate.toFixed(1)}%)`,
        recommendation: 'Frontend APIs are ready for production'
      });
    } else if (successRate >= 75) {
      this.report.recommendations.push({
        category: 'Overall System',
        priority: 'MEDIUM',
        issue: `Good API coverage (${successRate.toFixed(1)}%)`,
        recommendation: 'Minor fixes needed before production deployment'
      });
    } else {
      this.report.recommendations.push({
        category: 'Overall System',
        priority: 'HIGH',
        issue: `Low API coverage (${successRate.toFixed(1)}%)`,
        recommendation: 'Significant fixes required before production deployment'
      });
    }
  }

  // Save report to file
  async saveReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, `frontend-api-validation-report-${timestamp}.json`);
    
    try {
      await fs.promises.writeFile(reportPath, JSON.stringify(this.report, null, 2));
      console.log(`\n📄 Report saved to: ${reportPath}`);
      return reportPath;
    } catch (error) {
      console.error('Failed to save report:', error);
      return null;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Frontend API Validation...');
    console.log(`🔗 Testing against: ${config.baseURL}`);
    console.log(`🌐 Frontend URL: ${config.frontendURL}`);

    try {
      await this.testAuthentication();
      await this.testEmployeeAPIs();
      await this.testLeaveAPIs();
      await this.testTimesheetAPIs();
      await this.testPayslipAPIs();
      await this.testFrontendSpecificAPIs();

      this.generateRecommendations();

      // Print summary
      console.log('\n' + '='.repeat(80));
      console.log('📊 FRONTEND API VALIDATION SUMMARY');
      console.log('='.repeat(80));
      console.log(`Total Tests: ${this.report.summary.total}`);
      console.log(`✅ Passed: ${this.report.summary.passed}`);
      console.log(`❌ Failed: ${this.report.summary.failed}`);
      console.log(`⚠️  Skipped: ${this.report.summary.warnings}`);
      
      const successRate = (this.report.summary.passed / this.report.summary.total) * 100;
      console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);

      console.log('\n🔍 RECOMMENDATIONS:');
      this.report.recommendations.forEach(rec => {
        const icon = rec.priority === 'HIGH' ? '🚨' : rec.priority === 'MEDIUM' ? '⚠️' : '✅';
        console.log(`${icon} ${rec.category}: ${rec.recommendation}`);
      });

      const reportPath = await this.saveReport();
      
      console.log('\n' + '='.repeat(80));
      console.log('🎯 FRONTEND API VALIDATION COMPLETE');
      console.log('='.repeat(80));

      return this.report;

    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }
}

// Run the validation
if (require.main === module) {
  const validator = new FrontendAPIValidator();
  validator.runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Validation process failed:', error);
      process.exit(1);
    });
}

module.exports = FrontendAPIValidator;
