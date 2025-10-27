# Logging Infrastructure Implementation Guide

## ✅ Completed Implementation (Phase 1)

### 1. New Middleware Created

#### **requestLogger.js** (67 lines)
**Location**: `backend/middleware/requestLogger.js`

**Features**:
- ✅ Generates unique UUID v4 for each request (`req.requestId`)
- ✅ Adds `X-Request-ID` header to all responses
- ✅ Logs incoming requests with structured data
- ✅ Logs completed requests with status code and duration
- ✅ Automatically flags slow requests (>1000ms)
- ✅ Uses appropriate log levels based on HTTP status codes:
  - 500+ → `error`
  - 400-499 → `warn`
  - 200-399 → `info`

**Logged Fields**:
```javascript
{
  message: "Incoming request: GET /api/timesheets",
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  method: "GET",
  path: "/api/timesheets",
  url: "http://localhost:5000/api/timesheets?status=pending",
  ip: "127.0.0.1",
  userAgent: "Mozilla/5.0...",
  userId: 42,
  employeeId: 5,
  userRole: "employee",
  contentType: "application/json",
  timestamp: "2025-01-23T10:30:45.123Z"
}
```

#### **logHelper.js** (227 lines)
**Location**: `backend/utils/logHelper.js`

**12 Static Methods**:

1. **`logBusinessEvent(event, data, req)`**
   - For business operations: timesheet submissions, leave approvals, etc.
   - Example: `LogHelper.logBusinessEvent('timesheet_submitted', { timesheetId, employeeId, totalHours }, req);`

2. **`logSecurityEvent(event, severity, data, req)`**
   - For security events with severity levels (low/medium/high/critical)
   - Example: `LogHelper.logSecurityEvent('failed_login_attempt', 'medium', { email, ipAddress }, req);`

3. **`logAuthEvent(event, success, data, req)`**
   - For authentication events (login, logout, token refresh)
   - Example: `LogHelper.logAuthEvent('login_success', true, { userId, email, role }, req);`

4. **`logAuthzEvent(event, allowed, data, req)`**
   - For authorization checks (access granted/denied)
   - Example: `LogHelper.logAuthzEvent('access_denied', false, { resource, userRole, requiredRole }, req);`

5. **`logDataMutation(action, model, data, req)`**
   - For CRUD operations with change tracking
   - Example: `LogHelper.logDataMutation('update', 'Employee', { id, before, after }, req);`

6. **`logPerformance(operation, duration, data, req)`**
   - For performance metrics and slow query detection
   - Example: `LogHelper.logPerformance('database_query', 1500, { query, threshold: 1000 }, req);`

7. **`logDatabaseOperation(operation, model, data, req)`**
   - For database queries with metrics
   - Example: `LogHelper.logDatabaseOperation('SELECT', 'Timesheet', { duration: 45, rowCount: 150 }, req);`

8. **`logExternalAPI(service, endpoint, data, req)`**
   - For external API calls
   - Example: `LogHelper.logExternalAPI('MailService', 'send-email', { recipient, success: true }, req);`

9. **`logError(error, context, req)`**
   - For errors with full stack traces and context
   - Example: `LogHelper.logError(error, { context: 'timesheet_submission', timesheetId }, req);`

10. **`logValidationError(errors, data, req)`**
    - For input validation failures
    - Example: `LogHelper.logValidationError([{field: 'email', message: 'Invalid format'}], { email }, req);`

11. **`sanitize(obj)`**
    - Removes sensitive data from objects before logging
    - Sanitizes: password, token, ssn, creditCard, bankAccount, pin, secret, apiKey, privateKey

12. **`createContextLogger(context)`**
    - Creates child logger with default context
    - Example: `const logger = LogHelper.createContextLogger({ module: 'TimesheetService' });`

#### **errorLogger.js** (30 lines)
**Location**: `backend/middleware/errorLogger.js`

**Features**:
- ✅ Intercepts all unhandled Express errors
- ✅ Uses LogHelper.logError() for structured logging
- ✅ Captures full request context (method, path, user, IP, body, query, params)
- ✅ Sanitizes sensitive data in request body
- ✅ Includes sanitized headers
- ✅ Passes error to next error handler

### 2. Enhanced Existing Middleware

#### **auth.simple.js** (Enhanced)
**Location**: `backend/middleware/auth.simple.js`

**Authentication Logging Added**:
- ✅ Token missing → `logAuthEvent('token_missing', false, ...)`
- ✅ Invalid user → `logAuthEvent('token_invalid_user', false, ...)` with reason
- ✅ Successful auth → `logAuthEvent('token_verified', true, ...)` with user details
- ✅ Expired token → `logAuthEvent('token_expired', false, ...)`
- ✅ Invalid token → `logAuthEvent('token_invalid', false, ...)`
- ✅ Generic errors → `logError(error, ...)` with full context

