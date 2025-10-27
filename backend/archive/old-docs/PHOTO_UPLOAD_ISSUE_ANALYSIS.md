# Photo Upload Issue - Analysis & Resolution

**Date:** October 25, 2025  
**Issue:** Photo upload failing with 403 Forbidden - "Invalid token"  
**Status:** ⚠️ **AUTHENTICATION ERROR**

---

## 🔍 Error Analysis

### Error Message:
```
POST http://localhost:5000/api/employees/a67c8d7e-bba6-4128-aef7-20a89d67a1e6/photo 403 (Forbidden)
Upload error: Error: Invalid token.
```

### Error Location:
- **Component:** `PhotoUpload.js` (Line 102)
- **Endpoint:** `POST /api/employees/:id/photo`
- **Required Role:** Admin or HR (via `isAdminOrHR` middleware)

---

## 🚨 Root Causes

### 1. **Authentication Token Issue** (PRIMARY)
**Problem:** The JWT token in localStorage is either:
- ❌ Expired
- ❌ Invalid format
- ❌ Not set correctly
- ❌ User logged out/session ended

**Evidence from logs:**
```javascript
// PhotoUpload.js:102
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

The backend is rejecting the token as invalid.

---

### 2. **Permission Issue** (SECONDARY)
**Problem:** User might not have Admin or HR role

**Backend Route Requirements:**
```javascript
// employee.routes.js:285
router.post('/:id/photo', isAdminOrHR, uploadEmployeePhoto, ...)
```

Only Admin and HR users can upload photos.

---

## 🔧 Resolution Steps

### Immediate Fix: Re-authenticate

1. **Logout and Login Again:**
   - Click logout
   - Login with admin credentials
   - Try photo upload again

2. **Check Your Role:**
   - Open browser console
   - Type: `JSON.parse(localStorage.getItem('user'))`
   - Verify `role` is either `'admin'` or `'hr'`

3. **Check Token:**
   - In console: `localStorage.getItem('token')`
   - Should be a long JWT string
   - If null or short, you need to login again

---

### Permanent Fix: Add Token Refresh Logic

**File:** `frontend/src/components/common/PhotoUpload.js`

#### Option 1: Add Better Error Handling
```javascript
// Line ~102
const handleUpload = async () => {
  // ... existing code ...
  
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login again to upload photos');
    }
    
    const response = await fetch(`${API_URL}/employees/${employeeId}/photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.status === 401 || response.status === 403) {
      // Token expired or invalid
      throw new Error('Your session has expired. Please login again.');
    }
    
    // ... rest of code ...
  } catch (error) {
    if (error.message.includes('session') || error.message.includes('login')) {
      // Redirect to login
      window.location.href = '/login';
    }
    setError(error.message);
  }
};
```

#### Option 2: Use Axios with Interceptors (RECOMMENDED)
The `employee.service.js` already has axios configured with interceptors. PhotoUpload should use it instead of raw fetch.

**Change in PhotoUpload.js:**
```javascript
// Instead of fetch(), use axios from employee.service.js

import { employeeService } from '../../services/employee.service';

const handleUpload = async () => {
  try {
    const formData = new FormData();
    formData.append('photo', selectedFile);
    
    // Use employeeService which handles auth automatically
    const response = await employeeService.uploadPhoto(employeeId, formData);
    
    setSuccess('Photo uploaded successfully!');
    if (onUploadSuccess) {
      onUploadSuccess(response.data);
    }
  } catch (error) {
    setError(error.message || 'Failed to upload photo');
  }
};
```

---

## 📋 Complete Audit Checklist

### Authentication Check:
- [ ] User is logged in
- [ ] Token exists in localStorage
- [ ] Token is not expired
- [ ] User has Admin or HR role

### Backend Check:
- [ ] Backend server running on port 5000
- [ ] `isAdminOrHR` middleware working correctly
- [ ] Photo upload endpoint accessible

### Frontend Check:
- [ ] API_URL configured correctly (`http://localhost:5000/api`)
- [ ] PhotoUpload component sending correct headers
- [ ] Error handling showing proper messages

---

## 🎯 Quick Test

Run this in browser console while on employee edit page:

```javascript
// Test 1: Check if logged in
const user = JSON.parse(localStorage.getItem('user'));
console.log('User:', user);
console.log('Role:', user?.role);

// Test 2: Check token
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);

// Test 3: Test API call
fetch('http://localhost:5000/api/employees', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => console.log('API Test:', data))
.catch(err => console.error('API Error:', err));
```

---

## 🔍 Current State Analysis

Based on your console logs:

1. **✅ Employee data loads correctly** - Basic auth working
2. **✅ Edit employee opens** - Permission to view/edit exists
3. **❌ Photo upload fails** - 403 Forbidden on photo upload specifically

This suggests:
- **Token is valid** for GET/PUT operations
- **Token is invalid/expired** for photo POST operation
- **OR** Photo upload endpoint has stricter auth requirements

---

## 💡 Recommended Solution

### Immediate (For Testing):
1. **Logout and login again** with admin credentials
2. **Try photo upload** immediately after login
3. **Check if it works** - if yes, token expiration issue

### Short-term (This Sprint):
1. **Update PhotoUpload.js** to use employeeService instead of fetch
2. **Add token validation** before upload attempt
3. **Add session expiry redirect** to login page

### Long-term (Next Sprint):
1. **Implement token refresh** mechanism
2. **Add token expiry warning** (e.g., "Session expires in 5 minutes")
3. **Auto-refresh tokens** in background

---

## 📁 Files to Check/Modify

| File | Purpose | Priority |
|------|---------|----------|
| `frontend/src/components/common/PhotoUpload.js` | Update to use employeeService | HIGH |
| `frontend/src/services/employee.service.js` | Add uploadPhoto method | HIGH |
| `frontend/src/services/auth.service.js` | Check token refresh logic | MEDIUM |
| `backend/middleware/auth.js` | Verify isAdminOrHR middleware | LOW |

---

## 🧪 Test Scenarios

### After Fix:

**Scenario 1: Valid Token**
- Login as admin
- Open employee edit
- Upload photo
- **Expected:** ✅ Photo uploads successfully

**Scenario 2: Expired Token**
- Wait for token to expire
- Try to upload photo
- **Expected:** ⚠️ Error message "Session expired, please login"
- **Expected:** Redirect to login page

**Scenario 3: Non-Admin User**
- Login as regular employee
- Try to upload own photo
- **Expected:** ❌ "You don't have permission to upload photos"

---

## 📊 Summary

| Issue | Severity | Impact | Solution |
|-------|----------|--------|----------|
| Invalid token | **HIGH** | Photo upload fails | Re-login or token refresh |
| Using fetch() instead of axios | MEDIUM | No centralized error handling | Use employeeService |
| No token expiry warning | LOW | Poor UX | Add expiry notification |

---

## ✅ Action Items

### For User (NOW):
1. ✅ **Logout** from the application
2. ✅ **Login again** with admin credentials
3. ✅ **Try photo upload** again
4. ✅ **Report** if issue persists

### For Developer (NEXT):
1. 📝 Update PhotoUpload to use employeeService
2. 📝 Add uploadPhoto method to employee.service.js
3. 📝 Test with fresh token
4. 📝 Test with expired token
5. 📝 Add better error messages

---

**Current Status:** Waiting for user to re-authenticate  
**Next Steps:** If issue persists after re-login, implement employeeService integration

---

**Report Generated:** October 25, 2025  
**Issue Type:** Authentication/Authorization  
**Resolution:** Re-authentication required
