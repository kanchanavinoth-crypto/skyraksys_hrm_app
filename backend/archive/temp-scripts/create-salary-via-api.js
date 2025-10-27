const axios = require('axios');
const db = require('./backend/models');

const BASE_URL = 'http://localhost:8080/api';

async function createSalaryStructuresViaAPI() {
  console.log('💰 Creating Salary Structures via API\n');
  
  try {
    // Step 1: Login as HR
    console.log('1. Logging in as HR...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'hr@company.com',
      password: 'Lw3nQ6xY8mD4vB7h'
    });
    
    const token = loginResponse.data.data.accessToken;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Get active employees via API
    console.log('\n2. Fetching active employees via API...');
    const employeesResponse = await axios.get(`${BASE_URL}/employees?status=Active`, {
      headers: authHeaders
    });
    
    const activeEmployees = employeesResponse.data.data;
    console.log(`Found ${activeEmployees.length} active employees via API`);
    
    // Step 3: Create salary structures for each employee
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
      
      // Create salary structure based on user role (we need to get user role)
      let basicSalary, hra, allowances, pfContribution, tds, professionalTax;
      
      // Get user role from employee user data
      const userRole = employee.user?.role || 'employee';
      
      switch (userRole) {
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
        default:
          basicSalary = 50000;
          hra = 20000; // 40% of basic
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
    
    // Step 4: Test payroll generation
    console.log('\n🎯 Testing Payroll Generation Now...');
    
    try {
      const payrollGenResponse = await axios.post(`${BASE_URL}/payroll/generate`, {
        month: 8,
        year: 2025
      }, {
        headers: authHeaders
      });
      
      console.log('🎉 PAYROLL GENERATION SUCCESSFUL!');
      console.log(`Generated ${payrollGenResponse.data.data.generatedPayrollIds.length} payroll records`);
      console.log('Payroll IDs:', payrollGenResponse.data.data.generatedPayrollIds);
      
      // Step 5: Check the generated payroll records
      console.log('\n📊 Checking generated payroll records...');
      const payrollResponse = await axios.get(`${BASE_URL}/payroll`, {
        headers: authHeaders
      });
      
      console.log(`Found ${payrollResponse.data.data.length} payroll records:`);
      payrollResponse.data.data.forEach((payroll, index) => {
        console.log(`   ${index + 1}. ${payroll.employee.firstName} ${payroll.employee.lastName}`);
        console.log(`      Gross: ₹${payroll.grossSalary} | Net: ₹${payroll.netSalary} | Status: ${payroll.status}`);
      });
      
    } catch (apiError) {
      console.log('❌ Payroll generation failed:', apiError.response?.data?.message);
      console.log('Details:', apiError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Close database connection
    await db.sequelize.close();
  }
}

createSalaryStructuresViaAPI();
