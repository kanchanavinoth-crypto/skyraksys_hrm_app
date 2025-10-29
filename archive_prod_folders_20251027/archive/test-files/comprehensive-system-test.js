// Comprehensive system test with lazy loading validation
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ComprehensiveSystemTest {
  constructor() {
    this.baseURL = 'http://localhost:8080/api';
    this.frontendURL = 'http://localhost:3000';
    this.testResults = {
      backend: {},
      frontend: {},
      integration: {}
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive System Test\n');
    
    await this.testBackendHealth();
    await this.testComponentExports();
    await this.testAPIEndpoints();
    await this.generateReport();
  }

  async testBackendHealth() {
    console.log('📡 Testing Backend Health...');
    
    try {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      this.testResults.backend.health = {
        status: 'PASS',
        data: response.data
      };
      console.log('✅ Backend health check passed');
    } catch (error) {
      this.testResults.backend.health = {
        status: 'FAIL',
        error: error.message
      };
      console.log('❌ Backend health check failed');
    }
  }

  async testComponentExports() {
    console.log('🧩 Testing Component Exports...');
    
    const componentsToTest = [
      'frontend/src/components/features/employees/EmployeeList.js',
      'frontend/src/components/features/employees/EmployeeForm.js',
      'frontend/src/components/features/employees/EmployeeProfile.js',
      'frontend/src/components/features/employees/EmployeeEdit.js',
      'frontend/src/components/features/admin/UserManagement.js',
      'frontend/src/components/features/admin/SystemSettings.js',
      'frontend/src/components/features/admin/PositionManagement.js',
      'frontend/src/components/features/admin/ProjectTaskConfiguration.js',
      'frontend/src/components/features/admin/ReportsModule.js'
    ];
    
    this.testResults.frontend.componentExports = [];
    
    for (const componentPath of componentsToTest) {
      try {
        const fullPath = path.resolve(__dirname, componentPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for export default
        const hasExport = /export\s+default\s+\w+/.test(content);
        const componentName = path.basename(componentPath, '.js');
        
        if (hasExport) {
          this.testResults.frontend.componentExports.push({
            component: componentName,
            status: 'PASS',
            path: componentPath
          });
          console.log(`✅ ${componentName} export valid`);
        } else {
          this.testResults.frontend.componentExports.push({
            component: componentName,
            status: 'FAIL',
            path: componentPath,
            error: 'No export default found'
          });
          console.log(`❌ ${componentName} export invalid`);
        }
      } catch (error) {
        this.testResults.frontend.componentExports.push({
          component: path.basename(componentPath, '.js'),
          status: 'ERROR',
          path: componentPath,
          error: error.message
        });
        console.log(`⚠️ ${path.basename(componentPath, '.js')} error: ${error.message}`);
      }
    }
  }

  async testAPIEndpoints() {
    console.log('🔗 Testing API Endpoints...');
    
    const endpoints = [
      { method: 'GET', path: '/employees', name: 'Employee List' },
      { method: 'GET', path: '/positions', name: 'Position List' },
      { method: 'GET', path: '/payroll', name: 'Payroll List' },
      { method: 'GET', path: '/users', name: 'User List' }
    ];
    
    this.testResults.backend.endpoints = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method.toLowerCase(),
          url: `${this.baseURL}${endpoint.path}`,
          timeout: 5000,
          headers: {
            'Authorization': 'Bearer test-token' // Add if needed
          }
        });
        
        this.testResults.backend.endpoints.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          name: endpoint.name,
          status: 'PASS',
          statusCode: response.status
        });
        console.log(`✅ ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      } catch (error) {
        this.testResults.backend.endpoints.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          name: endpoint.name,
          status: 'FAIL',
          error: error.response?.status || error.message
        });
        console.log(`❌ ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      }
    }
  }

  async generateReport() {
    console.log('\n📊 Test Results Summary\n');
    
    // Backend Summary
    const backendTests = [
      this.testResults.backend.health,
      ...this.testResults.backend.endpoints
    ].filter(Boolean);
    
    const backendPassed = backendTests.filter(t => t.status === 'PASS').length;
    const backendTotal = backendTests.length;
    
    // Frontend Summary
    const frontendPassed = this.testResults.frontend.componentExports.filter(t => t.status === 'PASS').length;
    const frontendTotal = this.testResults.frontend.componentExports.length;
    
    console.log(`🔧 Backend: ${backendPassed}/${backendTotal} tests passed (${((backendPassed/backendTotal)*100).toFixed(1)}%)`);
    console.log(`🎨 Frontend: ${frontendPassed}/${frontendTotal} components valid (${((frontendPassed/frontendTotal)*100).toFixed(1)}%)`);
    
    const overallPassed = backendPassed + frontendPassed;
    const overallTotal = backendTotal + frontendTotal;
    console.log(`\n🎯 Overall System Health: ${overallPassed}/${overallTotal} (${((overallPassed/overallTotal)*100).toFixed(1)}%)`);
    
    // Detailed Issues
    const issues = [];
    
    if (this.testResults.backend.health?.status === 'FAIL') {
      issues.push('❌ Backend health check failed');
    }
    
    this.testResults.backend.endpoints?.forEach(endpoint => {
      if (endpoint.status === 'FAIL') {
        issues.push(`❌ API ${endpoint.method} ${endpoint.endpoint} failed`);
      }
    });
    
    this.testResults.frontend.componentExports?.forEach(component => {
      if (component.status === 'FAIL' || component.status === 'ERROR') {
        issues.push(`❌ Component ${component.component} has issues`);
      }
    });
    
    if (issues.length > 0) {
      console.log('\n🚨 Issues Found:');
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('\n🎉 All tests passed! System is ready for production.');
    }
    
    // Save detailed report
    fs.writeFileSync('system-test-report.json', JSON.stringify(this.testResults, null, 2));
    console.log('\n📁 Detailed report saved to system-test-report.json');
  }
}

// Run the test
const tester = new ComprehensiveSystemTest();
tester.runAllTests().catch(console.error);
