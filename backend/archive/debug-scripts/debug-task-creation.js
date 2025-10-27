const axios = require('axios');

async function debugTaskCreation() {
    try {
        console.log('\n=== Debugging Task Creation & Editing Issues ===\n');

        // Login as admin to get permissions for task creation
        const adminLogin = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });

        console.log('✅ Admin login successful:', adminLogin.data.data.user.email);
        const token = adminLogin.data.data.accessToken;

        // Test 1: Check existing projects to get valid project IDs
        console.log('\n📋 Fetching available projects...');
        const projectsResponse = await axios.get('http://localhost:8080/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const projects = projectsResponse.data.data;
        if (projects.length === 0) {
            console.log('❌ No projects found! Need to create projects first.');
            return;
        }

        const validProjectId = projects[0].id;
        console.log(`✅ Using project: ${projects[0].name} (ID: ${validProjectId})`);

        // Test 2: Try to create a simple task with minimal data
        console.log('\n🆕 Testing task creation with minimal data...');
        const minimalTaskData = {
            name: 'Test Task Minimal',
            projectId: validProjectId
        };

        try {
            const createResponse = await axios.post('http://localhost:8080/api/tasks', minimalTaskData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Minimal task creation succeeded:', createResponse.data.data.name);
            const createdTaskId = createResponse.data.data.id;

            // Test 3: Try to edit the created task
            console.log('\n✏️  Testing task editing...');
            const updateData = {
                name: 'Updated Test Task',
                description: 'This is an updated task description',
                status: 'In Progress'
            };

            const updateResponse = await axios.put(`http://localhost:8080/api/tasks/${createdTaskId}`, updateData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Task update succeeded:', updateResponse.data.data.name);

        } catch (createError) {
            console.log('❌ Task creation failed:');
            if (createError.response) {
                console.log('   Status:', createError.response.status);
                console.log('   Message:', createError.response.data.message);
                if (createError.response.data.errors) {
                    console.log('   Validation Errors:');
                    createError.response.data.errors.forEach(err => {
                        console.log(`     - ${err.field}: ${err.message} (received: ${err.received})`);
                    });
                }
                if (createError.response.data.details) {
                    console.log('   Details:', JSON.stringify(createError.response.data.details, null, 2));
                }
            } else {
                console.log('   Error:', createError.message);
            }
        }

        // Test 4: Try to create task with all fields
        console.log('\n📝 Testing task creation with all fields...');
        const fullTaskData = {
            name: 'Complete Test Task',
            description: 'This is a task with all fields populated',
            projectId: validProjectId,
            availableToAll: true,
            status: 'Not Started',
            priority: 'High',
            estimatedHours: 16.5
        };

        try {
            const fullCreateResponse = await axios.post('http://localhost:8080/api/tasks', fullTaskData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Full task creation succeeded:', fullCreateResponse.data.data.name);

        } catch (fullCreateError) {
            console.log('❌ Full task creation failed:');
            if (fullCreateError.response) {
                console.log('   Status:', fullCreateError.response.status);
                console.log('   Message:', fullCreateError.response.data.message);
                if (fullCreateError.response.data.errors) {
                    console.log('   Validation Errors:');
                    fullCreateError.response.data.errors.forEach(err => {
                        console.log(`     - ${err.field}: ${err.message} (received: ${err.received})`);
                    });
                }
            } else {
                console.log('   Error:', fullCreateError.message);
            }
        }

        // Test 5: Test invalid task ID format for editing
        console.log('\n🔍 Testing invalid task ID format...');
        try {
            const invalidUpdateResponse = await axios.put('http://localhost:8080/api/tasks/invalid-id', {
                name: 'Test Update'
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

        } catch (invalidIdError) {
            console.log('❌ Invalid ID format correctly rejected:');
            if (invalidIdError.response) {
                console.log('   Status:', invalidIdError.response.status);
                console.log('   Message:', invalidIdError.response.data.message);
                console.log('   Details:', JSON.stringify(invalidIdError.response.data.details, null, 2));
            }
        }

        // Test 6: Test non-existent task editing
        console.log('\n🔍 Testing non-existent task ID...');
        const fakeTaskId = '12345678-1234-1234-1234-123456789999';
        try {
            const nonExistentResponse = await axios.put(`http://localhost:8080/api/tasks/${fakeTaskId}`, {
                name: 'Test Update'
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

        } catch (nonExistentError) {
            console.log('❌ Non-existent task correctly rejected:');
            if (nonExistentError.response) {
                console.log('   Status:', nonExistentError.response.status);
                console.log('   Message:', nonExistentError.response.data.message);
            }
        }

    } catch (error) {
        console.error('❌ Test setup failed:', error.message);
        if (error.response) {
            console.error('   Response data:', error.response.data);
        }
    }
}

// Run the debug test
debugTaskCreation().then(() => {
    console.log('\n=== Debug Test Completed ===');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});