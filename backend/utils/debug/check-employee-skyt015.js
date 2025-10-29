const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'skyraksys_hrm',
  password: 'admin',
  port: 5432,
});

async function checkEmployee() {
  try {
    console.log('Checking SKYT015 employee data...\n');
    
    const result = await pool.query(`
      SELECT 
        id,
        "employeeId",
        "firstName",
        "lastName",
        email,
        phone,
        "dateOfBirth",
        gender,
        address,
        city,
        state,
        "pinCode",
        nationality,
        "maritalStatus",
        "hireDate",
        "joiningDate",
        "confirmationDate",
        "workLocation",
        "probationPeriod",
        "noticePeriod",
        "emergencyContactName",
        "emergencyContactPhone",
        "emergencyContactRelation",
        "aadhaarNumber",
        "panNumber",
        "uanNumber",
        "pfNumber",
        "esiNumber",
        "bankName",
        "bankAccountNumber",
        "ifscCode",
        "bankBranch",
        "accountHolderName",
        "photoUrl",
        salary
      FROM employees 
      WHERE "employeeId" = 'SKYT015'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Employee SKYT015 not found!');
      return;
    }
    
    const employee = result.rows[0];
    
    console.log('='.repeat(80));
    console.log('EMPLOYEE SKYT015 DATA:');
    console.log('='.repeat(80));
    
    console.log('\n📋 BASIC INFO:');
    console.log(`  ID: ${employee.id}`);
    console.log(`  Employee ID: ${employee.employeeId}`);
    console.log(`  Name: ${employee.firstName} ${employee.lastName}`);
    console.log(`  Email: ${employee.email}`);
    console.log(`  Phone: ${employee.phone}`);
    
    console.log('\n👤 PERSONAL INFO:');
    console.log(`  Date of Birth: ${employee.dateOfBirth || 'NOT SET'}`);
    console.log(`  Gender: ${employee.gender || 'NOT SET'}`);
    console.log(`  Marital Status: ${employee.maritalStatus || 'NOT SET'}`);
    console.log(`  Address: ${employee.address || 'NOT SET'}`);
    console.log(`  City: ${employee.city || 'NOT SET'}`);
    console.log(`  State: ${employee.state || 'NOT SET'}`);
    console.log(`  Pin Code: ${employee.pinCode || 'NOT SET'}`);
    console.log(`  Nationality: ${employee.nationality || 'NOT SET'}`);
    
    console.log('\n💼 EMPLOYMENT INFO:');
    console.log(`  Hire Date: ${employee.hireDate || 'NOT SET'}`);
    console.log(`  Joining Date: ${employee.joiningDate || 'NOT SET'}`);
    console.log(`  Confirmation Date: ${employee.confirmationDate || 'NOT SET'}`);
    console.log(`  Work Location: ${employee.workLocation || 'NOT SET'}`);
    console.log(`  Probation Period: ${employee.probationPeriod || 'NOT SET'}`);
    console.log(`  Notice Period: ${employee.noticePeriod || 'NOT SET'}`);
    
    console.log('\n🆘 EMERGENCY CONTACT:');
    console.log(`  Name: ${employee.emergencyContactName || 'NOT SET'}`);
    console.log(`  Phone: ${employee.emergencyContactPhone || 'NOT SET'}`);
    console.log(`  Relation: ${employee.emergencyContactRelation || 'NOT SET'}`);
    
    console.log('\n🏛️ STATUTORY INFO:');
    console.log(`  Aadhaar: ${employee.aadhaarNumber || 'NOT SET'}`);
    console.log(`  PAN: ${employee.panNumber || 'NOT SET'}`);
    console.log(`  UAN: ${employee.uanNumber || 'NOT SET'}`);
    console.log(`  PF Number: ${employee.pfNumber || 'NOT SET'}`);
    console.log(`  ESI Number: ${employee.esiNumber || 'NOT SET'}`);
    
    console.log('\n🏦 BANK INFO:');
    console.log(`  Bank Name: ${employee.bankName || 'NOT SET'}`);
    console.log(`  Account Number: ${employee.bankAccountNumber || 'NOT SET'}`);
    console.log(`  IFSC Code: ${employee.ifscCode || 'NOT SET'}`);
    console.log(`  Branch: ${employee.bankBranch || 'NOT SET'}`);
    console.log(`  Account Holder: ${employee.accountHolderName || 'NOT SET'}`);
    
    console.log('\n📸 PHOTO:');
    console.log(`  Photo URL: ${employee.photoUrl || 'NOT SET'}`);
    
    console.log('\n💰 SALARY:');
    if (employee.salary) {
      console.log('  Salary Structure:', JSON.stringify(employee.salary, null, 2));
    } else {
      console.log('  NOT SET');
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Count missing fields
    const fields = [
      'dateOfBirth', 'gender', 'maritalStatus', 'address', 'city', 'state', 'pinCode',
      'joiningDate', 'confirmationDate', 'workLocation',
      'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
      'aadhaarNumber', 'panNumber', 'uanNumber', 'pfNumber',
      'bankName', 'bankAccountNumber', 'ifscCode', 'bankBranch', 'accountHolderName'
    ];
    
    const missing = fields.filter(field => !employee[field]);
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`  Total fields checked: ${fields.length}`);
    console.log(`  Missing fields: ${missing.length}`);
    if (missing.length > 0) {
      console.log(`  Missing: ${missing.join(', ')}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkEmployee();
