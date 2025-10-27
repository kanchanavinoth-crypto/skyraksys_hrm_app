const axios = require('axios').default;
const fs = require('fs');

console.log('🔍 **EMPLOYEE REVIEW API TESTING**');
console.log('=' .repeat(60));

const BASE_URL = 'http://localhost:8080/api';

// Test credentials from the updated system
const TEST_CREDENTIALS = {
    admin: { email: 'admin@company.com', password: 'Kx9mP7qR2nF8sA5t' },
    hr: { email: 'hr@company.com', password: 'Lw3nQ6xY8mD4vB7h' },
    manager: { email: 'manager@company.com', password: 'manager123' },
    employee: { email: 'employee@company.com', password: 'Mv4pS9wE2nR6kA8j' }
};

let tokens = {};
let testResults = {
    timestamp: new Date().toISOString(),
    endpoints: {},
    scenarios: {},
    summary: {}
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (method, endpoint, data, token) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            config.data = data;
        }
        
        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message, 
            status: error.response?.status || 0 
        };
    }
};

// Test authentication for all roles
const testAuthentication = async () => {
    console.log('\n🔐 **TESTING AUTHENTICATION**');
    console.log('-'.repeat(40));
    
    for (const [role, credentials] of Object.entries(TEST_CREDENTIALS)) {
        try {
            const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
            tokens[role] = response.data.accessToken || response.data.token;
            console.log(`✅ ${role.toUpperCase()} login successful`);
        } catch (error) {
            console.log(`❌ ${role.toUpperCase()} login failed: ${error.response?.data?.message || error.message}`);
        }
    }
};

