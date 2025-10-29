# Quick Test Guide - Admin Debug Panel

## 🚀 How to Access

### Method 1: React Integration (Recommended)
```
URL: http://localhost:3000/secret-admin-debug-console-x9z
Requirements: Frontend running on port 3000
Authentication: NOT REQUIRED
```

### Method 2: Standalone HTML (Alternative)
```
URL: http://localhost:8080
Requirements: Run admin-debug-panel/server.js
Authentication: NOT REQUIRED
```

---

## ✅ Pre-Test Checklist

### 1. Backend Server Running
```bash
cd d:\skyraksys_hrm\backend
node server.js
```
**Expected:** Server running on port 5000

### 2. Frontend Server Running
```bash
cd d:\skyraksys_hrm\frontend
npm start
```
**Expected:** React app running on port 3000

### 3. CORS Verified
Check backend console - should NOT see:
```
❌ CORS blocked origin: http://localhost:8080
```

---

## 🧪 Test Scenarios

### Test 1: Dashboard Stats
**Steps:**
1. Navigate to: `http://localhost:3000/secret-admin-debug-console-x9z`
2. Should see "Dashboard" tab active
3. Check stats cards display numbers

**Expected Result:**
- ✅ Stats cards show: Employees, Users, Pending Leaves, Payslips
- ✅ Numbers are not 0 (if data exists)
- ✅ No CORS errors in console

**Troubleshooting:**
- If stats show 0, seed demo data (click "Seed Demo Data" button)
- If CORS error, verify backend server.js has port 8080 in allowedOrigins
- If loading forever, check backend is running on port 5000

---

### Test 2: Employees List
**Steps:**
1. Click "Employees" tab
2. Should see table with employee data
3. Try searching for an employee name

**Expected Result:**
- ✅ Table displays employee records
- ✅ Shows: ID, Name, Email, Department, Position, Status
- ✅ Search filters table in real-time

**Troubleshooting:**
- If empty, add employees via main app first
- If "Not allowed by CORS", restart backend server

---

### Test 3: Leave Approval
**Steps:**
1. Click "Leaves" tab
2. Find a leave with "pending" status
3. Click the ✓ (checkmark) icon to approve
4. Should see success notification

**Expected Result:**
- ✅ Notification: "Leave approved successfully"
- ✅ Leave status changes from "pending" to "approved"
- ✅ Table refreshes automatically

**Troubleshooting:**
- If no pending leaves, create one via main app first
- If API error, check debug.routes.js is registered in server.js

---

### Test 4: SQL Console
**Steps:**
1. Click "SQL Console" tab
2. Enter query: `SELECT * FROM employees LIMIT 5;`
3. Click "Execute Query"
4. Should see results below

**Expected Result:**
- ✅ Results display in JSON format
- ✅ Shows metadata: "X rows returned"
- ✅ Query executes without errors

**Troubleshooting:**
- If "Query is required", ensure query is not empty
- If "DROP DATABASE not allowed", this is expected (safety feature)
- If no results, check if employees table has data

---

### Test 5: Search Functionality
**Steps:**
1. Click "Users" tab
2. Type an email address in search box
3. Table should filter

**Expected Result:**
- ✅ Only matching users appear
- ✅ Search is case-insensitive
- ✅ Search works across email and role fields

---

### Test 6: Demo Data Seeding
**Steps:**
1. Go to "Dashboard" tab
2. Click "Seed Demo Data" button
3. Wait for notification

**Expected Result:**
- ✅ Notification: "Demo data seeded: X depts, Y positions"
- ✅ Stats refresh automatically
- ✅ Department/Position counts increase

