const { Employee } = require('./models');

async function addSalaryToEmployees() {
  try {
    const salaryData = {
      basicSalary: 60000,
      houseRentAllowance: 24000,
      transportAllowance: 6000,
      medicalAllowance: 2500,
      specialAllowance: 3500,
      providentFund: 6000,
      professionalTax: 200,
      incomeTax: 6000,
      currency: 'INR',
      payFrequency: 'monthly',
      effectiveDate: '2024-01-01'
    };

    // Find employees without salary
    const employees = await Employee.findAll({
      where: { 
        status: 'Active',
        salary: null
      },
      attributes: ['id', 'employeeId', 'firstName', 'lastName']
    });

    console.log(`\nFound ${employees.length} employees without salary data\n`);

    for (const emp of employees) {
      await emp.update({ salary: salaryData });
      console.log(`✓ Added salary to ${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
    }

    console.log('\n✓ All employees now have salary data!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addSalaryToEmployees();
