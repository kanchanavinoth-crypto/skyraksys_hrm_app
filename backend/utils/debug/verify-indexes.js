const db = require('./models');

async function checkIndexes() {
  try {
    const [results] = await db.sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);
    
    console.log('\n📊 Performance Indexes Created:\n');
    let currentTable = '';
    results.forEach(r => {
      if (r.tablename !== currentTable) {
        currentTable = r.tablename;
        console.log(`\n✅ ${r.tablename}:`);
      }
      console.log(`   - ${r.indexname}`);
    });
    
    console.log(`\n🎉 Total indexes: ${results.length}\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkIndexes();
