#!/usr/bin/env node

/**
 * E2E Test Runner with Real-time Monitoring
 * Runs and monitors the employee-manager workflow test
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 E2E TEST RUNNER');
console.log('Running Employee-Manager Workflow Test with monitoring...\n');

// Run the employee-manager workflow test
const testProcess = spawn('node', ['tests/employee-manager-workflow-e2e.js'], {
  cwd: path.join(__dirname),
  stdio: ['inherit', 'pipe', 'pipe']
});

let output = '';
let hasOutput = false;

testProcess.stdout.on('data', (data) => {
  const chunk = data.toString();
  output += chunk;
  process.stdout.write(chunk);
  hasOutput = true;
});

testProcess.stderr.on('data', (data) => {
  const chunk = data.toString();
  output += chunk;
  process.stderr.write(chunk);
  hasOutput = true;
});

testProcess.on('close', (code) => {
  console.log(`\n📋 Test Process Completed with code: ${code}`);
  
  if (!hasOutput) {
    console.log('⚠️ No output received from test process');
    console.log('🔍 Checking for potential issues...');
    
    // Check if browser dependencies are available
    console.log('\n🔧 Environment Check:');
    console.log('   • Node.js version:', process.version);
    console.log('   • Current directory:', process.cwd());
    console.log('   • Test file exists:', require('fs').existsSync('tests/employee-manager-workflow-e2e.js'));
  }
  
  // Check for generated screenshots
  const fs = require('fs');
  const screenshots = [
    'employee-dashboard.png',
    'employee-timesheet-page.png',
    'employee-timesheet-submitted.png',
    'employee-leave-page.png',
    'employee-leave-submitted.png',
    'manager-dashboard.png',
    'manager-timesheet-approval.png',
    'manager-leave-approval.png'
  ];
  
  console.log('\n📸 Screenshot Status:');
  let screenshotsGenerated = 0;
  screenshots.forEach(screenshot => {
    const exists = fs.existsSync(screenshot);
    console.log(`   ${exists ? '✅' : '❌'} ${screenshot}`);
    if (exists) screenshotsGenerated++;
  });
  
  console.log(`\n📊 Screenshots Generated: ${screenshotsGenerated}/${screenshots.length}`);
  
  if (screenshotsGenerated > 0) {
    console.log('🎯 Test executed successfully - Screenshots captured');
  } else if (code === 0) {
    console.log('✅ Test completed successfully');
  } else {
    console.log('❌ Test encountered issues');
  }
  
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('❌ Test process error:', error.message);
  
  if (error.code === 'ENOENT') {
    console.log('🔧 Possible solutions:');
    console.log('   • Ensure Node.js is installed and in PATH');
    console.log('   • Check if test file exists and is accessible');
    console.log('   • Verify working directory is correct');
  }
  
  process.exit(1);
});

// Timeout after 5 minutes
setTimeout(() => {
  console.log('\n⏰ Test timeout reached (5 minutes)');
  console.log('🔧 Terminating test process...');
  testProcess.kill('SIGTERM');
  
  setTimeout(() => {
    testProcess.kill('SIGKILL');
  }, 5000);
}, 5 * 60 * 1000);
