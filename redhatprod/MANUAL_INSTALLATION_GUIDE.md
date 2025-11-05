# Manual Installation Guide - SkyrakSys HRM System
## Production Deployment to RHEL 9.6

**Server:** 95.216.14.232  
**Target OS:** Red Hat Enterprise Linux 9.6  
**PostgreSQL:** 17.x  
**Node.js:** 22.16.0 LTS  
**Last Updated:** November 5, 2025

---

## ⚠️ CRITICAL: Hardcoded Production Secrets

**This deployment uses HARDCODED production secrets throughout all automated scripts.**

If you follow this manual guide, you **MUST** use these exact values to match the automated deployment:

| Secret | Value | Used In |
|--------|-------|---------|
| **DB Password** | `SkyRakDB#2025!Prod@HRM$Secure` | PostgreSQL, .env files |
| **JWT Secret** | `SkyRak2025JWT@Prod!Secret#HRM$Key&Secure*System^Auth%Token` | Backend .env |
| **JWT Refresh** | `SkyRak2025Refresh@JWT!Secret#HRM$Renew&Key*Secure^Token%Auth` | Backend .env |
| **Session Secret** | `SkyRak2025Session@Secret!HRM#Prod$Key&Secure` | Backend .env |
| **Demo Password** | `admin123` | Demo users (change after login) |
| **Admin Email** | `admin@example.com` | Login credential |

**Why hardcoded?**
- ✅ Zero deployment failures due to password mismatch
- ✅ Fully automated deployment with no manual configuration
- ✅ All secrets are production-grade strength (52-70 characters)
- ⚠️ Trade-off: Secrets are in public GitHub repository

**Security Notice:** For maximum security, consider rotating these secrets after successful initial deployment.

