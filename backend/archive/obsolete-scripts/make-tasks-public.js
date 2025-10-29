const db = require('./models');

(async () => {
  try {
    // Make some tasks available to all users
    const tasksToMakePublic = [
      'Frontend Development',
      'Backend Development', 
      'Database Design',
      'Mobile UI/UX Design',
      'Data Pipeline Development'
    ];
    
    console.log('Making tasks accessible to all users...');
    
    for (const taskName of tasksToMakePublic) {
      const result = await db.Task.update(
        { availableToAll: true },
        { where: { name: taskName } }
      );
      
      if (result[0] > 0) {
        console.log(`✅ Made "${taskName}" available to all users`);
      } else {
        console.log(`❌ Could not find task "${taskName}"`);
      }
    }
    
    // Show updated tasks
    console.log('\nUpdated Tasks:');
    const tasks = await db.Task.findAll({
      include: [{ model: db.Project, as: 'project' }],
      order: [['name', 'ASC']]
    });
    
    tasks.forEach(task => {
      const access = task.availableToAll ? '🌐 All Users' : '🔒 Restricted';
      console.log(`- ${task.name} (${task.project.name}) - ${access}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();