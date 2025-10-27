const axios = require('axios');

async function debugAndCreateLeaveData() {
  try {
    console.log('🔍 Debugging authorization and creating leave data...');
    
    // Login to get admin access
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    
    const token = loginResponse.data.data.accessToken;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Admin authenticated successfully');

    // Debug: Check the JWT token payload
    const tokenParts = token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('🔍 JWT Token Payload:', JSON.stringify(payload, null, 2));

    // Get user details
    console.log('\n🔍 Checking user authorization...');
    try {
      const userResponse = await axios.get('http://localhost:5000/api/auth/me', { headers });
      console.log('Current user role:', userResponse.data.data.role);
    } catch (error) {
      console.log('Failed to get user details:', error.response?.data);
    }

    // Try to access leave balances endpoint (read-only first)
    console.log('\n🔍 Testing leave balance endpoint access...');
    try {
      const balanceResponse = await axios.get('http://localhost:5000/api/admin/leave-balances', { headers });
      console.log(`✅ Leave balances endpoint accessible: ${balanceResponse.data.data?.length || 0} records found`);
    } catch (error) {
      console.log(`❌ Leave balances endpoint error: ${error.response?.status} - ${error.response?.data?.message}`);
      console.log('Error details:', error.response?.data);
    }

    // Get employees and leave types
    const employeesResponse = await axios.get('http://localhost:5000/api/employees', { headers });
    const employees = employeesResponse.data.data;
    
    const leaveTypesResponse = await axios.get('http://localhost:5000/api/leave/meta/types', { headers });
    const leaveTypes = leaveTypesResponse.data.data;
    
    console.log(`📊 Found ${employees.length} employees and ${leaveTypes.length} leave types`);

    // Try creating a single leave balance with minimal data
    console.log('\n🔍 Testing single leave balance creation...');
    if (employees.length > 0 && leaveTypes.length > 0) {
      try {
        const testBalance = {
          employeeId: employees[0].id,
          leaveTypeId: leaveTypes[0].id,
          year: 2025,
          totalAccrued: 21,
          carryForward: 0
        };
        
        console.log('Test balance data:', testBalance);
        
        const testResponse = await axios.post('http://localhost:5000/api/admin/leave-balances', testBalance, { headers });
        console.log('✅ Test leave balance created successfully:', testResponse.data);
        
        // If successful, create more balances
        console.log('\n💰 Creating remaining leave balances...');
        let successCount = 1; // Already created one
        
        for (let i = 0; i < employees.length; i++) {
          for (let j = 0; j < leaveTypes.length; j++) {
            // Skip the first one we already created
            if (i === 0 && j === 0) continue;
            
            try {
              const balance = {
                employeeId: employees[i].id,
                leaveTypeId: leaveTypes[j].id,
                year: 2025,
                totalAccrued: leaveTypes[j].maxDaysPerYear,
                carryForward: 0
              };
              
              await axios.post('http://localhost:5000/api/admin/leave-balances', balance, { headers });
              successCount++;
              console.log(`✅ Created balance for ${employees[i].firstName} - ${leaveTypes[j].name}`);
            } catch (error) {
              if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
                console.log(`⚠️ Balance already exists for ${employees[i].firstName} - ${leaveTypes[j].name}`);
              } else {
                console.log(`❌ Failed to create balance for ${employees[i].firstName} - ${leaveTypes[j].name}: ${error.response?.data?.message}`);
              }
            }
          }
        }
        
        console.log(`📊 Total leave balances created: ${successCount}`);
        
        // Now try creating leave requests
        console.log('\n🏖️ Creating leave requests...');
        let leaveSuccessCount = 0;
        
        for (const employee of employees) {
          try {
            const leaveRequest = {
              employeeId: employee.id,
              leaveTypeId: leaveTypes[0].id,
              startDate: '2025-12-15',
              endDate: '2025-12-17',
              reason: 'Year-end vacation'
            };
            
            await axios.post('http://localhost:5000/api/leaves', leaveRequest, { headers });
            leaveSuccessCount++;
            console.log(`✅ Created leave request for ${employee.firstName} ${employee.lastName}`);
          } catch (error) {
            console.log(`❌ Leave request failed for ${employee.firstName}: ${error.response?.data?.message}`);
          }
        }
        
        console.log(`📊 Total leave requests created: ${leaveSuccessCount}`);
        
      } catch (error) {
        console.log(`❌ Test leave balance creation failed: ${error.response?.status} - ${error.response?.data?.message}`);
        console.log('Response data:', error.response?.data);
        
        // Try alternative approach: Initialize leave balances via a different method
        console.log('\n🔄 Trying alternative leave balance initialization...');
        
        try {
          // Check if there's an initialization endpoint
          const initResponse = await axios.post('http://localhost:5000/api/admin/leave-balances/initialize', {
            year: 2025,
            employeeIds: employees.map(emp => emp.id)
          }, { headers });
          
          console.log('✅ Leave balances initialized via initialization endpoint');
        } catch (initError) {
          console.log('❌ Initialization endpoint not available:', initError.response?.status);
        }
      }
    }

    // ========================================
    // FINAL STATUS CHECK
    // ========================================
    console.log('\n📊 Final Status Check...');
    
    const endpoints = [
      { name: 'Employees', url: '/api/employees' },
      { name: 'Projects', url: '/api/projects' },
      { name: 'Timesheets', url: '/api/timesheets' },
      { name: 'Leave Requests', url: '/api/leaves' },
      { name: 'Leave Balances', url: '/api/admin/leave-balances' },
      { name: 'Payrolls', url: '/api/payrolls' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:5000${endpoint.url}`, { headers });
        const count = response.data.data?.length || 0;
        console.log(`   ✅ ${endpoint.name}: ${count} records`);
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: Error - ${error.response?.status}`);
      }
    }

    // Dashboard stats
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/stats', { headers });
      const stats = dashboardResponse.data.data.stats;
      
      console.log('\n📊 Dashboard Statistics:');
      console.log(`   👥 Employees: ${stats.employees.total} total, ${stats.employees.active} active`);
      console.log(`   🕒 Timesheets: ${stats.timesheets.pending} pending, ${stats.timesheets.submitted} submitted, ${stats.timesheets.approved} approved`);
      console.log(`   🏖️ Leaves: ${stats.leaves.pending} pending, ${stats.leaves.approved} approved`);
      console.log(`   💰 Payroll: ${stats.payroll.processed} processed, ${stats.payroll.pending} pending, ${stats.payroll.total} total`);
      
    } catch (error) {
      console.log(`❌ Dashboard stats error: ${error.response?.data?.message}`);
    }

    console.log('\n🎉 LEAVE BALANCE ENHANCEMENT COMPLETED!');
    console.log('\n🌐 Your Enhanced Dashboard: http://localhost:3000');
    console.log('   Login: admin@company.com / Kx9mP7qR2nF8sA5t');

  } catch (error) {
    console.log('❌ Error in leave balance enhancement:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

debugAndCreateLeaveData();
