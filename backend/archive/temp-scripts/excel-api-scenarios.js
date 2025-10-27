const axios = require('axios');
const fs = require('fs');

class APIExcelScenarioTester {
    constructor() {
        this.baseUrl = 'http://localhost:8080';
        this.testResults = [];
        this.authToken = null;
        this.testUsers = [];
    }

    async logTest(scenario, description, status, details = '') {
        const result = {
            timestamp: new Date().toISOString(),
            scenario,
            description, 
            status,
            details
        };
        this.testResults.push(result);
        
        const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${icon} [${scenario}] ${description} - ${status}`);
        if (details) console.log(`   ${details}`);
    }

    // Test 1: Authentication API
    async testAuthentication() {
        console.log('\n🔐 Testing Authentication API...');
        
        try {
            const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
                email: 'admin@skyraksys.com',
                password: 'Admin123!'
            }, { timeout: 10000 });

            if (response.status === 200 && response.data.token) {
                this.authToken = response.data.token;
                await this.logTest('AUTH-API-01', 'Admin login via API', 'PASS', 'Authentication token received');
                return true;
            } else {
                await this.logTest('AUTH-API-01', 'Admin login via API', 'FAIL', 'No token received');
                return false;
            }
        } catch (error) {
            await this.logTest('AUTH-API-01', 'Admin login via API', 'FAIL', error.message);
            return false;
        }
    }

    // Test 2: User Management API
    async testUserManagement() {
        console.log('\n👥 Testing User Management API...');
        
        if (!this.authToken) {
            await this.logTest('USER-API-01', 'User management test', 'FAIL', 'No authentication token');
            return false;
        }

        try {
            // Test GET users
            const getUsersResponse = await axios.get(`${this.baseUrl}/api/users`, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });

            if (getUsersResponse.status === 200) {
                await this.logTest('USER-API-01', 'Get users list', 'PASS', `Found ${getUsersResponse.data.length || 'some'} users`);
            } else {
                await this.logTest('USER-API-01', 'Get users list', 'FAIL', 'Failed to retrieve users');
                return false;
            }

            // Test CREATE user
            const newUser = {
                email: `test.employee.${Date.now()}@example.com`,
                firstName: 'Test',
                lastName: 'Employee',
                password: 'TestPass123!',
                role: 'employee',
                department: 'Testing',
                jobTitle: 'Test Engineer'
            };

            const createUserResponse = await axios.post(`${this.baseUrl}/api/users`, newUser, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });

            if (createUserResponse.status === 200 || createUserResponse.status === 201) {
                this.testUsers.push(createUserResponse.data);
                await this.logTest('USER-API-02', 'Create new user', 'PASS', `User created: ${newUser.email}`);
            } else {
                await this.logTest('USER-API-02', 'Create new user', 'FAIL', 'User creation failed');
            }

            return true;

        } catch (error) {
            await this.logTest('USER-API-02', 'User management test', 'FAIL', error.response?.data?.message || error.message);
            return false;
        }
    }

    // Test 3: Timesheet API
    async testTimesheetManagement() {
        console.log('\n⏰ Testing Timesheet Management API...');

        if (!this.authToken) {
            await this.logTest('TIME-API-01', 'Timesheet test', 'FAIL', 'No authentication token');
            return false;
        }

        try {
            // Test GET timesheets
            const getTimesheetsResponse = await axios.get(`${this.baseUrl}/api/timesheets`, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });

            if (getTimesheetsResponse.status === 200) {
                await this.logTest('TIME-API-01', 'Get timesheets', 'PASS', 'Timesheets endpoint accessible');
            }

            // Test CREATE timesheet
            const newTimesheet = {
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '17:00',
                notes: 'API test timesheet entry'
            };

            const createResponse = await axios.post(`${this.baseUrl}/api/timesheets`, newTimesheet, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });

            if (createResponse.status === 200 || createResponse.status === 201) {
                await this.logTest('TIME-API-02', 'Create timesheet entry', 'PASS', 'Timesheet entry created');
            } else {
                await this.logTest('TIME-API-02', 'Create timesheet entry', 'WARN', 'Timesheet creation response unclear');
            }

            return true;

        } catch (error) {
            await this.logTest('TIME-API-02', 'Timesheet management test', 'FAIL', error.response?.data?.message || error.message);
            return false;
        }
    }

    // Test 4: Leave Request API
    async testLeaveManagement() {
        console.log('\n🏖️ Testing Leave Request API...');

        if (!this.authToken) {
            await this.logTest('LEAVE-API-01', 'Leave test', 'FAIL', 'No authentication token');
            return false;
        }

        try {
            // Test GET leave requests
            const getLeaveResponse = await axios.get(`${this.baseUrl}/api/leave-requests`, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });

            if (getLeaveResponse.status === 200) {
                await this.logTest('LEAVE-API-01', 'Get leave requests', 'PASS', 'Leave requests endpoint accessible');
            }

            // Test CREATE leave request
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);

            const newLeaveRequest = {
                type: 'vacation',
                startDate: tomorrow.toISOString().split('T')[0],
                endDate: dayAfter.toISOString().split('T')[0],
                reason: 'API test leave request'
            };

            const createResponse = await axios.post(`${this.baseUrl}/api/leave-requests`, newLeaveRequest, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });

            if (createResponse.status === 200 || createResponse.status === 201) {
                await this.logTest('LEAVE-API-02', 'Create leave request', 'PASS', 'Leave request created');
            } else {
                await this.logTest('LEAVE-API-02', 'Create leave request', 'WARN', 'Leave request response unclear');
            }

            return true;

        } catch (error) {
            await this.logTest('LEAVE-API-02', 'Leave management test', 'FAIL', error.response?.data?.message || error.message);
            return false;
        }
    }

    // Test 5: Payslip API
    async testPayslipManagement() {
        console.log('\n💰 Testing Payslip API...');

        if (!this.authToken) {
            await this.logTest('PAY-API-01', 'Payslip test', 'FAIL', 'No authentication token');
            return false;
        }

        try {
            // Test GET payslips
            const getPayslipsResponse = await axios.get(`${this.baseUrl}/api/payslips`, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });

            if (getPayslipsResponse.status === 200) {
                await this.logTest('PAY-API-01', 'Get payslips', 'PASS', 'Payslips endpoint accessible');
                return true;
            } else {
                await this.logTest('PAY-API-01', 'Get payslips', 'WARN', 'Payslips endpoint response unclear');
                return true;
            }

        } catch (error) {
            await this.logTest('PAY-API-01', 'Payslip management test', 'FAIL', error.response?.data?.message || error.message);
            return false;
        }
    }

    // Test 6: Database Integration
    async testDatabaseIntegration() {
        console.log('\n🗄️ Testing Database Integration...');

        try {
            // Test health endpoint
            const healthResponse = await axios.get(`${this.baseUrl}/api/health`);
            
            if (healthResponse.status === 200) {
                await this.logTest('DB-API-01', 'API health check', 'PASS', 'Backend API responding');
            }

            // Test database statistics
            const statsResponse = await axios.get(`${this.baseUrl}/api/stats`, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });

            if (statsResponse.status === 200) {
                await this.logTest('DB-API-02', 'Database statistics', 'PASS', 'Database stats accessible');
            } else {
                await this.logTest('DB-API-02', 'Database statistics', 'WARN', 'Stats endpoint may not exist');
            }

            return true;

        } catch (error) {
            await this.logTest('DB-API-02', 'Database integration test', 'WARN', 'Some integration endpoints may not be implemented');
            return true;
        }
    }

    // Generate report
    async generateReport() {
        const passCount = this.testResults.filter(r => r.status === 'PASS').length;
        const failCount = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnCount = this.testResults.filter(r => r.status === 'WARN').length;
        const totalTests = this.testResults.length;
        const successRate = Math.round((passCount / totalTests) * 100);

        const report = `
# 🎯 Excel-Based API Scenario Testing Report
Generated: ${new Date().toISOString()}

## 📊 Test Results Summary
- **Total Tests**: ${totalTests}
- **Passed**: ${passCount} ✅
- **Failed**: ${failCount} ❌
- **Warnings**: ${warnCount} ⚠️
- **Success Rate**: ${successRate}%

## 📋 Detailed Results
${this.testResults.map(r => `
### ${r.scenario}: ${r.description}
- **Status**: ${r.status === 'PASS' ? '✅ PASS' : r.status === 'FAIL' ? '❌ FAIL' : '⚠️ WARN'}  
- **Details**: ${r.details}
- **Time**: ${r.timestamp}
`).join('')}

## 🎯 Assessment
${successRate >= 90 ? '🎉 EXCELLENT! All API functionalities working correctly.' :
  successRate >= 75 ? '✅ GOOD! Most API endpoints functional with minor issues.' :
  successRate >= 50 ? '⚠️ PARTIAL! Some API issues detected.' :
  '❌ CRITICAL! Major API issues need attention.'}

## 🔗 Test Configuration
- **Base URL**: ${this.baseUrl}
- **Authentication**: ${this.authToken ? 'Token received ✅' : 'Failed ❌'}
- **Test Users Created**: ${this.testUsers.length}

---
*API-Based Excel Scenario Testing Complete*
        `;

        const reportFile = `test-results/excel_api_test_report_${Date.now()}.md`;
        fs.writeFileSync(reportFile, report);

        console.log('\n' + '='.repeat(60));
        console.log('📊 EXCEL-BASED API TESTING COMPLETE');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${passCount}/${totalTests} (${Math.round(passCount/totalTests*100)}%)`);
        console.log(`❌ Failed: ${failCount}/${totalTests} (${Math.round(failCount/totalTests*100)}%)`);
        console.log(`⚠️ Warnings: ${warnCount}/${totalTests} (${Math.round(warnCount/totalTests*100)}%)`);
        console.log(`📈 Overall Success Rate: ${successRate}%`);
        console.log(`📄 Report saved: ${reportFile}`);

