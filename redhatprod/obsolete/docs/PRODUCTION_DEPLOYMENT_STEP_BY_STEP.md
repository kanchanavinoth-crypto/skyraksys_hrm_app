# Skyraksys HRM - Production Deployment Guide
## Step-by-Step Instructions for RHEL 9.6 Server (95.216.14.232)

**Last Updated:** October 22, 2025  
**Server IP:** 95.216.14.232  
**Target Audience:** Novice users - No configuration changes needed!

---

## 📋 **Overview**

This guide provides complete step-by-step instructions to deploy the Skyraksys HRM system to your production server. All configurations are pre-set - you just need to follow the steps.

**What You'll Deploy:**
- Backend API (Node.js/Express) on port 5000
- Frontend (React) on port 3000
- PostgreSQL Database on port 5432
- Nginx (reverse proxy) on port 80

**What You'll Need:**
- Production server: 95.216.14.232 (RHEL 9.6)
- Root/sudo access to the server
- Your local Windows machine with the code
- SSH client (PuTTY or Windows Terminal)
- 30-45 minutes of time

---

## 🎯 **Pre-Deployment Checklist**

Before starting, ensure you have:

- [ ] Root password or sudo access for server 95.216.14.232
- [ ] Code repository on your local machine at `d:\skyraksys_hrm`
- [ ] SSH access to the server working
- [ ] Server has internet connection (for npm install)
- [ ] PostgreSQL 15 installed on server
- [ ] Node.js 18+ installed on server

---

## 📂 **PART 1: Prepare Your Local Code**

### Step 1: Verify All Configuration Files Are Correct

All configurations are already set correctly. Just verify these files exist:

**1.1 Backend Environment (`backend/.env`)**
```bash
# Should contain:
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=hrm_app
```

**1.2 Frontend Production Environment (`frontend/.env.production`)**
```bash
# Should contain:
REACT_APP_API_URL=http://95.216.14.232/api
```

**1.3 Nginx Configuration (`redhatprod/configs/nginx-hrm-static.95.216.14.232.conf`)**
```nginx
# Should show:
server_name 95.216.14.232;
proxy_pass http://backend; # Points to 127.0.0.1:5000
```

✅ **All these files are already configured correctly - no changes needed!**

---

## 📦 **PART 2: Transfer Code to Server**

### Step 2: Connect to Your Server

**Option A: Using Windows Terminal or CMD**
```cmd
ssh root@95.216.14.232
```

**Option B: Using PuTTY**
- Host: 95.216.14.232
- Port: 22
- Login as: root

### Step 3: Create Application Directory

```bash
# Create main directory
mkdir -p /opt/skyraksys-hrm

# Create application user
useradd -r -s /bin/bash -d /home/hrmapp -m hrmapp

# Set ownership
chown -R hrmapp:hrmapp /opt/skyraksys-hrm
```

### Step 4: Transfer Code from Windows to Server

**From your Windows machine (PowerShell or CMD):**

```cmd
# Navigate to your code directory
cd d:\skyraksys_hrm

# Transfer backend
scp -r backend root@95.216.14.232:/opt/skyraksys-hrm/

# Transfer frontend
scp -r frontend root@95.216.14.232:/opt/skyraksys-hrm/

# Transfer deployment scripts
scp -r redhatprod root@95.216.14.232:/opt/skyraksys-hrm/

# Transfer package files
scp package.json root@95.216.14.232:/opt/skyraksys-hrm/
scp ecosystem.config.js root@95.216.14.232:/opt/skyraksys-hrm/
```

**Or use WinSCP (GUI tool):**
1. Download WinSCP from https://winscp.net
2. Connect to 95.216.14.232
3. Drag and drop folders: `backend`, `frontend`, `redhatprod` to `/opt/skyraksys-hrm/`

### Step 5: Set Correct Permissions

**Back on the server:**
```bash
# Set ownership
chown -R hrmapp:hrmapp /opt/skyraksys-hrm

# Set permissions
chmod -R 755 /opt/skyraksys-hrm

# Make scripts executable
chmod +x /opt/skyraksys-hrm/redhatprod/scripts/*.sh
```

