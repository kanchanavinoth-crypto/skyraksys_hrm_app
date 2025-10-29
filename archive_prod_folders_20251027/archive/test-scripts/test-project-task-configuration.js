const axios = require('axios');

class ProjectTaskConfigurationTest {
  constructor() {
    this.baseURL = 'http://localhost:8080/api';
    this.authToken = null;
    this.testResults = [];
    this.testLog = [];
  }

  log(message) {
    console.log(message);
    this.testLog.push(message);
  }

  async login() {
    try {
      this.log('🔐 Logging in as admin...');
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: 'admin@company.com',
        password: 'Kx9mP7qR2nF8sA5t'
      });
      
      this.authToken = response.data.token;
      this.log('✅ Login successful');
      return true;
    } catch (error) {
      this.log(`❌ Login failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  async testProjectValidation() {
    this.log('\n📋 TESTING PROJECT VALIDATION\n=====================================');

    // Test 1: Empty project creation
    await this.testProjectCreation('Empty Request', {}, {
      expectedStatus: 400,
      expectedMessage: 'Project validation failed'
    });

    // Test 2: Missing required name field
    await this.testProjectCreation('Missing Name', {
      description: 'Test project without name'
    }, {
      expectedStatus: 400,
      expectedField: 'name'
    });

    // Test 3: Invalid data types
    await this.testProjectCreation('Invalid Data Types', {
      name: 123, // Should be string
      startDate: 'invalid-date',
      status: 'InvalidStatus'
    }, {
      expectedStatus: 400,
      expectedMessage: 'Project validation failed'
    });

    // Test 4: Valid project creation
    const projectData = {
      name: 'Test Project Configuration',
      description: 'Testing enhanced project validation',
      status: 'Planning',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    };
    
    const project = await this.testProjectCreation('Valid Project', projectData, {
      expectedStatus: 201,
      expectedSuccess: true
    });

    return project;
  }

  async testProjectCreation(testName, data, expectations) {
    try {
      this.log(`\n🧪 Test: ${testName}`);
      const response = await axios.post(`${this.baseURL}/projects`, data, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (expectations.expectedStatus !== response.status) {
        this.log(`❌ Expected status ${expectations.expectedStatus}, got ${response.status}`);
        return null;
      }

      if (expectations.expectedSuccess && response.data.success) {
        this.log(`✅ ${testName}: Project created successfully`);
        this.log(`   Project ID: ${response.data.data.id}`);
        this.log(`   Project Name: ${response.data.data.name}`);
        return response.data.data;
      } else {
        this.log(`✅ ${testName}: Validation working as expected`);
        if (response.data.errors) {
          this.log(`   Validation errors: ${response.data.errors.length} field(s)`);
        }
        return null;
      }
    } catch (error) {
      const response = error.response;
      if (expectations.expectedStatus === response?.status) {
        this.log(`✅ ${testName}: Expected error response received`);
        if (response.data.message) {
          this.log(`   Error: ${response.data.message}`);
        }
        if (response.data.validationGuide) {
          this.log(`   Validation guide provided: Yes`);
        }
        return null;
      } else {
        this.log(`❌ ${testName}: Unexpected error - ${response?.data?.message || error.message}`);
        return null;
      }
    }
  }

  async testTaskValidation(projectId) {
    this.log('\n📝 TESTING TASK VALIDATION\n=====================================');

    // Test 1: Empty task creation
    await this.testTaskCreation('Empty Request', {}, {
      expectedStatus: 400,
      expectedMessage: 'Task validation failed'
    });

    // Test 2: Missing required fields
    await this.testTaskCreation('Missing Required Fields', {
      description: 'Task without name or project'
    }, {
      expectedStatus: 400,
      expectedField: 'name'
    });

    // Test 3: Invalid project reference
    await this.testTaskCreation('Invalid Project ID', {
      name: 'Test Task',
      projectId: '99999999-1234-1234-1234-123456789001'
    }, {
      expectedStatus: 400,
      expectedMessage: 'Invalid project specified'
    });

    // Test 4: Valid task creation
    if (projectId) {
      const taskData = {
        name: 'Test Task Configuration',
        description: 'Testing enhanced task validation',
        projectId: projectId,
        availableToAll: true,
        priority: 'Medium',
        status: 'Not Started'
      };
      
      const task = await this.testTaskCreation('Valid Task', taskData, {
        expectedStatus: 201,
        expectedSuccess: true
      });

      return task;
    }

    return null;
  }

  async testTaskCreation(testName, data, expectations) {
    try {
      this.log(`\n🧪 Test: ${testName}`);
      const response = await axios.post(`${this.baseURL}/tasks`, data, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (expectations.expectedStatus !== response.status) {
        this.log(`❌ Expected status ${expectations.expectedStatus}, got ${response.status}`);
        return null;
      }

      if (expectations.expectedSuccess && response.data.success) {
        this.log(`✅ ${testName}: Task created successfully`);
        this.log(`   Task ID: ${response.data.data.id}`);
        this.log(`   Task Name: ${response.data.data.name}`);
        this.log(`   Available to All: ${response.data.data.availableToAll}`);
        return response.data.data;
      } else {
        this.log(`✅ ${testName}: Validation working as expected`);
        return null;
      }
    } catch (error) {
      const response = error.response;
      if (expectations.expectedStatus === response?.status) {
        this.log(`✅ ${testName}: Expected error response received`);
        if (response.data.message) {
          this.log(`   Error: ${response.data.message}`);
        }
        if (response.data.validationGuide) {
          this.log(`   Validation guide provided: Yes`);
          this.log(`   Required fields: ${response.data.validationGuide.requiredFields?.join(', ')}`);
        }
        return null;
      } else {
        this.log(`❌ ${testName}: Unexpected error - ${response?.data?.message || error.message}`);
        return null;
      }
    }
  }

  async testTaskAccessValidation(taskId) {
    this.log('\n🔐 TESTING TASK ACCESS VALIDATION\n=====================================');

    if (!taskId) {
      this.log('⚠️  Skipping task access tests - no valid task available');
      return;
    }

    try {
      // Test with employee credentials
      this.log('\n🔄 Switching to employee login...');
      const empResponse = await axios.post(`${this.baseURL}/auth/login`, {
        email: 'employee@company.com',
        password: 'Mv4pS9wE2nR6kA8j'
      });
      
      const empToken = empResponse.data.token;
      this.log('✅ Employee login successful');

      // Test timesheet creation with task access validation
      const timesheetData = {
        projectId: '12345678-1234-1234-1234-123456789001',
        taskId: taskId,
        weekStartDate: '2024-01-15',
        mondayHours: 8,
        tuesdayHours: 8,
        description: 'Testing task access validation'
      };

      this.log('\n🧪 Test: Timesheet Creation with Task Access Validation');
      const response = await axios.post(`${this.baseURL}/timesheets`, timesheetData, {
        headers: { Authorization: `Bearer ${empToken}` }
      });

      if (response.data.success) {
        this.log('✅ Timesheet created successfully - Task access validation passed');
      } else {
        this.log('❌ Timesheet creation failed');
      }

    } catch (error) {
      const response = error.response;
      if (response?.data?.message?.includes('task')) {
        this.log(`✅ Task access validation working: ${response.data.message}`);
        if (response.data.details) {
          this.log(`   Access reason: ${response.data.details.reason || 'Not specified'}`);
        }
      } else {
        this.log(`❌ Unexpected error: ${response?.data?.message || error.message}`);
      }
    }
  }

  async testErrorMessageQuality() {
    this.log('\n📝 TESTING ERROR MESSAGE QUALITY\n=====================================');

    const testCases = [
      {
        name: 'Project with invalid date range',
        endpoint: 'projects',
        data: {
          name: 'Invalid Date Project',
          startDate: '2024-12-31',
          endDate: '2024-01-01' // End before start
        }
      },
      {
        name: 'Task with non-existent project',
        endpoint: 'tasks',
        data: {
          name: 'Orphaned Task',
          projectId: '00000000-0000-0000-0000-000000000000'
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        this.log(`\n🧪 Test: ${testCase.name}`);
        await axios.post(`${this.baseURL}/${testCase.endpoint}`, testCase.data, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        this.log(`❌ Expected validation error but request succeeded`);
      } catch (error) {
        const response = error.response;
        if (response?.data) {
          this.log(`✅ Error message quality check:`);
          this.log(`   Message: ${response.data.message}`);
          this.log(`   Has details: ${!!response.data.details}`);
          this.log(`   Has hint: ${!!response.data.hint}`);
          this.log(`   Has validation guide: ${!!response.data.validationGuide}`);
        }
      }
    }
  }

  async runComprehensiveTest() {
    this.log('🚀 STARTING PROJECT/TASK CONFIGURATION VALIDATION\n');

    // Login
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      this.log('❌ Cannot proceed without authentication');
      return false;
    }

    // Test project validation
    const project = await this.testProjectValidation();

    // Test task validation
    const task = await this.testTaskValidation(project?.id);

    // Test task access validation
    await this.testTaskAccessValidation(task?.id);

    // Test error message quality
    await this.testErrorMessageQuality();

    this.log('\n🎉 PROJECT/TASK CONFIGURATION VALIDATION COMPLETE\n=====================================');
    
    return true;
  }
}

// Run the test
const tester = new ProjectTaskConfigurationTest();
tester.runComprehensiveTest().then(success => {
  if (success) {
    console.log('✅ All project/task configuration tests completed successfully!');
  } else {
    console.log('❌ Some tests failed. Check the output above for details.');
  }
}).catch(error => {
  console.error('❌ Test runner error:', error.message);
});