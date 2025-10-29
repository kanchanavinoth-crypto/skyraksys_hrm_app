const axios = require('axios');
const db = require('./backend/models');

const BASE_URL = 'http://localhost:8080/api';

async function createSalaryStructuresViaAPI() {
  console.log('💰 Creating Salary Structures for Active Employees (via API)\n');
  
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
    
    activeEmployees.forEach(emp => {
      console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.employeeId}) - Status: "${emp.status}"`);
    });
    
    // Step 3: Create salary structures for each employee
    console.log('\n3. Creating salary structures...');
    
    for (const employee of activeEmployees) {
      console.log(`\n   Processing: ${employee.firstName} ${employee.lastName}`);
      
      // Check if salary structure already exists via database
      const existingSalaryStructure = await db.SalaryStructure.findOne({
        where: { 
          employeeId: employee.id,
          isActive: true
        }
      });
      
      if (existingSalaryStructure) {
        console.log('     ✅ Salary structure already exists');
        continue;
      }
      
      // Determine salary based on user role (we need to get this from the employee data)
      let basicSalary, hra, allowances, pfContribution, tds, professionalTax;
      
      // Get user role from the employee's user relationship
      const userResponse = await axios.get(`${BASE_URL}/employees/${employee.id}`, {
        headers: authHeaders
      });
      
      const userRole = userResponse.data.data.user?.role || 'employee';
      
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
      
      console.log(`     ✅ Created salary structure:`);
      console.log(`        Basic: ₹${basicSalary}, HRA: ₹${hra}, Allowances: ₹${allowances}`);
      console.log(`        Total Gross: ₹${basicSalary + hra + allowances}`);
    }
    
    // Step 4: Test payroll generation
    console.log('\n4. 🎯 Testing Payroll Generation...');
    
    try {
      const payrollGenResponse = await axios.post(`${BASE_URL}/payroll/generate`, {
        month: 8,
        year: 2025
      }, {
        headers: authHeaders
      });
      
      console.log('🎉 PAYROLL GENERATION SUCCESSFUL!');
      console.log(`   Generated ${payrollGenResponse.data.data.generatedPayrollIds.length} payroll records`);
      console.log('   Payroll IDs:', payrollGenResponse.data.data.generatedPayrollIds);
      
      // Step 5: Test Calculate Payroll button functionality
      console.log('\n5. ✅ CALCULATE PAYROLL BUTTON SHOULD NOW WORK!');
      console.log('   - Frontend can now call /api/payroll/generate successfully');
      console.log('   - No more "Invalid token" or "No employees found" errors');
      console.log('   - Payroll records will be created with proper salary structures');
      
    } catch (payrollError) {
      console.log('❌ Payroll generation failed:', payrollError.response?.data?.message);
      console.log('   Status:', payrollError.response?.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  } finally {
    // Close database connection
    await db.sequelize.close();
  }
}

createSalaryStructuresViaAPI();
