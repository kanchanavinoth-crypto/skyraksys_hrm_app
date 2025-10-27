const axios = require('axios');

// Simple Frontend API Check
async function checkCriticalAPIs() {
  const baseURL = 'http://localhost:8080/api';
  let report = {
    timestamp: new Date().toISOString(),
    criticalAPIs: [],
    summary: { total: 0, working: 0, failed: 0 }
  };

  // Test login first
  console.log('🔐 Testing Login...');
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.accessToken;
      console.log('✅ Login successful');
      
      report.criticalAPIs.push({
        endpoint: 'POST /auth/login',
        status: 'WORKING',
        message: 'Authentication successful'
      });
      report.summary.total++;
      report.summary.working++;

      // Test critical endpoints with token
      const criticalEndpoints = [
        { method: 'GET', path: '/employees', name: 'Employee List' },
        { method: 'GET', path: '/employees/meta/departments', name: 'Departments' },
        { method: 'GET', path: '/employees/meta/positions', name: 'Positions' },
        { method: 'GET', path: '/leaves', name: 'Leave Requests' },
        { method: 'GET', path: '/leaves/types', name: 'Leave Types' },
        { method: 'GET', path: '/timesheets', name: 'Timesheets' },
        { method: 'GET', path: '/timesheets/meta/projects', name: 'Projects' },
        { method: 'GET', path: '/payslips', name: 'Payslips' }
      ];

      for (const endpoint of criticalEndpoints) {
        console.log(`🔍 Testing ${endpoint.name}...`);
        try {
          const response = await axios({
            method: endpoint.method,
            url: `${baseURL}${endpoint.path}`,
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          });

          if (response.data.success) {
            console.log(`✅ ${endpoint.name} - Working`);
            report.criticalAPIs.push({
              endpoint: `${endpoint.method} ${endpoint.path}`,
              status: 'WORKING',
              message: `${endpoint.name} API is functional`
            });
            report.summary.working++;
          } else {
            console.log(`⚠️  ${endpoint.name} - Partial success`);
            report.criticalAPIs.push({
              endpoint: `${endpoint.method} ${endpoint.path}`,
              status: 'PARTIAL',
              message: `${endpoint.name} API returned success=false`
            });
          }
        } catch (error) {
          console.log(`❌ ${endpoint.name} - Failed: ${error.message}`);
          report.criticalAPIs.push({
            endpoint: `${endpoint.method} ${endpoint.path}`,
            status: 'FAILED',
            message: `${endpoint.name} API failed: ${error.response?.status || 'Network Error'}`
          });
          report.summary.failed++;
        }
        report.summary.total++;
      }

    } else {
      console.log('❌ Login failed');
      report.criticalAPIs.push({
        endpoint: 'POST /auth/login',
        status: 'FAILED',
        message: 'Authentication failed'
      });
      report.summary.total++;
      report.summary.failed++;
    }

  } catch (error) {
    console.log('❌ Login failed:', error.message);
    report.criticalAPIs.push({
      endpoint: 'POST /auth/login',
      status: 'FAILED',
      message: `Authentication failed: ${error.message}`
    });
    report.summary.total++;
    report.summary.failed++;
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 CRITICAL API STATUS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total APIs Tested: ${report.summary.total}`);
  console.log(`✅ Working: ${report.summary.working}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  
  const successRate = (report.summary.working / report.summary.total) * 100;
  console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);

  console.log('\n📋 DETAILED RESULTS:');
  report.criticalAPIs.forEach(api => {
    const icon = api.status === 'WORKING' ? '✅' : api.status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`${icon} ${api.endpoint}: ${api.message}`);
  });

  // Save report
  require('fs').writeFileSync(
    `critical-api-check-${Date.now()}.json`, 
    JSON.stringify(report, null, 2)
  );

  console.log('\n🎯 FRONTEND READINESS ASSESSMENT:');
  if (successRate >= 90) {
    console.log('🟢 READY FOR PRODUCTION - All critical APIs working');
  } else if (successRate >= 75) {
    console.log('🟡 MOSTLY READY - Minor issues to fix');
  } else {
    console.log('🔴 NOT READY - Significant issues need addressing');
  }

  return report;
}

// Run the check
checkCriticalAPIs()
  .then(report => {
    console.log(`\n📄 Report saved as: critical-api-check-${Date.now()}.json`);
  })
  .catch(error => {
    console.error('❌ Critical API check failed:', error);
    process.exit(1);
  });
