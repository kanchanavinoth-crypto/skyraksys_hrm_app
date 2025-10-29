# Skyraksys HRM - Production Deployment Guide
## For RHEL 9.6 with PostgreSQL, Nginx, and Node.js

**Last Updated:** January 2025  
**Target Audience:** System administrators and novice users  
**Deployment Method:** Automated scripts with Sequelize migrations

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Quick Start (Automated)](#quick-start-automated)
4. [Detailed Setup Steps](#detailed-setup-steps)
5. [Security Configuration](#security-configuration)
6. [Database Setup (Sequelize)](#database-setup-sequelize)
7. [Environment Configuration](#environment-configuration)
8. [Web Server Setup (Nginx)](#web-server-setup-nginx)
9. [Application Deployment](#application-deployment)
10. [Post-Deployment Verification](#post-deployment-verification)
11. [Troubleshooting](#troubleshooting)
12. [Maintenance & Backups](#maintenance--backups)

---

## Overview

### Technology Stack

- **OS:** Red Hat Enterprise Linux 9.6
- **Database:** PostgreSQL 17.x
- **Backend:** Node.js 22.16.0 + Express.js 4.18.2
- **ORM:** Sequelize 6.37.7 with CLI migrations
- **Frontend:** React (served via Nginx)
- **Web Server:** Nginx 1.20+ (reverse proxy)
- **Process Manager:** systemd services
- **Security:** JWT authentication, Helmet.js, rate limiting, CORS

### Architecture

```
Internet → Nginx (Port 80/443)
    ↓
    ├─→ Backend API (Port 5000) → PostgreSQL (Port 5432)
    └─→ Frontend SPA (Port 3000)
```

### Key Features

✅ **Automated Setup:** Scripts handle database, Sequelize migrations, and configuration  
✅ **Security Hardened:** Helmet.js, rate limiting, secure headers, JWT authentication  
✅ **Production Ready:** Logging, monitoring, health checks, automated backups  
✅ **Novice Friendly:** Step-by-step instructions with command examples  
✅ **Sequelize Migrations:** Modern schema management (no manual SQL files)

---

## Pre-Deployment Checklist

### Server Requirements

- [ ] RHEL 9.6 installed with root/sudo access
- [ ] Minimum 2 GB RAM (4 GB recommended)
- [ ] 20 GB free disk space
- [ ] Internet connectivity for package downloads
- [ ] Server IP address or domain name configured
- [ ] Firewall rules configured (ports 80, 443, 5000, 3000)

### Required Information

Before starting, gather:

1. **Server IP Address:** Example: `95.216.14.232`
2. **Domain Name (Optional):** Example: `hrm.company.com`
3. **Admin Email:** For notifications and support
4. **SSL Certificate (Optional):** For HTTPS setup

### Access Requirements

- [ ] Root or sudo access to the server
- [ ] SSH access to the server
- [ ] Access to DNS management (if using domain name)

---

## Quick Start (Automated)

For experienced users who want a fast setup:

```bash
# 1. Clone/upload repository to /opt/skyraksys-hrm
cd /opt
sudo git clone <repository-url> skyraksys-hrm

# 2. Run automated setup
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash 01_setup_system.sh
sudo bash 02_setup_database.sh
sudo bash 03_setup_nginx.sh
sudo bash 04_deploy_app.sh

# 3. Configure environment
sudo cp /opt/skyraksys-hrm/redhatprod/templates/.env.production.template \
        /opt/skyraksys-hrm/backend/.env
sudo nano /opt/skyraksys-hrm/backend/.env
# Update: DB_PASSWORD, JWT secrets, DOMAIN, IP addresses

# 4. Start services
sudo systemctl start hrm-backend
sudo systemctl start hrm-frontend
sudo systemctl restart nginx

# 5. Verify deployment
curl http://your-server-ip/api/health
```

For detailed explanations, continue with [Detailed Setup Steps](#detailed-setup-steps).

---

## Detailed Setup Steps

### Step 1: System Preparation

#### 1.1 Update System Packages

```bash
# Update all packages to latest versions
sudo dnf update -y

# Install EPEL repository for additional packages
sudo dnf install -y epel-release

# Install essential build tools
sudo dnf groupinstall -y "Development Tools"
```

#### 1.2 Install Node.js 22.x

```bash
# Add NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -

# Install Node.js
sudo dnf install -y nodejs

# Verify installation
node --version  # Should show v22.x.x
npm --version   # Should show 10.x.x or higher
```

#### 1.3 Create Application User

```bash
# Create dedicated user for running the application
sudo useradd -r -m -s /bin/bash hrmapp

# Create application directory structure
sudo mkdir -p /opt/skyraksys-hrm
sudo chown hrmapp:hrmapp /opt/skyraksys-hrm

# Create log directory
sudo mkdir -p /var/log/skyraksys-hrm
sudo chown hrmapp:hrmapp /var/log/skyraksys-hrm
```

#### 1.4 Configure Firewall

```bash
# Allow HTTP and HTTPS traffic
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Allow backend port (for internal testing only)
sudo firewall-cmd --permanent --add-port=5000/tcp

# Reload firewall
sudo firewall-cmd --reload

# Verify rules
sudo firewall-cmd --list-all
```

---

## Security Configuration

### Generate Secure Secrets

**CRITICAL:** Never use example secrets in production. Generate new ones:

#### JWT Secrets (64+ characters)

```bash
# Generate JWT secret
openssl rand -base64 64

# Generate JWT refresh secret (different from above)
openssl rand -base64 64
```

**Save these values** - you'll need them for the `.env` file.

#### Session Secret (48+ characters)

```bash
# Generate session secret
openssl rand -base64 48
```

#### Database Password

The database setup script (`02_setup_database.sh`) automatically generates a secure password and saves it to `/opt/skyraksys-hrm/.db_password`.

To retrieve it later:

```bash
cat /opt/skyraksys-hrm/.db_password
```

### Security Best Practices

✅ **Secrets Management:**
- Generate unique secrets for each environment
- Store secrets in `.env` file (never commit to Git)
- Keep backup of `.env` file in secure location
- Rotate secrets periodically (every 90 days recommended)

✅ **File Permissions:**
```bash
# Secure .env file
chmod 600 /opt/skyraksys-hrm/backend/.env
chown hrmapp:hrmapp /opt/skyraksys-hrm/backend/.env

# Secure password file
chmod 600 /opt/skyraksys-hrm/.db_password
chown hrmapp:hrmapp /opt/skyraksys-hrm/.db_password
```

✅ **Firewall Rules:**
- Only expose ports 80 (HTTP) and 443 (HTTPS)
- Keep backend ports (5000, 3000) internal
- Use Nginx as reverse proxy for all external traffic

---

## Database Setup (Sequelize)

### Understanding Sequelize Migrations

This application uses **Sequelize ORM** with **migration-based schema management**:

- ✅ **No manual SQL files** - Schema is defined in migration files
- ✅ **Version controlled** - All schema changes tracked in Git
- ✅ **Automatic execution** - Setup script runs migrations automatically
- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Rollback support** - Can undo migrations if needed

### Automated Database Setup

Run the automated database setup script:

```bash
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash 02_setup_database.sh
```

**This script will:**

1. ✅ Install PostgreSQL 17.x from official repository
2. ✅ Initialize PostgreSQL cluster
3. ✅ Create production database: `skyraksys_hrm_prod`
4. ✅ Create application user: `hrm_app` with secure password
5. ✅ Configure PostgreSQL for production (memory, connections, logging)
6. ✅ Run all Sequelize migrations (create tables, indexes, constraints)
7. ✅ Optionally seed sample data using Sequelize seeders
8. ✅ Set up automated daily backups (2 AM daily)
9. ✅ Create database maintenance scripts

### Database Configuration Files

After setup, the following are created:

```
/opt/skyraksys-hrm/
├── .db_password                        # Database password (chmod 600)
├── backups/                            # Database backups (daily at 2 AM)
└── scripts/
    ├── backup-database.sh              # Manual backup script
    ├── restore-database.sh             # Database restore script
    └── check-database.sh               # Database status check
```

### Manual Database Operations

#### Check Database Status

```bash
# Run database status check
sudo bash /opt/skyraksys-hrm/scripts/check-database.sh
```

Output shows:
- PostgreSQL service status
- Database and user existence
- Database size
- List of tables
- Applied migrations
- Active connections

#### Run Migrations Manually

```bash
# Navigate to backend directory
cd /opt/skyraksys-hrm/backend

# Run pending migrations
sudo -u hrmapp npx sequelize-cli db:migrate

# Check migration status
sudo -u hrmapp npx sequelize-cli db:migrate:status

# Rollback last migration (if needed)
sudo -u hrmapp npx sequelize-cli db:migrate:undo
```

#### Seed Demo Data

```bash
# Seed all demo data (users, projects, tasks, etc.)
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:seed:all

# Undo all seeders
sudo -u hrmapp npx sequelize-cli db:seed:undo:all
```

#### Database Backup & Restore

```bash
# Create manual backup
sudo bash /opt/skyraksys-hrm/scripts/backup-database.sh

# List available backups
ls -lh /opt/skyraksys-hrm/backups/

# Restore from backup
sudo bash /opt/skyraksys-hrm/scripts/restore-database.sh \
    /opt/skyraksys-hrm/backups/hrm_backup_YYYYMMDD_HHMMSS.sql.gz
```

### Database Connection Test

```bash
# Test database connection as application user
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT version();"

# Test application database connectivity
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp node -e "
const db = require('./models');
db.sequelize.authenticate()
  .then(() => console.log('✅ Database connection successful'))
  .catch(err => console.error('❌ Connection failed:', err));
"
```

---

## Environment Configuration

### Create Production Environment File

1. **Copy template to backend directory:**

```bash
sudo cp /opt/skyraksys-hrm/redhatprod/templates/.env.production.template \
        /opt/skyraksys-hrm/backend/.env
```

2. **Edit the environment file:**

```bash
sudo nano /opt/skyraksys-hrm/backend/.env
```

3. **Update these CRITICAL values:**

#### Database Configuration

```bash
DB_PASSWORD=<paste-password-from-.db_password-file>
```

Get password:
```bash
cat /opt/skyraksys-hrm/.db_password
```

#### JWT Secrets

```bash
JWT_SECRET=<paste-generated-jwt-secret>
JWT_REFRESH_SECRET=<paste-generated-refresh-secret>
```

Generate secrets:
```bash
openssl rand -base64 64  # Run twice for two different secrets
```

#### Session Secret

```bash
SESSION_SECRET=<paste-generated-session-secret>
```

Generate secret:
```bash
openssl rand -base64 48
```

#### Server IP/Domain Configuration

Replace `95.216.14.232` with your actual server IP:

```bash
DOMAIN=95.216.14.232
API_BASE_URL=http://95.216.14.232/api
FRONTEND_URL=http://95.216.14.232
CORS_ORIGIN=http://95.216.14.232
ALLOWED_ORIGINS=http://95.216.14.232
```

**Example with custom domain:**

```bash
DOMAIN=hrm.company.com
API_BASE_URL=https://hrm.company.com/api
FRONTEND_URL=https://hrm.company.com
CORS_ORIGIN=https://hrm.company.com
ALLOWED_ORIGINS=https://hrm.company.com
```

### Verify Configuration

```bash
# Check for missing placeholders
grep -E "CHANGE_THIS|GET_FROM" /opt/skyraksys-hrm/backend/.env

# If no output, all placeholders are replaced ✅
# If output shown, update those values ❌
```

### Secure Environment File

```bash
# Set restrictive permissions
chmod 600 /opt/skyraksys-hrm/backend/.env
chown hrmapp:hrmapp /opt/skyraksys-hrm/backend/.env

# Verify permissions
ls -l /opt/skyraksys-hrm/backend/.env
# Should show: -rw------- 1 hrmapp hrmapp
```

### Environment Configuration Checklist

- [ ] Database password updated from `.db_password` file
- [ ] JWT_SECRET generated (64+ characters)
- [ ] JWT_REFRESH_SECRET generated (different from JWT_SECRET)
- [ ] SESSION_SECRET generated (48+ characters)
- [ ] DOMAIN updated with server IP or domain name
- [ ] All URLs updated (API_BASE_URL, FRONTEND_URL)
- [ ] CORS_ORIGIN and ALLOWED_ORIGINS updated
- [ ] SEED_DEMO_DATA set to `false` (for production)
- [ ] All DEBUG_* flags set to `false`
- [ ] TRUST_PROXY set to `true`
- [ ] File permissions: `chmod 600` and `chown hrmapp:hrmapp`

---

## Web Server Setup (Nginx)

### Install Nginx

```bash
# Install Nginx
sudo dnf install -y nginx

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Verify installation
nginx -v
sudo systemctl status nginx
```

### Configure Nginx as Reverse Proxy

1. **Copy HRM Nginx configuration:**

```bash
# Copy configuration file
sudo cp /opt/skyraksys-hrm/redhatprod/configs/nginx-hrm.conf \
        /etc/nginx/conf.d/hrm.conf

# Backup default configuration
sudo mv /etc/nginx/conf.d/default.conf \
        /etc/nginx/conf.d/default.conf.backup 2>/dev/null || true
```

2. **Update server name (if using custom domain):**

```bash
sudo nano /etc/nginx/conf.d/hrm.conf
```

Change:
```nginx
server_name 95.216.14.232;
```

To:
```nginx
server_name hrm.company.com;
```

3. **Test Nginx configuration:**

```bash
# Test configuration syntax
sudo nginx -t

# Should show:
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

4. **Reload Nginx:**

```bash
sudo systemctl reload nginx
```

### Nginx Configuration Features

The HRM Nginx configuration includes:

✅ **Security Headers:**
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Content-Security-Policy
- Strict-Transport-Security (HSTS)

✅ **Rate Limiting:**
- API endpoints: 10 requests/second
- Login endpoint: 5 requests/minute
- Upload endpoints: 2 requests/second

✅ **Compression:**
- Gzip enabled for text/CSS/JS/JSON
- Compression level: 6

✅ **Caching:**
- Static assets: 1 year
- JS/CSS files: 1 month

✅ **Reverse Proxy:**
- Backend API: Port 5000
- Frontend SPA: Port 3000
- Connection keep-alive

### SELinux Configuration (RHEL Specific)

If SELinux is enforcing, allow Nginx to connect to backend:

```bash
# Check SELinux status
sestatus

# If enforcing, allow network connections
sudo setsebool -P httpd_can_network_connect 1

# Allow Nginx to connect to backend ports
sudo semanage port -a -t http_port_t -p tcp 5000
sudo semanage port -a -t http_port_t -p tcp 3000
```

---

## Application Deployment

### Install Dependencies

#### Backend Dependencies

```bash
# Navigate to backend directory
cd /opt/skyraksys-hrm/backend

# Install npm packages
sudo -u hrmapp npm ci --production

# Verify installation
sudo -u hrmapp npm list --depth=0
```

#### Frontend Dependencies

```bash
# Navigate to frontend directory
cd /opt/skyraksys-hrm/frontend

# Install npm packages
sudo -u hrmapp npm ci

# Build production bundle
sudo -u hrmapp npm run build

# Verify build
ls -lh build/
```

### Create systemd Services

#### Backend Service

```bash
# Copy backend service file
sudo cp /opt/skyraksys-hrm/redhatprod/systemd/hrm-backend.service \
        /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable hrm-backend

# Start service
sudo systemctl start hrm-backend

# Check status
sudo systemctl status hrm-backend
```

#### Frontend Service

```bash
# Copy frontend service file
sudo cp /opt/skyraksys-hrm/redhatprod/systemd/hrm-frontend.service \
        /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable hrm-frontend

# Start service
sudo systemctl start hrm-frontend

# Check status
sudo systemctl status hrm-frontend
```

### Service Management Commands

```bash
# Start services
sudo systemctl start hrm-backend
sudo systemctl start hrm-frontend

# Stop services
sudo systemctl stop hrm-backend
sudo systemctl stop hrm-frontend

# Restart services
sudo systemctl restart hrm-backend
sudo systemctl restart hrm-frontend

# Check status
sudo systemctl status hrm-backend
sudo systemctl status hrm-frontend

# View logs
sudo journalctl -u hrm-backend -f
sudo journalctl -u hrm-frontend -f

# View recent logs (last 100 lines)
sudo journalctl -u hrm-backend -n 100
sudo journalctl -u hrm-frontend -n 100
```

---

## Post-Deployment Verification

### Health Check Tests

#### 1. Backend API Health Check

```bash
# Test backend health endpoint
curl http://localhost:5000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-01-...",
#   "uptime": 123.45,
#   "environment": "production",
#   "database": "connected"
# }
```

#### 2. Nginx Reverse Proxy Test

```bash
# Test through Nginx
curl http://your-server-ip/api/health

# Should return same response as above
```

#### 3. Frontend Access Test

```bash
# Test frontend (should return HTML)
curl http://your-server-ip/

# Should return <!DOCTYPE html>... (React app HTML)
```

#### 4. Database Connection Test

```bash
# Run database check script
sudo bash /opt/skyraksys-hrm/scripts/check-database.sh
```

### Login Test

1. **Open browser:** `http://your-server-ip`

2. **Default admin credentials** (if demo data seeded):
   - Username: `admin@skyraksys.com`
   - Password: `Admin@123`

3. **Test features:**
   - Login authentication
   - Dashboard loads
   - Navigation works
   - API calls successful

### System Monitoring

#### Check Running Services

```bash
# Check all HRM services
systemctl status postgresql-17
systemctl status hrm-backend
systemctl status hrm-frontend
systemctl status nginx
```

#### Monitor Logs

```bash
# Backend logs
sudo tail -f /var/log/skyraksys-hrm/application.log

# Backend errors
sudo tail -f /var/log/skyraksys-hrm/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/hrm_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/hrm_error.log

# PostgreSQL logs
sudo tail -f /var/lib/pgsql/17/data/log/postgresql-*.log
```

#### Monitor System Resources

```bash
# CPU and memory usage
htop

# Disk usage
df -h

# Database size
sudo -u postgres psql -d skyraksys_hrm_prod -c "
SELECT pg_size_pretty(pg_database_size('skyraksys_hrm_prod'));
"

# Disk I/O
iostat -x 1
```

### Performance Monitoring

Access the built-in status monitor:

```
http://your-server-ip/status
```

Shows real-time metrics:
- CPU usage
- Memory usage
- Request rate
- Response times
- Status code distribution

---

## Troubleshooting

### Common Issues

#### Issue 1: Backend Service Won't Start

**Symptoms:**
```bash
sudo systemctl status hrm-backend
# Shows: failed, exit code 1
```

**Diagnosis:**
```bash
# Check backend logs
sudo journalctl -u hrm-backend -n 50

# Common causes:
# - Missing .env file
# - Database connection failed
# - Port 5000 already in use
# - Permission denied on files
```

**Solutions:**

1. **Verify .env file exists:**
```bash
ls -l /opt/skyraksys-hrm/backend/.env
# Should exist and be readable by hrmapp user
```

2. **Test database connection:**
```bash
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp node -e "
const db = require('./models');
db.sequelize.authenticate()
  .then(() => console.log('✅ Connected'))
  .catch(err => console.error('❌ Error:', err));
"
```

3. **Check port availability:**
```bash
sudo ss -tlnp | grep 5000
# If output shown, port is in use
# Kill process: sudo kill <PID>
```

4. **Fix permissions:**
```bash
sudo chown -R hrmapp:hrmapp /opt/skyraksys-hrm/backend
sudo chmod 600 /opt/skyraksys-hrm/backend/.env
```

#### Issue 2: Database Connection Failed

**Symptoms:**
- Backend logs show "Unable to connect to database"
- Health check returns database: "disconnected"

**Diagnosis:**
```bash
# Check PostgreSQL service
sudo systemctl status postgresql-17

# Test connection manually
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT 1;"
```

**Solutions:**

1. **Start PostgreSQL:**
```bash
sudo systemctl start postgresql-17
sudo systemctl enable postgresql-17
```

2. **Verify credentials in .env:**
```bash
# Get correct password
cat /opt/skyraksys-hrm/.db_password

# Update .env file
sudo nano /opt/skyraksys-hrm/backend/.env
# Update DB_PASSWORD
```

3. **Check PostgreSQL logs:**
```bash
sudo tail -f /var/lib/pgsql/17/data/log/postgresql-*.log
```

#### Issue 3: Nginx 502 Bad Gateway

**Symptoms:**
- Accessing `http://your-server-ip/api/health` returns 502 error
- Nginx error log shows "connect() failed"

**Diagnosis:**
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/hrm_error.log

# Check if backend is running
sudo systemctl status hrm-backend

# Test backend directly
curl http://localhost:5000/api/health
```

**Solutions:**

1. **Start backend service:**
```bash
sudo systemctl start hrm-backend
```

2. **Fix SELinux (if enforcing):**
```bash
sudo setsebool -P httpd_can_network_connect 1
```

3. **Check firewall:**
```bash
sudo firewall-cmd --list-all
# Ensure port 80 is allowed
```

#### Issue 4: CORS Errors in Browser

**Symptoms:**
- Browser console shows CORS policy errors
- Frontend can't connect to backend API

**Diagnosis:**
```bash
# Check backend CORS configuration
grep CORS_ORIGIN /opt/skyraksys-hrm/backend/.env
```

**Solutions:**

1. **Update CORS_ORIGIN in .env:**
```bash
sudo nano /opt/skyraksys-hrm/backend/.env

# Add your frontend URL
CORS_ORIGIN=http://your-server-ip
ALLOWED_ORIGINS=http://your-server-ip
```

2. **Restart backend:**
```bash
sudo systemctl restart hrm-backend
```

3. **For testing only (NOT production):**
```bash
# Temporarily allow all origins
CORS_ALLOW_ALL=true

# Remember to disable after testing!
```

#### Issue 5: Migration Errors

**Symptoms:**
- Database setup script fails during migration
- "Table already exists" errors

**Diagnosis:**
```bash
# Check migration status
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:migrate:status
```

**Solutions:**

1. **Rollback and retry:**
```bash
# Undo last migration
sudo -u hrmapp npx sequelize-cli db:migrate:undo

# Run migrations again
sudo -u hrmapp npx sequelize-cli db:migrate
```

2. **Reset database (CAUTION - deletes all data):**
```bash
# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS skyraksys_hrm_prod;"
sudo -u postgres psql -c "CREATE DATABASE skyraksys_hrm_prod;"

# Run migrations from scratch
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:migrate
```

### Log File Locations

```
Application Logs:
├── /var/log/skyraksys-hrm/application.log  # General application logs
├── /var/log/skyraksys-hrm/error.log        # Error logs
├── /var/log/skyraksys-hrm/access.log       # HTTP access logs
└── /var/log/skyraksys-hrm/audit.log        # Security audit logs

System Logs:
├── /var/log/nginx/hrm_access.log           # Nginx access logs
├── /var/log/nginx/hrm_error.log            # Nginx error logs
└── /var/lib/pgsql/17/data/log/             # PostgreSQL logs

Service Logs (journalctl):
├── sudo journalctl -u hrm-backend          # Backend service logs
├── sudo journalctl -u hrm-frontend         # Frontend service logs
├── sudo journalctl -u postgresql-17        # Database service logs
└── sudo journalctl -u nginx                # Nginx service logs
```

### Getting Help

If you encounter issues not covered here:

1. **Check logs first** - 90% of issues are revealed in logs
2. **Review backend README:** `/opt/skyraksys-hrm/backend/README.md`
3. **Check GitHub issues:** Search for similar problems
4. **Contact support:** Include logs and error messages

---

## Maintenance & Backups

### Automated Backups

The database setup script configures daily backups:

- **Schedule:** Every day at 2:00 AM
- **Location:** `/opt/skyraksys-hrm/backups/`
- **Retention:** 30 days (older backups auto-deleted)
- **Format:** Compressed SQL dumps (`.sql.gz`)

**Check backup status:**

```bash
# List backups
ls -lh /opt/skyraksys-hrm/backups/

# Check cron job
crontab -u hrmapp -l | grep backup
```

### Manual Backup

```bash
# Create manual backup
sudo bash /opt/skyraksys-hrm/scripts/backup-database.sh

# Backup with custom name
BACKUP_DIR="/opt/skyraksys-hrm/backups"
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump -Fc skyraksys_hrm_prod | \
    gzip > "${BACKUP_DIR}/manual_backup_${DATE}.sql.gz"
```

### Restore from Backup

```bash
# List available backups
ls -lh /opt/skyraksys-hrm/backups/

# Restore specific backup
sudo bash /opt/skyraksys-hrm/scripts/restore-database.sh \
    /opt/skyraksys-hrm/backups/hrm_backup_20250115_020001.sql.gz

# Or manual restore
gunzip -c /opt/skyraksys-hrm/backups/hrm_backup_*.sql.gz | \
    sudo -u postgres pg_restore -d skyraksys_hrm_prod --clean --if-exists
```

### Update Application

```bash
# 1. Create backup before update
sudo bash /opt/skyraksys-hrm/scripts/backup-database.sh

# 2. Stop services
sudo systemctl stop hrm-backend
sudo systemctl stop hrm-frontend

# 3. Pull latest code
cd /opt/skyraksys-hrm
sudo -u hrmapp git pull origin main

# 4. Update dependencies
cd backend
sudo -u hrmapp npm ci --production

cd ../frontend
sudo -u hrmapp npm ci
sudo -u hrmapp npm run build

# 5. Run pending migrations
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:migrate

# 6. Start services
sudo systemctl start hrm-backend
sudo systemctl start hrm-frontend

# 7. Verify deployment
curl http://localhost:5000/api/health
```

### Log Rotation

Logs are automatically rotated by system logrotate:

```bash
# Log rotation config (already configured by setup script)
cat /etc/logrotate.d/skyraksys-hrm

# Manual log rotation
sudo logrotate -f /etc/logrotate.d/skyraksys-hrm
```

### Security Updates

```bash
# Update system packages monthly
sudo dnf update -y

# Check for security updates
sudo dnf updateinfo list security

# Apply security updates only
sudo dnf update --security
```

### Health Monitoring

Set up monitoring alerts using the health endpoint:

```bash
# Example: Check health every 5 minutes with cron
crontab -e

# Add line:
*/5 * * * * curl -f http://localhost:5000/api/health || echo "HRM Backend Down!" | mail -s "Alert" admin@company.com
```

### Database Maintenance

```bash
# Vacuum database (reclaim space)
sudo -u postgres psql -d skyraksys_hrm_prod -c "VACUUM FULL ANALYZE;"

# Check database size
sudo -u postgres psql -d skyraksys_hrm_prod -c "
SELECT pg_size_pretty(pg_database_size('skyraksys_hrm_prod'));
"

# Check table sizes
sudo -u postgres psql -d skyraksys_hrm_prod -c "
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

---

## Quick Reference

### Important Commands

```bash
# Service Management
sudo systemctl {start|stop|restart|status} hrm-backend
sudo systemctl {start|stop|restart|status} hrm-frontend
sudo systemctl {start|stop|restart|status} nginx
sudo systemctl {start|stop|restart|status} postgresql-17

# Logs
sudo journalctl -u hrm-backend -f
sudo tail -f /var/log/skyraksys-hrm/application.log
sudo tail -f /var/log/nginx/hrm_error.log

# Database
sudo bash /opt/skyraksys-hrm/scripts/check-database.sh
sudo bash /opt/skyraksys-hrm/scripts/backup-database.sh

# Health Checks
curl http://localhost:5000/api/health
curl http://your-server-ip/api/health

# View Passwords
cat /opt/skyraksys-hrm/.db_password
```

### Important Paths

```
/opt/skyraksys-hrm/                         # Application root
├── backend/.env                            # Environment configuration
├── .db_password                            # Database password
├── backups/                                # Database backups
└── scripts/
    ├── backup-database.sh                  # Backup script
    ├── restore-database.sh                 # Restore script
    └── check-database.sh                   # Status check

/etc/nginx/conf.d/hrm.conf                  # Nginx configuration
/etc/systemd/system/hrm-backend.service     # Backend service
/etc/systemd/system/hrm-frontend.service    # Frontend service
/var/log/skyraksys-hrm/                     # Application logs
```

### Support Resources

- **Backend README:** `/opt/skyraksys-hrm/backend/README.md`
- **API Documentation:** `http://your-server-ip/api/docs` (Swagger)
- **Status Monitor:** `http://your-server-ip/status`
- **Health Check:** `http://your-server-ip/api/health`

---

## Production Checklist

Before going live, verify:

### Security
- [ ] All secrets generated (JWT, session, database password)
- [ ] `.env` file permissions: `chmod 600`
- [ ] `.env` file ownership: `chown hrmapp:hrmapp`
- [ ] `SEED_DEMO_DATA=false`
- [ ] All `DEBUG_*` flags set to `false`
- [ ] `TRUST_PROXY=true` (when behind Nginx)
- [ ] Firewall configured (only ports 80, 443 exposed)
- [ ] SELinux configured (if enforcing)

### Configuration
- [ ] Server IP/domain updated in `.env`
- [ ] CORS origins configured
- [ ] Email SMTP configured (if using email features)
- [ ] Company information updated
- [ ] Payroll/leave settings configured

### Services
- [ ] PostgreSQL running and enabled
- [ ] Backend service running and enabled
- [ ] Frontend service running and enabled
- [ ] Nginx running and enabled

### Testing
- [ ] Health check returns "healthy"
- [ ] Login works
- [ ] Database migrations applied
- [ ] Logs are being written
- [ ] Backups scheduled (cron job active)

### Monitoring
- [ ] Status monitor accessible
- [ ] Log rotation configured
- [ ] Disk space sufficient (>10GB free)
- [ ] Health check monitoring setup

---

**🎉 Deployment Complete!**

Your Skyraksys HRM system is now running in production on RHEL 9.6.

For issues or questions, refer to the [Troubleshooting](#troubleshooting) section or contact support.

---

*Document Version: 2.0*  
*Last Updated: January 2025*  
*Tested on: RHEL 9.6, PostgreSQL 17.x, Node.js 22.16.0*
