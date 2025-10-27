# Leave Balance Backend Fixes - October 25, 2025

## Issues Found and Fixed

### Issue 1: Invalid Employee Status Enum Value ❌→✅
**Error:** `invalid input value for enum enum_employees_status: "active"`

**Root Cause:**
- Code was using lowercase `'active'` 
- Database enum uses capitalized `'Active'`
- Valid enum values: `Active`, `Inactive`, `On Leave`, `Terminated`

**Fix Applied:**
- **File:** `backend/routes/leave-balance-admin.routes.js`
- **Line:** 314
- **Change:**
  ```javascript
  // Before
  where: { status: 'active' }
  
  // After  
  where: { status: 'Active' } // Capital 'A' to match enum
  ```

**Impact:** Bulk initialize endpoint now works correctly

---

### Issue 2: Invalid LeaveType Attribute Name ❌→✅
**Error:** `column LeaveType.maxDays does not exist`

**Root Cause:**
- Code was requesting `'maxDays'` attribute
- Actual column name is `'maxDaysPerYear'`
- LeaveType model definition shows correct name

**Fixes Applied:**

#### Fix 2a: `/meta/balance` endpoint
- **File:** `backend/routes/leave.routes.js`
- **Line:** 93
- **Change:**
  ```javascript
  // Before
  attributes: ['id', 'name', 'description', 'maxDays']
  
  // After
  attributes: ['id', 'name', 'description', 'maxDaysPerYear']
  ```

#### Fix 2b: `/balance` endpoint
- **File:** `backend/routes/leave.routes.js`
- **Line:** 117
- **Change:**
  ```javascript
  // Before
  attributes: ['id', 'name', 'description', 'maxDays']
  
  // After
  attributes: ['id', 'name', 'description', 'maxDaysPerYear']
  ```

**Impact:** Leave balance fetch endpoints now work correctly

---

## Files Modified

### 1. `backend/routes/leave-balance-admin.routes.js`
**Changes:**
- Line 314: Changed `status: 'active'` to `status: 'Active'`
- Added comment explaining enum case requirement

### 2. `backend/routes/leave.routes.js`
**Changes:**
- Line 93: Changed `maxDays` to `maxDaysPerYear` in `/meta/balance` endpoint
- Line 95: Added error logging
- Line 117: Changed `maxDays` to `maxDaysPerYear` in `/balance` endpoint
- Line 127: Added error logging

---

## Database Schema Reference

### Employee Status Enum
```sql
enum enum_employees_status {
  'Active',
  'Inactive',
  'On Leave',
  'Terminated'
}
```

### LeaveType Table Structure
```javascript
{
  id: UUID,
  name: STRING,
  description: TEXT,
  maxDaysPerYear: INTEGER,     // ← Correct attribute name
  carryForward: BOOLEAN,
  maxCarryForwardDays: INTEGER,
  isActive: BOOLEAN
}
```

---

## Testing Results

### Before Fixes
```
❌ GET /api/leaves/balance
   → 500 Internal Server Error
   → Error: column LeaveType.maxDays does not exist

❌ POST /api/admin/leave-balances/bulk/initialize
   → 500 Internal Server Error
   → Error: invalid input value for enum: "active"
```

### After Fixes
```
✅ GET /api/leaves/balance
   → 200 OK
   → Returns leave balance data correctly

✅ POST /api/admin/leave-balances/bulk/initialize
   → 200 OK
   → Successfully initializes leave balances
```

---

## Diagnostic Script Created

**File:** `backend/check-leave-balance-tables.js`

**Purpose:** Verify database tables and associations

**What it checks:**
1. LeaveBalance table exists and record count
2. LeaveType table exists with list of types
3. Employee table exists with active count
4. Association relationships work correctly

**Usage:**
```bash
cd backend
node check-leave-balance-tables.js
```

**Output:**
```
✓ LeaveBalance table exists with 3 records
✓ LeaveType table exists with 3 records
  Leave Types:
    - Annual Leave
    - Sick Leave
    - Personal Leave
✓ Employee table exists with 19 records
✓ Associations working correctly
```

---

## Related Endpoints Status

### Working Endpoints ✅
1. `GET /api/admin/leave-balances` - List all leave balances
2. `GET /api/admin/leave-balances/:id` - Get single balance
3. `POST /api/admin/leave-balances` - Create leave balance
4. `PUT /api/admin/leave-balances/:id` - Update leave balance
5. `DELETE /api/admin/leave-balances/:id` - Delete leave balance
6. `POST /api/admin/leave-balances/bulk/initialize` - Bulk initialize ✅ Fixed
7. `GET /api/admin/leave-balances/summary/overview` - Summary stats
8. `GET /api/leaves/balance` - Get employee leave balance ✅ Fixed
9. `GET /api/leaves/meta/balance` - Get employee meta balance ✅ Fixed

### Helper Endpoints ✅
- `GET /api/admin/leave-balances/employees` - List all employees
- `GET /api/admin/leave-balances/leave-types` - List all leave types

---

## Best Practices Applied

### 1. Error Logging
Added `console.error()` to catch blocks for better debugging:
```javascript
catch (error) {
  console.error('Error fetching leave balance:', error);
  res.status(500).json({ success: false, message: '...' });
}
```

### 2. Code Comments
Added explanatory comments for enum value requirements:
```javascript
where: { status: 'Active' } // Capital 'A' to match enum
```

### 3. Consistent Naming
Used correct database column names throughout:
- `maxDaysPerYear` ✅ (not `maxDays` ❌)
- `'Active'` ✅ (not `'active'` ❌)

---

## Future Recommendations

### 1. Create Constants File
```javascript
// backend/constants/employee.js
module.exports = {
  EMPLOYEE_STATUS: {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    ON_LEAVE: 'On Leave',
    TERMINATED: 'Terminated'
  }
};

// Usage
const { EMPLOYEE_STATUS } = require('../constants/employee');
where: { status: EMPLOYEE_STATUS.ACTIVE }
```

### 2. Add Database Migration Validation
Create a script to validate that code constants match database enums.

### 3. Add Integration Tests
Test all leave balance endpoints with real database interactions.

### 4. Add API Documentation
Document all endpoints with Swagger/OpenAPI specifications.

---

## Summary

### Issues Fixed: 2
1. ✅ Employee status enum case mismatch
2. ✅ LeaveType attribute name mismatch

### Files Modified: 2
1. `backend/routes/leave-balance-admin.routes.js`
2. `backend/routes/leave.routes.js`

### Endpoints Fixed: 3
1. POST `/api/admin/leave-balances/bulk/initialize`
2. GET `/api/leaves/balance`
3. GET `/api/leaves/meta/balance`

### Status: All Fixed and Working ✅

---

**Date:** October 25, 2025  
**Branch:** release-2.0.0  
**Impact:** Critical - Leave balance functionality now fully operational
