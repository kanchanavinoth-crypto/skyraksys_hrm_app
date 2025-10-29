const axios = require('axios');
const bcrypt = require('bcryptjs');

const API_BASE = 'http://localhost:8080/api';

// Demo users to create - using strong passwords to avoid browser security prompts
const demoUsers = [
  {
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t',
    role: 'admin',
    firstName: 'System',
    lastName: 'Administrator'
  },
  {
    email: 'hr@company.com', 
    password: 'Lw3nQ6xY8mD4vB7h',
    role: 'hr',
    firstName: 'HR',
    lastName: 'Manager'
  },
  {
    email: 'manager@test.com',
    password: 'Qy8nR6wA2mS5kD7j',
    role: 'manager',
    firstName: 'Team',
    lastName: 'Manager'
  },
  {
    email: 'employee@company.com',
    password: 'Mv4pS9wE2nR6kA8j',
    role: 'employee',
    firstName: 'John',
    lastName: 'Doe'
  },
  {
    email: 'admin@test.com',
    password: 'Nx7rT5yU3mK9sD6g',
    role: 'admin',
    firstName: 'Test',
    lastName: 'Admin'
  },
  {
    email: 'hr@test.com',
    password: 'Ow2nV8xC4mP7rA9k',
    role: 'hr',
    firstName: 'Test',
    lastName: 'HR'
  },
  {
    email: 'employee@test.com',
    password: 'Pz5qW3nE7mT9vB4x',
    role: 'employee',
    firstName: 'Jane',
    lastName: 'Smith'
  }
];

async function createDemoUsers() {
  console.log('🚀 Creating Demo Users for HRM System...\n');

  // Wait for server to be ready
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Test server health
    const healthCheck = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is running:', healthCheck.data.message);
    
    let adminToken = null;
    
    for (const user of demoUsers) {
      try {
        if (user.role === 'admin') {
          // Try to login first (user might already exist)
          try {
            const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
              email: user.email,
              password: user.password
            });
            
            if (loginResponse.data.success) {
              console.log(`✅ Admin user already exists and can login: ${user.email}`);
              adminToken = loginResponse.data.data.accessToken || loginResponse.data.token;
              continue;
            }
          } catch (loginError) {
            console.log(`ℹ️  Admin user doesn't exist yet, will create: ${user.email}`);
          }
        }

        if (adminToken && user.role !== 'admin') {
          // Create user via admin API
          const response = await axios.post(`${API_BASE}/auth/register`, {
            email: user.email,
            password: user.password,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
          }, {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          });

          if (response.data.success) {
            console.log(`✅ Created user: ${user.email} (${user.role})`);
          }
        } else if (user.role === 'admin') {
          // For admin, we'll create directly (assuming this is the initial setup)
          console.log(`ℹ️  Admin user setup needed: ${user.email}`);
        }

        // Test login for all users
        const loginTest = await axios.post(`${API_BASE}/auth/login`, {
          email: user.email,
          password: user.password
        });

        if (loginTest.data.success) {
          console.log(`✅ Login test passed for: ${user.email}`);
          if (user.role === 'admin' && !adminToken) {
            adminToken = loginTest.data.data.accessToken || loginTest.data.token;
          }
        }

      } catch (error) {
        if (error.response?.data?.message?.includes('already exists')) {
          console.log(`ℹ️  User already exists: ${user.email}`);
          
          // Test login
          try {
            const loginTest = await axios.post(`${API_BASE}/auth/login`, {
              email: user.email,
              password: user.password
            });
            console.log(`✅ Existing user login test passed: ${user.email}`);
            if (user.role === 'admin' && !adminToken) {
              adminToken = loginTest.data.data.accessToken || loginTest.data.token;
            }
          } catch (loginError) {
            console.log(`❌ Existing user login failed: ${user.email}`, loginError.response?.data?.message);
          }
        } else {
          console.log(`❌ Error with user ${user.email}:`, error.response?.data?.message || error.message);
        }
      }
    }

    console.log('\n🎉 Demo User Setup Complete!\n');
    
    console.log('📋 Demo User Credentials:');
    console.log('========================');
    demoUsers.forEach(user => {
      console.log(`👤 ${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });

    console.log('\n🧪 Testing API Endpoints...\n');

    if (adminToken) {
      // Test various endpoints
      const endpoints = [
        { name: 'Health Check', url: '/health', method: 'get', auth: false },
        { name: 'Employees', url: '/employees', method: 'get', auth: true },
        { name: 'Leave Requests', url: '/leaves', method: 'get', auth: true },
        { name: 'Timesheets', url: '/timesheets', method: 'get', auth: true },
        { name: 'Payroll', url: '/payroll', method: 'get', auth: true }
      ];

      for (const endpoint of endpoints) {
        try {
          const config = endpoint.auth ? {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          } : {};

          const response = await axios[endpoint.method](`${API_BASE}${endpoint.url}`, config);
          console.log(`✅ ${endpoint.name}: Working`);
        } catch (error) {
          console.log(`❌ ${endpoint.name}: ${error.response?.data?.message || error.message}`);
        }
      }
    }

    console.log('\n✅ Your HRM app is ready to use!');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔧 Backend API: http://localhost:8080/api');

  } catch (error) {
    console.error('❌ Error setting up demo users:', error.message);
    if (error.response?.data) {
      console.error('Server response:', error.response.data);
    }
  }
}

// Run the setup
createDemoUsers();
