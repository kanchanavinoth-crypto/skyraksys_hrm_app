/**
 * SIMPLE SALARY STRUCTURE DEBUG TEST
 * Minimal test to identify the exact issue
 */

const http = require('http');

async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, 'http://localhost:5000');
        
        const options = {
            hostname: url.hostname,
            port: url.port || 5000,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
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
                        data: parsed,
                        raw: responseData
                    });
                } catch (error) {
                    resolve({
                        success: false,
                        status: res.statusCode,
                        data: { message: 'Invalid JSON response' },
                        raw: responseData
                    });
                }
            });
        });

        req.on('error', reject);
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

async function debugSalaryStructure() {
    console.log('🔍 SALARY STRUCTURE DEBUG TEST');
    console.log('='.repeat(50));

    try {
        // Step 1: Authenticate
        console.log('1. Authenticating...');
        const authResponse = await makeRequest('/api/auth/login', 'POST', {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });

        if (!authResponse.success) {
            console.log('❌ Authentication failed');
            console.log('Response:', authResponse.raw);
            return;
        }

        const token = authResponse.data.data.accessToken;
        console.log('✅ Authentication successful');

        // Step 2: Get employees
        console.log('\n2. Getting employees...');
        const employeesResponse = await makeRequest('/api/employees', 'GET', null, token);
        
        if (!employeesResponse.success) {
            console.log('❌ Failed to get employees');
            console.log('Response:', employeesResponse.raw);
            return;
        }

        const employees = employeesResponse.data.data || [];
        console.log(`✅ Found ${employees.length} employees`);
        
        if (employees.length === 0) {
            console.log('❌ No employees available for testing');
            return;
        }

        console.log(`Using employee: ${employees[0].firstName} ${employees[0].lastName} (ID: ${employees[0].id})`);

        // Step 3: Test salary structure creation with minimal data
        console.log('\n3. Creating salary structure with minimal data...');
        const minimalData = {
            employeeId: employees[0].id,
            basicSalary: 50000,
            effectiveFrom: '2025-01-01'
        };

        console.log('Sending data:', JSON.stringify(minimalData, null, 2));
        
        const salaryResponse = await makeRequest('/api/salary-structures', 'POST', minimalData, token);
        
        console.log(`\nResponse Status: ${salaryResponse.status}`);
        console.log('Response Body:', salaryResponse.raw);
        
        if (salaryResponse.success) {
            console.log('✅ SUCCESS: Salary structure created!');
        } else {
            console.log('❌ FAILED: Salary structure creation failed');
            
            if (salaryResponse.data.errors) {
                console.log('Validation errors:');
                salaryResponse.data.errors.forEach(error => {
                    console.log(`  - ${error}`);
                });
            }
        }

        // Step 4: Check what salary structures exist
        console.log('\n4. Checking existing salary structures...');
        const listResponse = await makeRequest('/api/salary-structures', 'GET', null, token);
        
        if (listResponse.success) {
            const structures = listResponse.data.data || [];
            console.log(`Found ${structures.length} salary structures`);
            
            if (structures.length > 0) {
                console.log('Latest structure:', JSON.stringify(structures[0], null, 2));
            }
        } else {
            console.log('Failed to list salary structures:', listResponse.raw);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugSalaryStructure();
