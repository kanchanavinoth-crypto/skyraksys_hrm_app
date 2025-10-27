const db = require('../models');

async function seedProjectsAndTasks() {
  try {
    // Create test project
    const project = await db.Project.create({
      name: 'Website Redesign',
      description: 'Complete website redesign project',
      status: 'Active',
      clientName: 'Acme Corp',
      isActive: true
    });

    // Create test tasks
    await db.Task.bulkCreate([
      {
        name: 'Design Homepage',
        description: 'Create mockups for new homepage',
        projectId: project.id,
        status: 'In Progress',
        priority: 'High',
        availableToAll: true,
        estimatedHours: 20,
        isActive: true
      },
      {
        name: 'Develop Contact Form',
        description: 'Implement contact form with validation',
        projectId: project.id,
        status: 'Not Started',
        priority: 'Medium',
        availableToAll: true,
        estimatedHours: 8,
        isActive: true
      }
    ]);

    console.log('✅ Test data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedProjectsAndTasks();
