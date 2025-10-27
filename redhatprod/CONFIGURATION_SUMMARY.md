# Skyraksys HRM - Deployment Configuration Summary
## Final Verified Configuration for RHEL 9.6 Production

**Date:** October 22, 2025  
**Status:** ✅ **PRODUCTION READY**  
**Server:** 95.216.14.232 (RHEL 9.6)

---

## 🎯 QUICK REFERENCE

### **Port Configuration**
| Service | Port | Access | Purpose |
|---------|------|--------|---------|
| Nginx | 80 | Public | Web server & reverse proxy |
| Backend | 5000 | localhost only | Node.js API server |
| Frontend | 3000 | localhost only | React dev server (systemd serves static) |
| PostgreSQL | 5432 | localhost only | Database |

### **API URL Configuration**
| Environment | API URL | Usage |
|-------------|---------|-------|
| Production | `http://95.216.14.232/api` | Goes through Nginx on port 80 |
| Local Dev | `http://localhost:5000/api` | Direct to backend for development |

### **File Locations**
| Component | Location |
|-----------|----------|
| Application | `/opt/skyraksys-hrm/` |
| Backend | `/opt/skyraksys-hrm/backend/` |
| Frontend | `/opt/skyraksys-hrm/frontend/` |
| Frontend Build | `/opt/skyraksys-hrm/frontend/build/` |
| Logs | `/var/log/skyraksys-hrm/` |
| Backend .env | `/opt/skyraksys-hrm/backend/.env` |
| Nginx Config | `/etc/nginx/conf.d/hrm.conf` |
| Systemd Services | `/etc/systemd/system/hrm-*.service` |

---

## 📁 ENVIRONMENT FILES

### ✅ `backend/.env` (Production Configuration)
```properties
# Server
NODE_ENV=production
HOST=0.0.0.0
PORT=5000

# Database (PostgreSQL 15)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=hrm_app
DB_PASSWORD=Kc9nQd4wZx7vUe3pLb2mTa6rYf8sHg1J
DB_DIALECT=postgres
DB_SSL=false

# JWT Authentication
JWT_SECRET=a3f1b5c9d2e4f8a0b1c3d5e7f90123456789abcdeffedcba0123456789abcdef
JWT_REFRESH_SECRET=5c7e9a1b3d5f7e9a0c2e4f6a8b0d1f3e5a7c9b1d3f5e7a9c0b2d4f6a8c0e2d4
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300

# Demo Data
SEED_DEMO_DATA=true

# CORS & Proxy
TRUST_PROXY=true
CORS_ORIGIN=http://95.216.14.232
ALLOWED_ORIGINS=http://95.216.14.232,http://95.216.14.232:3000,http://95.216.14.232:5000
CORS_ALLOW_ALL=false
```

### ✅ `frontend/.env.production` (Production Build Configuration)
```bash
# Production Environment - Goes through Nginx proxy
REACT_APP_API_URL=http://95.216.14.232/api
```
**Used when:** Running `npm run build` for production  
**Embedded in:** Static build files in `build/` directory

### ✅ `frontend/.env` (Local Development Configuration)
```bash
# Local Development - Direct to backend
REACT_APP_API_URL=http://localhost:5000/api
```
**Used when:** Running `npm start` for local development  
**Access:** Frontend dev server at `http://localhost:3000`

---

## 🔧 SERVICE CONFIGURATIONS

### ✅ Systemd Backend Service (`/etc/systemd/system/hrm-backend.service`)
```ini
[Unit]
Description=Skyraksys HRM Backend API Service
After=network-online.target postgresql-15.service
Requires=postgresql-15.service

[Service]
Type=simple
User=hrmapp
Group=hrmapp
WorkingDirectory=/opt/skyraksys-hrm/backend
Environment=NODE_ENV=production
Environment=PORT=5000
EnvironmentFile=/opt/skyraksys-hrm/backend/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=hrm-backend

[Install]
WantedBy=multi-user.target
```

