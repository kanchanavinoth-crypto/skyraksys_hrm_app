/**
 * Quick test for the "Available to All Employees" validation fix
 */

const http = require('http');

// Configuration
const API_BASE = 'localhost:8080';
const ADMIN_CREDENTIALS = {
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t'
};

let authToken = '';

// Helper function to make API requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (error) {
                    reject(new Error(`Parse error: ${error.message}\nResponse: ${responseData.substring(0, 200)}`));
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Test the validation fix
async function testValidationFix() {
    console.log('🔧 Testing "Available to All Employees" validation fix\n');
    
    // Login
    console.log('🔐 Logging in...');
    const loginOptions = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    try {
        const loginResponse = await makeRequest(loginOptions, ADMIN_CREDENTIALS);
        if (loginResponse.status === 200 && loginResponse.data.accessToken) {
            authToken = loginResponse.data.accessToken;
            console.log('✅ Login successful\n');
        } else {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return;
    }
    
    // Get first project
    console.log('📂 Getting projects...');
    const projectOptions = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/projects',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    let testProjectId = '';
    try {
        const projectResponse = await makeRequest(projectOptions);
        if (projectResponse.status === 200 && projectResponse.data.success && projectResponse.data.data.length > 0) {
            testProjectId = projectResponse.data.data[0].id;
            console.log(`✅ Using project: ${projectResponse.data.data[0].name}\n`);
        } else {
            console.log('❌ No projects available for testing');
            return;
        }
    } catch (error) {
        console.error('❌ Error getting projects:', error.message);
        return;
    }
    
    // Test 1: Create task with availableToAll = true and assignedTo = "" (empty string)
    console.log('🧪 TEST 1: Creating task with availableToAll=true and empty string assignedTo');
    const taskOptions1 = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/tasks',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    const taskData1 = {
        name: 'Validation Fix Test Task',
        description: 'Testing the validation fix for availableToAll',
        projectId: testProjectId,
        availableToAll: true,
        assignedTo: "", // Empty string - should be normalized to null
        status: 'Not Started',
        priority: 'Medium',
        estimatedHours: 5
    };
    
    try {
        const taskResponse1 = await makeRequest(taskOptions1, taskData1);
        console.log(`Response Status: ${taskResponse1.status}`);
        
        if (taskResponse1.status === 201 && taskResponse1.data.success) {
            console.log('✅ SUCCESS: Task created with availableToAll=true');
            console.log(`   - Task ID: ${taskResponse1.data.data.id}`);
            console.log(`   - Available to All: ${taskResponse1.data.data.availableToAll}`);
            console.log(`   - Assigned To: ${taskResponse1.data.data.assignedTo} (should be null)`);
        } else {
            console.log('❌ FAILED: Task creation failed');
            console.log(`   - Message: ${taskResponse1.data.message}`);
            if (taskResponse1.data.errors) {
                console.log('   - Validation Errors:');
                taskResponse1.data.errors.forEach(err => {
                    console.log(`     * ${err.field}: ${err.message}`);
                });
            }
        }
    } catch (error) {
        console.error('❌ Error creating task:', error.message);
    }
    
    console.log('\n🎯 Test completed!');
}

// Run the test
testValidationFix().catch(error => {
    console.error('❌ Test execution failed:', error);
});