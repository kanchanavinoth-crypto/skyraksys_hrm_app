const axios = require('axios');

async function debugEmployeeCreationError() {
  console.log('🧪 Debugging Employee Creation 400 Error...\n');
  
  // Try multiple admin credentials
  const credentials = [
    { email: 'admin@test.com', password: 'password123' },
    { email: 'admin@company.com', password: 'password123' },
    { email: 'admin@example.com', password: 'password123' },
    { email: 'admin@skyraksys.com', password: 'password123' }
  ];
  
  let token = null;
  
  for (const cred of credentials) {
    try {
      console.log(`Trying login with ${cred.email}...`);
      const loginResponse = await axios.post('http://localhost:8080/api/auth/login', cred);
      token = loginResponse.data.data.accessToken;
      console.log(`✅ Authentication successful with ${cred.email}`);
      console.log(`🔑 Token obtained: ${token ? token.substring(0, 20) + '...' : 'NULL TOKEN'}`);
      if (token) break;
    } catch (error) {
      console.log(`❌ Failed with ${cred.email}: ${error.response?.data?.message || error.message}`);
    }
  }
  
  if (!token) {
    console.log('❌ No valid credentials found - exiting');
    return;
  }
  
  console.log('\n📝 Proceeding with employee creation test...');
  try {
    // Step 2: Test employee creation with same data structure as frontend
    console.log('\n2. Testing employee creation...');
    
    const employeeData = {
      // Required fields
      firstName: "John",
      lastName: "Doe", 
      email: `john.doe.test.${Date.now()}@example.com`, // Unique email
      employeeId: `EMP${Date.now()}`, // Unique employee ID
      hireDate: "2024-01-15",
      departmentId: "cb9be928-9fe3-4dfa-9336-f38b7e4153f4", // IT Department UUID
      positionId: "6f74ec5b-38b2-43e5-8c47-a9bf51a0b2e9", // Software Developer UUID
      
      // Optional personal fields
      phone: "9876543210",
      dateOfBirth: "1990-01-01",
      gender: "", // Test empty gender (should convert to null)
      address: "123 Test Street",
      city: "Mumbai",
      state: "Maharashtra", 
      pinCode: "400001",
      nationality: "Indian",
      maritalStatus: "", // Test empty maritalStatus (should convert to null)
      
      // Employment fields
      employmentType: "Full-time",
      workLocation: "Mumbai Office",
      joiningDate: "2024-01-15",
      confirmationDate: "2024-07-15",
      probationPeriod: 6,
      noticePeriod: 1,
      managerId: null,
      
      // Emergency contact
      emergencyContactName: "Jane Doe",
      emergencyContactPhone: "9876543211", 
      emergencyContactRelation: "Spouse",
      
      // Statutory details (empty)
      aadhaarNumber: "",
      panNumber: "",
      uanNumber: "",
      pfNumber: "",
      esiNumber: "",
      
      // Bank details (empty)
      bankName: "",
      bankAccountNumber: "",
      ifscCode: "",
      bankBranch: "",
      accountHolderName: "",
      
      // Photo
      photoUrl: "",
      
      // Salary structure
      salary: {
        basicSalary: 50000,
        currency: "INR",
        payFrequency: "monthly",
        effectiveFrom: "2024-01-15",
        allowances: {
          hra: 15000,
          transport: 2000,
          medical: 1500,
          food: 1000,
          communication: 500,
          special: 0,
          other: 0
        },
        deductions: {
          pf: 1800,
          professionalTax: 200,
          incomeTax: 5000,
          esi: 375,
          other: 0
        },
        benefits: {
          bonus: 0,
          incentive: 0,
          overtime: 0
        },
        taxInformation: {
          taxRegime: "old", 
          ctc: 70000,
          takeHome: 45000
      },
      salaryNotes: ""
    }
    
    // Note: userAccount is handled separately, not part of employee creation
  };    console.log('📤 Sending employee creation request...');
    
    const response = await axios.post('http://localhost:8080/api/employees', employeeData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ SUCCESS! Employee created successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('❌ 400 Bad Request Error Details:\n');
      
      const errorData = error.response.data;
      console.log('📝 Error Message:', errorData.message);
      
      if (errorData.errors && errorData.errors.length > 0) {
        console.log('\n🔍 Validation Errors:');
        errorData.errors.forEach((err, index) => {
          console.log(`${index + 1}. ${err.field || 'Unknown Field'}: ${err.message || err}`);
          if (err.value !== undefined) {
            console.log(`   Value: ${JSON.stringify(err.value)}`);
          }
          if (err.path) {
            console.log(`   Path: ${err.path}`);
          }
        });
      }
      
      if (errorData.receivedData) {
        console.log('\n📥 Data Received by Backend:');
        console.log(JSON.stringify(errorData.receivedData, null, 2));
      }
      
      if (errorData.validationGuide) {
        console.log('\n📖 Validation Guide:');
        console.log(JSON.stringify(errorData.validationGuide, null, 2));
      }
      
    } else if (error.response) {
      console.log('❌ HTTP Error:', error.response.status, error.response.statusText);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

// Run the debug
debugEmployeeCreationError().catch(console.error);