const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

/**
 * 🔍 SkyRakSys HRM Production Health Check
 * =====================================
 * Comprehensive health monitoring script
 */

// Configuration
const CONFIG = {
    backend: {
        host: process.env.BACKEND_HOST || 'localhost',
        port: process.env.BACKEND_PORT || 8080,
        protocol: process.env.BACKEND_PROTOCOL || 'http'
    },
    frontend: {
        host: process.env.FRONTEND_HOST || 'localhost',
        port: process.env.FRONTEND_PORT || 3000,
        protocol: process.env.FRONTEND_PROTOCOL || 'http'
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'skyraksys_hrm_prod'
    },
    ssl: {
        enabled: process.env.SSL_ENABLED === 'true',
        certPath: process.env.SSL_CERT_PATH || 'ssl/cert.pem',
        keyPath: process.env.SSL_KEY_PATH || 'ssl/key.pem'
    }
};

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

// Health check results
const results = {
    backend: { status: 'unknown', message: '', details: {} },
    frontend: { status: 'unknown', message: '', details: {} },
    database: { status: 'unknown', message: '', details: {} },
    ssl: { status: 'unknown', message: '', details: {} },
    disk: { status: 'unknown', message: '', details: {} },
    memory: { status: 'unknown', message: '', details: {} },
    overall: { status: 'unknown', score: 0 }
};

/**
 * Utility functions
 */
function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const client = options.protocol === 'https:' ? https : http;
        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function getSystemInfo() {
    const os = require('os');
    return {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: Math.floor(os.uptime()),
        nodeVersion: process.version,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        loadAverage: os.loadavg()
    };
}

/**
 * Health check functions
 */
async function checkBackend() {
    log('🔍 Checking backend API...', 'cyan');
    
    try {
        const healthResponse = await makeRequest({
            hostname: CONFIG.backend.host,
            port: CONFIG.backend.port,
            path: '/health',
            method: 'GET',
            protocol: `${CONFIG.backend.protocol}:`,
            timeout: 10000
        });

        if (healthResponse.statusCode === 200) {
            const healthData = JSON.parse(healthResponse.data);
            
            // Additional API endpoint checks
            const apiTests = [];
            
            // Test auth endpoint
            try {
                const authResponse = await makeRequest({
                    hostname: CONFIG.backend.host,
                    port: CONFIG.backend.port,
                    path: '/api/auth/status',
                    method: 'GET',
                    protocol: `${CONFIG.backend.protocol}:`
                });
                apiTests.push({ endpoint: '/api/auth/status', status: authResponse.statusCode });
            } catch (error) {
                apiTests.push({ endpoint: '/api/auth/status', status: 'error', error: error.message });
            }

            results.backend = {
                status: 'healthy',
                message: 'Backend API is responding',
                details: {
                    responseTime: healthData.responseTime || 'N/A',
                    timestamp: healthData.timestamp || new Date().toISOString(),
                    apiTests: apiTests,
                    version: healthData.version || 'Unknown'
                }
            };
            
            log('  ✅ Backend API is healthy', 'green');
        } else {
            results.backend = {
                status: 'unhealthy',
                message: `Backend returned status ${healthResponse.statusCode}`,
                details: { statusCode: healthResponse.statusCode }
            };
            log(`  ❌ Backend unhealthy (status: ${healthResponse.statusCode})`, 'red');
        }
    } catch (error) {
        results.backend = {
            status: 'error',
            message: `Backend connection failed: ${error.message}`,
            details: { error: error.message }
        };
        log(`  ❌ Backend error: ${error.message}`, 'red');
    }
}

