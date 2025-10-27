/**
 * Console.log Replacement Examples for Route Files
 * 
 * This file shows how to replace various console.log/error/warn patterns
 * with structured logging using LogHelper.
 * 
 * PATTERN: Import LogHelper at the top of every route file
 */

const LogHelper = require('../utils/logHelper');

// ============================================================================
// EXAMPLE 1: Simple Information Logging
// ============================================================================

// ❌ BAD - Console.log with string concatenation
console.log('Processing timesheet submission for employee:', employeeId);
console.log('Timesheet ID:', timesheetId);

// ✅ GOOD - Structured business event
LogHelper.logBusinessEvent('timesheet_processing_start', {
  timesheetId,
  employeeId,
  action: 'submission'
}, req);

// ============================================================================
// EXAMPLE 2: Bulk Operations
// ============================================================================

// ❌ BAD - Multiple console.log statements
console.log('🔄 === BULK TIMESHEET SUBMISSION START ===');
console.log('📝 Request Details:');
console.log('   Employee ID:', req.employeeId);
console.log('   Request body:', JSON.stringify(req.body, null, 2));
console.log('   Timestamp:', new Date().toISOString());

// ✅ GOOD - Single structured log with all data
LogHelper.logBusinessEvent('bulk_timesheet_submission_start', {
  employeeId: req.employeeId,
  timesheetCount: req.body.timesheetIds?.length || 0,
  timesheetIds: req.body.timesheetIds,
  requestBody: req.body,
  timestamp: new Date().toISOString()
}, req);

// ============================================================================
// EXAMPLE 3: Success Messages
// ============================================================================

// ❌ BAD - Simple console.log
console.log(`✅ Successfully submitted timesheet ${timesheetId}`);

// ✅ GOOD - Business event with context
LogHelper.logBusinessEvent('timesheet_submitted_success', {
  timesheetId,
  employeeId: timesheet.employeeId,
  projectId: timesheet.projectId,
  taskId: timesheet.taskId,
  totalHours: timesheet.totalHoursWorked,
  weekStartDate: timesheet.weekStartDate,
  weekEndDate: timesheet.weekEndDate,
  status: timesheet.status
}, req);

// ============================================================================
// EXAMPLE 4: Validation Errors
// ============================================================================

// ❌ BAD - Console.log for validation
console.log('❌ Invalid timesheet IDs provided');

// ✅ GOOD - Validation error logging
LogHelper.logValidationError([
  { field: 'timesheetIds', message: 'Invalid or missing timesheet IDs' }
], {
  providedIds: req.body.timesheetIds,
  employeeId: req.employeeId
}, req);

// ============================================================================
// EXAMPLE 5: Authorization Failures
// ============================================================================

// ❌ BAD - Console.log for security issue
console.log(`❌ Ownership check failed - timesheet belongs to different employee`);

// ✅ GOOD - Security event logging
LogHelper.logSecurityEvent('timesheet_ownership_violation', 'medium', {
  timesheetId,
  requestedByEmployeeId: req.employeeId,
  actualEmployeeId: timesheet.employeeId,
  action: 'submission_attempt',
  result: 'denied'
}, req);

// ============================================================================
// EXAMPLE 6: Status Validation
// ============================================================================

// ❌ BAD - Console.log for status check
console.log(`❌ Status check failed - current status: ${timesheet.status}`);

// ✅ GOOD - Validation error with context
LogHelper.logValidationError([
  { 
    field: 'status', 
    message: `Cannot submit timesheet in ${timesheet.status} status`,
    expected: 'draft',
    actual: timesheet.status
  }
], {
  timesheetId,
  employeeId: req.employeeId,
  currentStatus: timesheet.status,
  allowedStatuses: ['draft']
}, req);

// ============================================================================
// EXAMPLE 7: Warnings
// ============================================================================

// ❌ BAD - Console.log for warning
console.log(`⚠️  Warning: Submitting timesheet with zero hours`);

// ✅ GOOD - Business event with warning flag
LogHelper.logBusinessEvent('timesheet_submission_warning', {
  timesheetId,
  employeeId: req.employeeId,
  warning: 'zero_hours',
  totalHours: timesheet.totalHoursWorked,
  message: 'Timesheet submitted with zero hours'
}, req);

// Or use logger.warn for simple warnings:
const { logger } = require('../config/logger');
logger.warn('Timesheet submitted with zero hours', {
  requestId: req.requestId,
  timesheetId,
  employeeId: req.employeeId,
  totalHours: 0
});

