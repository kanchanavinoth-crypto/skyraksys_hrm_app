const axios = require('axios');

async function debugEmployeeCreation() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('🔍 DEBUGGING EMPLOYEE CREATION ISSUE');
  console.log('=====================================');
  
  try {
    // Login as admin
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Admin authentication successful');
    
    // Get reference data
    const [departments, positions] = await Promise.all([
      axios.get(`${baseURL}/employees/meta/departments`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${baseURL}/employees/meta/positions`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    
    console.log('✅ Reference data retrieved');
    console.log('Departments:', departments.data.data.map(d => ({ id: d.id, name: d.name })));
    console.log('Positions:', positions.data.data.map(p => ({ id: p.id, name: p.name })));
    
    // Get existing employee to see exact structure
    const existingEmployees = await axios.get(`${baseURL}/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (existingEmployees.data.data.length > 0) {
      const sample = existingEmployees.data.data[0];
      console.log('✅ Sample existing employee structure:');
      console.log(JSON.stringify(sample, null, 2));
    }
    
    // Try different payload variations
    const payloadVariations = [
      {
        name: "Basic Required Fields",
        payload: {
          employeeId: `DEBUG${Date.now()}`,
          firstName: 'Debug',
          lastName: 'Test',
          email: `debug.${Date.now()}@company.com`,
          hireDate: '2025-08-10',
          departmentId: departments.data.data[0].id,
          positionId: positions.data.data[0].id,
          status: 'active'
        }
      },
      {
        name: "With Employment Type",
        payload: {
          employeeId: `DEBUG${Date.now()}B`,
          firstName: 'Debug',
          lastName: 'TestB',
          email: `debug.b.${Date.now()}@company.com`,
          hireDate: '2025-08-10',
          departmentId: departments.data.data[0].id,
          positionId: positions.data.data[0].id,
          status: 'active',
          employmentType: 'Full-time'
        }
      },
      {
        name: "Full Payload",
        payload: {
          employeeId: `DEBUG${Date.now()}C`,
          firstName: 'Debug',
          lastName: 'TestC',
          email: `debug.c.${Date.now()}@company.com`,
          hireDate: '2025-08-10',
          departmentId: departments.data.data[0].id,
          positionId: positions.data.data[0].id,
          status: 'active',
          employmentType: 'Full-time',
          nationality: 'Indian',
          phoneNumber: '9876543210',
          address: '123 Test St, Test City'
        }
      }
    ];
    
    for (const variation of payloadVariations) {
      console.log(`\n🧪 Testing: ${variation.name}`);
      console.log('Payload:', JSON.stringify(variation.payload, null, 2));
      
      try {
        const response = await axios.post(`${baseURL}/employees`, variation.payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ SUCCESS! Employee created:');
        console.log(`   ID: ${response.data.data.id}`);
        console.log(`   Name: ${response.data.data.firstName} ${response.data.data.lastName}`);
        console.log(`   Employee ID: ${response.data.data.employeeId}`);
        break; // Stop on first success
        
      } catch (error) {
        console.log('❌ Failed:', error.response?.data?.message || error.message);
        if (error.response?.data?.errors) {
          console.log('   Validation errors:', error.response.data.errors);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugEmployeeCreation();
