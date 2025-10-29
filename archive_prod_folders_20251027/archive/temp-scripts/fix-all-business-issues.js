const axios = require('axios');
const fs = require('fs');

async function fixAllBusinessCaseIssues() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('🔧 FIXING ALL BUSINESS CASE ISSUES');
  console.log('='*60);
  console.log('Addressing employee creation, leave requests, and project setup...\n');
  
  const results = {
    fixes: [],
    createdData: [],
    issues: []
  };

  try {
    // Get tokens
    const adminLogin = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    const adminToken = adminLogin.data.data.accessToken;
    const adminUser = adminLogin.data.data.user;
    
    const employeeLogin = await axios.post(`${baseURL}/auth/login`, {
      email: 'employee@company.com', 
      password: 'Mv4pS9wE2nR6kA8j'
    });
    const employeeToken = employeeLogin.data.data.accessToken;
    const employeeUser = employeeLogin.data.data.user;

    console.log('✅ Authentication successful for both admin and employee');

    // Get necessary reference data
    const [deptResponse, posResponse, leaveTypesResponse] = await Promise.all([
      axios.get(`${baseURL}/employees/meta/departments`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      axios.get(`${baseURL}/employees/meta/positions`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      axios.get(`${baseURL}/leaves/types`, { headers: { Authorization: `Bearer ${employeeToken}` } })
    ]);

    const departments = deptResponse.data.data;
    const positions = posResponse.data.data;
    const leaveTypes = leaveTypesResponse.data.data;

    console.log(`📊 Reference data loaded: ${departments.length} departments, ${positions.length} positions, ${leaveTypes.length} leave types`);

    // Fix 1: Employee Creation with correct payload
    console.log('\n🔧 Fix 1: Employee Creation with employeeId');
    console.log('-'.repeat(50));
    
    try {
      const employeePayload = {
        employeeId: `EMP${Date.now()}`, // This was missing!
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: `sarah.johnson.${Date.now()}@company.com`,
        role: 'Software Developer',
        departmentId: departments[0].id,
        positionId: positions[0].id,
        hireDate: '2025-08-10',
        status: 'active',
        employmentType: 'full-time'
      };

      console.log(`📝 Creating employee with payload:`);
      console.log(`   Employee ID: ${employeePayload.employeeId}`);
      console.log(`   Name: ${employeePayload.firstName} ${employeePayload.lastName}`);
      console.log(`   Email: ${employeePayload.email}`);

      const empResponse = await axios.post(`${baseURL}/employees`, employeePayload, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      console.log(`✅ SUCCESS! Employee created with ID: ${empResponse.data.data.id}`);
      results.fixes.push('Employee creation fixed - employeeId field added');
      results.createdData.push(`Employee: ${empResponse.data.data.firstName} ${empResponse.data.data.lastName} (${empResponse.data.data.id})`);

      // Create another employee for testing diversity
      const employee2Payload = {
        employeeId: `EMP${Date.now()}B`,
        firstName: 'Michael',
        lastName: 'Chen',
        email: `michael.chen.${Date.now()}@company.com`,
        role: 'Marketing Manager',
        departmentId: departments[1]?.id || departments[0].id,
        positionId: positions[1]?.id || positions[0].id,
        hireDate: '2025-08-01',
        status: 'active',
        employmentType: 'full-time'
      };

      await new Promise(resolve => setTimeout(resolve, 1000));

      const emp2Response = await axios.post(`${baseURL}/employees`, employee2Payload, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      console.log(`✅ SUCCESS! Second employee created: ${emp2Response.data.data.firstName} ${emp2Response.data.data.lastName}`);
      results.createdData.push(`Employee: ${emp2Response.data.data.firstName} ${emp2Response.data.data.lastName} (${emp2Response.data.data.id})`);

    } catch (error) {
      console.log(`❌ Employee creation still failed: ${error.response?.data?.message || error.message}`);
      if (error.response?.data?.details) {
        console.log(`Details: ${JSON.stringify(error.response.data.details, null, 2)}`);
      }
      results.issues.push(`Employee creation: ${error.message}`);
    }

    // Fix 2: Leave Request with correct payload  
    console.log('\n🔧 Fix 2: Leave Request with employeeId');
    console.log('-'.repeat(50));

    try {
      const leavePayload = {
        employeeId: employeeUser.employee?.id || employeeUser.id, // This was missing!
        leaveTypeId: leaveTypes[0].id,
        startDate: '2025-08-15',
        endDate: '2025-08-17', 
        reason: 'Business case testing - Annual leave request with proper employeeId',
        isHalfDay: false
      };

      console.log(`📝 Creating leave request with payload:`);
      console.log(`   Employee ID: ${leavePayload.employeeId}`);
      console.log(`   Leave Type: ${leaveTypes[0].name}`);
      console.log(`   Dates: ${leavePayload.startDate} to ${leavePayload.endDate}`);

      const leaveResponse = await axios.post(`${baseURL}/leaves`, leavePayload, {
        headers: { Authorization: `Bearer ${employeeToken}` }
      });

      console.log(`✅ SUCCESS! Leave request created with ID: ${leaveResponse.data.data.id}`);
      results.fixes.push('Leave request fixed - employeeId field added');
      results.createdData.push(`Leave Request: ${leaveResponse.data.data.id} (${leaveTypes[0].name})`);

      // Create a second leave request (sick leave)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const sickLeavePayload = {
        employeeId: employeeUser.employee?.id || employeeUser.id,
        leaveTypeId: leaveTypes.find(lt => lt.name.includes('Sick'))?.id || leaveTypes[1].id,
        startDate: '2025-08-20',
        endDate: '2025-08-20',
        reason: 'Medical appointment - business case testing',
        isHalfDay: true
      };

      const sickLeaveResponse = await axios.post(`${baseURL}/leaves`, sickLeavePayload, {
        headers: { Authorization: `Bearer ${employeeToken}` }
      });

      console.log(`✅ SUCCESS! Sick leave request created: ${sickLeaveResponse.data.data.id}`);
      results.createdData.push(`Sick Leave Request: ${sickLeaveResponse.data.data.id}`);

    } catch (error) {
      console.log(`❌ Leave request still failed: ${error.response?.data?.message || error.message}`);
      if (error.response?.data?.details) {
        console.log(`Details: ${JSON.stringify(error.response.data.details, null, 2)}`);
      }
      results.issues.push(`Leave request: ${error.message}`);
    }

    // Fix 3: Create Projects for Timesheet Functionality
    console.log('\n🔧 Fix 3: Creating Projects for Timesheet System');
    console.log('-'.repeat(50));

    const projectsToCreate = [
      {
        name: 'HRM System Development',
        description: 'Main HRM system development and enhancement project',
        status: 'active'
      },
      {
        name: 'Frontend UI/UX Development', 
        description: 'User interface development and user experience improvements',
        status: 'active'
      },
      {
        name: 'Backend API Development',
        description: 'REST API development and database optimization',
        status: 'active'
      },
      {
        name: 'Business Process Automation',
        description: 'Workflow automation and business process improvements',
        status: 'active'
      }
    ];

    // Try different endpoints for project creation
    const projectEndpoints = [
      { endpoint: '/projects', method: 'POST' },
      { endpoint: '/timesheets/projects', method: 'POST' },
      { endpoint: '/admin/projects', method: 'POST' },
      { endpoint: '/timesheets/meta/projects', method: 'POST' }
    ];

    let projectsCreated = 0;
    let workingEndpoint = null;

    for (const endpointConfig of projectEndpoints) {
      try {
        console.log(`🧪 Trying endpoint: ${endpointConfig.endpoint}`);
        
        const projectResponse = await axios.post(`${baseURL}${endpointConfig.endpoint}`, projectsToCreate[0], {
          headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log(`✅ SUCCESS! Found working endpoint: ${endpointConfig.endpoint}`);
        workingEndpoint = endpointConfig.endpoint;
        
        // Create all projects using the working endpoint
        for (let i = 0; i < projectsToCreate.length; i++) {
          if (i > 0) await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            const response = await axios.post(`${baseURL}${workingEndpoint}`, projectsToCreate[i], {
              headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            projectsCreated++;
            console.log(`✅ Created project: ${projectsToCreate[i].name}`);
            results.createdData.push(`Project: ${projectsToCreate[i].name}`);
            
          } catch (createError) {
            console.log(`⚠️ Could not create ${projectsToCreate[i].name}: ${createError.response?.data?.message || createError.message}`);
          }
        }
        
        break; // Found working endpoint
        
      } catch (error) {
        console.log(`❌ ${endpointConfig.endpoint}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    if (projectsCreated > 0) {
      results.fixes.push(`Created ${projectsCreated} projects for timesheet functionality`);
      
      // Now test timesheet creation
      console.log('\n🧪 Testing Timesheet Entry with New Project');
      console.log('-'.repeat(40));
      
      try {
        // Get updated projects list
        const projectsResponse = await axios.get(`${baseURL}/timesheets/meta/projects`, {
          headers: { Authorization: `Bearer ${employeeToken}` }
        });
        
        if (projectsResponse.data.data.length > 0) {
          const timesheetPayload = {
            date: '2025-08-10',
            projectId: projectsResponse.data.data[0].id,
            taskDescription: 'Business case testing - Completed all HRM workflow validation and testing',
            hoursWorked: 8,
            comments: 'Successfully tested employee creation, leave requests, and project setup'
          };

          const timesheetResponse = await axios.post(`${baseURL}/timesheets`, timesheetPayload, {
            headers: { Authorization: `Bearer ${employeeToken}` }
          });

          console.log(`✅ SUCCESS! Timesheet entry created: ${timesheetResponse.data.data.id}`);
          results.fixes.push('Timesheet functionality working with new projects');
          results.createdData.push(`Timesheet Entry: ${timesheetResponse.data.data.id} (${timesheetPayload.hoursWorked} hours)`);
        }
        
      } catch (timesheetError) {
        console.log(`⚠️ Timesheet test: ${timesheetError.response?.data?.message || timesheetError.message}`);
      }
      
    } else {
      console.log('⚠️ No projects could be created - may need database seeding or different approach');
      results.issues.push('Project creation failed - timesheet functionality limited');
    }

  } catch (error) {
    console.error('❌ Fix process failed:', error.message);
    results.issues.push(`System error: ${error.message}`);
  }

  // Summary Report
  console.log('\n' + '='*70);
  console.log('🎯 BUSINESS CASE FIXES SUMMARY');
  console.log('='*70);
  
  console.log('\n✅ FIXES APPLIED:');
  results.fixes.forEach(fix => {
    console.log(`   • ${fix}`);
  });

  console.log('\n📈 DATA SUCCESSFULLY CREATED:');
  results.createdData.forEach(data => {
    console.log(`   • ${data}`);
  });

  if (results.issues.length > 0) {
    console.log('\n⚠️ REMAINING ISSUES:');
    results.issues.forEach(issue => {
      console.log(`   • ${issue}`);
    });
  }

  console.log('\n🏆 FINAL STATUS:');
  const successRate = results.fixes.length > 0 ? 'SIGNIFICANTLY IMPROVED' : 'NEEDS ATTENTION';
  console.log(`   Status: ${successRate}`);
  console.log(`   Fixes Applied: ${results.fixes.length}`);
  console.log(`   Data Created: ${results.createdData.length} items`);
  console.log(`   Issues Remaining: ${results.issues.length}`);

  if (results.fixes.length >= 2) {
    console.log('\n🎉 MAJOR IMPROVEMENTS COMPLETED!');
    console.log('   Your business case testing should now show much higher success rates!');
    console.log('   Ready to run final validation test again.');
  }

  // Save fix report
  const reportFile = `business-case-fixes-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Fix report saved: ${reportFile}`);

  return results;
}

// Run the fixes
fixAllBusinessCaseIssues().catch(console.error);
