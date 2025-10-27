const { v4: uuidv4 } = require('uuid');
const { logger } = require('../config/logger');

/**
 * Request Logger Middleware
 * Adds request ID to every request and logs request/response details
 */
const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();
  
  // Add request ID to response headers for client tracking
  res.setHeader('X-Request-ID', req.requestId);
  
  // Log incoming request with structured data
  logger.info('Incoming HTTP request', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.userId || null,
    employeeId: req.employeeId || null,
    userRole: req.userRole || null,
    contentType: req.get('content-type'),
    timestamp: new Date().toISOString()
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[level]('HTTP request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      durationMs: duration,
      userId: req.userId || null,
      employeeId: req.employeeId || null,
      contentLength: res.get('content-length') || 0,
      timestamp: new Date().toISOString(),
      slow: duration > 1000 // Flag slow requests
    });
    
    // Log slow requests separately
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        threshold: '1000ms'
      });
    }
  });
  
  next();
};

module.exports = requestLogger;
