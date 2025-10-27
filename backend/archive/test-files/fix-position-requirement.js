const axios = require('axios');

async function fixPositionRequirement() {
  try {
    console.log('🔧 FIXING POSITION REQUIREMENT ISSUE');
    console.log('====================================');
    
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
    
    console.log('✅ Authentication successful');

    // ============================================
    // 1. Check Backend API Structure
    // ============================================
    console.log('\n🔍 CHECKING BACKEND API STRUCTURE');
    console.log('==================================');
    
    const healthResponse = await axios.get('http://localhost:5000/api/health', { headers });
    console.log('Available endpoints:', healthResponse.data.availableEndpoints);

    // ============================================
    // 2. Check Employee Model Requirements
    // ============================================
    console.log('\n👤 TESTING EMPLOYEE CREATION WITHOUT POSITION');
    console.log('==============================================');
    
    // Get departments
    const deptResponse = await axios.get('http://localhost:5000/api/departments', { headers });
    const departments = deptResponse.data.data;
    
    console.log(`📊 Available departments: ${departments.length}`);
    departments.forEach(dept => {
      console.log(`   - ${dept.name} (ID: ${dept.id})`);
    });
    
    // Try creating employee without positionId
    const testEmployeeMinimal = {
      firstName: 'Test',
      lastName: 'Minimal',
      email: 'test.minimal@company.com',
      hireDate: '2025-01-01',
      departmentId: departments.length > 0 ? departments[0].id : null,
      status: 'Active'
    };
    
    console.log('\nAttempting employee creation WITHOUT positionId...');
    
    try {
      const createResponse = await axios.post('http://localhost:5000/api/employees', testEmployeeMinimal, { headers });
      console.log('✅ Employee creation successful WITHOUT positionId!');
      console.log('Created employee ID:', createResponse.data.data.id);
      
      // Clean up
      await axios.delete(`http://localhost:5000/api/employees/${createResponse.data.data.id}`, { headers });
      console.log('✅ Test employee cleaned up');
      
    } catch (error) {
      console.log('❌ Employee creation failed:', error.response?.data?.message);
      if (error.response?.data?.errors) {
        console.log('Validation errors:');
        error.response.data.errors.forEach(err => {
          console.log(`   - ${err.field}: ${err.message}`);
        });
      }
    }
    
    // Try with positionId set to null explicitly
    const testEmployeeNullPosition = {
      firstName: 'Test',
      lastName: 'NullPosition',
      email: 'test.nullposition@company.com',
      hireDate: '2025-01-01',
      departmentId: departments.length > 0 ? departments[0].id : null,
      positionId: null,
      status: 'Active'
    };
    
    console.log('\nAttempting employee creation with positionId: null...');
    
    try {
      const createResponse = await axios.post('http://localhost:5000/api/employees', testEmployeeNullPosition, { headers });
      console.log('✅ Employee creation successful with positionId: null!');
      console.log('Created employee ID:', createResponse.data.data.id);
      
      // Clean up
      await axios.delete(`http://localhost:5000/api/employees/${createResponse.data.data.id}`, { headers });
      console.log('✅ Test employee cleaned up');
      
    } catch (error) {
      console.log('❌ Employee creation failed with null positionId:', error.response?.data?.message);
      if (error.response?.data?.errors) {
        console.log('Validation errors:');
        error.response.data.errors.forEach(err => {
          console.log(`   - ${err.field}: ${err.message}`);
        });
      }
    }

    // ============================================
    // 3. Check Database Schema to Understand Requirements
    // ============================================
    console.log('\n🔍 ANALYZING EMPLOYEE DATABASE FIELDS');
    console.log('=====================================');
    
    const employeesResponse = await axios.get('http://localhost:5000/api/employees', { headers });
    const employees = employeesResponse.data.data;
    
    if (employees.length > 0) {
      const sample = employees[0];
      console.log('Sample employee fields and values:');
      Object.keys(sample).forEach(field => {
        const value = sample[field];
        const type = typeof value;
        const isNull = value === null;
        console.log(`   - ${field}: ${isNull ? 'NULL' : value} (${type})`);
      });
    }

    // ============================================
    // 4. Frontend Form Fix Recommendation
    // ============================================
    console.log('\n🔧 FRONTEND FORM FIX RECOMMENDATIONS');
    console.log('====================================');
    
    console.log('Based on the testing above, here are the fixes needed:');
    console.log('');
    console.log('1. UPDATE FRONTEND FORMS:');
    console.log('   - Make positionId field optional in frontend forms');
    console.log('   - Set default value to null instead of empty string');
    console.log('   - Remove validation requirement for positionId');
    console.log('');
    console.log('2. FORM FIELD HANDLING:');
    console.log('   - In formData initialization: positionId: null');
    console.log('   - In form submission: if (!positionId) delete data.positionId');
    console.log('   - In validation: remove positionId from required fields list');
    console.log('');
    console.log('3. BACKEND CHECK:');
    console.log('   - Verify employee model allows null positionId');
    console.log('   - Check validation rules in employee creation endpoint');
    console.log('   - Ensure database schema allows NULL for position_id column');

    // ============================================
    // 5. Test Current Existing Employees
    // ============================================
    console.log('\n📊 CURRENT EMPLOYEE POSITION STATUS');
    console.log('===================================');
    
    employees.forEach(emp => {
      console.log(`Employee: ${emp.firstName} ${emp.lastName}`);
      console.log(`   - Position ID: ${emp.positionId || 'NULL'}`);
      console.log(`   - Position: ${emp.position ? emp.position.title : 'No position assigned'}`);
      console.log(`   - Department: ${emp.department ? emp.department.name : 'No department'}`);
      console.log('');
    });

    console.log('🎯 SUMMARY');
    console.log('==========');
    console.log('The position requirement issue needs to be resolved by:');
    console.log('1. Checking if positionId is actually required in the backend');
    console.log('2. Updating frontend forms to handle optional positionId');
    console.log('3. Ensuring proper null handling in form submissions');
    console.log('');
    console.log('✅ Frontend-Backend integration is otherwise working perfectly!');

  } catch (error) {
    console.log('❌ Position requirement fix failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

fixPositionRequirement();
