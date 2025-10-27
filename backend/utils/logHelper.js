const { logger } = require('../config/logger');

/**
 * Structured Logging Helper
 * Provides typed logging methods for consistent structured logging across the application
 */
class LogHelper {
  /**
   * Log business events (leave approvals, timesheet submissions, etc.)
   */
  static logBusinessEvent(event, data = {}, req = null) {
    logger.info(`Business Event: ${event}`, {
      event,
      category: 'business',
      timestamp: new Date().toISOString(),
      requestId: req?.requestId,
      userId: req?.userId || data.userId,
      employeeId: req?.employeeId || data.employeeId,
      ...data
    });
  }
  
  /**
   * Log security events (failed logins, unauthorized access, etc.)
   */
  static logSecurityEvent(event, severity = 'medium', data = {}, req = null) {
    const logData = {
      event,
      category: 'security',
      severity,
      timestamp: new Date().toISOString(),
      requestId: req?.requestId,
      ip: req?.ip || data.ip,
      userAgent: req?.get?.('user-agent'),
      userId: req?.userId || data.userId,
      ...data
    };
    
    // Use appropriate log level based on severity
    const logLevel = severity === 'high' || severity === 'critical' ? 'error' : 'warn';
    logger[logLevel](`Security Event: ${event}`, logData);
  }
  
  /**
   * Log authentication events (login, logout, token refresh)
   */
  static logAuthEvent(event, success, data = {}, req = null) {
    const logData = {
      event,
      category: 'authentication',
      success,
      timestamp: new Date().toISOString(),
      requestId: req?.requestId,
      ip: req?.ip || data.ip,
      userAgent: req?.get?.('user-agent'),
      email: data.email,
      userId: data.userId,
      ...data
    };
    
    if (success) {
      logger.info(`Auth Success: ${event}`, logData);
    } else {
      logger.warn(`Auth Failure: ${event}`, logData);
    }
  }
  
  /**
   * Log authorization events (access denied, permission checks)
   */
  static logAuthzEvent(event, allowed, data = {}, req = null) {
    const logData = {
      event,
      category: 'authorization',
      allowed,
      timestamp: new Date().toISOString(),
      requestId: req?.requestId,
      userId: req?.userId || data.userId,
      userRole: req?.userRole || data.userRole,
      resource: data.resource,
      action: data.action,
      ...data
    };
    
    if (allowed) {
      logger.info(`Authz Success: ${event}`, logData);
    } else {
      logger.warn(`Authz Denied: ${event}`, logData);
    }
  }
  
  /**
   * Log data mutations (create, update, delete operations)
   */
  static logDataMutation(action, model, data = {}, req = null) {
    logger.info(`Data Mutation: ${action} ${model}`, {
      action,
      model,
      category: 'data_mutation',
      timestamp: new Date().toISOString(),
      requestId: req?.requestId,
      userId: req?.userId || data.userId,
      employeeId: req?.employeeId || data.employeeId,
      recordId: data.recordId || data.id,
      changes: data.changes,
      oldValues: data.oldValues,
      newValues: data.newValues,
      ...data
    });
  }
  
  /**
   * Log performance metrics (slow queries, high memory usage, etc.)
   */
  static logPerformance(operation, duration, data = {}, req = null) {
    const level = duration > 1000 ? 'warn' : 'debug';
    logger[level](`Performance: ${operation}`, {
      operation,
      category: 'performance',
      duration: `${duration}ms`,
      durationMs: duration,
      timestamp: new Date().toISOString(),
      requestId: req?.requestId,
      slow: duration > 1000,
      threshold: data.threshold || 1000,
      ...data
    });
  }
  
  /**
   * Log database operations
   */
  static logDatabaseOperation(operation, model, data = {}, req = null) {
    logger.debug(`Database Operation: ${operation} ${model}`, {
      operation,
      model,
      category: 'database',
      timestamp: new Date().toISOString(),
      requestId: req?.requestId,
      query: data.query,
      duration: data.duration,
      rowCount: data.rowCount,
      ...data
    });
  }
  
  /**
   * Log external API calls
   */
  static logExternalAPI(service, endpoint, data = {}, req = null) {
    logger.info(`External API Call: ${service} ${endpoint}`, {
      service,
      endpoint,
      category: 'external_api',
      timestamp: new Date().toISOString(),
      requestId: req?.requestId,
      method: data.method,
      statusCode: data.statusCode,
      duration: data.duration,
      success: data.success,
      ...data
    });
  }
  
  /**
   * Log errors with full context
   */
  static logError(error, context = {}, req = null) {
    logger.error(`Error: ${error.message}`, {
      category: 'error',
      errorMessage: error.message,
      errorName: error.name,
      errorCode: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      requestId: req?.requestId,
      userId: req?.userId,
      path: req?.path,
      method: req?.method,
      ...context
    });
  }
  
  /**
   * Log validation errors
   */
  static logValidationError(errors, data = {}, req = null) {
    logger.warn('Validation Error', {
      category: 'validation',
      errors,
      timestamp: new Date().toISOString(),
      requestId: req?.requestId,
      userId: req?.userId,
      path: req?.path,
      ...data
    });
  }
  
  /**
   * Sanitize sensitive data before logging
   */
  static sanitize(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'ssn',
      'socialSecurityNumber',
      'creditCard',
      'cardNumber',
      'cvv',
      'bankAccount',
      'accountNumber',
      'pin',
      'secret',
      'apiKey',
      'privateKey'
    ];
    
    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
    
    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  /**
   * Create a child logger with default context
   */
  static createContextLogger(context = {}) {
    return {
      info: (message, data = {}) => logger.info(message, { ...context, ...data }),
      warn: (message, data = {}) => logger.warn(message, { ...context, ...data }),
      error: (message, data = {}) => logger.error(message, { ...context, ...data }),
      debug: (message, data = {}) => logger.debug(message, { ...context, ...data })
    };
  }
}

module.exports = LogHelper;
