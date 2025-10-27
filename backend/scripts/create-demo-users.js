const { User, Employee, Department, Position } = require('../models');
const bcrypt = require('bcryptjs');

async function createDemoUsers() {
  console.log('Creating demo users for login testing...');
  
  // Get or create default department and position
  let itDept = await Department.findOne({ where: { name: 'Information Technology' } });
  if (!itDept) {
    itDept = await Department.create({
      name: 'Information Technology',
      description: 'IT Department'
    });
  }
  
  let devPos = await Position.findOne({ where: { title: 'Software Developer' } });
  if (!devPos) {
    devPos = await Position.create({
      title: 'Software Developer',
      description: 'Developer',
      departmentId: itDept.id
    });
  }
  
  const demoUsers = [
    { 
      email: 'admin@test.com', 
      password: 'admin123', 
      role: 'admin', 
      firstName: 'Admin', 
      lastName: 'User',
      isActive: true,
      employeeId: 'TEST001'
    },
    { 
      email: 'hr@test.com', 
      password: 'admin123', 
      role: 'hr', 
      firstName: 'HR', 
      lastName: 'Manager',
      isActive: true,
      employeeId: 'TEST002'
    },
    { 
      email: 'manager@test.com', 
      password: 'admin123', 
      role: 'manager', 
      firstName: 'Team', 
      lastName: 'Manager',
      isActive: true,
      employeeId: 'TEST003'
    },
    { 
      email: 'employee@test.com', 
      password: 'admin123', 
      role: 'employee', 
      firstName: 'Demo', 
      lastName: 'Employee',
      isActive: true,
      employeeId: 'TEST004'
    }
  ];

  for (const userData of demoUsers) {
    try {
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (!existingUser) {
        // Hash password before creating user
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const userDataWithHashedPassword = { 
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          isActive: userData.isActive
        };
        
        const newUser = await User.create(userDataWithHashedPassword);
        
        // Create corresponding Employee record
        await Employee.create({
          userId: newUser.id,
          employeeId: userData.employeeId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          departmentId: itDept.id,
          positionId: devPos.id,
          hireDate: new Date(),
          salary: 50000,
          status: 'active'
        });
        
        console.log('✅ Created:', userData.email, '(' + userData.role + ')', 'ID:', newUser.id);
      } else {
        console.log('⚠️  Already exists:', userData.email, '(' + existingUser.role + ')', 'Active:', existingUser.isActive);
      }
    } catch (error) {
      console.error('❌ Error creating', userData.email + ':', error.message);
    }
  }

  console.log('\nDemo users setup complete!');
  console.log('You can now use these credentials to login:');
  console.log('• admin@test.com / admin123 (Admin)');
  console.log('• hr@test.com / admin123 (HR)');
  console.log('• manager@test.com / admin123 (Manager)');
  console.log('• employee@test.com / admin123 (Employee)');
}

createDemoUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
