const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';
let token = '';

// Comprehensive task validation test
async function comprehensiveTaskValidationTest() {
  console.log('🔍 COMPREHENSIVE TASK VALIDATION TEST\n');

  // Login first
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful\n');
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
    return;
  }

  // Test scenarios
  const testScenarios = [
    {
      name: '1. Valid Task Creation',
      type: 'create',
      data: {
        name: 'Test Task Valid',
        description: 'Valid test task',
        projectId: '12345678-1234-1234-1234-123456789001',
        status: 'Not Started',
        priority: 'Medium',
        estimatedHours: 10,
        availableToAll: true
      },
      expectSuccess: true
    },
    {
      name: '2. Missing Required Fields',
      type: 'create',
      data: {
        description: 'Missing name and projectId'
      },
      expectSuccess: false,
      expectedErrors: ['name', 'projectId']
    },
    {
      name: '3. Invalid Field Values',
      type: 'create',
      data: {
        name: 'A', // Too short
        projectId: 'invalid-uuid',
        status: 'InvalidStatus',
        priority: 'SuperHigh',
        estimatedHours: -5
      },
      expectSuccess: false,
      expectedErrors: ['name', 'projectId', 'status', 'priority', 'estimatedHours']
    },
    {
      name: '4. Valid Task Update',
      type: 'update',
      taskId: '12345678-1234-1234-1234-123456789014',
      data: {
        status: 'In Progress',
        actualHours: 5.5,
        description: 'Updated description'
      },
      expectSuccess: true
    },
    {
      name: '5. Invalid Task Update',
      type: 'update',
      taskId: '12345678-1234-1234-1234-123456789015',
      data: {
        status: 'BadStatus',
        priority: 'WrongPriority',
        estimatedHours: -10,
        actualHours: -2
      },
      expectSuccess: false,
      expectedErrors: ['status', 'priority', 'estimatedHours', 'actualHours']
    },
    {
      name: '6. Update with Null Values',
      type: 'update',
      taskId: '12345678-1234-1234-1234-123456789016',
      data: {
        assignedTo: null,
        availableToAll: true,
        description: 'Updated with nulls'
      },
      expectSuccess: true
    },
    {
      name: '7. Invalid Task ID Format',
      type: 'update',
      taskId: 'invalid-task-id',
      data: {
        status: 'Completed'
      },
      expectSuccess: false,
      expectedErrors: ['taskId']
    },
    {
      name: '8. Non-existent Task ID',
      type: 'update',
      taskId: '99999999-9999-9999-9999-999999999999',
      data: {
        status: 'Completed'
      },
      expectSuccess: false,
      expectedErrors: ['notFound']
    }
  ];

  let passedTests = 0;
  let totalTests = testScenarios.length;

  for (const scenario of testScenarios) {
    console.log(`🧪 ${scenario.name}`);
    
    try {
      let response;
      
      if (scenario.type === 'create') {
        response = await axios.post(`${BASE_URL}/tasks`, scenario.data, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      } else if (scenario.type === 'update') {
        response = await axios.put(`${BASE_URL}/tasks/${scenario.taskId}`, scenario.data, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      }

      if (scenario.expectSuccess) {
        console.log('   ✅ SUCCESS - Operation completed as expected');
        console.log(`   📝 Result: ${scenario.type === 'create' ? 'Task created' : 'Task updated'} successfully`);
        passedTests++;
      } else {
        console.log('   ❌ UNEXPECTED SUCCESS - Expected validation to fail but it passed');
        console.log('   📝 Response:', response.data);
      }

    } catch (error) {
      if (!scenario.expectSuccess) {
        console.log('   ✅ EXPECTED FAILURE - Validation failed as expected');
        
        if (error.response?.data?.errors) {
          console.log('   📝 Validation Errors:');
          error.response.data.errors.forEach(err => {
            console.log(`      - ${err.field}: ${err.message}`);
          });
        } else if (error.response?.data?.message) {
          console.log(`   📝 Error: ${error.response.data.message}`);
        }
        passedTests++;
      } else {
        console.log('   ❌ UNEXPECTED FAILURE - Expected success but got error');
        console.log(`   📝 Error: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('📊 TEST SUMMARY:');
  console.log(`   ✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`   ❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED - Task validation is working correctly!');
  } else {
    console.log('\n⚠️  Some tests failed - there may be validation issues');
  }

  // Additional diagnostic info
  console.log('\n🔧 VALIDATION DIAGNOSTICS:');
  console.log('   📋 Valid Status Values: Not Started, In Progress, Completed, On Hold');
  console.log('   📋 Valid Priority Values: Low, Medium, High, Critical');
  console.log('   📋 Required Fields (Create): name, projectId');
  console.log('   📋 Optional Fields (Create): description, assignedTo, availableToAll, status, priority, estimatedHours');
  console.log('   📋 Update Fields: All fields optional except task ID must be valid UUID');
}

// Run the test
comprehensiveTaskValidationTest().catch(console.error);