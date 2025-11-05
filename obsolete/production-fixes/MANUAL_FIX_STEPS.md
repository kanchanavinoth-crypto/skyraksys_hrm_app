# 🔧 Manual Steps to Fix Production Issues

**Server:** 95.216.14.232  
**Date:** October 31, 2025  

---

## 📋 **Step-by-Step Manual Fix Guide**

Follow these steps **in order** on your RHEL production server.

---

## **STEP 1: Connect to Your Server**

```bash
# SSH into your RHEL server
ssh root@95.216.14.232
# or
ssh your-username@95.216.14.232
```

---

## **STEP 2: Check Current Status**

```bash
# Check if services are running
sudo systemctl status hrm-backend
sudo systemctl status hrm-frontend
sudo systemctl status nginx
sudo systemctl status postgresql-17

# Check if backend is responding
curl http://localhost:5000/api/health
```

**If backend is not running, skip to Step 3. If running, continue to Step 4.**

---

## **STEP 3: Start/Fix Backend Service**

### **3a. Check if .env file exists:**

```bash
# Check for .env file
ls -l /opt/skyraksys-hrm/backend/.env
```

### **3b. If .env is missing, create it:**

```bash
# Copy template
sudo cp /opt/skyraksys-hrm/redhatprod/templates/.env.production \
        /opt/skyraksys-hrm/backend/.env

# Get database password
cat /opt/skyraksys-hrm/.db_password

# Edit .env file
sudo nano /opt/skyraksys-hrm/backend/.env
```

**Update these values in .env:**
1. Find `DB_PASSWORD=` and paste the password from above
2. Save and exit (Ctrl+X, Y, Enter)

### **3c. Set correct permissions:**

```bash
# Set ownership and permissions
sudo chown hrmapp:hrmapp /opt/skyraksys-hrm/backend/.env
sudo chmod 600 /opt/skyraksys-hrm/backend/.env

# Verify
ls -l /opt/skyraksys-hrm/backend/.env
# Should show: -rw------- 1 hrmapp hrmapp
```

### **3d. Start backend:**

```bash
# Start the service
sudo systemctl start hrm-backend

# Check status
sudo systemctl status hrm-backend

# If failed, check logs
sudo journalctl -u hrm-backend -n 50
```

### **3e. Test backend:**

```bash
# Should return JSON with status: healthy
curl http://localhost:5000/api/health
```

---

## **STEP 4: Seed Demo Users in Database**

### **4a. Check if PostgreSQL is running:**

```bash
sudo systemctl status postgresql-17

# If not running, start it
sudo systemctl start postgresql-17
```

### **4b. Check if users exist:**

```bash
# Check user count
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT COUNT(*) FROM users;"

# If count is 0, proceed to seed users
```

### **4c. Run seeders:**

```bash
# Navigate to backend directory
cd /opt/skyraksys-hrm/backend

# Run seeder as hrmapp user
sudo -u hrmapp npx sequelize-cli db:seed:all
```

**Expected output:**
```
Sequelize CLI [Node: 22.x.x, CLI: 6.x.x, ORM: 6.x.x]

Loaded configuration file "config/config.json".
Using environment "production".
== 20240101000000-initial-data: migrating =======
== 20240101000000-initial-data: migrated (0.XXXs)

Seeding complete!
```

### **4d. Verify users were created:**

```bash
# List all users
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT email, role FROM users;"
```

**You should see:**
```
           email            |   role   
---------------------------+----------
 admin@skyraksys.com       | admin
 hr@skyraksys.com          | hr
 lead@skyraksys.com        | manager
 employee1@skyraksys.com   | employee
 employee2@skyraksys.com   | employee
```

### **4e. Note the credentials:**

```
Email: admin@skyraksys.com
Password: admin123

Email: hr@skyraksys.com
Password: admin123

Email: lead@skyraksys.com
Password: admin123
```

---

## **STEP 5: Fix Frontend Configuration (CRITICAL)**

### **5a. Check current package.json:**

```bash
cd /opt/skyraksys-hrm/frontend

# Check if proxy exists (this is the problem!)
grep -n '"proxy"' package.json
```

**If you see output like:**
```
66:  "proxy": "http://localhost:5000"
```

**This needs to be removed!**

### **5b. Remove proxy from package.json:**

```bash
# Backup first
cp package.json package.json.backup

# Remove the proxy line
sed -i '/"proxy":/d' package.json

# Verify it's gone
grep '"proxy"' package.json
# Should return nothing
```

**Or manually edit:**
```bash
# Edit file
nano package.json

# Find and DELETE this line:
#   "proxy": "http://localhost:5000"

# Save and exit (Ctrl+X, Y, Enter)
```

### **5c. Create/update .env.production:**