async function checkFrontend() {
    log('🔍 Checking frontend...', 'cyan');
    
    try {
        const response = await makeRequest({
            hostname: CONFIG.frontend.host,
            port: CONFIG.frontend.port,
            path: '/',
            method: 'GET',
            protocol: `${CONFIG.frontend.protocol}:`,
            timeout: 10000
        });

        if (response.statusCode === 200) {
            const isReactApp = response.data.includes('react') || 
                              response.data.includes('root') ||
                              response.headers['content-type']?.includes('text/html');
            
            results.frontend = {
                status: 'healthy',
                message: 'Frontend is accessible',
                details: {
                    statusCode: response.statusCode,
                    contentType: response.headers['content-type'],
                    isReactApp: isReactApp,
                    responseSize: response.data.length
                }
            };
            
            log('  ✅ Frontend is accessible', 'green');
        } else {
            results.frontend = {
                status: 'unhealthy',
                message: `Frontend returned status ${response.statusCode}`,
                details: { statusCode: response.statusCode }
            };
            log(`  ❌ Frontend unhealthy (status: ${response.statusCode})`, 'red');
        }
    } catch (error) {
        results.frontend = {
            status: 'error',
            message: `Frontend connection failed: ${error.message}`,
            details: { error: error.message }
        };
        log(`  ❌ Frontend error: ${error.message}`, 'red');
    }
}

async function checkDatabase() {
    log('🔍 Checking database connection...', 'cyan');
    
    try {
        // Try to load Sequelize models and test connection
        const modelsPath = path.join(process.cwd(), 'backend', 'models');
        
        if (fs.existsSync(modelsPath)) {
            const { sequelize } = require(modelsPath);
            
            await sequelize.authenticate();
            
            // Get database info
            const [dbResults] = await sequelize.query('SELECT version();');
            const version = dbResults[0]?.version || 'Unknown';
            
            const [sizeResults] = await sequelize.query(`
                SELECT pg_size_pretty(pg_database_size('${CONFIG.database.name}')) as database_size;
            `);
            const dbSize = sizeResults[0]?.database_size || 'Unknown';
            
            // Check table count
            const [tableResults] = await sequelize.query(`
                SELECT count(*) as table_count 
                FROM information_schema.tables 
                WHERE table_schema = 'public';
            `);
            const tableCount = tableResults[0]?.table_count || 0;
            
            results.database = {
                status: 'healthy',
                message: 'Database connection successful',
                details: {
                    version: version,
                    size: dbSize,
                    tableCount: parseInt(tableCount),
                    host: CONFIG.database.host,
                    port: CONFIG.database.port,
                    database: CONFIG.database.name
                }
            };
            
            log('  ✅ Database connection healthy', 'green');
        } else {
            throw new Error('Backend models not found');
        }
    } catch (error) {
        results.database = {
            status: 'error',
            message: `Database connection failed: ${error.message}`,
            details: { error: error.message }
        };
        log(`  ❌ Database error: ${error.message}`, 'red');
    }
}

async function checkSSL() {
    log('🔍 Checking SSL certificates...', 'cyan');
    
    if (!CONFIG.ssl.enabled) {
        results.ssl = {
            status: 'disabled',
            message: 'SSL is disabled',
            details: { enabled: false }
        };
        log('  ⚠️  SSL is disabled', 'yellow');
        return;
    }
    
    try {
        const certPath = path.resolve(CONFIG.ssl.certPath);
        const keyPath = path.resolve(CONFIG.ssl.keyPath);
        
        if (!fs.existsSync(certPath)) {
            throw new Error(`Certificate file not found: ${certPath}`);
        }
        
        if (!fs.existsSync(keyPath)) {
            throw new Error(`Private key file not found: ${keyPath}`);
        }
        
        // Read certificate and get info
        const crypto = require('crypto');
        const certData = fs.readFileSync(certPath, 'utf8');
        
        // Parse certificate (basic check)
        const certInfo = {
            exists: true,
            certPath: certPath,
            keyPath: keyPath,
            fileSize: fs.statSync(certPath).size
        };
        
        // Try to parse certificate details if openssl is available
        try {
            const { execSync } = require('child_process');
            const certDetails = execSync(`openssl x509 -in "${certPath}" -text -noout`, 
                { encoding: 'utf8', timeout: 5000 });
            
            // Extract expiry date
            const expiryMatch = certDetails.match(/Not After : (.+)/);
            if (expiryMatch) {
                const expiryDate = new Date(expiryMatch[1]);
                const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                certInfo.expiryDate = expiryDate.toISOString();
                certInfo.daysUntilExpiry = daysUntilExpiry;
                certInfo.isExpiringSoon = daysUntilExpiry < 30;
            }
            
            // Extract subject
            const subjectMatch = certDetails.match(/Subject: (.+)/);
            if (subjectMatch) {
                certInfo.subject = subjectMatch[1].trim();
            }
        } catch (opensslError) {
            certInfo.opensslError = 'Could not parse certificate details';
        }
        
        results.ssl = {
            status: certInfo.isExpiringSoon ? 'warning' : 'healthy',
            message: certInfo.isExpiringSoon ? 
                `SSL certificate expires in ${certInfo.daysUntilExpiry} days` : 
                'SSL certificates are valid',
            details: certInfo
        };
        
        if (certInfo.isExpiringSoon) {
            log(`  ⚠️  SSL certificate expires in ${certInfo.daysUntilExpiry} days`, 'yellow');
        } else {
            log('  ✅ SSL certificates are valid', 'green');
        }
    } catch (error) {
        results.ssl = {
            status: 'error',
            message: `SSL check failed: ${error.message}`,
            details: { error: error.message }
        };
        log(`  ❌ SSL error: ${error.message}`, 'red');
    }
}

