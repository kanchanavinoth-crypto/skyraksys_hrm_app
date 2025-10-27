#!/usr/bin/env node

/**
 * Quick Application Validation Test
 * Tests core functionality to verify system health
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const CONFIG = {
  baseURL: 'http://localhost:8080/api',
  frontendURL: 'http://localhost:3000',
  timeout: 5000
};

// Test Results
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors_map = {
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'cyan',
    header: 'magenta'
  };
  console.log(`[${timestamp}] ${message}`[colors_map[type] || 'white']);
};

const recordTest = (testName, passed, details = null, error = null) => {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ ${testName}`, 'success');
  } else {
    testResults.failed++;
    log(`❌ ${testName}`, 'error');
    if (error) log(`   ${error.message || error}`, 'error');
  }
  
  testResults.details.push({
    test: testName,
    passed,
    details,
    error: error?.message || error,
    timestamp: new Date().toISOString()
  });
};

// HTTP Client
const api = axios.create({
  baseURL: CONFIG.baseURL,
  timeout: CONFIG.timeout,
  headers: { 'Content-Type': 'application/json' }
});

async function runQuickValidation() {
  log('🚀 Running Quick Application Validation', 'header');
  
  try {
    // Test 1: Backend Health Check
    try {
      const healthResponse = await api.get('/health');
      recordTest('Backend Health Check', 
        healthResponse.status === 200 && healthResponse.data.message,
        `Status: ${healthResponse.status}, Message: ${healthResponse.data.message}`);
    } catch (error) {
      recordTest('Backend Health Check', false, null, error);
    }

    // Test 2: Frontend Availability
    try {
      const frontendResponse = await axios.get(CONFIG.frontendURL, { timeout: CONFIG.timeout });
      recordTest('Frontend Availability', 
        frontendResponse.status === 200,
        `Status: ${frontendResponse.status}`);
    } catch (error) {
      recordTest('Frontend Availability', false, null, error);
    }

    // Test 3: Admin User Login
    try {
      const loginResponse = await api.post('/auth/login', {
        email: 'admin@skyraksys.com',
        password: 'Admin123!'
      });
      
      if (loginResponse.data.success && loginResponse.data.data.accessToken) {
        const token = loginResponse.data.data.accessToken;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        recordTest('Admin Login', true, `Token received: ${token.substring(0, 20)}...`);
        
        // Test 4: Protected Endpoint Access
        try {
          const employeesResponse = await api.get('/employees');
          recordTest('Protected Endpoint Access', 
            employeesResponse.status === 200,
            `Employees endpoint: ${employeesResponse.status}`);
        } catch (error) {
          recordTest('Protected Endpoint Access', false, null, error);
        }

        // Test 5: Timesheet Endpoints
        try {
          const timesheetsResponse = await api.get('/timesheets');
          recordTest('Timesheet System', 
            timesheetsResponse.status === 200,
            `Timesheets endpoint: ${timesheetsResponse.status}`);
        } catch (error) {
          recordTest('Timesheet System', false, null, error);
        }

        // Test 6: Leave Management
        try {
          const leavesResponse = await api.get('/leaves');
          recordTest('Leave Management System', 
            leavesResponse.status === 200,
            `Leaves endpoint: ${leavesResponse.status}`);
        } catch (error) {
          recordTest('Leave Management System', false, null, error);
        }

        // Test 7: Payroll System
        try {
          const payrollResponse = await api.get('/payroll');
          recordTest('Payroll System', 
            payrollResponse.status === 200,
            `Payroll endpoint: ${payrollResponse.status}`);
        } catch (error) {
          recordTest('Payroll System', false, null, error);
        }

        // Test 8: Timesheet Resubmit Feature (New)
        try {
          // First create a test timesheet
          const newTimesheet = {
            weekStarting: new Date().toISOString().split('T')[0],
            weekEnding: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            regularHours: 40,
            totalHours: 40,
            projectId: 1,
            taskId: 1,
            description: 'Test timesheet for resubmit validation'
          };
          
          const createResponse = await api.post('/timesheets', newTimesheet);
          if (createResponse.status === 201) {
            const timesheetId = createResponse.data.data.id;
            
            // Try the resubmit endpoint
            const resubmitResponse = await api.put(`/timesheets/${timesheetId}/resubmit`, {
              comments: 'Testing resubmit functionality'
            });
            
            recordTest('Timesheet Resubmit Feature', 
              resubmitResponse.status === 200,
              `Resubmit endpoint working: ${resubmitResponse.status}`);
          } else {
            recordTest('Timesheet Resubmit Feature', false, 'Could not create test timesheet');
          }
        } catch (error) {
          recordTest('Timesheet Resubmit Feature', false, null, error);
        }

      } else {
        recordTest('Admin Login', false, 'No token received');
      }
    } catch (error) {
      recordTest('Admin Login', false, null, error);
    }

    // Generate Summary
    const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    
    log('\n🏁 Quick Validation Complete!', 'header');
    log(`📊 Results: ${testResults.passed}/${testResults.total} tests passed (${passRate}%)`, 'info');
    
    if (testResults.failed > 0) {
      log('\n❌ Failed Tests:', 'error');
      testResults.details.filter(t => !t.passed).forEach(test => {
        log(`   - ${test.test}: ${test.error || 'Unknown error'}`, 'error');
      });
    }

    // Overall Assessment
    log('\n🎯 Overall Assessment:', 'header');
    if (passRate >= 90) {
      log('🟢 EXCELLENT - Your application is production ready!', 'success');
    } else if (passRate >= 75) {
      log('🟡 GOOD - Minor issues detected, review failed tests', 'warning');
    } else {
      log('🔴 NEEDS ATTENTION - Critical issues must be resolved', 'error');
    }

    // Key System Status
    const coreTests = ['Backend Health Check', 'Frontend Availability', 'Admin Login'];
    const coreTestsPassed = testResults.details.filter(t => 
      coreTests.includes(t.test) && t.passed).length;

    if (coreTestsPassed === coreTests.length) {
      log('✅ Core System: OPERATIONAL', 'success');
    } else {
      log('❌ Core System: ISSUES DETECTED', 'error');
    }

    const moduleTests = ['Timesheet System', 'Leave Management System', 'Payroll System'];
    const moduleTestsPassed = testResults.details.filter(t => 
      moduleTests.includes(t.test) && t.passed).length;

    if (moduleTestsPassed === moduleTests.length) {
      log('✅ HRM Modules: ALL FUNCTIONAL', 'success');
    } else {
      log(`⚠️  HRM Modules: ${moduleTestsPassed}/${moduleTests.length} working`, 'warning');
    }

    // Check new feature
    const resubmitTest = testResults.details.find(t => t.test === 'Timesheet Resubmit Feature');
    if (resubmitTest && resubmitTest.passed) {
      log('✅ New Feature: Timesheet Resubmit WORKING', 'success');
    } else {
      log('⚠️  New Feature: Timesheet Resubmit needs review', 'warning');
    }

    return passRate >= 75;

  } catch (error) {
    log(`💥 Validation failed: ${error.message}`, 'error');
    return false;
  }
}

// Run validation
runQuickValidation().then(success => {
  process.exit(success ? 0 : 1);
});