---

## 🗄️ **PART 3: Setup Database**

### Step 6: Create PostgreSQL Database and User

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database user
psql -c "CREATE USER hrm_app WITH PASSWORD 'Kc9nQd4wZx7vUe3pLb2mTa6rYf8sHg1J';"

# Create database
psql -c "CREATE DATABASE skyraksys_hrm_prod OWNER hrm_app;"

# Grant permissions
psql -c "GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_app;"
psql -d skyraksys_hrm_prod -c "GRANT ALL ON SCHEMA public TO hrm_app;"
psql -d skyraksys_hrm_prod -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hrm_app;"
psql -d skyraksys_hrm_prod -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hrm_app;"
psql -d skyraksys_hrm_prod -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hrm_app;"
psql -d skyraksys_hrm_prod -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hrm_app;"

# Exit postgres user
exit
```

### Step 7: Verify Database Connection

```bash
# Test connection as hrm_app user
PGPASSWORD='Kc9nQd4wZx7vUe3pLb2mTa6rYf8sHg1J' psql -h localhost -U hrm_app -d skyraksys_hrm_prod -c "SELECT version();"
```

You should see PostgreSQL version information.

---

## 🔧 **PART 4: Install Dependencies**

### Step 8: Install Backend Dependencies

```bash
# Switch to hrmapp user
su - hrmapp

# Navigate to backend
cd /opt/skyraksys-hrm/backend

# Install dependencies
npm install

# Verify installation
ls node_modules | wc -l
# Should show a large number (300+)

# Exit back to root
exit
```

### Step 9: Install Frontend Dependencies

```bash
# As root or with sudo
su - hrmapp

# Navigate to frontend
cd /opt/skyraksys-hrm/frontend

# Install dependencies
npm install

# Verify installation
ls node_modules | wc -l
# Should show a large number (1000+)

# Exit back to root
exit
```

### Step 10: Install Global Tools

```bash
# Install PM2 globally (optional but recommended)
npm install -g pm2

# Install serve for frontend (if using systemd)
npm install -g serve@14

# Verify installations
pm2 --version
npx serve --version
```

---

## 🏗️ **PART 5: Build Frontend**

### Step 11: Build Production Frontend

```bash
# Switch to hrmapp user
su - hrmapp

# Navigate to frontend
cd /opt/skyraksys-hrm/frontend

# Build for production (API URL is already embedded from .env.production)
npm run build

# Verify build was created
ls -lh build/
# You should see: index.html, static folder, etc.

# Verify API URL is embedded correctly
grep -r "95.216.14.232/api" build/
# Should show matches in JavaScript files

# Exit back to root
exit
```

**This will take 2-4 minutes. You'll see:**
```
Creating an optimized production build...
Compiled successfully.
File sizes after gzip:
...
The build folder is ready to be deployed.
```

---

## 🚀 **PART 6: Deploy with Automated Script**

### Step 12: Run the Fix/Deploy Script

We have an automated script that does everything:
- Creates systemd services
- Sets up logging
- Starts all services
- Verifies everything works

```bash
# Make sure you're root
cd /opt/skyraksys-hrm/redhatprod/scripts

# Run the deployment fix script
./fix_deployment_issues.sh
```

**Follow the prompts:**
1. Script will ask: "Which process manager would you like to use?"
2. Type `1` for Systemd (Recommended) OR `2` for PM2

**What the script does automatically:**
- ✅ Stops any existing services
- ✅ Backs up old configs
- ✅ Creates correct systemd service files
- ✅ Rebuilds frontend with correct API URL
- ✅ Sets up log directory
- ✅ Starts backend service
- ✅ Starts frontend service
- ✅ Verifies all endpoints are working

---

## 🌐 **PART 7: Configure Nginx**

### Step 13: Install and Configure Nginx

```bash
# Install Nginx (if not already installed)
dnf install -y nginx

