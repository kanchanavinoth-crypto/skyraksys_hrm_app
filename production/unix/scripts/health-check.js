const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();

// Database connection pool
let dbPool;

// Initialize database connection
function initializeDatabase() {
    if (fs.existsSync('./backend/.env')) {
        require('dotenv').config({ path: './backend/.env' });
        
        dbPool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'skyraksys_hrm',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }
}

// Health check function
async function performHealthCheck() {
    const status = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        uptime: process.uptime(),
        checks: {
            memory: 'healthy',
            database: 'healthy',
            filesystem: 'healthy',
            backend: 'unknown',
            frontend: 'unknown'
        },
        system: {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            loadAverage: os.loadavg(),
            memory: {
                total: Math.round(os.totalmem() / 1024 / 1024),
                free: Math.round(os.freemem() / 1024 / 1024),
                used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
                percentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
            }
        },
        services: {}
    };

    try {
        // Memory check
        const memoryUsage = process.memoryUsage();
        const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        
        if (memoryUsageMB > 1024) {
            status.checks.memory = 'warning';
        }
        
        status.services.memory = {
            heapUsed: memoryUsageMB,
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024),
            rss: Math.round(memoryUsage.rss / 1024 / 1024)
        };

        // Database check
        if (dbPool) {
            try {
                const client = await dbPool.connect();
                const result = await client.query('SELECT NOW() as current_time');
                client.release();
                
                status.services.database = {
                    connected: true,
                    currentTime: result.rows[0].current_time,
                    totalConnections: dbPool.totalCount,
                    idleConnections: dbPool.idleCount,
                    waitingConnections: dbPool.waitingCount
                };
            } catch (error) {
                status.checks.database = 'error';
                status.services.database = {
                    connected: false,
                    error: error.message
                };
                status.status = 'unhealthy';
            }
        } else {
            status.checks.database = 'warning';
            status.services.database = {
                connected: false,
                error: 'Database not configured'
            };
        }

        // File system check
        try {
            const backendPath = './backend';
            const frontendPath = './frontend/build';
            
            status.services.filesystem = {
                backend: fs.existsSync(backendPath),
                frontend: fs.existsSync(frontendPath),
                uploads: fs.existsSync('./uploads'),
                logs: fs.existsSync('./logs')
            };

            if (!status.services.filesystem.backend || !status.services.filesystem.frontend) {
                status.checks.filesystem = 'error';
                status.status = 'unhealthy';
            }
        } catch (error) {
            status.checks.filesystem = 'error';
            status.services.filesystem = { error: error.message };
            status.status = 'unhealthy';
        }

        // Backend API check
        try {
            const http = require('http');
            const backendResponse = await new Promise((resolve, reject) => {
                const req = http.get('http://localhost:8080/health', { timeout: 5000 }, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        resolve({
                            statusCode: res.statusCode,
                            data: data
                        });
                    });
                });
                
                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Backend health check timeout'));
                });
            });

            if (backendResponse.statusCode === 200) {
                status.checks.backend = 'healthy';
                status.services.backend = {
                    responding: true,
                    statusCode: backendResponse.statusCode,
                    port: 8080
                };
            } else {
                status.checks.backend = 'warning';
                status.services.backend = {
                    responding: false,
                    statusCode: backendResponse.statusCode
                };
            }
        } catch (error) {
            status.checks.backend = 'error';
            status.services.backend = {
                responding: false,
                error: error.message
            };
        }

        // Frontend check
        try {
            const http = require('http');
            const frontendResponse = await new Promise((resolve, reject) => {
                const req = http.get('http://localhost:3000', { timeout: 5000 }, (res) => {
                    resolve({
                        statusCode: res.statusCode
                    });
                });
                
                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Frontend health check timeout'));
                });
            });

            if (frontendResponse.statusCode === 200) {
                status.checks.frontend = 'healthy';
                status.services.frontend = {
                    responding: true,
                    statusCode: frontendResponse.statusCode,
                    port: 3000
                };
            } else {
                status.checks.frontend = 'warning';
                status.services.frontend = {
                    responding: false,
                    statusCode: frontendResponse.statusCode
                };
            }
        } catch (error) {
            status.checks.frontend = 'error';
            status.services.frontend = {
                responding: false,
                error: error.message
            };
        }

        // Overall status determination
        const errorChecks = Object.values(status.checks).filter(check => check === 'error');
        const warningChecks = Object.values(status.checks).filter(check => check === 'warning');
        
        if (errorChecks.length > 0) {
            status.status = 'unhealthy';
        } else if (warningChecks.length > 0) {
            status.status = 'degraded';
        } else {
            status.status = 'healthy';
        }

    } catch (error) {
        status.status = 'error';
        status.error = error.message;
    }

    return status;
}

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const healthStatus = await performHealthCheck();
        
        const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                          healthStatus.status === 'degraded' ? 200 : 503;
        
        res.status(httpStatus).json(healthStatus);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Detailed health check endpoint