```bash
# Create production environment file
cat > /opt/skyraksys-hrm/frontend/.env.production << 'EOF'
# Production Environment
# API URL goes through Nginx on port 80 (NO port 5000)
REACT_APP_API_URL=http://95.216.14.232/api
EOF

# Verify contents
cat /opt/skyraksys-hrm/frontend/.env.production
```

**Should show:**
```
REACT_APP_API_URL=http://95.216.14.232/api
```

**Important:** NO `:5000` in the URL!

### **5d. Update development .env (for reference):**

```bash
# Create/update .env for local development reference
cat > /opt/skyraksys-hrm/frontend/.env << 'EOF'
# Local Development Environment
# This connects to local backend on port 5000
REACT_APP_API_URL=http://localhost:5000/api

# Note: Production builds use .env.production automatically
EOF
```

---

## **STEP 6: Rebuild Frontend**

### **6a. Clean old build:**

```bash
cd /opt/skyraksys-hrm/frontend

# Remove old build directory
rm -rf build/
```

### **6b. Build production bundle:**

```bash
# Build as hrmapp user (this takes 2-3 minutes)
sudo -u hrmapp npm run build
```

**Expected output:**
```
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:

  XX KB  build/static/js/main.xxxxx.js
  XX KB  build/static/css/main.xxxxx.css

The build folder is ready to be deployed.
```

### **6c. Verify build:**

```bash
# Check build directory exists
ls -lh /opt/skyraksys-hrm/frontend/build/

# Check that NO :5000 appears in build files
grep -r "5000" /opt/skyraksys-hrm/frontend/build/

# If you see :5000 mentioned, the build used wrong config
# Go back to Step 5 and verify .env.production
```

### **6d. Set permissions:**

```bash
# Ensure hrmapp owns the build
sudo chown -R hrmapp:hrmapp /opt/skyraksys-hrm/frontend/build/
```

---

## **STEP 7: Restart All Services**

### **7a. Stop services:**

```bash
sudo systemctl stop hrm-backend
sudo systemctl stop hrm-frontend
```

### **7b. Start backend:**

```bash
sudo systemctl start hrm-backend

# Wait a few seconds
sleep 3

# Check status
sudo systemctl status hrm-backend
```

**Expected:** "Active: active (running)"

### **7c. Start frontend:**

```bash
sudo systemctl start hrm-frontend

# Wait a few seconds
sleep 2

# Check status
sudo systemctl status hrm-frontend
```

**Note:** Frontend service might not be critical if Nginx serves the build directly.

### **7d. Reload Nginx:**

```bash
# Test Nginx configuration first
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

---

## **STEP 8: Verification Tests**

### **8a. Test backend directly:**

```bash
# Should return JSON with "status": "healthy"
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-31T...",
  "uptime": 123.45,
  "environment": "production",
  "database": "connected"
}
```

### **8b. Test backend through Nginx:**

```bash
# Should return same as above
curl http://95.216.14.232/api/health
```

**If you get 502 error:** Backend is not running - go back to Step 3

### **8c. Test login endpoint:**

```bash
# Test login with demo credentials
curl -X POST http://95.216.14.232/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@skyraksys.com","password":"admin123"}'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "admin@skyraksys.com",
    "role": "admin"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**If 401 error:** Users not seeded - go back to Step 4

### **8d. Test frontend:**

```bash
# Should return HTML
curl http://95.216.14.232/ | head -n 20
```

---

## **STEP 9: Browser Testing**

### **9a. Open browser:**

1. Open your browser
2. Press **Ctrl+Shift+Delete** (Clear all cache)
3. Or use **Incognito/Private window**
4. Navigate to: `http://95.216.14.232`

### **9b. Check browser console:**

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for errors

**✅ GOOD - No errors:**
```
(Clean console)
```

**❌ BAD - Still seeing errors:**
```
POST http://95.216.14.232:5000/api/auth/login 401
                        ^^^^^ Still has :5000
```

**If still seeing :5000:**
- Clear browser cache again (Ctrl+Shift+Delete)
- Check that frontend was rebuilt (Step 6)
- Verify .env.production is correct (Step 5c)

### **9c. Check Network tab:**

1. In DevTools, go to **Network** tab
2. Try to login
3. Look at the request URLs

**✅ CORRECT URLs:**
```
http://95.216.14.232/api/auth/login
http://95.216.14.232/api/health
http://95.216.14.232/api/employees
```

**❌ WRONG URLs (if you see these, frontend not fixed):**
```
http://95.216.14.232:5000/api/auth/login  ← Has :5000
```

### **9d. Login test:**

1. Enter credentials:
   - Email: `admin@skyraksys.com`
   - Password: `admin123`
2. Click **Login**

**✅ SUCCESS:** Dashboard loads, no console errors

**❌ FAILED:** See troubleshooting section below

---