# Copy the pre-configured Nginx file
cp /opt/skyraksys-hrm/redhatprod/configs/nginx-hrm-static.95.216.14.232.conf /etc/nginx/conf.d/hrm.conf

# Test Nginx configuration
nginx -t
# Should show: "syntax is ok" and "test is successful"

# Enable and start Nginx
systemctl enable nginx
systemctl start nginx

# Verify Nginx is running
systemctl status nginx
```

### Step 14: Configure Firewall

```bash
# Open HTTP port (80)
firewall-cmd --permanent --add-service=http
firewall-cmd --reload

# Verify firewall rules
firewall-cmd --list-all
# Should show: services: http ssh
```

---

## ✅ **PART 8: Verify Deployment**

### Step 15: Test Backend API

```bash
# Test backend health endpoint
curl http://localhost:5000/api/health

# Expected output:
# {"status":"ok","timestamp":"2025-10-22T..."}
```

### Step 16: Test Frontend

```bash
# Test frontend
curl http://localhost:3000

# Expected output:
# Should show HTML with <!DOCTYPE html>
```

### Step 17: Test Nginx Proxy

```bash
# Test Nginx proxying to backend
curl http://localhost/api/health

# Expected output:
# {"status":"ok","timestamp":"2025-10-22T..."}

# Test from external
curl http://95.216.14.232/api/health
```

### Step 18: Check Service Status

```bash
# If using Systemd:
systemctl status hrm-backend
systemctl status hrm-frontend
systemctl status nginx

# All should show: Active: active (running)

# If using PM2:
pm2 status

# Should show both hrm-backend and hrm-frontend as "online"
```

---

## 🔐 **PART 9: Seed Demo Data (Optional)**

### Step 19: Seed Database with Demo Users

```bash
# Switch to hrmapp user
su - hrmapp

# Navigate to backend
cd /opt/skyraksys-hrm/backend

# Run seed script
node scripts/seedRunner.js

# You should see:
# ✅ Demo users created successfully
#    Admin: admin@company.com / Kx9mP7qR2nF8sA5t
#    HR: hr@company.com / Lw3nQ6xY8mD4vB7h
#    Employee: employee@company.com / Mv4pS9wE2nR6kA8j
# ✅ Demo projects and tasks created successfully

# Exit back to root
exit
```

---

## 🎉 **PART 10: Test Your Application**

### Step 20: Access the Application

1. **Open your browser**
2. **Navigate to:** `http://95.216.14.232`
3. **You should see the login page**

### Step 21: Login with Demo Accounts

**Admin Account:**
- Email: `admin@company.com`
- Password: `Kx9mP7qR2nF8sA5t`

**Simple Admin Account (for testing):**
- Email: `prodadmin@company.com`
- Password: `admin`

**HR Account:**
- Email: `hr@company.com`
- Password: `Lw3nQ6xY8mD4vB7h`

**Employee Account:**
- Email: `employee@company.com`
- Password: `Mv4pS9wE2nR6kA8j`

### Step 22: Verify All Features Work

After logging in:
- ✅ Dashboard loads
- ✅ Employee list shows
- ✅ Can create new employee
- ✅ Timesheets load
- ✅ Leave requests work
- ✅ Projects and tasks display

---

## 📊 **PART 11: Monitoring & Maintenance**

### Step 23: View Logs

**If using Systemd:**
```bash
# View backend logs (live)
journalctl -u hrm-backend -f

# View last 100 lines
journalctl -u hrm-backend -n 100

# View frontend logs
journalctl -u hrm-frontend -f

# View Nginx logs
tail -f /var/log/nginx/hrm_access.log
tail -f /var/log/nginx/hrm_error.log
```

**If using PM2:**
```bash
# As hrmapp user
su - hrmapp

# View all logs
pm2 logs

# View specific service logs
pm2 logs hrm-backend
pm2 logs hrm-frontend

# Monitor resources
pm2 monit
```

### Step 24: Common Service Commands

