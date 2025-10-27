const { Payslip, Employee } = require('./backend/models');

async function testPayslips() {
  try {
    console.log('Testing payslip functionality...');
    
    // Get all payslips
    const payslips = await Payslip.findAll({
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['firstName', 'lastName', 'employeeId']
      }],
      limit: 10
    });
    
    console.log(`Found ${payslips.length} payslips:`);
    payslips.forEach(p => {
      console.log(`- ID: ${p.id}`);
      console.log(`  Employee: ${p.employee?.firstName} ${p.employee?.lastName} (${p.employee?.employeeId})`);
      console.log(`  Month/Year: ${p.month}/${p.year}`);
      console.log(`  Status: ${p.status}`);
      console.log(`  Net Salary: ₹${p.netSalary || 'N/A'}`);
      console.log('---');
    });

    // Test getting a specific payslip
    if (payslips.length > 0) {
      const testPayslip = payslips[0];
      console.log(`\nTesting GET payslip by ID: ${testPayslip.id}`);
      
      const detailedPayslip = await Payslip.findByPk(testPayslip.id, {
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['firstName', 'lastName', 'employeeId', 'email']
          }
        ]
      });
      
      if (detailedPayslip) {
        console.log('✅ Successfully retrieved payslip details');
        console.log('Employee info:', detailedPayslip.employee);
      } else {
        console.log('❌ Failed to retrieve payslip details');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit();
}

testPayslips();