// ============================================================================
// EXAMPLE 8: Error Handling (Try-Catch Blocks)
// ============================================================================

// ❌ BAD - Console.error with limited context
try {
  // ... operation
} catch (error) {
  console.error('💥 Bulk Submit Timesheets Error:', error);
}

// ✅ GOOD - Comprehensive error logging
try {
  // ... operation
} catch (error) {
  LogHelper.logError(error, {
    context: 'bulk_timesheet_submission',
    operation: 'submit',
    employeeId: req.employeeId,
    timesheetIds: req.body.timesheetIds,
    timesheetCount: req.body.timesheetIds?.length || 0
  }, req);
  
  // Still throw or send response as needed
  throw error; // or res.status(500).json(...)
}

// ============================================================================
// EXAMPLE 9: Multiple Operation Errors
// ============================================================================

// ❌ BAD - Console.log in loop
errors.forEach((error, index) => {
  console.log(`   ${index + 1}. ${error.timesheetId}: ${error.error}`);
});

// ✅ GOOD - Single log with aggregated data
if (errors.length > 0) {
  LogHelper.logBusinessEvent('bulk_operation_errors', {
    operation: 'timesheet_submission',
    errorCount: errors.length,
    successCount: results.length,
    totalAttempted: timesheetIds.length,
    successRate: ((results.length / timesheetIds.length) * 100).toFixed(1),
    errors: errors.map(e => ({
      timesheetId: e.timesheetId,
      error: e.error,
      reason: e.reason
    }))
  }, req);
}

// ============================================================================
// EXAMPLE 10: Summary Logging
// ============================================================================

// ❌ BAD - Multiple console.log for summary
console.log('\n📊 BULK SUBMISSION SUMMARY:');
console.log(`   ✅ Successfully submitted: ${results.length}`);
console.log(`   ❌ Failed submissions: ${errors.length}`);
console.log(`   📈 Success rate: ${((results.length / timesheetIds.length) * 100).toFixed(1)}%`);

// ✅ GOOD - Single structured summary
LogHelper.logBusinessEvent('bulk_timesheet_submission_complete', {
  operation: 'bulk_submit',
  totalTimesheets: timesheetIds.length,
  successCount: results.length,
  failureCount: errors.length,
  successRate: ((results.length / timesheetIds.length) * 100).toFixed(1),
  duration: Date.now() - startTime,
  employeeId: req.employeeId,
  successfulTimesheets: results.map(r => r.id),
  failedTimesheets: errors.map(e => ({ id: e.timesheetId, reason: e.error }))
}, req);

// ============================================================================
// EXAMPLE 11: Approval Operations
// ============================================================================

// ❌ BAD - Console.log for approval
console.log(`🔄 === BULK APPROVAL START ===`);
console.log(`📝 Approving ${timesheetIds.length} timesheets by user ${req.userId}`);
console.log(`📝 Timesheet IDs: ${timesheetIds.join(', ')}`);
console.log(`📝 Comments: ${approverComments}`);

// ✅ GOOD - Business event for approval
LogHelper.logBusinessEvent('bulk_timesheet_approval_start', {
  operation: 'approval',
  approverUserId: req.userId,
  approverEmployeeId: req.employeeId,
  timesheetCount: timesheetIds.length,
  timesheetIds,
  comments: approverComments,
  timestamp: new Date().toISOString()
}, req);

// ============================================================================
// EXAMPLE 12: Rejection Operations
// ============================================================================

// ❌ BAD - Console.log for rejection
console.log(`🔄 === BULK REJECTION START ===`);
console.log(`📝 Rejecting ${timesheetIds.length} timesheets by user ${req.userId}`);
console.log(`📝 Rejection reason: ${approverComments}`);

// ✅ GOOD - Business event for rejection
LogHelper.logBusinessEvent('bulk_timesheet_rejection_start', {
  operation: 'rejection',
  approverUserId: req.userId,
  approverEmployeeId: req.employeeId,
  timesheetCount: timesheetIds.length,
  timesheetIds,
  rejectionReason: approverComments,
  timestamp: new Date().toISOString()
}, req);

// ============================================================================
// EXAMPLE 13: Database Queries
// ============================================================================

// ❌ BAD - Console.log for query
console.log('🔍 Filtering timesheets by startDate:', startDate);

