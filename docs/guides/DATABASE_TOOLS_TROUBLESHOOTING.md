# Database Tools Tab - Troubleshooting Guide

## Issue: Tables Not Working

### ✅ Backend Status: WORKING

The backend API is responding correctly. Test confirmed:
```bash
curl http://localhost:5000/api/debug/database/tables
```
Returns: 22 tables with correct data (departments, employees, users, etc.)

### 🔍 Possible Causes

#### 1. Frontend Not Loaded/Restarted

**Symptoms:**
- Tables tab shows empty or loading forever
- No error messages in browser console
- Other tabs work fine

**Solution:**
```bash
cd frontend
npm start
```

Wait for compilation to complete, then refresh browser.

#### 2. Browser Console Errors

**How to Check:**
1. Open browser (Chrome/Edge/Firefox)
2. Press `F12` to open DevTools
3. Click `Console` tab
4. Navigate to `/admin/debug`
5. Click "Database Tools" tab
6. Look for red error messages

**Common Errors:**

**Error: "Network Error" or "Failed to fetch"**
- **Cause**: Backend not running or CORS issue
- **Solution**: Restart backend server

**Error: "Cannot read property 'map' of undefined"**
- **Cause**: `tables` state is undefined
- **Solution**: Check API response format

**Error: "http.get is not a function"**
- **Cause**: http-common not properly imported
- **Solution**: Check import statement

#### 3. API Response Format Mismatch

**Check Network Tab:**
1. Open DevTools (F12)
2. Click `Network` tab
3. Click "Database Tools" tab in app
4. Look for `/debug/database/tables` request
5. Click on it → Click "Response" tab
6. Verify response looks like:
```json
{
  "success": true,
  "data": [
    {"table_name": "employees", "size": "2880 kB", "column_count": "46"},
    ...
  ]
}
```

#### 4. Component State Issue

**Symptoms:**
- Tables load but clicking them doesn't show data
- Schema button doesn't work
- SQL console doesn't execute queries

**Debug Steps:**

1. **Check Browser Console** for errors
2. **Check Network Tab** for failed API calls
3. **Add temporary console.log**:

Open `DatabaseToolsTab.js` and add after line 100:
```javascript
const loadTables = async () => {
  try {
    console.log('🔍 Loading tables...');
    const response = await http.get('/debug/database/tables');
    console.log('📊 Response:', response.data);
    if (response.data.success) {
      console.log('✅ Tables loaded:', response.data.data.length);
      setTables(response.data.data);
    }
  } catch (error) {
    console.error('❌ Error loading tables:', error);
    showNotification('Failed to load tables', 'error');
  }
};
```

4. **Refresh browser** and check console for these messages

### 🔧 Quick Fixes

#### Fix 1: Restart Both Servers

```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend  
cd frontend
npm start
```

#### Fix 2: Clear Browser Cache

1. Open browser
2. Press `Ctrl+Shift+Delete`
3. Select "Cached images and files"
4. Click "Clear data"
5. Refresh page (`Ctrl+F5`)

#### Fix 3: Check API Base URL

Open `frontend/src/http-common.js` and verify:
```javascript
baseURL: "http://localhost:5000/api"
```

Should match your backend URL.

#### Fix 4: Force Refresh Component

Add to `DatabaseToolsTab.js` after line 85:
```javascript
useEffect(() => {
  console.log('🚀 DatabaseToolsTab mounted');
  loadTables();
  loadDatabaseStats();
  loadConnections();
  loadQueryHistory();
}, []); // Empty dependency array ensures it runs once on mount
```

### 🧪 Step-by-Step Diagnosis

#### Step 1: Verify Backend is Running

```bash
curl http://localhost:5000/api/debug/database/tables
```

**Expected**: JSON with table list
**If fails**: Backend not running → Restart backend

#### Step 2: Verify Frontend is Running

- Navigate to: `http://localhost:3000/admin/debug`
- **Expected**: See Admin Debug Panel
- **If fails**: Frontend not running → Restart frontend

#### Step 3: Check Browser Console

1. Press `F12`
2. Click "Console" tab
3. Click "Database Tools" tab in app
4. **Look for errors** (red text)

**Common Console Messages:**

✅ **Good**:
```
🚀 DatabaseToolsTab mounted
🔍 Loading tables...
📊 Response: {success: true, data: Array(22)}
✅ Tables loaded: 22
```

❌ **Bad**:
```
❌ Error loading tables: Network Error
```
→ Backend not running or CORS issue

❌ **Bad**:
```
Cannot read property 'map' of undefined
```
→ State initialization issue

