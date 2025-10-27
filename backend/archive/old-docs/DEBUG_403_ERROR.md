# 🔍 Debugging 403 Forbidden Error - Step by Step

## Current Status
- ✅ You're logged in as **admin**
- ❌ Getting **403 Forbidden** on `/api/payslip-templates`
- ✅ Added debug logging to track the issue

## 🚀 Steps to Debug

### Step 1: Restart Backend Server
The backend is running with `node server.js` which doesn't auto-restart. You need to stop and restart it:

1. **Stop the backend task**:
   - Press `Ctrl+Shift+P`
   - Type: "Tasks: Terminate Task"
   - Select: "start-backend"

2. **Start it again**:
   - Press `Ctrl+Shift+P`
   - Type: "Tasks: Run Task"
   - Select: "start-backend"

### Step 2: Test the API Call
1. Go to your browser
2. Navigate to `/admin/payslip-templates`
3. Open DevTools (F12)
4. Check the Console tab

### Step 3: Check Backend Logs
Look at the backend terminal output. You should see:

**If request reaches the route:**
```
🔍 GET /payslip-templates request received
```

**If auth succeeds:**
```
🔐 Authorization Check: { userRole: 'admin', allowedRoles: ['admin', 'hr'], ... }
```

**If handler is reached:**
```
✅ GET /payslip-templates - Reached handler, user: admin
```

### Step 4: Identify the Issue

#### Scenario A: No logs at all
**Problem**: Request not reaching the backend
**Likely cause**: CORS issue or backend not running
**Solution**: Check if backend is running on port 5000

#### Scenario B: See "🔍 GET /payslip-templates" but no authorization log
**Problem**: `authenticateToken` is failing
**Likely cause**: Token is invalid or expired
**Solution**: 
1. Open DevTools > Application > Local Storage
2. Clear `accessToken` and `refreshToken`
3. Log in again

#### Scenario C: See authorization log with wrong role
**Problem**: User role is not 'admin' or 'hr'
**Example log**:
```
🔐 Authorization Check: { userRole: 'employee', ... }
❌ Access denied - User role: employee Required roles: ['admin', 'hr']
```
**Solution**: You're logged in with wrong account
- Log out
- Log in with admin credentials

#### Scenario D: See "❌ Access denied" even with correct role
**Problem**: Role checking logic issue
**Example log**:
```
🔐 Authorization Check: { userRole: 'admin', allowedRoles: ['admin', 'hr'], ... }
❌ Access denied - User role: admin Required roles: ['admin', 'hr']
```
**Solution**: Bug in authorize function (shouldn't happen but we'll fix it)

## 🔧 Quick Fixes

### Fix 1: Clear Auth and Re-login
```
1. F12 > Application > Local Storage
2. Delete: accessToken, refreshToken
3. Go to /login
4. Login with: admin@skyraksys.com / admin123
```

### Fix 2: Direct Database Check
Run this to verify admin user exists:
```bash
cd d:\skyraksys_hrm\backend
node -e "const db=require('./models');(async()=>{await db.sequelize.sync();const u=await db.User.findOne({where:{role:'admin'}});console.log('Admin user:',u?{id:u.id,email:u.email,role:u.role,isActive:u.isActive}:'NOT FOUND');process.exit(0)})()"
```

### Fix 3: Test Auth Token
Get your token from localStorage and test it:
```bash
cd d:\skyraksys_hrm\backend
node test-auth-token.js "YOUR_TOKEN_HERE"
```

## 📊 Expected Flow

```
Request → 
  🔍 Route received → 
    🔐 authenticateToken (sets req.userRole) → 
      🔐 isAdminOrHR (checks role) → 
        ✅ Handler executes → 
          📦 Returns templates
```

## 🎯 Most Likely Issues (in order)

1. **Token Expired** (90% likely)
   - JWT tokens expire after some time
   - Solution: Log out and log in again

2. **Wrong User** (5% likely)
   - Logged in as 'manager' or 'employee' instead of 'admin'
   - Solution: Use admin credentials

3. **Backend Not Restarted** (4% likely)
   - Old code still running
   - Solution: Restart backend task

4. **Auth Middleware Issue** (1% likely)
   - Bug in code
   - We'll debug with logs

## 🚨 Next Steps

**Right now, please**:

1. **Restart the backend server** (see Step 1 above)
2. **Refresh the browser page** and try loading templates
3. **Copy the backend terminal output** showing the debug logs
4. **Share the logs** so we can see exactly where it's failing

The debug logs will tell us exactly what's happening!
