const { Employee } = require('./backend/models');
const fs = require('fs');
const path = require('path');

const employeeId = '2f86487c-ac34-4ace-be7b-da0335d86c99';

(async () => {
  try {
    console.log('Checking employee photo for ID:', employeeId);
    console.log('='.repeat(60));
    
    // Fetch employee from database
    const employee = await Employee.findByPk(employeeId);
    
    if (!employee) {
      console.log('❌ Employee not found in database');
      process.exit(1);
    }
    
    console.log('\n📊 Employee Database Record:');
    console.log('Name:', employee.firstName, employee.lastName);
    console.log('Email:', employee.email);
    console.log('Photo URL:', employee.photoUrl || 'NULL/EMPTY');
    console.log('Photo URL Type:', typeof employee.photoUrl);
    
    // Check if photoUrl exists
    if (!employee.photoUrl) {
      console.log('\n❌ Photo URL is NULL or empty in database');
      console.log('   This means the photo was never saved during creation');
      process.exit(0);
    }
    
    console.log('\n✅ Photo URL exists in database:', employee.photoUrl);
    
    // Check if the file actually exists on disk
    const photoPath = path.join(__dirname, 'backend', employee.photoUrl);
    console.log('\n🔍 Checking if file exists on disk:');
    console.log('Expected path:', photoPath);
    
    if (fs.existsSync(photoPath)) {
      const stats = fs.statSync(photoPath);
      console.log('✅ File EXISTS');
      console.log('   Size:', (stats.size / 1024).toFixed(2), 'KB');
      console.log('   Created:', stats.birthtime);
      console.log('   Modified:', stats.mtime);
    } else {
      console.log('❌ File does NOT exist on disk');
      console.log('   Database has URL but file is missing');
    }
    
    // Check uploads directory
    console.log('\n📁 Checking uploads directory:');
    const uploadsDir = path.join(__dirname, 'backend', 'uploads', 'employee-photos');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log('Files in uploads/employee-photos:');
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
      });
    } else {
      console.log('❌ Uploads directory does not exist');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSIS:');
    if (!employee.photoUrl) {
      console.log('➡️  Photo was NOT saved during employee creation');
      console.log('➡️  Check EmployeeForm.js photo upload implementation');
    } else if (!fs.existsSync(photoPath)) {
      console.log('➡️  Photo URL in database but file missing on disk');
      console.log('➡️  File may have been deleted or path is incorrect');
    } else {
      console.log('➡️  Photo file exists, check frontend display logic');
      console.log('➡️  Full URL that frontend should request:', employee.photoUrl);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
