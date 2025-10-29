/**
 * CLEANUP AND RESET FOR 25+ EMPLOYEE SCALING TEST
 * This script clears test data while preserving essential system data
 */

const http = require('http');

class DatabaseCleanupManager {
    constructor() {
        this.baseURL = 'http://localhost:5000';
        this.token = null;
    }

    // Make HTTP request
    makeRequest(method, path, data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 5000,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.token && { 'Authorization': `Bearer ${this.token}` })
                }
            };

            const req = http.request(options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve({ status: res.statusCode, data: parsed });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: responseData });
                    }
                });
            });

            req.on('error', reject);
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    // Authenticate
    async authenticate() {
        console.log('🔐 Authenticating...');
        const response = await this.makeRequest('POST', '/api/auth/login', {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });

        if (response.status === 200 && (response.data.token || response.data.success)) {
            this.token = response.data.token;
            console.log('   ✅ Authentication successful');
            return true;
        } else {
            console.log('   ❌ Authentication failed');
            return false;
        }
    }

    // Get current data counts
    async getCurrentCounts() {
        console.log('\n📊 CHECKING CURRENT DATA...');
        
        const endpoints = [
            { name: 'Employees', path: '/api/employees' },
            { name: 'Departments', path: '/api/departments' },
            { name: 'Projects', path: '/api/projects' },
            { name: 'Tasks', path: '/api/tasks' },
            { name: 'Timesheets', path: '/api/timesheets' },
            { name: 'Salary Structures', path: '/api/salary-structures' },
            { name: 'Payrolls', path: '/api/payroll' }
        ];

        const counts = {};
        
        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest('GET', endpoint.path);
                if (response.status === 200) {
                    const count = Array.isArray(response.data) ? response.data.length : 
                                 response.data.data ? response.data.data.length : 0;
                    counts[endpoint.name] = count;
                    console.log(`   ${endpoint.name}: ${count}`);
                } else {
                    counts[endpoint.name] = 0;
                    console.log(`   ${endpoint.name}: 0 (endpoint error)`);
                }
            } catch (error) {
                counts[endpoint.name] = 0;
                console.log(`   ${endpoint.name}: 0 (request failed)`);
            }
        }
        
        return counts;
    }

    // Selective cleanup - preserve departments, clean transactional data
    async performSelectiveCleanup() {
        console.log('\n🧹 PERFORMING SELECTIVE CLEANUP...');
        console.log('   📝 Strategy: Preserve departments, clean transactional data');
        
        // Clean in reverse dependency order
        const cleanupOperations = [
            { name: 'Payroll Records', path: '/api/payroll' },
            { name: 'Timesheets', path: '/api/timesheets' },
            { name: 'Tasks', path: '/api/tasks' },
            { name: 'Projects', path: '/api/projects' },
            { name: 'Salary Structures', path: '/api/salary-structures' },
            { name: 'Employees (except admin)', path: '/api/employees' }
        ];

        const results = {};

        for (const operation of cleanupOperations) {
            console.log(`\n   🗑️ Cleaning ${operation.name}...`);
            
            try {
                // Get all items first
                const getResponse = await this.makeRequest('GET', operation.path);
                
                if (getResponse.status === 200) {
                    const items = Array.isArray(getResponse.data) ? getResponse.data : 
                                 getResponse.data.data ? getResponse.data.data : [];
                    
                    let deletedCount = 0;
                    
                    for (const item of items) {
                        // Skip admin user for employees
                        if (operation.path.includes('employees') && 
                            (item.email === 'admin@company.com' || item.role === 'admin')) {
                            continue;
                        }
                        
                        try {
                            const deleteResponse = await this.makeRequest('DELETE', `${operation.path}/${item.id}`);
                            if (deleteResponse.status === 200 || deleteResponse.status === 204) {
                                deletedCount++;
                            }
                        } catch (error) {
                            // Continue with other items
                        }
                    }
                    
                    results[operation.name] = deletedCount;
                    console.log(`      ✅ Deleted ${deletedCount} ${operation.name.toLowerCase()}`);
                } else {
                    results[operation.name] = 0;
                    console.log(`      ⚠️ Could not access ${operation.name.toLowerCase()}`);
                }
                
            } catch (error) {
                results[operation.name] = 0;
                console.log(`      ❌ Failed to clean ${operation.name.toLowerCase()}`);
            }
        }
        
        return results;
    }

    // Generate comprehensive report
    async generateCleanupReport(beforeCounts, afterCounts, cleanupResults) {
        const report = {
            timestamp: new Date().toISOString(),
            cleanup_summary: {
                purpose: "Prepare system for 25+ employee scaling test",
                strategy: "Selective cleanup preserving system structure"
            },
            before_cleanup: beforeCounts,
            after_cleanup: afterCounts,
            cleanup_operations: cleanupResults,
            recommendations: {
                next_steps: [
                    "Run 25+ employee creation test",
                    "Validate payroll generation fixes",
                    "Monitor system performance with large dataset"
                ],
                readiness: "System ready for large-scale employee testing"
            }
        };

        // Save report
        const fs = require('fs');
        fs.writeFileSync('cleanup-and-scaling-report.json', JSON.stringify(report, null, 2));
        
        return report;
    }

    // Main execution
    async runCleanupAndReset() {
        console.log('🎯 DATABASE CLEANUP AND RESET FOR SCALING');
        console.log('==========================================');
        console.log('Preparing system for 25+ employee creation test\n');

        try {
            // Step 1: Authenticate
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Authentication failed');
            }

            // Step 2: Get current state
            const beforeCounts = await this.getCurrentCounts();

            // Step 3: Perform selective cleanup
            const cleanupResults = await this.performSelectiveCleanup();

            // Step 4: Check after cleanup
            console.log('\n📊 VERIFYING CLEANUP...');
            const afterCounts = await this.getCurrentCounts();

            // Step 5: Generate report
            const report = await this.generateCleanupReport(beforeCounts, afterCounts, cleanupResults);

            // Step 6: Display summary
            console.log('\n==========================================');
            console.log('🎯 CLEANUP AND RESET COMPLETE');
            console.log('==========================================');
            console.log('\n✅ SUMMARY:');
            console.log(`   🗑️ Data Cleaned: ${Object.values(cleanupResults).reduce((a, b) => a + b, 0)} items`);
            console.log(`   🏢 Departments Preserved: ${afterCounts['Departments']}`);
            console.log(`   👥 Employees Remaining: ${afterCounts['Employees']} (admin user)`);
            console.log('\n🚀 SYSTEM STATUS: READY FOR 25+ EMPLOYEE SCALING TEST');
            console.log('📄 Detailed report saved: cleanup-and-scaling-report.json');

        } catch (error) {
            console.error('\n❌ CLEANUP FAILED:', error.message);
            process.exit(1);
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const manager = new DatabaseCleanupManager();
    manager.runCleanupAndReset().catch(console.error);
}

module.exports = DatabaseCleanupManager;