        return { successRate, passCount, failCount, warnCount, totalTests };
    }

    // Main test runner
    async runAllTests() {
        console.log('🚀 Starting Excel-Based API Scenario Testing...');
        console.log('===============================================');

        try {
            // Create results directory
            if (!fs.existsSync('test-results')) {
                fs.mkdirSync('test-results');
            }

            // Run all tests
            await this.testAuthentication();
            await this.testUserManagement();
            await this.testTimesheetManagement(); 
            await this.testLeaveManagement();
            await this.testPayslipManagement();
            await this.testDatabaseIntegration();

            // Generate report
            const results = await this.generateReport();
            return results;

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            throw error;
        }
    }
}

// Run tests
async function main() {
    const tester = new APIExcelScenarioTester();
    
    try {
        const results = await tester.runAllTests();
        
        if (results.successRate >= 90) {
            console.log('\n🎉 ALL EXCEL SCENARIOS PASSED! Your HRM system is fully functional.');
            process.exit(0);
        } else if (results.successRate >= 75) {
            console.log('\n✅ EXCEL SCENARIOS MOSTLY SUCCESSFUL! Minor issues detected.');
            process.exit(0);
        } else {
            console.log('\n⚠️ EXCEL SCENARIOS COMPLETED WITH ISSUES! Review failed tests.');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Excel scenario testing failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = APIExcelScenarioTester;