// Test Employee Review API endpoints
const testEmployeeReviewEndpoints = async () => {
    console.log('\n📋 **TESTING EMPLOYEE REVIEW ENDPOINTS**');
    console.log('-'.repeat(50));
    
    const endpoints = [
        { method: 'GET', path: '/reviews', description: 'Get all employee reviews' },
        { method: 'GET', path: '/reviews/1', description: 'Get specific employee review' },
        { method: 'POST', path: '/reviews', description: 'Create employee review' },
        { method: 'PUT', path: '/reviews/1', description: 'Update employee review' },
        { method: 'DELETE', path: '/reviews/1', description: 'Delete employee review' },
        { method: 'PUT', path: '/reviews/1/status', description: 'Update review status' },
        { method: 'POST', path: '/reviews/1/submit', description: 'Submit review' },
        { method: 'GET', path: '/reviews/meta/dashboard', description: 'Get review dashboard' },
        { method: 'GET', path: '/reviews/employee/1', description: 'Get employee reviews' }
    ];

    for (const endpoint of endpoints) {
        console.log(`\n🔹 Testing ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
        
        // Test with different roles
        for (const [role, token] of Object.entries(tokens)) {
            if (!token) continue;
            
            let testData = null;
            
            // Prepare test data for POST requests
            if (endpoint.method === 'POST' && endpoint.path === '/reviews') {
                testData = {
                    employeeId: 1,
                    reviewPeriod: 'Q1 2025',
                    reviewType: 'quarterly',
                    overallRating: 4.5,
                    technicalSkills: 4.0,
                    communication: 4.5,
                    teamwork: 5.0,
                    leadership: 3.5,
                    punctuality: 4.8,
                    achievements: 'Excellent performance in Q1 projects',
                    areasForImprovement: 'Could improve in leadership skills',
                    goals: 'Lead at least 2 projects in Q2',
                    reviewerComments: 'Great employee with potential for growth'
                };
            } else if (endpoint.method === 'PUT' && endpoint.path === '/reviews/1') {
                testData = {
                    overallRating: 4.8,
                    reviewerComments: 'Updated review comments',
                    status: 'pending_approval'
                };
            } else if (endpoint.method === 'PUT' && endpoint.path === '/reviews/1/status') {
                testData = {
                    status: 'completed',
                    hrApproved: true
                };
            }
            
            const result = await makeAuthenticatedRequest(
                endpoint.method, 
                endpoint.path, 
                testData, 
                token
            );
            
            const key = `${endpoint.method} ${endpoint.path}`;
            if (!testResults.endpoints[key]) {
                testResults.endpoints[key] = {};
            }
            
            testResults.endpoints[key][role] = {
                success: result.success,
                status: result.status,
                error: result.error || null
            };
            
            if (result.success) {
                console.log(`   ✅ ${role.toUpperCase()}: ${result.status} - ${JSON.stringify(result.data).substring(0, 100)}...`);
            } else {
                console.log(`   ❌ ${role.toUpperCase()}: ${result.status} - ${result.error?.message || result.error}`);
            }
        }
    }
};

// Test Business Scenarios
const testBusinessScenarios = async () => {
    console.log('\n🎯 **TESTING EMPLOYEE REVIEW BUSINESS SCENARIOS**');
    console.log('-'.repeat(55));
    
    const scenarios = [
        {
            name: 'Complete Review Creation Workflow',
            description: 'Manager creates review → Employee provides self-assessment → HR approves',
            steps: async () => {
                let results = [];
                
                // Step 1: Manager creates review
                if (tokens.manager || tokens.hr) {
                    const token = tokens.manager || tokens.hr;
                    const createResult = await makeAuthenticatedRequest('POST', '/reviews', {
                        employeeId: 1,
                        reviewPeriod: 'Q1 2025',
                        reviewType: 'quarterly',
                        overallRating: 4.2,
                        technicalSkills: 4.0,
                        communication: 4.5,
                        teamwork: 4.8,
                        leadership: 3.8,
                        punctuality: 4.9,
                        achievements: 'Successfully completed all Q1 deliverables',
                        areasForImprovement: 'Could take more initiative in meetings',
                        goals: 'Lead a cross-functional project in Q2',
                        reviewerComments: 'Solid performer with growth potential'
                    }, token);
                    
                    results.push({
                        step: 'Manager creates review',
                        success: createResult.success,
                        details: createResult.success ? 'Review created successfully' : createResult.error
                    });
                }
                
                // Step 2: Get all reviews to verify creation
                if (tokens.hr || tokens.admin) {
                    const token = tokens.hr || tokens.admin;
                    const listResult = await makeAuthenticatedRequest('GET', '/reviews', null, token);
                    results.push({
                        step: 'Retrieve reviews list',
                        success: listResult.success,
                        details: listResult.success ? `Found ${listResult.data?.reviews?.length || 0} reviews` : listResult.error
                    });
                }
                
                // Step 3: Employee views their reviews
                if (tokens.employee) {
                    const viewResult = await makeAuthenticatedRequest('GET', '/reviews', null, tokens.employee);
                    results.push({
                        step: 'Employee views own reviews',
                        success: viewResult.success,
                        details: viewResult.success ? 'Employee can access their reviews' : viewResult.error
                    });
                }
                
                return results;
            }
        },
        {
            name: 'Review Status Management',
            description: 'Test different review statuses and transitions',
            steps: async () => {
                let results = [];
                
                // Test status update
                if (tokens.hr || tokens.admin) {
                    const token = tokens.hr || tokens.admin;
                    const statusResult = await makeAuthenticatedRequest('PUT', '/reviews/1/status', {
                        status: 'completed',
                        hrApproved: true
                    }, token);
                    
                    results.push({
                        step: 'Update review status',
                        success: statusResult.success,
                        details: statusResult.success ? 'Status updated successfully' : statusResult.error
                    });
                }
                
                return results;
            }
        },
        {
            name: 'Role-Based Access Control',
            description: 'Verify that different roles have appropriate access levels',
            steps: async () => {
                let results = [];
                
                // Test each role's access to reviews
                for (const [role, token] of Object.entries(tokens)) {
                    if (!token) continue;
                    
                    const accessResult = await makeAuthenticatedRequest('GET', '/reviews', null, token);
                    results.push({
                        step: `${role} access to reviews`,
                        success: accessResult.success,
                        details: accessResult.success ? 
                            `${role} can access reviews (${accessResult.data?.reviews?.length || 0} found)` : 
                            accessResult.error
                    });
                }
                
                return results;
            }
        }
    ];
    
    for (const scenario of scenarios) {
        console.log(`\n🎯 **${scenario.name}**`);
        console.log(`   Description: ${scenario.description}`);
        
        const results = await scenario.steps();
        let passed = 0, total = results.length;
        
        results.forEach(result => {
            if (result.success) {
                console.log(`   ✅ ${result.step}: ${result.details}`);
                passed++;
            } else {
                console.log(`   ❌ ${result.step}: ${result.details}`);
            }
        });
        
        testResults.scenarios[scenario.name] = {
            passed,
            total,
            successRate: `${Math.round((passed/total)*100)}%`,
            results
        };
        
        console.log(`   📊 Result: ${passed}/${total} steps passed (${Math.round((passed/total)*100)}%)`);
    }
};

// Generate summary report
const generateSummary = () => {
    console.log('\n📊 **EMPLOYEE REVIEW API TEST SUMMARY**');
    console.log('=' .repeat(60));
    
    // Count endpoint results
    let totalEndpoints = 0;
    let workingEndpoints = 0;
    let partiallyWorkingEndpoints = 0;
    
    Object.entries(testResults.endpoints).forEach(([endpoint, roleResults]) => {
        totalEndpoints++;
        const successes = Object.values(roleResults).filter(r => r.success).length;
        const total = Object.values(roleResults).length;
        
        if (successes === total) {
            workingEndpoints++;
            console.log(`✅ ${endpoint}: Working for all roles (${successes}/${total})`);
        } else if (successes > 0) {
            partiallyWorkingEndpoints++;
            console.log(`⚠️ ${endpoint}: Partially working (${successes}/${total} roles)`);
        } else {
            console.log(`❌ ${endpoint}: Not working for any role`);
        }
    });
    
    console.log(`\n📈 **Endpoint Statistics:**`);
    console.log(`   Total Endpoints Tested: ${totalEndpoints}`);
    console.log(`   Fully Working: ${workingEndpoints} (${Math.round((workingEndpoints/totalEndpoints)*100)}%)`);
    console.log(`   Partially Working: ${partiallyWorkingEndpoints} (${Math.round((partiallyWorkingEndpoints/totalEndpoints)*100)}%)`);
    console.log(`   Not Working: ${totalEndpoints - workingEndpoints - partiallyWorkingEndpoints}`);
    
    // Scenario summary
    console.log(`\n🎯 **Scenario Results:**`);
    Object.entries(testResults.scenarios).forEach(([name, result]) => {
        console.log(`   ${name}: ${result.passed}/${result.total} (${result.successRate})`);
    });
    
    testResults.summary = {
        totalEndpoints,
        workingEndpoints,
        partiallyWorkingEndpoints,
        overallSuccess: Math.round(((workingEndpoints + partiallyWorkingEndpoints * 0.5) / totalEndpoints) * 100)
    };
    
    console.log(`\n🏆 **Overall Employee Review API Health: ${testResults.summary.overallSuccess}%**`);
};

// Main test execution
const runTests = async () => {
    try {
        await testAuthentication();
        await testEmployeeReviewEndpoints();
        await testBusinessScenarios();
        generateSummary();
        
        // Save results
        fs.writeFileSync(
            `employee-review-api-test-report-${Date.now()}.json`,
            JSON.stringify(testResults, null, 2)
        );
        
        console.log('\n💾 **Test results saved to employee-review-api-test-report-[timestamp].json**');
        console.log('\n🎉 **EMPLOYEE REVIEW API TESTING COMPLETED**');
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
    }
};

// Run the tests
runTests();
