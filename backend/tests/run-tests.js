const { exec } = require('child_process');
const path = require('path');

async function runTestSuite() {
  console.log('🚀 Starting HRM System Test Suite...\n');
  
  // Check if server is running
  console.log('1. Checking if backend server is running...');
  const serverCheck = await checkServer();
  if (!serverCheck) {
    console.log('❌ Backend server is not running on port 8080');
    console.log('Please start the backend server first: npm start');
    process.exit(1);
  }
  console.log('✅ Backend server is running\n');
  
  // Setup test data
  console.log('2. Setting up comprehensive test data...');
  try {
    await runCommand('node setup-test-data.js');
    console.log('✅ Test data setup complete\n');
  } catch (error) {
    console.log('❌ Failed to setup test data:', error.message);
    process.exit(1);
  }
  
  // Run comprehensive tests
  console.log('3. Running comprehensive test suite...');
  try {
    await runCommand('node comprehensive-test.js');
    console.log('\n✅ Test suite completed successfully!');
  } catch (error) {
    console.log('\n❌ Test suite failed with errors');
    process.exit(1);
  }
}

function checkServer() {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/health',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404); // 404 is ok, means server is running
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr && !error) console.log(stderr);
      
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test suite interrupted by user');
  process.exit(1);
});

// Run the test suite
runTestSuite().catch(error => {
  console.error('\n💥 Critical error:', error.message);
  process.exit(1);
});
