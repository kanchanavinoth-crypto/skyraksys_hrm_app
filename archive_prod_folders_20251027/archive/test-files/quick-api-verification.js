/**
 * QUICK API ENDPOINT VERIFICATION
 * Tests API endpoints with proper authentication
 */

const http = require('http');

class QuickAPITest {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.token = null;
    }

    async makeRequest(method, endpoint, data = null, useToken = true) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.apiBase);
            const options = {
                hostname: url.hostname,
                port: url.port || 5000,
                path: url.pathname + url.search,
                method: method.toUpperCase(),
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (useToken && this.token) {
                options.headers['Authorization'] = `Bearer ${this.token}`;
            }

            const req = http.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => { responseData += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = responseData ? JSON.parse(responseData) : {};
                        resolve({
                            success: res.statusCode >= 200 && res.statusCode < 300,
                            status: res.statusCode,
                            data: parsed
                        });
                    } catch (error) {
                        resolve({
                            success: false,
                            status: res.statusCode,
                            data: { message: 'Invalid JSON response', raw: responseData }
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    async testLogin() {
        console.log('🔐 Testing Login...');
        
        const credentials = {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        };

        try {
            const response = await this.makeRequest('POST', '/auth/login', credentials, false);
            console.log(`   Status: ${response.status}`);
            console.log(`   Success: ${response.success}`);
            
            if (response.success && response.data.data && response.data.data.accessToken) {
                this.token = response.data.data.accessToken;
                console.log(`   ✅ Login successful! Token received.`);
                return true;
            } else {
                console.log(`   ❌ Login failed: ${response.data.message}`);
                return false;
            }
        } catch (error) {
            console.log(`   ❌ Login error: ${error.message}`);
            return false;
        }
    }

    async testEndpoints() {
        console.log('\n📡 Testing API Endpoints...');
        
        const endpoints = [
            { path: '/employees', name: 'Employees' },
            { path: '/leaves', name: 'Leave Requests' },
            { path: '/timesheets', name: 'Timesheets' },
            { path: '/projects', name: 'Projects' },
            { path: '/payroll', name: 'Payroll' },
            { path: '/dashboard/stats', name: 'Dashboard Stats' }
        ];

        let successCount = 0;
        
        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest('GET', endpoint.path);
                const status = response.success ? '✅' : '❌';
                console.log(`   ${status} ${endpoint.name}: ${response.status} - ${response.success ? 'OK' : response.data.message}`);
                
                if (response.success) {
                    successCount++;
                }
            } catch (error) {
                console.log(`   ❌ ${endpoint.name}: Error - ${error.message}`);
            }
        }

        console.log(`\n📊 Results: ${successCount}/${endpoints.length} endpoints working`);
        return successCount === endpoints.length;
    }

    async runQuickTest() {
        console.log('⚡ QUICK API VERIFICATION TEST');
        console.log('=' .repeat(50));
        
        const loginSuccess = await this.testLogin();
        
        if (loginSuccess) {
            const endpointsWorking = await this.testEndpoints();
            
            console.log('\n🎯 QUICK TEST SUMMARY:');
            console.log(`   Authentication: ${loginSuccess ? 'WORKING' : 'FAILED'}`);
            console.log(`   API Endpoints: ${endpointsWorking ? 'WORKING' : 'SOME ISSUES'}`);
            
            if (loginSuccess && endpointsWorking) {
                console.log('   ✅ API is fully functional!');
                return true;
            } else {
                console.log('   ⚠️  API has some issues but is partially working');
                return false;
            }
        } else {
            console.log('\n❌ Cannot test endpoints without authentication');
            return false;
        }
    }
}

// Run the quick test
if (require.main === module) {
    const tester = new QuickAPITest();
    tester.runQuickTest()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Error:', error.message);
            process.exit(1);
        });
}

module.exports = QuickAPITest;
