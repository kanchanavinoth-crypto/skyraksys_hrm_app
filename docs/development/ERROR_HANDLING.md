# Error Handling Guide

## Overview
This document outlines the error handling patterns and practices used in the SkyRakSys HRM system.

## Error Response Structure

### Standard Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string; // Only in development
  }
}
```

## Error Types

### 1. Application Errors
```javascript
class AppError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
```

### 2. Validation Errors
```javascript
class ValidationError extends AppError {
  constructor(message, details) {
    super('VALIDATION_ERROR', message, 400);
    this.details = details;
  }
}
```

### 3. Authentication Errors
```javascript
class AuthError extends AppError {
  constructor(message) {
    super('AUTH_ERROR', message, 401);
  }
}
```

## Error Categories & Status Codes

### 4xx Client Errors
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 422 Unprocessable Entity
- 429 Too Many Requests

### 5xx Server Errors
- 500 Internal Server Error
- 502 Bad Gateway
- 503 Service Unavailable
- 504 Gateway Timeout

## Error Handling Middleware

### Global Error Handler
```javascript
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred'
    }
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Log error
  logger.error({
    message: err.message,
    code: err.code,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(statusCode).json(errorResponse);
});
```

## Error Logging

### Winston Logger Configuration
```javascript
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log' }),
    new winston.transports.Console()
  ]
});
```

## Error Handling Examples

### Route Handler
```javascript
router.post('/users', async (req, res, next) => {
  try {
    const user = await createUser(req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error); // Pass to error handling middleware
  }
});
```

### Service Layer
```javascript
async function createUser(userData) {
  // Validation
  if (!userData.email) {
    throw new ValidationError('Email is required');
  }

  try {
    return await User.create(userData);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('USER_EXISTS', 'User already exists', 409);
    }
    throw error;
  }
}
```

## Client-Side Error Handling

### Axios Interceptor
```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        default:
          // Handle other errors
      }
    }
    return Promise.reject(error);
  }
);
```

## Error Monitoring & Alerting

### Sentry Integration
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

// Add to error handler
app.use((err, req, res, next) => {
  Sentry.captureException(err);
  // ... rest of error handling
});
```

## Best Practices

1. **Consistent Error Format**
   - Use standard error response structure
   - Include meaningful error codes
   - Provide helpful error messages

2. **Security Considerations**
   - Don't expose sensitive information
   - Sanitize error messages
   - Log securely

3. **Error Recovery**
   - Implement retry mechanisms
   - Provide fallback options
   - Handle edge cases

4. **Validation**
   - Validate input early
   - Use strong typing
   - Implement request schemas

5. **Monitoring**
   - Track error rates
   - Set up alerts
   - Monitor error patterns

## Testing Error Handling

### Jest Test Examples
```javascript
describe('Error Handling', () => {
  it('should handle validation errors', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle not found errors', async () => {
    const response = await request(app)
      .get('/api/users/999');
    
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
```

## References
- [API Documentation](../api/API_DOCUMENTATION.md)
- [Development Setup](../../DEVELOPMENT_SETUP.md)
- [Production Configuration](../../PROD/docs/PRODUCTION_SETUP_GUIDE.md)
- [Testing Guide](./TESTING.md)