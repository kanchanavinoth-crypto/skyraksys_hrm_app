# ✅ Post-Deployment Verification Tests
## Complete Testing After Deployment

**Last Updated:** October 22, 2025  
**Time Required:** 10 minutes  
**Run These:** Immediately after deployment

---

## 🎯 **TEST OVERVIEW**

After deployment, run these tests to ensure everything works:

1. ✅ Services are running
2. ✅ Backend API responds
3. ✅ Frontend loads
4. ✅ CORS works
5. ✅ Database connection works
6. ✅ Authentication works
7. ✅ Core features work

---

## 🔍 **SYSTEM TESTS**

### **Test 1: Check All Services**

```bash
# Backend
systemctl status hrm-backend
# Expected: active (running)

# Frontend  
systemctl status hrm-frontend
# Expected: active (running)

# Nginx
systemctl status nginx
# Expected: active (running)

# PostgreSQL
systemctl status postgresql-15
# Expected: active (running)
```

**✅ Pass:** All services show "active (running)"  
**❌ Fail:** Any service is "failed" or "inactive"

---

### **Test 2: Check Backend Health**

```bash
curl http://95.216.14.232/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T10:30:00.000Z",
  "uptime": 123.45,
  "database": "connected"
}
```

**✅ Pass:** Status 200, JSON response with "ok"  
**❌ Fail:** Connection refused, 500 error, or wrong response

---

### **Test 3: Check Frontend**

```bash
curl -I http://95.216.14.232
```

**Expected Response:**
```
HTTP/1.1 200 OK
Content-Type: text/html
```

**✅ Pass:** Status 200, Content-Type is text/html  
**❌ Fail:** 404, 502, or other error

---

### **Test 4: Check CORS**

```bash
curl -i -H "Origin: http://95.216.14.232" \
  http://95.216.14.232/api/health
```

**Expected Headers:**
```
Access-Control-Allow-Origin: http://95.216.14.232
Access-Control-Allow-Credentials: true
```

**✅ Pass:** CORS headers present  
**❌ Fail:** No CORS headers

---

## 🔐 **AUTHENTICATION TESTS**

### **Test 5: Admin Login (API)**

```bash
curl -X POST http://95.216.14.232/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "Kx9mP7qR2nF8sA5t"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@company.com",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }
}
```

**✅ Pass:** Returns token and user object  
**❌ Fail:** Error, wrong credentials, or no token

---

### **Test 6: HR Login (API)**

```bash
curl -X POST http://95.216.14.232/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hr@company.com",
    "password": "Hr9pQ2xM5nK8wT3v"
  }'
```

**✅ Pass:** Returns token for HR user  
**❌ Fail:** Login fails

---

### **Test 7: Employee Login (API)**

```bash
curl -X POST http://95.216.14.232/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@company.com",
    "password": "Em7rL4cN9fV2bH6m"
  }'
```

**✅ Pass:** Returns token for employee user  
**❌ Fail:** Login fails

---

## 🌐 **BROWSER TESTS**

### **Test 8: Open Application**

1. Open browser
2. Navigate to: `http://95.216.14.232`
3. Verify login page loads

**✅ Pass:** Login page displays correctly  
**❌ Fail:** Blank page, error page, or doesn't load

---

### **Test 9: Login as Admin**

1. Email: `admin@company.com`
2. Password: `Kx9mP7qR2nF8sA5t`
3. Click Login

**✅ Pass:** Redirects to dashboard  
**❌ Fail:** Error message or login fails

---

### **Test 10: Check Dashboard**

After logging in as admin:

1. Dashboard loads
2. No console errors (F12 → Console tab)
3. No CORS errors
4. Widgets display data

**✅ Pass:** Dashboard works, no errors  
**❌ Fail:** Errors in console or blank dashboard

---

### **Test 11: Navigate Menu**

Click through main menu items:

- Dashboard
- Employees
- Departments
- Attendance
- Leave Management
- Timesheets
- Reports

**✅ Pass:** All pages load without errors  
**❌ Fail:** Any page shows error or doesn't load

---

## 📊 **DATABASE TESTS**

### **Test 12: Check Database Connection**

```bash
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT COUNT(*) FROM users;"
```

**Expected:**
```
 count 
-------
     3
(1 row)
```

**✅ Pass:** Shows count (at least 3 demo users)  
**❌ Fail:** Connection error or no rows

---

### **Test 13: Verify Demo Data**

```bash
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT email, role FROM users;"
```

**Expected:**
```
         email          |  role   
------------------------+---------
 admin@company.com      | admin
 hr@company.com         | hr
 employee@company.com   | employee
(3 rows)
```

**✅ Pass:** All three users exist  
**❌ Fail:** Users missing

---

## 🔄 **API ENDPOINT TESTS**

### **Test 14: Get Users (with auth)**

```bash
# First, get token
TOKEN=$(curl -s -X POST http://95.216.14.232/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Kx9mP7qR2nF8sA5t"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Then, get users
curl -H "Authorization: Bearer $TOKEN" \
  http://95.216.14.232/api/users
```

**✅ Pass:** Returns array of users  
**❌ Fail:** 401 Unauthorized or error

---

### **Test 15: Create Department (with auth)**

