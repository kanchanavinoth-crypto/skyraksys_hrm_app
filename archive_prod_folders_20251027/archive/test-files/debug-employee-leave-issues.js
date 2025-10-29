const axios = require('axios');

async function debugEmployeeCreationIssues() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('🔧 DEBUGGING EMPLOYEE CREATION & LEAVE REQUEST ISSUES');
  console.log('='*60);
  
  try {
    // Get admin token
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    const adminToken = loginResponse.data.data.accessToken;
    console.log('✅ Admin authentication successful');

    // Get employee token for leave requests
    const empLoginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'employee@company.com',
      password: 'Mv4pS9wE2nR6kA8j'
    });
    const employeeToken = empLoginResponse.data.data.accessToken;
    console.log('✅ Employee authentication successful');

    // Debug 1: Check what employee creation expects
    console.log('\n🔍 Step 1: Investigating Employee Creation Requirements');
    console.log('-'.repeat(50));
    
    // Get departments and positions first
    const deptResponse = await axios.get(`${baseURL}/employees/meta/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const departments = deptResponse.data.data;
    
    const posResponse = await axios.get(`${baseURL}/employees/meta/positions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const positions = posResponse.data.data;
    
    console.log('Available Departments:');
    departments.forEach(dept => {
      console.log(`   • ID: ${dept.id}, Name: ${dept.name}`);
    });
    
    console.log('Available Positions:');
    positions.forEach(pos => {
      console.log(`   • ID: ${pos.id}, Name: ${pos.name}`);
    });

    // Try different employee creation payload structures
    const employeeTestCases = [
      {
        name: 'Minimal Required Fields',
        payload: {
          firstName: 'Test',
          lastName: 'Employee',
          email: `test.minimal.${Date.now()}@company.com`,
          role: 'Software Developer'
        }
      },
      {
        name: 'With Department ID Only',
        payload: {
          firstName: 'Test',
          lastName: 'Employee2',
          email: `test.dept.${Date.now()}@company.com`,
          role: 'Software Developer',
          departmentId: departments[0].id
        }
      },
      {
        name: 'With Position ID Only',
        payload: {
          firstName: 'Test',
          lastName: 'Employee3',
          email: `test.pos.${Date.now()}@company.com`,
          role: 'Software Developer',
          positionId: positions[0].id
        }
      },
      {
        name: 'With Both Department and Position IDs',
        payload: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: `sarah.johnson.${Date.now()}@company.com`,
          role: 'Software Developer',
          departmentId: departments[0].id,
          positionId: positions[0].id,
          hireDate: '2025-08-10',
          status: 'active',
          employmentType: 'full-time'
        }
      },
      {
        name: 'Complete Employee Profile',
        payload: {
          employeeId: `EMP${Date.now()}`,
          firstName: 'Michael',
          lastName: 'Chen',
          email: `michael.chen.${Date.now()}@company.com`,
          role: 'Marketing Manager',
          department: departments[0].name,
          departmentId: departments[0].id,
          position: positions[0].name,
          positionId: positions[0].id,
          hireDate: '2025-08-10',
          status: 'active',
          employmentType: 'full-time',
          salary: 75000,
          phone: '555-0123',
          address: '123 Main St, City, State 12345'
        }
      }
    ];

    console.log('\n🧪 Testing Different Employee Creation Payloads:');
    console.log('-'.repeat(50));
    
    let successfulEmployee = null;
    
    for (const testCase of employeeTestCases) {
      try {
        console.log(`\n📝 Testing: ${testCase.name}`);
        console.log(`   Email: ${testCase.payload.email}`);
        console.log(`   Payload: ${JSON.stringify(testCase.payload, null, 2)}`);
        
        const createResponse = await axios.post(`${baseURL}/employees`, testCase.payload, {
          headers: { 
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (createResponse.data && createResponse.data.data) {
          console.log(`   ✅ SUCCESS! Employee created with ID: ${createResponse.data.data.id}`);
          successfulEmployee = createResponse.data.data;
          break; // Found working format
        }
        
      } catch (error) {
        console.log(`   ❌ FAILED: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.details || error.response?.data?.errors) {
          console.log(`   Details: ${JSON.stringify(error.response.data.details || error.response.data.errors, null, 2)}`);
        }
      }
    }

    // Debug 2: Leave Request Issues
    console.log('\n🔍 Step 2: Investigating Leave Request Requirements');
    console.log('-'.repeat(50));
    
    // Get leave types
    const leaveTypesResponse = await axios.get(`${baseURL}/leaves/types`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const leaveTypes = leaveTypesResponse.data.data;
    
    console.log('Available Leave Types:');
    leaveTypes.forEach(lt => {
      console.log(`   • ID: ${lt.id}, Name: ${lt.name}, Max Days: ${lt.maxDays || 'Unlimited'}`);
    });

    // Try different leave request payload structures
    const leaveTestCases = [
      {
        name: 'Minimal Leave Request',
        payload: {
          leaveTypeId: leaveTypes[0].id,
          startDate: '2025-08-15',
          endDate: '2025-08-17',
          reason: 'Testing minimal leave request'
        }
      },
      {
        name: 'Full Leave Request',
        payload: {
          leaveTypeId: leaveTypes[0].id,
          startDate: '2025-08-15',
          endDate: '2025-08-17',
          reason: 'Business case testing - Annual leave',
          isHalfDay: false,
          comments: 'Test leave request for validation'
        }
      },
      {
        name: 'Half Day Leave Request',
        payload: {
          leaveTypeId: leaveTypes[1]?.id || leaveTypes[0].id,
          startDate: '2025-08-12',
          endDate: '2025-08-12',
          reason: 'Half day testing',
          isHalfDay: true
        }
      }
    ];

    console.log('\n🧪 Testing Different Leave Request Payloads:');
    console.log('-'.repeat(50));
    
    let successfulLeave = null;
    
    for (const testCase of leaveTestCases) {
      try {
        console.log(`\n📝 Testing: ${testCase.name}`);
        console.log(`   Leave Type ID: ${testCase.payload.leaveTypeId}`);
        console.log(`   Dates: ${testCase.payload.startDate} to ${testCase.payload.endDate}`);
        console.log(`   Payload: ${JSON.stringify(testCase.payload, null, 2)}`);
        
        const leaveResponse = await axios.post(`${baseURL}/leaves`, testCase.payload, {
          headers: { 
            Authorization: `Bearer ${employeeToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (leaveResponse.data && leaveResponse.data.data) {
          console.log(`   ✅ SUCCESS! Leave request created with ID: ${leaveResponse.data.data.id}`);
          successfulLeave = leaveResponse.data.data;
          break; // Found working format
        }
        
      } catch (error) {
        console.log(`   ❌ FAILED: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.details || error.response?.data?.errors) {
          console.log(`   Details: ${JSON.stringify(error.response.data.details || error.response.data.errors, null, 2)}`);
        }
      }
    }

    // Debug 3: Projects for Timesheets
    console.log('\n🔍 Step 3: Investigating Timesheet Projects');
    console.log('-'.repeat(50));
    
    // Check if we can create projects or if they need to be pre-seeded
    try {
      const projectCreateTest = {
        name: 'Test Project',
        description: 'Business case testing project',
        status: 'active',
        startDate: '2025-08-01',
        endDate: '2025-12-31'
      };

      console.log('🧪 Attempting to create a test project...');
      const projectResponse = await axios.post(`${baseURL}/timesheets/meta/projects`, projectCreateTest, {
        headers: { 
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Project creation successful!');
      
      // Now try timesheet entry
      const timesheetEntry = {
        date: '2025-08-10',
        projectId: projectResponse.data.data.id,
        taskDescription: 'Testing timesheet functionality',
        hoursWorked: 8,
        comments: 'Business case validation testing'
      };
      
      const timesheetResponse = await axios.post(`${baseURL}/timesheets`, timesheetEntry, {
        headers: { 
          Authorization: `Bearer ${employeeToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Timesheet entry creation successful!');
      
    } catch (error) {
      console.log(`❌ Project/Timesheet testing failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      
      // Try alternative project creation endpoints
      const alternativeEndpoints = [
        '/projects',
        '/timesheets/projects',
        '/admin/projects'
      ];
      
      for (const endpoint of alternativeEndpoints) {
        try {
          console.log(`🔍 Trying alternative endpoint: ${endpoint}`);
          const altResponse = await axios.post(`${baseURL}${endpoint}`, projectCreateTest, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          console.log(`✅ Success with ${endpoint}!`);
          break;
        } catch (altError) {
          console.log(`❌ ${endpoint}: ${altError.response?.status} - ${altError.response?.data?.message || altError.message}`);
        }
      }
    }

    // Summary
    console.log('\n' + '='*70);
    console.log('🎯 DEBUGGING SUMMARY & FIXES NEEDED');
    console.log('='*70);
    
    if (successfulEmployee) {
      console.log('✅ EMPLOYEE CREATION: Fixed - Working payload identified');
      console.log(`   Format: ${JSON.stringify(successfulEmployee, null, 2)}`);
    } else {
      console.log('❌ EMPLOYEE CREATION: Still needs investigation');
      console.log('   Check backend validation rules and required fields');
    }
    
    if (successfulLeave) {
      console.log('✅ LEAVE REQUEST: Fixed - Working payload identified');
      console.log(`   Format: ${JSON.stringify(successfulLeave, null, 2)}`);
    } else {
      console.log('❌ LEAVE REQUEST: Still needs investigation');
      console.log('   Check backend validation rules for leave requests');
    }
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('1. Update employee creation payload format in business test');
    console.log('2. Update leave request payload format in business test');
    console.log('3. Create initial projects for timesheet testing');
    console.log('4. Verify all required fields in backend validation');

  } catch (error) {
    console.error('❌ Debug process failed:', error.message);
  }
}

// Run the debugging
debugEmployeeCreationIssues().catch(console.error);
