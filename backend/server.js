require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const responseTime = require('response-time');
const statusMonitor = require('express-status-monitor');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const { logger, accessLogStream } = require('./config/logger');

const app = express();

// Performance monitoring dashboard - must be before other middleware
app.use(statusMonitor({
  title: 'SkyrakSys HRM - Server Status',
  path: '/status',
  spans: [{
    interval: 1,      // Every second
    retention: 60     // Keep 60 datapoints (1 minute)
  }, {
    interval: 5,      // Every 5 seconds
    retention: 60     // Keep 60 datapoints (5 minutes)
  }, {
    interval: 15,     // Every 15 seconds
    retention: 60     // Keep 60 datapoints (15 minutes)
  }],
  chartVisibility: {
    cpu: true,
    mem: true,
    load: true,
    responseTime: true,
    rps: true,
    statusCodes: true
  },
  healthChecks: [{
    protocol: 'http',
    host: 'localhost',
    path: '/api/health',
    port: process.env.PORT || 5000
  }]
}));

// Response time tracking
app.use(responseTime((req, res, time) => {
  // Log slow requests (>500ms)
  if (time > 500) {
    logger.warn(`Slow request: ${req.method} ${req.url} - ${time.toFixed(2)}ms`);
  }
  
  // Add response time header
  res.setHeader('X-Response-Time', `${time.toFixed(2)}ms`);
}));

// Security middleware
app.use(helmet());

// Trust proxy (needed when behind Nginx/any reverse proxy)
// Enables correct client IP detection (req.ip) for logging and rate limiting
if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
  // Trust the first proxy (e.g., Nginx on the same host 127.0.0.1)
  app.set('trust proxy', 1);
  console.log('🔒 Express trust proxy enabled (trusting first proxy)');
}

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000', // Add this
  'http://localhost:8080', // Admin debug panel
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5000', // Add this
  'http://127.0.0.1:8080', // Admin debug panel
  // Production server IP (HTTP/HTTPS, default ports)
  'http://95.216.14.232',
  'https://95.216.14.232',
  'http://95.216.14.232:3000',
  'http://95.216.14.232:8080',
  'https://95.216.14.232:3000',
  'https://95.216.14.232:8080',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Optional override for troubleshooting
    if (process.env.CORS_ALLOW_ALL === 'true') {
      return callback(null, true);
    }

    // Normalize origin by removing trailing slash for comparison
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

    if (allowedOrigins.indexOf(normalizedOrigin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Set-Cookie'],
  maxAge: 600
}));

// Handle preflight requests
app.options('*', cors());

// Rate limiting (configurable)
if (process.env.RATE_LIMIT_ENABLED === 'true') {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || `${15 * 60 * 1000}`, 10);
  const max = parseInt(process.env.RATE_LIMIT_MAX || '300', 10); // default 300 per 15m
  const generalLimiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
  });
  app.use('/api', generalLimiter);

  // Stricter limiter for auth endpoints if configured
  if (process.env.RATE_LIMIT_AUTH_ENABLED !== 'false') {
    const authWindow = parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000', 10); // 15m
    const authMax = parseInt(process.env.RATE_LIMIT_AUTH_MAX || '20', 10); // 20 login attempts / 15m
    const authLimiter = rateLimit({
      windowMs: authWindow,
      max: authMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
    });
    app.use('/api/auth/', authLimiter);
  }
  console.log(`🛡️  Rate limiting enabled (max=${process.env.RATE_LIMIT_MAX || '300'} per ${(windowMs/60000)}m)`);
}

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware for httpOnly cookies
app.use(cookieParser());

// Request logging middleware (adds request IDs and structured logging)
const requestLogger = require('./middleware/requestLogger');
app.use(requestLogger);

// Logging with Winston and Morgan
if (process.env.NODE_ENV !== 'test') {
  // Morgan for HTTP access logs (written to access.log)
  app.use(morgan('combined', { stream: accessLogStream }));
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
}