async function checkDiskSpace() {
    log('🔍 Checking disk space...', 'cyan');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Check current directory disk usage
        const stats = fs.statSync(process.cwd());
        
        // For Windows, try to get disk space info
        let diskInfo = {};
        
        if (process.platform === 'win32') {
            try {
                const { execSync } = require('child_process');
                const drive = process.cwd().split(':')[0] + ':';
                const output = execSync(`fsutil volume diskfree ${drive}`, { encoding: 'utf8' });
                
                const lines = output.split('\n');
                const freeBytes = parseInt(lines[0]?.match(/\d+/)?.[0] || '0');
                const totalBytes = parseInt(lines[1]?.match(/\d+/)?.[0] || '0');
                const usedBytes = totalBytes - freeBytes;
                
                diskInfo = {
                    total: totalBytes,
                    free: freeBytes,
                    used: usedBytes,
                    usedPercent: totalBytes > 0 ? (usedBytes / totalBytes * 100) : 0
                };
            } catch (error) {
                diskInfo.error = 'Could not get disk space info';
            }
        } else {
            // For Unix systems
            try {
                const { execSync } = require('child_process');
                const output = execSync('df -B1 .', { encoding: 'utf8' });
                const lines = output.split('\n');
                const data = lines[1]?.split(/\s+/) || [];
                
                diskInfo = {
                    total: parseInt(data[1]) || 0,
                    used: parseInt(data[2]) || 0,
                    free: parseInt(data[3]) || 0,
                    usedPercent: parseInt(data[4]?.replace('%', '')) || 0
                };
            } catch (error) {
                diskInfo.error = 'Could not get disk space info';
            }
        }
        
        const warningThreshold = 80;
        const criticalThreshold = 90;
        
        let status = 'healthy';
        let message = 'Disk space is adequate';
        
        if (diskInfo.usedPercent > criticalThreshold) {
            status = 'critical';
            message = `Disk usage critical: ${diskInfo.usedPercent.toFixed(1)}%`;
        } else if (diskInfo.usedPercent > warningThreshold) {
            status = 'warning';
            message = `Disk usage high: ${diskInfo.usedPercent.toFixed(1)}%`;
        }
        
        results.disk = {
            status: status,
            message: message,
            details: {
                total: formatBytes(diskInfo.total),
                used: formatBytes(diskInfo.used),
                free: formatBytes(diskInfo.free),
                usedPercent: diskInfo.usedPercent.toFixed(1) + '%',
                path: process.cwd()
            }
        };
        
        if (status === 'critical') {
            log(`  ❌ ${message}`, 'red');
        } else if (status === 'warning') {
            log(`  ⚠️  ${message}`, 'yellow');
        } else {
            log('  ✅ Disk space is adequate', 'green');
        }
    } catch (error) {
        results.disk = {
            status: 'error',
            message: `Disk check failed: ${error.message}`,
            details: { error: error.message }
        };
        log(`  ❌ Disk check error: ${error.message}`, 'red');
    }
}

