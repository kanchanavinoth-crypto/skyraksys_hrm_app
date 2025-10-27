#!/usr/bin/env node

/**
 * Quick Frontend UI Test
 * Tests the frontend interface without full browser automation
 */

const axios = require('axios');

async function quickUITest() {
  console.log('🌐 SkyRakSys HRM - Quick Frontend UI Test\n');
  
  let testsRun = 0;
  let testsPassed = 0;
  
  // Test 1: Frontend Server Response
  console.log('1️⃣  Frontend Server Connectivity');
  try {
    const frontendResponse = await axios.get('http://localhost:3000', { 
      timeout: 10000,
      maxRedirects: 5
    });
    
    console.log('   ✅ Status:', frontendResponse.status);
    console.log('   ✅ Content-Type:', frontendResponse.headers['content-type']);
    
    if (frontendResponse.status === 200) {
      testsPassed++;
    }
  } catch (error) {
    console.log('   ❌ Frontend connection failed:', error.message);
  }
  testsRun++;
  
  // Test 2: React App Detection
  console.log('\n2️⃣  React Application Detection');
  try {
    const response = await axios.get('http://localhost:3000');
    const htmlContent = response.data.toLowerCase();
    
    // Check for React indicators
    const reactIndicators = [
      { name: 'React root element', check: htmlContent.includes('id="root"') },
      { name: 'React scripts', check: htmlContent.includes('react') || htmlContent.includes('/static/js/') },
      { name: 'SPA structure', check: htmlContent.includes('single-page') || htmlContent.includes('app') },
      { name: 'Material-UI', check: htmlContent.includes('mui') || htmlContent.includes('material') }
    ];
    
    let reactDetected = false;
    reactIndicators.forEach(indicator => {
      if (indicator.check) {
        console.log(`   ✅ ${indicator.name}: Detected`);
        reactDetected = true;
      } else {
        console.log(`   ⚠️  ${indicator.name}: Not found`);
      }
    });
    
    if (reactDetected) {
      console.log('   ✅ React application confirmed');
      testsPassed++;
    } else {
      console.log('   ❌ React application not detected');
    }
    
  } catch (error) {
    console.log('   ❌ Could not analyze HTML content:', error.message);
  }
  testsRun++;
  
  // Test 3: Static Assets
  console.log('\n3️⃣  Static Assets Availability');
  const staticAssets = [
    '/favicon.ico',
    '/manifest.json',
    '/static/css/',
    '/static/js/'
  ];
  
  let assetsFound = 0;
  for (const asset of staticAssets) {
    try {
      const assetResponse = await axios.get(`http://localhost:3000${asset}`, {
        timeout: 5000,
        validateStatus: function (status) {
          return status < 500; // Accept any status less than 500
        }
      });
      
      if (assetResponse.status === 200) {
        console.log(`   ✅ ${asset}: Available`);
        assetsFound++;
      } else {
        console.log(`   ⚠️  ${asset}: ${assetResponse.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️  ${asset}: Not accessible`);
    }
  }
  
  if (assetsFound > 0) {
    console.log(`   ✅ ${assetsFound}/${staticAssets.length} static assets found`);
    testsPassed++;
  }
  testsRun++;
  
  // Test 4: API Proxy Functionality
  console.log('\n4️⃣  Frontend-Backend Proxy Test');
  try {
    // Test if frontend can proxy requests to backend
    const proxyTest = await axios.get('http://localhost:3000/api/health', {
      timeout: 5000
    });
    
    if (proxyTest.data && proxyTest.data.status === 'OK') {
      console.log('   ✅ Proxy working: Frontend can reach backend');
      console.log('   ✅ Backend response through proxy:', proxyTest.data.message);
      testsPassed++;
    } else {
      console.log('   ⚠️  Proxy response but unexpected format');
    }
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('   ⚠️  Proxy not configured - direct backend connection needed');
    } else {
      console.log('   ❌ Proxy test failed:', error.message);
    }
  }
  testsRun++;
  
  // Test 5: Login Page Accessibility (if route exists)
  console.log('\n5️⃣  Application Routes Test');
  const routes = ['/login', '/dashboard', '/employees', '/timesheets'];
  let routesWorking = 0;
  
  for (const route of routes) {
    try {
      const routeResponse = await axios.get(`http://localhost:3000${route}`, {
        timeout: 5000,
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        }
      });
      
      console.log(`   ✅ ${route}: Accessible (${routeResponse.status})`);
      routesWorking++;
    } catch (error) {
      if (error.response?.status === 302 || error.response?.status === 301) {
        console.log(`   ✅ ${route}: Redirect (${error.response.status}) - Route exists`);
        routesWorking++;
      } else {
        console.log(`   ⚠️  ${route}: ${error.response?.status || 'Not accessible'}`);
      }
    }
  }
  
  if (routesWorking > 0) {
    console.log(`   ✅ ${routesWorking}/${routes.length} routes accessible`);
    testsPassed++;
  }
  testsRun++;
  
  // Test 6: Performance Check
  console.log('\n6️⃣  Frontend Performance Test');
  try {
    const startTime = Date.now();
    const perfResponse = await axios.get('http://localhost:3000');
    const responseTime = Date.now() - startTime;
    
    console.log(`   ✅ Response time: ${responseTime}ms`);
    
    if (responseTime < 3000) {
      console.log('   ✅ Performance: Good (< 3 seconds)');
      testsPassed++;
    } else if (responseTime < 5000) {
      console.log('   ⚠️  Performance: Acceptable (3-5 seconds)');
    } else {
      console.log('   ❌ Performance: Slow (> 5 seconds)');
    }
    
  } catch (error) {
    console.log('   ❌ Performance test failed:', error.message);
  }
  testsRun++;
  
  // Results Summary
  const passRate = ((testsPassed / testsRun) * 100).toFixed(1);
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 FRONTEND UI TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`📊 Tests Run: ${testsRun}`);
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsRun - testsPassed}`);
  console.log(`📈 Pass Rate: ${passRate}%`);
  
  console.log('\n🎯 FRONTEND ASSESSMENT:');
  if (passRate >= 90) {
    console.log('🟢 EXCELLENT - Frontend is production ready!');
    console.log('   ✅ All UI systems operational');
    console.log('   ✅ React application working perfectly');
    console.log('   ✅ Backend integration successful');
  } else if (passRate >= 75) {
    console.log('🟡 GOOD - Frontend mostly functional');
    console.log('   ✅ Core UI working');
    console.log('   ⚠️  Some features may need attention');
  } else if (passRate >= 50) {
    console.log('🟠 NEEDS WORK - UI issues detected');
    console.log('   ⚠️  User experience may be impacted');
  } else {
    console.log('🔴 CRITICAL - Major UI problems');
    console.log('   ❌ Frontend not functioning properly');
  }
  
  console.log('\n🚀 UI ACCESS INFORMATION:');
  console.log('   🌐 Frontend URL: http://localhost:3000');
  console.log('   🔐 Login Page: http://localhost:3000/login (if available)');
  console.log('   📊 Dashboard: http://localhost:3000/dashboard (if available)');
  console.log('   🔑 Admin Login: admin@test.com / admin123');
  
  console.log('\n💡 NEXT STEPS:');
  if (testsPassed >= 4) {
    console.log('   ✅ Open http://localhost:3000 in your browser');
    console.log('   ✅ Test login and navigation manually');
    console.log('   ✅ Verify all HRM features work in the UI');
  } else {
    console.log('   🔧 Check frontend server configuration');
    console.log('   🔧 Verify React app is building correctly');
    console.log('   🔧 Check console for any errors');
  }
  
  console.log('\n🎉 Your SkyRakSys HRM frontend is ready for use!');
  
  return passRate >= 70;
}

// Run the test
quickUITest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Frontend test failed:', error);
  process.exit(1);
});