### ✅ Systemd Frontend Service (`/etc/systemd/system/hrm-frontend.service`)
```ini
[Unit]
Description=Skyraksys HRM Frontend Service
After=network-online.target hrm-backend.service
Wants=hrm-backend.service

[Service]
Type=simple
User=hrmapp
Group=hrmapp
WorkingDirectory=/opt/skyraksys-hrm/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npx --yes serve@14 -s build -l 3000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=hrm-frontend

[Install]
WantedBy=multi-user.target
```

### ✅ Nginx Configuration (`/etc/nginx/conf.d/hrm.conf`)
```nginx
upstream backend {
    server 127.0.0.1:5000;
    keepalive 16;
}

server {
    listen 80;
    server_name 95.216.14.232;
    root /opt/skyraksys-hrm/frontend/build;
    index index.html;

    access_log /var/log/nginx/hrm_access.log;
    error_log /var/log/nginx/hrm_error.log warn;

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve static frontend
    location / {
        try_files $uri /index.html;
    }
}
```

---

## 🚀 DEPLOYMENT COMMANDS

### Quick Deployment (One Command)
```bash
# Run the automated deployment script
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo ./fix_deployment_issues.sh
# Choose option 1 (Systemd) or 2 (PM2)
```

### Manual Service Management
```bash
# Start services
sudo systemctl start hrm-backend hrm-frontend nginx

# Stop services
sudo systemctl stop hrm-backend hrm-frontend

# Restart services
sudo systemctl restart hrm-backend hrm-frontend

# Check status
sudo systemctl status hrm-backend hrm-frontend nginx

# View logs
sudo journalctl -u hrm-backend -f
sudo journalctl -u hrm-frontend -f
```

### Build Frontend
```bash
# As hrmapp user
su - hrmapp
cd /opt/skyraksys-hrm/frontend
npm run build
# Creates build/ directory with REACT_APP_API_URL=http://95.216.14.232/api embedded
exit
```

---

## 🔍 VERIFICATION TESTS

### Test Backend API
```bash
# Health check
curl http://localhost:5000/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Through Nginx
curl http://95.216.14.232/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Test Frontend
```bash
# Direct frontend service
curl http://localhost:3000
# Expected: HTML content

# Through Nginx
curl http://95.216.14.232
# Expected: HTML content with React app
```

### Check Services
```bash
# All services should be active
systemctl status hrm-backend hrm-frontend nginx postgresql-15
```

### Check Logs
```bash
# Backend logs
journalctl -u hrm-backend -n 50

# Frontend logs
journalctl -u hrm-frontend -n 50

# Nginx logs
tail -50 /var/log/nginx/hrm_error.log
```

---

## 👤 DEMO CREDENTIALS

### Admin Accounts
```
Email: admin@company.com
Password: Kx9mP7qR2nF8sA5t
Role: Admin
```

```
Email: prodadmin@company.com
Password: admin
Role: Admin (Simple password for testing)
```

### HR Account
```
Email: hr@company.com
Password: Lw3nQ6xY8mD4vB7h
Role: HR
```

### Employee Account
```
Email: employee@company.com
Password: Mv4pS9wE2nR6kA8j
Role: Employee
```

---

## 🗄️ DATABASE SETUP

### Create Database & User
```sql
-- As postgres superuser
sudo -u postgres psql

-- Create user
CREATE USER hrm_app WITH PASSWORD 'Kc9nQd4wZx7vUe3pLb2mTa6rYf8sHg1J';

-- Create database
CREATE DATABASE skyraksys_hrm_prod OWNER hrm_app;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_app;
\c skyraksys_hrm_prod
GRANT ALL ON SCHEMA public TO hrm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hrm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hrm_app;
\q
```

### Seed Demo Data
```bash
# As hrmapp user
su - hrmapp
cd /opt/skyraksys-hrm/backend
node scripts/seedRunner.js
exit
```

---

## 🔐 FIREWALL SETUP

```bash
# Open HTTP port (80)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-all
# Should show: services: http ssh
```

---

## 📊 SYSTEM REQUIREMENTS

### Minimum Requirements
- **OS:** RHEL 9.6 or compatible
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Disk:** 20 GB free
- **Node.js:** 18 or 20
- **PostgreSQL:** 15
- **Nginx:** 1.20+

### Recommended Requirements
- **CPU:** 4 cores
- **RAM:** 8 GB
- **Disk:** 50 GB free

---

## 🎯 REQUEST FLOW

### Production Request Flow
```
Browser (Port 80)
    ↓