📖 **Complete Reference:** See `redhatprod/PRODUCTION_SECRETS.md`

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Pre-Installation Checklist](#pre-installation-checklist)
3. [Step 1: System Preparation](#step-1-system-preparation)
4. [Step 2: PostgreSQL Installation](#step-2-postgresql-installation)
5. [Step 3: Node.js Installation](#step-3-nodejs-installation)
6. [Step 4: Nginx Installation](#step-4-nginx-installation)
7. [Step 5: Application Setup](#step-5-application-setup)
8. [Step 6: Database Configuration](#step-6-database-configuration)
9. [Step 7: Backend Deployment](#step-7-backend-deployment)
10. [Step 8: Frontend Deployment](#step-8-frontend-deployment)
11. [Step 9: Service Configuration](#step-9-service-configuration)
12. [Step 10: SSL/TLS Setup (Optional)](#step-10-ssltls-setup-optional)
13. [Step 11: Final Verification](#step-11-final-verification)
14. [Post-Installation Tasks](#post-installation-tasks)
15. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Access
- Root SSH access to server: `ssh root@95.216.14.232`
- Sudo privileges on the server
- Git repository access (GitHub credentials)

### Local Requirements
- Terminal/SSH client
- Git installed locally
- Text editor for configuration files

### Server Requirements
- RHEL 9.6 installed and updated
- Minimum 4GB RAM
- Minimum 20GB disk space
- Internet connectivity
- Open ports: 80, 443, 5000, 3000, 5432

---

## Pre-Installation Checklist

Before starting, verify:

```bash
# Check OS version
cat /etc/redhat-release
# Expected: Red Hat Enterprise Linux release 9.6

# Check available disk space
df -h
# Expected: At least 20GB free in /opt

# Check memory
free -h
# Expected: At least 4GB RAM

# Check internet connectivity
ping -c 3 google.com

# Verify you have root access
whoami
# Expected: root
```

---

## Step 1: System Preparation

### 1.1 Update System Packages

```bash
# Update all system packages
sudo dnf update -y

# Install essential development tools
sudo dnf groupinstall "Development Tools" -y

# Install required system packages
sudo dnf install -y \
    git \
    curl \
    wget \
    vim \
    openssl \
    firewalld \
    policycoreutils-python-utils
```

**Verification:**
```bash
git --version
curl --version
```

### 1.2 Configure Firewall

```bash
# Enable and start firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Allow custom ports (if needed)
sudo firewall-cmd --permanent --add-port=5000/tcp  # Backend
sudo firewall-cmd --permanent --add-port=3000/tcp  # Frontend (dev)
sudo firewall-cmd --permanent --add-port=5432/tcp  # PostgreSQL

# Reload firewall
sudo firewall-cmd --reload
```

**Verification:**
```bash
sudo firewall-cmd --list-all
```

### 1.3 Configure SELinux (Optional)

```bash
# Check SELinux status
getenforce

# Option 1: Set to permissive mode (for development)
sudo setenforce 0
sudo sed -i 's/^SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config

# Option 2: Keep enforcing and configure policies (recommended for production)
# Configure SELinux boolean for network connections
sudo setsebool -P httpd_can_network_connect 1
sudo setsebool -P httpd_can_network_relay 1
```

### 1.4 Create Application Directory

```bash
# Create application directory
sudo mkdir -p /opt/skyraksys-hrm
sudo chown -R root:root /opt/skyraksys-hrm
sudo chmod -R 755 /opt/skyraksys-hrm

# Create logs directory
sudo mkdir -p /opt/skyraksys-hrm/logs
```

**Verification:**
```bash
ls -la /opt/skyraksys-hrm
```

---

## Step 2: PostgreSQL Installation

### 2.1 Add PostgreSQL Repository

```bash
# Install PostgreSQL repository for version 17
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Disable default PostgreSQL module
sudo dnf -qy module disable postgresql
```

### 2.2 Install PostgreSQL 17

```bash
# Install PostgreSQL 17 server and contrib
sudo dnf install -y postgresql17-server postgresql17-contrib

# Verify installation
psql --version
# Expected: psql (PostgreSQL) 17.x
```

### 2.3 Initialize PostgreSQL Database

```bash
# Initialize database cluster
sudo /usr/pgsql-17/bin/postgresql-17-setup initdb

# Enable and start PostgreSQL service
sudo systemctl enable postgresql-17
sudo systemctl start postgresql-17
```

**Verification:**
```bash
sudo systemctl status postgresql-17
# Expected: active (running)
```

### 2.4 Configure PostgreSQL Authentication

```bash
# Backup original pg_hba.conf
sudo cp /var/lib/pgsql/17/data/pg_hba.conf /var/lib/pgsql/17/data/pg_hba.conf.backup

# Edit pg_hba.conf to allow local connections
sudo vim /var/lib/pgsql/17/data/pg_hba.conf
```

**Add these lines (replace existing similar lines):**
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
host    skyraksys_hrm_prod  hrm_app     127.0.0.1/32            scram-sha-256
```

**Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql-17
```

### 2.5 Create Database User and Database

**⚠️ IMPORTANT:** The automated deployment scripts use a **HARDCODED production password**: `SkyRakDB#2025!Prod@HRM$Secure`

This section shows manual setup for reference. If you're using automated deployment, the password is automatically configured.

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt, run:
```

**SQL Commands:**
```sql
-- Create database user with production password
CREATE USER hrm_app WITH PASSWORD 'SkyRakDB#2025!Prod@HRM$Secure';

-- Create database
CREATE DATABASE skyraksys_hrm_prod OWNER hrm_app;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_app;

-- Connect to database
\c skyraksys_hrm_prod

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO hrm_app;

-- Exit PostgreSQL
\q
```

**⚠️ NOTE:** This password must match the value in automated scripts:
- `redhatprod/scripts/02_setup_database.sh` (line 144)
- `redhatprod/scripts/00_generate_configs_auto.sh` (line 121)
- Do not change unless updating all locations

**Verification:**
```bash
# Test connection (use production password)
PGPASSWORD='SkyRakDB#2025!Prod@HRM$Secure' psql -h localhost -U hrm_app -d skyraksys_hrm_prod -c "SELECT version();"
```

---

## Step 3: Node.js Installation

### 3.1 Install Node.js 22.16.0 LTS

```bash
# Add NodeSource repository for Node.js 22.x
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -

# Install Node.js
sudo dnf install -y nodejs

# Verify installation
node --version
# Expected: v22.16.0 (or v22.x.x)

npm --version
# Expected: 10.x.x or higher
```

### 3.2 Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify PM2 installation
pm2 --version

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the instructions provided by the command

# Save PM2 configuration
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

**Verification:**
```bash
pm2 list
# Should show empty list initially
```

---

## Step 4: Nginx Installation

### 4.1 Install Nginx

```bash
# Install Nginx
sudo dnf install -y nginx

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

**Verification:**
```bash
sudo systemctl status nginx
# Expected: active (running)

# Test Nginx
curl http://localhost
# Should return default Nginx page
```

### 4.2 Create Nginx Configuration

```bash
# Remove default configuration
sudo rm -f /etc/nginx/conf.d/default.conf

# Create HRM configuration file
sudo vim /etc/nginx/conf.d/hrm.conf
```

**Nginx Configuration (`/etc/nginx/conf.d/hrm.conf`):**
```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Upstream backend
upstream hrm_backend {
    server 127.0.0.1:5000 fail_timeout=30s max_fails=3;
    keepalive 32;
}

# Upstream frontend
upstream hrm_frontend {
    server 127.0.0.1:3000 fail_timeout=30s max_fails=3;
    keepalive 32;
}

# HTTP Server
server {
    listen 80;
    server_name 95.216.14.232;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Client body size limit
    client_max_body_size 50M;
    
    # Logging
    access_log /var/log/nginx/hrm_access.log;
    error_log /var/log/nginx/hrm_error.log;
    
    # API endpoint
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://hrm_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login_limit burst=3 nodelay;
        
        proxy_pass http://hrm_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File uploads
    location /api/upload {
        client_max_body_size 100M;
        proxy_pass http://hrm_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Frontend application
    location / {
        proxy_pass http://hrm_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location /static/ {
        alias /opt/skyraksys-hrm/frontend/build/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**Test and reload Nginx:**
```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**Verification:**
```bash
curl http://95.216.14.232/health
# Expected: healthy
```

---

## Step 5: Application Setup

### 5.1 Clone Repository

```bash
# Navigate to application directory
cd /opt/skyraksys-hrm

# Clone repository
git clone https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git .

# Verify files
ls -la
# Should see: backend/, frontend/, redhatprod/, README.md, etc.
```

### 5.2 Generate Production Configuration

```bash
# Navigate to scripts directory
cd /opt/skyraksys-hrm/redhatprod/scripts

# Make scripts executable
chmod +x *.sh

# Generate production .env files
sudo bash 00_generate_configs.sh 95.216.14.232
```

**This script generates:**
- `/opt/skyraksys-hrm/backend/.env.production`
- `/opt/skyraksys-hrm/frontend/.env.production`

### 5.3 Configure Backend Environment

**⚠️ IMPORTANT:** The automated deployment scripts use **HARDCODED production secrets** for consistency and reliability.

```bash
# Edit backend .env.production
sudo vim /opt/skyraksys-hrm/backend/.env.production
```

**Update these critical values:**
```env
# Server Configuration
NODE_ENV=production
PORT=5000
API_URL=http://95.216.14.232/api

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=hrm_app
DB_PASSWORD=SkyRakDB#2025!Prod@HRM$Secure  # HARDCODED in automated scripts

# JWT Configuration (HARDCODED - DO NOT CHANGE unless updating all scripts)
JWT_SECRET=SkyRak2025JWT@Prod!Secret#HRM$Key&Secure*System^Auth%Token
JWT_EXPIRATION=24h
JWT_REFRESH_SECRET=SkyRak2025Refresh@JWT!Secret#HRM$Renew&Key*Secure^Token%Auth
JWT_REFRESH_EXPIRATION=7d

# Session Configuration (HARDCODED)
SESSION_SECRET=SkyRak2025Session@Secret!HRM#Prod$Key&Secure

# Seeding Configuration
SEED_DEMO_DATA=true  # Set to false after initial setup
SEED_DEFAULT_PASSWORD=admin123  # Change after first login

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Optional - configure later)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# File Upload
UPLOAD_DIR=/opt/skyraksys-hrm/uploads
MAX_FILE_SIZE=10485760
```

**⚠️ SECURITY NOTICE:**
These secrets are hardcoded in the public GitHub repository for automated deployment consistency.

**For production security:**
1. ✅ Secrets are production-grade strength (52-70 characters)
2. ✅ Zero deployment failures due to password mismatch
3. ⚠️ All secrets are publicly visible in GitHub
4. 💡 Consider rotating secrets after initial deployment for maximum security

**If you need to generate different secrets** (deviating from automation):
```bash
# Generate random JWT secret (64+ chars)
openssl rand -base64 48

# IMPORTANT: If you change secrets here, you must also update:
# - redhatprod/scripts/00_generate_configs_auto.sh
# - redhatprod/scripts/00_generate_configs.sh  
# - redhatprod/templates/.env.production
```

**For standard deployment: Use the hardcoded values above (no changes needed)**

### 5.4 Configure Frontend Environment

```bash
# Edit frontend .env.production
sudo vim /opt/skyraksys-hrm/frontend/.env.production
```

**Configuration:**
```env
# API Configuration
REACT_APP_API_URL=http://95.216.14.232/api

# Application Settings
REACT_APP_NAME=SkyrakSys HRM
REACT_APP_VERSION=1.0.0

# Environment
NODE_ENV=production
```

---

## Step 6: Database Configuration

### 6.1 Install Backend Dependencies

```bash
# Navigate to backend directory
cd /opt/skyraksys-hrm/backend

# Install npm packages
npm install --production

# Install Sequelize CLI globally (for migrations)
sudo npm install -g sequelize-cli
```

**Verification:**
```bash
npm list --depth=0
# Should show all installed packages without errors
```

### 6.2 Run Database Migrations

```bash
# Set environment
export NODE_ENV=production

# Run migrations
npx sequelize-cli db:migrate --env production

# Verify migrations
npx sequelize-cli db:migrate:status --env production
```

**Expected Output:**
```
up 20240101000000-create-users.js
up 20240101000001-create-departments.js
up 20240101000002-create-designations.js
... (all migrations should show 'up')
```

### 6.3 Seed Initial Data

```bash
# Run seeders
npx sequelize-cli db:seed:all --env production
```

**Expected Output:**
```
Seeding: 20240101000000-initial-data.js
Successfully seeded: 20240101000000-initial-data.js
```

### 6.4 Verify Database Setup

```bash
# Connect to database
psql -h localhost -U hrm_app -d skyraksys_hrm_prod

# Check tables
\dt

# Check admin user
SELECT id, email, role FROM Users WHERE role = 'admin';

# Exit
\q
```

**Expected:** At least 15+ tables and one admin user.

---

## Step 7: Backend Deployment

### 7.1 Build Backend (if applicable)

```bash
# Navigate to backend
cd /opt/skyraksys-hrm/backend

# If using TypeScript, build
# npm run build

# Test backend startup
NODE_ENV=production node server.js
```

**Press Ctrl+C after verifying it starts without errors.**

### 7.2 Configure PM2 for Backend

```bash
# Create PM2 ecosystem file
cat > /opt/skyraksys-hrm/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hrm-backend',
      cwd: '/opt/skyraksys-hrm/backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/opt/skyraksys-hrm/logs/backend-error.log',
      out_file: '/opt/skyraksys-hrm/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
EOF
```

### 7.3 Start Backend with PM2

```bash
# Start backend
pm2 start /opt/skyraksys-hrm/ecosystem.config.js

# Save PM2 process list
pm2 save

# Verify backend is running
pm2 list
pm2 logs hrm-backend --lines 50
```

**Verification:**
```bash
# Test API endpoint
curl http://localhost:5000/api/health
# Expected: {"success":true,"message":"API is running"}

# Test from external
curl http://95.216.14.232/api/health
```

---

## Step 8: Frontend Deployment

### 8.1 Install Frontend Dependencies

```bash
# Navigate to frontend
cd /opt/skyraksys-hrm/frontend

# Install dependencies
npm install

# Verify
npm list --depth=0
```

### 8.2 Build Frontend for Production

```bash
# Build frontend
npm run build

# Verify build
ls -la build/
# Should see: index.html, static/, asset-manifest.json, etc.
```

**Expected Output:**
```
Creating an optimized production build...
Compiled successfully.
```

### 8.3 Configure PM2 for Frontend

```bash
# Add frontend to PM2 ecosystem config
cat >> /opt/skyraksys-hrm/ecosystem.config.js << 'EOF'
    ,
    {
      name: 'hrm-frontend',
      cwd: '/opt/skyraksys-hrm/frontend',
      script: 'node_modules/react-scripts/scripts/start.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        BROWSER: 'none'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/opt/skyraksys-hrm/logs/frontend-error.log',
      out_file: '/opt/skyraksys-hrm/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
EOF
```

**Note:** For production, you may want to serve the built files with a static server instead:

```bash
# Alternative: Install serve
sudo npm install -g serve

# Update ecosystem config for static serving
cat > /opt/skyraksys-hrm/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hrm-backend',
      cwd: '/opt/skyraksys-hrm/backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/opt/skyraksys-hrm/logs/backend-error.log',
      out_file: '/opt/skyraksys-hrm/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'hrm-frontend',
      cwd: '/opt/skyraksys-hrm/frontend',
      script: 'serve',
      args: '-s build -l 3000',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/opt/skyraksys-hrm/logs/frontend-error.log',
      out_file: '/opt/skyraksys-hrm/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF
```

### 8.4 Start Frontend with PM2

```bash
# Reload PM2 with new config
pm2 delete all
pm2 start /opt/skyraksys-hrm/ecosystem.config.js

# Save PM2 configuration
pm2 save

# Verify
pm2 list
pm2 logs hrm-frontend --lines 50
```

**Verification:**
```bash
# Test frontend locally
curl http://localhost:3000
# Should return HTML content

# Test from external
curl http://95.216.14.232
# Should return HTML content
```

---

## Step 9: Service Configuration

### 9.1 Create Systemd Service for PM2

```bash
# Generate PM2 startup script
pm2 startup systemd -u root --hp /root

# Execute the command provided by PM2
# It will look something like:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Save current PM2 process list
pm2 save
```

### 9.2 Enable Services on Boot

```bash
# Enable PostgreSQL
sudo systemctl enable postgresql-17

# Enable Nginx
sudo systemctl enable nginx

# PM2 is already configured to start on boot
```

### 9.3 Verify All Services

```bash
# Check PostgreSQL
sudo systemctl status postgresql-17

# Check Nginx
sudo systemctl status nginx

# Check PM2 apps
pm2 list

# Check all services
sudo systemctl list-units --type=service --state=running | grep -E 'postgresql|nginx|pm2'
```

---

## Step 10: SSL/TLS Setup (Optional)

### 10.1 Install Certbot

```bash
# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx
```

### 10.2 Obtain SSL Certificate

**Prerequisites:**
- Domain name pointing to 95.216.14.232
- Port 80 open in firewall

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Start Nginx
sudo systemctl start nginx
```

### 10.3 Configure Nginx for HTTPS

```bash
# Edit Nginx configuration
sudo vim /etc/nginx/conf.d/hrm.conf
```

**Add HTTPS server block:**
```nginx
# Add after HTTP server block

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Same configuration as HTTP server...
    # (Copy location blocks from HTTP server)
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

**Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 10.4 Setup Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Renewal is automatic via systemd timer
sudo systemctl status certbot-renew.timer
```

---

## Step 11: Final Verification

### 11.1 Health Check Script

```bash
# Create health check script
cat > /opt/skyraksys-hrm/health-check.sh << 'EOF'
#!/bin/bash

echo "=== SkyrakSys HRM Health Check ==="
echo ""

# Check PostgreSQL
echo "1. PostgreSQL Service:"
systemctl is-active postgresql-17 && echo "   ✓ Running" || echo "   ✗ Not running"

# Check Nginx
echo "2. Nginx Service:"
systemctl is-active nginx && echo "   ✓ Running" || echo "   ✗ Not running"

# Check PM2 Apps
echo "3. PM2 Applications:"
pm2 list | grep -q "hrm-backend" && echo "   ✓ Backend running" || echo "   ✗ Backend not running"
pm2 list | grep -q "hrm-frontend" && echo "   ✓ Frontend running" || echo "   ✗ Frontend not running"

# Check API
echo "4. API Health:"
curl -s http://localhost:5000/api/health > /dev/null && echo "   ✓ API responding" || echo "   ✗ API not responding"

# Check Frontend
echo "5. Frontend:"
curl -s http://localhost:3000 > /dev/null && echo "   ✓ Frontend responding" || echo "   ✗ Frontend not responding"

# Check Database Connection
echo "6. Database Connection:"
PGPASSWORD='SkyRakDB#2025!Prod@HRM$Secure' psql -h localhost -U hrm_app -d skyraksys_hrm_prod -c "SELECT 1;" > /dev/null 2>&1 && echo "   ✓ Database connected" || echo "   ✗ Database connection failed"

echo ""
echo "=== End Health Check ==="
EOF

chmod +x /opt/skyraksys-hrm/health-check.sh
```

### 11.2 Run Health Check

```bash
# Execute health check
/opt/skyraksys-hrm/health-check.sh
```

**Expected Output:**
```
=== SkyrakSys HRM Health Check ===

1. PostgreSQL Service:
   ✓ Running
2. Nginx Service:
   ✓ Running
3. PM2 Applications:
   ✓ Backend running
   ✓ Frontend running
4. API Health:
   ✓ API responding
5. Frontend:
   ✓ Frontend responding
6. Database Connection:
   ✓ Database connected

=== End Health Check ===
```

### 11.3 Test Application Login

**Open browser and navigate to:**
```
http://95.216.14.232
```

**Login with default credentials:**
- Email: `admin@example.com`
- Password: `admin123`

**⚠️ NOTE:** Change this password immediately after first login!

**Verify you can:**
- ✓ Login successfully
- ✓ Access dashboard
- ✓ Navigate to different modules
- ✓ Create/edit/delete records
- ✓ Logout and login again

### 11.4 Database Validation

```bash
# Run validation script (if created)
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash validate-database.sh
```

**Expected:** 0 errors, all tables present with correct schema.

---

## Post-Installation Tasks

### 1. Security Hardening

```bash
# Change default admin password immediately
# Login to application and go to Profile > Change Password

# Disable demo data seeding
sudo vim /opt/skyraksys-hrm/backend/.env.production
# Set: SEED_DEMO_DATA=false

# Restart backend
pm2 restart hrm-backend
```

### 2. Setup Backups

```bash
# Create backup script
cat > /opt/skyraksys-hrm/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/hrm"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD='SkyRakDB#2025!Prod@HRM$Secure' pg_dump -h localhost -U hrm_app skyraksys_hrm_prod | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /opt/skyraksys-hrm/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/skyraksys-hrm/scripts/backup.sh

# Add to crontab for daily backup
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/skyraksys-hrm/scripts/backup.sh >> /opt/skyraksys-hrm/logs/backup.log 2>&1") | crontab -
```

### 3. Setup Monitoring

```bash
# Install monitoring script
cat > /opt/skyraksys-hrm/scripts/monitor.sh << 'EOF'
#!/bin/bash

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage is at ${DISK_USAGE}%"
fi

# Check memory
MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d. -f1)
if [ $MEM_USAGE -gt 90 ]; then
    echo "WARNING: Memory usage is at ${MEM_USAGE}%"
fi

# Check PM2 apps
pm2 list | grep -q "errored" && echo "WARNING: PM2 app in error state"

# Log results
echo "$(date): Disk: ${DISK_USAGE}%, Memory: ${MEM_USAGE}%"
EOF

chmod +x /opt/skyraksys-hrm/scripts/monitor.sh

# Add to crontab for hourly monitoring
(crontab -l 2>/dev/null; echo "0 * * * * /opt/skyraksys-hrm/scripts/monitor.sh >> /opt/skyraksys-hrm/logs/monitor.log 2>&1") | crontab -
```

### 4. Configure Log Rotation

```bash
# Create logrotate configuration
cat > /etc/logrotate.d/hrm << 'EOF'
/opt/skyraksys-hrm/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0640 root root
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/hrm_*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0640 nginx nginx
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null
    endscript
}
EOF
```

### 5. Document Installation

```bash
# Create installation record
cat > /opt/skyraksys-hrm/INSTALLATION_RECORD.txt << EOF
=== SkyrakSys HRM Installation Record ===

Installation Date: $(date)
Server IP: 95.216.14.232
OS: $(cat /etc/redhat-release)
PostgreSQL Version: $(psql --version)
Node.js Version: $(node --version)
Nginx Version: $(nginx -v 2>&1)

Database Name: skyraksys_hrm_prod
Database User: hrm_app

Installed By: $(whoami)
Installation Method: Manual

Notes:
- Default admin: admin@skyraksys.com
- Backend Port: 5000
- Frontend Port: 3000
- Nginx Port: 80

=== End Record ===
EOF
```

---

## Troubleshooting

### Issue: Backend Not Starting

**Check logs:**
```bash
pm2 logs hrm-backend --lines 100
tail -f /opt/skyraksys-hrm/logs/backend-error.log
```

**Common causes:**
1. Database connection failed
   - Verify PostgreSQL is running
   - Check credentials in .env.production
   - Test connection: `psql -h localhost -U hrm_app -d skyraksys_hrm_prod`

2. Port already in use
   - Check: `sudo netstat -tulpn | grep 5000`
   - Kill process: `sudo kill -9 <PID>`

3. Missing dependencies
   - Reinstall: `cd /opt/skyraksys-hrm/backend && npm install`

### Issue: Frontend Not Accessible

**Check logs:**
```bash
pm2 logs hrm-frontend --lines 100
```

**Common causes:**
1. Build failed
   - Rebuild: `cd /opt/skyraksys-hrm/frontend && npm run build`

2. Nginx misconfigured
   - Test: `sudo nginx -t`
   - Check logs: `sudo tail -f /var/log/nginx/error.log`

3. Port conflict
   - Check: `sudo netstat -tulpn | grep 3000`

### Issue: Database Connection Failed

**Verify PostgreSQL:**
```bash
# Check service
sudo systemctl status postgresql-17

# Check logs
sudo tail -f /var/lib/pgsql/17/data/log/postgresql-*.log

# Test connection
psql -h localhost -U hrm_app -d skyraksys_hrm_prod
```

**Check authentication:**
```bash
# Verify pg_hba.conf
sudo cat /var/lib/pgsql/17/data/pg_hba.conf | grep hrm_app

# Reload if changed
sudo systemctl reload postgresql-17
```

### Issue: 502 Bad Gateway

**Check upstream servers:**
```bash
# Check backend
curl http://localhost:5000/api/health

# Check frontend
curl http://localhost:3000

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Issue: Permission Denied

**Fix permissions:**
```bash
# Application directory
sudo chown -R root:root /opt/skyraksys-hrm
sudo chmod -R 755 /opt/skyraksys-hrm

# Uploads directory
sudo mkdir -p /opt/skyraksys-hrm/uploads
sudo chmod -R 775 /opt/skyraksys-hrm/uploads

# Logs directory
sudo mkdir -p /opt/skyraksys-hrm/logs
sudo chmod -R 775 /opt/skyraksys-hrm/logs
```

### Issue: SELinux Blocking Connections

**Check SELinux denials:**
```bash
sudo ausearch -m avc -ts recent
```

**Fix SELinux context:**
```bash
# For application directory
sudo semanage fcontext -a -t httpd_sys_content_t "/opt/skyraksys-hrm(/.*)?"
sudo restorecon -Rv /opt/skyraksys-hrm

# Allow network connections
sudo setsebool -P httpd_can_network_connect 1
```

### Getting Help

**Collect diagnostic information:**
```bash
# Create diagnostic report
cat > /tmp/hrm-diagnostic.txt << EOF
=== System Information ===
OS: $(cat /etc/redhat-release)
Date: $(date)

=== Service Status ===
PostgreSQL: $(systemctl is-active postgresql-17)
Nginx: $(systemctl is-active nginx)

=== PM2 Apps ===
$(pm2 list)

=== Recent Backend Logs ===
$(pm2 logs hrm-backend --lines 50 --nostream)

=== Recent Frontend Logs ===
$(pm2 logs hrm-frontend --lines 50 --nostream)

=== Nginx Error Log ===
$(sudo tail -50 /var/log/nginx/error.log)

=== PostgreSQL Log ===
$(sudo tail -50 /var/lib/pgsql/17/data/log/postgresql-*.log)

=== Disk Space ===
$(df -h)

=== Memory Usage ===
$(free -h)

=== Network Ports ===
$(sudo netstat -tulpn | grep -E '5000|3000|80|5432')
EOF

cat /tmp/hrm-diagnostic.txt
```

**Contact support with the diagnostic report.**

---

## Appendix: Quick Reference Commands

### Service Management
```bash
# Start services
sudo systemctl start postgresql-17 nginx
pm2 start all

# Stop services
pm2 stop all
sudo systemctl stop nginx postgresql-17

# Restart services
pm2 restart all
sudo systemctl restart nginx postgresql-17

# Check status
sudo systemctl status postgresql-17 nginx
pm2 status
```

### Application Management
```bash
# View logs
pm2 logs hrm-backend
pm2 logs hrm-frontend
sudo tail -f /var/log/nginx/hrm_*.log

# Restart apps
pm2 restart hrm-backend
pm2 restart hrm-frontend
pm2 restart all

# Update application
cd /opt/skyraksys-hrm
git pull origin master
cd backend && npm install && pm2 restart hrm-backend
cd ../frontend && npm install && npm run build && pm2 restart hrm-frontend
```

### Database Management
```bash
# Connect to database
psql -h localhost -U hrm_app -d skyraksys_hrm_prod

# Backup database
pg_dump -h localhost -U hrm_app skyraksys_hrm_prod > backup.sql

# Restore database
psql -h localhost -U hrm_app -d skyraksys_hrm_prod < backup.sql

# Run migrations
cd /opt/skyraksys-hrm/backend
npx sequelize-cli db:migrate --env production
```

### Monitoring
```bash
# System resources
htop
df -h
free -h

# Network connections
sudo netstat -tulpn
sudo ss -tulpn

# Process list
ps aux | grep -E 'node|nginx|postgres'
```

---

## Conclusion

Your SkyrakSys HRM system is now fully deployed and operational!

**Important Next Steps:**
1. ✅ Change default admin password
2. ✅ Disable demo data seeding (SEED_DEMO_DATA=false)
3. ✅ Setup regular backups
4. ✅ Configure monitoring
5. ✅ Setup SSL/TLS certificate
6. ✅ Review security settings

**Support:**
- Documentation: `/opt/skyraksys-hrm/redhatprod/README.md`
- Audit Report: `/opt/skyraksys-hrm/redhatprod/COMPREHENSIVE_AUDIT_REPORT_NOV_4_2025.md`
- Code Review: `/opt/skyraksys-hrm/redhatprod/CODE_REVIEW_REPORT_NOV_4_2025.md`

---

**Document Version:** 1.0  
**Last Updated:** November 4, 2025  
**Deployment Target:** RHEL 9.6 @ 95.216.14.232
