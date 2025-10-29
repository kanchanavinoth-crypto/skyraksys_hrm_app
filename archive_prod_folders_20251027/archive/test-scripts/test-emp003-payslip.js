// Test payslip calculation for EMP003 (John Doe - Software Developer)
console.log('🚀 Testing Payslip Preview for EMP003');
console.log('=====================================');

// Employee data for EMP003
const emp003Data = {
  employeeId: 'EMP003',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@skyraksys.com',
  position: 'Software Developer',
  department: 'Information Technology',
  salary: 800000 // Annual salary
};

// Payroll data based on the database sample
const emp003PayrollData = {
  employeeId: 'EMP003',
  basicSalary: 35000,
  totalWorkingDays: 22,
  presentDays: 21, // 1 day absent
  lopDays: 1,
  overtimeHours: 10,
  // Allowances
  houseRentAllowance: 14000,
  medicalAllowance: 1250,
  transportAllowance: 1600,
  specialAllowance: 8000,
  overtimeAllowance: 2500,
  bonus: 1000,
  // Deductions
  providentFund: 4200,
  employeeStateInsurance: 449,
  professionalTax: 200,
  incomeTax: 2500,
  loanDeduction: 0,
  advanceDeduction: 0
};

function calculateEmp003Payslip(employee, payrollData) {
  console.log('\n📋 Employee Details:');
  console.log(`Name: ${employee.firstName} ${employee.lastName}`);
  console.log(`ID: ${employee.employeeId}`);
  console.log(`Position: ${employee.position}`);
  console.log(`Department: ${employee.department}`);
  console.log(`Annual Salary: ₹${employee.salary.toLocaleString('en-IN')}`);

  console.log('\n📅 Attendance Details:');
  console.log(`Total Working Days: ${payrollData.totalWorkingDays}`);
  console.log(`Present Days: ${payrollData.presentDays}`);
  console.log(`LOP Days: ${payrollData.lopDays}`);
  console.log(`Overtime Hours: ${payrollData.overtimeHours}`);

  // Calculate earnings
  const earnings = {
    basicSalary: payrollData.basicSalary,
    houseRentAllowance: payrollData.houseRentAllowance,
    medicalAllowance: payrollData.medicalAllowance,
    transportAllowance: payrollData.transportAllowance,
    specialAllowance: payrollData.specialAllowance,
    overtimeAllowance: payrollData.overtimeAllowance,
    bonus: payrollData.bonus
  };

  // Calculate deductions
  const deductions = {
    providentFund: payrollData.providentFund,
    employeeStateInsurance: payrollData.employeeStateInsurance,
    professionalTax: payrollData.professionalTax,
    incomeTax: payrollData.incomeTax,
    loanDeduction: payrollData.loanDeduction,
    advanceDeduction: payrollData.advanceDeduction
  };

  const grossEarnings = Object.values(earnings).reduce((sum, val) => sum + (val || 0), 0);
  const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
  const netPay = grossEarnings - totalDeductions;

  console.log('\n💰 EARNINGS BREAKDOWN:');
  Object.entries(earnings).forEach(([key, value]) => {
    if (value > 0) {
      console.log(`  ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ₹${value.toLocaleString('en-IN')}`);
    }
  });

  console.log('\n💸 DEDUCTIONS BREAKDOWN:');
  Object.entries(deductions).forEach(([key, value]) => {
    if (value > 0) {
      console.log(`  ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ₹${value.toLocaleString('en-IN')}`);
    }
  });

  console.log('\n📊 PAYSLIP SUMMARY:');
  console.log(`Gross Earnings: ₹${grossEarnings.toLocaleString('en-IN')}`);
  console.log(`Total Deductions: ₹${totalDeductions.toLocaleString('en-IN')}`);
  console.log(`Net Pay: ₹${netPay.toLocaleString('en-IN')}`);

  // Number to words
  const numberToWords = (amount) => {
    if (amount >= 50000 && amount < 100000) {
      const thousands = Math.floor(amount / 1000);
      const remainder = amount % 1000;
      return `${thousands} Thousand ${remainder > 0 ? remainder + ' ' : ''}Rupees Only`;
    }
    return `${amount} Rupees Only`;
  };

  console.log(`Amount in Words: ${numberToWords(netPay)}`);

  console.log('\n✅ EMP003 Payslip Calculation Complete!');
  
  // Verify against database values
  console.log('\n🔍 VERIFICATION (Database vs Calculated):');
  console.log(`Gross Earnings: DB=₹63,350 | Calc=₹${grossEarnings.toLocaleString('en-IN')} | Match: ${grossEarnings === 63350 ? '✅' : '❌'}`);
  console.log(`Total Deductions: DB=₹7,349 | Calc=₹${totalDeductions.toLocaleString('en-IN')} | Match: ${totalDeductions === 7349 ? '✅' : '❌'}`);
  console.log(`Net Pay: DB=₹56,001 | Calc=₹${netPay.toLocaleString('en-IN')} | Match: ${netPay === 56001 ? '✅' : '❌'}`);

  return {
    employee,
    earnings,
    deductions,
    grossEarnings,
    totalDeductions,
    netPay,
    payPeriod: 'January 2024',
    status: 'approved'
  };
}

// Run the test
const result = calculateEmp003Payslip(emp003Data, emp003PayrollData);

console.log('\n🎯 PREVIEW FUNCTIONALITY TEST:');
console.log('This data can be used in the frontend preview dialog');
console.log('Employee EMP003 payslip preview is ready! 🚀');

console.log('\n💡 TO TEST IN FRONTEND:');
console.log('1. Open http://localhost:3000');
console.log('2. Go to Admin → Payslip Management');
console.log('3. Select EMP003 (John Doe)');
console.log('4. Enter the payroll data shown above');
console.log('5. Click "Calculate & Preview"');
console.log('6. Verify the calculations match our test results');