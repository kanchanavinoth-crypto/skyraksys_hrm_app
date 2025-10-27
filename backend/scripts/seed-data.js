const db = require('../models');

async function seedData() {
  try {
    await db.sequelize.sync({ force: false });
    
    console.log('Creating departments...');
    
    const departments = [
      { name: 'Engineering', description: 'Software development and technical teams' },
      { name: 'Human Resources', description: 'HR and people operations' },
      { name: 'Sales', description: 'Sales and business development' },
      { name: 'Marketing', description: 'Marketing and communications' },
      { name: 'Finance', description: 'Finance and accounting' },
      { name: 'Operations', description: 'Operations and administration' }
    ];
    
    for (const dept of departments) {
      await db.Department.findOrCreate({
        where: { name: dept.name },
        defaults: dept
      });
    }
    
    console.log('Creating positions...');
    
    const positions = [
      { title: 'Software Engineer', department: 'Engineering' },
      { title: 'Senior Software Engineer', department: 'Engineering' },
      { title: 'Lead Developer', department: 'Engineering' },
      { title: 'Engineering Manager', department: 'Engineering' },
      { title: 'HR Manager', department: 'Human Resources' },
      { title: 'HR Executive', department: 'Human Resources' },
      { title: 'Sales Executive', department: 'Sales' },
      { title: 'Sales Manager', department: 'Sales' },
      { title: 'Marketing Specialist', department: 'Marketing' },
      { title: 'Marketing Manager', department: 'Marketing' },
      { title: 'Accountant', department: 'Finance' },
      { title: 'Finance Manager', department: 'Finance' },
      { title: 'Operations Manager', department: 'Operations' },
      { title: 'Administrator', department: 'Operations' }
    ];
    
    for (const pos of positions) {
      const department = await db.Department.findOne({ where: { name: pos.department } });
      if (department) {
        await db.Position.findOrCreate({
          where: { title: pos.title },
          defaults: {
            title: pos.title,
            departmentId: department.id
          }
        });
      }
    }
    
    console.log('Data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
