# 🔍 Production Configuration Review & Issues Analysis

**Date:** October 31, 2025  
**Server:** 95.216.14.232  
**Status:** ❌ Backend Down / Configuration Issues

---

## 📊 Issues Summary

| Issue | Severity | Status | Description |
|-------|----------|--------|-------------|
| **Backend Down** | 🔴 CRITICAL | Active | Backend service not responding on port 5000 |
| **401 Unauthorized** | 🔴 CRITICAL | Active | Login failing - likely no users in database |
| **404 logo192.png** | 🟡 MINOR | Active | Missing frontend asset |
| **Wrong API URL** | 🟠 HIGH | Active | Frontend calling `:5000` directly instead of Nginx |
| **502 API Docs** | 🔴 CRITICAL | Active | Swagger docs unreachable (backend down) |

---

## 🎯 Root Cause Analysis

### 1. Backend Service is DOWN ❌

**Evidence:**
- `POST http://95.216.14.232:5000/api/auth/login 401` - Direct port access
- `GET http://95.216.14.232/api/docs 502` - Nginx can't reach backend

**Why it's happening:**
The backend service (`hrm-backend.service`) is either:
1. Not started
2. Crashed on startup
3. Missing `.env` file
4. Database connection failed
5. Permission issues

**Expected state:**
- Backend should run on `localhost:5000` (internal only)
- Nginx should proxy requests from port `80` → backend `5000`
- Frontend should call `http://95.216.14.232/api` (through Nginx, NO port number)

---

### 2. Users NOT Created by Default ❌

**Configuration found:**
```bash
# In production .env template
SEED_DEMO_DATA=false  # ❌ Demo users DISABLED in production
```

**Your .env file shows:**
```bash
# backend/.env
SEED_DEMO_DATA=false
```

**This means:**
- ❌ Demo users are NOT automatically created
- ❌ Database has NO users after fresh deployment
- ✅ This is CORRECT for production security
- ⚠️  But requires manual first user creation

**How users SHOULD be created:**

#### Option A: Run Seeders Manually (Temporary - for testing)
```bash
# On RHEL server
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:seed:all
```

This creates:
- `admin@skyraksys.com` / `admin123`
- `hr@skyraksys.com` / `admin123`
- `lead@skyraksys.com` / `admin123`
- `employee1@skyraksys.com` / `admin123`
- `employee2@skyraksys.com` / `admin123`

#### Option B: Manual Admin Creation (Production Recommended)
```bash
# Connect to database
sudo -u postgres psql -d skyraksys_hrm_prod

-- Create admin user manually with bcrypt hash
-- Password: YourSecurePassword123
INSERT INTO users (id, email, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@yourcompany.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lZ0JvKPxGwKi',  -- admin123
  'admin',
  true,
  NOW(),
  NOW()
);
```

---

### 3. Frontend Configuration WRONG ❌

**Current frontend configuration:**
```bash
# frontend/.env (local development)
REACT_APP_API_URL=http://localhost:5000/api  # ❌ WRONG for production build
```

**Production .env.production:**
```bash
# frontend/.env.production
REACT_APP_API_URL=http://95.216.14.232/api  # ✅ CORRECT
```

**Problem:**
The **production build** is using the DEVELOPMENT `.env` file instead of `.env.production`!

**Error shows:**
```
POST http://95.216.14.232:5000/api/auth/login
                        ^^^^^ WRONG - should NOT have port number
```

Should be:
```
POST http://95.216.14.232/api/auth/login (through Nginx on port 80)
```

**Why this happens:**
When running `npm run build`, React uses `.env.production` by default, BUT:
- If `.env.production` is missing or not copied to production server
- Or if the build was done on Windows with wrong `.env`
- The minified bundle has the wrong API URL baked in

---

### 4. Missing logo192.png (Minor) 🟡

**Issue:**
```
GET http://95.216.14.232/logo192.png 404
```

**Root cause:**
- `frontend/public/index.html` references `logo192.png`
- File doesn't exist in `frontend/public/` directory

**Files in frontend/public:**
```
frontend/public/
├── assets/
├── employee-access-diagnostic.js
├── index.html
├── manifest.json
└── test-api.html
```

**Missing:**
- `logo192.png`
- `logo512.png`
- `favicon.ico`

---

## 🔐 Public/No-Auth Routes (Hidden URLs)

**Available WITHOUT authentication:**

