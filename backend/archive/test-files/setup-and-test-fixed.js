const axios = require('axios');

async function setupProjectsAndTestData() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('🔧 SETTING UP PROJECTS AND TEST DATA');
  console.log('='*50);
  
  try {
    // Get admin token
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    const adminToken = loginResponse.data.data.accessToken;
    console.log('✅ Admin authentication successful');

    // Wait a bit to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if we can create projects directly in database or need to use different approach
    console.log('\n📊 Step 1: Setting up Projects for Timesheet Testing');
    console.log('-'.repeat(40));

    // Try to create projects for timesheet functionality
    const projectsToCreate = [
      {
        name: 'HRM System Development',
        description: 'Main HRM system development project',
        status: 'active'
      },
      {
        name: 'Frontend Development',
        description: 'User interface and frontend components',
        status: 'active'
      },
      {
        name: 'Backend API Development',
        description: 'REST API and database development',
        status: 'active'
      }
    ];

    // Check current projects first
    try {
      const currentProjects = await axios.get(`${baseURL}/timesheets/meta/projects`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`Current projects: ${currentProjects.data.data.length}`);
    } catch (error) {
      console.log('Could not fetch current projects');
    }

    // Try different approaches to create projects
    const projectEndpoints = [
      '/projects',
      '/timesheets/projects',
      '/admin/projects',
      '/timesheets/meta/projects'
    ];

    let projectCreated = false;
    for (const endpoint of projectEndpoints) {
      for (const project of projectsToCreate) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting delay
          
          const response = await axios.post(`${baseURL}${endpoint}`, project, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          
          console.log(`✅ Created project "${project.name}" via ${endpoint}`);
          projectCreated = true;
          break;
        } catch (error) {
          // Try next endpoint
        }
      }
      if (projectCreated) break;
    }

    if (!projectCreated) {
      console.log('⚠️ Could not create projects via API - may need database seeding');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

async function runFixedBusinessCaseTest() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('\n🎯 FIXED BUSINESS CASE TESTING');
  console.log('='*50);
  
  try {
    // Get tokens with delays to avoid rate limiting
    const adminLogin = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    const adminToken = adminLogin.data.data.accessToken;

    await new Promise(resolve => setTimeout(resolve, 1000));

    const empLogin = await axios.post(`${baseURL}/auth/login`, {
      email: 'employee@company.com',
      password: 'Mv4pS9wE2nR6kA8j'
    });
    const empToken = empLogin.data.data.accessToken;

    console.log('✅ Authentication successful');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: Simplified Employee Creation
    console.log('\n👥 Test 1: Employee Creation (Simplified)');
    console.log('-'.repeat(40));

    try {
      // Get departments and positions
      const departments = await axios.get(`${baseURL}/employees/meta/departments`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const positions = await axios.get(`${baseURL}/employees/meta/positions`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Simple employee creation
      const newEmployee = {
        firstName: 'Test',
        lastName: 'Employee',
        email: `test.employee.${Date.now()}@company.com`,
        departmentId: departments.data.data[0].id,
        positionId: positions.data.data[0].id
      };

      const empResponse = await axios.post(`${baseURL}/employees`, newEmployee, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      console.log(`✅ Employee created: ${empResponse.data.data.firstName} ${empResponse.data.data.lastName}`);

    } catch (error) {
      console.log(`❌ Employee creation failed: ${error.response?.data?.message || error.message}`);
      
      // Try even simpler format
      try {
        const simpleEmp = {
          firstName: 'Simple',
          lastName: 'Test',
          email: `simple.test.${Date.now()}@company.com`
        };
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const simpleResponse = await axios.post(`${baseURL}/employees`, simpleEmp, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log(`✅ Simple employee created: ${simpleResponse.data.data.firstName}`);
      } catch (simpleError) {
        console.log(`❌ Simple employee creation also failed: ${simpleError.response?.data?.message || simpleError.message}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Simplified Leave Request
    console.log('\n🏖️ Test 2: Leave Request (Simplified)');
    console.log('-'.repeat(40));

    try {
      const leaveTypes = await axios.get(`${baseURL}/leaves/types`, {
        headers: { Authorization: `Bearer ${empToken}` }
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const leaveRequest = {
        leaveTypeId: leaveTypes.data.data[0].id,
        startDate: '2025-08-15',
        endDate: '2025-08-15',
        reason: 'Test leave request'
      };

      const leaveResponse = await axios.post(`${baseURL}/leaves`, leaveRequest, {
        headers: { Authorization: `Bearer ${empToken}` }
      });

      console.log(`✅ Leave request created: ID ${leaveResponse.data.data.id}`);

    } catch (error) {
      console.log(`❌ Leave request failed: ${error.response?.data?.message || error.message}`);
      
      // Try with different date format
      try {
        const altLeave = {
          leaveTypeId: 1,
          startDate: new Date('2025-08-15').toISOString().split('T')[0],
          endDate: new Date('2025-08-15').toISOString().split('T')[0],
          reason: 'Alternative format test'
        };
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const altResponse = await axios.post(`${baseURL}/leaves`, altLeave, {
          headers: { Authorization: `Bearer ${empToken}` }
        });
        
        console.log(`✅ Alternative leave request created: ID ${altResponse.data.data.id}`);
      } catch (altError) {
        console.log(`❌ Alternative leave request also failed: ${altError.response?.data?.message || altError.message}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Check for existing projects or create them
    console.log('\n⏰ Test 3: Timesheet Testing');
    console.log('-'.repeat(40));

    try {
      const projects = await axios.get(`${baseURL}/timesheets/meta/projects`, {
        headers: { Authorization: `Bearer ${empToken}` }
      });

      console.log(`Available projects: ${projects.data.data.length}`);

      if (projects.data.data.length === 0) {
        console.log('⚠️ No projects found - timesheet testing requires projects');
        
        // Check if we can see the database structure
        console.log('🔍 Checking if we need to seed project data...');
      } else {
        // Try timesheet creation
        const timesheet = {
          projectId: projects.data.data[0].id,
          date: '2025-08-10',
          hoursWorked: 8,
          taskDescription: 'Testing timesheet functionality'
        };

        await new Promise(resolve => setTimeout(resolve, 500));

        const timesheetResponse = await axios.post(`${baseURL}/timesheets`, timesheet, {
          headers: { Authorization: `Bearer ${empToken}` }
        });

        console.log(`✅ Timesheet entry created: ${timesheetResponse.data.data.id}`);
      }

    } catch (error) {
      console.log(`❌ Timesheet testing failed: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎯 FIXED TEST SUMMARY');
    console.log('='*40);
    console.log('✅ Authentication: Working');
    console.log('✅ API Connectivity: Working');
    console.log('⚠️ Employee Creation: Needs payload debugging');
    console.log('⚠️ Leave Requests: Needs validation debugging');
    console.log('⚠️ Timesheets: Needs project data setup');

  } catch (error) {
    console.error('❌ Fixed testing failed:', error.message);
  }
}

// Run setup and testing
async function main() {
  await setupProjectsAndTestData();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before main test
  await runFixedBusinessCaseTest();
}

main().catch(console.error);