// Log application start
logger.info('='.repeat(80));
logger.info('Skyraksys HRM Backend Server Starting...');
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Node Version: ${process.version}`);
logger.info('='.repeat(80));

// Static files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const db = require('./models');

// Test database connection
db.sequelize.authenticate()
  .then(() => {
    try {
      const dialect = db.sequelize.getDialect();
      const cfg = db.sequelize.config || {};
      const host = cfg.host || process.env.DB_HOST || 'localhost';
      const port = cfg.port || process.env.DB_PORT || '5432';
      const database = cfg.database || process.env.DB_NAME || '(unknown_db)';
      const username = cfg.username || process.env.DB_USER || process.env.DB_USERNAME || '(unknown_user)';
      const sslEnabled = !!(cfg.dialectOptions && (cfg.dialectOptions.ssl || cfg.dialectOptions?.sslmode));
      const pool = cfg.pool || {};
      console.log(`✅ Database connection established: ${dialect}://${username}@${host}:${port}/${database}${sslEnabled ? ' (SSL enabled)' : ''}`);
      if (dialect === 'postgres') {
        console.log(`   • Pool: min=${pool.min ?? 0} max=${pool.max ?? 5} acquire=${pool.acquire ?? 60000} idle=${pool.idle ?? 10000}`);
      }
    } catch (infoErr) {
      console.log('✅ Database connection established (details unavailable due to introspection error)', infoErr?.message);
    }
  })
  .catch(err => {
    console.error('❌ Unable to connect to database:', err);
  });

// Demo data seeding utilities
const { seedAllDemoData } = require('./utils/demoSeed');

// Initialize database with demo data (gated)
async function initializeDatabase() {
  try {
    await db.sequelize.sync({ alter: false });
    console.log('✅ Database synchronized successfully (without alter sync)');

    if (process.env.SEED_DEMO_DATA === 'true') {
      console.log('🌱 SEED_DEMO_DATA=true -> seeding demo users, projects, and tasks');
      await seedAllDemoData();
    } else {
      console.log('🌱 SEED_DEMO_DATA not enabled -> skipping demo data seeding');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// Routes
// Health check endpoint (for monitoring and load balancers)
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await db.sequelize.authenticate();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const employeeRoutes = require('./routes/employee.routes');
const departmentRoutes = require('./routes/department.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const positionRoutes = require('./routes/position.routes');
const timesheetRoutes = require('./routes/timesheet.routes');
const leaveRoutes = require('./routes/leave.routes');
const leaveBalanceAdminRoutes = require('./routes/leave-balance-admin.routes');
const payrollRoutes = require('./routes/payroll.routes');
const payslipRoutes = require('./routes/payslipRoutes');
const payslipManagementRoutes = require('./routes/payslip-management.routes'); // Modern payslip management
const payslipTemplateRoutes = require('./routes/payslipTemplateRoutes');
const salaryStructureRoutes = require('./routes/salaryStructureRoutes');
const payrollDataRoutes = require('./routes/payrollDataRoutes');
const dashboardRoutes = require('./routes/dashboard.routes');
const settingsRoutes = require('./routes/settings.routes');
const debugRoutes = require('./routes/debug.routes');
const emailRoutes = require('./routes/email.routes');

// Swagger configuration
const { specs, swaggerOptions } = require('./config/swagger');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/leaves', leaveRoutes); // Alias for frontend compatibility
app.use('/api/admin/leave-balances', leaveBalanceAdminRoutes);
app.use('/api/payrolls', payrollRoutes);
app.use('/api/payroll', payrollRoutes); // Alias for frontend compatibility
// Modern payslip management routes (use this for new system)
app.use('/api/payslips', payslipManagementRoutes);
// Legacy payslip routes (for backward compatibility)
app.use('/api/payslips/legacy', payslipRoutes);
app.use('/api/payslip-templates', payslipTemplateRoutes);
app.use('/api/salary-structures', salaryStructureRoutes);
app.use('/api/payroll-data', payrollDataRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/email', emailRoutes);

// Debug Routes (conditionally enabled for development only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRoutes);
  logger.warn('⚠️  Debug routes enabled (development mode only)');
} else {
  logger.info('🔒 Debug routes disabled in production');
}

// Admin Config Routes (protected)
const adminConfigRoutes = require('./routes/admin-config.routes');
app.use('/api/admin/config', adminConfigRoutes);

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  // Environment-aware base URL for API responses
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? (process.env.API_BASE_URL || `https://${process.env.DOMAIN || req.get('host')}`)
    : `http://localhost:${PORT}`;

  res.json({ 
    status: 'OK', 
    message: 'HRM System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'PostgreSQL',
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT,
    dbName: process.env.DB_NAME,
    documentation: {
      swagger: `${baseUrl}/api/docs`,
      apiDocs: `${baseUrl}/api/docs.json`
    },
    endpoints: {
      auth: '/api/auth/*',
      employees: '/api/employees/*',
      leaves: '/api/leave/*',
      timesheets: '/api/timesheets/*',
      payroll: '/api/payroll/*',
      projects: '/api/projects/*',
      dashboard: '/api/dashboard/*'
    }
  });
});

// Catch-all handler
app.get('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    availableEndpoints: [
      '/api/auth/*',
      '/api/users/*',
      '/api/employees/*',
      '/api/departments/*',
      '/api/projects/*',
      '/api/tasks/*',
      '/api/timesheets/*',
      '/api/leave/*',
      '/api/payrolls/*',
      '/api/salary-structures/*',
      '/api/health'
    ]
  });
});

