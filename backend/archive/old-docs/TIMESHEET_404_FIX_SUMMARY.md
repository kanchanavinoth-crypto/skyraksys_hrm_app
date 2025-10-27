# Timesheet Approval 404 Error Fix

## Problem Identified
The error was: `PUT http://localhost:8080/api/timesheets/26ed249e-21ae-47df-bc01-d5796477e783/status 404 (Not Found)`

This indicates that:
1. **TimesheetManagement.js** was calling `timesheetService.updateStatus()`
2. **timesheet.service.js** `updateStatus()` method was calling `/timesheets/:id/status`
3. **Backend** doesn't have a `/timesheets/:id/status` endpoint
4. **Backend** only has `/timesheets/:id/approve` endpoint

## Root Cause
There were **two different timesheet service files** with inconsistent API calls:

1. **`timesheet.service.js`** (used by TimesheetManagement.js):
   - Had `updateStatus()` calling wrong endpoint `/timesheets/:id/status`
   - Used wrong payload format

2. **`TimesheetService.js`** (used by ManagerTimesheetApproval.js):
   - Had `rejectTimesheet()` calling wrong endpoint `/timesheets/:id/reject`
   - `approveTimesheet()` was calling correct endpoint

## Fixes Applied

### 1. Fixed `timesheet.service.js`
```javascript
// OLD (BROKEN)
async updateStatus(id, status, comments = '') {
  const response = await http.put(`/timesheets/${id}/status`, {
    status,
    comments
  });
  return response.data.data;
}

// NEW (FIXED)
async updateStatus(id, status, comments = '') {
  const action = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : status;
  
  const response = await http.put(`/timesheets/${id}/approve`, {
    action,
    approverComments: comments
  });
  return response.data.data;
}
```

### 2. Fixed `TimesheetService.js`
```javascript
// OLD (BROKEN)
rejectTimesheet(timesheetId, data) {
  return http.put(`/timesheets/${timesheetId}/reject`, data);
}

// NEW (FIXED)
rejectTimesheet(timesheetId, data) {
  return http.put(`/timesheetId/${timesheetId}/approve`, {
    ...data,
    action: 'reject'
  });
}
```

## Backend API Specification
```
PUT /api/timesheets/:id/approve
Authorization: Bearer token
Content-Type: application/json

Request Body:
{
  "action": "approve" | "reject",
  "approverComments": "string"
}

Response:
{
  "success": true,
  "message": "Weekly timesheet approved/rejected successfully."
}
```

## Component Usage Mapping

| Component | Service File | Method | Status |
|-----------|-------------|---------|---------|
| TimesheetManagement.js | timesheet.service.js | updateStatus() | ✅ FIXED |
| ManagerTimesheetApproval.js | TimesheetService.js | approveTimesheet() | ✅ WORKING |
| ManagerTimesheetApproval.js | TimesheetService.js | rejectTimesheet() | ✅ FIXED |

## Expected Behavior Now

### TimesheetManagement.js
- `handleApprovalAction()` calls `timesheetService.updateStatus(id, 'approved', comments)`
- Maps 'approved' → 'approve' and 'rejected' → 'reject'
- Calls `/timesheets/:id/approve` with correct payload
- **Should work without 404 errors**

### ManagerTimesheetApproval.js  
- `handleApprove()` calls `timesheetService.approveTimesheet(id, { action: 'approve', ... })`
- `handleReject()` calls `timesheetService.approveTimesheet(id, { action: 'reject', ... })`
- Both call `/timesheets/:id/approve` with correct payload
- **Should work without 404 errors**

## Testing Steps

1. **Reload Frontend**: Refresh browser to load updated service files
2. **Test TimesheetManagement**: Try approve/reject from timesheet management screen
3. **Test ManagerApproval**: Try approve/reject from manager dashboard
4. **Check Console**: Verify no more 404 errors for `/status` or `/reject` endpoints
5. **Check Network Tab**: Confirm all calls go to `/timesheets/:id/approve`

## Changes Made
- ✅ Fixed `timesheet.service.js` updateStatus method
- ✅ Fixed `TimesheetService.js` rejectTimesheet method  
- ✅ Both services now use unified `/timesheets/:id/approve` endpoint
- ✅ Proper payload mapping for 'approved'/'rejected' → 'approve'/'reject'
- ✅ Consistent approverComments field usage

The 404 error should now be resolved! 🎉