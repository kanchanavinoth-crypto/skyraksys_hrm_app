# 🔧 CORS Error Fix Guide

**Issue:** Frontend at `http://95.216.14.232:3000` cannot access backend at `http://localhost:8080`

**Error:** 
```
Access to XMLHttpRequest at 'http://localhost:8080/api/auth/login' from origin 'http://95.216.14.232:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## ✅ Changes Made

### 1. Backend CORS Configuration Updated (`backend/server.js`)

**Added:**
- ✅ Server IP address origins: `http://95.216.14.232:3000` and `http://95.216.14.232:8080`
- ✅ HTTPS variants for future SSL setup
- ✅ Dynamic origin validation function
- ✅ Preflight OPTIONS request handler
- ✅ Additional CORS headers (PATCH method, X-Requested-With)
- ✅ Exposed headers for better API communication
- ✅ Increased maxAge to 600 seconds

---

## 🚀 Required Actions

### **Step 1: Restart Backend Server**

The backend needs to be accessible via the server IP, not localhost.

```bash
cd backend

# Stop any running backend process
# Then start with proper host binding:
node server.js

# OR if using PM2:
pm2 restart backend

# OR if using the task:
# Use VS Code task: "start-backend"
```

**IMPORTANT:** Make sure the backend is listening on `0.0.0.0` not just `localhost`

### **Step 2: Update Backend Startup**

Check `backend/server.js` at the bottom where it starts the server. It should be:

```javascript
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
```

### **Step 3: Update Frontend Environment Variable**

The frontend needs to know the correct backend URL. 

**Option A: Environment Variable (Recommended for production)**

Create `frontend/.env.production`:
```bash
REACT_APP_API_URL=http://95.216.14.232:8080/api
```

**Option B: Update at Build Time**

When building the frontend:
```bash
cd frontend
REACT_APP_API_URL=http://95.216.14.232:8080/api npm run build
```

**Option C: Create .env file**

Create `frontend/.env`:
```bash
REACT_APP_API_URL=http://95.216.14.232:8080/api
```

Then rebuild and restart:
```bash
npm run build
# Then serve the build folder or restart dev server
```

### **Step 4: Update Backend .env**

In `backend/.env`, add:
```bash
# CORS Configuration
FRONTEND_URL=http://95.216.14.232:3000
CORS_ORIGIN=http://95.216.14.232:3000

# Host binding
HOST=0.0.0.0
PORT=8080
```

### **Step 5: Verify Server Binding**

After starting backend, check it's listening on all interfaces:

```bash
# On Windows:
netstat -ano | findstr :8080

# You should see:
# TCP    0.0.0.0:8080    0.0.0.0:0    LISTENING
# NOT just:
# TCP    127.0.0.1:8080  0.0.0.0:0    LISTENING
```

### **Step 6: Test Backend Accessibility**

From your browser on `http://95.216.14.232:3000`, open developer console and test:

```javascript
fetch('http://95.216.14.232:8080/api/health')
  .then(r => r.json())
  .then(d => console.log('Backend accessible:', d))
  .catch(e => console.error('Backend NOT accessible:', e));
```

---

## 🔍 Troubleshooting

### **Issue: Backend still not accessible**

**Check 1: Firewall**
```bash
# Windows Firewall - Allow port 8080
netsh advfirewall firewall add rule name="HRM Backend" dir=in action=allow protocol=TCP localport=8080
```

**Check 2: Server Binding**
Look at backend startup logs. Should say:
```
Server running on http://0.0.0.0:8080
```
NOT:
```
Server running on http://localhost:8080
```

**Check 3: Test Direct Access**
```bash
# From another machine or browser:
curl http://95.216.14.232:8080/api/health
```

### **Issue: CORS still blocked**

**Check 1: Verify Backend Changes**
Look at `backend/server.js` lines 12-46, should have the new CORS config.

**Check 2: Clear Browser Cache**
- Hard refresh: `Ctrl + Shift + R`
- Clear all cache and cookies
- Try incognito mode

**Check 3: Check Backend Logs**
Look for: `CORS blocked origin: http://95.216.14.232:3000`

---

## 📋 Quick Fix Checklist

- [ ] Updated `backend/server.js` with new CORS config ✅ (Done)
- [ ] Added preflight OPTIONS handler ✅ (Done)
- [ ] Updated backend server to listen on `0.0.0.0`
- [ ] Created/updated `backend/.env` with FRONTEND_URL
- [ ] Created/updated `frontend/.env` with REACT_APP_API_URL
- [ ] Restarted backend server
- [ ] Rebuilt frontend (if using production build)
- [ ] Tested backend accessibility from server IP
- [ ] Verified no firewall blocking port 8080
- [ ] Cleared browser cache
- [ ] Tested login from frontend

---

## 🎯 Expected Result

After these changes:
1. ✅ Backend accepts requests from `http://95.216.14.232:3000`
2. ✅ Frontend connects to `http://95.216.14.232:8080/api`
3. ✅ No CORS errors in browser console
4. ✅ Login and all API calls work correctly

---

## 📝 Alternative: Using Nginx Reverse Proxy

If you want both frontend and backend on the same origin (recommended for production):

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name 95.216.14.232;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8080/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

This way:
- Frontend: `http://95.216.14.232/`
- Backend: `http://95.216.14.232/api`
- No CORS issues (same origin)

---

## 🔐 Security Note

Currently set to allow all origins for debugging:
```javascript
callback(null, true); // Temporarily allow all origins for debugging
```

**For production, change to:**
```javascript
if (allowedOrigins.indexOf(origin) !== -1) {
  callback(null, true);
} else {
  console.log('CORS blocked origin:', origin);
  callback(new Error('Not allowed by CORS'));
}
```

---

**Next Steps:** 
1. Update backend server binding to `0.0.0.0`
2. Restart backend
3. Update frontend .env with correct backend URL
4. Test the connection

Would you like me to help with any of these steps?
