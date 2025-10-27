/**
 * Test Photo Upload During Employee Creation
 * 
 * This script tests the complete photo upload flow:
 * 1. Create employee with photo
 * 2. Verify photo saved in database
 * 3. Verify photo file exists on disk
 * 4. Cleanup test data
 */

const { Employee } = require('./backend/models');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const TEST_EMPLOYEE_EMAIL = `test-photo-${Date.now()}@example.com`;

// You'll need to replace this with a valid admin token
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN_HERE';

async function testPhotoUpload() {
  let employeeId = null;
  
  try {
    console.log('🧪 Testing Photo Upload During Employee Creation');
    console.log('='.repeat(70));
    
    // Step 1: Create a test photo file
    console.log('\n📸 Step 1: Creating test photo file...');
    const testPhotoPath = path.join(__dirname, 'test-photo.jpg');
    
    // Create a simple base64 test image (1x1 red pixel)
    const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';
    fs.writeFileSync(testPhotoPath, Buffer.from(testImageBase64, 'base64'));
    console.log('✅ Test photo created:', testPhotoPath);
    
    // Step 2: Prepare employee data
    console.log('\n📝 Step 2: Preparing employee data...');
    const employeeData = {
      firstName: 'Photo',
      lastName: 'Test',
      email: TEST_EMPLOYEE_EMAIL,
      phone: '9876543210',
      departmentId: '1',  // You may need to adjust this
      positionId: '1',     // You may need to adjust this
      hireDate: new Date().toISOString().split('T')[0],
      status: 'active',
      employmentType: 'full-time'
    };
    
    // Step 3: Create FormData with photo
    console.log('\n📤 Step 3: Uploading employee with photo...');
    const formData = new FormData();
    
    // Add all employee data
    Object.keys(employeeData).forEach(key => {
      formData.append(key, employeeData[key]);
    });
    
    // Add photo
    formData.append('photo', fs.createReadStream(testPhotoPath));
    
    // Make API request
    const createResponse = await axios.post(`${API_BASE}/employees`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    console.log('✅ Employee created successfully');
    console.log('Response:', JSON.stringify(createResponse.data, null, 2));
    
    employeeId = createResponse.data?.data?.id || createResponse.data?.id;
    
    if (!employeeId) {
      throw new Error('No employee ID in response');
    }
    
    // Step 4: Verify in database
    console.log('\n🔍 Step 4: Verifying photo in database...');
    const employee = await Employee.findByPk(employeeId);
    
    if (!employee) {
      throw new Error('Employee not found in database');
    }
    
    console.log('Employee Name:', employee.firstName, employee.lastName);
    console.log('Photo URL:', employee.photoUrl || 'NULL');
    
    if (!employee.photoUrl) {
      console.log('❌ FAIL: Photo URL is NULL in database');
      console.log('   The photo was NOT saved during creation');
      return false;
    }
    
    console.log('✅ Photo URL exists in database');
    
    // Step 5: Verify file on disk
    console.log('\n💾 Step 5: Verifying photo file on disk...');
    const photoPath = path.join(__dirname, 'backend', employee.photoUrl);
    
    if (!fs.existsSync(photoPath)) {
      console.log('❌ FAIL: Photo file does not exist on disk');
      console.log('   Expected path:', photoPath);
      return false;
    }
    
    const stats = fs.statSync(photoPath);
    console.log('✅ Photo file exists on disk');
    console.log('   Path:', photoPath);
    console.log('   Size:', (stats.size / 1024).toFixed(2), 'KB');
    
    // Step 6: Test retrieval via API
    console.log('\n🌐 Step 6: Testing photo retrieval via API...');
    const getResponse = await axios.get(`${API_BASE}/employees/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    const retrievedEmployee = getResponse.data?.data || getResponse.data;
    console.log('Retrieved photoUrl:', retrievedEmployee.photoUrl);
    
    if (retrievedEmployee.photoUrl === employee.photoUrl) {
      console.log('✅ Photo URL correctly returned by API');
    } else {
      console.log('❌ Photo URL mismatch between DB and API');
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Employee.destroy({ where: { id: employeeId } });
    fs.unlinkSync(photoPath);
    fs.unlinkSync(testPhotoPath);
    console.log('✅ Test data cleaned up');
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS PASSED');
    console.log('Photo upload during employee creation is working correctly!');
    return true;
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    
    // Cleanup on error
    if (employeeId) {
      try {
        await Employee.destroy({ where: { id: employeeId } });
        console.log('Cleaned up test employee');
      } catch (e) {
        console.error('Failed to cleanup:', e.message);
      }
    }
    
    return false;
  }
}

// Run test
if (require.main === module) {
  testPhotoUpload().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testPhotoUpload };
