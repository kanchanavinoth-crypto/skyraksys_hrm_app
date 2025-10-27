const db = require('./backend/models');

(async () => {
  try {
    console.log('Starting database sync...');
    await db.sequelize.sync({ alter: true });
    console.log('✅ Database sync completed - availableToAll field should be added to tasks table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync error:', error.message);
    process.exit(1);
  }
})();
