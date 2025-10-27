const axios = require('axios');

async function testTaskValidationIssues() {
    try {
        console.log('\n=== Testing Specific Task Validation Issues ===\n');

        // Login as admin
        const adminLogin = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });

        const token = adminLogin.data.data.accessToken;
        console.log('✅ Admin login successful');

        // Get a valid project ID
        const projectsResponse = await axios.get('http://localhost:8080/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const validProjectId = projectsResponse.data.data[0].id;
        console.log(`✅ Using project ID: ${validProjectId}`);

        // Test 1: Missing required fields
        console.log('\n🧪 Test 1: Missing required fields...');
        try {
            await axios.post('http://localhost:8080/api/tasks', {
                description: 'Task without name'
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.log('❌ Missing required fields correctly rejected:');
            console.log(`   Message: ${error.response.data.message}`);
            if (error.response.data.errors) {
                error.response.data.errors.forEach(err => {
                    console.log(`   - ${err.field}: ${err.message}`);
                });
            }
        }

        // Test 2: Invalid project ID format
        console.log('\n🧪 Test 2: Invalid project ID format...');
        try {
            await axios.post('http://localhost:8080/api/tasks', {
                name: 'Test Task',
                projectId: 'invalid-project-id'
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.log('❌ Invalid project ID correctly rejected:');
            console.log(`   Message: ${error.response.data.message}`);
            if (error.response.data.errors) {
                error.response.data.errors.forEach(err => {
                    console.log(`   - ${err.field}: ${err.message}`);
                });
            }
        }

        // Test 3: Non-existent project ID
        console.log('\n🧪 Test 3: Non-existent project ID...');
        try {
            await axios.post('http://localhost:8080/api/tasks', {
                name: 'Test Task',
                projectId: '12345678-1234-1234-1234-123456789999'
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.log('❌ Non-existent project ID correctly rejected:');
            console.log(`   Message: ${error.response.data.message}`);
        }

        // Test 4: Invalid assignedTo format
        console.log('\n🧪 Test 4: Invalid assignedTo format...');
        try {
            await axios.post('http://localhost:8080/api/tasks', {
                name: 'Test Task',
                projectId: validProjectId,
                assignedTo: 'invalid-employee-id'
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.log('❌ Invalid assignedTo ID correctly rejected:');
            console.log(`   Message: ${error.response.data.message}`);
            if (error.response.data.errors) {
                error.response.data.errors.forEach(err => {
                    console.log(`   - ${err.field}: ${err.message}`);
                });
            }
        }

        // Test 5: Invalid status value
        console.log('\n🧪 Test 5: Invalid status value...');
        try {
            await axios.post('http://localhost:8080/api/tasks', {
                name: 'Test Task',
                projectId: validProjectId,
                status: 'Invalid Status'
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.log('❌ Invalid status correctly rejected:');
            console.log(`   Message: ${error.response.data.message}`);
            if (error.response.data.errors) {
                error.response.data.errors.forEach(err => {
                    console.log(`   - ${err.field}: ${err.message}`);
                });
            }
        }

        // Test 6: Invalid priority value
        console.log('\n🧪 Test 6: Invalid priority value...');
        try {
            await axios.post('http://localhost:8080/api/tasks', {
                name: 'Test Task',
                projectId: validProjectId,
                priority: 'Super High'
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.log('❌ Invalid priority correctly rejected:');
            console.log(`   Message: ${error.response.data.message}`);
            if (error.response.data.errors) {
                error.response.data.errors.forEach(err => {
                    console.log(`   - ${err.field}: ${err.message}`);
                });
            }
        }

        // Test 7: Valid task creation
        console.log('\n🧪 Test 7: Valid task creation...');
        const validTask = await axios.post('http://localhost:8080/api/tasks', {
            name: 'Valid Test Task',
            description: 'This is a valid task',
            projectId: validProjectId,
            availableToAll: true,
            status: 'Not Started',
            priority: 'Medium',
            estimatedHours: 8
        }, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Valid task creation succeeded:', validTask.data.data.name);
        const createdTaskId = validTask.data.data.id;

        // Test 8: Valid task editing
        console.log('\n🧪 Test 8: Valid task editing...');
        const updatedTask = await axios.put(`http://localhost:8080/api/tasks/${createdTaskId}`, {
            name: 'Updated Valid Task',
            status: 'In Progress',
            priority: 'High',
            actualHours: 2.5
        }, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Valid task editing succeeded:', updatedTask.data.data.name);

        // Test 9: Test with different UUID format  
        console.log('\n🧪 Test 9: Testing task editing with different UUID format...');
        const testTaskId = '12345678-1234-1234-1234-123456789999';
        try {
            await axios.put(`http://localhost:8080/api/tasks/${testTaskId}`, {
                name: 'Test Update'
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            if (error.response.status === 400 && error.response.data.message === 'Invalid task ID format.') {
                console.log('❌ Task ID format incorrectly rejected (this is the bug!)');
                console.log(`   Message: ${error.response.data.message}`);
                console.log(`   Provided ID: ${error.response.data.details.providedId}`);
            } else if (error.response.status === 404) {
                console.log('✅ Task ID format accepted, but task not found (correct behavior)');
            } else {
                console.log('❌ Unexpected error:', error.response.data.message);
            }
        }

    } catch (error) {
        console.error('❌ Test setup failed:', error.message);
        if (error.response) {
            console.error('   Response data:', error.response.data);
        }
    }
}

// Run the validation test
testTaskValidationIssues().then(() => {
    console.log('\n=== Task Validation Testing Completed ===');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});