// ✅ GOOD - Database operation logging
const startTime = Date.now();
// ... perform query
const duration = Date.now() - startTime;

LogHelper.logDatabaseOperation('SELECT', 'Timesheet', {
  operation: 'filter_by_date',
  filters: { startDate, employeeId: req.employeeId },
  resultCount: timesheets.length,
  duration,
  isSlowQuery: duration > 1000
}, req);

// ============================================================================
// EXAMPLE 14: External API Calls
// ============================================================================

// ❌ BAD - Console.log for API call
console.log('Sending email notification to:', employee.email);

// ✅ GOOD - External API logging
try {
  const result = await emailService.send({
    to: employee.email,
    subject: 'Timesheet Approved',
    template: 'timesheet-approval'
  });
  
  LogHelper.logExternalAPI('EmailService', 'send-notification', {
    recipient: employee.email,
    template: 'timesheet-approval',
    success: true,
    messageId: result.messageId
  }, req);
} catch (error) {
  LogHelper.logExternalAPI('EmailService', 'send-notification', {
    recipient: employee.email,
    template: 'timesheet-approval',
    success: false,
    error: error.message
  }, req);
  
  // Also log the error
  LogHelper.logError(error, {
    context: 'email_notification',
    recipient: employee.email
  }, req);
}

// ============================================================================
// EXAMPLE 15: Performance Monitoring
// ============================================================================

// ❌ BAD - No performance tracking
const timesheets = await Timesheet.findAll({ /* ... */ });

// ✅ GOOD - Track and log performance
const perfStart = Date.now();
const timesheets = await Timesheet.findAll({ /* ... */ });
const perfDuration = Date.now() - perfStart;

if (perfDuration > 1000) {
  LogHelper.logPerformance('database_query_slow', perfDuration, {
    operation: 'Timesheet.findAll',
    threshold: 1000,
    exceeded: perfDuration - 1000,
    filterCount: Object.keys(where).length,
    includeCount: include?.length || 0,
    resultCount: timesheets.length
  }, req);
}

// ============================================================================
// EXAMPLE 16: Data Mutations (CRUD Operations)
// ============================================================================

// ❌ BAD - No logging of data changes
timesheet.status = 'submitted';
await timesheet.save();

// ✅ GOOD - Log data mutation with before/after
const beforeStatus = timesheet.status;
timesheet.status = 'submitted';
timesheet.submittedAt = new Date();
timesheet.submittedBy = req.userId;
await timesheet.save();

LogHelper.logDataMutation('update', 'Timesheet', {
  id: timesheet.id,
  before: { status: beforeStatus },
  after: { 
    status: timesheet.status,
    submittedAt: timesheet.submittedAt,
    submittedBy: timesheet.submittedBy
  },
  changedFields: ['status', 'submittedAt', 'submittedBy'],
  employeeId: timesheet.employeeId
}, req);

// ============================================================================
// EXAMPLE 17: Authentication Events
// ============================================================================

// ❌ BAD - Console.log for login
console.log('User logged in:', user.email);

// ✅ GOOD - Auth event logging (already done in auth.simple.js, but for reference)
LogHelper.logAuthEvent('login_success', true, {
  userId: user.id,
  email: user.email,
  role: user.role,
  employeeId: user.employeeId,
  loginMethod: 'password',
  ipAddress: req.ip,
  userAgent: req.get('user-agent')
}, req);

// ============================================================================
// EXAMPLE 18: Security Events
// ============================================================================

// ❌ BAD - Console.log for security issue
console.log('Unauthorized access attempt to admin endpoint');

// ✅ GOOD - Security event with severity
LogHelper.logSecurityEvent('unauthorized_access_attempt', 'high', {
  resource: req.path,
  method: req.method,
  userRole: req.userRole,
  requiredRole: 'admin',
  userId: req.userId,
  ipAddress: req.ip,
  userAgent: req.get('user-agent')
}, req);

// ============================================================================
// EXAMPLE 19: Sensitive Data Handling
// ============================================================================

// ❌ BAD - Logging password (NEVER DO THIS!)
console.log('Creating user:', { email, password, role });

// ✅ GOOD - Sanitize before logging
LogHelper.logBusinessEvent('user_creation', 
  LogHelper.sanitize({
    email,
    password, // Will be masked
    role,
    createdBy: req.userId
  }), 
  req
);

// ============================================================================
// EXAMPLE 20: Conditional Logging (Debug Only)
// ============================================================================

