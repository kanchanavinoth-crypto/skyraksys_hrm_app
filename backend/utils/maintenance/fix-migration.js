const db = require('./models');

async function fixMigration() {
  try {
    await db.sequelize.query(`DELETE FROM "SequelizeMeta" WHERE name = '20251027000001-add-performance-indexes.js'`);
    console.log('✅ Migration record removed - ready to re-run');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixMigration();