async function checkMemory() {
    log('🔍 Checking memory usage...', 'cyan');
    
    try {
        const os = require('os');
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const usedPercent = (usedMemory / totalMemory) * 100;
        
        // Process memory usage
        const processMemory = process.memoryUsage();
        
        const warningThreshold = 80;
        const criticalThreshold = 90;
        
        let status = 'healthy';
        let message = 'Memory usage is normal';
        
        if (usedPercent > criticalThreshold) {
            status = 'critical';
            message = `Memory usage critical: ${usedPercent.toFixed(1)}%`;
        } else if (usedPercent > warningThreshold) {
            status = 'warning';
            message = `Memory usage high: ${usedPercent.toFixed(1)}%`;
        }
        
        results.memory = {
            status: status,
            message: message,
            details: {
                system: {
                    total: formatBytes(totalMemory),
                    used: formatBytes(usedMemory),
                    free: formatBytes(freeMemory),
                    usedPercent: usedPercent.toFixed(1) + '%'
                },
                process: {
                    rss: formatBytes(processMemory.rss),
                    heapUsed: formatBytes(processMemory.heapUsed),
                    heapTotal: formatBytes(processMemory.heapTotal),
                    external: formatBytes(processMemory.external)
                }
            }
        };
        
        if (status === 'critical') {
            log(`  ❌ ${message}`, 'red');
        } else if (status === 'warning') {
            log(`  ⚠️  ${message}`, 'yellow');
        } else {
            log('  ✅ Memory usage is normal', 'green');
        }
    } catch (error) {
        results.memory = {
            status: 'error',
            message: `Memory check failed: ${error.message}`,
            details: { error: error.message }
        };
        log(`  ❌ Memory check error: ${error.message}`, 'red');
    }
}

function calculateOverallHealth() {
    const checks = [results.backend, results.frontend, results.database, results.ssl, results.disk, results.memory];
    const scores = {
        healthy: 100,
        warning: 75,
        disabled: 50,
        unhealthy: 25,
        error: 0,
        unknown: 0
    };
    
    let totalScore = 0;
    let validChecks = 0;
    
    checks.forEach(check => {
        if (check.status !== 'unknown') {
            totalScore += scores[check.status] || 0;
            validChecks++;
        }
    });
    
    const averageScore = validChecks > 0 ? totalScore / validChecks : 0;
    
    let overallStatus = 'error';
    if (averageScore >= 90) overallStatus = 'healthy';
    else if (averageScore >= 70) overallStatus = 'warning';
    else if (averageScore >= 50) overallStatus = 'degraded';
    
    results.overall = {
        status: overallStatus,
        score: Math.round(averageScore),
        totalChecks: validChecks
    };
}

