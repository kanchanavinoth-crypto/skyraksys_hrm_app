const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test comprehensive salary structure validation
async function testSalaryValidation() {
  console.log('🧪 Testing Salary Validation...\n');

  // Test data with comprehensive salary structure
  const testEmployeeData = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe.salary.test@test.com",
    hireDate: "2025-01-01",
    departmentId: "a1b2c3d4-e5f6-4321-8765-123456789abc", // Will need to be replaced with actual department ID
    positionId: "e1f2g3h4-i5j6-4321-8765-123456789def", // Will need to be replaced with actual position ID
    
    // Comprehensive salary structure
    salary: {
      basicSalary: 50000,
      currency: "INR",
      payFrequency: "monthly",
      effectiveFrom: "2025-01-01",
      allowances: {
        hra: 15000,
        transport: 2000,
        medical: 3000,
        food: 1500,
        communication: 800,
        special: 5000,
        other: 1000
      },
      deductions: {
        pf: 6000,
        professionalTax: 200,
        incomeTax: 8000,
        esi: 750,
        other: 500
      },
      benefits: {
        bonus: 10000,
        incentive: 5000,
        overtime: 2000
      },
      taxInformation: {
        taxRegime: "new",
        ctc: 720000,
        takeHome: 45000
      },
      salaryNotes: "Comprehensive salary package with all allowances and benefits"
    }
  };

  try {
    console.log('📤 Sending employee data with comprehensive salary structure...');
    
    // First, let's test the validation endpoint directly
    const response = await axios.post(`${BASE_URL}/employees`, testEmployeeData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.status === 201) {
      console.log('✅ SUCCESS: Employee created with salary structure!');
      console.log('📋 Employee ID:', response.data.id);
      console.log('💰 Salary Data:', JSON.stringify(response.data.salary, null, 2));
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ Validation Error Response:');
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        console.log('\n🔍 This indicates validation is working - checking error details...');
        
        // Check if salary validation is working
        if (error.response.data.message && error.response.data.message.includes('salary')) {
          console.log('✅ Salary validation is active!');
        } else {
          console.log('ℹ️  Error is not related to salary validation');
        }
      }
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }

  // Test with invalid salary data
  console.log('\n🧪 Testing invalid salary data...');
  
  const invalidSalaryData = {
    ...testEmployeeData,
    email: "invalid.salary.test@test.com",
    salary: {
      basicSalary: -1000, // Invalid negative salary
      currency: "INVALID", // Invalid currency
      payFrequency: "invalid-freq", // Invalid frequency
      effectiveFrom: "invalid-date" // Invalid date
    }
  };

  try {
    const response = await axios.post(`${BASE_URL}/employees`, invalidSalaryData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('❌ UNEXPECTED: Invalid data was accepted!');
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ SUCCESS: Invalid salary data was properly rejected!');
      console.log('📋 Validation errors:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

// Test server connectivity first
async function testConnection() {
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend server is running on port 8080');
    console.log('📊 Health check:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Cannot connect to backend server on port 8080');
    console.log('Error:', error.message);
    return false;
  }
}

// Main test execution
async function main() {
  console.log('🔧 Backend Salary Validation Test\n');
  
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('\n');
    await testSalaryValidation();
  } else {
    console.log('\n❌ Cannot proceed with tests - backend server not accessible');
  }
  
  console.log('\n🏁 Test completed!');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.log('❌ Unhandled error:', error.message);
});

main().catch(console.error);