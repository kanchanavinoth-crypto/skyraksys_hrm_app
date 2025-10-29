const db = require('./models');

(async () => {
  try {
    const tasks = await db.Task.findAll({
      include: [{ model: db.Project, as: 'project' }],
      order: [['name', 'ASC']]
    });
    
    console.log('Current Tasks:');
    tasks.forEach(task => {
      console.log(`- ${task.name} (Project: ${task.project.name})`);
      console.log(`  availableToAll: ${task.availableToAll}, assignedTo: ${task.assignedTo}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();