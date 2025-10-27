// 🎯 **EMPLOYEE REVIEW API COMPREHENSIVE TESTING**
const axios = require('axios').default;

const BASE_URL = 'http://localhost:8080/api';
const REVIEW_API = `${BASE_URL}/reviews`;

console.log('🎯 **EMPLOYEE REVIEW API COMPREHENSIVE TESTING**');
console.log('=' .repeat(80));
console.log('📅 Started:', new Date().toLocaleString());

// Test credentials (from previous testing)
const TEST_CREDENTIALS = {
    admin: { email: 'admin@company.com', password: 'admin123' },
    hr: { email: 'hr@company.com', password: 'hr123' },
    manager: { email: 'manager@company.com', password: 'manager123' },
    employee: { email: 'employee@company.com', password: 'employee123' }
};

let testResults = {
    timestamp: new Date().toISOString(),
    apiEndpoints: {},
    businessScenarios: {},
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0
    }
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (method, url, data = null, token = null) => {
    try {
        const config = {
            method,
            url,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            timeout: 5000
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message, 
            status: error.response?.status || 500 
        };
    }
};

// Login function
const login = async (credentials) => {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
        return { success: true, token: response.data.accessToken, user: response.data.user };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

// Test all Employee Review API endpoints
const testEmployeeReviewAPI = async () => {
    console.log('\n🔍 **TESTING EMPLOYEE REVIEW API ENDPOINTS**');
    console.log('-' .repeat(60));

    // Login as different users
    console.log('\n🔐 **Step 1: Authentication**');
    const loginResults = {};
    
    for (const [role, credentials] of Object.entries(TEST_CREDENTIALS)) {
        const result = await login(credentials);
        loginResults[role] = result;
        
        if (result.success) {
            console.log(`✅ ${role.toUpperCase()} login successful`);
        } else {
            console.log(`❌ ${role.toUpperCase()} login failed: ${result.error.message || result.error}`);
        }
    }

    // Check if we have at least admin/HR access for testing
    if (!loginResults.admin?.success && !loginResults.hr?.success) {
        console.log('❌ Cannot proceed - no admin/HR access available');
        return;
    }

    // Use admin token for most tests
    const adminToken = loginResults.admin?.success ? loginResults.admin.token : 
                     loginResults.hr?.success ? loginResults.hr.token : null;

    if (!adminToken) {
        console.log('❌ No admin or HR token available for testing');
        return;
    }

    console.log('\n📊 **Step 2: Employee Review API Endpoint Tests**');

    // Test 1: GET /reviews (Get all reviews)
    console.log('\n🔹 Test 1: GET /reviews (Get all reviews)');
    const getAllReviews = await makeAuthenticatedRequest('GET', REVIEW_API, null, adminToken);
    testResults.apiEndpoints['GET /reviews'] = getAllReviews.success ? '✅ Working' : `❌ Failed: ${getAllReviews.error}`;
    testResults.summary.total++;
    if (getAllReviews.success) {
        testResults.summary.passed++;
        console.log(`✅ SUCCESS: Retrieved reviews (Status: ${getAllReviews.status})`);
        console.log(`   Found ${getAllReviews.data.reviews ? getAllReviews.data.reviews.length : 0} reviews`);
    } else {
        testResults.summary.failed++;
        console.log(`❌ FAILED: ${getAllReviews.error}`);
    }

    // Test 2: GET /reviews/meta/dashboard (Get review dashboard)
    console.log('\n🔹 Test 2: GET /reviews/meta/dashboard (Get review dashboard)');
    const getDashboard = await makeAuthenticatedRequest('GET', `${REVIEW_API}/meta/dashboard`, null, adminToken);
    testResults.apiEndpoints['GET /reviews/meta/dashboard'] = getDashboard.success ? '✅ Working' : `❌ Failed: ${getDashboard.error}`;
    testResults.summary.total++;
    if (getDashboard.success) {
        testResults.summary.passed++;
        console.log(`✅ SUCCESS: Retrieved dashboard (Status: ${getDashboard.status})`);
        console.log(`   Dashboard data:`, JSON.stringify(getDashboard.data, null, 2));
    } else {
        testResults.summary.failed++;
        console.log(`❌ FAILED: ${getDashboard.error}`);
    }

    // First, we need to get employees to create reviews for
    console.log('\n🔍 **Step 3: Get Employees for Review Creation**');
    const getEmployees = await makeAuthenticatedRequest('GET', `${BASE_URL}/employees`, null, adminToken);
    
    let employeeId = null;
    if (getEmployees.success && getEmployees.data.employees && getEmployees.data.employees.length > 0) {
        employeeId = getEmployees.data.employees[0].id;
        console.log(`✅ Found employee ID: ${employeeId} for testing`);
    } else {
        console.log('⚠️ No employees found - creating review tests may fail');
    }

    // Test 3: POST /reviews (Create new review)
    console.log('\n🔹 Test 3: POST /reviews (Create new employee review)');
    const reviewData = {
        employeeId: employeeId,
        reviewPeriod: 'Q1 2025',
        reviewType: 'quarterly',
        overallRating: 4.2,
        technicalSkills: 4.5,
        communication: 4.0,
        teamwork: 4.3,
        leadership: 3.8,
        punctuality: 4.5,
        achievements: 'Successfully completed project X and improved system performance by 20%',
        areasForImprovement: 'Could improve public speaking skills and take more initiative in meetings',
        goals: 'Complete advanced technical training and lead a small project team',
        reviewerComments: 'Strong technical performer with good potential for leadership roles',
        reviewDate: new Date().toISOString()
    };

    const createReview = await makeAuthenticatedRequest('POST', REVIEW_API, reviewData, adminToken);
    testResults.apiEndpoints['POST /reviews'] = createReview.success ? '✅ Working' : `❌ Failed: ${createReview.error}`;
    testResults.summary.total++;
    
    let createdReviewId = null;
    if (createReview.success) {
        testResults.summary.passed++;
        createdReviewId = createReview.data.review?.id;
        console.log(`✅ SUCCESS: Created review (Status: ${createReview.status})`);
        console.log(`   Review ID: ${createdReviewId}`);
        console.log(`   Overall Rating: ${createReview.data.review?.overallRating}`);
    } else {
        testResults.summary.failed++;
        console.log(`❌ FAILED: ${createReview.error}`);
    }

    // Test 4: GET /reviews/:id (Get specific review)
    if (createdReviewId) {
        console.log('\n🔹 Test 4: GET /reviews/:id (Get specific review)');
        const getReview = await makeAuthenticatedRequest('GET', `${REVIEW_API}/${createdReviewId}`, null, adminToken);
        testResults.apiEndpoints['GET /reviews/:id'] = getReview.success ? '✅ Working' : `❌ Failed: ${getReview.error}`;
        testResults.summary.total++;
        if (getReview.success) {
            testResults.summary.passed++;
            console.log(`✅ SUCCESS: Retrieved specific review (Status: ${getReview.status})`);
            console.log(`   Employee: ${getReview.data.employee?.firstName} ${getReview.data.employee?.lastName}`);
            console.log(`   Review Period: ${getReview.data.reviewPeriod}`);
        } else {
            testResults.summary.failed++;
            console.log(`❌ FAILED: ${getReview.error}`);
        }

        // Test 5: PUT /reviews/:id (Update review)
        console.log('\n🔹 Test 5: PUT /reviews/:id (Update review)');
        const updateData = {
            overallRating: 4.5,
            reviewerComments: 'Updated: Excellent performance this quarter with outstanding technical contributions'
        };
        
        const updateReview = await makeAuthenticatedRequest('PUT', `${REVIEW_API}/${createdReviewId}`, updateData, adminToken);
        testResults.apiEndpoints['PUT /reviews/:id'] = updateReview.success ? '✅ Working' : `❌ Failed: ${updateReview.error}`;
        testResults.summary.total++;
        if (updateReview.success) {
            testResults.summary.passed++;
            console.log(`✅ SUCCESS: Updated review (Status: ${updateReview.status})`);
            console.log(`   New Rating: ${updateReview.data.review?.overallRating}`);
        } else {
            testResults.summary.failed++;
            console.log(`❌ FAILED: ${updateReview.error}`);
        }

        // Test 6: PUT /reviews/:id/status (Update review status)
        console.log('\n🔹 Test 6: PUT /reviews/:id/status (Update review status)');
        const statusUpdate = {
            status: 'completed',
            hrApproved: true
        };
        
        const updateStatus = await makeAuthenticatedRequest('PUT', `${REVIEW_API}/${createdReviewId}/status`, statusUpdate, adminToken);
        testResults.apiEndpoints['PUT /reviews/:id/status'] = updateStatus.success ? '✅ Working' : `❌ Failed: ${updateStatus.error}`;
        testResults.summary.total++;
        if (updateStatus.success) {
            testResults.summary.passed++;
            console.log(`✅ SUCCESS: Updated review status (Status: ${updateStatus.status})`);
            console.log(`   New Status: ${updateStatus.data.review?.status}`);
            console.log(`   HR Approved: ${updateStatus.data.review?.hrApproved}`);
        } else {
            testResults.summary.failed++;
            console.log(`❌ FAILED: ${updateStatus.error}`);
        }
    }

    // Test role-based access
    console.log('\n🔐 **Step 4: Role-Based Access Control Testing**');

    // Test employee access
    if (loginResults.employee?.success) {
        console.log('\n🔹 Test 7: Employee Role Access (GET /reviews)');
        const employeeAccess = await makeAuthenticatedRequest('GET', REVIEW_API, null, loginResults.employee.token);
        testResults.apiEndpoints['GET /reviews (Employee Role)'] = employeeAccess.success ? '✅ Working' : `❌ Failed: ${employeeAccess.error}`;
        testResults.summary.total++;
        if (employeeAccess.success) {
            testResults.summary.passed++;
            console.log(`✅ SUCCESS: Employee can access reviews (Status: ${employeeAccess.status})`);
            console.log(`   Employee sees ${employeeAccess.data.reviews ? employeeAccess.data.reviews.length : 0} reviews (should be only their own)`);
        } else {
            testResults.summary.failed++;
            console.log(`❌ FAILED: ${employeeAccess.error}`);
        }

        // Test employee trying to create review (should fail)
        console.log('\n🔹 Test 8: Employee Create Review (Should Fail)');
        const employeeCreate = await makeAuthenticatedRequest('POST', REVIEW_API, reviewData, loginResults.employee.token);
        testResults.apiEndpoints['POST /reviews (Employee Role - Should Fail)'] = !employeeCreate.success && employeeCreate.status === 403 ? '✅ Correctly Blocked' : `❌ Security Issue: ${employeeCreate.error}`;
        testResults.summary.total++;
        if (!employeeCreate.success && employeeCreate.status === 403) {
            testResults.summary.passed++;
            console.log(`✅ SUCCESS: Employee correctly blocked from creating reviews (Status: ${employeeCreate.status})`);
        } else {
            testResults.summary.failed++;
            console.log(`❌ SECURITY ISSUE: Employee should not be able to create reviews`);
        }
    }
};

// Business scenario testing
const testBusinessScenarios = async () => {
    console.log('\n🎯 **BUSINESS SCENARIO TESTING**');
    console.log('-' .repeat(60));

    testResults.businessScenarios['Employee Review Lifecycle'] = {
        status: 'Testing',
        steps: [],
        successRate: 0
    };

    console.log('\n📋 **Scenario 1: Complete Employee Review Lifecycle**');
    console.log('Steps: Create → View → Update → Employee Input → HR Approval → Complete');

    let scenarioSteps = 0;
    let successfulSteps = 0;

    // This scenario testing is included in the API endpoint tests above
    // We'll just summarize the results
    
    const criticalEndpoints = [
        'GET /reviews',
        'POST /reviews', 
        'GET /reviews/:id',
        'PUT /reviews/:id',
        'PUT /reviews/:id/status'
    ];

    criticalEndpoints.forEach(endpoint => {
        scenarioSteps++;
        if (testResults.apiEndpoints[endpoint]?.includes('✅')) {
            successfulSteps++;
        }
    });

    const scenarioSuccessRate = Math.round((successfulSteps / scenarioSteps) * 100);
    testResults.businessScenarios['Employee Review Lifecycle'].successRate = scenarioSuccessRate;
    testResults.businessScenarios['Employee Review Lifecycle'].status = 
        scenarioSuccessRate >= 80 ? '✅ Working' : 
        scenarioSuccessRate >= 50 ? '⚠️ Partial' : '❌ Failed';

    console.log(`📊 Employee Review Lifecycle: ${successfulSteps}/${scenarioSteps} steps working (${scenarioSuccessRate}%)`);
};

// Generate final report
const generateReport = () => {
    testResults.summary.successRate = testResults.summary.total > 0 
        ? Math.round((testResults.summary.passed / testResults.summary.total) * 100)
        : 0;

    console.log('\n📊 **FINAL EMPLOYEE REVIEW API TESTING REPORT**');
    console.log('=' .repeat(80));
    console.log(`📅 Completed: ${new Date().toLocaleString()}`);
    console.log(`⏱️ Test Duration: ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`);
    
    console.log('\n🔗 **API ENDPOINT RESULTS**:');
    Object.entries(testResults.apiEndpoints).forEach(([endpoint, status]) => {
        console.log(`   ${endpoint.padEnd(40)} → ${status}`);
    });

    console.log('\n🎯 **BUSINESS SCENARIO RESULTS**:');
    Object.entries(testResults.businessScenarios).forEach(([scenario, info]) => {
        console.log(`   ${scenario.padEnd(40)} → ${info.status} (${info.successRate}%)`);
    });

    console.log('\n📈 **OVERALL STATISTICS**:');
    console.log(`✅ Passed: ${testResults.summary.passed}/${testResults.summary.total} (${testResults.summary.successRate}%)`);
    console.log(`❌ Failed: ${testResults.summary.failed}/${testResults.summary.total}`);

    console.log('\n🎉 **EMPLOYEE REVIEW API STATUS**:');
    if (testResults.summary.successRate >= 80) {
        console.log('🟢 EXCELLENT: Employee Review API is fully functional and ready for production!');
    } else if (testResults.summary.successRate >= 60) {
        console.log('🟡 GOOD: Employee Review API is mostly working with minor issues to address');
    } else if (testResults.summary.successRate >= 40) {
        console.log('🟠 PARTIAL: Employee Review API has core functionality but needs improvements');
    } else {
        console.log('🔴 NEEDS WORK: Employee Review API requires significant fixes before production use');
    }

    // Save results to file
    const fs = require('fs');
    fs.writeFileSync(`employee-review-api-test-report-${Date.now()}.json`, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Detailed report saved to employee-review-api-test-report-${Date.now()}.json`);
};

// Main execution
const runTests = async () => {
    try {
        await testEmployeeReviewAPI();
        await testBusinessScenarios();
        generateReport();
    } catch (error) {
        console.error('❌ Test execution failed:', error);
        testResults.summary.failed = testResults.summary.total;
        testResults.summary.successRate = 0;
        generateReport();
    }
};

// Start testing
const startTime = Date.now();
console.log('🚀 **Starting Employee Review API comprehensive testing...**\n');

// Check if backend is running first
axios.get(`${BASE_URL}/health`)
    .then(response => {
        console.log('✅ Backend server is running - proceeding with tests');
        runTests();
    })
    .catch(error => {
        console.log('❌ Backend server is not running on localhost:8080');
        console.log('   Please start the backend server first with: npm run start-backend');
        console.log('   Or run: node server.js from the backend directory');
        process.exit(1);
    });
