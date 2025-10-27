const { sequelize } = require('./models');

async function debugTimesheetCreate() {
  console.log('🔍 DEBUG TIMESHEET CREATE ISSUE\n');
  
  try {
    // Get models
    const Employee = sequelize.models.Employee;
    const Project = sequelize.models.Project;
    const Task = sequelize.models.Task;
    const Timesheet = sequelize.models.Timesheet;
    
    // Get existing data
    const employee = await Employee.findOne();
    console.log(`📋 Employee found: ${employee.firstName} ${employee.lastName} (${employee.id})`);
    
    // Get/create project
    let project = await Project.findOne({ where: { name: 'Debug Project' } });
    if (!project) {
      project = await Project.create({
        name: 'Debug Project',
        description: 'Project for debugging timesheet',
        status: 'Active',
        isActive: true
      });
    }
    console.log(`📋 Project: ${project.name} (${project.id})`);
    
    // Get/create task
    let task = await Task.findOne({ 
      where: { 
        name: 'Debug Task',
        projectId: project.id 
      } 
    });
    if (!task) {
      task = await Task.create({
        projectId: project.id,
        name: 'Debug Task',
        description: 'Task for debugging',
        status: 'Not Started',
        isActive: true,
        priority: 'Medium'
      });
    }
    console.log(`📋 Task: ${task.name} (${task.id})`);
    console.log(`📋 Task belongs to project: ${task.projectId === project.id}`);
    
    // First clean up any existing debug entries
    await Timesheet.destroy({
      where: {
        employeeId: employee.id,
        workDate: '2025-08-03'
      },
      force: true
    });
    console.log('🧹 Cleaned up existing debug entries');
    
    // Test 1: Create timesheet without taskId - DIRECT MODEL CALL
    console.log('\n🧪 Test 1: Direct model create without taskId');
    try {
      const timesheet1 = await Timesheet.create({
        employeeId: employee.id,
        projectId: project.id,
        workDate: '2025-08-03',
        hoursWorked: 8,
        description: 'Direct model test without task'
      });
      console.log('✅ SUCCESS - Direct create without taskId:', timesheet1.id);
    } catch (error) {
      console.log('❌ FAILED - Direct create without taskId:', error.message);
      console.log('Error name:', error.name);
      console.log('SQL:', error.sql);
      if (error.errors) {
        error.errors.forEach(err => {
          console.log('- Validation error:', err.message, 'on field:', err.path);
        });
      }
    }
    
    // Test 2: Create timesheet with taskId - DIRECT MODEL CALL
    console.log('\n🧪 Test 2: Direct model create with taskId');
    try {
      const timesheet2 = await Timesheet.create({
        employeeId: employee.id,
        projectId: project.id,
        taskId: task.id,
        workDate: '2025-08-02',
        hoursWorked: 6,
        description: 'Direct model test with task'
      });
      console.log('✅ SUCCESS - Direct create with taskId:', timesheet2.id);
    } catch (error) {
      console.log('❌ FAILED - Direct create with taskId:', error.message);
      console.log('Error name:', error.name);
      console.log('SQL:', error.sql);
      if (error.errors) {
        error.errors.forEach(err => {
          console.log('- Validation error:', err.message, 'on field:', err.path);
        });
      }
    }
    
    // Test 3: Check existing timesheets
    console.log('\n📋 Existing timesheets:');
    const existing = await Timesheet.findAll({
      where: { employeeId: employee.id },
      attributes: ['id', 'workDate', 'projectId', 'taskId', 'hoursWorked'],
      limit: 5
    });
    existing.forEach(t => {
      console.log(`- ${t.workDate}: ${t.hoursWorked}h, Project: ${t.projectId}, Task: ${t.taskId || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugTimesheetCreate().catch(console.error);
