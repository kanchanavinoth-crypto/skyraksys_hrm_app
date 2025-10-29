const { Employee } = require('./models');

async function addEsiNumbers() {
  try {
    const employees = await Employee.findAll({
      where: { 
        status: 'Active',
        esiNumber: null
      },
      limit: 10,
      attributes: ['id', 'employeeId', 'firstName', 'lastName']
    });

    console.log(`\nFound ${employees.length} employees without ESI numbers\n`);

    let count = 1;
    for (const emp of employees) {
      const esiNumber = `ESI${String(count).padStart(8, '0')}`;
      await emp.update({ esiNumber });
      console.log(`✓ Added ESI number ${esiNumber} to ${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
      count++;
    }

    console.log('\n✓ All employees now have ESI numbers!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addEsiNumbers();
