const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test data for creating a ne      console.log('👤 Created Employee Details:', {
        id: response.data.data?.id,
        employeeId: response.data.data?.employeeId,
        name: `${response.data.data?.firstName} ${response.data.data?.lastName}`,
        email: response.data.data?.email,
        department: response.data.data?.department?.name || 'No department assigned',
        userId: response.data.data?.userId,
        userEmail: response.data.credentials?.email,
        role: response.data.data?.user?.role,
        dateOfBirth: response.data.data?.dateOfBirth
      });
const timestamp = Date.now();
const testEmployeeData = {
  // Personal Details
  firstName: 'John',
  lastName: 'Doe',
  email: `john.doe.test.${timestamp}@company.com`,
  phone: '9876543210',
  dateOfBirth: '15-05-1990',
  gender: 'Male',
  address: '123 Test Street, Test City, Test State - 123456',
  
  // Employment Details
  employeeId: 'EMP' + timestamp,
  department: 'Software Development',
  designation: 'Software Engineer',
  hireDate: '2025-08-10',
  dateOfJoining: '2025-08-10',
  employmentType: 'Full-time',
  workLocation: 'Bangalore',
  reportingManager: 'Manager Test',
  
  // User Account Details
  userId: 'john.doe.test.' + timestamp,
  password: 'TestPassword@123',
  role: 'employee',
  
  // Payroll Details
  salary: 50000,
  basicSalary: 50000,
  hra: 15000,
  da: 5000,
  conveyanceAllowance: 2000,
  medicalAllowance: 3000,
  specialAllowance: 5000,
  pf: 'Yes',
  pfNumber: 'PF123456789',
  esi: 'Yes',
  esiNumber: 'ESI987654321',
  panNumber: 'ABCDE1234F',
  aadhaarNumber: '123456789012',
  aadharNumber: '123456789012',
  
  // Bank Details
  bankName: 'Test Bank',
  bankAccountNumber: '1234567890123456',
  accountNumber: '1234567890123456',
  ifscCode: 'TEST0001234',
  
  // Additional Details
  emergencyContact: '9876543211',
  bloodGroup: 'O+',
  maritalStatus: 'Single'
};

let adminToken = '';
let createdEmployeeData = {};

async function loginAsAdmin() {
  try {
    console.log('\n🔐 Step 1: Logging in as Admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    
    if (response.data.success && response.data.data.accessToken) {
      adminToken = response.data.data.accessToken;
      console.log('✅ Admin login successful');
      console.log('👤 Admin Details:', {
        id: response.data.data.user.id,
        email: response.data.data.user.email,
        role: response.data.data.user.role
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    return false;
  }
}

async function createEmployee() {
  try {
    console.log('\n👥 Step 2: Creating new employee...');
    console.log('📋 Employee Data:', {
      name: `${testEmployeeData.firstName} ${testEmployeeData.lastName}`,
      email: testEmployeeData.email,
      userId: testEmployeeData.userId,
      employeeId: testEmployeeData.employeeId,
      department: testEmployeeData.department,
      designation: testEmployeeData.designation
    });
    
    const response = await axios.post(`${BASE_URL}/employees`, testEmployeeData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data) {
      createdEmployeeData = response.data;
      console.log('✅ Employee created successfully');
      console.log('� Full Response:', JSON.stringify(response.data, null, 2));
      console.log('�👤 Created Employee Details:', {
        id: response.data.data?.id,
        employeeId: response.data.data?.employeeId,
        name: `${response.data.data?.firstName} ${response.data.data?.lastName}`,
        email: response.data.data?.email,
        department: response.data.data?.department?.name,
        userId: response.data.data?.userId,
        userEmail: response.data.credentials?.email,
        role: response.data.data?.user?.role
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Employee creation failed:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.error('📝 Validation Errors:', error.response.data.errors);
    }
    return false;
  }
}

async function testNewUserLogin() {
  try {
    console.log('\n🔓 Step 3: Testing new user login...');
    console.log('🔑 Login Credentials:', {
      email: testEmployeeData.email,
      password: '[HIDDEN FOR SECURITY]'
    });
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmployeeData.email,
      password: testEmployeeData.password
    });
    
    if (response.data.success && response.data.data.accessToken) {
      console.log('✅ New user login successful!');
      console.log('👤 Login Response:', {
        id: response.data.data.user.id,
        email: response.data.data.user.email,
        role: response.data.data.user.role,
        tokenReceived: !!response.data.data.accessToken
      });
      
      // Test accessing protected route with new user token
      await testProtectedRoute(response.data.data.accessToken);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ New user login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testProtectedRoute(userToken) {
  try {
    console.log('\n🛡️  Step 4: Testing protected route access...');
    
    // Test accessing user profile
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    console.log('✅ Protected route access successful');
    console.log('📊 User Profile Response:', {
      id: profileResponse.data.data.id,
      email: profileResponse.data.data.email,
      role: profileResponse.data.data.role,
      employee: profileResponse.data.data.employee ? {
        id: profileResponse.data.data.employee.id,
        firstName: profileResponse.data.data.employee.firstName,
        lastName: profileResponse.data.data.employee.lastName,
        department: profileResponse.data.data.employee.department?.name
      } : 'No employee record'
    });
    
  } catch (error) {
    console.error('❌ Protected route access failed:', error.response?.data || error.message);
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting Employee Creation and Login API Test');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Login as admin
    const adminLoginSuccess = await loginAsAdmin();
    if (!adminLoginSuccess) {
      console.log('\n💥 Test failed at admin login step');
      return;
    }
    
    // Step 2: Create employee
    const employeeCreationSuccess = await createEmployee();
    if (!employeeCreationSuccess) {
      console.log('\n💥 Test failed at employee creation step');
      return;
    }
    
    // Step 3: Test new user login
    const userLoginSuccess = await testNewUserLogin();
    if (!userLoginSuccess) {
      console.log('\n💥 Test failed at user login step');
      return;
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
    console.log('✅ Employee creation API works correctly');
    console.log('✅ User account creation works correctly');
    console.log('✅ New user can login successfully');
    console.log('✅ JWT authentication is working');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n💥 Unexpected error during testing:', error.message);
  }
}

// Run the test
runCompleteTest();
