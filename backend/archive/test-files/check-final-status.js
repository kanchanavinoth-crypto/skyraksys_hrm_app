const axios = require('axios');

async function checkFinalStatus() {
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    const token = loginResponse.data.data.accessToken;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    console.log('🎯 FINAL HRM SYSTEM STATUS');
    console.log('================================');
    
    const endpoints = [
      { name: 'Employees', url: '/api/employees' },
      { name: 'Projects', url: '/api/projects' },
      { name: 'Timesheets', url: '/api/timesheets' },
      { name: 'Leave Requests', url: '/api/leaves' },
      { name: 'Payrolls', url: '/api/payrolls' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:5000${endpoint.url}`, { headers });
        const count = response.data.data?.length || 0;
        console.log(`✅ ${endpoint.name}: ${count} records`);
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Error`);
      }
    }
    
    const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/stats', { headers });
    const stats = dashboardResponse.data.data.stats;
    
    console.log('');
    console.log('📊 Dashboard Statistics:');
    console.log(`   👥 Employees: ${stats.employees.total} total, ${stats.employees.active} active`);
    console.log(`   🕒 Timesheets: ${stats.timesheets.pending} pending, ${stats.timesheets.submitted} submitted, ${stats.timesheets.approved} approved`);
    console.log(`   🏖️ Leaves: ${stats.leaves.pending} pending, ${stats.leaves.approved} approved`);
    console.log(`   💰 Payroll: ${stats.payroll.processed} processed, ${stats.payroll.pending} pending, ${stats.payroll.total} total`);
    
    console.log('');
    console.log('🌐 Access Your Dashboard:');
    console.log('   URL: http://localhost:3000');
    console.log('   Login: admin@company.com');
    console.log('   Password: Kx9mP7qR2nF8sA5t');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkFinalStatus();