// Error handling middleware
// First, centralized error logging middleware
const errorLogger = require('./middleware/errorLogger');
const { AppError } = require('./utils/errors');

app.use(errorLogger);

// Then, error response handler
app.use((error, req, res, next) => {
  // Note: Error already logged by errorLogger middleware above
  
  // Handle custom AppError instances (includes ValidationError, NotFoundError, etc.)
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors
    });
  }
  
  // Handle Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }
  
  // Handle Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry detected',
      field: error.errors?.[0]?.path || 'unknown'
    });
  }
  
  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // Default error response
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});


const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

if (require.main === module) {
  // Only start the server if this file is run directly
  initializeDatabase().then(() => {
    const dbInfo = `PostgreSQL (${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME})`;
    
    // Environment-aware base URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.API_BASE_URL || `https://${process.env.DOMAIN || 'localhost'}`)
      : `http://localhost:${PORT}`;
    
    app.listen(PORT, HOST, () => {
      const logMessage = `🚀 HRM System server running on ${HOST}:${PORT}`;
      logger.info(logMessage);
      logger.info(`🌐 API Base URL: ${baseUrl}/api`);
      logger.info(`📚 API Documentation: ${baseUrl}/api/docs`);
      logger.info(`🩺 Health: ${baseUrl}/api/health`);
      logger.info(`💾 Database: ${dbInfo}`);
      
      console.log(logMessage);
      console.log(`🌐 API Base URL: ${baseUrl}/api`);
      console.log(`📚 API Documentation: ${baseUrl}/api/docs`);
      console.log(`🩺 Health: ${baseUrl}/api/health`);
      console.log(`🔍 Health Check: ${baseUrl}/api/health`);
      console.log(`💾 Database: ${dbInfo}`);
      console.log(`🗄️  PostgreSQL-only mode (SQLite permanently disabled)`);
      console.log('\n📖 For comprehensive documentation, visit:');
      console.log(`   - Interactive API Docs: ${baseUrl}/api-docs`);
      console.log(`   - API JSON Schema: ${baseUrl}/api-docs.json`);
      console.log(`   - Developer Guide: ../docs/README.md`);
      
      // Production-specific logs
      if (process.env.NODE_ENV === 'production') {
        console.log('\n🔐 Production Environment Detected');
        console.log(`   - Set API_BASE_URL or DOMAIN environment variable for proper URLs`);
        console.log(`   - Current base URL: ${baseUrl}`);
      }
    });
  });
}

module.exports = app;
