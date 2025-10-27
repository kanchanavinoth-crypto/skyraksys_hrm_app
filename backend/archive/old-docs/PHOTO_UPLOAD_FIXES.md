# Photo Upload Fixes - Complete Resolution

## Issues Found and Fixed

### Issue 1: Wrong localStorage Key ✅ FIXED
**Problem:**
- App stores JWT token as `accessToken` in localStorage
- PhotoUpload.js was using `localStorage.getItem('token')` (wrong key)
- This returned `null`, causing 403 "Invalid token" error

**Fix:**
Changed PhotoUpload.js to use correct key:
```javascript
// Before
localStorage.getItem('token')

// After  
localStorage.getItem('accessToken')
```

**Files Changed:**
- `frontend/src/components/common/PhotoUpload.js` (lines 106, 157)

---

### Issue 2: Incorrect Photo URL Construction ✅ FIXED
**Problem:**
- Backend serves uploads at `/uploads/...` (not `/api/uploads/...`)
- Frontend was constructing URL as: `http://localhost:5000/api/uploads/...`
- Correct URL should be: `http://localhost:5000/uploads/...`
- This caused 404 Not Found errors for uploaded photos

**Root Cause:**
- `REACT_APP_API_URL` is `http://localhost:5000/api`
- Uploads are served from root `/uploads`, not under `/api/`
- PhotoUpload was naively concatenating API URL with photo path

**Fix:**
Updated PhotoUpload.js to properly construct photo URLs:
```javascript
// After upload success
const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const serverBaseUrl = baseUrl.replace('/api', ''); // Remove /api suffix
const serverPhotoUrl = `${serverBaseUrl}${data.data.photoUrl}`;
setPreviewUrl(serverPhotoUrl);

// When loading existing photo (useEffect)
if (currentPhotoUrl) {
  const isRelativePath = currentPhotoUrl.startsWith('/');
  if (isRelativePath) {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    const serverBaseUrl = baseUrl.replace('/api', '');
    setPreviewUrl(`${serverBaseUrl}${currentPhotoUrl}`);
  } else {
    setPreviewUrl(currentPhotoUrl);
  }
}
```

**Files Changed:**
- `frontend/src/components/common/PhotoUpload.js` (lines 52-63, 120-123)

---

### Issue 3: CORS Error (Secondary) ✅ RESOLVED
**Problem:**
- Browser showed `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` 
- This was a side effect of Issue 2 (404 errors)

**Resolution:**
- Backend already has correct CORS headers for `/uploads` endpoint
- Error resolved automatically after fixing photo URL construction

---

### Issue 4: Debug Console Clutter ✅ CLEANED
**Problem:**
- PhotoUpload.js had excessive debug console.log statements
- Cluttered browser console

**Fix:**
Removed all debug console.log statements:
```javascript
// Removed:
console.log('PhotoUpload - currentPhotoUrl:', currentPhotoUrl);
console.log('PhotoUpload - previewUrl:', previewUrl);
console.log('PhotoUpload - employeeId:', employeeId);
console.log('PhotoUpload - showUploadButton:', showUploadButton);
console.log('PhotoUpload - Updating previewUrl to:', currentPhotoUrl);
```

---

## Technical Details

### Backend Configuration (Correct)
```javascript
// server.js line 125-132
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

### Environment Configuration
**Backend (.env):**
```
PORT=5000
JWT_SECRET=a3f1b5c9d2e4f8a0b1c3d5e7f9...
```

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:5000/api
```

### URL Mapping
| Resource Type | Stored in DB | Correct Full URL |
|--------------|--------------|------------------|
| API Endpoints | - | `http://localhost:5000/api/...` |
| Employee Photos | `/uploads/employee-photos/xxx.png` | `http://localhost:5000/uploads/employee-photos/xxx.png` |
| Static Files | `/uploads/...` | `http://localhost:5000/uploads/...` |

---

## Testing Checklist

### ✅ Photo Upload Works
1. Admin/HR logs in
2. Opens Edit Employee page
3. Clicks "Change Photo"
4. Selects image file
5. Clicks "Upload Photo"
6. **Expected:** Success message, photo displays correctly

### ✅ Photo Display Works
1. Employee record has photo in database
2. Open Edit Employee page
3. **Expected:** Existing photo displays correctly (no 404 errors)

### ✅ No Console Errors
1. Open browser DevTools console
2. Navigate to Edit Employee page with photo
3. Upload new photo
4. **Expected:** 
   - No 403 Forbidden errors
   - No 404 Not Found errors
   - No CORS errors
   - No excessive debug logs

### ✅ Authentication Works
1. Verify JWT token stored as `accessToken` in localStorage
2. Photo upload sends correct Authorization header
3. **Expected:** Backend accepts token, allows upload

---

## Files Modified

### 1. `frontend/src/components/common/PhotoUpload.js`
**Changes:**
- Line 106: Changed `localStorage.getItem('token')` → `localStorage.getItem('accessToken')`
- Line 157: Changed `localStorage.getItem('token')` → `localStorage.getItem('accessToken')`
- Lines 44-48: Removed debug console.log statements
- Lines 52-63: Updated useEffect to properly construct full URLs from relative paths
- Lines 120-123: Updated photo URL construction after upload success

**Total lines changed:** ~15 lines

---

## Summary

All photo upload issues have been resolved:

1. **Authentication:** ✅ Using correct `accessToken` key
2. **URL Construction:** ✅ Properly removes `/api/` prefix for uploads
3. **CORS:** ✅ No more cross-origin errors
4. **Console:** ✅ Clean, no debug clutter

**Result:** Photo upload and display now work perfectly! 📸✨
