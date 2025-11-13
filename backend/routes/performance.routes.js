const express = require('express');
const router = express.Router();
const os = require('os');
const process = require('process');
const { authenticateToken } = require('../middleware/auth');

// Role check middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Get server performance metrics (Admin only)
router.get('/server-metrics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // Calculate CPU usage
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();
    
    // Memory usage
    const memUsage = process.memoryUsage();
    
    // Get database connection pool info (if available)
    const db = require('../models');
    let dbMetrics = { status: 'disconnected' };
    
    try {
      // Test database connectivity and measure response time
      const dbStartTime = Date.now();
      await db.sequelize.authenticate();
      const dbResponseTime = Date.now() - dbStartTime;
      
      dbMetrics = {
        status: 'connected',
        responseTime: dbResponseTime,
        dialect: db.sequelize.getDialect(),
        version: db.sequelize.getDatabaseVersion ? await db.sequelize.getDatabaseVersion() : 'unknown'
      };
      
      // Get connection pool stats if available
      if (db.sequelize.connectionManager && db.sequelize.connectionManager.pool) {
        const pool = db.sequelize.connectionManager.pool;
        dbMetrics.connectionPool = {
          total: pool.options.max || 0,
          active: pool.size || 0,
          idle: pool.available || 0,
          waiting: pool.pending || 0
        };
      }
      
      // Get basic table count for health check
      const [results] = await db.sequelize.query(
        "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
      );
      dbMetrics.tableCount = results[0]?.table_count || 0;
      
    } catch (dbError) {
      console.log('Database metrics error:', dbError.message);
      dbMetrics.error = dbError.message;
    }

    // Get additional system info (RHEL-specific)
    let systemInfo = {};
    try {
      const fs = require('fs');
      
      // Try to get OS version (works on RHEL/CentOS)
      try {
        const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
        const versionMatch = osRelease.match(/PRETTY_NAME="(.+)"/);
        systemInfo.osVersion = versionMatch ? versionMatch[1] : 'Unknown';
      } catch (e) {
        systemInfo.osVersion = `${os.platform()} ${os.release()}`;
      }
      
      // Get load average interpretation
      const loadAvgStatus = loadAvg[0] > cpus.length * 0.8 ? 'high' : 
                           loadAvg[0] > cpus.length * 0.5 ? 'moderate' : 'low';
      systemInfo.loadStatus = loadAvgStatus;
      
    } catch (e) {
      console.log('Could not get extended system info:', e.message);
    }

    const metrics = {
      server: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        osVersion: systemInfo.osVersion || `${os.platform()} ${os.release()}`,
        loadStatus: systemInfo.loadStatus || 'unknown'
      },
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        loadAverage: {
          '1min': loadAvg[0],
          '5min': loadAvg[1], 
          '15min': loadAvg[2]
        },
        usage: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      },
      memory: {
        system: {
          total: Math.round(totalMem / 1024 / 1024), // MB
          free: Math.round(freeMem / 1024 / 1024), // MB
          used: Math.round(usedMem / 1024 / 1024), // MB
          usagePercent: Math.round((usedMem / totalMem) * 100)
        },
        process: {
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024) // MB
        }
      },
      database: dbMetrics,
      network: {
        interfaces: Object.keys(os.networkInterfaces()).length,
        interfaceDetails: Object.entries(os.networkInterfaces())
          .filter(([name]) => !name.startsWith('lo')) // Exclude loopback
          .map(([name, addresses]) => ({
            name,
            addresses: addresses.filter(addr => addr.family === 'IPv4').length
          }))
      },
      process: {
        pid: process.pid,
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024) // MB
        },
        cpu: cpuUsage,
        uptime: process.uptime()
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching server metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch server performance metrics',
      error: error.message
    });
  }
});

// Get API performance metrics (Admin only)
router.get('/api-metrics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // In a real application, you would collect these metrics from a monitoring system
    // For now, we'll simulate some basic metrics
    
    const apiMetrics = {
      requests: {
        total: Math.floor(Math.random() * 10000) + 1000,
        successful: Math.floor(Math.random() * 9500) + 950,
        failed: Math.floor(Math.random() * 500) + 50,
        errorRate: (Math.random() * 5).toFixed(2) + '%'
      },
      responseTime: {
        average: Math.floor(Math.random() * 200) + 50, // ms
        p95: Math.floor(Math.random() * 500) + 100, // ms
        p99: Math.floor(Math.random() * 1000) + 200 // ms
      },
      endpoints: [
        { path: '/api/auth/login', calls: Math.floor(Math.random() * 1000), avgTime: Math.floor(Math.random() * 100) + 20 },
        { path: '/api/employees', calls: Math.floor(Math.random() * 800), avgTime: Math.floor(Math.random() * 150) + 30 },
        { path: '/api/timesheet', calls: Math.floor(Math.random() * 600), avgTime: Math.floor(Math.random() * 200) + 40 },
        { path: '/api/leaves', calls: Math.floor(Math.random() * 400), avgTime: Math.floor(Math.random() * 120) + 25 }
      ],
      cache: {
        hitRate: (Math.random() * 40 + 60).toFixed(1) + '%', // 60-100%
        missRate: (Math.random() * 40).toFixed(1) + '%'
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: apiMetrics
    });

  } catch (error) {
    console.error('Error fetching API metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API performance metrics',
      error: error.message
    });
  }
});

// Get basic health metrics (All authenticated users)
router.get('/health-metrics', authenticateToken, async (req, res) => {
  try {
    const metrics = {
      server: {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      database: {
        status: 'connected'
      }
    };

    // Test database connection
    try {
      const db = require('../models');
      await db.sequelize.authenticate();
    } catch (dbError) {
      metrics.database.status = 'disconnected';
      metrics.server.status = 'degraded';
    }

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health metrics',
      error: error.message
    });
  }
});

module.exports = router;