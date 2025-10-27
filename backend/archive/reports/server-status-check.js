const http = require('http');

// Check various ports
const portsToCheck = [3000, 5000, 8000, 8080];

async function checkPort(port) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/api/health',
            method: 'GET',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            console.log(`✅ Port ${port}: Server responding (${res.statusCode})`);
            resolve({ port, status: 'active', statusCode: res.statusCode });
        });

        req.on('error', (e) => {
            console.log(`❌ Port ${port}: ${e.message}`);
            resolve({ port, status: 'inactive', error: e.message });
        });

        req.on('timeout', () => {
            console.log(`⏰ Port ${port}: Timeout`);
            req.destroy();
            resolve({ port, status: 'timeout' });
        });

        req.end();
    });
}

async function main() {
    console.log('🔍 Checking server status on different ports...\n');
    
    for (const port of portsToCheck) {
        await checkPort(port);
    }
    
    console.log('\n🔍 Checking current VS Code tasks...');
}

main();
