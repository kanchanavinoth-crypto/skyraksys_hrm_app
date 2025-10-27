const db = require('./backend/models');

async function createSalaryStructuresForActiveEmployees() {
  console.log('💰 Creating Salary Structures for Active Employees\n');
  
  try {
    // Get all active employees
    const activeEmployees = await db.Employee.findAll({
      where: { status: 'Active' },
      include: [
        { model: db.User, as: 'user' }
      ]
    });
    
    console.log(`Found ${activeEmployees.length} active employees`);
    
    for (const employee of activeEmployees) {
      console.log(`\nProcessing: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`);
      
      // Check if salary structure already exists
      const existingSalaryStructure = await db.SalaryStructure.findOne({
        where: { 
          employeeId: employee.id,
          isActive: true
        }
      });
      
      if (existingSalaryStructure) {
        console.log('  ✅ Salary structure already exists');
        continue;
      }
      
      // Create salary structure based on role
      let basicSalary, hra, allowances, pfContribution, tds, professionalTax;
      
      switch (employee.user.role) {
        case 'admin':
          basicSalary = 80000;
          hra = 32000; // 40% of basic
          allowances = 15000;
          break;
        case 'hr':
          basicSalary = 60000;
          hra = 24000; // 40% of basic  
          allowances = 12000;
          break;
        case 'employee':
          basicSalary = 50000;
          hra = 20000; // 40% of basic
          allowances = 10000;
          break;
        default:
          basicSalary = 50000;
          hra = 20000;
          allowances = 10000;
      }
      
      // Calculate standard deductions
      pfContribution = basicSalary * 0.12; // 12% PF contribution
      tds = (basicSalary + hra + allowances) * 0.10; // 10% TDS (simplified)
      professionalTax = 200; // Standard professional tax
      
      const salaryStructure = await db.SalaryStructure.create({
        employeeId: employee.id,
        basicSalary,
        hra,
        allowances,
        pfContribution,
        tds,
        professionalTax,
        otherDeductions: 0,
        currency: 'INR',
        effectiveFrom: new Date('2025-01-01'),
        isActive: true
      });
      
      console.log(`  ✅ Created salary structure: Basic=${basicSalary}, HRA=${hra}, Total=${basicSalary + hra + allowances}`);
    }
    
    console.log('\n🎯 Testing Payroll Generation Now...');
    
    // Now test if payroll generation works
    const axios = require('axios');
    const BASE_URL = 'http://localhost:8080/api';
    
    try {
      // Login as HR
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'hr@company.com',
        password: 'Lw3nQ6xY8mD4vB7h'
      });
      
      const token = loginResponse.data.data.accessToken;
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Try payroll generation
      const payrollGenResponse = await axios.post(`${BASE_URL}/payroll/generate`, {
        month: 8,
        year: 2025
      }, {
        headers: authHeaders
      });
      
      console.log('🎉 PAYROLL GENERATION SUCCESSFUL!');
      console.log(`Generated ${payrollGenResponse.data.data.generatedPayrollIds.length} payroll records`);
      console.log('Payroll IDs:', payrollGenResponse.data.data.generatedPayrollIds);
      
    } catch (apiError) {
      console.log('❌ Payroll generation still failing:', apiError.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Error creating salary structures:', error);
  } finally {
    // Close database connection
    await db.sequelize.close();
  }
}

createSalaryStructuresForActiveEmployees();
