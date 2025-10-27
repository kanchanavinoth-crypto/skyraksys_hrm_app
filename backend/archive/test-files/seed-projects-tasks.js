const db = require('./backend/models');
const { Project, Task, Employee } = db;

// Set the correct database port
process.env.DB_PORT = '5433';

async function seedProjectsAndTasks() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.sync();
    
    // Get the first employee to be the manager
    const manager = await Employee.findOne();
    if (!manager) {
      console.log('No employees found. Please create employees first.');
      return;
    }
    
    console.log('Creating sample projects...');
    
    // Create sample projects
    const projects = [
      {
        name: 'Project Alpha',
        description: 'Frontend development project',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'Active',
        clientName: 'Tech Corp',
        managerId: manager.id,
        isActive: true
      },
      {
        name: 'Project Beta',
        description: 'Backend API development',
        startDate: '2025-02-01',
        endDate: '2025-11-30',
        status: 'Active',
        clientName: 'Digital Solutions',
        managerId: manager.id,
        isActive: true
      },
      {
        name: 'Project Gamma',
        description: 'Mobile application development',
        startDate: '2025-03-01',
        endDate: '2025-10-31',
        status: 'Active',
        clientName: 'Mobile Inc',
        managerId: manager.id,
        isActive: true
      },
      {
        name: 'Internal Tasks',
        description: 'Internal company tasks and maintenance',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'Active',
        clientName: 'Internal',
        managerId: manager.id,
        isActive: true
      },
      {
        name: 'Training',
        description: 'Employee training and development',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'Active',
        clientName: 'Internal',
        managerId: manager.id,
        isActive: true
      },
      {
        name: 'Meetings',
        description: 'Team meetings and discussions',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'Active',
        clientName: 'Internal',
        managerId: manager.id,
        isActive: true
      }
    ];

    const createdProjects = [];
    for (const projectData of projects) {
      const [project, created] = await Project.findOrCreate({
        where: { name: projectData.name },
        defaults: projectData
      });
      createdProjects.push(project);
      console.log(`${created ? 'Created' : 'Found'} project: ${project.name} (ID: ${project.id})`);
    }

    console.log('Creating sample tasks...');
    
    // Create sample tasks for each project
    const taskTypes = [
      'Frontend Development',
      'Backend Development', 
      'Testing',
      'Code Review',
      'Documentation',
      'Meeting',
      'Training',
      'Bug Fixing',
      'Research'
    ];

    for (const project of createdProjects) {
      for (const taskType of taskTypes) {
        const [task, created] = await Task.findOrCreate({
          where: { 
            name: taskType,
            projectId: project.id 
          },
          defaults: {
            name: taskType,
            description: `${taskType} for ${project.name}`,
            estimatedHours: 40,
            status: 'Not Started',
            priority: 'Medium',
            projectId: project.id,
            assignedTo: manager.id,
            isActive: true
          }
        });
        if (created) {
          console.log(`Created task: ${task.name} for project ${project.name} (ID: ${task.id})`);
        }
      }
    }

    console.log('Sample projects and tasks created successfully!');
    
    // Display summary
    const projectCount = await Project.count();
    const taskCount = await Task.count();
    console.log(`\nSummary:`);
    console.log(`Total projects: ${projectCount}`);
    console.log(`Total tasks: ${taskCount}`);

  } catch (error) {
    console.error('Error seeding projects and tasks:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the seeding function
seedProjectsAndTasks();
