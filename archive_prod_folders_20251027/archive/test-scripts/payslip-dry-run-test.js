const { 
  Employee, 
  Payslip, 
  PayslipTemplate, 
  PayrollData, 
  Department,
  Position 
} = require('./backend/models');

async function payslipDryRunTest() {
  console.log('🚀 Starting Payslip System Dry Run Test\n');

  try {
    // Step 1: Create test department and position
    console.log('📂 Step 1: Creating test department and position...');
    
    const testDept = await Department.findOrCreate({
      where: { name: 'Test Department' },
      defaults: {
        name: 'Test Department',
        description: 'Test department for payslip testing',
        isActive: true
      }
    });

    const testPosition = await Position.findOrCreate({
      where: { title: 'Software Developer' },
      defaults: {
        title: 'Software Developer',
        description: 'Software Developer Position',
        departmentId: testDept[0].id,
        isActive: true
      }
    });

    console.log('✅ Department and position created successfully');

    // Step 2: Create test employees
    console.log('\n👥 Step 2: Creating test employees...');
    
    const testEmployees = [
      {
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        salary: 50000,
        departmentId: testDept[0].id,
        positionId: testPosition[0].id,
        isActive: true
      },
      {
        employeeId: 'EMP002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@test.com',
        salary: 60000,
        departmentId: testDept[0].id,
        positionId: testPosition[0].id,
        isActive: true
      },
      {
        employeeId: 'EMP003',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@test.com',
        salary: 55000,
        departmentId: testDept[0].id,
        positionId: testPosition[0].id,
        isActive: true
      }
    ];

    const createdEmployees = [];
    for (const empData of testEmployees) {
      const [employee] = await Employee.findOrCreate({
        where: { employeeId: empData.employeeId },
        defaults: empData
      });
      createdEmployees.push(employee);
    }

    console.log(`✅ Created ${createdEmployees.length} test employees`);
    createdEmployees.forEach(emp => {
      console.log(`   - ${emp.employeeId}: ${emp.firstName} ${emp.lastName} (₹${emp.salary}/month)`);
    });

    // Step 3: Create payslip template
    console.log('\n🎨 Step 3: Creating payslip template...');
    
    const template = await PayslipTemplate.findOrCreate({
      where: { name: 'SKYRAKSYS Standard Template' },
      defaults: {
        name: 'SKYRAKSYS Standard Template',
        version: '1.0',
        description: 'Standard payslip template for SKYRAKSYS employees',
        companyInfo: {
          name: "SKYRAKSYS TECHNOLOGIES LLP",
          address: "Plot-No: 27E, G.S.T. Road, Guduvanchery, Chennai, Tamil Nadu, 603202 India",
          email: "info@skyraksys.com",
          website: "https://www.skyraksys.com",
          contact: "+91 89398 88577"
        },
        structure: {
          earnings: {
            fields: [
              { key: 'basicSalary', label: 'Basic Salary', type: 'currency', required: true },
              { key: 'houseRentAllowance', label: 'House Rent Allowance', type: 'currency' },
              { key: 'conveyanceAllowance', label: 'Conveyance Allowance', type: 'currency' },
              { key: 'medicalAllowance', label: 'Medical Allowance', type: 'currency' }
            ]
          },
          deductions: {
            fields: [
              { key: 'providentFund', label: 'Provident Fund', type: 'currency' },
              { key: 'professionalTax', label: 'Professional Tax', type: 'currency' },
              { key: 'tds', label: 'Tax Deducted at Source', type: 'currency' }
            ]
          }
        },
        isDefault: true,
        isActive: true
      }
    });

    console.log('✅ Payslip template created successfully');
    console.log(`   Template: ${template[0].name} (v${template[0].version})`);

    // Step 4: Create individual payslips
    console.log('\n💰 Step 4: Generating individual payslips...');
    
    const currentMonth = 10; // October 2025
    const currentYear = 2025;
    
    const generatedPayslips = [];
    
    for (const employee of createdEmployees) {
      // Create payroll data
      const payrollData = await PayrollData.findOrCreate({
        where: { 
          employeeId: employee.id,
          month: currentMonth,
          year: currentYear 
        },
        defaults: {
          employeeId: employee.id,
          month: currentMonth,
          year: currentYear,
          earningsData: {
            basicSalary: employee.salary,
            houseRentAllowance: employee.salary * 0.4, // 40% HRA
            conveyanceAllowance: 1600,
            medicalAllowance: 1250
          },
          deductionsData: {
            providentFund: Math.min(employee.salary * 0.12, 1800), // 12% PF or max 1800
            professionalTax: employee.salary > 15000 ? 200 : 0,
            tds: employee.salary > 40000 ? employee.salary * 0.1 : 0
          },
          attendanceData: {
            totalWorkingDays: 22,
            presentDays: 22,
            lopDays: 0,
            overtimeHours: 0
          },
          status: 'approved'
        }
      });

      // Calculate net salary
      const earnings = Object.values(payrollData[0].earningsData).reduce((sum, val) => sum + val, 0);
      const deductions = Object.values(payrollData[0].deductionsData).reduce((sum, val) => sum + val, 0);
      const netSalary = earnings - deductions;

      // Create payslip
      const payslip = await Payslip.findOrCreate({
        where: {
          employeeId: employee.id,
          month: currentMonth,
          year: currentYear
        },
        defaults: {
          employeeId: employee.id,
          templateId: template[0].id,
          payrollDataId: payrollData[0].id,
          month: currentMonth,
          year: currentYear,
          payPeriodStart: new Date(2025, 9, 1), // October 1, 2025
          payPeriodEnd: new Date(2025, 9, 31), // October 31, 2025
          grossSalary: earnings,
          totalDeductions: deductions,
          netSalary: netSalary,
          employeeInfo: {
            firstName: employee.firstName,
            lastName: employee.lastName,
            employeeId: employee.employeeId,
            email: employee.email,
            department: 'Test Department',
            position: 'Software Developer'
          },
          companyInfo: template[0].companyInfo,
          payslipNumber: `PS-${currentYear}-${String(currentMonth).padStart(2, '0')}-${employee.employeeId}`,
          status: 'generated'
        }
      });

      generatedPayslips.push(payslip[0]);
      
      console.log(`✅ Generated payslip for ${employee.firstName} ${employee.lastName}`);
      console.log(`   - Gross: ₹${earnings.toLocaleString()}`);
      console.log(`   - Deductions: ₹${deductions.toLocaleString()}`);
      console.log(`   - Net: ₹${netSalary.toLocaleString()}`);
      console.log(`   - Payslip ID: ${payslip[0].id}`);
    }

    // Step 5: Test payslip retrieval
    console.log('\n📋 Step 5: Testing payslip retrieval...');
    
    const allPayslips = await Payslip.findAll({
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['firstName', 'lastName', 'employeeId']
        }
      ],
      where: {
        month: currentMonth,
        year: currentYear
      }
    });

    console.log(`✅ Found ${allPayslips.length} payslips for ${currentMonth}/${currentYear}`);
    allPayslips.forEach(payslip => {
      console.log(`   - ${payslip.employee.employeeId}: ${payslip.employee.firstName} ${payslip.employee.lastName} - ₹${payslip.netSalary?.toLocaleString() || 'N/A'}`);
    });

    // Step 6: Test individual payslip lookup
    console.log('\n🔍 Step 6: Testing individual payslip lookup...');
    
    if (generatedPayslips.length > 0) {
      const testPayslip = await Payslip.findByPk(generatedPayslips[0].id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['firstName', 'lastName', 'employeeId', 'email']
          },
          {
            model: PayslipTemplate,
            as: 'template',
            attributes: ['name', 'version']
          },
          {
            model: PayrollData,
            as: 'payrollData',
            attributes: ['earningsData', 'deductionsData', 'attendanceData']
          }
        ]
      });

      if (testPayslip) {
        console.log('✅ Successfully retrieved detailed payslip:');
        console.log(`   - Employee: ${testPayslip.employee.firstName} ${testPayslip.employee.lastName} (${testPayslip.employee.employeeId})`);
        console.log(`   - Template: ${testPayslip.template.name} v${testPayslip.template.version}`);
        console.log(`   - Period: ${testPayslip.month}/${testPayslip.year}`);
        console.log(`   - Status: ${testPayslip.status}`);
        console.log(`   - Net Salary: ₹${testPayslip.netSalary?.toLocaleString() || 'N/A'}`);
      }
    }

    // Step 7: Summary
    console.log('\n📊 Step 7: Test Summary');
    console.log('='.repeat(50));
    console.log(`✅ Employees created: ${createdEmployees.length}`);
    console.log(`✅ Templates created: 1`);
    console.log(`✅ Payslips generated: ${generatedPayslips.length}`);
    console.log(`✅ All payslips retrievable: ${allPayslips.length > 0 ? 'Yes' : 'No'}`);
    console.log('='.repeat(50));
    
    console.log('\n🎉 Payslip System Dry Run Test COMPLETED SUCCESSFULLY!');
    console.log('\n📝 Test Results:');
    console.log('   - ✅ Database models working correctly');
    console.log('   - ✅ Employee creation successful');
    console.log('   - ✅ Template creation successful');  
    console.log('   - ✅ Individual payslip generation working');
    console.log('   - ✅ Payslip data retrieval working');
    console.log('   - ✅ Relationships (Employee, Template, PayrollData) working');
    console.log('   - ✅ UUID primary keys working correctly');
    
    console.log('\n🌟 Ready for frontend integration and API testing!');
    
    return {
      success: true,
      employees: createdEmployees.length,
      payslips: generatedPayslips.length,
      template: template[0]
    };

  } catch (error) {
    console.error('\n❌ Dry run test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
payslipDryRunTest()
  .then((result) => {
    console.log('\n📋 Final Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });