const { Employee } = require('./models');

async function updateTestData() {
  try {
    // Update employees with missing data
    const updates = [
      { employeeId: 'EMP004', updates: { esiNumber: 'ESI12345678' } },
      { employeeId: 'SKYT002', updates: { esiNumber: 'ESI22222222' } },
      { employeeId: 'SKYT003', updates: { esiNumber: 'ESI33333333' } },
      { employeeId: 'EMP003', updates: { dateOfBirth: '1992-05-15' } },
    ];

    console.log('\nUpdating employee data...\n');

    for (const item of updates) {
      const emp = await Employee.findOne({ where: { employeeId: item.employeeId } });
      if (emp) {
        await emp.update(item.updates);
        console.log(`✓ Updated ${emp.firstName} ${emp.lastName} (${item.employeeId})`);
        console.log(`  ${JSON.stringify(item.updates)}`);
      }
    }

    console.log('\n✓ All updates completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateTestData();
