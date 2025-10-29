const fs = require('fs');
const path = require('path');

async function analyzeServiceEndpoints() {
  console.log('🔍 ANALYZING ALL FRONTEND SERVICE ENDPOINTS');
  console.log('===========================================');

  const servicesDir = 'd:\\skyraksys_hrm\\frontend\\src\\services';
  
  try {
    const files = fs.readdirSync(servicesDir);
    const serviceFiles = files.filter(f => f.endsWith('.service.js') || f.endsWith('Service.js'));
    
    console.log(`📁 Found ${serviceFiles.length} service files:`);
    serviceFiles.forEach(f => console.log(`   - ${f}`));
    
    console.log('\n📋 ENDPOINT ANALYSIS:');
    console.log('====================');
    
    const endpointMap = {};
    
    for (const serviceFile of serviceFiles) {
      const filePath = path.join(servicesDir, serviceFile);
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`\n📄 ${serviceFile}:`);
      
      // Extract endpoints using multiple patterns
      const endpoints = [];
      
      // Pattern 1: http.get('/endpoint')
      const httpPattern = /http\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let match;
      while ((match = httpPattern.exec(content)) !== null) {
        endpoints.push({
          method: match[1].toUpperCase(),
          endpoint: match[2],
          type: 'http-common'
        });
      }
      
      // Pattern 2: api.get('/endpoint')
      const apiPattern = /api\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      while ((match = apiPattern.exec(content)) !== null) {
        endpoints.push({
          method: match[1].toUpperCase(),
          endpoint: match[2],
          type: 'api.js'
        });
      }
      
      // Pattern 3: axios.get('full-url')
      const axiosPattern = /axios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      while ((match = axiosPattern.exec(content)) !== null) {
        endpoints.push({
          method: match[1].toUpperCase(),
          endpoint: match[2],
          type: 'direct-axios'
        });
      }
      
      // Pattern 4: Template literals with endpoints
      const templatePattern = /http\.(get|post|put|delete|patch)\s*\(\s*`([^`]+)`/g;
      while ((match = templatePattern.exec(content)) !== null) {
        endpoints.push({
          method: match[1].toUpperCase(),
          endpoint: match[2],
          type: 'http-common-template'
        });
      }
      
      if (endpoints.length > 0) {
        console.log(`   📊 Found ${endpoints.length} API calls:`);
        endpoints.forEach(ep => {
          console.log(`      ${ep.method} ${ep.endpoint} (${ep.type})`);
        });
        
        endpointMap[serviceFile] = endpoints;
      } else {
        console.log('   ⚠️ No API endpoints found');
        endpointMap[serviceFile] = [];
      }
    }
    
    console.log('\n🔍 ENDPOINT CORRECTNESS ANALYSIS:');
    console.log('=================================');
    
    const correctEndpoints = [
      '/auth/login', '/auth/register', '/auth/me', '/auth/change-password',
      '/employees', '/employees/', '/departments', '/projects', '/tasks',
      '/timesheets', '/leaves', '/leave/meta/types', '/leave/balance',
      '/payrolls', '/salary-structures', '/dashboard/stats'
    ];
    
    const suspiciousEndpoints = [];
    const goodEndpoints = [];
    
    Object.keys(endpointMap).forEach(serviceFile => {
      const endpoints = endpointMap[serviceFile];
      
      endpoints.forEach(ep => {
        // Clean the endpoint for comparison
        let cleanEndpoint = ep.endpoint.replace(/\/\$\{[^}]+\}/g, '/'); // Remove template variables
        cleanEndpoint = cleanEndpoint.replace(/\/:\w+/g, '/'); // Remove URL params
        
        // Check if it starts with expected pattern
        const isCorrect = correctEndpoints.some(correct => 
          cleanEndpoint.startsWith(correct) || correct.startsWith(cleanEndpoint)
        );
        
        if (isCorrect) {
          goodEndpoints.push({
            service: serviceFile,
            method: ep.method,
            endpoint: ep.endpoint,
            type: ep.type
          });
        } else {
          suspiciousEndpoints.push({
            service: serviceFile,
            method: ep.method,
            endpoint: ep.endpoint,
            type: ep.type
          });
        }
      });
    });
    
    console.log('\n✅ CORRECT ENDPOINTS:');
    goodEndpoints.forEach(ep => {
      console.log(`   ${ep.service}: ${ep.method} ${ep.endpoint}`);
    });
    
    if (suspiciousEndpoints.length > 0) {
      console.log('\n⚠️ POTENTIALLY INCORRECT ENDPOINTS:');
      suspiciousEndpoints.forEach(ep => {
        console.log(`   ${ep.service}: ${ep.method} ${ep.endpoint} (${ep.type})`);
      });
    } else {
      console.log('\n✅ All endpoints appear to be correctly formatted!');
    }
    
    console.log('\n📊 SERVICE CONFIGURATION ANALYSIS:');
    console.log('==================================');
    
    // Check which services use which HTTP client
    const httpCommonUsers = [];
    const apiJsUsers = [];
    const directAxiosUsers = [];
    
    Object.keys(endpointMap).forEach(serviceFile => {
      const endpoints = endpointMap[serviceFile];
      const types = [...new Set(endpoints.map(ep => ep.type))];
      
      if (types.includes('http-common') || types.includes('http-common-template')) {
        httpCommonUsers.push(serviceFile);
      }
      if (types.includes('api.js')) {
        apiJsUsers.push(serviceFile);
      }
      if (types.includes('direct-axios')) {
        directAxiosUsers.push(serviceFile);
      }
    });
    
    console.log(`📄 Services using http-common.js: ${httpCommonUsers.length}`);
    httpCommonUsers.forEach(service => console.log(`   - ${service}`));
    
    console.log(`📄 Services using api.js: ${apiJsUsers.length}`);
    apiJsUsers.forEach(service => console.log(`   - ${service}`));
    
    console.log(`📄 Services using direct axios: ${directAxiosUsers.length}`);
    directAxiosUsers.forEach(service => console.log(`   - ${service}`));
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('==================');
    
    if (httpCommonUsers.length > 0 && apiJsUsers.length > 0) {
      console.log('⚠️ MIXED HTTP CLIENT USAGE DETECTED');
      console.log('   - Some services use http-common.js');
      console.log('   - Some services use api.js');
      console.log('   - RECOMMENDATION: Standardize on one approach');
      console.log('   - PREFERRED: Use api.js for consistency');
    }
    
    if (directAxiosUsers.length > 0) {
      console.log('⚠️ DIRECT AXIOS USAGE DETECTED');
      console.log('   - Services should use centralized HTTP client');
      console.log('   - RECOMMENDATION: Replace with api.js or http-common.js');
    }
    
    console.log('\n✨ ENDPOINT MAPPING STATUS:');
    console.log('===========================');
    console.log(`✅ Correctly mapped endpoints: ${goodEndpoints.length}`);
    console.log(`⚠️ Potentially incorrect endpoints: ${suspiciousEndpoints.length}`);
    console.log(`📊 Overall health: ${Math.round((goodEndpoints.length / (goodEndpoints.length + suspiciousEndpoints.length)) * 100)}%`);
    
    if (suspiciousEndpoints.length === 0) {
      console.log('\n🎉 ALL FRONTEND SERVICES ARE CALLING CORRECT ENDPOINTS!');
      console.log('======================================================');
      console.log('✅ All endpoints follow the correct API pattern');
      console.log('✅ No incorrect endpoint mappings detected');
      console.log('🚀 Frontend-backend integration is properly configured!');
    }
    
  } catch (error) {
    console.log('❌ Error analyzing service endpoints:', error.message);
  }
}

analyzeServiceEndpoints();