**Authorization Logging Added**:
- ✅ Access denied → `logAuthzEvent('access_denied', false, ...)` with roles and reason
- ✅ Access granted → `logAuthzEvent('access_granted', true, ...)` with roles

**Removed**: All `console.log` debugging statements replaced with structured logging

### 3. Server Integration

#### **server.js** (Integrated)
**Location**: `backend/server.js`

**Changes**:
1. ✅ Added `requestLogger` middleware after body-parser (line ~103)
2. ✅ Added `errorLogger` middleware before final error handler (line ~289)
3. ✅ Removed manual Winston logging from error handler (now handled by errorLogger)

---

## 📋 Pending Tasks (Phase 2)

### Immediate Tasks (2-4 hours)

#### 1. **Restart Backend Server** ⚠️ CRITICAL
The new middleware is integrated but requires server restart to take effect.

**Action**: Restart the backend server task or use:
```bash
cd backend
node server.js
```

**Verification**: Check `logs/combined.log` for request IDs in new requests:
```bash
tail -f logs/combined.log
```

#### 2. **Replace console.log in timesheet.routes.js** (60+ instances)

**Current State**: 60+ console.log statements found

**Example Replacements**:

**Before**:
```javascript
console.log('🔄 === BULK TIMESHEET SUBMISSION START ===');
console.log('📝 Request Details:');
console.log('   Employee ID:', req.employeeId);
console.log('   Request body:', JSON.stringify(req.body, null, 2));
```

**After**:
```javascript
const LogHelper = require('../utils/logHelper'); // Add at top of file

LogHelper.logBusinessEvent('bulk_timesheet_submission_start', {
  employeeId: req.employeeId,
  timesheetCount: req.body.timesheetIds?.length || 0,
  body: req.body
}, req);
```

**Before**:
```javascript
console.log(`✅ Successfully submitted timesheet ${timesheetId}`);
```

**After**:
```javascript
LogHelper.logBusinessEvent('timesheet_submitted', {
  timesheetId,
  employeeId: timesheet.employeeId,
  projectId: timesheet.projectId,
  taskId: timesheet.taskId,
  totalHours: timesheet.totalHoursWorked,
  weekStartDate: timesheet.weekStartDate
}, req);
```

**Before**:
```javascript
console.error('💥 Bulk Submit Timesheets Error:', error);
```

**After**:
```javascript
LogHelper.logError(error, {
  context: 'bulk_timesheet_submission',
  employeeId: req.employeeId,
  timesheetIds: req.body.timesheetIds
}, req);
```

#### 3. **Replace console.error in debug.routes.js** (40+ instances)

**Current State**: 40+ console.error statements found

**Example Replacements**:

**Before**:
```javascript
console.error('Database query error:', error);
```

**After**:
```javascript
const LogHelper = require('../utils/logHelper'); // Add at top of file

LogHelper.logError(error, {
  context: 'database_query_execution',
  query: sqlQuery
}, req);
```

#### 4. **Replace console statements in other routes**

Files to update:
- `backend/routes/employee.routes.js`
- `backend/routes/user.routes.js`
- `backend/routes/weekly-timesheet.routes.js`
- `backend/routes/leave.routes.js`
- `backend/routes/project.routes.js`
- `backend/routes/task.routes.js`

**Pattern to follow**:
1. Add `const LogHelper = require('../utils/logHelper');` at top
2. Replace `console.log()` with appropriate LogHelper method
3. Replace `console.error()` with `LogHelper.logError()`
4. Replace `console.warn()` with `logger.warn()` or appropriate LogHelper method

### Testing Tasks (1 hour)

#### 5. **Test Request ID Tracking**

**Steps**:
1. Make API request: `curl -H "Authorization: Bearer <token>" http://localhost:5000/api/timesheets`
2. Check response headers for `X-Request-ID`
3. Check `logs/combined.log` for matching request ID in all related log entries

**Expected Result**: All logs for a single request should have the same `requestId`

#### 6. **Test Security Event Logging**

**Test Cases**:
- Login with invalid credentials → Should log `failed_login_attempt` security event
- Access protected endpoint without token → Should log `token_missing` auth event
- Access endpoint with wrong role → Should log `access_denied` authz event

**Verification**: Check `logs/combined.log` for structured JSON logs with event types

#### 7. **Test Error Logging**

**Test Cases**:
- Submit invalid timesheet data → Should log validation error
- Trigger database error → Should log with full context and stack trace

**Verification**: Check `logs/error.log` for detailed error logs with sanitized data

### Configuration Tasks (1 hour)

#### 8. **Environment-Based Log Configuration**

**Update `backend/config/logger.js`**:

