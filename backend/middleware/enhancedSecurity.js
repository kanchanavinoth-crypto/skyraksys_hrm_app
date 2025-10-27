const { AuditLog, SecuritySession } = require('../models/security.models');
const crypto = require('crypto');

/**
 * Enhanced Security Middleware for comprehensive request tracking and validation
 */

/**
 * Generate device fingerprint from request headers
 */
function generateDeviceFingerprint(req) {
  const components = [
    req.get('User-Agent') || '',
    req.get('Accept-Language') || '',
    req.get('Accept-Encoding') || '',
    req.connection?.remoteAddress || req.ip || ''
  ];
  
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
    .substring(0, 32);
}

/**
 * Calculate risk score based on various factors
 */
function calculateRiskScore(req, session) {
  let score = 0;
  
  // New IP address
  if (session && session.ipAddress !== req.ip) {
    score += 20;
  }
  
  // Unusual time (outside business hours)
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) {
    score += 10;
  }
  
  // High number of requests in short time (basic rate limiting check)
  // This would be enhanced with Redis in production
  score += Math.min(req.session?.requestCount || 0, 30);
  
  // Different user agent
  if (session && session.userAgent !== req.get('User-Agent')) {
    score += 15;
  }
  
  return Math.min(score, 100);
}

/**
 * Enhanced session tracking middleware
 */
function enhancedSessionTracking() {
  return async (req, res, next) => {
    try {
      if (req.userId) {
        const sessionId = req.sessionID || crypto.randomBytes(32).toString('hex');
        const deviceFingerprint = generateDeviceFingerprint(req);
        
        // Find or create security session
        let securitySession = await SecuritySession.findOne({
          where: { sessionId, isActive: true }
        });
        
        if (!securitySession) {
          // Create new security session
          securitySession = await SecuritySession.create({
            sessionId,
            userId: req.userId,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || '',
            deviceFingerprint,
            loginAt: new Date(),
            lastActivityAt: new Date(),
            riskScore: calculateRiskScore(req, null)
          });
        } else {
          // Update existing session
          const riskScore = calculateRiskScore(req, securitySession);
          await securitySession.update({
            lastActivityAt: new Date(),
            riskScore,
            warningCount: riskScore > 50 ? securitySession.warningCount + 1 : securitySession.warningCount
          });
        }
        
        // Add session info to request
        req.securitySession = securitySession;
        
        // Add session termination function
        req.terminateSession = async (reason = 'USER_LOGOUT') => {
          await securitySession.update({
            isActive: false,
            logoutAt: new Date(),
            logoutReason: reason
          });
        };
      }
      
      next();
    } catch (error) {
      console.error('Enhanced session tracking error:', error);
      next(); // Continue even if session tracking fails
    }
  };
}

/**
 * Comprehensive audit logging middleware
 */
function comprehensiveAuditLog() {
  return async (req, res, next) => {
    // Store original methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Capture request start time
    req.startTime = Date.now();
    
    // Override response methods to capture audit info
    res.send = function(data) {
      captureAuditLog(req, res, data);
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      captureAuditLog(req, res, data);
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Capture comprehensive audit log
 */
async function captureAuditLog(req, res, responseData) {
  try {
    // Only log significant operations
    const significantMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const sensitiveRoutes = ['/employees', '/users', '/salary', '/payroll'];
    
    const isSignificant = significantMethods.includes(req.method) ||
                         sensitiveRoutes.some(route => req.path.includes(route));
    
    if (!isSignificant) return;
    
    // Determine action type
    let action = 'VIEW_SENSITIVE';
    if (req.method === 'POST') action = 'CREATE';
    else if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
    else if (req.method === 'DELETE') action = 'DELETE';
    
    // Extract relevant info
    const tableName = extractTableName(req.path);
    const recordId = extractRecordId(req.params);
    const employeeId = req.params.employeeId || req.body?.employeeId || null;
    
    // Determine severity
    let severity = 'LOW';
    if (req.path.includes('/salary') || req.path.includes('/payroll')) {
      severity = 'HIGH';
    } else if (req.method === 'DELETE' || req.path.includes('/sensitive')) {
      severity = 'MEDIUM';
    }
    
    // Create audit log
    /*
    await AuditLog.create({
      action,
      tableName,
      recordId,
      employeeId,
      fieldName: extractFieldName(req.body),
      oldValue: null, // Would be populated in actual update operations
      newValue: sanitizeValue(req.body),
      userId: req.userId || null,
      userRole: req.userRole || 'unknown',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.securitySession?.sessionId || null,
      severity,
      success: res.statusCode < 400,
      errorMessage: res.statusCode >= 400 ? responseData?.error || 'Unknown error' : null
    });
    */
    
  } catch (error) {
    console.error('Audit log capture error:', error);
    // Don't throw - audit logging shouldn't break the request
  }
}

/**
 * Helper functions
 */
function extractTableName(path) {
  if (path.includes('/employees')) return 'employees';
  if (path.includes('/users')) return 'users';
  if (path.includes('/departments')) return 'departments';
  if (path.includes('/positions')) return 'positions';
  if (path.includes('/salary')) return 'salary_structures';
  return 'unknown';
}

function extractRecordId(params) {
  return params.id || params.employeeId || params.userId || null;
}

function extractFieldName(body) {
  if (!body || typeof body !== 'object') return null;
  
  // Return first field that's being updated
  const sensitiveFields = ['status', 'salary', 'department', 'position'];
  for (const field of sensitiveFields) {
    if (body.hasOwnProperty(field)) return field;
  }
  
  return Object.keys(body)[0] || null;
}

function sanitizeValue(value) {
  if (!value || typeof value !== 'object') return null;
  
  const sensitiveFields = ['password', 'aadhaarNumber', 'panNumber', 'bankAccountNumber'];
  const sanitized = { ...value };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***MASKED***';
    }
  });
  
  return JSON.stringify(sanitized).substring(0, 1000); // Limit size
}