### 1. Health Check (Public)
```
GET http://95.216.14.232/api/health
```
Returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-31T...",
  "uptime": 12345.67,
  "environment": "production",
  "database": "connected"
}
```

### 2. Status Monitor (Public)
```
GET http://95.216.14.232/status
```
Real-time server metrics dashboard (CPU, memory, requests)

### 3. API Documentation (Public)
```
GET http://95.216.14.232/api/docs
GET http://95.216.14.232/api/docs.json
```
Swagger UI documentation (if backend is running)

### 4. Static File Test (Public)
```
GET http://95.216.14.232/uploads/test.txt
```
Any files in `/uploads` directory (CORS enabled)

### 5. Debug Routes (DISABLED in Production) ✅
```
GET http://95.216.14.232/api/debug/*
```
**Status:** Disabled in production (code shows: `if (process.env.NODE_ENV !== 'production')`)

---

## 🛠️ Step-by-Step Fix Plan

### Step 1: Check Backend Service Status

```bash
# On RHEL server
sudo systemctl status hrm-backend

# If not running:
sudo systemctl start hrm-backend

# Check logs for errors:
sudo journalctl -u hrm-backend -n 50
```

**Common startup errors:**
- `EADDRINUSE` - Port 5000 already in use
- `ENOENT: .env` - Missing .env file
- `ECONNREFUSED` - Can't connect to database
- `Permission denied` - File ownership issues

### Step 2: Verify .env File Exists

```bash
# Check if .env exists
ls -l /opt/skyraksys-hrm/backend/.env

# If missing, copy template:
sudo cp /opt/skyraksys-hrm/redhatprod/templates/.env.production \
        /opt/skyraksys-hrm/backend/.env

# Update database password:
DB_PASS=$(cat /opt/skyraksys-hrm/.db_password)
sudo sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" \
        /opt/skyraksys-hrm/backend/.env

# Set permissions:
sudo chown hrmapp:hrmapp /opt/skyraksys-hrm/backend/.env
sudo chmod 600 /opt/skyraksys-hrm/backend/.env
```

### Step 3: Seed Demo Users (Temporary)

```bash
# Seed demo users for initial testing
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:seed:all

# Verify users created:
sudo -u postgres psql -d skyraksys_hrm_prod -c \
  "SELECT email, role FROM users;"
```

**Default credentials after seeding:**
- Email: `admin@skyraksys.com`
- Password: `admin123`

### Step 4: Fix Frontend API URL (CRITICAL)

```bash
# On RHEL server - rebuild frontend with correct .env
cd /opt/skyraksys-hrm/frontend

# Ensure .env.production has correct URL:
cat .env.production
# Should show: REACT_APP_API_URL=http://95.216.14.232/api

# Rebuild frontend:
sudo -u hrmapp npm run build

# Restart frontend service:
sudo systemctl restart hrm-frontend
```

### Step 5: Add Missing Logo Files

```bash
# Create placeholder logo files
cd /opt/skyraksys-hrm/frontend/public

# Create 192x192 placeholder (or copy your actual logo)
# For now, copy from a default React app or create SVG placeholders

# After adding files, rebuild:
cd /opt/skyraksys-hrm/frontend
sudo -u hrmapp npm run build
sudo systemctl restart hrm-frontend
```

### Step 6: Restart All Services

```bash
# Restart everything in order:
sudo systemctl restart postgresql-17
sleep 2
sudo systemctl restart hrm-backend
sleep 2
sudo systemctl restart hrm-frontend
sudo systemctl restart nginx

# Check all services running:
sudo systemctl status hrm-backend
sudo systemctl status hrm-frontend
sudo systemctl status nginx
```

### Step 7: Verify Fix

```bash
# Test backend directly:
curl http://localhost:5000/api/health

# Test through Nginx:
curl http://95.216.14.232/api/health

# Test login endpoint:
curl -X POST http://95.216.14.232/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@skyraksys.com","password":"admin123"}'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {...},
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

## 📋 Production Deployment Checklist

For future deployments:

### Backend
- [ ] `.env` file created from template
- [ ] Database password configured
- [ ] JWT secrets generated (64+ chars)
- [ ] Session secret generated (48+ chars)
- [ ] CORS origins updated with production IP/domain
- [ ] `SEED_DEMO_DATA=false` (after initial setup)
- [ ] `NODE_ENV=production`
- [ ] `TRUST_PROXY=true`
- [ ] File permissions: `chmod 600 .env`
- [ ] File ownership: `chown hrmapp:hrmapp .env`