app.get('/health/detailed', async (req, res) => {
    try {
        const healthStatus = await performHealthCheck();
        
        // Add more detailed information
        healthStatus.detailed = {
            pid: process.pid,
            ppid: process.ppid,
            uid: process.getuid ? process.getuid() : null,
            gid: process.getgid ? process.getgid() : null,
            cwd: process.cwd(),
            execPath: process.execPath,
            argv: process.argv,
            env: {
                NODE_ENV: process.env.NODE_ENV,
                PORT: process.env.PORT,
                DB_HOST: process.env.DB_HOST,
                DB_NAME: process.env.DB_NAME
            },
            cpus: os.cpus().length,
            hostname: os.hostname(),
            networkInterfaces: os.networkInterfaces()
        };
        
        res.json(healthStatus);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Readiness probe
app.get('/ready', async (req, res) => {
    try {
        const status = { ready: true, checks: {} };
        
        // Check if backend is responding
        try {
            const http = require('http');
            await new Promise((resolve, reject) => {
                const req = http.get('http://localhost:8080/health', { timeout: 3000 }, (res) => {
                    if (res.statusCode === 200) {
                        resolve();
                    } else {
                        reject(new Error(`Backend returned ${res.statusCode}`));
                    }
                });
                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Backend timeout'));
                });
            });
            status.checks.backend = true;
        } catch (error) {
            status.checks.backend = false;
            status.ready = false;
        }
        
        // Check database
        if (dbPool) {
            try {
                const client = await dbPool.connect();
                await client.query('SELECT 1');
                client.release();
                status.checks.database = true;
            } catch (error) {
                status.checks.database = false;
                status.ready = false;
            }
        }
        
        res.status(status.ready ? 200 : 503).json(status);
    } catch (error) {
        res.status(500).json({
            ready: false,
            error: error.message
        });
    }
});

// Liveness probe
app.get('/live', (req, res) => {
    res.json({
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Command line execution
if (require.main === module) {
    initializeDatabase();
    
    const port = process.env.HEALTH_CHECK_PORT || 3001;
    
    if (process.argv.includes('--check')) {
        // Run health check and exit
        performHealthCheck().then(status => {
            console.log(JSON.stringify(status, null, 2));
            
            const exitCode = status.status === 'healthy' ? 0 : 1;
            process.exit(exitCode);
        }).catch(error => {
            console.error('Health check failed:', error.message);
            process.exit(1);
        });
    } else if (process.argv.includes('--server')) {
        // Start health check server
        app.listen(port, () => {
            console.log(`Health check server running on port ${port}`);
            console.log(`Endpoints:`);
            console.log(`  GET /health          - Basic health check`);
            console.log(`  GET /health/detailed - Detailed health check`);
            console.log(`  GET /ready           - Readiness probe`);
            console.log(`  GET /live            - Liveness probe`);
        });
    } else {
        // Default: run health check once
        initializeDatabase();
        performHealthCheck().then(status => {
            // Console output with colors
            const colors = {
                healthy: '\x1b[32m', // green
                warning: '\x1b[33m', // yellow
                error: '\x1b[31m',   // red
                unhealthy: '\x1b[31m', // red
                degraded: '\x1b[33m', // yellow
                reset: '\x1b[0m'
            };
            
            console.log('\n' + colors[status.status] + '━'.repeat(50) + colors.reset);
            console.log(colors[status.status] + `SkyRakSys HRM Health Status: ${status.status.toUpperCase()}` + colors.reset);
            console.log(colors[status.status] + '━'.repeat(50) + colors.reset);
            
            console.log(`\nTimestamp: ${status.timestamp}`);
            console.log(`Uptime: ${Math.round(status.uptime)}s`);
            
            console.log(`\nSystem Information:`);
            console.log(`  Platform: ${status.system.platform} ${status.system.arch}`);
            console.log(`  Node.js: ${status.system.nodeVersion}`);
            console.log(`  Memory: ${status.system.memory.used}MB / ${status.system.memory.total}MB (${status.system.memory.percentage}%)`);
            console.log(`  Load Average: ${status.system.loadAverage.map(l => l.toFixed(2)).join(', ')}`);
            
            console.log(`\nService Checks:`);
            Object.entries(status.checks).forEach(([service, check]) => {
                const color = colors[check] || colors.reset;
                const symbol = check === 'healthy' ? '✓' : check === 'warning' ? '⚠' : '✗';
                console.log(`  ${color}${symbol} ${service}: ${check}${colors.reset}`);
            });
            
            if (status.services.database) {
                console.log(`\nDatabase:`);
                console.log(`  Connected: ${status.services.database.connected}`);
                if (status.services.database.connected) {
                    console.log(`  Active Connections: ${status.services.database.totalConnections || 0}`);
                    console.log(`  Idle Connections: ${status.services.database.idleConnections || 0}`);
                }
            }
            
            console.log(`\nService Status:`);
            if (status.services.backend) {
                const backendColor = status.services.backend.responding ? colors.healthy : colors.error;
                console.log(`  ${backendColor}Backend (8080): ${status.services.backend.responding ? 'Running' : 'Down'}${colors.reset}`);
            }
            if (status.services.frontend) {
                const frontendColor = status.services.frontend.responding ? colors.healthy : colors.error;
                console.log(`  ${frontendColor}Frontend (3000): ${status.services.frontend.responding ? 'Running' : 'Down'}${colors.reset}`);
            }
            
            console.log('\n');
            
            const exitCode = status.status === 'healthy' ? 0 : 1;
            process.exit(exitCode);
        }).catch(error => {
            console.error('Health check failed:', error.message);
            process.exit(1);
        });
    }
}

module.exports = { performHealthCheck, app };
