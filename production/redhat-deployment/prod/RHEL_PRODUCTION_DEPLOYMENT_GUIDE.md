# Skyraksys HRM - RHEL 9.6 Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Pre-Installation Checklist](#pre-installation-checklist)
4. [Installation Steps](#installation-steps)
5. [Configuration](#configuration)
6. [Security Setup](#security-setup)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Backup and Recovery](#backup-and-recovery)
10. [Performance Tuning](#performance-tuning)

## Prerequisites

### System Requirements
- **Operating System**: Red Hat Enterprise Linux 9.6 (or compatible)
- **CPU**: Minimum 2 cores, Recommended 4+ cores
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 50GB free space, Recommended 100GB+
- **Network**: Static IP address recommended
- **User Access**: Root or sudo privileges

### Network Requirements
- **Ports to Open**:
  - 80 (HTTP) - Main application access
  - 5432 (PostgreSQL) - Database (localhost only)
  - 22 (SSH) - Remote administration
  - 3000 (Development) - Frontend development server (optional)
  - 5000 (Development) - Backend API server (optional)

### Software Dependencies
All dependencies will be installed automatically by the setup scripts:
- Node.js 18.x LTS
- PostgreSQL 15
- Nginx
- Redis
- PM2 Process Manager
- Git
- Development tools

## Pre-Installation Checklist

### 1. Server Preparation
```bash
# Update system packages
sudo dnf update -y

# Check available disk space
df -h

# Check memory
free -h

# Check CPU information
lscpu

# Verify network connectivity
ping -c 4 google.com
```

### 2. User and Permissions
```bash
# Ensure you have root access
sudo whoami

# Check SELinux status (will be configured automatically)
sestatus

# Check firewall status
systemctl status firewalld
```

### 3. Download Deployment Package
```bash
# Create working directory
mkdir -p /tmp/hrm-deployment
cd /tmp/hrm-deployment

# Option A: Download from Git repository
git clone https://your-repository/skyraksys-hrm.git
cd skyraksys-hrm/redhatprod

# Option B: Extract from provided package
# tar -xzf skyraksys-hrm-prod.tar.gz
# cd skyraksys-hrm/redhatprod
```

## Installation Steps

### Step 1: Install Prerequisites
```bash
# Navigate to scripts directory
cd /path/to/skyraksys-hrm/redhatprod/scripts

# Make scripts executable
chmod +x *.sh

# Run prerequisites installation (as root)
sudo ./01_install_prerequisites.sh
```

**What this script does:**
- Updates system packages
- Installs Node.js 18.x LTS
- Installs PostgreSQL 15
- Installs Nginx
- Installs Redis
- Creates application user (`hrmapp`)
- Configures firewall
- Sets up basic directory structure

**Expected output:**
```
==========================================
RHEL 9.6 Production Server Setup
Skyraksys HRM System
==========================================
[INFO] Updating system packages...
[INFO] Installing Node.js 18.x LTS...
[INFO] Node.js version: v18.x.x
[INFO] Installing PostgreSQL 15...
[INFO] Starting PostgreSQL service...
[INFO] Installing Nginx...
[INFO] Installation completed successfully!
```

### Step 2: Setup Database
```bash
# Run database setup (as root)
sudo ./02_setup_database.sh
```

**What this script does:**
- Creates production database `skyraksys_hrm_prod`
- Creates application user `hrm_app`
- Executes all database schemas
- Creates indexes for performance
- Sets up triggers and functions
- Inserts sample data
- Creates backup scripts
- Configures environment variables

**Expected output:**
```
==========================================
RHEL 9.6 Database Setup
Skyraksys HRM System
==========================================
[INFO] Creating database and user...
[INFO] Executing 01_create_schema.sql...
[INFO] Database setup completed successfully!
[INFO] Default admin credentials:
Username: admin
Password: password123
```

### Step 3: Deploy Application
```bash
# Run application deployment (as root)
sudo ./03_deploy_application.sh
```

**What this script does:**
- Deploys backend and frontend code
- Installs application dependencies
- Builds frontend for production
- Creates systemd services
- Configures Nginx reverse proxy
- Starts all services
- Creates management scripts

**Deployment Options:**
1. **Deploy from local directory**: Provide path to your source code
2. **Deploy from Git repository**: Provide Git repository URL
3. **Manual deployment**: Copy files manually before running script

**Expected output:**
```
==========================================
RHEL 9.6 Application Deployment
Skyraksys HRM System
==========================================
[INFO] Installing backend dependencies...
[INFO] Building frontend for production...
[INFO] Creating systemd services...
[INFO] ✅ Backend service: RUNNING
[INFO] ✅ Frontend service: RUNNING
[INFO] ✅ Nginx service: RUNNING
[INFO] Deployment completed successfully!
```

## Configuration

### Environment Variables
The main configuration file is located at `/opt/skyraksys-hrm/.env`:

```env
# Application Settings
NODE_ENV=production
PORT=5000
FRONTEND_PORT=3000

# Production URL Configuration (IMPORTANT!)
API_BASE_URL=https://your-domain.com
DOMAIN=your-domain.com
# OR for IP-based setup:
# API_BASE_URL=https://your-server-ip:5000
# DOMAIN=your-server-ip

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=hrm_app
DB_PASSWORD=HRM_SecurePass_2024!

# Security
JWT_SECRET=your_generated_jwt_secret_here
SESSION_SECRET=your_generated_session_secret_here

# File Upload
UPLOAD_PATH=/opt/skyraksys-hrm/uploads
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/skyraksys-hrm/application.log

# Company Information
COMPANY_NAME=Your Company Name
COMPANY_ADDRESS=Your Company Address
COMPANY_EMAIL=info@yourcompany.com
COMPANY_PHONE=+1-234-567-8900
```

### Demo Data Seeding (Temporary for Pre-Production)

The environment variable `SEED_DEMO_DATA` controls whether demo users, departments, projects, tasks, and sample leave balances are inserted at server startup.

| Variable | Recommended During Testing | Recommended For Go-Live |
|----------|----------------------------|--------------------------|
| `SEED_DEMO_DATA` | `true` (populate demo entities) | `false` (prevent pollution of real data) |

Behavior when enabled (`SEED_DEMO_DATA=true`):
1. Creates admin / HR / employee demo accounts with known strong passwords (see deployment logs)
2. Inserts demo departments, positions, leave types, leave balances
3. Seeds demo projects & tasks with deterministic UUIDs

Disable it before production launch to avoid mixing demo with real operational data:
```bash
sed -i 's/^SEED_DEMO_DATA=.*/SEED_DEMO_DATA=false/' /opt/skyraksys-hrm/.env
systemctl restart hrm-backend
```

If you have already run with demo data and wish to purge it prior to go-live, you may:
```bash
# (Optional) Backup first
pg_dump -U postgres -d skyraksys_hrm_prod > /root/hrm_pre_demo_purge.sql

# Remove seeded demo users (adjust if you added real data with these emails)
sudo -u postgres psql -d skyraksys_hrm_prod -c "DELETE FROM employees WHERE email IN ('admin@company.com','hr@company.com','employee@company.com');"
sudo -u postgres psql -d skyraksys_hrm_prod -c "DELETE FROM users WHERE email IN ('admin@company.com','hr@company.com','employee@company.com');"

# Remove demo projects & tasks (UUIDs are deterministic in seeding logic)
sudo -u postgres psql -d skyraksys_hrm_prod -c "DELETE FROM tasks WHERE id IN ('12345678-1234-1234-1234-123456789011','12345678-1234-1234-1234-123456789012','12345678-1234-1234-1234-123456789013','12345678-1234-1234-1234-123456789014','12345678-1234-1234-1234-123456789015','12345678-1234-1234-1234-123456789016','12345678-1234-1234-1234-123456789017','12345678-1234-1234-1234-123456789018');"
sudo -u postgres psql -d skyraksys_hrm_prod -c "DELETE FROM projects WHERE id IN ('12345678-1234-1234-1234-123456789001','12345678-1234-1234-1234-123456789002','12345678-1234-1234-1234-123456789003');"
```

> NOTE: If extensive demo actions were performed (timesheets, leaves, payroll), a full database reset may be faster: drop and recreate the DB using the `02_setup_database.sh` script, then redeploy with `SEED_DEMO_DATA=false`.


### Production URL Configuration

**⚠️ CRITICAL: Update URLs for Production**

The application URLs must be configured properly for production deployment:

#### Option 1: Domain-based Setup (Recommended)
```bash
# Update .env file
API_BASE_URL=https://hrm.yourcompany.com
DOMAIN=hrm.yourcompany.com

# Update Nginx server_name
sudo nano /etc/nginx/conf.d/hrm.conf
# Change: server_name hrm.yourcompany.com;
```

#### Option 2: IP-based Setup
```bash
# Update .env file  
API_BASE_URL=https://192.168.1.100:5000
DOMAIN=192.168.1.100

# Update Nginx server_name
sudo nano /etc/nginx/conf.d/hrm.conf
# Change: server_name 192.168.1.100;
```

#### Production URLs Will Be:
- **API Base**: `https://your-domain.com/api`
- **Documentation**: `https://your-domain.com/api-docs`
- **Health Check**: `https://your-domain.com/api/health`
- **Frontend**: `https://your-domain.com`

**Note**: Without proper URL configuration, the API documentation links and health check responses will show incorrect `localhost` URLs.

### Nginx Configuration
Main Nginx configuration is at `/etc/nginx/conf.d/hrm.conf`. Update the `server_name` directive:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Update this
    # ... rest of configuration
}
```

### Database Configuration
PostgreSQL configuration is automatically optimized, but you can adjust settings in:
- `/var/lib/pgsql/15/data/postgresql.conf`
- `/var/lib/pgsql/15/data/pg_hba.conf`

## Security Setup

### 1. Change Default Passwords
```bash
# Connect to database
sudo -u postgres psql -d skyraksys_hrm_prod

# Change admin password (generate hash first)
UPDATE users SET password = '$2b$10$newHashedPasswordHere' WHERE username = 'admin';

# Exit database
\q
```

### 2. Firewall Configuration
```bash
# Check current firewall rules
sudo firewall-cmd --list-all

# Add custom rules if needed
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.0/24" port protocol="tcp" port="5432" accept'
sudo firewall-cmd --reload
```

### 3. SELinux Configuration
```bash
# Check SELinux status
sestatus

# If SELinux is enforcing, configure contexts
sudo setsebool -P httpd_can_network_connect 1
sudo semanage fcontext -a -t httpd_exec_t "/opt/skyraksys-hrm/backend(/.*)?"
sudo restorecon -Rv /opt/skyraksys-hrm/
```

### 4. SSL Certificate Setup (Optional)
```bash
# Install Certbot for Let's Encrypt
sudo dnf install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Maintenance

### Service Management
```bash
# Check service status
sudo systemctl status hrm-backend hrm-frontend nginx postgresql-15

# Start/Stop/Restart services
sudo systemctl start hrm-backend
sudo systemctl stop hrm-frontend
sudo systemctl restart nginx

# View logs
sudo journalctl -u hrm-backend -f
sudo journalctl -u hrm-frontend -f

# Application logs
tail -f /var/log/skyraksys-hrm/backend.log
tail -f /var/log/skyraksys-hrm/frontend.log
```

### Management Scripts
Located in `/opt/skyraksys-hrm/`:

```bash
# Application management
sudo /opt/skyraksys-hrm/start_application.sh
sudo /opt/skyraksys-hrm/stop_application.sh
sudo /opt/skyraksys-hrm/restart_application.sh
sudo /opt/skyraksys-hrm/check_status.sh

# Database management
sudo -u hrmapp /opt/skyraksys-hrm/backup_database.sh
sudo -u hrmapp /opt/skyraksys-hrm/check_database.sh
```

### Log Rotation
Automatic log rotation is configured via `/etc/logrotate.d/skyraksys-hrm`:
- Daily rotation
- Keep 30 days of logs
- Compress old logs
- Restart services if needed

### System Monitoring
```bash
# Check system resources
htop
iotop
nethogs

# Check disk usage
df -h
du -sh /opt/skyraksys-hrm/*
du -sh /var/log/skyraksys-hrm/*

# Check network connections
netstat -tlnp | grep -E ':(80|3000|5000|5432)'
```

## Troubleshooting

### Common Issues
#### 6. Frontend "ERR_REQUIRE_ESM" When Serving Build
This occurs when using a static server package that is ESM-only with a runtime expecting CommonJS in systemd/PM2 contexts.

Symptoms:
- pm2 or systemd logs show: `Error [ERR_REQUIRE_ESM]: require() of ES Module .../serve/build/main.js not supported`

Recommended fixes (choose one):
1) Use Nginx to serve the built frontend and proxy `/api` to the backend (preferred)
   - This guide already configures Nginx to proxy `location /` to port 3000. You can instead serve build directly from Nginx:
     - Point Nginx root to `$FRONTEND_DIR/build` and remove the Node static server. Example:
       ```nginx
       server {
         listen 80;
         server_name your-domain.com;
         root /opt/skyraksys-hrm/frontend/build;
         index index.html;
         location /api/ { proxy_pass http://backend; }
         location / {
           try_files $uri /index.html;
         }
       }
       ```
   - Benefit: no Node process for static files, fewer moving parts, no ESM concerns.

2) Pin the static server to a CommonJS version
   - Use `serve@14` when starting the static server to avoid ESM require errors:
     - systemd ExecStart: `/usr/bin/npx --yes serve@14 -s build -l 3000`
     - PM2: `pm2 start --name hrm-frontend --interpreter none -- npx serve@14 -s build -l 3000`
   - This repository’s `hrm-frontend.service` and deploy script are updated accordingly.

Note on environment variables:
- Create React App embeds `REACT_APP_*` at build time. Changing environment in systemd after build will NOT change the API URL. Set `REACT_APP_API_URL` before `npm run build`, or use relative `/api` with Nginx proxy.


#### 1. Service Won't Start
```bash
# Check service status
sudo systemctl status hrm-backend

# Check logs
sudo journalctl -u hrm-backend -n 50

# Check configuration
sudo -u hrmapp /usr/bin/node -c /opt/skyraksys-hrm/backend/server.js
```

#### 2. Database Connection Issues
```bash
# Test database connection
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT version();"

# Check database logs
sudo tail -f /var/lib/pgsql/15/data/log/postgresql-*.log

# Restart PostgreSQL
sudo systemctl restart postgresql-15
```

#### 3. Nginx Configuration Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/hrm_error.log

# Restart Nginx
sudo systemctl restart nginx
```

#### 4. Port Already in Use
```bash
# Check what's using the port
sudo netstat -tlnp | grep :5000
sudo lsof -i :5000

# Kill process if needed
sudo kill -9 <PID>
```

#### 5. Permission Issues
```bash
# Fix ownership
sudo chown -R hrmapp:hrmapp /opt/skyraksys-hrm
sudo chown -R hrmapp:hrmapp /var/log/skyraksys-hrm

# Fix permissions
sudo chmod -R 755 /opt/skyraksys-hrm
sudo chmod 600 /opt/skyraksys-hrm/.env
```

### Log Locations
- **Application Logs**: `/var/log/skyraksys-hrm/`
- **Nginx Logs**: `/var/log/nginx/`
- **PostgreSQL Logs**: `/var/lib/pgsql/15/data/log/`
- **System Logs**: `journalctl -u service-name`

## Backup and Recovery

### Database Backup
```bash
# Manual backup
sudo -u hrmapp /opt/skyraksys-hrm/backup_database.sh

# Automated backup (configured via cron)
sudo crontab -u hrmapp -l
```

### Application Backup
```bash
# Create full application backup
sudo tar -czf /opt/backups/hrm-app-$(date +%Y%m%d).tar.gz \
  /opt/skyraksys-hrm \
  /var/log/skyraksys-hrm \
  /etc/nginx/conf.d/hrm.conf \
  /etc/systemd/system/hrm-*.service
```

### Recovery Process
```bash
# Restore database
sudo -u hrmapp /opt/skyraksys-hrm/restore_database.sh /path/to/backup.sql.gz

# Restore application files
sudo tar -xzf /path/to/app-backup.tar.gz -C /

# Restart services
sudo systemctl restart hrm-backend hrm-frontend nginx
```

## Performance Tuning

### PostgreSQL Optimization
Edit `/var/lib/pgsql/15/data/postgresql.conf`:

```conf
# Memory settings (adjust based on available RAM)
shared_buffers = 512MB          # 25% of RAM
effective_cache_size = 2GB      # 75% of RAM
work_mem = 8MB
maintenance_work_mem = 128MB

# Connection settings
max_connections = 100

# Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = 32MB
min_wal_size = 2GB
max_wal_size = 8GB

# Query planner
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Nginx Optimization
Edit `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 1024;
worker_rlimit_nofile 2048;

# Enable Gzip
gzip on;
gzip_comp_level 6;
gzip_min_length 1000;

# Buffer sizes
client_body_buffer_size 128k;
client_max_body_size 10m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;

# Timeouts
client_body_timeout 12;
client_header_timeout 12;
keepalive_timeout 15;
send_timeout 10;
```

### System Optimization
```bash
# Increase file limits
echo "hrmapp soft nofile 65536" >> /etc/security/limits.conf
echo "hrmapp hard nofile 65536" >> /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.somaxconn = 1024" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 1024" >> /etc/sysctl.conf
sysctl -p
```

## Maintenance Schedule

### Daily
- Monitor application logs
- Check service status
- Verify backup completion

### Weekly
- Review security logs
- Update system packages
- Check disk usage
- Review performance metrics

### Monthly
- Database maintenance (VACUUM, ANALYZE)
- Log cleanup
- Security updates
- Performance review

### Quarterly
- Full system backup
- Security audit
- Performance optimization review
- Documentation updates

## Support and Documentation

### URLs and Endpoints
- **Main Application**: `http://your-server-ip/`
- **API Documentation**: `http://your-server-ip/api/docs`
- **Health Check**: `http://your-server-ip/health`
- **Nginx Status**: `http://your-server-ip/nginx_status` (localhost only)

### Default Credentials
- **Username**: `admin`
- **Password**: `password123` (CHANGE IMMEDIATELY)

### Key Files and Directories
- **Application**: `/opt/skyraksys-hrm/`
- **Logs**: `/var/log/skyraksys-hrm/`
- **Configuration**: `/opt/skyraksys-hrm/.env`
- **Database**: PostgreSQL on port 5432
- **Backup Scripts**: `/opt/skyraksys-hrm/*.sh`

### Getting Help
1. Check logs first: `/var/log/skyraksys-hrm/`
2. Use status scripts: `/opt/skyraksys-hrm/check_status.sh`
3. Review this documentation
4. Contact system administrator

---

**Installation Date**: ________________  
**Installed By**: ________________  
**Server IP**: ________________  
**Domain Name**: ________________  

**Remember to:**
- [ ] Change default passwords
- [ ] Configure domain name in Nginx
- [ ] Set up SSL certificates (if needed)
- [ ] Configure email settings
- [ ] Test backup and recovery procedures
- [ ] Set up monitoring alerts