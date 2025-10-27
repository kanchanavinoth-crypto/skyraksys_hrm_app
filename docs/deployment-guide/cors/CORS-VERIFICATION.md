# ✅ CORS Verification & Testing Guide
## Verify Your CORS Configuration

**Last Updated:** October 22, 2025  
**Time Required:** 5 minutes  
**Prerequisites:** Deployed application

---

## 🎯 **WHAT TO VERIFY**

1. ✅ Backend returns correct CORS headers
2. ✅ Frontend can call API without errors
3. ✅ Preflight requests work
4. ✅ Credentials are accepted
5. ✅ All HTTP methods work

---

## 🧪 **VERIFICATION TESTS**

### **Test 1: Health Check with CORS**

```bash
curl -i -H "Origin: http://95.216.14.232" \
  http://95.216.14.232/api/health
```

**Expected Response:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://95.216.14.232
Access-Control-Allow-Credentials: true
Content-Type: application/json

{"status":"ok","timestamp":"2025-10-22T..."}
```

**✅ Pass Criteria:**
- Status: 200 OK
- `Access-Control-Allow-Origin` matches request origin
- `Access-Control-Allow-Credentials: true` present
- Response body contains health data

---

### **Test 2: Preflight Request**

```bash
curl -i -X OPTIONS \
  -H "Origin: http://95.216.14.232" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  http://95.216.14.232/api/auth/login
```

**Expected Response:**
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://95.216.14.232
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, x-access-token, X-Requested-With
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 600
```

**✅ Pass Criteria:**
- Status: 204 No Content or 200 OK
- All CORS headers present
- Methods include POST
- Headers include Content-Type and Authorization

---

### **Test 3: Actual POST Request**

```bash
curl -i -X POST \
  -H "Origin: http://95.216.14.232" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Kx9mP7qR2nF8sA5t"}' \
  http://95.216.14.232/api/auth/login
```

**Expected Response:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://95.216.14.232
Access-Control-Allow-Credentials: true
Content-Type: application/json

{"success":true,"token":"...","user":{...}}
```

**✅ Pass Criteria:**
- Status: 200 OK
- CORS headers present
- Response contains token and user data
- No CORS error in response

---

### **Test 4: Browser Console Test**

```javascript
// Open http://95.216.14.232 in browser
// Open DevTools Console (F12)
// Run this code:

// Test 1: Simple GET
fetch('http://95.216.14.232/api/health', {
  credentials: 'include'
})
.then(r => r.json())
.then(d => console.log('✅ GET works:', d))
.catch(e => console.error('❌ GET failed:', e));

// Test 2: POST with body
fetch('http://95.216.14.232/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t'
  })
})
.then(r => r.json())
.then(d => console.log('✅ POST works:', d))
.catch(e => console.error('❌ POST failed:', e));
```

**✅ Pass Criteria:**
- No CORS errors in console
- Both requests succeed
- Response data is logged

---

### **Test 5: Network Tab Verification**

1. Open http://95.216.14.232
2. Open DevTools (F12) → Network tab
3. Login with admin credentials
4. Check the login request

**✅ Verify:**
- Request Headers show `Origin: http://95.216.14.232`
- Response Headers show `Access-Control-Allow-Origin: http://95.216.14.232`
- Response Headers show `Access-Control-Allow-Credentials: true`
- Status is 200 OK

---

## 📊 **VERIFICATION CHECKLIST**

### **Backend Configuration:**
- [ ] `TRUST_PROXY=true` in backend/.env
- [ ] Production IP in allowedOrigins array
- [ ] `credentials: true` in cors() config
- [ ] All methods (GET, POST, PUT, DELETE) allowed
- [ ] `app.options('*', cors())` present in server.js

### **Frontend Configuration:**
- [ ] `.env.production` has `http://95.216.14.232/api` (no :5000)
- [ ] Build files contain correct API URL
- [ ] No hardcoded `localhost` references in build

