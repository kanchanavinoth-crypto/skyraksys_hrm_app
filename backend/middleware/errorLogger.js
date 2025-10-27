const { logger } = require('../config/logger');
const LogHelper = require('../utils/logHelper');

/**
 * Error Logger Middleware
 * Logs all unhandled errors with full context
 */
const errorLogger = (err, req, res, next) => {
  // Log the error with full context
  LogHelper.logError(err, {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    userId: req.userId,
    employeeId: req.employeeId,
    userRole: req.userRole,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: req.method !== 'GET' ? LogHelper.sanitize(req.body) : undefined,
    query: req.query,
    params: req.params,
    headers: {
      'content-type': req.get('content-type'),
      'authorization': req.get('authorization') ? 'Bearer ***' : undefined
    }
  }, req);
  
  // Pass error to next error handler
  next(err);
};

module.exports = errorLogger;
