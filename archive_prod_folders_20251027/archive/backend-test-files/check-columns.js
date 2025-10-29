const db = require('./models');

const checkColumns = async () => {
  try {
    const [results] = await db.sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('employees', 'timesheets', 'users', 'leave_requests', 'payrolls')
      ORDER BY table_name, ordinal_position
    `);
    
    console.log('Database Schema:');
    const tables = {};
    results.forEach(row => {
      const tableName = row.table_name;
      if (!tables[tableName]) tables[tableName] = [];
      tables[tableName].push(`"${row.column_name}"`);
    });
    
    Object.keys(tables).forEach(table => {
      console.log(`\n${table}:`, tables[table].join(', '));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkColumns();