**Systemd Commands:**
```bash
# Restart services
systemctl restart hrm-backend
systemctl restart hrm-frontend
systemctl restart nginx

# Stop services
systemctl stop hrm-backend hrm-frontend

# Start services
systemctl start hrm-backend hrm-frontend

# Check status
systemctl status hrm-backend hrm-frontend nginx
```

**PM2 Commands:**
```bash
# As hrmapp user
su - hrmapp

# Restart services
pm2 restart hrm-backend
pm2 restart hrm-frontend
pm2 restart all

# Stop services
pm2 stop all

# Start services
pm2 start all

# View status
pm2 status
pm2 list
```

---

## 🆘 **TROUBLESHOOTING**

### Issue 1: Backend Won't Start

**Check logs:**
```bash
journalctl -u hrm-backend -n 100
```

**Common causes:**
- Database not running: `systemctl start postgresql-15`
- Wrong database credentials: Check `/opt/skyraksys-hrm/backend/.env`
- Port 5000 already in use: `lsof -i :5000` or `netstat -tulpn | grep 5000`

**Solution:**
```bash
# Test backend manually
su - hrmapp
cd /opt/skyraksys-hrm/backend
node server.js
# Look for error messages
```

### Issue 2: Frontend Won't Start

**Check logs:**
```bash
journalctl -u hrm-frontend -n 100
```

**Common causes:**
- Build folder missing: `ls /opt/skyraksys-hrm/frontend/build`
- Port 3000 already in use
- npx/serve not installed

**Solution:**
```bash
# Rebuild frontend
su - hrmapp
cd /opt/skyraksys-hrm/frontend
npm run build

# Test serve manually
npx serve@14 -s build -l 3000
```

### Issue 3: Can't Access via Browser

**Check Nginx:**
```bash
# Check Nginx status
systemctl status nginx

# Test Nginx config
nginx -t

# Check Nginx logs
tail -f /var/log/nginx/error.log
```

**Check Firewall:**
```bash
# Verify port 80 is open
firewall-cmd --list-all

# Add if missing
firewall-cmd --permanent --add-service=http
firewall-cmd --reload
```

**Test locally first:**
```bash
# From server
curl http://localhost
curl http://localhost/api/health

# From external
curl http://95.216.14.232
```

### Issue 4: API Calls Fail (Network Error)

**Check browser console:**
- Press F12 in browser
- Go to Network tab
- Look for failed requests

**Common causes:**
- Frontend trying to reach wrong URL (should be `/api`, not `:5000/api`)
- Nginx not proxying correctly
- Backend not running

**Solution:**
```bash
# Verify API URL in built frontend
grep -r "95.216.14.232" /opt/skyraksys-hrm/frontend/build/

# Should show: http://95.216.14.232/api
# NOT: http://95.216.14.232:5000/api

# If wrong, rebuild frontend:
su - hrmapp
cd /opt/skyraksys-hrm/frontend
npm run build
exit
systemctl restart hrm-frontend
```

### Issue 5: Database Connection Errors

**Check PostgreSQL:**
```bash
# Check PostgreSQL status
systemctl status postgresql-15

# Start if stopped
systemctl start postgresql-15

# Test connection
PGPASSWORD='Kc9nQd4wZx7vUe3pLb2mTa6rYf8sHg1J' psql -h localhost -U hrm_app -d skyraksys_hrm_prod -c "\dt"
```

**Check permissions:**
```bash
sudo -u postgres psql -d skyraksys_hrm_prod -c "GRANT ALL ON SCHEMA public TO hrm_app;"
```

---

## 📋 **QUICK REFERENCE**

### Server Details
| Component | Value |
|-----------|-------|
| Server IP | 95.216.14.232 |
| Backend Port | 5000 |
| Frontend Port | 3000 |
| Nginx Port | 80 |
| Database Port | 5432 |
| Application User | hrmapp |
| Application Directory | /opt/skyraksys-hrm |
| Log Directory | /var/log/skyraksys-hrm |

