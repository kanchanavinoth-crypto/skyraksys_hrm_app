#!/usr/bin/env node

/**
 * Quick Test User Setup for Integration Tests
 */

const axios = require('axios');
const bcrypt = require('bcryptjs');

const BACKEND_URL = 'http://localhost:8080/api';

async function createTestUsers() {
  console.log('🔧 Creating test users for integration tests...');
  
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
  
  // Try to register each user
  for (const user of testUsers) {
    try {
      const response = await axios.post(`${BACKEND_URL}/auth/register`, {
        email: user.email,
        password: user.password,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      });
      
      if (response.data.success) {
        console.log(`✅ Created ${user.role} user: ${user.email}`);
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`⚠️  User ${user.email} already exists`);
      } else {
        console.log(`❌ Failed to create ${user.email}: ${error.response?.data?.message || error.message}`);
      }
    }
  }
  
  console.log('\n✅ Test user setup complete!');
}

createTestUsers().catch(console.error);