### **Nginx Configuration:**
- [ ] Upstream points to `127.0.0.1:5000`
- [ ] `proxy_set_header Host $host` present
- [ ] `proxy_set_header X-Real-IP $remote_addr` present
- [ ] `proxy_set_header X-Forwarded-For` present
- [ ] `proxy_set_header X-Forwarded-Proto` present

### **Runtime Verification:**
- [ ] Health endpoint returns CORS headers
- [ ] Preflight OPTIONS requests work
- [ ] POST requests with body work
- [ ] No CORS errors in browser console
- [ ] Network tab shows correct headers

---

## 🔍 **DETAILED HEADER INSPECTION**

### **Expected Request Headers:**
```
GET /api/health HTTP/1.1
Host: 95.216.14.232
Origin: http://95.216.14.232
Referer: http://95.216.14.232/
```

### **Expected Response Headers:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://95.216.14.232
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Range, X-Content-Range
Content-Type: application/json
```

---

## 📈 **AUTOMATED VERIFICATION SCRIPT**

Save this as `verify-cors.sh`:

```bash
#!/bin/bash

echo "🔍 CORS Verification Script"
echo "=========================="

API_URL="http://95.216.14.232/api"
ORIGIN="http://95.216.14.232"

# Test 1: Health Check
echo ""
echo "Test 1: Health Check with CORS"
RESPONSE=$(curl -s -i -H "Origin: $ORIGIN" "$API_URL/health")
if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin: $ORIGIN"; then
  echo "✅ PASS: CORS headers present"
else
  echo "❌ FAIL: CORS headers missing"
fi

# Test 2: Preflight
echo ""
echo "Test 2: Preflight OPTIONS Request"
RESPONSE=$(curl -s -i -X OPTIONS \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  "$API_URL/auth/login")
if echo "$RESPONSE" | grep -q "Access-Control-Allow-Methods"; then
  echo "✅ PASS: Preflight supported"
else
  echo "❌ FAIL: Preflight not working"
fi

# Test 3: POST Request
echo ""
echo "Test 3: POST Request with CORS"
RESPONSE=$(curl -s -i -X POST \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Kx9mP7qR2nF8sA5t"}' \
  "$API_URL/auth/login")
if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  echo "✅ PASS: POST with CORS works"
else
  echo "❌ FAIL: POST CORS headers missing"
fi

echo ""
echo "=========================="
echo "✅ CORS verification complete!"
```

**Run it:**
```bash
chmod +x verify-cors.sh
./verify-cors.sh
```

---

## 🎯 **SUCCESS INDICATORS**

### **✅ ALL TESTS PASS = CORS WORKING**

You should see:
- ✅ All curl tests return CORS headers
- ✅ Browser console has no CORS errors
- ✅ Network tab shows CORS headers
- ✅ Login works without errors
- ✅ All API calls succeed

### **❌ ANY TEST FAILS = TROUBLESHOOT**

See: [CORS Troubleshooting Guide](./CORS-TROUBLESHOOTING.md)

---

## 📋 **QUICK REFERENCE**

| Test | Command | Expected |
|------|---------|----------|
| Health Check | `curl -i -H "Origin: http://95.216.14.232" http://95.216.14.232/api/health` | CORS headers + 200 OK |
| Preflight | `curl -i -X OPTIONS -H "Origin: http://95.216.14.232" http://95.216.14.232/api/auth/login` | CORS headers + 204/200 |
| POST | `curl -i -X POST -H "Origin: http://95.216.14.232" -H "Content-Type: application/json" -d '{...}' http://95.216.14.232/api/auth/login` | CORS headers + 200 OK + token |
| Browser | Open DevTools Console and run fetch tests | No CORS errors |

---

## 🔗 **RELATED DOCS**

- [CORS Complete Guide](./CORS-GUIDE.md) - Understanding CORS
- [CORS Troubleshooting](./CORS-TROUBLESHOOTING.md) - Fix CORS issues
- [Post-Deployment Tests](../deployment/05-POST-DEPLOYMENT-TESTS.md) - Full testing

---

**Verification Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** ✅ Complete
