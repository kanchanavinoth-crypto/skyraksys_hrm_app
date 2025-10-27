const db = require('./models');

async function updateAdminEmployee() {
  try {
    await db.sequelize.sync({ force: false });
    
    // Find the admin employee
    const adminEmployee = await db.Employee.findOne({
      where: { email: 'admin@skyraksys.com' }
    });
    
    if (!adminEmployee) {
      console.log('Admin employee not found');
      process.exit(1);
    }
    
    // Find Operations department and Administrator position
    const operationsDept = await db.Department.findOne({
      where: { name: 'Operations' }
    });
    
    const adminPosition = await db.Position.findOne({
      where: { title: 'Administrator' }
    });
    
    // Update admin employee
    await adminEmployee.update({
      departmentId: operationsDept ? operationsDept.id : null,
      positionId: adminPosition ? adminPosition.id : null,
      salary: 100000
    });
    
    console.log('Admin employee updated successfully!');
    console.log(`Department ID: ${operationsDept?.id}`);
    console.log(`Position ID: ${adminPosition?.id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin employee:', error);
    process.exit(1);
  }
}

updateAdminEmployee();
