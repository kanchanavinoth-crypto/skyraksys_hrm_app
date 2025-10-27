/**
 * Test the current auth token and check user permissions
 */

const jwt = require('jsonwebtoken');
const authConfig = require('./config/auth.config');

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.log('❌ Usage: node test-auth-token.js <your_access_token>');
  console.log('\n📌 To get your token:');
  console.log('   1. Open browser DevTools (F12)');
  console.log('   2. Go to Application tab > Local Storage');
  console.log('   3. Copy the value of "accessToken"');
  console.log('   4. Run: node test-auth-token.js "your_token_here"');
  process.exit(1);
}

console.log('\n🔍 Analyzing your access token...\n');

try {
  const decoded = jwt.verify(token, authConfig.secret);
  
  console.log('✅ Token is valid!');
  console.log('\n📋 Token Details:');
  console.log('━'.repeat(50));
  console.log('User ID:', decoded.id);
  console.log('Email:', decoded.email);
  console.log('Role:', decoded.role);
  console.log('Employee ID:', decoded.employeeId);
  console.log('Issued At:', new Date(decoded.iat * 1000).toLocaleString());
  console.log('Expires At:', new Date(decoded.exp * 1000).toLocaleString());
  console.log('━'.repeat(50));
  
  console.log('\n🔐 Permissions Check:');
  console.log('━'.repeat(50));
  
  if (decoded.role === 'admin') {
    console.log('✅ ADMIN - Full access to payslip templates');
  } else if (decoded.role === 'hr') {
    console.log('✅ HR - Full access to payslip templates');
  } else if (decoded.role === 'manager') {
    console.log('❌ MANAGER - No access to payslip templates');
    console.log('   → Need admin or hr role');
  } else if (decoded.role === 'employee') {
    console.log('❌ EMPLOYEE - No access to payslip templates');
    console.log('   → Need admin or hr role');
  } else {
    console.log('❌ UNKNOWN ROLE - No access');
  }
  
  console.log('━'.repeat(50));
  
  if (decoded.role !== 'admin' && decoded.role !== 'hr') {
    console.log('\n💡 Solution:');
    console.log('   You need to log in with an admin or hr account to access payslip templates.');
    console.log('\n   Default admin credentials (if they exist):');
    console.log('   Email: admin@skyraksys.com');
    console.log('   Password: admin123');
    console.log('\n   OR');
    console.log('\n   Email: hr@skyraksys.com');
    console.log('   Password: hr123');
  }
  
  process.exit(0);
  
} catch (error) {
  if (error instanceof jwt.TokenExpiredError) {
    console.log('❌ Token has expired!');
    console.log('   Expired at:', new Date(error.expiredAt).toLocaleString());
    console.log('\n💡 Solution: Log in again to get a new token');
  } else if (error instanceof jwt.JsonWebTokenError) {
    console.log('❌ Invalid token!');
    console.log('   Error:', error.message);
    console.log('\n💡 Solution: Make sure you copied the entire token from localStorage');
  } else {
    console.log('❌ Error:', error.message);
  }
  
  process.exit(1);
}
