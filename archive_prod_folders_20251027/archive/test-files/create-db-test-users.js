#!/usr/bin/env node

/**
 * Direct Database User Creation for Integration Tests
 */

require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'skyraksys_hrm',
  user: process.env.DB_USER || 'hrm_admin',
  password: process.env.DB_PASSWORD || 'hrm_secure_2024',
});

async function createTestUsers() {
  console.log('🔧 Creating test users directly in database...');
  
  const testUsers = [
    {
      email: 'admin@skyraksys.com',
      password: 'Admin@123',
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator'
    },
    {
      email: 'hr@skyraksys.com',
      password: 'HR@123',
      role: 'hr',
      firstName: 'HR',
      lastName: 'Manager'
    },
    {
      email: 'emp@skyraksys.com',
      password: 'Emp@123',
      role: 'employee',
      firstName: 'Test',
      lastName: 'Employee'
    }
  ];
  
  try {
    for (const user of testUsers) {
      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );
      
      if (existingUser.rows.length > 0) {
        console.log(`⚠️  User ${user.email} already exists`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Insert user
      const result = await pool.query(`
        INSERT INTO users (email, password, role, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
        RETURNING id, email, role
      `, [user.email, hashedPassword, user.role, user.firstName, user.lastName]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Created ${user.role} user: ${user.email} (ID: ${result.rows[0].id})`);
      }
    }
    
    console.log('\n✅ Test user creation complete!');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    
    if (error.message.includes('relation "users" does not exist')) {
      console.log('\n💡 It looks like the users table doesn\'t exist.');
      console.log('   Try running the database migrations first.');
    }
  } finally {
    await pool.end();
  }
}

createTestUsers().catch(console.error);
