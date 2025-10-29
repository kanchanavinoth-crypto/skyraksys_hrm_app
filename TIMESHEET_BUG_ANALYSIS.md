# Timesheet Route Bug Analysis
**Date:** October 28, 2025  
**File:** `backend/routes/timesheet.routes.js`  
**Error:** `ReferenceError: sanitizedData is not defined`

---

## Bug Summary

**Severity:** 🔴 **CRITICAL** - Blocks all timesheet creation  
**Type:** Undefined Variable Reference  
**Impact:** Complete failure of POST `/api/timesheets` endpoint

---

## Root Cause

The code references an undefined variable `sanitizedData` in 18 locations within the timesheet creation route (starting at line 1035).

### Expected Variable
```javascript
const value = req.validatedData;  // Line 1047 - This is the CORRECT variable
```

### Incorrect Usage
```javascript
sanitizedData.weekStartDate       // Line 1079 - UNDEFINED!
sanitizedData.projectId           // Line 1093 - UNDEFINED!
sanitizedData.taskId              // Line 1094 - UNDEFINED!
sanitizedData.mondayHours         // Lines 1108-1124 - UNDEFINED!
// ... 18 total occurrences
```

---

## Affected Code Sections

### 1. Error Handling Block (Line 1079)
```javascript
// ❌ BROKEN
received: sanitizedData.weekStartDate,

// ✅ SHOULD BE
received: value.weekStartDate,
```

### 2. Duplicate Check Query (Lines 1093-1094)
```javascript
// ❌ BROKEN
projectId: sanitizedData.projectId,
taskId: sanitizedData.taskId,

// ✅ SHOULD BE
projectId: value.projectId,
taskId: value.taskId,
```

### 3. Draft Update Logic (Lines 1108-1124)
```javascript
// ❌ BROKEN - All 17 occurrences in this block
const totalHours = (sanitizedData.mondayHours || 0) +
                 (sanitizedData.tuesdayHours || 0) +
                 // ... etc

await existingTimesheet.update({
    mondayHours: sanitizedData.mondayHours || 0,
    tuesdayHours: sanitizedData.tuesdayHours || 0,
    // ... etc
});

// ✅ SHOULD BE
const totalHours = (value.mondayHours || 0) +
                 (value.tuesdayHours || 0) +
                 // ... etc

await existingTimesheet.update({
    mondayHours: value.mondayHours || 0,
    tuesdayHours: value.tuesdayHours || 0,
    // ... etc
});
```

---

## Evidence from Testing

### Test Command
```bash
node backend/test-timesheet-workflow.js
```

### Error Output
```
--- Test 3: CREATE weekly timesheet ---
❌ Failed to create timesheet: 500
   Message: sanitizedData is not defined
```

### Test Payload (Valid)
```javascript
{
  employeeId: "44e1c634-485f-46ac-b9d9-f9b8b832a553",
  projectId: "valid-uuid",
  weekStartDate: "2025-10-21",  // Monday
  weekEndDate: "2025-10-27",    // Sunday
  entries: [
    { date: "2025-10-21", hours: 8, taskId: "...", description: "..." },
    { date: "2025-10-22", hours: 8, taskId: "...", description: "..." },
    // ... 5 entries total
  ],
  status: "Draft"
}
```

**Result:** 500 Internal Server Error on line 1079 (first occurrence of `sanitizedData`)

---

## Impact Analysis

### Affected Operations
1. ❌ **CREATE new timesheet** - Completely broken
2. ❌ **UPDATE existing draft timesheet** - Broken (lines 1108-1124)
3. ✅ **GET timesheets** - Working (different route)
4. ✅ **SUBMIT timesheet** - Working (different route)
5. ✅ **APPROVE timesheet** - Working (different route)

### User Impact
- Employees **CANNOT** create new timesheets
- Employees **CANNOT** update draft timesheets
- System appears to work (GET returns data) but creation fails
- No error is logged to user - just generic 500 error

### Data Integrity
- ✅ No data corruption risk (operation fails before DB write)
- ✅ Existing timesheets are safe
- ❌ New timesheet creation impossible

---

## Fix Required

### Simple Find & Replace
**In file:** `backend/routes/timesheet.routes.js`  
**Lines:** 1079, 1093, 1094, 1108-1124 (18 total)  
**Action:** Replace all instances of `sanitizedData` with `value`

### Specific Changes

**Line 1079:**
```diff
- received: sanitizedData.weekStartDate,
+ received: value.weekStartDate,
```

**Lines 1093-1094:**
```diff
- projectId: sanitizedData.projectId,
- taskId: sanitizedData.taskId,
+ projectId: value.projectId,
+ taskId: value.taskId,
```

**Lines 1108-1124 (15 occurrences):**
```diff
- const totalHours = (sanitizedData.mondayHours || 0) +
-                  (sanitizedData.tuesdayHours || 0) +
-                  (sanitizedData.wednesdayHours || 0) +
-                  (sanitizedData.thursdayHours || 0) +
-                  (sanitizedData.fridayHours || 0) +
-                  (sanitizedData.saturdayHours || 0) +
-                  (sanitizedData.sundayHours || 0);
+ const totalHours = (value.mondayHours || 0) +
+                  (value.tuesdayHours || 0) +
+                  (value.wednesdayHours || 0) +
+                  (value.thursdayHours || 0) +
+                  (value.fridayHours || 0) +
+                  (value.saturdayHours || 0) +
+                  (value.sundayHours || 0);

- mondayHours: sanitizedData.mondayHours || 0,
- tuesdayHours: sanitizedData.tuesdayHours || 0,
- wednesdayHours: sanitizedData.wednesdayHours || 0,
- thursdayHours: sanitizedData.thursdayHours || 0,
- fridayHours: sanitizedData.fridayHours || 0,
- saturdayHours: sanitizedData.saturdayHours || 0,
- sundayHours: sanitizedData.sundayHours || 0,
- description: sanitizedData.description || '',
+ mondayHours: value.mondayHours || 0,
+ tuesdayHours: value.tuesdayHours || 0,
+ wednesdayHours: value.wednesdayHours || 0,
+ thursdayHours: value.thursdayHours || 0,
+ fridayHours: value.fridayHours || 0,
+ saturdayHours: value.saturdayHours || 0,
+ sundayHours: value.sundayHours || 0,
+ description: value.description || '',
```

---

## Verification Steps

### 1. Apply Fix
```bash
# In backend/routes/timesheet.routes.js
# Replace all 18 occurrences of sanitizedData with value
```

### 2. Restart Server
```bash
cd backend
npm run dev
```

### 3. Run Test Again
```bash
node test-timesheet-workflow.js
```

### 4. Expected Result
```
--- Test 3: CREATE weekly timesheet ---
✅ Created weekly timesheet
   ID: [uuid]
   Week: 2025-10-21 to 2025-10-27
   Entries: 5
   Total Hours: 40
   Status: Draft
```

---

## How This Bug Happened

### Likely Scenario
1. Developer started refactoring to use `sanitizeTimesheetData()` utility (imported at line 9)
2. Intended to add: `const sanitizedData = sanitizeTimesheetData(value);`
3. Started replacing `value` with `sanitizedData` in the code
4. Never completed the refactoring (forgot to add the sanitization call)
5. Code was committed/deployed with incomplete changes

### Evidence
- Import exists: `const { sanitizeTimesheetData, ... } = require('../utils/sanitizer');` (line 9)
- Function is never called in the route
- Variable references exist but variable is never declared
- Later in the same file (lines 1200+), code correctly uses `value`

### Code Quality Issue
- ⚠️ **No TypeScript** - Would have caught this at compile time
- ⚠️ **No linting on commit** - ESLint would flag undefined variable
- ⚠️ **No unit tests** - Route was never tested after change
- ⚠️ **No integration tests** - Would have caught 500 error immediately

---

## Prevention Recommendations

### 1. Immediate (Pre-Deployment)
- ✅ Run ESLint: `npx eslint backend/routes/timesheet.routes.js`
- ✅ Add pre-commit hooks with ESLint
- ✅ Require all routes to have at least one integration test

### 2. Short-Term (Code Quality)
- Migrate to TypeScript for type safety
- Add `"strict": true` mode for variables
- Implement automated API testing in CI/CD
- Add code coverage requirements (minimum 70%)

### 3. Long-Term (Process)
- Mandatory code review before merge
- Automated E2E tests for all CRUD operations
- Staging environment testing before production
- Feature flags for gradual rollout

---

## Related Files to Check

### Similar Patterns (Potential Bugs)
```bash
# Search for similar issues in other routes
grep -r "sanitizedData" backend/routes/

# Check if sanitizeTimesheetData is used anywhere
grep -r "sanitizeTimesheetData" backend/
```

### Other Routes to Review
- `payroll.routes.js` - May have similar refactoring issues
- `leave.routes.js` - Check for undefined variable references
- `employee.routes.js` - Verify data sanitization is consistent

---

## Testing After Fix

### Test Cases
1. ✅ Create new timesheet (Draft)
2. ✅ Update existing draft timesheet
3. ✅ Create timesheet with zero hours
4. ✅ Create timesheet with invalid project ID
5. ✅ Create timesheet with invalid task ID
6. ✅ Create duplicate timesheet (should block)
7. ✅ Create timesheet for non-Monday date (should reject)

### Full Workflow Test
```bash
# Run comprehensive timesheet tests
cd backend
node test-timesheet-workflow.js

# Expected: All tests pass
# ✅ Test 1: GET all timesheets - Pass
# ✅ Test 2: GET projects - Pass
# ✅ Test 3: CREATE weekly timesheet - Pass
# ✅ Test 4: UPDATE timesheet entry - Pass
# ✅ Test 5: SUBMIT timesheet - Pass
# ✅ Test 6: APPROVE timesheet - Pass
# ✅ Test 7: GET pending timesheets - Pass
# ✅ Test 8: DELETE timesheet - Pass
```

---

## Conclusion

**Status:** 🔴 **BLOCKING BUG**  
**Priority:** P0 - Critical  
**Action Required:** Immediate hotfix  
**Estimated Fix Time:** 5 minutes  
**Testing Time:** 10 minutes  
**Total Time to Resolution:** 15 minutes

This is a simple typo/incomplete refactoring that completely blocks timesheet creation. The fix is trivial (find & replace), but the impact is severe as it prevents employees from logging their work hours.

**Recommendation:** Apply fix immediately, add integration test, and redeploy.