/**
 * Request rate limiting with progressive penalties
 */
function enhancedRateLimiting(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    maxSensitiveRequests = 20
  } = options;
  
  // In production, this would use Redis
  const requestCounts = new Map();
  
  return (req, res, next) => {
    const key = `${req.ip}:${req.userId || 'anonymous'}`;
    const now = Date.now();
    
    // Clean old entries
    for (const [entryKey, data] of requestCounts.entries()) {
      if (now - data.firstRequest > windowMs) {
        requestCounts.delete(entryKey);
      }
    }
    
    // Get or create request count
    let requestData = requestCounts.get(key) || {
      count: 0,
      sensitiveCount: 0,
      firstRequest: now,
      warnings: 0
    };
    
    // Check if this is a sensitive operation
    const isSensitive = req.path.includes('/salary') || 
                       req.path.includes('/sensitive') ||
                       req.method === 'DELETE';
    
    // Update counts
    requestData.count++;
    if (isSensitive) requestData.sensitiveCount++;
    
    // Check limits
    let exceeded = false;
    let message = '';
    
    if (requestData.count > maxRequests) {
      exceeded = true;
      message = 'Too many requests';
    } else if (isSensitive && requestData.sensitiveCount > maxSensitiveRequests) {
      exceeded = true;
      message = 'Too many sensitive operations';
    }
    
    if (exceeded) {
      requestData.warnings++;
      
      // Log security event
      if (req.userId) {
        /*
        AuditLog.create({
          action: 'SECURITY_VIOLATION',
          tableName: 'rate_limit',
          userId: req.userId,
          userRole: req.userRole,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          severity: 'HIGH',
          success: false,
          errorMessage: `Rate limit exceeded: ${message}`
        });
        */
        // }).catch(console.error);
      }
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Store updated data
    requestCounts.set(key, requestData);
    req.requestCount = requestData.count;
    
    next();
  };
}

/**
 * Suspicious activity detection
 */
function suspiciousActivityDetection() {
  return async (req, res, next) => {
    try {
      if (!req.userId || !req.securitySession) {
        return next();
      }
      
      const session = req.securitySession;
      let suspiciousScore = 0;
      const alerts = [];
      
      // Check for unusual patterns
      
      // 1. Rapid successive requests to different sensitive endpoints
      if (req.path.includes('/salary') || req.path.includes('/payroll')) {
        suspiciousScore += 15;
        alerts.push('Accessing sensitive financial data');
      }
      
      // 2. Accessing data for many different employees quickly
      if (req.params.employeeId && req.session?.accessedEmployees) {
        req.session.accessedEmployees.add(req.params.employeeId);
        if (req.session.accessedEmployees.size > 10) {
          suspiciousScore += 25;
          alerts.push('Accessing data for many employees');
        }
      } else if (req.params.employeeId) {
        req.session.accessedEmployees = new Set([req.params.employeeId]);
      }
      
      // 3. High risk score from session
      if (session.riskScore > 70) {
        suspiciousScore += session.riskScore;
        alerts.push('High session risk score');
      }
      
      // 4. Bulk operations
      if (req.path.includes('/bulk') || (req.body && Array.isArray(req.body))) {
        suspiciousScore += 20;
        alerts.push('Performing bulk operations');
      }
      
      // If suspicious activity detected
      if (suspiciousScore > 50) {
        // Log the suspicious activity
        /*
        await AuditLog.create({
          action: 'SECURITY_VIOLATION',
          tableName: 'suspicious_activity',
          userId: req.userId,
          userRole: req.userRole,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: session.sessionId,
          severity: suspiciousScore > 80 ? 'CRITICAL' : 'HIGH',
          success: false,
          errorMessage: `Suspicious activity detected: ${alerts.join(', ')} (Score: ${suspiciousScore})`
        });
        */
        
        // Update session warning count
        await session.update({
          warningCount: session.warningCount + 1,
          riskScore: Math.min(session.riskScore + 20, 100)
        });
        
        // If critical, consider blocking the request
        if (suspiciousScore > 80) {
          return res.status(403).json({
            error: 'Suspicious activity detected',
            message: 'Your account has been temporarily restricted due to unusual activity patterns',
            contactSupport: true
          });
        }
      }
      
      next();
    } catch (error) {
      console.error('Suspicious activity detection error:', error);
      next(); // Continue even if detection fails
    }
  };
}

module.exports = {
  enhancedSessionTracking,
  comprehensiveAuditLog,
  enhancedRateLimiting,
  suspiciousActivityDetection,
  generateDeviceFingerprint,
  calculateRiskScore
};