### URLs
| Purpose | URL |
|---------|-----|
| Application (Public) | http://95.216.14.232 |
| API (via Nginx) | http://95.216.14.232/api |
| Backend (Direct) | http://localhost:5000 |
| Frontend (Direct) | http://localhost:3000 |

### File Locations
| File | Location |
|------|----------|
| Backend Code | /opt/skyraksys-hrm/backend |
| Frontend Code | /opt/skyraksys-hrm/frontend |
| Backend .env | /opt/skyraksys-hrm/backend/.env |
| Nginx Config | /etc/nginx/conf.d/hrm.conf |
| Systemd Backend | /etc/systemd/system/hrm-backend.service |
| Systemd Frontend | /etc/systemd/system/hrm-frontend.service |

### Demo Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | Kx9mP7qR2nF8sA5t |
| Admin (Simple) | prodadmin@company.com | admin |
| HR | hr@company.com | Lw3nQ6xY8mD4vB7h |
| Employee | employee@company.com | Mv4pS9wE2nR6kA8j |

### Important Commands
```bash
# Service Management (Systemd)
systemctl status hrm-backend hrm-frontend nginx
systemctl restart hrm-backend hrm-frontend
systemctl stop hrm-backend hrm-frontend
journalctl -u hrm-backend -f

# Service Management (PM2)
pm2 status
pm2 restart all
pm2 logs
pm2 monit

# Database
systemctl status postgresql-15
PGPASSWORD='password' psql -h localhost -U hrm_app -d skyraksys_hrm_prod

# Nginx
nginx -t
systemctl reload nginx
tail -f /var/log/nginx/hrm_access.log

# Firewall
firewall-cmd --list-all
firewall-cmd --permanent --add-service=http
firewall-cmd --reload
```

---

## ✅ **POST-DEPLOYMENT CHECKLIST**

After completing all steps, verify:

- [ ] Backend service is running: `systemctl status hrm-backend` or `pm2 status`
- [ ] Frontend service is running: `systemctl status hrm-frontend` or `pm2 status`
- [ ] Nginx is running: `systemctl status nginx`
- [ ] PostgreSQL is running: `systemctl status postgresql-15`
- [ ] Firewall allows HTTP: `firewall-cmd --list-all`
- [ ] Can access login page: http://95.216.14.232
- [ ] Can login with demo account
- [ ] Dashboard loads after login
- [ ] API calls work (check browser Network tab)
- [ ] Database has demo data
- [ ] Logs are being written: `ls -lh /var/log/skyraksys-hrm/`
- [ ] Services auto-start on boot: `systemctl is-enabled hrm-backend hrm-frontend`

---

## 🎓 **NEXT STEPS**

1. **Change Default Passwords**
   - Update demo user passwords
   - Change database password in production

2. **Setup SSL/HTTPS**
   - Install Let's Encrypt certificate
   - Configure Nginx for HTTPS
   - Update CORS settings

3. **Setup Backups**
   - Database backups (daily)
   - Application code backups
   - Log rotation

4. **Monitoring**
   - Setup uptime monitoring
   - Configure alerting
   - Monitor disk space and memory

5. **Security Hardening**
   - Configure SELinux
   - Setup fail2ban
   - Regular security updates

---

## 📞 **SUPPORT**

If you encounter issues not covered in this guide:

1. Check logs first (Part 11)
2. Review troubleshooting section
3. Verify all configuration files
4. Test each component individually

**Common Log Locations:**
- Backend: `journalctl -u hrm-backend -n 100`
- Frontend: `journalctl -u hrm-frontend -n 100`
- Nginx: `/var/log/nginx/hrm_error.log`
- PostgreSQL: `/var/lib/pgsql/15/data/log/`

---

## 📝 **REVISION HISTORY**

| Date | Version | Changes |
|------|---------|---------|
| Oct 22, 2025 | 1.0 | Initial deployment guide with all configs pre-set |

---

**🎉 Congratulations!** Your Skyraksys HRM system is now deployed and running in production!

**Access your application at:** http://95.216.14.232
