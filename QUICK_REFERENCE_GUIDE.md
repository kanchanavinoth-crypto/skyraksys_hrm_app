# Quick Reference Guide - Phase 1 Improvements

## For Developers

### Using Validation in Routes

```javascript
// 1. Import validators
const { validate, validateQuery, validateParams } = require('../middleware/validate');
const validators = require('../middleware/validators');

// 2. Apply to routes
router.post('/employees', 
  authenticateToken,
  validate(validators.createEmployeeSchema),  // Validates req.body
  async (req, res, next) => {
    try {
      const employee = await Employee.create(req.validatedData);  // Use validatedData
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);  // Pass to error handler
    }
  }
);

// 3. Query parameters
router.get('/employees',
  authenticateToken,
  validateQuery(validators.employeeQuerySchema),  // Validates req.query
  async (req, res, next) => {
    const { page, limit, search } = req.validatedQuery;  // Use validatedQuery
    // ... your code
  }
);

// 4. URL parameters
router.get('/employees/:id',
  authenticateToken,
  validateParams(validators.uuidParamSchema),  // Validates req.params
  async (req, res, next) => {
    const employee = await Employee.findByPk(req.validatedParams.id);
    // ... your code
  }
);
```

### Using Error Classes

```javascript
// Import error classes
const { 
  NotFoundError, 
  ConflictError, 
  ValidationError,
  UnauthorizedError,
  ForbiddenError
} = require('../utils/errors');

// Use in controllers
router.get('/employees/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    
    if (!employee) {
      throw new NotFoundError('Employee not found');  // Returns 404
    }
    
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);  // Centralized handler formats the response
  }
});

// Check permissions
if (req.user.role !== 'admin') {
  throw new ForbiddenError('Admin access required');  // Returns 403
}

// Check for conflicts
if (existingRecord) {
  throw new ConflictError('Resource already exists');  // Returns 409
}

// Custom validation
if (startDate > endDate) {
  throw new ValidationError('Invalid date range', [
    { field: 'endDate', message: 'End date must be after start date' }
  ]);  // Returns 400
}
```

### Available Validation Schemas

#### Authentication
- `loginSchema` - Email + password
- `registerSchema` - User registration with strong password
- `changePasswordSchema` - Current + new password
- `forgotPasswordSchema` - Email for reset
- `resetPasswordSchema` - Token + new password
- `updateProfileSchema` - Profile updates
- `updateRoleSchema` - Role changes (admin only)
- `updateUserStatusSchema` - Activate/deactivate

#### Employees
- `createEmployeeSchema` - Full employee creation
- `updateEmployeeSchema` - Partial employee updates
- `employeeQuerySchema` - List/search parameters (page, limit, search, department, status, sort, order)
- `uuidParamSchema` - UUID validation for :id params

#### Timesheets
- `createTimesheetSchema` - Timesheet creation (validates Monday-Sunday week)
- `bulkSubmitTimesheetSchema` - Bulk submission (max 10)
- `updateTimesheetStatusSchema` - Status changes (requires comments for rejection)
- `updateTimesheetSchema` - Entry updates
- `timesheetQuerySchema` - Filtering (page, limit, employeeId, projectId, status, dates)
- `weekParamSchema` - Week validation (must be Monday)
- `timesheetApprovalSchema` - Approve/reject actions

#### Leave Requests
- `createLeaveRequestSchema` - Leave creation (future dates, max 90 days)
- `updateLeaveStatusSchema` - Status updates (requires comments for rejection)
- `leaveQuerySchema` - Filtering (page, limit, employee, type, status, dates, year, month)
- `leaveBalanceQuerySchema` - Balance lookups by employee/type/year
- `updateLeaveBalanceSchema` - Balance adjustments
- `bulkLeaveApprovalSchema` - Bulk approval (max 50)
- `leaveCalendarSchema` - Calendar view (max 180 days range)

## For Database Admins

### Running the Index Migration

```bash
# Navigate to backend
cd backend

# Run migration
npx sequelize-cli db:migrate

# Verify indexes were created
npx sequelize-cli db:migrate:status

# If needed, rollback
npx sequelize-cli db:migrate:undo
```

### Verifying Index Performance

```sql
-- Check if indexes are being used
EXPLAIN ANALYZE 
SELECT * FROM timesheets 
WHERE "employeeId" = 'uuid-here' 
AND "weekStartDate" >= '2024-01-01';

-- Should show "Index Scan using idx_timesheets_employee_week"
-- Not "Seq Scan on timesheets"

-- View all indexes on a table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'timesheets';

-- Check index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('timesheets', 'leave_requests', 'employees', 'payrolls', 'audit_logs', 'leave_balances')
ORDER BY idx_scan DESC;
```