function generateReport() {
    const systemInfo = getSystemInfo();
    
    log('\n' + '='.repeat(60), 'cyan');
    log('🏥 SKYRAKSYS HRM HEALTH REPORT', 'cyan');
    log('='.repeat(60), 'cyan');
    
    log(`\n📊 Overall Health: ${results.overall.score}% (${results.overall.status.toUpperCase()})`, 
        results.overall.status === 'healthy' ? 'green' : 
        results.overall.status === 'warning' ? 'yellow' : 'red');
    
    log(`📅 Report Time: ${new Date().toLocaleString()}`, 'white');
    log(`🖥️  System: ${systemInfo.platform} ${systemInfo.arch} (${systemInfo.hostname})`, 'white');
    log(`⏱️  Uptime: ${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m`, 'white');
    log(`🔧 Node.js: ${systemInfo.nodeVersion}`, 'white');
    
    log('\n📋 COMPONENT STATUS:', 'cyan');
    log('-'.repeat(40), 'cyan');
    
    const components = [
        { name: 'Backend API', result: results.backend },
        { name: 'Frontend', result: results.frontend },
        { name: 'Database', result: results.database },
        { name: 'SSL/TLS', result: results.ssl },
        { name: 'Disk Space', result: results.disk },
        { name: 'Memory', result: results.memory }
    ];
    
    components.forEach(component => {
        const status = component.result.status;
        const icon = status === 'healthy' ? '✅' : 
                    status === 'warning' ? '⚠️' : 
                    status === 'disabled' ? '⏸️' : '❌';
        const color = status === 'healthy' ? 'green' : 
                     status === 'warning' ? 'yellow' : 
                     status === 'disabled' ? 'cyan' : 'red';
        
        log(`${icon} ${component.name}: ${component.result.message}`, color);
        
        // Show important details
        if (component.result.details) {
            const details = component.result.details;
            if (details.version) log(`   Version: ${details.version}`, 'white');
            if (details.responseTime) log(`   Response Time: ${details.responseTime}`, 'white');
            if (details.usedPercent) log(`   Usage: ${details.usedPercent}`, 'white');
            if (details.daysUntilExpiry !== undefined) {
                log(`   Expires in: ${details.daysUntilExpiry} days`, 'white');
            }
        }
    });
    
    // Recommendations
    log('\n💡 RECOMMENDATIONS:', 'yellow');
    log('-'.repeat(40), 'yellow');
    
    const recommendations = [];
    
    if (results.backend.status === 'error') {
        recommendations.push('🔧 Check backend server logs and restart if necessary');
    }
    
    if (results.database.status === 'error') {
        recommendations.push('🗄️ Verify database connection and PostgreSQL service');
    }
    
    if (results.ssl.status === 'warning') {
        recommendations.push('🔒 SSL certificate is expiring soon - renew it');
    }
    
    if (results.disk.status === 'warning' || results.disk.status === 'critical') {
        recommendations.push('💾 Free up disk space or expand storage');
    }
    
    if (results.memory.status === 'warning' || results.memory.status === 'critical') {
        recommendations.push('🧠 Optimize memory usage or increase system RAM');
    }
    
    if (recommendations.length === 0) {
        log('✨ All systems are running optimally!', 'green');
    } else {
        recommendations.forEach(rec => log(rec, 'yellow'));
    }
    
    log('\n📞 SUPPORT:', 'cyan');
    log('-'.repeat(40), 'cyan');
    log('📧 Email: support@skyraksys.com', 'white');
    log('📖 Docs: docs/PRODUCTION_SETUP_GUIDE.md', 'white');
    log('🐛 Issues: https://github.com/skyraksys/hrm-system/issues', 'white');
    
    log('\n' + '='.repeat(60), 'cyan');
}

function saveReport() {
    const reportData = {
        timestamp: new Date().toISOString(),
        overall: results.overall,
        components: {
            backend: results.backend,
            frontend: results.frontend,
            database: results.database,
            ssl: results.ssl,
            disk: results.disk,
            memory: results.memory
        },
        system: getSystemInfo()
    };
    
    // Save JSON report
    const reportsDir = path.join(process.cwd(), 'logs', 'health-reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const filename = `health-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
    log(`\n💾 Report saved: ${filepath}`, 'cyan');
    
    return { reportData, filepath };
}

/**
 * Main health check function
 */
async function runHealthCheck() {
    log('🏥 Starting SkyRakSys HRM Health Check...', 'cyan');
    log('='.repeat(50), 'cyan');
    
    const startTime = Date.now();
    
    // Run all health checks
    await Promise.all([
        checkBackend(),
        checkFrontend(),
        checkDatabase(),
        checkSSL(),
        checkDiskSpace(),
        checkMemory()
    ]);
    
    // Calculate overall health
    calculateOverallHealth();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    log(`\n⏱️  Health check completed in ${duration}ms`, 'cyan');
    
    // Generate and display report
    generateReport();
    
    // Save report
    const { reportData, filepath } = saveReport();
    
    // Exit with appropriate code
    const exitCode = results.overall.status === 'healthy' ? 0 : 
                    results.overall.status === 'warning' ? 1 : 2;
    
    return {
        exitCode,
        results,
        reportData,
        filepath,
        duration
    };
}

// Run health check if called directly
if (require.main === module) {
    runHealthCheck()
        .then(({ exitCode }) => {
            process.exit(exitCode);
        })
        .catch(error => {
            log(`\n❌ Health check failed: ${error.message}`, 'red');
            console.error(error);
            process.exit(2);
        });
}

module.exports = {
    runHealthCheck,
    results,
    CONFIG
};
