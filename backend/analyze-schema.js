const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('skyraksys_hrm', 'postgres', 'admin', {
  host: 'localhost',
  dialect: 'postgresql',
  logging: false
});

async function analyzeSchema() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Get all tables
    const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';");
    console.log('\n=== TABLES ===');
    console.log('Found tables:', tables.length);
    tables.forEach(t => console.log('- ' + t.table_name));
    
    // Analyze each table structure
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`\n=== ${tableName.toUpperCase()} TABLE ===`);
      
      const [columns] = await sequelize.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' 
        ORDER BY ordinal_position;
      `);
      
      columns.forEach(col => {
        console.log(`${col.column_name} | ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} | ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} | ${col.column_default || ''}`);
      });
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzeSchema();