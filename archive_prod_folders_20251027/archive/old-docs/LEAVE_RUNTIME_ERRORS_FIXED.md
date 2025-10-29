# Leave Management & Request - Runtime Error Fixes ✅

## Issues Fixed

### 1. LeaveManagement.js - Undefined employeeName Error ✅

**Problem:** `Cannot read properties of undefined (reading 'split')`

**Root Cause:** 
- API returns data with different structure than expected
- `request.employeeName` or `employee.employeeName` might be undefined
- Code tried to call `.split()` on undefined value

**Fixed Locations:**

#### A. Leave Requests Table (Line ~298)
```javascript
// Before
{request.employeeName.split(' ').map(n => n[0]).join('')}

// After
const employeeName = request.employeeName || 
                    (request.employee ? `${request.employee.firstName} ${request.employee.lastName}` : '') ||
                    'Unknown Employee';
const employeeId = request.employeeId || request.employee?.employeeId || 'N/A';

{employeeName.split(' ').map(n => n[0]).join('')}
```

#### B. Leave Balances Tab (Line ~425)
```javascript
// Before
{employee.employeeName.split(' ').map(n => n[0]).join('')}

// After  
const employeeName = employee.employeeName || 
                     (employee.employee ? `${employee.employee.firstName} ${employee.employee.lastName}` : '') ||
                     'Unknown Employee';
const employeeId = employee.employeeId || employee.employee?.employeeId || 'N/A';
const department = employee.department || employee.employee?.department || 'N/A';

{employeeName.split(' ').map(n => n[0]).join('')}
```

**Additional Safety Features:**
- Empty state handling with Alert message
- Null checks before mapping `leaveBalances`
- Fallback message when no balance data exists
- Safe property access using optional chaining (`?.`)

---

### 2. AddLeaveRequestModern.js - Enhanced Debugging ✅

**Problem:** 
- Leave balance not displaying for system admin
- Submit errors not showing clear messages

**Improvements:**

#### A. Enhanced Balance Loading
```javascript
const loadLeaveBalance = async () => {
  try {
    console.log('Loading leave balance...', { 
      employeeId: formData.employeeId, 
      leaveTypeId: formData.leaveTypeId 
    });
    
    const response = await LeaveDataService.getLeaveBalances();
    console.log('Balance API response:', response.data);
    
    if (response.data.success && response.data.data) {
      const balance = response.data.data.find(
        b => b.leaveTypeId === parseInt(formData.leaveTypeId)
      );
      console.log('Found balance:', balance);
      setLeaveBalance(balance || null);
      
      if (!balance) {
        console.warn('No balance found for leave type:', formData.leaveTypeId);
      }
    }
  } catch (err) {
    console.error('Error loading leave balance:', err);
    console.error('Error details:', err.response?.data);
    setLeaveBalance(null);
  }
};
```

#### B. Enhanced Submit Error Handling
```javascript
try {
  console.log('Submitting leave request:', data);
  const response = await LeaveDataService.create(data);
  console.log('Submit response:', response.data);
  
  // ... success handling
} catch (err) {
  console.error('Error submitting leave request:', err);
  console.error('Error response:', err.response?.data);
  console.error('Error status:', err.response?.status);
  
  const errorMsg = err.response?.data?.message || 
                   err.message || 
                   'Failed to submit leave request. Please try again.';
  setError(errorMsg);
}
```

---

## Debugging Steps for "Leave Balance Not Displayed"

### Step 1: Check Console Logs
When you select a leave type, check browser console (F12) for:

```
Loading leave balance... { employeeId: X, leaveTypeId: Y }
Balance API response: { success: true, data: [...] }
Found balance: { id: X, leaveTypeId: Y, balance: 5, ... }
```

### Step 2: Verify Leave Balance Exists in Database

**Option A: Via Admin Panel**
1. Navigate to `/admin/leave-balances`
2. Check if system admin has balance records
3. Verify leave type ID matches

**Option B: Via Database**
```sql
SELECT * FROM leave_balances 
WHERE employeeId = (SELECT id FROM employees WHERE username = 'admin')
AND year = 2025;
```

### Step 3: Common Issues & Solutions

#### Issue: No balance records found
```
Console: "No balance found for leave type: X"
```

**Solution:** Create balance via Admin → Leave Balances
1. Navigate to `/admin/leave-balances`
2. Click "Add Balance" or "Bulk Initialize"
3. Set allocations for system admin

#### Issue: LeaveTypeId mismatch
```
Console shows: leaveTypeId: 1
But balance has: leaveTypeId: 2
```

**Solution:** Ensure leave type IDs match between:
- Leave Types (from API `/leaves/meta/types`)
- Leave Balances (from API `/leaves/meta/balance`)

#### Issue: API returns empty array
```
Balance API response: { success: true, data: [] }
```

**Solution:** Check if:
1. User is authenticated (JWT token valid)
2. Leave balances exist for this user
3. Backend route `/leaves/meta/balance` is working

#### Issue: API authentication error
```
Error status: 401
Error response: { message: "Unauthorized" }
```

**Solution:**
1. Re-login to refresh JWT token
2. Check if token is being sent in headers
3. Verify backend middleware is working

---

## Testing Checklist

### LeaveManagement.js
- [ ] Page loads without errors
- [ ] "Leave Requests" tab shows requests with employee names
- [ ] "Leave Balances" tab shows balance cards
- [ ] Empty states show appropriate messages
- [ ] Avatar initials display correctly
- [ ] No `.split()` errors in console

### AddLeaveRequestModern.js
- [ ] Page loads without errors
- [ ] User info displays correctly
- [ ] Leave types dropdown populates
- [ ] Selecting leave type triggers balance load
- [ ] Balance card appears with correct data
- [ ] Console shows debug logs
- [ ] Submit shows clear error messages
- [ ] Validation works correctly

---

## API Endpoints Reference

### Leave Types
```
GET /api/leaves/meta/types
Response: {
  success: true,
  data: [
    { id: 1, name: 'Annual Leave', maxDaysPerYear: 20, isActive: true },
    { id: 2, name: 'Sick Leave', maxDaysPerYear: 12, isActive: true },
    ...
  ]
}
```

### Leave Balances (User)
```
GET /api/leaves/meta/balance
Headers: Authorization: Bearer <JWT_TOKEN>
Response: {
  success: true,
  data: [
    {
      id: 1,
      employeeId: 5,
      leaveTypeId: 1,
      year: 2025,
      totalAccrued: 20,
      carryForward: 0,
      totalTaken: 15,
      totalPending: 0,
      balance: 5,
      leaveType: { id: 1, name: 'Annual Leave', maxDaysPerYear: 20 },
      employee: { id: 5, firstName: 'Admin', lastName: 'User' }
    }
  ]
}
```

### Create Leave Request
```
POST /api/leaves
Headers: Authorization: Bearer <JWT_TOKEN>
Body: {
  leaveTypeId: 1,
  startDate: '2025-11-01',
  endDate: '2025-11-05',
  reason: 'Family vacation',
  isHalfDay: false
}
Response: {
  success: true,
  message: 'Leave request submitted successfully.',
  data: { id: 10, employeeId: 5, ... }
}
```

---

## Files Modified

1. ✅ `frontend/src/components/features/leave/LeaveManagement.js`
   - Fixed undefined `employeeName` in table (line ~298)
   - Fixed undefined `employeeName` in balance cards (line ~425)
   - Added null checks and fallbacks
   - Added empty state handling

2. ✅ `frontend/src/components/features/leave/AddLeaveRequestModern.js`
   - Added console logging for balance loading
   - Added console logging for submit action
   - Enhanced error messages
   - Better error object inspection

---

## Next Steps

1. **Clear Browser Cache:** Hard refresh (Ctrl+Shift+R)
2. **Check Console:** Open DevTools (F12) and monitor console logs
3. **Test Balance Loading:**
   - Navigate to `/add-leave-request`
   - Select a leave type
   - Watch console for debug logs
4. **Verify Balance Exists:**
   - Go to `/admin/leave-balances`
   - Check if admin user has balance records
   - Create if missing
5. **Test Submit:**
   - Fill out form completely
   - Click Submit
   - Check console for error details

---

## Expected Console Output (Success)

```javascript
// When selecting leave type
Loading leave balance... { employeeId: 5, leaveTypeId: 1 }
Balance API response: { success: true, data: [{ id: 1, leaveTypeId: 1, balance: 5, ... }] }
Found balance: { id: 1, leaveTypeId: 1, balance: 5, totalAccrued: 20, ... }

// When submitting request
Submitting leave request: { leaveTypeId: 1, startDate: '2025-11-01', endDate: '2025-11-05', reason: 'Test', isHalfDay: false }
Submit response: { success: true, message: 'Leave request submitted successfully.', data: {...} }
```

## Expected Console Output (No Balance)

```javascript
Loading leave balance... { employeeId: 5, leaveTypeId: 1 }
Balance API response: { success: true, data: [] }
⚠️ No balance found for leave type: 1
```

**Action Required:** Create leave balance for this user and leave type

---

**Status:** ✅ Runtime errors fixed, debugging enhanced  
**Date:** October 26, 2025  
**Next:** Check console logs to diagnose balance issue
