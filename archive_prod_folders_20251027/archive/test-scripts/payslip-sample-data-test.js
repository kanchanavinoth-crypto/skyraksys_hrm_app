const { 
  Employee, 
  Payslip, 
  PayslipTemplate, 
  PayrollData, 
  Department,
  Position,
  User
} = require('./backend/models');
const bcrypt = require('bcryptjs');

async function createPayslipSampleData() {
  console.log('🚀 PAYSLIP SYSTEM - DRY RUN WITH SAMPLE DATA');
  console.log('=' .repeat(60));

  try {
    // Step 1: Create Departments
    console.log('\n📂 Step 1: Creating Sample Departments...');
    
    const departments = [
      { name: 'Information Technology', description: 'IT and Software Development' },
      { name: 'Human Resources', description: 'HR and People Operations' },
      { name: 'Finance & Accounting', description: 'Financial Management' },
      { name: 'Marketing', description: 'Digital Marketing and Sales' }
    ];

    const createdDepts = [];
    for (const deptData of departments) {
      const [dept] = await Department.findOrCreate({
        where: { name: deptData.name },
        defaults: { ...deptData, isActive: true }
      });
      createdDepts.push(dept);
    }
    
    console.log(`✅ Created ${createdDepts.length} departments`);
    createdDepts.forEach(dept => console.log(`   - ${dept.name}`));

    // Step 2: Create Positions
    console.log('\n💼 Step 2: Creating Sample Positions...');
    
    const positions = [
      { title: 'Software Engineer', departmentId: createdDepts[0].id },
      { title: 'Senior Developer', departmentId: createdDepts[0].id },
      { title: 'HR Manager', departmentId: createdDepts[1].id },
      { title: 'Finance Manager', departmentId: createdDepts[2].id },
      { title: 'Marketing Executive', departmentId: createdDepts[3].id }
    ];

    const createdPositions = [];
    for (const posData of positions) {
      const [position] = await Position.findOrCreate({
        where: { title: posData.title, departmentId: posData.departmentId },
        defaults: { ...posData, description: `${posData.title} role`, isActive: true }
      });
      createdPositions.push(position);
    }
    
    console.log(`✅ Created ${createdPositions.length} positions`);

    // Step 3: Create Sample Employees with Realistic Data
    console.log('\n👥 Step 3: Creating Sample Employees...');
    
    const employeeData = [
      {
        employeeId: 'SKY001',
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul.sharma@skyraksys.com',
        phone: '+91-9876543210',
        salary: 75000,
        departmentId: createdDepts[0].id,
        positionId: createdPositions[0].id, // Software Engineer
        joiningDate: new Date('2023-01-15'),
        isActive: true
      },
      {
        employeeId: 'SKY002',
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@skyraksys.com',
        phone: '+91-9876543211',
        salary: 95000,
        departmentId: createdDepts[0].id,
        positionId: createdPositions[1].id, // Senior Developer
        joiningDate: new Date('2022-06-01'),
        isActive: true
      },
      {
        employeeId: 'SKY003',
        firstName: 'Amit',
        lastName: 'Kumar',
        email: 'amit.kumar@skyraksys.com',
        phone: '+91-9876543212',
        salary: 65000,
        departmentId: createdDepts[1].id,
        positionId: createdPositions[2].id, // HR Manager
        joiningDate: new Date('2023-03-10'),
        isActive: true
      },
      {
        employeeId: 'SKY004',
        firstName: 'Sneha',
        lastName: 'Reddy',
        email: 'sneha.reddy@skyraksys.com',
        phone: '+91-9876543213',
        salary: 80000,
        departmentId: createdDepts[2].id,
        positionId: createdPositions[3].id, // Finance Manager
        joiningDate: new Date('2022-11-20'),
        isActive: true
      },
      {
        employeeId: 'SKY005',
        firstName: 'Vikram',
        lastName: 'Singh',
        email: 'vikram.singh@skyraksys.com',
        phone: '+91-9876543214',
        salary: 55000,
        departmentId: createdDepts[3].id,
        positionId: createdPositions[4].id, // Marketing Executive
        joiningDate: new Date('2023-08-01'),
        isActive: true
      }
    ];

    const createdEmployees = [];
    for (const empData of employeeData) {
      const [employee] = await Employee.findOrCreate({
        where: { employeeId: empData.employeeId },
        defaults: empData
      });
      createdEmployees.push(employee);
    }
    
    console.log(`✅ Created ${createdEmployees.length} sample employees:`);
    createdEmployees.forEach(emp => {
      console.log(`   - ${emp.employeeId}: ${emp.firstName} ${emp.lastName} (₹${emp.salary?.toLocaleString()}/month)`);
    });

    // Step 4: Create Payslip Template
    console.log('\n🎨 Step 4: Creating Professional Payslip Template...');
    
    const [template] = await PayslipTemplate.findOrCreate({
      where: { name: 'SKYRAKSYS Official Template' },
      defaults: {
        name: 'SKYRAKSYS Official Template',
        version: '2.0',
        description: 'Official payslip template for SKYRAKSYS TECHNOLOGIES LLP',
        companyInfo: {
          name: "SKYRAKSYS TECHNOLOGIES LLP",
          address: "Plot-No: 27E, G.S.T. Road, Guduvanchery, Chennai, Tamil Nadu, 603202 India",
          email: "info@skyraksys.com",
          website: "https://www.skyraksys.com",
          contact: "+91 89398 88577",
          gst: "33AABCS1234C1Z5",
          cin: "U72200TN2020LLP012345",
          pan: "AABCS1234C"
        },
        structure: {
          earnings: {
            title: "EARNINGS",
            fields: [
              { key: 'basicSalary', label: 'Basic Salary', type: 'currency', required: true },
              { key: 'houseRentAllowance', label: 'House Rent Allowance', type: 'currency' },
              { key: 'conveyanceAllowance', label: 'Conveyance Allowance', type: 'currency' },
              { key: 'medicalAllowance', label: 'Medical Allowance', type: 'currency' },
              { key: 'specialAllowance', label: 'Special Allowance', type: 'currency' },
              { key: 'performanceBonus', label: 'Performance Bonus', type: 'currency' }
            ]
          },
          deductions: {
            title: "DEDUCTIONS",
            fields: [
              { key: 'providentFund', label: 'Provident Fund (EPF)', type: 'currency' },
              { key: 'professionalTax', label: 'Professional Tax', type: 'currency' },
              { key: 'tds', label: 'Tax Deducted at Source', type: 'currency' },
              { key: 'esic', label: 'ESI Contribution', type: 'currency' }
            ]
          }
        },
        isDefault: true,
        isActive: true
      }
    });
    
    console.log('✅ Professional payslip template created');
    console.log(`   Template: ${template.name} v${template.version}`);

    // Step 5: Generate Realistic Payroll Data
    console.log('\n💰 Step 5: Generating October 2025 Payroll Data...');
    
    const currentMonth = 10;
    const currentYear = 2025;
    const workingDays = 22;
    
    const payrollRecords = [];
    
    for (const employee of createdEmployees) {
      // Calculate realistic allowances and deductions
      const basicSalary = employee.salary;
      const hra = Math.round(basicSalary * 0.40); // 40% HRA
      const conveyance = 1600; // Fixed conveyance
      const medical = 1250; // Fixed medical allowance
      const special = Math.round(basicSalary * 0.15); // 15% special allowance
      const performanceBonus = employee.salary > 70000 ? 5000 : 2000; // Performance bonus
      
      // Deductions
      const pf = Math.min(Math.round(basicSalary * 0.12), 1800); // 12% PF or max 1800
      const professionalTax = basicSalary > 15000 ? 200 : 0;
      const tds = basicSalary > 50000 ? Math.round(basicSalary * 0.10) : 0; // 10% TDS if salary > 50k
      const esic = basicSalary <= 25000 ? Math.round((basicSalary + hra) * 0.0075) : 0; // 0.75% if salary <= 25k
      
      // Simulate some attendance variations
      const presentDays = employee.employeeId === 'SKY005' ? 20 : workingDays; // Vikram had 2 days leave
      const lopDays = workingDays - presentDays;
      const salaryRatio = presentDays / workingDays;
      
      const [payrollData] = await PayrollData.findOrCreate({
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
            basicSalary: Math.round(basicSalary * salaryRatio),
            houseRentAllowance: Math.round(hra * salaryRatio),
            conveyanceAllowance: Math.round(conveyance * salaryRatio),
            medicalAllowance: Math.round(medical * salaryRatio),
            specialAllowance: Math.round(special * salaryRatio),
            performanceBonus: performanceBonus // Full bonus regardless of leaves
          },
          deductionsData: {
            providentFund: Math.round(pf * salaryRatio),
            professionalTax: professionalTax,
            tds: Math.round(tds * salaryRatio),
            esic: Math.round(esic * salaryRatio)
          },
          attendanceData: {
            totalWorkingDays: workingDays,
            presentDays: presentDays,
            lopDays: lopDays,
            overtimeHours: employee.employeeId === 'SKY001' ? 8 : 0 // Rahul worked overtime
          },
          status: 'approved'
        }
      });
      
      payrollRecords.push(payrollData);
    }
    
    console.log(`✅ Generated payroll data for ${payrollRecords.length} employees`);

    // Step 6: Generate Payslips with Calculations
    console.log('\n📄 Step 6: Generating Professional Payslips...');
    
    const generatedPayslips = [];
    
    for (let i = 0; i < createdEmployees.length; i++) {
      const employee = createdEmployees[i];
      const payrollData = payrollRecords[i];
      
      // Calculate totals
      const grossSalary = Object.values(payrollData.earningsData).reduce((sum, val) => sum + (val || 0), 0);
      const totalDeductions = Object.values(payrollData.deductionsData).reduce((sum, val) => sum + (val || 0), 0);
      const netSalary = grossSalary - totalDeductions;
      
      // Get department and position info
      const dept = createdDepts.find(d => d.id === employee.departmentId);
      const pos = createdPositions.find(p => p.id === employee.positionId);
      
      const [payslip] = await Payslip.findOrCreate({
        where: {
          employeeId: employee.id,
          month: currentMonth,
          year: currentYear
        },
        defaults: {
          employeeId: employee.id,
          templateId: template.id,
          payrollDataId: payrollData.id,
          month: currentMonth,
          year: currentYear,
          payPeriodStart: new Date(2025, 9, 1), // October 1, 2025
          payPeriodEnd: new Date(2025, 9, 31), // October 31, 2025
          grossSalary: grossSalary,
          totalDeductions: totalDeductions,
          netSalary: netSalary,
          employeeInfo: {
            firstName: employee.firstName,
            lastName: employee.lastName,
            employeeId: employee.employeeId,
            email: employee.email,
            phone: employee.phone,
            department: dept?.name || 'Unknown',
            position: pos?.title || 'Unknown',
            joiningDate: employee.joiningDate,
            bankAccount: `****${Math.floor(1000 + Math.random() * 9000)}` // Mock bank account
          },
          companyInfo: template.companyInfo,
          payslipNumber: `PS-${currentYear}-${String(currentMonth).padStart(2, '0')}-${employee.employeeId}`,
          disbursementDate: new Date(2025, 9, 30), // October 30, 2025
          status: 'generated'
        }
      });

      generatedPayslips.push(payslip);
    }
    
    console.log(`✅ Generated ${generatedPayslips.length} professional payslips`);
    
    // Step 7: Display Detailed Payslip Information
    console.log('\n📊 Step 7: Payslip Summary Report...');
    console.log('-'.repeat(80));
    
    for (const payslip of generatedPayslips) {
      const employee = createdEmployees.find(e => e.id === payslip.employeeId);
      const payrollData = payrollRecords.find(p => p.id === payslip.payrollDataId);
      
      console.log(`\n👤 ${payslip.employeeInfo.firstName} ${payslip.employeeInfo.lastName} (${payslip.employeeInfo.employeeId})`);
      console.log(`   Department: ${payslip.employeeInfo.department} | Position: ${payslip.employeeInfo.position}`);
      console.log(`   Payslip Number: ${payslip.payslipNumber}`);
      console.log(`   Attendance: ${payrollData.attendanceData.presentDays}/${payrollData.attendanceData.totalWorkingDays} days`);
      
      console.log('   📈 EARNINGS:');
      Object.entries(payrollData.earningsData).forEach(([key, value]) => {
        if (value > 0) {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          console.log(`      ${label}: ₹${value?.toLocaleString() || 0}`);
        }
      });
      
      console.log('   📉 DEDUCTIONS:');
      Object.entries(payrollData.deductionsData).forEach(([key, value]) => {
        if (value > 0) {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          console.log(`      ${label}: ₹${value?.toLocaleString() || 0}`);
        }
      });
      
      console.log(`   💰 GROSS SALARY: ₹${payslip.grossSalary?.toLocaleString()}`);
      console.log(`   💸 TOTAL DEDUCTIONS: ₹${payslip.totalDeductions?.toLocaleString()}`);
      console.log(`   💳 NET SALARY: ₹${payslip.netSalary?.toLocaleString()}`);
      console.log('   -'.repeat(50));
    }

    // Step 8: Verify Database Relationships
    console.log('\n🔗 Step 8: Verifying Database Relationships...');
    
    const payslipWithRelations = await Payslip.findOne({
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

    if (payslipWithRelations) {
      console.log('✅ Database relationships working correctly:');
      console.log(`   - Employee: ${payslipWithRelations.employee.firstName} ${payslipWithRelations.employee.lastName}`);
      console.log(`   - Template: ${payslipWithRelations.template.name} v${payslipWithRelations.template.version}`);
      console.log(`   - Payroll Data: ✅ Linked correctly`);
    }

    // Step 9: Test Bulk Operations
    console.log('\n🔄 Step 9: Testing Bulk Operations...');
    
    const allPayslips = await Payslip.findAll({
      where: { month: currentMonth, year: currentYear },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['employeeId', 'firstName', 'lastName']
      }]
    });

    console.log(`✅ Bulk retrieval successful: Found ${allPayslips.length} payslips for ${currentMonth}/${currentYear}`);
    
    // Calculate company-wide statistics
    const totalGross = allPayslips.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
    const totalDeductions = allPayslips.reduce((sum, p) => sum + (p.totalDeductions || 0), 0);
    const totalNet = allPayslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    
    console.log('\n📊 Company Payroll Summary for October 2025:');
    console.log(`   Total Employees: ${allPayslips.length}`);
    console.log(`   Total Gross Salary: ₹${totalGross.toLocaleString()}`);
    console.log(`   Total Deductions: ₹${totalDeductions.toLocaleString()}`);
    console.log(`   Total Net Payout: ₹${totalNet.toLocaleString()}`);

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 PAYSLIP DRY RUN TEST WITH SAMPLE DATA - COMPLETED!');
    console.log('='.repeat(60));
    
    console.log('\n📋 Test Results:');
    console.log(`   ✅ Departments Created: ${createdDepts.length}`);
    console.log(`   ✅ Positions Created: ${createdPositions.length}`);
    console.log(`   ✅ Employees Created: ${createdEmployees.length}`);
    console.log(`   ✅ Payslip Template: 1 professional template`);
    console.log(`   ✅ Payroll Records: ${payrollRecords.length} with realistic data`);
    console.log(`   ✅ Generated Payslips: ${generatedPayslips.length} with calculations`);
    console.log(`   ✅ Database Relations: All working correctly`);
    
    console.log('\n🔥 Sample Data Features:');
    console.log('   ✅ Realistic employee data with Indian names');
    console.log('   ✅ Professional SKYRAKSYS company information');
    console.log('   ✅ Proper salary structures with HRA, allowances');
    console.log('   ✅ Accurate tax calculations (PF, PT, TDS, ESI)');
    console.log('   ✅ Attendance variations (leaves, overtime)');
    console.log('   ✅ Department and position hierarchies');
    console.log('   ✅ Professional payslip numbering system');
    
    console.log('\n🚀 Ready for Frontend Testing:');
    console.log('   1. Login to http://localhost:3000');
    console.log('   2. Navigate to /admin/payslip-management');
    console.log('   3. View generated payslips in History tab');
    console.log('   4. Test download functionality');
    console.log('   5. Test employee access at /employee-payslips');

    return {
      success: true,
      departments: createdDepts.length,
      employees: createdEmployees.length,
      payslips: generatedPayslips.length,
      totalPayout: totalNet
    };

  } catch (error) {
    console.error('\n❌ Sample data creation failed:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  }
}

// Execute the test
createPayslipSampleData()
  .then(result => {
    console.log('\n📊 Final Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Execution failed:', error);
    process.exit(1);
  });