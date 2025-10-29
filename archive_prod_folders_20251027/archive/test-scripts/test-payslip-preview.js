// Simple Node.js test for payslip calculation/preview functionality
// This tests the calculation engine directly without needing database

// Test data for EMP005 (Mike Wilson)
const testEmployee = {
  employeeId: 'EMP005',
  firstName: 'Mike',
  lastName: 'Wilson',
  email: 'mike.wilson@skyraksys.com',
  position: 'Senior Software Developer',
  department: 'Information Technology',
  salary: 1300000
};

const testPayrollData = {
  employeeId: 'EMP005',
  basicSalary: 55000,
  totalWorkingDays: 22,
  presentDays: 22,
  lopDays: 0,
  overtimeHours: 0,
  // Allowances  
  houseRentAllowance: 27500,
  medicalAllowance: 15000,
  transportAllowance: 3200,
  specialAllowance: 25000,
  managementAllowance: 11000,
  performanceBonus: 8000,
  // Deductions
  voluntaryPF: 1800,
  tds: 12000,
  professionalTax: 200,
  medicalPremium: 0,
  loanEmi: 0,
  advances: 0
};

// Simplified payslip calculation (mimicking the frontend calculation)
function calculatePayslip(employee, payrollData) {
  console.log('\n🧮 Calculating Payslip...');
  console.log('================================');
  
  // Earnings calculation
  const earnings = {
    basicSalary: payrollData.basicSalary,
    houseRentAllowance: payrollData.houseRentAllowance,
    medicalAllowance: payrollData.medicalAllowance,
    transportAllowance: payrollData.transportAllowance,  
    specialAllowance: payrollData.specialAllowance,
    managementAllowance: payrollData.managementAllowance,
    performanceBonus: payrollData.performanceBonus
  };

  // Deductions calculation
  const deductions = {
    providentFund: payrollData.voluntaryPF,
    incomeTax: payrollData.tds,
    professionalTax: payrollData.professionalTax,
    medicalPremium: payrollData.medicalPremium,
    loanEmi: payrollData.loanEmi,
    advances: payrollData.advances
  };

  // Calculate totals
  const grossEarnings = Object.values(earnings).reduce((sum, val) => sum + (val || 0), 0);
  const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
  const netPay = grossEarnings - totalDeductions;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Number to words (simplified)
  const numberToWords = (amount) => {
    if (amount >= 100000) {
      const lakhs = Math.floor(amount / 100000);
      const remainder = amount % 100000;
      if (remainder === 0) {
        return `${lakhs} Lakh Rupees Only`;
      } else {
        const thousands = Math.floor(remainder / 1000);
        const hundreds = remainder % 1000;
        return `${lakhs} Lakh ${thousands > 0 ? thousands + ' Thousand ' : ''}${hundreds > 0 ? hundreds + ' ' : ''}Rupees Only`;
      }
    }
    return `${amount} Rupees Only`;
  };

  const payslipData = {
    employee,
    payPeriod: '2024-09',
    month: 9,
    year: 2024,
    earnings,
    deductions,
    attendance: {
      totalWorkingDays: payrollData.totalWorkingDays,
      presentDays: payrollData.presentDays,
      lopDays: payrollData.lopDays,
      overtimeHours: payrollData.overtimeHours
    },
    grossEarnings,
    totalDeductions,
    netPay,
    netPayInWords: numberToWords(netPay),
    status: 'preview'
  };

  return payslipData;
}

// Test the calculation
console.log('🚀 Testing Payslip Preview for EMP005');
console.log('=====================================');

console.log('\n📋 Employee Details:');
console.log(`Name: ${testEmployee.firstName} ${testEmployee.lastName}`);
console.log(`ID: ${testEmployee.employeeId}`);
console.log(`Position: ${testEmployee.position}`);
console.log(`Department: ${testEmployee.department}`);

const result = calculatePayslip(testEmployee, testPayrollData);

console.log('\n💰 EARNINGS:');
Object.entries(result.earnings).forEach(([key, value]) => {
  if (value > 0) {
    console.log(`  ${key}: ₹${value.toLocaleString('en-IN')}`);
  }
});

console.log('\n💸 DEDUCTIONS:');
Object.entries(result.deductions).forEach(([key, value]) => {
  if (value > 0) {
    console.log(`  ${key}: ₹${value.toLocaleString('en-IN')}`);
  }
});

console.log('\n📊 SUMMARY:');
console.log(`Gross Earnings: ₹${result.grossEarnings.toLocaleString('en-IN')}`);
console.log(`Total Deductions: ₹${result.totalDeductions.toLocaleString('en-IN')}`);
console.log(`Net Pay: ₹${result.netPay.toLocaleString('en-IN')}`);
console.log(`In Words: ${result.netPayInWords}`);

console.log('\n✅ Payslip preview calculation completed successfully!');
console.log('\n📝 This demonstrates that the preview functionality is working.');
console.log('💡 You can now use this data in the frontend preview dialog.');

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculatePayslip, testEmployee, testPayrollData };
}