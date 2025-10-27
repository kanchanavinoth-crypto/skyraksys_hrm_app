# 🔧 CORS Troubleshooting Guide
## Fix CORS Errors in Skyraksys HRM

**Last Updated:** October 22, 2025  
**Difficulty:** Intermediate  
**Time to Fix:** 5-15 minutes

---

## 🚨 **COMMON CORS ERRORS**

### **Error 1: "No 'Access-Control-Allow-Origin' header"**

**Full Error:**
```
Access to fetch at 'http://95.216.14.232:5000/api/...' from origin 'http://95.216.14.232' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the 
requested resource.
```

**Cause:** Frontend calling backend directly on port 5000 instead of through Nginx

**Fix:**
```bash
# 1. Check frontend build
cd frontend
grep -r "5000" build/

# 2. If found, rebuild with correct .env.production
cat > .env.production << 'EOF'
REACT_APP_API_URL=http://95.216.14.232/api
EOF

# 3. Rebuild
npm run build

# 4. Restart frontend service
systemctl restart hrm-frontend
```

---

### **Error 2: "CORS policy: The request client is not a secure context"**

**Cause:** Mixed content (HTTPS calling HTTP API)

**Fix:**
```bash
# Ensure both use same protocol
# Frontend: http://95.216.14.232
# API: http://95.216.14.232/api

# Or add HTTPS to both (recommended)
```

---

### **Error 3: "CORS blocked origin: http://..."**

**Symptom:** Backend logs show "CORS blocked origin"

**Cause:** Origin not in allowedOrigins array

**Fix:**
```bash
# 1. Check backend logs
journalctl -u hrm-backend -n 50 | grep CORS

# 2. Edit backend/server.js - add origin to allowedOrigins array
# Example: Add 'http://new-domain.com'

# 3. Restart backend
systemctl restart hrm-backend
```

---

### **Error 4: "Preflight request doesn't pass access control check"**

**Symptom:** OPTIONS request fails before actual request

**Cause:** CORS not handling OPTIONS method

**Fix:**
```bash
# Verify backend handles OPTIONS
curl -X OPTIONS \
  -H "Origin: http://95.216.14.232" \
  -H "Access-Control-Request-Method: POST" \
  http://95.216.14.232/api/health

# Should return 204 with CORS headers
```

---

### **Error 5: "Credentials flag is 'include' but Access-Control-Allow-Credentials is missing"**

**Cause:** Backend not allowing credentials

**Fix:**
```javascript
// Verify in backend/server.js:
cors({
  credentials: true,  // ✅ Must be true
  // ...
})
```

---

## 🔍 **DIAGNOSTIC STEPS**

### **Step 1: Identify the Issue**

```bash
# Open browser console (F12)
# Look for red CORS errors
# Note the exact error message
```

### **Step 2: Check Frontend API URL**

```bash
# Check what URL frontend is calling
cd frontend
grep -r "REACT_APP_API_URL" build/

# Should be: http://95.216.14.232/api
# NOT: http://95.216.14.232:5000/api
```

### **Step 3: Check Backend CORS Config**

```bash
# Check backend logs for CORS blocks
journalctl -u hrm-backend -n 100 | grep -i cors

# Check TRUST_PROXY setting
cat backend/.env | grep TRUST_PROXY
# Should be: TRUST_PROXY=true
```

### **Step 4: Test CORS Headers**

```bash
# Test if backend returns CORS headers
curl -i -H "Origin: http://95.216.14.232" \
  http://95.216.14.232/api/health

# Expected headers:
# Access-Control-Allow-Origin: http://95.216.14.232
# Access-Control-Allow-Credentials: true
```

---

## 🛠️ **COMMON FIXES**

### **Fix 1: Frontend Calling Wrong URL**

**Problem:** Frontend built with `:5000` in API URL

**Solution:**
```bash
# 1. Update .env.production
cd frontend
echo "REACT_APP_API_URL=http://95.216.14.232/api" > .env.production

# 2. Rebuild
npm run build

# 3. Verify
grep -r "95.216.14.232/api" build/ | head -n 1
# Should NOT show :5000

# 4. Restart
systemctl restart hrm-frontend
```

---

### **Fix 2: TRUST_PROXY Not Enabled**

**Problem:** Backend not detecting correct origin through Nginx

**Solution:**
```bash
# 1. Check backend/.env
cat backend/.env | grep TRUST_PROXY

# 2. If not "true", fix it
echo "TRUST_PROXY=true" >> backend/.env

# 3. Restart backend
systemctl restart hrm-backend
```

---

### **Fix 3: Origin Not Whitelisted**

**Problem:** Your origin not in allowedOrigins

**Solution:**
```javascript
// Edit backend/server.js
const allowedOrigins = [
  'http://localhost:3000',
  'http://95.216.14.232',        // ✅ Add your origin
  'https://95.216.14.232',       // ✅ HTTPS variant
  'http://95.216.14.232:3000',
  // Add more as needed
];
```

---

### **Fix 4: Nginx Not Passing Headers**

**Problem:** Nginx not forwarding origin headers

**Solution:**
```nginx
# Edit /etc/nginx/conf.d/hrm.conf
location /api/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # ✅ Add if missing
    proxy_set_header Origin $http_origin;
}

# Reload Nginx
nginx -t
systemctl reload nginx
```

---

## 🧪 **TESTING CORS**

### **Test 1: Browser Console Test**
```javascript
// Open browser at http://95.216.14.232
// Open DevTools Console (F12)
fetch('http://95.216.14.232/api/health', {
  credentials: 'include'
})
.then(r => r.json())
.then(d => console.log('✅ CORS works!', d))
.catch(e => console.error('❌ CORS failed:', e));
```

### **Test 2: curl Test**
```bash
curl -i -H "Origin: http://95.216.14.232" \
  http://95.216.14.232/api/health

# Check response headers for:
# Access-Control-Allow-Origin: http://95.216.14.232
# Access-Control-Allow-Credentials: true
```

### **Test 3: Preflight Test**
```bash
curl -i -X OPTIONS \
  -H "Origin: http://95.216.14.232" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://95.216.14.232/api/auth/login

# Expected: 204 No Content with CORS headers
```

---

## 📋 **CORS CHECKLIST**

- [ ] Frontend `.env.production` has correct API URL (no :5000)
- [ ] Frontend build contains correct API URL
- [ ] Backend `TRUST_PROXY=true`
- [ ] Backend origin is in `allowedOrigins` array
- [ ] Backend `credentials: true` in cors()
- [ ] Nginx passes proxy headers
- [ ] Both frontend and API use same protocol (http or https)
- [ ] No mixed content warnings

---

## 🆘 **EMERGENCY FIX**

If all else fails, temporarily allow all origins (for debugging only):

```bash
# Edit backend/.env
CORS_ALLOW_ALL=true

# Restart backend
systemctl restart hrm-backend

# Test if CORS works now
# If yes, the issue is with origin whitelisting
# If no, the issue is elsewhere

# ⚠️ DON'T FORGET TO SET BACK TO false FOR PRODUCTION!
CORS_ALLOW_ALL=false
```

---

## 🔗 **RELATED DOCS**

- [CORS Complete Guide](./CORS-GUIDE.md) - Understanding CORS
- [CORS Verification](./CORS-VERIFICATION.md) - Test CORS setup
- [Frontend Build](../build/FRONTEND-BUILD.md) - Fix build issues
- [Troubleshooting](../deployment/08-TROUBLESHOOTING.md) - General issues

---

**Guide Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** ✅ Complete
