const axios = require('axios');

async function checkAllEndpoints() {
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    const token = loginResponse.data.data.accessToken;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    console.log('🔍 Checking all available endpoints...');
    
    // Check health endpoint
    try {
      const health = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Health:', health.status, health.data);
    } catch (e) { 
      console.log('❌ Health:', e.response?.status || e.message); 
    }
    
    // Check projects endpoint
    try {
      const projects = await axios.get('http://localhost:5000/api/projects', { headers });
      console.log('✅ Projects GET:', projects.status, 'Records:', projects.data.data?.length || 0);
    } catch (e) { 
      console.log('❌ Projects GET:', e.response?.status || e.message); 
    }
    
    // Try creating a project
    try {
      const projectData = {
        name: 'Test Project',
        description: 'Test project for timesheet entries',
        status: 'active',
        startDate: '2025-09-01',
        endDate: '2025-12-31'
      };
      const createProject = await axios.post('http://localhost:5000/api/projects', projectData, { headers });
      console.log('✅ Project CREATE:', createProject.status, 'Created:', createProject.data.data?.name);
    } catch (e) { 
      console.log('❌ Project CREATE:', e.response?.status, e.response?.data?.message || e.message); 
    }
    
    // Check leave-types endpoint
    try {
      const leaveTypes = await axios.get('http://localhost:5000/api/leave-types', { headers });
      console.log('✅ Leave Types GET:', leaveTypes.status, 'Records:', leaveTypes.data.data?.length || 0);
    } catch (e) { 
      console.log('❌ Leave Types GET:', e.response?.status || e.message); 
    }
    
    // Try creating a leave type
    try {
      const leaveTypeData = {
        name: 'Test Leave',
        description: 'Test leave type',
        allocatedDays: 10,
        carryForwardLimit: 2
      };
      const createLeaveType = await axios.post('http://localhost:5000/api/leave-types', leaveTypeData, { headers });
      console.log('✅ Leave Type CREATE:', createLeaveType.status, 'Created:', createLeaveType.data.data?.name);
    } catch (e) { 
      console.log('❌ Leave Type CREATE:', e.response?.status, e.response?.data?.message || e.message); 
    }
    
    // Check dashboard stats
    try {
      const stats = await axios.get('http://localhost:5000/api/dashboard/stats', { headers });
      console.log('✅ Dashboard Stats:', stats.status);
      if (stats.data.data) {
        console.log('   📊 Stats:', JSON.stringify(stats.data.data, null, 2));
      }
    } catch (e) { 
      console.log('❌ Dashboard Stats:', e.response?.status || e.message); 
    }
    
    // Check what tables exist in the database
    console.log('\n📋 Checking existing data:');
    const endpoints = [
      { name: 'Employees', url: '/api/employees' },
      { name: 'Departments', url: '/api/departments' },
      { name: 'Salary Structures', url: '/api/salary-structures' },
      { name: 'Timesheets', url: '/api/timesheets' },
      { name: 'Leaves', url: '/api/leaves' },
      { name: 'Payrolls', url: '/api/payrolls' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:5000${endpoint.url}`, { headers });
        console.log(`✅ ${endpoint.name}: ${response.data.data?.length || 0} records`);
      } catch (e) {
        console.log(`❌ ${endpoint.name}: ${e.response?.status || e.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.message);
  }
}

checkAllEndpoints();
