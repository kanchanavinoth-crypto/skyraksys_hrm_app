const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware configurations
 * Prevents API abuse and DoS attacks
 */

// Standard rate limit for regular API endpoints
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limit for bulk operations
const bulkOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit to 20 bulk operations per 15 minutes
  message: {
    success: false,
    message: 'Too many bulk operations from this IP. Please try again after 15 minutes.',
    retryAfter: '15 minutes',
    hint: 'Bulk operations are rate-limited to prevent system overload. If you need to process more data, please contact your administrator.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, even successful ones
  skip: (req) => {
    // Skip rate limiting for admin users (optional)
    return req.userRole === 'admin';
  }
});

// Very strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful authentication attempts
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dashboard rate limiter (moderate)
const dashboardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    message: 'Too many dashboard requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create/Update rate limiter (more restrictive for POST/PUT/DELETE)
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 create/update operations per window
  message: {
    success: false,
    message: 'Too many create/update operations, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  standardLimiter,
  bulkOperationLimiter,
  authLimiter,
  apiLimiter,
  dashboardLimiter,
  createLimiter
};