#### Step 4: Check Network Tab

1. Press `F12`
2. Click "Network" tab
3. Click "Database Tools" tab in app
4. Look for `/debug/database/tables` request

**Status codes:**
- ✅ `200 OK` → Working
- ❌ `404 Not Found` → Wrong URL
- ❌ `500 Internal Server Error` → Backend error
- ❌ `CORS error` → CORS configuration issue
- ❌ `Failed to fetch` → Backend not running

#### Step 5: Test Individual Endpoints

Open browser console and run:

```javascript
// Test tables endpoint
fetch('http://localhost:5000/api/debug/database/tables')
  .then(r => r.json())
  .then(data => console.log('Tables:', data))
  .catch(err => console.error('Error:', err));

// Test stats endpoint
fetch('http://localhost:5000/api/debug/database/stats')
  .then(r => r.json())
  .then(data => console.log('Stats:', data))
  .catch(err => console.error('Error:', err));
```

**Expected**: See table data in console
**If fails**: Check error message

### 🎯 Most Likely Causes

Based on your issue "tables are not working", here are the most likely causes in order:

1. **Frontend not restarted after route merge** (80% probability)
   - Solution: `cd frontend && npm start`

2. **Backend not running** (10% probability)
   - Solution: `cd backend && node server.js`

3. **Browser cache** (5% probability)
   - Solution: Hard refresh (`Ctrl+F5`)

4. **Component mounting issue** (5% probability)
   - Solution: Add debug console.logs

### ⚡ Quick Test Script

Run this in browser console (F12 → Console tab):

```javascript
// Quick diagnosis
(async () => {
  console.log('🔍 Testing database endpoints...');
  
  try {
    const tables = await fetch('http://localhost:5000/api/debug/database/tables');
    const tablesData = await tables.json();
    console.log('✅ Tables endpoint working:', tablesData.data.length, 'tables found');
    
    const stats = await fetch('http://localhost:5000/api/debug/database/stats');
    const statsData = await stats.json();
    console.log('✅ Stats endpoint working:', statsData.data);
    
    console.log('✅ Backend is working correctly!');
    console.log('💡 Issue is likely in frontend. Try restarting frontend server.');
  } catch (error) {
    console.error('❌ Backend test failed:', error);
    console.log('💡 Start backend server: cd backend && node server.js');
  }
})();
```

### 📱 What Should You See?

When working correctly:

1. **Navigate to `/admin/debug`**
2. **Click "Database Tools" tab** (4th tab)
3. **See 3 sub-tabs**: SQL Console, Table Browser, Database Stats
4. **Click "Table Browser" sub-tab**
5. **Left side**: List of 22 tables (employees, users, departments, etc.)
6. **Click any table**: Right side shows table data
7. **Click "Schema" button**: See column definitions

### 🆘 Still Not Working?

If tables still aren't showing after trying all fixes:

1. **Take screenshots** of:
   - Browser console (F12 → Console tab)
   - Network tab (F12 → Network tab)
   - The Database Tools tab view

2. **Check these files exist**:
   - `frontend/src/components/features/admin/tabs/DatabaseToolsTab.js`
   - `backend/services/database.service.js`
   - `backend/routes/debug.routes.js`

3. **Verify imports** in `AdminDebugPanel.js`:
```javascript
import DatabaseToolsTab from './tabs/DatabaseToolsTab';
```

4. **Check tab rendering** around line 785 in `AdminDebugPanel.js`:
```javascript
<TabPanel value={tabValue} index={3}>
  <DatabaseToolsTab />
</TabPanel>
```

### ✅ Expected Behavior

**When working correctly:**

```
1. Open /admin/debug
2. Click "Database Tools" tab
3. See 3 sub-tabs appear
4. Click "Table Browser"
5. Left panel shows 22 tables
6. Click "employees" table
7. Right panel shows employee data in table format
8. Can click "Schema" to see column definitions
9. Can switch to "SQL Console" to run queries
10. Can switch to "Database Stats" to see statistics
```

### 📞 Support Checklist

Before asking for help, please provide:

- [ ] Browser console screenshot (F12 → Console)
- [ ] Network tab screenshot (F12 → Network → database/tables request)
- [ ] What you see in the Database Tools tab
- [ ] Backend server status (running/not running)
- [ ] Frontend server status (running/not running)
- [ ] Node.js version: `node --version`
- [ ] npm version: `npm --version`

---

**Last Updated**: 2025-10-25
**Status**: Backend working, frontend needs verification
**Most Likely Fix**: Restart frontend server
