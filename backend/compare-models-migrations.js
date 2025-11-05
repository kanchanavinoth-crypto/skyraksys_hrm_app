const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    console.log('🔍 Comparing Models vs Migration Schema...\n');
    
    // Get all model definitions
    const db = require('./models');
    const modelNames = Object.keys(db).filter(key => 
      !['sequelize', 'Sequelize'].includes(key) && typeof db[key] === 'function'
    );
    
    console.log('📚 Models defined in code:');
    console.log('='.repeat(50));
    modelNames.forEach(name => {
      const model = db[name];
      const tableName = model.tableName || model.getTableName();
      const attributes = Object.keys(model.rawAttributes || {});
      console.log(`  ${name.padEnd(25)} → ${tableName} (${attributes.length} columns)`);
    });
    console.log('='.repeat(50));
    console.log(`Total: ${modelNames.length} models\n`);
    
    // Get all tables from database
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != 'SequelizeMeta'
      ORDER BY table_name
    `);
    
    console.log('📊 Tables in database:');
    console.log('='.repeat(50));
    for (const table of tables) {
      const [columns] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${table.table_name}'
      `);
      console.log(`  ${table.table_name.padEnd(30)} ${columns[0].count} columns`);
    }
    console.log('='.repeat(50));
    console.log(`Total: ${tables.length} tables\n`);
    
    // Compare - find tables in DB but not in models
    const modelTableNames = modelNames.map(name => {
      const model = db[name];
      return model.tableName || model.getTableName();
    });
    
    const dbTableNames = tables.map(t => t.table_name);
    
    const extraInDb = dbTableNames.filter(t => !modelTableNames.includes(t));
    const missingInDb = modelTableNames.filter(t => !dbTableNames.includes(t));
    
    console.log('🔎 Analysis:');
    console.log('='.repeat(50));
    
    if (extraInDb.length > 0) {
      console.log('\n⚠️  Tables in DB but NO MODEL defined:');
      extraInDb.forEach(t => console.log(`  - ${t}`));
    } else {
      console.log('\n✅ No extra tables in database');
    }
    
    if (missingInDb.length > 0) {
      console.log('\n⚠️  Models defined but NO TABLE in DB:');
      missingInDb.forEach(t => console.log(`  - ${t}`));
    } else {
      console.log('\n✅ All model tables exist in database');
    }
    
    console.log('='.repeat(50));
    
    // Check for detailed column differences
    console.log('\n📋 Detailed column comparison:\n');
    
    for (const modelName of modelNames) {
      const model = db[modelName];
      const tableName = model.tableName || model.getTableName();
      
      if (!dbTableNames.includes(tableName)) {
        continue; // Skip if table doesn't exist
      }
      
      const modelAttributes = Object.keys(model.rawAttributes || {});
      
      const [dbColumns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
        ORDER BY column_name
      `);
      
      const dbColumnNames = dbColumns.map(c => c.column_name);
      
      const extraInModel = modelAttributes.filter(c => !dbColumnNames.includes(c));
      const extraInDbTable = dbColumnNames.filter(c => !modelAttributes.includes(c));
      
      if (extraInModel.length > 0 || extraInDbTable.length > 0) {
        console.log(`\n⚠️  ${modelName} (${tableName}):`);
        if (extraInModel.length > 0) {
          console.log(`  Columns in model but NOT in DB: ${extraInModel.join(', ')}`);
        }
        if (extraInDbTable.length > 0) {
          console.log(`  Columns in DB but NOT in model: ${extraInDbTable.join(', ')}`);
        }
      }
    }
    
    console.log('\n✅ Comparison complete!\n');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
})();
