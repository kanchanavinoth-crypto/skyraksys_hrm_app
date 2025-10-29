# 🚀 Deployment Guide

**Version**: 2.0.0  
**Last Updated**: October 27, 2025  
**Target Environment**: Production (RHEL 9.6)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Nginx Configuration](#nginx-configuration)
7. [SSL/TLS Setup](#ssltls-setup)
8. [PM2 Process Management](#pm2-process-management)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup Strategy](#backup-strategy)
11. [Rollback Procedures](#rollback-procedures)

---

## 🔧 Prerequisites

### Server Requirements

| Component | Requirement |
|-----------|-------------|
| **OS** | RHEL 9.6 or CentOS Stream 9 |
| **CPU** | 4+ cores recommended |
| **RAM** | 8GB minimum, 16GB recommended |
| **Storage** | 100GB+ SSD |
| **Network** | Static IP, ports 80/443 open |

### Software Versions

| Software | Version |
|----------|---------|
| **Node.js** | 18.x LTS |
| **npm** | 9.x |
| **PostgreSQL** | 15.x |
| **Nginx** | 1.20+ |
| **PM2** | Latest |
| **Git** | 2.x |

---

## 🖥️ Server Setup

### Initial Server Configuration

```bash
# Update system
sudo dnf update -y

# Install EPEL repository
sudo dnf install -y epel-release

# Install required tools
sudo dnf install -y git wget curl vim

# Set timezone
sudo timedatectl set-timezone Asia/Kolkata

# Configure firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=5000/tcp  # Backend API
sudo firewall-cmd --reload

# Verify firewall
sudo firewall-cmd --list-all
```

### Create Application User

```bash
# Create user for running application
sudo useradd -m -s /bin/bash hrmapp
sudo passwd hrmapp

# Add to sudoers for PM2
echo "hrmapp ALL=(ALL) NOPASSWD: /usr/bin/pm2" | sudo tee -a /etc/sudoers.d/hrmapp
```

### Install Node.js

```bash
# Add NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# Install Node.js
sudo dnf install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

---

## 🗄️ Database Setup

### Install PostgreSQL

```bash
# Install PostgreSQL 15
sudo dnf install -y postgresql15-server postgresql15-contrib

# Initialize database
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb

# Start and enable service
sudo systemctl start postgresql-15
sudo systemctl enable postgresql-15
sudo systemctl status postgresql-15
```

### Configure PostgreSQL

```bash
# Edit postgresql.conf
sudo vim /var/lib/pgsql/15/data/postgresql.conf
```

**Key Settings**:
```ini
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 128MB
```

**Configure Authentication** (`pg_hba.conf`):
```bash
sudo vim /var/lib/pgsql/15/data/pg_hba.conf
```

Add:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

**Restart PostgreSQL**:
```bash
sudo systemctl restart postgresql-15
```

### Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql prompt:
CREATE DATABASE skyraksys_hrm;
CREATE USER hrm_app WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_app;

# Grant schema permissions
\c skyraksys_hrm
GRANT ALL ON SCHEMA public TO hrm_app;

# Exit
\q
```

### Enable UUID Extension

```bash
sudo -u postgres psql -d skyraksys_hrm

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

---

## 🔙 Backend Deployment

### Clone Repository

```bash
# Login as hrmapp user
su - hrmapp

# Create directory structure
mkdir -p /home/hrmapp/apps
cd /home/hrmapp/apps

# Clone repository
git clone https://github.com/skyraksys/hrm.git
cd hrm/backend
```

### Install Dependencies

```bash
npm install --production
```

### Environment Configuration

```bash
# Create production environment file
cp .env.production.template .env.production
vim .env.production
```

**Production Environment** (`.env.production`):
```bash
# Server
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=hrm_app
DB_PASSWORD=your_secure_password
DB_DIALECT=postgres
DB_LOGGING=false

# JWT (Generate strong secret: openssl rand -base64 32)
JWT_SECRET=<generated-strong-secret-key>
JWT_EXPIRES_IN=1h

# CORS
CORS_ORIGIN=https://hrm.skyraksys.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300

# Logging
LOG_LEVEL=info
LOG_DIR=/home/hrmapp/logs

# Security
HELMET_CSP=strict
```

### Database Migration

```bash
# Run migrations (if using Sequelize CLI)
npx sequelize-cli db:migrate

# Seed initial data
npx sequelize-cli db:seed:all
```

### Test Backend

```bash
# Test server startup
npm start

# Verify API (in another terminal)
curl http://localhost:5000/api/health

# Should return: {"status":"healthy"}

# Stop test server (Ctrl+C)
```

---

## 🎨 Frontend Deployment

### Build Frontend

```bash
cd /home/hrmapp/apps/hrm/frontend

# Install dependencies
npm install

# Create production environment file
cat > .env.production << EOF
REACT_APP_API_URL=https://hrm.skyraksys.com/api
REACT_APP_ENV=production
EOF

# Build production bundle
npm run build

# Build output will be in 'build/' directory
ls -la build/
```

### Deploy Static Files

```bash
# Create web root
sudo mkdir -p /var/www/hrm
sudo chown -R hrmapp:hrmapp /var/www/hrm

# Copy build files
cp -r build/* /var/www/hrm/

# Set permissions
sudo chown -R nginx:nginx /var/www/hrm
sudo chmod -R 755 /var/www/hrm
```

---

## 🌐 Nginx Configuration

### Install Nginx

```bash
sudo dnf install -y nginx

# Start and enable
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

### Configure Virtual Host

```bash
# Create configuration file
sudo vim /etc/nginx/conf.d/hrm.conf
```

**Nginx Configuration**:
```nginx
# Upstream for Node.js backend
upstream backend_hrm {
    server 127.0.0.1:5000;
    keepalive 64;
}

# HTTP Server (redirect to HTTPS)
server {
    listen 80;
    server_name hrm.skyraksys.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name hrm.skyraksys.com;

    # SSL Certificates (will be configured in SSL section)
    ssl_certificate /etc/ssl/certs/hrm.crt;
    ssl_certificate_key /etc/ssl/private/hrm.key;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory for React app
    root /var/www/hrm;
    index index.html;

    # Logging
    access_log /var/log/nginx/hrm_access.log;
    error_log /var/log/nginx/hrm_error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # API proxy to backend
    location /api {
        proxy_pass http://backend_hrm;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL/TLS Setup

### Option 1: Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d hrm.skyraksys.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (Yes)

# Certbot will automatically configure Nginx

# Test auto-renewal
sudo certbot renew --dry-run

# Auto-renewal is configured via systemd timer
sudo systemctl list-timers | grep certbot
```

### Option 2: Commercial Certificate

```bash
# Generate CSR
sudo openssl req -new -newkey rsa:2048 -nodes \
  -keyout /etc/ssl/private/hrm.key \
  -out /etc/ssl/certs/hrm.csr

# Submit CSR to certificate authority
# Receive certificate files:
# - hrm.crt (certificate)
# - intermediate.crt (intermediate certificate)
# - ca-bundle.crt (CA bundle)

# Combine certificates
cat hrm.crt intermediate.crt ca-bundle.crt > /etc/ssl/certs/hrm.crt

# Set permissions
sudo chmod 600 /etc/ssl/private/hrm.key
sudo chmod 644 /etc/ssl/certs/hrm.crt

# Update Nginx configuration with certificate paths
# Reload Nginx
sudo systemctl reload nginx
```

### Verify SSL

```bash
# Test SSL configuration
openssl s_client -connect hrm.skyraksys.com:443 -servername hrm.skyraksys.com

# Online SSL test:
# https://www.ssllabs.com/ssltest/analyze.html?d=hrm.skyraksys.com
```

---

## ⚙️ PM2 Process Management

### Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### PM2 Configuration

Create ecosystem file:
```bash
cd /home/hrmapp/apps/hrm
vim ecosystem.config.js
```

**ecosystem.config.js**:
```javascript
module.exports = {
  apps: [{
    name: 'skyraksys-hrm',
    cwd: '/home/hrmapp/apps/hrm/backend',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    env_file: '/home/hrmapp/apps/hrm/backend/.env.production',
    error_file: '/home/hrmapp/logs/pm2-error.log',
    out_file: '/home/hrmapp/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
```

### Start Application with PM2

```bash
# Create logs directory
mkdir -p /home/hrmapp/logs

# Start application
cd /home/hrmapp/apps/hrm
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs skyraksys-hrm

# Monitor resources
pm2 monit
```

### PM2 Startup Script

```bash
# Generate startup script
pm2 startup systemd -u hrmapp --hp /home/hrmapp

# Save current process list
pm2 save

# Verify
sudo systemctl status pm2-hrmapp
```

### PM2 Commands Reference

```bash
# Status
pm2 status
pm2 list

# Logs
pm2 logs
pm2 logs skyraksys-hrm
pm2 logs --lines 100

# Restart
pm2 restart skyraksys-hrm
pm2 restart all

# Stop
pm2 stop skyraksys-hrm
pm2 stop all

# Delete
pm2 delete skyraksys-hrm

# Reload (zero-downtime)
pm2 reload skyraksys-hrm

# Info
pm2 info skyraksys-hrm

# Monitor
pm2 monit
```

---

## 📊 Monitoring & Logging

### Application Logs

**Log Locations**:
```bash
# PM2 logs
/home/hrmapp/logs/pm2-out.log
/home/hrmapp/logs/pm2-error.log

# Nginx logs
/var/log/nginx/hrm_access.log
/var/log/nginx/hrm_error.log

# PostgreSQL logs
/var/lib/pgsql/15/data/log/
```

**View Logs**:
```bash
# Real-time PM2 logs
pm2 logs --lines 50

# Nginx access log
sudo tail -f /var/log/nginx/hrm_access.log

# Nginx error log
sudo tail -f /var/log/nginx/hrm_error.log

# PostgreSQL log
sudo tail -f /var/lib/pgsql/15/data/log/postgresql-*.log
```

### Log Rotation

Create logrotate configuration:
```bash
sudo vim /etc/logrotate.d/hrm
```

```
/home/hrmapp/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 hrmapp hrmapp
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/hrm_*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nginx adm
    sharedscripts
    postrotate
        /bin/kill -USR1 `cat /run/nginx.pid 2>/dev/null` 2>/dev/null || true
    endscript
}
```

### Health Monitoring

**Setup Health Check Script**:
```bash
vim /home/hrmapp/scripts/health-check.sh
```

```bash
#!/bin/bash

API_URL="https://hrm.skyraksys.com/api/health"
ALERT_EMAIL="admin@skyraksys.com"

# Check API health
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $response -ne 200 ]; then
    echo "HRM API is down! HTTP Status: $response" | \
        mail -s "HRM Alert: API Down" $ALERT_EMAIL
    
    # Attempt restart
    pm2 restart skyraksys-hrm
fi
```

**Add to crontab**:
```bash
crontab -e

# Check every 5 minutes
*/5 * * * * /home/hrmapp/scripts/health-check.sh
```

---

## 💾 Backup Strategy

### Database Backup

**Automated Daily Backup Script**:
```bash
sudo mkdir -p /backup/hrm/database
sudo vim /usr/local/bin/backup-hrm-db.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/backup/hrm/database"
DB_NAME="skyraksys_hrm"
DB_USER="hrm_app"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hrm_backup_$DATE.sql"
RETENTION_DAYS=30

# Create backup
export PGPASSWORD='your_password'
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete old backups
find $BACKUP_DIR -name "hrm_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_FILE.gz s3://your-backup-bucket/hrm/
```

**Make executable and schedule**:
```bash
sudo chmod +x /usr/local/bin/backup-hrm-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-hrm-db.sh
```

### Application Backup

```bash
# Backup application files
tar -czf /backup/hrm/app_$(date +%Y%m%d).tar.gz \
  /home/hrmapp/apps/hrm \
  --exclude=node_modules \
  --exclude=.git
```

### Restore Procedures

**Restore Database**:
```bash
# Decompress backup
gunzip hrm_backup_20251027_020000.sql.gz

# Restore database
export PGPASSWORD='your_password'
psql -U hrm_app -h localhost skyraksys_hrm < hrm_backup_20251027_020000.sql
```

**Restore Application**:
```bash
# Stop application
pm2 stop skyraksys-hrm

# Extract backup
tar -xzf app_20251027.tar.gz -C /

# Restore permissions
chown -R hrmapp:hrmapp /home/hrmapp/apps/hrm

# Start application
pm2 start skyraksys-hrm
```

---

## ⏮️ Rollback Procedures

### Quick Rollback

```bash
# Stop current version
pm2 stop skyraksys-hrm

# Checkout previous version
cd /home/hrmapp/apps/hrm
git log --oneline -5  # View recent commits
git checkout <previous-commit-hash>

# Reinstall dependencies (if needed)
cd backend
npm install --production

# Restart
pm2 restart skyraksys-hrm

# Verify
pm2 logs skyraksys-hrm
```

### Database Rollback

```bash
# If migrations need to be rolled back
cd /home/hrmapp/apps/hrm/backend
npx sequelize-cli db:migrate:undo

# Or restore from backup
export PGPASSWORD='your_password'
psql -U hrm_app -h localhost skyraksys_hrm < backup.sql
```

---

## 🔍 Post-Deployment Verification

### Checklist

- [ ] Backend API responding: `curl https://hrm.skyraksys.com/api/health`
- [ ] Frontend loading correctly
- [ ] Database connection working
- [ ] Login functionality working
- [ ] SSL certificate valid
- [ ] PM2 process running: `pm2 status`
- [ ] Nginx serving requests: `sudo systemctl status nginx`
- [ ] Logs being written: `pm2 logs`
- [ ] Firewall rules applied: `sudo firewall-cmd --list-all`
- [ ] Backup script scheduled: `crontab -l`
- [ ] Health monitoring active

### Performance Testing

```bash
# Install Apache Bench
sudo dnf install -y httpd-tools

# Test API endpoint
ab -n 1000 -c 10 https://hrm.skyraksys.com/api/health
```

---

**Next**: [Testing Guide](./09-TESTING_GUIDE.md)