### Frontend
- [ ] `.env.production` configured with correct API URL
- [ ] API URL does NOT include port number (`:5000`)
- [ ] Built with `npm run build` (uses .env.production)
- [ ] Logo files present in `public/` directory
- [ ] Build directory owned by `hrmapp` user

### Database
- [ ] PostgreSQL 17 installed and running
- [ ] Database `skyraksys_hrm_prod` created
- [ ] User `hrm_app` created with password
- [ ] Migrations run: `npx sequelize-cli db:migrate`
- [ ] Initial admin user created (manual or seeder)
- [ ] Database backups scheduled (cron)

### Services
- [ ] `hrm-backend.service` enabled and running
- [ ] `hrm-frontend.service` enabled and running
- [ ] `nginx` configured and running
- [ ] `postgresql-17` enabled and running
- [ ] All services set to start on boot

### Nginx
- [ ] Configuration file copied to `/etc/nginx/conf.d/hrm.conf`
- [ ] Server name matches IP or domain
- [ ] Proxy pass to `http://localhost:5000` (backend)
- [ ] Proxy pass to `http://localhost:3000` (frontend)
- [ ] Configuration tested: `nginx -t`
- [ ] Nginx reloaded: `systemctl reload nginx`

### Security
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] SELinux configured (httpd_can_network_connect)
- [ ] SSL certificate installed (optional but recommended)
- [ ] Debug routes disabled in production
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled

---

## 🎯 Immediate Action Items (Priority Order)

1. **🔴 CRITICAL - Start Backend**
   ```bash
   sudo systemctl start hrm-backend
   sudo journalctl -u hrm-backend -f
   ```

2. **🔴 CRITICAL - Seed Users**
   ```bash
   cd /opt/skyraksys-hrm/backend
   sudo -u hrmapp npx sequelize-cli db:seed:all
   ```

3. **🔴 CRITICAL - Rebuild Frontend**
   ```bash
   cd /opt/skyraksys-hrm/frontend
   sudo -u hrmapp npm run build
   sudo systemctl restart hrm-frontend
   ```

4. **🟠 HIGH - Test Login**
   ```bash
   curl -X POST http://95.216.14.232/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@skyraksys.com","password":"admin123"}'
   ```

5. **🟡 MEDIUM - Add Logo Files**
   - Add `logo192.png`, `logo512.png`, `favicon.ico` to `frontend/public/`
   - Rebuild frontend

---

## 📞 Support Commands

### Check Everything
```bash
# Run comprehensive diagnostic
bash check-prod-status.sh

# Or manual checks:
systemctl status hrm-backend hrm-frontend nginx postgresql-17
curl http://localhost:5000/api/health
curl http://95.216.14.232/api/health
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT COUNT(*) FROM users;"
```

### View Logs
```bash
# Backend logs (real-time)
sudo journalctl -u hrm-backend -f

# Backend logs (last 50 lines)
sudo journalctl -u hrm-backend -n 50

# Nginx error logs
sudo tail -f /var/log/nginx/hrm_error.log

# PostgreSQL logs
sudo tail -f /var/lib/pgsql/17/data/log/postgresql-*.log
```

### Quick Fixes
```bash
# Restart everything
sudo systemctl restart postgresql-17 hrm-backend hrm-frontend nginx

# Fix permissions
sudo chown -R hrmapp:hrmapp /opt/skyraksys-hrm/backend
sudo chmod 600 /opt/skyraksys-hrm/backend/.env

# Reseed database
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:seed:undo:all
sudo -u hrmapp npx sequelize-cli db:seed:all
```

---

## ✅ Success Criteria

Deployment is successful when:
- ✅ Backend responds: `curl http://localhost:5000/api/health` returns 200
- ✅ Nginx proxies correctly: `curl http://95.216.14.232/api/health` returns 200
- ✅ Login works: Browser can login at `http://95.216.14.232`
- ✅ No 401 errors in console
- ✅ No 502 errors in console
- ✅ Dashboard loads after login
- ✅ No console errors (except minor logo404 - can fix later)

---

## 📚 Documentation References

- **Main deployment guide:** `redhatprod/PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Quick start:** `redhatprod/START_HERE.md`
- **Backend README:** `backend/README.md`
- **Environment template:** `redhatprod/templates/.env.production`
- **Fix scripts:** `fix-backend.sh`, `check-prod-status.sh`

---

**Last Updated:** October 31, 2025  
**Next Action:** Run `fix-backend.sh` on production server
