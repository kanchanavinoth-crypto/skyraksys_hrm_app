const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('skyraksys_hrm', 'hrm_admin', 'hrm_secure_2024', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgres',
  logging: false
});

async function checkPositions() {
  try {
    // Check table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'positions' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Positions table structure:');
    columns.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    
    // Check existing data
    const [existing] = await sequelize.query('SELECT * FROM positions LIMIT 3');
    console.log('\n📊 Existing positions:');
    existing.forEach((pos, i) => {
      console.log(`  ${i+1}. ID: ${pos.id}, Title: ${pos.title}`);
    });
    
    // Try to insert the missing position with correct structure
    console.log('\n🔧 Inserting missing position...');
    
    await sequelize.query(`
      INSERT INTO positions (id, title, "createdAt", "updatedAt") 
      VALUES ('b8c1f5df-0723-4792-911a-9f88b78d2552', 'Software Developer', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Verify
    const [check] = await sequelize.query(`
      SELECT * FROM positions WHERE id = 'b8c1f5df-0723-4792-911a-9f88b78d2552'
    `);
    
    console.log(`✅ Position check: ${check.length > 0 ? 'EXISTS' : 'MISSING'}`);
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
}

checkPositions();