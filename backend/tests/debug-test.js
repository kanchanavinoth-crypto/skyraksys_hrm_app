const axios = require('axios');
const dayjs = require('dayjs');
const colors = require('colors');

// Test configuration
const BASE_URL = 'http://localhost:8080/api';
const TEST_USERS = {
  admin: { email: 'admin@test.com', password: 'admin123', token: null }
};

async function makeRequest(method, endpoint, data = null, userType = 'admin') {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_USERS[userType].token}`
      }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      fullError: error.response?.data || error.message,
      requestData: data
    };
  }
}

async function debugTests() {
  console.log('🐛 DEBUG TEST - DETAILED ERROR ANALYSIS\n'.red.bold);
  
  // Login first
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      TEST_USERS.admin.token = loginResponse.data.data.accessToken;
      console.log('✅ Admin authentication successful'.green);
    } else {
      console.log('❌ Admin authentication failed'.red);
      return;
    }
  } catch (error) {
    console.log('❌ Login failed:', error.message);
    return;
  }
  
  // Get test data
  const empResult = await makeRequest('GET', '/employees');
  if (!empResult.success || empResult.data.data.length === 0) {
    console.log('❌ No employees found for testing');
    return;
  }
  
  const employee = empResult.data.data[0];
  console.log(`✅ Using test employee: ${employee.firstName} ${employee.lastName} (ID: ${employee.id})`.green);
  
  // Test 1: Debug Leave Request Creation
  console.log('\n🔍 DEBUG: Leave Request Creation'.yellow);
  
  // First check if leave types exist
  const leaveTypesResult = await makeRequest('GET', '/leaves/types');
  console.log('Leave types API result:', leaveTypesResult.success ? 'Success' : 'Failed');
  
  // Try to create leave type directly in DB
  try {
    const { sequelize } = require('./models');
    const LeaveType = sequelize.models.LeaveType;
    
    let leaveType = await LeaveType.findOne({ where: { name: 'Debug Leave' } });
    if (!leaveType) {
      leaveType = await LeaveType.create({
        name: 'Debug Leave',
        description: 'Debug leave type',
        daysAllowed: 10,
        carryForward: false,
        maxCarryForward: 0
      });
    }
    console.log(`✅ Leave type available: ${leaveType.name} (ID: ${leaveType.id})`.green);
    
    // Create leave balance
    const LeaveBalance = sequelize.models.LeaveBalance;
    const currentYear = new Date().getFullYear();
    
    let leaveBalance = await LeaveBalance.findOne({
      where: { employeeId: employee.id, leaveTypeId: leaveType.id, year: currentYear }
    });
    
    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.create({
        employeeId: employee.id,
        leaveTypeId: leaveType.id,
        year: currentYear,
        allocated: 10,
        used: 0,
        balance: 10
      });
    }
    console.log(`✅ Leave balance: ${leaveBalance.balance} days`.green);
    
    // Now try to create leave request
    const leaveRequest = {
      employeeId: employee.id,
      leaveTypeId: leaveType.id,
      startDate: dayjs().add(7, 'days').format('YYYY-MM-DD'),
      endDate: dayjs().add(9, 'days').format('YYYY-MM-DD'),
      reason: 'Debug test leave request for detailed error analysis'
    };
    
    console.log('📝 Attempting to create leave request with data:', JSON.stringify(leaveRequest, null, 2));
    const leaveResult = await makeRequest('POST', '/leaves', leaveRequest);
    
    if (leaveResult.success) {
      console.log('✅ Leave request created successfully!'.green);
    } else {
      console.log('❌ Leave request failed:'.red);
      console.log('   Error:', leaveResult.error);
      console.log('   Full error:', JSON.stringify(leaveResult.fullError, null, 2));
      console.log('   Status:', leaveResult.status);
    }
  } catch (error) {
    console.log('❌ Database operation failed:', error.message);
  }
  
  // Test 2: Debug Timesheet Creation
  console.log('\n🔍 DEBUG: Timesheet Creation'.yellow);
  
  try {
    const { sequelize } = require('./models');
    const Project = sequelize.models.Project;
    
    let project = await Project.findOne({ where: { name: 'Debug Project' } });
    if (!project) {
      project = await Project.create({
        name: 'Debug Project',
        description: 'Debug project for testing',
        status: 'Active',
        startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
        endDate: dayjs().add(60, 'days').format('YYYY-MM-DD')
      });
    }
    console.log(`✅ Project available: ${project.name} (ID: ${project.id})`.green);
    
    const timesheetEntry = {
      employeeId: employee.id,
      projectId: project.id,
      workDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      hoursWorked: 8,
      description: 'Debug test timesheet entry for detailed error analysis',
      clockInTime: '09:00',
      clockOutTime: '17:00'
    };
    
    console.log('📝 Attempting to create timesheet with data:', JSON.stringify(timesheetEntry, null, 2));
    const timesheetResult = await makeRequest('POST', '/timesheets', timesheetEntry);
    
    if (timesheetResult.success) {
      console.log('✅ Timesheet created successfully!'.green);
    } else {
      console.log('❌ Timesheet creation failed:'.red);
      console.log('   Error:', timesheetResult.error);
      console.log('   Full error:', JSON.stringify(timesheetResult.fullError, null, 2));
      console.log('   Status:', timesheetResult.status);
    }
  } catch (error) {
    console.log('❌ Database operation failed:', error.message);
  }
  
  // Test 3: Debug Payroll Generation
  console.log('\n🔍 DEBUG: Payroll Generation'.yellow);
  
  const payrollData = {
    employeeId: employee.id,
    month: dayjs().subtract(1, 'month').month() + 1,
    year: dayjs().subtract(1, 'month').year()
  };
  
  console.log('📝 Attempting to generate payroll with data:', JSON.stringify(payrollData, null, 2));
  const payrollResult = await makeRequest('POST', '/payroll/generate', payrollData);
  
  if (payrollResult.success) {
    console.log('✅ Payroll generated successfully!'.green);
  } else {
    console.log('❌ Payroll generation failed:'.red);
    console.log('   Error:', payrollResult.error);
    console.log('   Full error:', JSON.stringify(payrollResult.fullError, null, 2));
    console.log('   Status:', payrollResult.status);
  }
  
  console.log('\n🐛 DEBUG TEST COMPLETED'.red.bold);
}

debugTests().catch(error => {
  console.error('\n💥 Debug test error:', error.message);
  process.exit(1);
});