### Indexes Added

**13 indexes across 6 tables:**

1. Timesheets (4): employee_week, status, project, created_at
2. Leave Requests (3): employee_status, dates, type
3. Payrolls (2): employee_period, status
4. Audit Logs (2): user_action, resource
5. Employees (2): dept_position (partial), status
6. Leave Balances (1): employee_type_year

All created with `CONCURRENTLY` for non-blocking operation.

## For QA/Testers

### Testing Validation

#### Valid Request (Should Succeed)
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "SKYT001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "dateOfBirth": "1990-01-01",
    "departmentId": "uuid-here",
    "positionId": "uuid-here",
    "hireDate": "2024-01-01",
    "basicSalary": 50000
  }'
```

#### Invalid Request (Should Return 400)
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "INVALID",
    "firstName": "J",
    "email": "not-an-email",
    "phone": "123",
    "basicSalary": -1000
  }'

# Expected response:
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "employeeId",
      "message": "Employee ID must start with SKYT followed by at least 3 digits"
    },
    {
      "field": "firstName",
      "message": "First name must be at least 2 characters"
    },
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "phone",
      "message": "Phone number must be exactly 10 digits"
    },
    {
      "field": "basicSalary",
      "message": "Basic salary must be a positive number"
    }
  ]
}
```

### Error Response Formats

#### 400 - Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" }
  ]
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Invalid token"
}
```

#### 403 - Forbidden
```json
{
  "success": false,
  "message": "You don't have permission to access this resource"
}
```

#### 404 - Not Found
```json
{
  "success": false,
  "message": "Employee not found"
}
```

#### 409 - Conflict
```json
{
  "success": false,
  "message": "Resource already exists"
}
```

#### 500 - Server Error
```json
{
  "success": false,
  "message": "An unexpected error occurred"
}
```

## Common Issues & Solutions

### Issue: Validation not working
**Solution:** Ensure validation middleware is applied BEFORE the route handler:
```javascript
router.post('/resource', validate(schema), handler);  // ✅ Correct
router.post('/resource', handler, validate(schema));  // ❌ Wrong
```

### Issue: Can't access validated data
**Solution:** Use the correct property:
```javascript
req.validatedData   // For req.body
req.validatedQuery  // For req.query
req.validatedParams // For req.params
```

### Issue: Error not formatted correctly
**Solution:** Make sure to pass error to `next()`:
```javascript
try {
  // ... code
} catch (error) {
  next(error);  // ✅ Correct - centralized handler formats it
}

// Don't do this:
catch (error) {
  res.status(500).json({ error });  // ❌ Wrong - inconsistent format
}
```

### Issue: Custom validation not working
**Solution:** Use Joi's `custom()` method:
```javascript
const schema = Joi.object({
  endDate: Joi.date()
    .required()
    .custom((value, helpers) => {
      const startDate = helpers.state.ancestors[0].startDate;
      if (value < startDate) {
        return helpers.error('any.invalid', { 
          message: 'End date must be after start date' 
        });
      }
      return value;
    })
});
```

## Performance Tips

### Query Optimization
```javascript
// ❌ Bad - N+1 queries
const employees = await Employee.findAll();
for (const emp of employees) {
  console.log(emp.department.name);  // Triggers query per employee
}

// ✅ Good - Single query with join
const employees = await Employee.findAll({
  include: [
    { model: Department, as: 'department' }
  ]
});
for (const emp of employees) {
  console.log(emp.department.name);  // No additional query
}
```

### Index Usage
```javascript
// ✅ Good - Uses idx_timesheets_employee_week
const timesheets = await Timesheet.findAll({
  where: { 
    employeeId: id,
    weekStartDate: { [Op.gte]: startDate }
  }
});

// ⚠️ Suboptimal - Can't use composite index efficiently
const timesheets = await Timesheet.findAll({
  where: { 
    weekStartDate: { [Op.gte]: startDate }
    // Missing employeeId - can't use composite index
  }
});
```

## Contact

For questions about Phase 1 implementation:
- See `VALIDATION_INTEGRATION.md` for detailed integration guide
- See `PHASE1_IMPLEMENTATION_SUMMARY.md` for complete overview
- See `guides/10-RECOMMENDATIONS.md` for full roadmap

---

**Last Updated:** October 27, 2024  
**Phase:** Phase 1 (Critical) - Completed
