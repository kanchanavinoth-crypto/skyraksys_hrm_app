const axios = require('axios');

async function createFinalData() {
  try {
    console.log('🚀 Creating remaining data with future dates...');
    
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

    // Get existing employees
    const employeesResponse = await axios.get('http://localhost:5000/api/employees', { headers });
    const employees = employeesResponse.data.data;
    console.log(`📊 Found ${employees.length} employees`);

    // Get leave types
    const leaveTypesResponse = await axios.get('http://localhost:5000/api/leave/meta/types', { headers });
    const leaveTypes = leaveTypesResponse.data.data;
    console.log(`🏖️ Found ${leaveTypes.length} leave types`);

    // ========================================
    // 1. CREATE LEAVE REQUESTS (FUTURE DATES)
    // ========================================
    console.log('\n🏖️ Creating Leave Requests with future dates...');
    
    if (leaveTypes.length > 0) {
      let leaveSuccessCount = 0;
      
      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        
        // Create leave requests with future dates
        const leaveRequests = [
          {
            leaveTypeId: leaveTypes[0].id, // Annual Leave
            startDate: '2025-12-15',
            endDate: '2025-12-17',
            reason: 'Year-end vacation',
            status: 'pending'
          },
          {
            leaveTypeId: leaveTypes[1] ? leaveTypes[1].id : leaveTypes[0].id, // Personal Leave or Annual
            startDate: '2025-11-05',
            endDate: '2025-11-05',
            reason: 'Personal appointment',
            status: 'approved'
          }
        ];
        
        for (const leave of leaveRequests) {
          try {
            const response = await axios.post('http://localhost:5000/api/leaves', {
              employeeId: employee.id,
              leaveTypeId: leave.leaveTypeId,
              startDate: leave.startDate,
              endDate: leave.endDate,
              reason: leave.reason,
              status: leave.status
            }, { headers });
            
            leaveSuccessCount++;
            console.log(`✅ Created leave request for employee ${employee.id} - ${leave.startDate} to ${leave.endDate} (${leave.status})`);
          } catch (error) {
            console.log(`❌ Leave request creation failed: ${error.response?.data?.message || error.message}`);
            if (error.response?.data?.errors) {
              console.log('   Validation errors:', error.response.data.errors);
            }
          }
        }
      }
      console.log(`📊 Leave creation summary: ${leaveSuccessCount} successful`);
    }

    // ========================================
    // 2. CREATE PAYROLL VIA GENERATION
    // ========================================
    console.log('\n💰 Creating Payroll via generation endpoint...');
    
    const payrollPeriods = [
      { month: 1, year: 2025, name: 'January 2025' },
      { month: 2, year: 2025, name: 'February 2025' }
    ];

    let payrollSuccessCount = 0;
    for (const period of payrollPeriods) {
      try {
        const payrollData = {
          month: period.month,
          year: period.year,
          employeeIds: employees.map(emp => emp.id)
        };
        
        const response = await axios.post('http://localhost:5000/api/payrolls/generate', payrollData, { headers });
        const generated = response.data.data || [];
        payrollSuccessCount += generated.length;
        console.log(`✅ Generated payroll for ${period.name}: ${generated.length} employees`);
      } catch (error) {
        console.log(`❌ Payroll generation failed for ${period.name}: ${error.response?.data?.message || error.message}`);
        console.log(`   Status: ${error.response?.status}`);
        
        // Try direct creation if generation fails
        console.log(`   🔄 Trying direct payroll creation for ${period.name}...`);
        
        for (const employee of employees) {
          try {
            const startDate = new Date(period.year, period.month - 1, 1);
            const endDate = new Date(period.year, period.month, 0);
            
            const payrollEntry = {
              employeeId: employee.id,
              payPeriodStart: startDate.toISOString().split('T')[0],
              payPeriodEnd: endDate.toISOString().split('T')[0],
              baseSalary: 5000.00,
              allowances: 500.00,
              deductions: 300.00,
              netSalary: 5200.00,
              status: 'pending'
            };
            
            // Try different endpoints
            const payrollEndpoints = [
              '/api/payrolls',
              '/api/payroll',
              '/api/payroll/create'
            ];
            
            let created = false;
            for (const endpoint of payrollEndpoints) {
              try {
                await axios.post(`http://localhost:5000${endpoint}`, payrollEntry, { headers });
                console.log(`   ✅ Created payroll for employee ${employee.id} via ${endpoint}`);
                payrollSuccessCount++;
                created = true;
                break;
              } catch (createError) {
                // Continue to next endpoint
              }
            }
            
            if (!created) {
              console.log(`   ❌ Failed to create payroll for employee ${employee.id}`);
            }
            
          } catch (directError) {
            console.log(`   ❌ Direct payroll creation failed: ${directError.message}`);
          }
        }
      }
    }

    // ========================================
    // 3. FINAL VERIFICATION
    // ========================================
    console.log('\n📊 Final Data Verification...');
    
    const endpoints = [
      { name: 'Projects', url: '/api/projects' },
      { name: 'Timesheets', url: '/api/timesheets' },
      { name: 'Leave Requests', url: '/api/leaves' },
      { name: 'Payrolls', url: '/api/payrolls' }
    ];
    
    console.log('📋 Current Data Summary:');
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:5000${endpoint.url}`, { headers });
        const count = response.data.data?.length || 0;
        console.log(`   ✅ ${endpoint.name}: ${count} records`);
        
        // Show sample data for verification
        if (count > 0 && endpoint.name === 'Timesheets') {
          const sample = response.data.data[0];
          console.log(`      Sample: Employee ${sample.employeeId?.substring(0,8)}... - ${sample.workDate} (${sample.status})`);
        }
        if (count > 0 && endpoint.name === 'Leave Requests') {
          const sample = response.data.data[0];
          console.log(`      Sample: Employee ${sample.employeeId?.substring(0,8)}... - ${sample.startDate} to ${sample.endDate} (${sample.status})`);
        }
        
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: Error - ${error.response?.status || error.message}`);
      }
    }

    // ========================================
    // 4. TEST DASHBOARD FINAL
    // ========================================
    console.log('\n📊 Final Dashboard Stats...');
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/stats', { headers });
      const stats = dashboardResponse.data.data.stats;
      
      console.log('🎯 FINAL Dashboard Statistics:');
      console.log(`   👥 Employees: ${stats.employees.total} total, ${stats.employees.active} active`);
      console.log(`   🕒 Timesheets: ${stats.timesheets.pending} pending, ${stats.timesheets.submitted} submitted, ${stats.timesheets.approved} approved`);
      console.log(`   🏖️ Leaves: ${stats.leaves.pending} pending, ${stats.leaves.approved} approved`);
      console.log(`   💰 Payroll: ${stats.payroll.processed} processed, ${stats.payroll.pending} pending, ${stats.payroll.total} total`);
      
    } catch (error) {
      console.log(`❌ Dashboard stats error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 FINAL DATA CREATION COMPLETED!');
    console.log('');
    console.log('🌐 Your HRM Dashboard is Ready:');
    console.log('   URL: http://localhost:3000');
    console.log('   Login: admin@company.com');
    console.log('   Password: Kx9mP7qR2nF8sA5t');
    console.log('');
    console.log('📱 All Pages Should Now Show Data:');
    console.log('   ✅ Main Dashboard: Statistics and recent activities');
    console.log('   ✅ Timesheet Management: View and manage employee timesheets');
    console.log('   ✅ Leave Management: View and approve leave requests');
    console.log('   ✅ Payroll Management: View payroll information');
    console.log('   ✅ Project Management: View and manage projects');
    console.log('');
    console.log('🎯 Success! Your admin dashboard now has data across all modules.');

  } catch (error) {
    console.log('❌ Error creating final data:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

createFinalData();
