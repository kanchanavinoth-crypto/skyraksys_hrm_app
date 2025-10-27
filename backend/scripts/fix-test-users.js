const { User, Employee, Department, Position } = require('../models');
const { Op } = require('sequelize');

async function fixTestUsers() {
  try {
    console.log('Adding Employee records for test users...');
    
    const testUsers = await User.findAll({ 
      where: { 
        email: { 
          [Op.like]: '%@test.com' 
        } 
      } 
    });
    
    const itDept = await Department.findOne({ where: { name: 'Information Technology' } });
    const devPos = await Position.findOne({ where: { title: 'Software Developer' } });
    
    if (!itDept || !devPos) {
      console.error('❌ Required department or position not found');
      return;
    }
    
    for (const user of testUsers) {
      const existingEmployee = await Employee.findOne({ where: { userId: user.id } });
      if (!existingEmployee) {
        await Employee.create({
          userId: user.id,
          employeeId: 'TEST' + user.id.slice(-3),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          departmentId: itDept.id,
          positionId: devPos.id,
          hireDate: new Date(),
          salary: 50000,
          status: 'active'
        });
        console.log('✅ Created Employee record for:', user.email);
      } else {
        console.log('⚠️  Employee record already exists for:', user.email);
      }
    }
    console.log('Employee records update complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

fixTestUsers();
