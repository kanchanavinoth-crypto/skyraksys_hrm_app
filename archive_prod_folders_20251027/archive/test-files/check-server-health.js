const http = require('http');

// Simple health check and user info
function checkServerHealth() {
    console.log('🏥 CHECKING SERVER HEALTH');
    console.log('=========================');

    // Test health endpoint
    const healthOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/health',
        method: 'GET'
    };

    const healthReq = http.request(healthOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`\n🔍 Health Check - Status: ${res.statusCode}`);
            try {
                const response = JSON.parse(data);
                console.log(`   Database: ${response.database}`);
                console.log(`   Timestamp: ${response.timestamp}`);
                console.log('   ✅ Server is healthy');
                
                // Now try to get users (without authentication)
                checkPublicEndpoints();
            } catch (e) {
                console.log(`   Response: ${data}`);
            }
        });
    });

    healthReq.on('error', (error) => {
        console.log(`   ❌ Health check failed: ${error.message}`);
    });

    healthReq.end();
}

function checkPublicEndpoints() {
    console.log('\n🔍 CHECKING PUBLIC ENDPOINTS');
    console.log('=============================');
    
    const endpoints = [
        '/api/departments',
        '/api/employees',
        '/api/users'
    ];
    
    endpoints.forEach(endpoint => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: endpoint,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`\n${endpoint} - Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        if (Array.isArray(response)) {
                            console.log(`   Count: ${response.length}`);
                        } else if (response.data && Array.isArray(response.data)) {
                            console.log(`   Count: ${response.data.length}`);
                        }
                    } catch (e) {
                        console.log(`   Response: ${data.substring(0, 100)}...`);
                    }
                } else {
                    console.log(`   Error: ${data}`);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`   ❌ ${endpoint} failed: ${error.message}`);
        });

        req.end();
    });
}

checkServerHealth();