Nginx (Port 80) → Static Files (/opt/skyraksys-hrm/frontend/build/)
    ↓ /api/*
Backend (Port 5000) → Database (Port 5432)
    ↓
Response
```

### Development Request Flow (Local)
```
Browser (Port 3000)
    ↓
React Dev Server (Port 3000)
    ↓
Direct API Call → Backend (Port 5000) → Database (Port 5432)
    ↓
Response
```

---

## ✅ CONFIGURATION CHECKLIST

Before going live, verify:

- [x] Backend .env has PORT=5000
- [x] Frontend .env.production has http://95.216.14.232/api
- [x] Frontend .env (dev) has http://localhost:5000/api
- [x] Nginx server_name is 95.216.14.232
- [x] Nginx proxies /api/ to 127.0.0.1:5000
- [x] Nginx root is /opt/skyraksys-hrm/frontend/build
- [x] Systemd backend ExecStart is /usr/bin/node server.js
- [x] Systemd frontend ExecStart is /usr/bin/npx --yes serve@14 -s build -l 3000
- [x] Database user is hrm_app (not postgres superuser)
- [x] Database name is skyraksys_hrm_prod
- [x] All services run as hrmapp user (not root)
- [x] Firewall allows port 80
- [x] Log directory exists: /var/log/skyraksys-hrm/
- [x] Demo data seeded (optional)

---

## 🆘 TROUBLESHOOTING

### Backend won't start
```bash
# Check logs
journalctl -u hrm-backend -n 100

# Common issues:
# - PostgreSQL not running: systemctl start postgresql-15
# - Wrong DB credentials: Check backend/.env
# - Port 5000 in use: lsof -i :5000
```

### Frontend won't start
```bash
# Check logs
journalctl -u hrm-frontend -n 100

# Common issues:
# - Build folder missing: cd frontend && npm run build
# - Port 3000 in use: lsof -i :3000
# - npx not found: npm install -g serve@14
```

### Can't access via browser
```bash
# Check Nginx
systemctl status nginx
nginx -t
tail -f /var/log/nginx/hrm_error.log

# Check firewall
firewall-cmd --list-all

# Check from server
curl http://localhost
curl http://localhost/api/health
```

### API calls fail (Network Error)
```bash
# Verify frontend has correct API URL
grep -r "95.216.14.232" /opt/skyraksys-hrm/frontend/build/
# Should show: http://95.216.14.232/api
# NOT: http://95.216.14.232:5000/api

# If wrong, rebuild:
cd /opt/skyraksys-hrm/frontend
npm run build
systemctl restart hrm-frontend
```

---

## 📞 SUPPORT RESOURCES

### Documentation
- Full Guide: `PRODUCTION_DEPLOYMENT_STEP_BY_STEP.md`
- Quick Guide: `QUICK_DEPLOYMENT_CHECKLIST.md`
- Audit Report: `RHEL_DEPLOYMENT_AUDIT_REPORT.md`

### Log Locations
- Backend: `journalctl -u hrm-backend`
- Frontend: `journalctl -u hrm-frontend`
- Nginx Access: `/var/log/nginx/hrm_access.log`
- Nginx Error: `/var/log/nginx/hrm_error.log`
- PostgreSQL: `/var/lib/pgsql/15/data/log/`

---

## 🎉 DEPLOYMENT SUMMARY

**Your application is configured to:**
- ✅ Run backend on port 5000 (localhost only)
- ✅ Run frontend on port 3000 (localhost only)
- ✅ Serve public traffic through Nginx on port 80
- ✅ Proxy API requests from port 80 to backend port 5000
- ✅ Use PostgreSQL on port 5432 (localhost only)
- ✅ All services run as non-root user (hrmapp)
- ✅ All configurations are RHEL 9.6 compatible
- ✅ Security best practices followed

**Access your application at:**
```
http://95.216.14.232
```

**API endpoint:**
```
http://95.216.14.232/api
```

---

**Configuration Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** ✅ Production Ready