// ❌ BAD - Always log debug info
console.log('Debug: Query parameters:', req.query);

// ✅ GOOD - Use appropriate log level
const { logger } = require('../config/logger');
logger.debug('Query parameters received', {
  requestId: req.requestId,
  params: req.query,
  userId: req.userId
});

// This will only appear in logs when LOG_LEVEL=debug in .env

// ============================================================================
// REPLACEMENT CHECKLIST
// ============================================================================

/**
 * When replacing console.log/error in a route file:
 * 
 * 1. ✅ Add LogHelper import at top: const LogHelper = require('../utils/logHelper');
 * 
 * 2. ✅ Replace console.log with appropriate method:
 *    - Business operations → LogHelper.logBusinessEvent()
 *    - Errors → LogHelper.logError()
 *    - Validation failures → LogHelper.logValidationError()
 *    - Security issues → LogHelper.logSecurityEvent()
 *    - Performance issues → LogHelper.logPerformance()
 *    - Database operations → LogHelper.logDatabaseOperation()
 * 
 * 3. ✅ Always pass request object: logMethod(..., req)
 * 
 * 4. ✅ Use structured data (objects) instead of strings
 * 
 * 5. ✅ Include relevant IDs: timesheetId, employeeId, userId, projectId, etc.
 * 
 * 6. ✅ Sanitize sensitive data: Use LogHelper.sanitize() for user input
 * 
 * 7. ✅ Group related logs: Don't log in loops, aggregate data first
 * 
 * 8. ✅ Add context: operation name, resource type, action taken
 * 
 * 9. ✅ Remove emoji decorations: No need for 🔄, ✅, ❌ in structured logs
 * 
 * 10. ✅ Test the changes: Verify logs appear correctly in combined.log
 */

// ============================================================================
// QUICK REFERENCE: LogHelper Methods
// ============================================================================

/**
 * LogHelper.logBusinessEvent(event, data, req)
 * - Use for: Business operations, workflow steps
 * - Examples: timesheet_submitted, leave_approved, project_created
 * 
 * LogHelper.logSecurityEvent(event, severity, data, req)
 * - Use for: Security-related events
 * - Severity: 'low', 'medium', 'high', 'critical'
 * - Examples: unauthorized_access, failed_login, suspicious_activity
 * 
 * LogHelper.logAuthEvent(event, success, data, req)
 * - Use for: Authentication events
 * - Examples: login, logout, token_refresh
 * 
 * LogHelper.logAuthzEvent(event, allowed, data, req)
 * - Use for: Authorization checks
 * - Examples: access_granted, access_denied, permission_check
 * 
 * LogHelper.logDataMutation(action, model, data, req)
 * - Use for: CRUD operations
 * - Action: 'create', 'update', 'delete'
 * - Examples: create Employee, update Timesheet, delete Project
 * 
 * LogHelper.logPerformance(operation, duration, data, req)
 * - Use for: Performance monitoring
 * - Examples: slow_query, long_operation, high_memory
 * 
 * LogHelper.logDatabaseOperation(operation, model, data, req)
 * - Use for: Database queries
 * - Operation: 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
 * 
 * LogHelper.logExternalAPI(service, endpoint, data, req)
 * - Use for: External service calls
 * - Examples: EmailService, PaymentGateway, FileStorage
 * 
 * LogHelper.logError(error, context, req)
 * - Use for: All errors
 * - Always include context object with relevant IDs
 * 
 * LogHelper.logValidationError(errors, data, req)
 * - Use for: Input validation failures
 * - Errors format: [{ field, message }]
 * 
 * LogHelper.sanitize(obj)
 * - Use for: Removing sensitive data before logging
 * - Sanitizes: password, token, ssn, creditCard, etc.
 */

// ============================================================================
// END OF EXAMPLES
// ============================================================================

/**
 * For timesheet.routes.js replacement:
 * 
 * 1. Add at top:
 *    const LogHelper = require('../utils/logHelper');
 * 
 * 2. Remove logSubmission function (lines 18-40)
 *    - Replace with LogHelper calls directly in code
 * 
 * 3. Replace each console.log/error with appropriate LogHelper method
 * 
 * 4. Test by making API requests and checking logs/combined.log
 * 
 * Estimated time: 2-3 hours for timesheet.routes.js
 */

module.exports = {
  // This file is for reference only - not to be executed
  // Copy examples above and adapt to your specific route files
};