**Troubleshooting:**
- If "already exists", data was already seeded (expected)
- If error, check PostgreSQL connection

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error
**Symptom:**
```
Access to XMLHttpRequest at 'http://localhost:5000/api/debug/stats' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
1. Check `backend/server.js` allowedOrigins includes:
   - `'http://localhost:3000'`
   - `'http://localhost:8080'`
2. Restart backend server
3. Clear browser cache

---

### Issue 2: 404 Not Found on /api/debug/*
**Symptom:**
```
GET http://localhost:5000/api/debug/stats 404 (Not Found)
```

**Solution:**
1. Check `backend/server.js` has:
   ```javascript
   const debugRoutes = require('./routes/debug.routes');
   app.use('/api/debug', debugRoutes);
   ```
2. Check `backend/routes/debug.routes.js` exists
3. Restart backend server

---

### Issue 3: Empty Tables
**Symptom:**
- Tables load but show no data
- No errors in console

**Solution:**
1. Verify data exists in database:
   ```sql
   SELECT COUNT(*) FROM employees;
   ```
2. Use "Seed Demo Data" button
3. Add data via main application

---

### Issue 4: Hidden Route Not Found (React)
**Symptom:**
```
http://localhost:3000/secret-admin-debug-console-x9z
Shows: "Page Not Found" or redirects to login
```

**Solution:**
1. Check `frontend/src/App.js` has the route:
   ```javascript
   <Route path="/secret-admin-debug-console-x9z" element={...} />
   ```
2. Ensure route is BEFORE `<Route path="/login" ... />`
3. Restart frontend server (`npm start`)
4. Clear browser cache

---

### Issue 5: Backend Blocks Debug Endpoints
**Symptom:**
```
Debug endpoints are disabled in production
```

**Solution:**
Check `.env` file:
```bash
NODE_ENV=development  # Change from 'production'
```

---

## 📊 Expected Console Output

### Backend Console (No Errors)
```
✅ Server running at http://localhost:5000
🔧 Debug endpoint accessed: GET /stats
🔧 Debug endpoint accessed: GET /employees
```

### Frontend Console (No CORS Errors)
```
✅ Stats loaded successfully
✅ Employees loaded: 15 records
✅ Leave approved successfully
```

### Browser Network Tab
```
GET /api/debug/stats          200 OK
GET /api/debug/employees      200 OK
PUT /api/debug/leaves/5/approve  200 OK
```

---

## 🎯 Success Criteria

All tests pass if:
- ✅ No CORS errors in console
- ✅ Dashboard stats load and display
- ✅ All tabs load data successfully
- ✅ Search filters work
- ✅ Leave approval/rejection works
- ✅ SQL Console executes queries
- ✅ Notifications appear on success/error
- ✅ No authentication required

---

## 🔍 Debug Checklist

If something doesn't work, check:

### Backend
- [ ] Server running on port 5000?
- [ ] `debug.routes.js` exists and has all endpoints?
- [ ] Routes registered in `server.js`?
- [ ] CORS allows `localhost:3000` and `localhost:8080`?
- [ ] NODE_ENV is not 'production'?

### Frontend
- [ ] React app running on port 3000?
- [ ] `AdminDebugPanel.js` exists?
- [ ] Route added to `App.js`?
- [ ] Component imported correctly?
- [ ] No console errors?

### Database
- [ ] PostgreSQL running?
- [ ] Database has data?
- [ ] Connection string correct in `.env`?

---

## 📝 Quick Commands

### Restart Backend
```bash
# Stop existing process
taskkill /F /IM node.exe

# Start fresh
cd d:\skyraksys_hrm\backend
node server.js
```

### Restart Frontend
```bash
# Stop (Ctrl+C in terminal)
# Start fresh
cd d:\skyraksys_hrm\frontend
npm start
```

### Check Ports
```bash
# Check what's running on port 5000
netstat -ano | findstr :5000

# Check what's running on port 3000
netstat -ano | findstr :3000
```

### Clear Browser Cache
```
Ctrl + Shift + Delete (Chrome/Edge)
Or Hard Reload: Ctrl + Shift + R
```

---

## 🎉 Ready to Test!

1. Start backend: `cd backend && node server.js`
2. Start frontend: `cd frontend && npm start`
3. Navigate to: `http://localhost:3000/secret-admin-debug-console-x9z`
4. Run through test scenarios above
5. Report any issues with error messages

---

**Test Date:** October 24, 2025
**Status:** Ready for Testing ✅