```javascript
// Add environment-specific configurations
const getLogLevel = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'info'; // Don't log debug in production
    case 'development':
      return 'debug'; // Log everything in dev
    case 'test':
      return 'error'; // Only errors in tests
    default:
      return 'info';
  }
};

// Update Winston configuration
level: process.env.LOG_LEVEL || getLogLevel(),
```

### Production Readiness (2-3 days)

#### 9. **Set Up Log Aggregation**

**Option A: Datadog (Recommended for Production)**

**Setup Steps**:
1. Sign up for Datadog account
2. Install Datadog agent:
   ```bash
   npm install dd-trace winston-datadog
   ```
3. Update logger configuration:
   ```javascript
   const DatadogWinston = require('winston-datadog');
   
   transports.push(new DatadogWinston({
     apiKey: process.env.DATADOG_API_KEY,
     hostname: process.env.HOSTNAME,
     service: 'hrm-backend',
     ddsource: 'nodejs',
     ddtags: `env:${process.env.NODE_ENV}`
   }));
   ```

**Option B: ELK Stack (Self-Hosted)**

**Setup Steps**:
1. Install Elasticsearch, Logstash, Kibana
2. Install Winston Elasticsearch transport:
   ```bash
   npm install winston-elasticsearch
   ```
3. Update logger configuration:
   ```javascript
   const { ElasticsearchTransport } = require('winston-elasticsearch');
   
   transports.push(new ElasticsearchTransport({
     level: 'info',
     clientOpts: { node: process.env.ELASTICSEARCH_URL },
     index: 'hrm-logs'
   }));
   ```

**Option C: Papertrail (Quick Setup)**

**Setup Steps**:
1. Sign up for Papertrail account
2. Install Winston Syslog transport:
   ```bash
   npm install winston-syslog
   ```
3. Update logger configuration:
   ```javascript
   const Syslog = require('winston-syslog').Syslog;
   
   transports.push(new Syslog({
     host: process.env.PAPERTRAIL_HOST,
     port: process.env.PAPERTRAIL_PORT,
     protocol: 'tls4',
     facility: 'local0',
     app_name: 'hrm-backend'
   }));
   ```

#### 10. **Create Logging Dashboards**

**Datadog Dashboard Example**:
- Request rate by endpoint
- Error rate over time
- Average response time
- Failed authentication attempts
- Authorization denials by user/role
- Slow queries (>1s)
- Top errors by type

**ELK Kibana Dashboard Example**:
- Create index pattern: `hrm-logs-*`
- Create visualizations:
  - Line chart: Request count over time
  - Pie chart: Log level distribution
  - Bar chart: Top errors
  - Data table: Recent failed auth attempts

#### 11. **Configure Alerting**

**Critical Alerts** (Immediate Notification):
- Error rate > 5% for 5 minutes
- Security event: `unauthorized_access_attempt` with severity `critical`
- Database connection failures
- Authentication failures > 10 in 1 minute (potential brute force)

**Warning Alerts** (Review Within 1 Hour):
- Slow requests > 5s
- Error rate > 2% for 10 minutes
- High memory usage
- Disk space < 10%

**Example Datadog Alert**:
```javascript
{
  "name": "High Error Rate - HRM Backend",
  "query": "avg(last_5m):sum:hrm.request.error{env:production} / sum:hrm.request.count{env:production} > 0.05",
  "message": "Error rate exceeded 5% in the last 5 minutes. @slack-ops-channel",
  "tags": ["service:hrm-backend", "env:production"],
  "options": {
    "notify_no_data": true,
    "notify_audit": true
  }
}
```

---

## 📊 Current Status Summary

### Completed ✅
- [x] Created requestLogger middleware with UUID request IDs
- [x] Created LogHelper utility with 12 structured logging methods
- [x] Created errorLogger middleware for centralized error capture
- [x] Enhanced auth.simple.js with security event logging
- [x] Integrated new middleware into server.js
- [x] Installed uuid package dependency

### In Progress ⏳
- [ ] Server restart required to activate new middleware
- [ ] Need to replace 60+ console.log in timesheet.routes.js
- [ ] Need to replace 40+ console.error in debug.routes.js

### Pending 📋
- [ ] Replace console statements in remaining route files (6+ files)
- [ ] Environment-based log configuration
- [ ] Comprehensive testing (request IDs, security events, error logging)
- [ ] Set up log aggregation (Datadog/ELK/Papertrail)
- [ ] Create monitoring dashboards
- [ ] Configure alerting for critical events
- [ ] Update team documentation
- [ ] Train team on new logging practices

---

## 🎯 Priority Roadmap

### Today (2-4 hours)
1. ⚠️ Restart backend server to activate middleware
2. ⚠️ Test request ID tracking (make API request, check logs)
3. ⚠️ Replace console.log in timesheet.routes.js (highest usage)
4. Test security event logging (login, auth, authz)

