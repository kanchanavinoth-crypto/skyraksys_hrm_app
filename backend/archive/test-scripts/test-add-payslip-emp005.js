// Test script to add a payslip for EMP005 and test preview functionality
const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';

// Test data for EMP005 (Mike Wilson - Senior Software Developer)
const testPayslipData = {
  employeeId: 'EMP005',
  employee: {
    employeeId: 'EMP005',
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike.wilson@skyraksys.com',
    position: 'Senior Software Developer',
    department: 'Information Technology',
    salary: 1300000
  },
  payPeriod: '2024-09',
  month: 9,
  year: 2024,
  earnings: {
    basicSalary: 55000,
    houseRentAllowance: 27500,
    medicalAllowance: 15000,
    transportAllowance: 3200,
    specialAllowance: 25000,
    managementAllowance: 11000,
    performanceBonus: 8000
  },
  deductions: {
    providentFund: 1800,
    employeeStateInsurance: 0,
    professionalTax: 200,
    incomeTax: 12000,
    loanDeduction: 0,
    advanceDeduction: 0
  },
  attendance: {
    totalWorkingDays: 22,
    presentDays: 22,
    lopDays: 0,
    overtimeHours: 0
  },
  grossEarnings: 144700,
  totalDeductions: 14000,
  netPay: 130700,
  netPayInWords: 'One Lakh Thirty Thousand Seven Hundred Rupees Only',
  status: 'approved'
};

async function testPayslipFunctionality() {
  try {
    console.log('🚀 Testing Payslip Functionality for EMP005');
    console.log('=====================================\n');

    // Test 1: Try to get employees first
    console.log('1. Fetching employees...');
    try {
      const employeesResponse = await axios.get(`${API_BASE}/employees`);
      console.log(`✅ Found ${employeesResponse.data.length} employees`);
      
      const emp005 = employeesResponse.data.find(emp => emp.employeeId === 'EMP005');
      if (emp005) {
        console.log(`✅ Found EMP005: ${emp005.firstName} ${emp005.lastName}`);
      } else {
        console.log('❌ EMP005 not found in database');
      }
    } catch (error) {
      console.log(`❌ Failed to fetch employees: ${error.message}`);
    }

    // Test 2: Try to create/get payslip for EMP005
    console.log('\n2. Testing payslip creation...');
    try {
      const payslipResponse = await axios.post(`${API_BASE}/payslips`, testPayslipData);
      console.log('✅ Payslip created successfully:', payslipResponse.data.id);
    } catch (error) {
      console.log(`❌ Failed to create payslip: ${error.message}`);
      if (error.response) {
        console.log('Response data:', error.response.data);
      }
    }

    // Test 3: Try to get existing payslips
    console.log('\n3. Fetching existing payslips...');
    try {
      const payslipsResponse = await axios.get(`${API_BASE}/payslips`);
      console.log(`✅ Found ${payslipsResponse.data.length} payslips`);
      
      const emp005Payslips = payslipsResponse.data.filter(p => p.employeeId === 'EMP005');
      console.log(`✅ Found ${emp005Payslips.length} payslips for EMP005`);
    } catch (error) {
      console.log(`❌ Failed to fetch payslips: ${error.message}`);
    }

    // Test 4: Test payslip calculation (preview functionality)
    console.log('\n4. Testing payslip calculation/preview...');
    try {
      const calculationData = {
        employeeId: 'EMP005',
        basicSalary: 55000,
        totalWorkingDays: 22,
        presentDays: 22,
        lopDays: 0,
        overtimeHours: 0,
        houseRentAllowance: 27500,
        medicalAllowance: 15000,
        transportAllowance: 3200,
        specialAllowance: 25000,
        managementAllowance: 11000,
        performanceBonus: 8000
      };

      const previewResponse = await axios.post(`${API_BASE}/payslips/calculate`, calculationData);
      console.log('✅ Payslip calculation successful');
      console.log('Preview data:', JSON.stringify(previewResponse.data, null, 2));
    } catch (error) {
      console.log(`❌ Failed to calculate payslip: ${error.message}`);
      if (error.response) {
        console.log('Response data:', error.response.data);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('Starting payslip tests...\n');
testPayslipFunctionality();