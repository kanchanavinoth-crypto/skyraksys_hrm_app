// Check column names in related tables
const { Sequelize, Op } = require('sequelize');

// Initialize database connection
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5433,
  database: 'skyraksys_hrm',
  username: 'hrm_admin',
  password: 'hrm_secure_2024',
  logging: false
});

async function checkColumnNames() {
  try {
    console.log('🔍 Checking column names in related tables...\n');

    const tables = ['employees', 'projects', 'tasks'];

    for (const tableName of tables) {
      console.log(`📋 Columns in ${tableName}:`);
      
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' 
        ORDER BY ordinal_position
      `);

      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
      console.log('');
    }

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error checking columns:', error);
    await sequelize.close();
  }
}

checkColumnNames();