const db = require('./backend/models');

async function checkAndFixDatabaseData() {
  console.log('🔍 Checking database data...\n');

  try {
    // Check leave types
    console.log('1. Checking Leave Types...');
    const leaveTypes = await db.LeaveType.findAll();
    console.log(`   Found ${leaveTypes.length} leave types`);
    
    if (leaveTypes.length === 0) {
      console.log('   ⚠️ No leave types found - creating defaults...');
      
      const defaultLeaveTypes = [
        { name: 'Annual Leave', description: 'Annual vacation leave', maxDaysPerYear: 21, carryForward: true, maxCarryForwardDays: 5, isActive: true },
        { name: 'Sick Leave', description: 'Medical leave', maxDaysPerYear: 10, carryForward: false, maxCarryForwardDays: 0, isActive: true },
        { name: 'Personal Leave', description: 'Personal time off', maxDaysPerYear: 5, carryForward: false, maxCarryForwardDays: 0, isActive: true },
        { name: 'Maternity Leave', description: 'Maternity leave', maxDaysPerYear: 90, carryForward: false, maxCarryForwardDays: 0, isActive: true },
        { name: 'Paternity Leave', description: 'Paternity leave', maxDaysPerYear: 15, carryForward: false, maxCarryForwardDays: 0, isActive: true }
      ];

      for (const leaveType of defaultLeaveTypes) {
        await db.LeaveType.create(leaveType);
      }
      
      console.log('   ✅ Created 5 default leave types');
    } else {
      leaveTypes.forEach(lt => {
        console.log(`   - ${lt.name}: ${lt.maxDaysPerYear} days/year`);
      });
    }

    // Check projects for timesheets
    console.log('\n2. Checking Projects...');
    const projects = await db.Project.findAll();
    console.log(`   Found ${projects.length} projects`);
    
    if (projects.length === 0) {
      console.log('   ⚠️ No projects found - creating defaults...');
      
      const defaultProjects = [
        { name: 'General Administration', description: 'Administrative tasks and meetings', isActive: true },
        { name: 'Software Development', description: 'Core software development projects', isActive: true },
        { name: 'Training & Development', description: 'Employee training and skill development', isActive: true },
        { name: 'Client Projects', description: 'Client-specific project work', isActive: true }
      ];

      for (const project of defaultProjects) {
        await db.Project.create(project);
      }
      
      console.log('   ✅ Created 4 default projects');
    } else {
      projects.forEach(p => {
        console.log(`   - ${p.name}`);
      });
    }

    // Check if we have employees
    console.log('\n3. Checking Employees...');
    const employees = await db.Employee.findAll();
    console.log(`   Found ${employees.length} employees`);
    employees.forEach(emp => {
      console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
    });

    // Check departments and positions
    console.log('\n4. Checking Departments...');
    const departments = await db.Department.findAll();
    console.log(`   Found ${departments.length} departments`);
    departments.forEach(dept => {
      console.log(`   - ${dept.name}`);
    });

    console.log('\n5. Checking Positions...');
    const positions = await db.Position.findAll();
    console.log(`   Found ${positions.length} positions`);
    positions.forEach(pos => {
      console.log(`   - ${pos.title} (${pos.level})`);
    });

    console.log('\n✅ Database check complete!');
    console.log('\n📊 SUMMARY:');
    console.log(`   Leave Types: ${(await db.LeaveType.findAll()).length}`);
    console.log(`   Projects: ${(await db.Project.findAll()).length}`);
    console.log(`   Employees: ${employees.length}`);
    console.log(`   Departments: ${departments.length}`);
    console.log(`   Positions: ${positions.length}`);

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkAndFixDatabaseData();
