# Validation Integration Guide

This document provides examples of how to integrate the new validation middleware and schemas into existing routes.

## Overview

We've created a standardized validation system with:
- **Validation Middleware** (`backend/middleware/validate.js`)
- **Validation Schemas** (`backend/middleware/validators/*.validator.js`)
- **Error Classes** (`backend/utils/errors.js`)

## Integration Steps

### 1. Import the Validation Utilities

```javascript
// At the top of your route file
const { validate, validateQuery, validateParams } = require('../middleware/validate');
const validators = require('../middleware/validators');
```

### 2. Apply Validation to Routes

#### Example 1: Body Validation (POST/PUT requests)

**Before:**
```javascript
router.post('/employees', authenticateToken, async (req, res) => {
  try {
    // Manual validation or no validation
    const employee = await Employee.create(req.body);
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

**After:**
```javascript
router.post('/employees', 
  authenticateToken, 
  validate(validators.createEmployeeSchema),  // Add validation middleware
  async (req, res) => {
    try {
      // req.validatedData contains the validated and sanitized data
      const employee = await Employee.create(req.validatedData);
      res.json({ success: true, data: employee });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);
```

#### Example 2: Query Parameter Validation (GET requests)

**Before:**
```javascript
router.get('/employees', authenticateToken, async (req, res) => {
  try {
    const { page, limit, search, department } = req.query;
    // No validation of query parameters
    const employees = await Employee.findAll({ /* ... */ });
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

**After:**
```javascript
router.get('/employees', 
  authenticateToken,
  validateQuery(validators.employeeQuerySchema),  // Validate query params
  async (req, res) => {
    try {
      // req.validatedQuery contains validated query parameters with defaults
      const { page, limit, search, department, sort, order } = req.validatedQuery;
      const offset = (page - 1) * limit;
      
      const employees = await Employee.findAll({
        where: buildWhereClause(search, department),
        order: [[sort, order]],
        limit,
        offset
      });
      
      res.json({ success: true, data: employees });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);
```

#### Example 3: URL Parameter Validation

**Before:**
```javascript
router.get('/employees/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

**After:**
```javascript
router.get('/employees/:id', 
  authenticateToken,
  validateParams(validators.uuidParamSchema),  // Validate UUID format
  async (req, res) => {
    try {
      const employee = await Employee.findByPk(req.validatedParams.id);
      if (!employee) {
        throw new NotFoundError('Employee not found');
      }
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);  // Pass to error handler
    }
  }
);
```

### 3. Use Custom Error Classes

**Before:**
```javascript
router.post('/timesheets', authenticateToken, async (req, res) => {
  try {
    const existing = await Timesheet.findOne({ where: { /* ... */ } });
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: 'Timesheet already exists for this week' 
      });
    }
    
    const timesheet = await Timesheet.create(req.body);
    res.json({ success: true, data: timesheet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
```

**After:**
```javascript
const { 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} = require('../utils/errors');

router.post('/timesheets', 
  authenticateToken,
  validate(validators.createTimesheetSchema),
  async (req, res, next) => {
    try {
      const existing = await Timesheet.findOne({ 
        where: { 
          employeeId: req.validatedData.employeeId,
          weekStartDate: req.validatedData.weekStartDate
        } 
      });
      
      if (existing) {
        throw new ConflictError('Timesheet already exists for this week');
      }
      
      const timesheet = await Timesheet.create(req.validatedData);
      res.json({ success: true, data: timesheet });
    } catch (error) {
      next(error);  // Pass to centralized error handler
    }
  }
);
```

## Complete Route Example

Here's a complete example of a properly validated and error-handled route file:

```javascript
const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth.simple');
const { validate, validateQuery, validateParams } = require('../middleware/validate');
const validators = require('../middleware/validators');
const { 
  NotFoundError, 
  ConflictError, 
  ForbiddenError 
} = require('../utils/errors');
const db = require('../models');

const router = express.Router();
const { LeaveRequest, Employee, LeaveType } = db;

// Get all leave requests with filtering
router.get('/',
  authenticateToken,
  validateQuery(validators.leaveQuerySchema),
  async (req, res, next) => {
    try {
      const { page, limit, employeeId, status, startDate, endDate } = req.validatedQuery;
      const offset = (page - 1) * limit;

      // Build where clause based on role
      const where = {};
      if (req.user.role === 'employee') {
        where.employeeId = req.user.employeeId;
      } else if (employeeId) {
        where.employeeId = employeeId;
      }
      if (status) where.status = status;
      if (startDate) where.startDate = { [Op.gte]: startDate };
      if (endDate) where.endDate = { [Op.lte]: endDate };

      const { count, rows } = await LeaveRequest.findAndCountAll({
        where,
        include: [
          { model: Employee, as: 'employee' },
          { model: LeaveType, as: 'leaveType' }
        ],
        limit,
        offset,
        order: [['startDate', 'DESC']]
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create leave request
router.post('/',
  authenticateToken,
  validate(validators.createLeaveRequestSchema),
  async (req, res, next) => {
    try {
      // Check for overlapping leave requests
      const overlapping = await LeaveRequest.findOne({
        where: {
          employeeId: req.validatedData.employeeId,
          status: { [Op.in]: ['Pending', 'Approved'] },
          [Op.or]: [
            {
              startDate: {
                [Op.between]: [req.validatedData.startDate, req.validatedData.endDate]
              }
            },
            {
              endDate: {
                [Op.between]: [req.validatedData.startDate, req.validatedData.endDate]
              }
            }
          ]
        }
      });

      if (overlapping) {
        throw new ConflictError('Leave request overlaps with existing leave');
      }

      const leaveRequest = await LeaveRequest.create(req.validatedData);
      
      res.status(201).json({
        success: true,
        message: 'Leave request created successfully',
        data: leaveRequest
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update leave request status (Manager/HR/Admin only)
router.patch('/:id/status',
  authenticateToken,
  authorize('manager', 'hr', 'admin'),
  validateParams(validators.uuidParamSchema),
  validate(validators.updateLeaveStatusSchema),
  async (req, res, next) => {
    try {
      const leaveRequest = await LeaveRequest.findByPk(req.validatedParams.id, {
        include: [{ model: Employee, as: 'employee' }]
      });

      if (!leaveRequest) {
        throw new NotFoundError('Leave request not found');
      }

      // Managers can only approve their team members
      if (req.user.role === 'manager') {
        const employee = leaveRequest.employee;
        if (employee.managerId !== req.user.employeeId) {
          throw new ForbiddenError('You can only approve leave for your team members');
        }
      }

      await leaveRequest.update({
        status: req.validatedData.status,
        approverComments: req.validatedData.approverComments,
        approvedBy: req.user.id,
        approvedAt: new Date()
      });

      res.json({
        success: true,
        message: `Leave request ${req.validatedData.status.toLowerCase()} successfully`,
        data: leaveRequest
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
```

## Error Handling

Add this centralized error handler at the end of your `server.js` or `app.js`:

```javascript
const { AppError } = require('./utils/errors');

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      errors: err.errors.map(e => ({
        field: e.path,
        message: `${e.path} must be unique`
      }))
    });
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
});
```

## Migration Checklist

For each route file:

1. ✅ Import validation middleware and schemas
2. ✅ Import error classes
3. ✅ Add `validate()` to POST/PUT/PATCH routes
4. ✅ Add `validateQuery()` to GET routes with query params
5. ✅ Add `validateParams()` to routes with URL params
6. ✅ Replace manual validation with validated data
7. ✅ Replace status code responses with error classes
8. ✅ Add `next` parameter to route handlers
9. ✅ Replace `res.status().json()` error responses with `throw new ErrorClass()`
10. ✅ Test each route after migration

## Benefits

- **Consistent validation** across all endpoints
- **Automatic type coercion** (strings to numbers, dates, etc.)
- **Clear error messages** with field-specific details
- **Reduced boilerplate** code in controllers
- **Centralized error handling**
- **Better security** through input sanitization
- **Self-documenting** code via schemas

## Next Steps

1. Start with authentication routes (already have some validation)
2. Move to employee routes
3. Then timesheet routes
4. Then leave routes
5. Finally, remaining routes (payroll, attendance, etc.)

Each route should be tested individually after migration to ensure no breaking changes.