```bash
TOKEN=$(curl -s -X POST http://95.216.14.232/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Kx9mP7qR2nF8sA5t"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X POST http://95.216.14.232/api/departments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Department",
    "description": "Created during post-deployment test"
  }'
```

**✅ Pass:** Returns created department object  
**❌ Fail:** Error or 401

---

## 📝 **LOG CHECKS**

### **Test 16: Check Backend Logs**

```bash
journalctl -u hrm-backend -n 50 --no-pager
```

**✅ Pass:** No errors, shows startup messages  
**❌ Fail:** Errors, crashes, or connection failures

---

### **Test 17: Check Frontend Logs**

```bash
journalctl -u hrm-frontend -n 50 --no-pager
```

**✅ Pass:** Shows serve process running  
**❌ Fail:** Errors or crashes

---

### **Test 18: Check Nginx Access Logs**

```bash
tail -n 20 /var/log/nginx/hrm_access.log
```

**✅ Pass:** Shows requests with 200/304 status codes  
**❌ Fail:** Many 404, 500, or other errors

---

### **Test 19: Check Nginx Error Logs**

```bash
tail -n 20 /var/log/nginx/hrm_error.log
```

**✅ Pass:** No critical errors  
**❌ Fail:** Connection refused, upstream errors

---

## 🎯 **PERFORMANCE TESTS**

### **Test 20: Response Time**

```bash
time curl -s http://95.216.14.232/api/health > /dev/null
```

**✅ Pass:** Completes in < 1 second  
**❌ Fail:** Takes > 3 seconds

---

### **Test 21: Multiple Concurrent Requests**

```bash
for i in {1..10}; do
  curl -s http://95.216.14.232/api/health &
done
wait
```

**✅ Pass:** All requests succeed  
**❌ Fail:** Some requests fail or timeout

---

## 📋 **QUICK TEST CHECKLIST**

Run through this quickly:

### **System Level:**
- [ ] Backend service running
- [ ] Frontend service running
- [ ] Nginx service running
- [ ] PostgreSQL service running
- [ ] Health endpoint responds

### **CORS:**
- [ ] CORS headers present
- [ ] No CORS errors in browser console
- [ ] Credentials allowed

### **Authentication:**
- [ ] Admin login works (API)
- [ ] Admin login works (Browser)
- [ ] Token is returned
- [ ] Protected routes work with token

### **Frontend:**
- [ ] Application loads
- [ ] No JavaScript errors
- [ ] Dashboard displays
- [ ] Menu navigation works

### **Database:**
- [ ] Database connection works
- [ ] Demo users exist
- [ ] Can query tables

### **Logs:**
- [ ] No errors in backend logs
- [ ] No errors in frontend logs
- [ ] No critical errors in Nginx logs

---

## 🔧 **AUTOMATED TEST SCRIPT**

Save as `post-deployment-tests.sh`:

```bash
#!/bin/bash

echo "🧪 Post-Deployment Verification Tests"
echo "====================================="

PASSED=0
FAILED=0

# Test 1: Backend Health
echo ""
echo "Test 1: Backend Health Check"
if curl -s http://95.216.14.232/api/health | grep -q '"status":"ok"'; then
  echo "✅ PASS"
  ((PASSED++))
else
  echo "❌ FAIL"
  ((FAILED++))
fi

# Test 2: Frontend
echo ""
echo "Test 2: Frontend Access"
if curl -s -I http://95.216.14.232 | grep -q "200 OK"; then
  echo "✅ PASS"
  ((PASSED++))
else
  echo "❌ FAIL"
  ((FAILED++))
fi

# Test 3: CORS
echo ""
echo "Test 3: CORS Headers"
if curl -s -I -H "Origin: http://95.216.14.232" http://95.216.14.232/api/health | grep -q "Access-Control-Allow-Origin"; then
  echo "✅ PASS"
  ((PASSED++))
else
  echo "❌ FAIL"
  ((FAILED++))
fi

# Test 4: Login
echo ""
echo "Test 4: Admin Login"
if curl -s -X POST http://95.216.14.232/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Kx9mP7qR2nF8sA5t"}' \
  | grep -q '"token"'; then
  echo "✅ PASS"
  ((PASSED++))
else
  echo "❌ FAIL"
  ((FAILED++))
fi

echo ""
echo "====================================="
echo "Results: $PASSED passed, $FAILED failed"

if [ $FAILED -eq 0 ]; then
  echo "✅ ALL TESTS PASSED - Deployment Successful!"
  exit 0
else
  echo "❌ SOME TESTS FAILED - Check logs"
  exit 1
fi
```

**Run it:**
```bash
chmod +x post-deployment-tests.sh
./post-deployment-tests.sh
```

---

## 🎉 **SUCCESS CRITERIA**

### **✅ DEPLOYMENT SUCCESSFUL IF:**
- All services running
- Health endpoint responds
- Frontend loads
- CORS works
- Login works
- No critical errors in logs

### **❌ NEEDS ATTENTION IF:**
- Any service is down
- Health check fails
- CORS errors in console
- Login doesn't work
- Critical errors in logs

---

## 🔗 **IF TESTS FAIL**

See troubleshooting guides:
- [General Troubleshooting](./08-TROUBLESHOOTING.md)
- [CORS Troubleshooting](../cors/CORS-TROUBLESHOOTING.md)
- [Rollback Procedure](./06-ROLLBACK.md)

---

**Testing Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** ✅ Complete
