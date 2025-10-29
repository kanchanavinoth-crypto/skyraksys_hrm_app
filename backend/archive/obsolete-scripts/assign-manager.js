const { Employee, Department, Position } = require('./models');

async function assignManagerToJohn() {
  try {
    console.log('=== Checking Manager Assignment for John Developer ===\n');
    
    // First, get John's current data
    const john = await Employee.findByPk('614a6351-29b0-4819-950f-1deb9965926c');
    
    if (!john) {
      console.log('❌ John Developer not found!');
      return;
    }
    
    console.log(`Current manager ID for ${john.firstName} ${john.lastName}: ${john.managerId || 'NULL'}`);
    
    if (john.managerId) {
      console.log('✅ Manager already assigned');
      return;
    }
    
    // Find all other employees who could be managers
    const allEmployees = await Employee.findAll({
      where: {
        id: { [require('sequelize').Op.ne]: john.id }, // Not John himself
        status: 'Active'
      },
      include: [{
        model: Position,
        as: 'position',
        required: false
      }]
    });
    
    console.log(`\nFound ${allEmployees.length} potential managers:`);
    allEmployees.forEach((emp, index) => {
      const position = emp.position?.title || 'No Position';
      console.log(`${index + 1}. ${emp.firstName} ${emp.lastName} - ${position} (ID: ${emp.id})`);
    });
    
    // Assign the first available employee as manager
    if (allEmployees.length > 0) {
      const manager = allEmployees[0];
      console.log(`\n🔄 Assigning ${manager.firstName} ${manager.lastName} as John's manager...`);
      
      await john.update({ managerId: manager.id });
      
      console.log('✅ Manager assignment completed!');
      console.log(`John Developer now reports to: ${manager.firstName} ${manager.lastName}`);
    } else {
      console.log('\n❌ No potential managers found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

assignManagerToJohn();
