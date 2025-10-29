const { sequelize } = require('./models');

async function checkForeignKeys() {
  try {
    console.log('🔍 Checking Foreign Key Constraints for Tasks table...\n');
    
    const query = `
      SELECT 
        conname as constraint_name,
        conrelid::regclass as table_name,
        confrelid::regclass as referenced_table,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE contype = 'f' 
      AND (conrelid::regclass::text = 'tasks' OR confrelid::regclass::text = 'tasks');
    `;
    
    const result = await sequelize.query(query);
    
    if (result[0].length === 0) {
      console.log('⚠️  No foreign key constraints found for tasks table');
    } else {
      console.log('✅ Foreign Key Constraints found:');
      result[0].forEach((constraint, index) => {
        console.log(`\n${index + 1}. ${constraint.constraint_name}`);
        console.log(`   Table: ${constraint.table_name}`);
        console.log(`   References: ${constraint.referenced_table}`);
        console.log(`   Definition: ${constraint.definition}`);
      });
    }
    
    // Also check the table structure
    console.log('\n🏗️  Checking Tasks table structure...\n');
    const tableInfo = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position;
    `);
    
    tableInfo[0].forEach(column => {
      console.log(`   ${column.column_name}: ${column.data_type} ${column.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

checkForeignKeys();