## **STEP 10: Post-Fix Verification**

### **Check all services:**

```bash
# All should show "active (running)"
sudo systemctl status postgresql-17
sudo systemctl status hrm-backend
sudo systemctl status hrm-frontend
sudo systemctl status nginx
```

### **Check logs for errors:**

```bash
# Backend logs (should have no errors)
sudo journalctl -u hrm-backend -n 50

# Nginx error logs (should be empty or minimal)
sudo tail -n 20 /var/log/nginx/hrm_error.log
```

---

## 🆘 **Troubleshooting Common Issues**

### **Issue 1: Backend won't start**

```bash
# Check logs
sudo journalctl -u hrm-backend -n 100

# Common fixes:
# - Check .env file exists and has correct DB password
# - Check PostgreSQL is running
# - Check port 5000 is not in use: sudo ss -tlnp | grep 5000
```

### **Issue 2: Login returns 401**

```bash
# Check if users exist
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT email FROM users;"

# If no users, reseed:
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:seed:all
```

### **Issue 3: Still seeing :5000 in browser**

```bash
# Verify proxy removed from package.json
grep proxy /opt/skyraksys-hrm/frontend/package.json
# Should return nothing

# Verify .env.production is correct
cat /opt/skyraksys-hrm/frontend/.env.production
# Should show: REACT_APP_API_URL=http://95.216.14.232/api (no :5000)

# Rebuild frontend
cd /opt/skyraksys-hrm/frontend
rm -rf build/
sudo -u hrmapp npm run build
sudo systemctl restart hrm-frontend

# Clear browser cache completely
# Try incognito window
```

### **Issue 4: 502 Bad Gateway**

```bash
# Check backend is running
curl http://localhost:5000/api/health

# If not responding:
sudo systemctl restart hrm-backend
sudo journalctl -u hrm-backend -n 50

# Check Nginx can connect to backend
sudo tail -f /var/log/nginx/hrm_error.log
```

### **Issue 5: Database connection errors**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql-17

# If not running:
sudo systemctl start postgresql-17

# Test connection
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT 1;"

# Check .env has correct DB password
cat /opt/skyraksys-hrm/.db_password
# Compare with DB_PASSWORD in /opt/skyraksys-hrm/backend/.env
```

---

## 📊 **Success Checklist**

After completing all steps, verify:

- [ ] PostgreSQL is running
- [ ] Backend service is running
- [ ] Frontend service is running (or build exists)
- [ ] Nginx is running
- [ ] `curl http://localhost:5000/api/health` returns 200
- [ ] `curl http://95.216.14.232/api/health` returns 200
- [ ] Database has 5 demo users
- [ ] `package.json` has NO `"proxy"` entry
- [ ] `.env.production` has `http://95.216.14.232/api` (no :5000)
- [ ] Frontend build directory exists
- [ ] Browser shows NO :5000 in Network tab
- [ ] Login works with `admin@skyraksys.com` / `admin123`
- [ ] Dashboard loads successfully
- [ ] Browser console has NO errors

---

## 🎯 **Quick Reference Commands**

```bash
# Check services
sudo systemctl status hrm-backend hrm-frontend nginx postgresql-17

# Restart everything
sudo systemctl restart postgresql-17 hrm-backend hrm-frontend nginx

# View logs
sudo journalctl -u hrm-backend -f
sudo tail -f /var/log/nginx/hrm_error.log

# Test endpoints
curl http://localhost:5000/api/health
curl http://95.216.14.232/api/health

# Check users in database
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT email, role FROM users;"

# Reseed users
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:seed:all

# Rebuild frontend
cd /opt/skyraksys-hrm/frontend
rm -rf build/
sudo -u hrmapp npm run build
sudo systemctl restart hrm-frontend
```

---

## 📞 **Need Help?**

If still having issues after following all steps:

1. **Collect diagnostic info:**
   ```bash
   sudo systemctl status hrm-backend > status.txt
   sudo journalctl -u hrm-backend -n 100 > backend-logs.txt
   curl http://localhost:5000/api/health > health-test.txt 2>&1
   curl http://95.216.14.232/api/health >> health-test.txt 2>&1
   ```

2. **Check these files:**
   - `/opt/skyraksys-hrm/backend/.env` (exists and has DB password)
   - `/opt/skyraksys-hrm/frontend/.env.production` (has correct URL)
   - `/opt/skyraksys-hrm/frontend/package.json` (no proxy)

3. **Review documentation:**
   - `PRODUCTION_ISSUES_ANALYSIS.md`
   - `CRITICAL_PROXY_ISSUE.md`
   - `redhatprod/PRODUCTION_DEPLOYMENT_GUIDE.md`

---

**Last Updated:** October 31, 2025  
**Estimated Time:** 15-20 minutes  
**Difficulty:** Intermediate