### This Week (1-2 days)
5. Replace console statements in all remaining route files
6. Environment-based log configuration
7. Comprehensive testing of all logging functionality
8. Code review with team

### Next Week (2-3 days)
9. Set up log aggregation (choose: Datadog/ELK/Papertrail)
10. Create monitoring dashboards
11. Configure alerting rules
12. Update documentation

### Ongoing
- Monitor log quality and adjust as needed
- Train team on new logging practices
- Review and optimize log aggregation costs
- Regularly audit for remaining console statements

---

## 💡 Best Practices for Logging

### DO ✅
- **Use structured logging**: Always pass objects, not strings
- **Include request context**: Pass `req` parameter when available
- **Use appropriate log levels**: error, warn, info, debug
- **Sanitize sensitive data**: Never log passwords, tokens, SSNs
- **Log business events**: Timesheet submissions, approvals, rejections
- **Log security events**: Failed logins, unauthorized access attempts
- **Log performance issues**: Slow queries (>1s), high memory usage
- **Include correlation IDs**: Use request IDs for tracing

### DON'T ❌
- **Don't use console.log**: Use LogHelper or logger instead
- **Don't log sensitive data**: PII, credentials, tokens
- **Don't use string concatenation**: Use structured JSON format
- **Don't log excessively**: Balance between insight and noise
- **Don't ignore errors**: Always log with full context
- **Don't log in loops**: Aggregate data first, then log summary

### Example: Good vs Bad Logging

**❌ Bad**:
```javascript
console.log('Processing timesheet ' + timesheetId + ' for employee ' + employeeId);
console.log('Status: ' + status);
console.log('Hours: ' + totalHours);
```

**✅ Good**:
```javascript
LogHelper.logBusinessEvent('timesheet_processing', {
  timesheetId,
  employeeId,
  status,
  totalHours
}, req);
```

**❌ Bad**:
```javascript
console.error('Error:', error.message);
```

**✅ Good**:
```javascript
LogHelper.logError(error, {
  context: 'timesheet_submission',
  timesheetId,
  employeeId
}, req);
```

---

## 📚 Quick Reference

### Common Logging Patterns

**Business Event**:
```javascript
LogHelper.logBusinessEvent('timesheet_approved', {
  timesheetId,
  employeeId,
  approverId: req.userId,
  totalHours
}, req);
```

**Security Event**:
```javascript
LogHelper.logSecurityEvent('failed_login_attempt', 'medium', {
  email,
  ipAddress: req.ip,
  userAgent: req.get('user-agent')
}, req);
```

**Authentication Event**:
```javascript
LogHelper.logAuthEvent('login_success', true, {
  userId,
  email,
  role,
  ipAddress: req.ip
}, req);
```

**Authorization Event**:
```javascript
LogHelper.logAuthzEvent('access_denied', false, {
  resource: req.path,
  action: req.method,
  userRole: req.userRole,
  requiredRole: 'admin',
  reason: 'Insufficient permissions'
}, req);
```

**Error with Context**:
```javascript
LogHelper.logError(error, {
  context: 'database_query',
  query: sqlQuery,
  params: queryParams
}, req);
```

**Performance Issue**:
```javascript
LogHelper.logPerformance('database_query', duration, {
  query: sqlQuery,
  threshold: 1000,
  exceeded: duration > 1000
}, req);
```

---

## 🔍 Troubleshooting

### Request IDs Not Appearing in Logs

**Problem**: Logs don't have `requestId` field

**Solution**:
1. Verify requestLogger is properly integrated in server.js
2. Check middleware order (requestLogger should be early in chain)
3. Restart server to apply changes
4. Clear log files and test again

### Sensitive Data Still Being Logged

**Problem**: Passwords or tokens appearing in logs

**Solution**:
1. Use `LogHelper.sanitize()` before logging user input
2. Add sensitive field names to SENSITIVE_FIELDS array in logHelper.js
3. Review error logger middleware sanitization

### Logs Too Verbose

**Problem**: Too many log entries, hard to find important information

**Solution**:
1. Adjust log level in production (set to 'info' instead of 'debug')
2. Remove excessive logging in loops
3. Use log aggregation filtering
4. Add structured tags for easier filtering

### Performance Impact from Logging

**Problem**: Logging slowing down application

**Solution**:
1. Use async logging (Winston already does this)
2. Reduce log retention (5 files is good)
3. Don't log request/response bodies by default
4. Use sampling for high-traffic endpoints

---

## 📞 Support

For questions or issues with the logging infrastructure:
1. Review this guide first
2. Check `logs/combined.log` for recent logs
3. Check `logs/error.log` for error details
4. Search for similar errors in log aggregation tool
5. Contact DevOps team for log aggregation issues

---

**Last Updated**: 2025-01-23
**Version**: 1.0
**Status**: Phase 1 Complete, Phase 2 Pending
