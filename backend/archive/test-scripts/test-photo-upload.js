const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test the photo upload endpoint
async function testPhotoUpload() {
  try {
    console.log('🧪 Testing photo upload functionality...\n');

    // First, check if we can access the employees endpoint
    console.log('1. Testing authentication and employee access...');
    
    // Try different admin/hr credentials
    let loginResponse;
    const credentials = [
      { email: 'admin@company.com', password: 'password123' },
      { email: 'hr@company.com', password: 'password123' },
      { email: 'admin@skyraksys.com', password: 'password123' }
    ];

    for (const cred of credentials) {
      try {
        console.log(`Trying login with ${cred.email}...`);
        loginResponse = await axios.post('http://localhost:8080/api/auth/login', cred);
        console.log(`✅ Successfully logged in as ${cred.email}`);
        break;
      } catch (error) {
        console.log(`❌ Failed to login with ${cred.email}: ${error.response?.data?.message || error.message}`);
      }
    }

    if (!loginResponse) {
      throw new Error('Could not login with any credentials');
    }

    const token = loginResponse.data.data?.accessToken;
    console.log('✅ Authentication successful');
    
    if (!token) {
      throw new Error('No token received in login response');
    }
    
    console.log('Token received (first 20 chars):', token.substring(0, 20) + '...');

    // Get the first employee for testing
    const employeesResponse = await axios.get('http://localhost:8080/api/employees?limit=1', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!employeesResponse.data.data || employeesResponse.data.data.length === 0) {
      console.log('❌ No employees found for testing');
      return;
    }

    const testEmployee = employeesResponse.data.data[0];
    console.log(`✅ Found test employee: ${testEmployee.firstName} ${testEmployee.lastName} (ID: ${testEmployee.id})`);

    // Test the photo upload endpoint
    console.log('\n2. Testing photo upload endpoint...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
      0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    // Create form data for file upload
    const formData = new FormData();
    formData.append('photo', testImageBuffer, {
      filename: 'test-photo.png',
      contentType: 'image/png'
    });

    const uploadResponse = await axios.post(
      `http://localhost:8080/api/employees/${testEmployee.id}/photo`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        }
      }
    );

    console.log('✅ Photo upload successful!');
    console.log('Response:', uploadResponse.data);

    // Test if we can access the uploaded photo
    console.log('\n3. Testing photo URL access...');
    const photoUrl = uploadResponse.data.data.photoUrl;
    const fullPhotoUrl = `http://localhost:8080${photoUrl}`;
    
    const photoResponse = await axios.head(fullPhotoUrl);
    console.log('✅ Photo is accessible at:', fullPhotoUrl);
    console.log('Photo response headers:', photoResponse.headers);

    // Test photo deletion (set photoUrl to null)
    console.log('\n4. Testing photo removal...');
    const deleteResponse = await axios.put(
      `http://localhost:8080/api/employees/${testEmployee.id}`,
      { photoUrl: null },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Photo removal successful!');

    console.log('\n🎉 All tests passed! Photo upload functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Run the test
testPhotoUpload();