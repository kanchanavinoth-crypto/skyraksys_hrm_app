const { Pool } = require('pg');

const pool = new Pool({
  user: 'hrm_admin',
  host: 'localhost',
  database: 'skyraksys_hrm',
  password: 'hrm_secure_2024',
  port: 5433,
});

async function checkAvailableUsers() {
  try {
    console.log('👥 Checking available users...\n');
    
    const userQuery = `
      SELECT 
        u.id,
        u.email,
        u.role,
        u."firstName",
        u."lastName",
        u."isActive",
        e.id as employee_id
      FROM users u
      LEFT JOIN employees e ON u.id = e."userId"
      WHERE u."deletedAt" IS NULL
      ORDER BY u.email;
    `;
    
    const result = await pool.query(userQuery);
    
    console.log(`✅ Found ${result.rows.length} users:`);
    console.log('=====================================');
    
    result.rows.forEach(user => {
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.firstName} ${user.lastName}`);
      console.log(`🔐 Role: ${user.role}`);
      console.log(`✅ Active: ${user.isActive}`);
      console.log(`👤 Employee ID: ${user.employee_id || 'N/A'}`);
      console.log('---');
    });
    
    console.log('\n💡 Use any of these emails with password "password123" for testing');
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await pool.end();
  }
}

checkAvailableUsers();