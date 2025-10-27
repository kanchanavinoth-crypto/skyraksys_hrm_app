// Direct bcrypt test to identify the password issue
const bcrypt = require('bcryptjs');

async function testBcryptDirectly() {
  console.log('🔐 Testing bcrypt functionality directly...');
  
  const testPassword = 'TestPassword@123';
  console.log(`Original password: ${testPassword}`);
  
  try {
    // Hash the password
    const hash1 = await bcrypt.hash(testPassword, 12);
    console.log(`Hash 1: ${hash1}`);
    
    // Verify it works
    const verify1 = await bcrypt.compare(testPassword, hash1);
    console.log(`Verification 1: ${verify1 ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Try a different hash of the same password
    const hash2 = await bcrypt.hash(testPassword, 12);
    console.log(`Hash 2: ${hash2}`);
    
    const verify2 = await bcrypt.compare(testPassword, hash2);
    console.log(`Verification 2: ${verify2 ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Test cross verification
    const crossVerify = await bcrypt.compare(testPassword, hash1);
    console.log(`Cross verification: ${crossVerify ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (verify1 && verify2 && crossVerify) {
      console.log('\n✅ bcrypt is working correctly');
      
      // Now test with the exact same process as the backend
      console.log('\n🧪 Testing backend process simulation...');
      
      // Simulate employee creation password hashing
      const backendHash = await bcrypt.hash(testPassword, 12);
      console.log(`Backend simulation hash: ${backendHash}`);
      
      // Simulate login password verification  
      const loginVerification = await bcrypt.compare(testPassword, backendHash);
      console.log(`Login simulation: ${loginVerification ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      if (loginVerification) {
        console.log('\n💡 bcrypt process simulation works fine!');
        console.log('The issue might be elsewhere in the code flow.');
      } else {
        console.log('\n❌ Even simulation fails - bcrypt issue confirmed');
      }
      
    } else {
      console.log('\n❌ bcrypt is not working correctly!');
    }
    
  } catch (error) {
    console.error('❌ bcrypt error:', error.message);
  }
}

testBcryptDirectly();
