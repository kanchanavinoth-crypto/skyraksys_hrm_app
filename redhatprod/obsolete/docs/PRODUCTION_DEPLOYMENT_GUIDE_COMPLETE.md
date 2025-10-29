# Skyraksys HRM - RHEL 9.6 Production Deployment Guide
**Complete Setup Guide for Production Environment**

*Updated: November 2024*  
*Version: 2.0*  
*Compatible with: Enhanced Payslip System*

---

## 🎯 Table of Contents
1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)  
3. [Pre-Installation Checklist](#pre-installation-checklist)
4. [Installation Process](#installation-process)
5. [Configuration Guide](#configuration-guide)
6. [Security Setup](#security-setup)
7. [System Monitoring](#monitoring-and-maintenance)
8. [Backup Strategy](#backup-and-recovery)
9. [Performance Optimization](#performance-tuning)
10. [Troubleshooting](#troubleshooting)

---

## 📋 Prerequisites

### System Requirements

**Minimum Requirements:**
- **OS:** Red Hat Enterprise Linux 9.6 (or CentOS Stream 9)
- **CPU:** 2 cores (4+ cores recommended)
- **RAM:** 4GB (8GB+ recommended for production)
- **Storage:** 50GB (100GB+ recommended)
- **Network:** Static IP address (recommended)

**Production Recommendations:**
- **CPU:** 4-8 cores for optimal performance
- **RAM:** 16GB for handling concurrent users and payslip generation
- **Storage:** 200GB+ SSD with separate backup storage
- **Network:** Dedicated server with 1Gbps connection

### Network Configuration

**Required Ports:**
```bash
80/tcp     # HTTP (main application access)
443/tcp    # HTTPS (SSL - future upgrade)
22/tcp     # SSH (remote administration) 
5432/tcp   # PostgreSQL (localhost only)
6379/tcp   # Redis (localhost only)
```

**Optional Development Ports:**
```bash
3000/tcp   # Frontend development server
5000/tcp   # Backend API server (direct access)
```

### User Requirements
- **Root access** or sudo privileges
- **Domain name** (optional but recommended)
- **SSL certificates** (recommended for production)

---

## 🔍 Pre-Installation Checklist

### 1. System Validation
```bash
# Check system information
hostnamectl

# Update system packages
sudo dnf update -y && sudo dnf upgrade -y

# Verify available resources
df -h              # Disk space
free -h            # Memory
lscpu              # CPU info
netstat -tuln      # Network ports

# Test internet connectivity
ping -c 4 google.com
curl -I https://rpm.nodesource.com
```

### 2. Security Preparation
```bash
# Check SELinux status
sestatus

# Verify firewall
systemctl status firewalld

# Check existing services
systemctl list-units --type=service --state=active
```

### 3. Download Source Code
```bash
# Create deployment directory
mkdir -p /tmp/hrm-deployment
cd /tmp/hrm-deployment

# Option A: Clone from Git
git clone https://github.com/your-org/skyraksys-hrm.git
cd skyraksys-hrm

# Option B: Extract from archive
tar -xzf skyraksys-hrm-production.tar.gz
cd skyraksys-hrm

# Verify deployment scripts
ls -la redhatprod/scripts/
```

---

## 🚀 Installation Process

### Step 1: Prerequisites Installation
```bash
# Navigate to scripts directory
cd redhatprod/scripts

# Make scripts executable
chmod +x *.sh

# Run prerequisites installation (requires root)
sudo ./01_install_prerequisites.sh
```

**What this installs:**
- ✅ Node.js 18.x LTS with NPM
- ✅ PostgreSQL 15 with extensions
- ✅ Nginx web server
- ✅ Redis for caching and sessions
- ✅ PM2 process manager
- ✅ Development tools and utilities
- ✅ Security tools (fail2ban, firewall)
- ✅ System monitoring tools

### Step 2: Database Setup
```bash
# Run database setup (requires root)
sudo ./02_setup_database.sh
```

**Database Configuration:**
- ✅ Creates `skyraksys_hrm_prod` database
- ✅ Creates `hrm_app` database user with secure password
- ✅ Installs complete schema with UUID support
- ✅ Creates payslip tables with enhanced features
- ✅ Sets up indexes and triggers
- ✅ Inserts sample data and default templates
- ✅ Configures backup and restore scripts
- ✅ Sets up daily automated backups

### Step 3: Application Deployment
```bash
# Run application deployment (requires root)
sudo ./03_deploy_application.sh
```

**Deployment Options:**
1. **Local Source Code:** Deploy from existing directory
2. **Git Repository:** Clone and deploy from Git
3. **Manual Deployment:** Copy files manually

**What gets deployed:**
- ✅ Backend Node.js API server
- ✅ Frontend React application
- ✅ Systemd service configurations
- ✅ Nginx reverse proxy setup
- ✅ PM2 process management
- ✅ Log rotation and monitoring
- ✅ Security headers and rate limiting

---

## ⚙️ Configuration Guide

### Environment Configuration

**Primary Configuration File:** `/opt/skyraksys-hrm/.env`

**Key Settings to Update:**
```bash
# Domain Configuration
API_BASE_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com

# Database Security
DB_PASSWORD=your_secure_database_password_here

# JWT Security
JWT_SECRET=your_extremely_strong_jwt_secret_minimum_64_characters

# Company Information
COMPANY_NAME=Your Company Name
COMPANY_ADDRESS=Your Complete Address
COMPANY_EMAIL=hr@yourcompany.com
COMPANY_PHONE=+91-XXXXXXXXXX
COMPANY_GST=Your_GST_Number
```

### Database Configuration

**PostgreSQL Settings:** `/var/lib/pgsql/15/data/postgresql.conf`
```bash
# Memory settings (adjust based on RAM)
shared_buffers = 256MB          # 25% of RAM
effective_cache_size = 1GB      # 75% of RAM
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 100
idle_in_transaction_session_timeout = 300000
```

### Nginx Configuration

**Main Config:** `/etc/nginx/conf.d/hrm.conf`

**SSL Setup (Recommended):**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/skyraksys-hrm/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/skyraksys-hrm/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    
    # Rest of configuration...
}
```

---

## 🔐 Security Setup

### 1. Firewall Configuration
```bash
# Configure firewalld rules
sudo firewall-cmd --permanent --zone=public --add-service=http
sudo firewall-cmd --permanent --zone=public --add-service=https
sudo firewall-cmd --permanent --zone=public --add-service=ssh

# Remove unnecessary services
sudo firewall-cmd --permanent --zone=public --remove-service=dhcpv6-client

# Apply changes
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

### 2. SSL Certificate Setup
```bash
# Option A: Let's Encrypt (Free)
sudo dnf install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# Option B: Self-signed (Development)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/skyraksys-hrm/privkey.pem \
    -out /etc/ssl/certs/skyraksys-hrm/fullchain.pem
```

### 3. Fail2ban Configuration
```bash
# Check fail2ban status
sudo systemctl status fail2ban

# View active jails
sudo fail2ban-client status

# Monitor login attempts
sudo fail2ban-client status sshd
```

### 4. Database Security
```bash
# Update PostgreSQL password
sudo -u postgres psql -c "ALTER USER hrm_app PASSWORD 'your_new_secure_password';"

# Update application environment
sudo nano /opt/skyraksys-hrm/.env
# Change DB_PASSWORD to match new password

# Restart services
sudo systemctl restart hrm-backend
```

---

## 📊 System Monitoring

### Service Status Monitoring
```bash
# Check all HRM services
sudo systemctl status postgresql-15
sudo systemctl status redis
sudo systemctl status nginx
sudo systemctl status hrm-backend
sudo systemctl status hrm-frontend

# Check process status
sudo pm2 status
sudo pm2 logs
```

### Database Health Check
```bash
# Run database status check
sudo -u hrmapp /opt/skyraksys-hrm/check_database.sh

# Check database size and performance
sudo -u postgres psql -d skyraksys_hrm_prod -c "
    SELECT 
        schemaname,
        tablename,
        n_live_tup as rows,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_stat_user_tables 
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Log Monitoring
```bash
# Application logs
sudo tail -f /var/log/skyraksys-hrm/application.log
sudo tail -f /var/log/skyraksys-hrm/error.log

# System logs
sudo journalctl -u hrm-backend -f
sudo journalctl -u hrm-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Performance Monitoring
```bash
# System resource usage
htop
iotop
nethogs

# Database performance
sudo -u postgres psql -d skyraksys_hrm_prod -c "
    SELECT query, calls, total_time, mean_time 
    FROM pg_stat_statements 
    ORDER BY total_time DESC 
    LIMIT 10;
"
```

---

## 💾 Backup and Recovery

### Automated Backup System

**Daily Backup (Automated):**
```bash
# Backup script location
/opt/skyraksys-hrm/backup_database.sh

# Cron schedule (daily at 2 AM)
0 2 * * * /opt/skyraksys-hrm/backup_database.sh

# Manual backup
sudo -u hrmapp /opt/skyraksys-hrm/backup_database.sh
```

**Backup Locations:**
- Database backups: `/opt/skyraksys-hrm/backups/`
- Application files: `/opt/skyraksys-hrm/`
- Configuration files: `/etc/nginx/conf.d/`, `/opt/skyraksys-hrm/.env`

### Recovery Procedures

**Database Recovery:**
```bash
# List available backups
ls -la /opt/skyraksys-hrm/backups/

# Restore from backup
sudo /opt/skyraksys-hrm/restore_database.sh /path/to/backup.sql.gz

# Verify restoration
sudo -u hrmapp /opt/skyraksys-hrm/check_database.sh
```

**Application Recovery:**
```bash
# Stop services
sudo systemctl stop hrm-backend hrm-frontend

# Restore application files
sudo cp -r /backup/location/skyraksys-hrm/* /opt/skyraksys-hrm/

# Restore ownership
sudo chown -R hrmapp:hrmapp /opt/skyraksys-hrm

# Restart services  
sudo systemctl start hrm-backend hrm-frontend
```

---

## ⚡ Performance Optimization

### Database Optimization
```bash
# Update PostgreSQL configuration
sudo nano /var/lib/pgsql/15/data/postgresql.conf

# Key settings for production:
shared_buffers = 512MB          # 25% of total RAM
effective_cache_size = 2GB      # 75% of total RAM  
work_mem = 8MB                  # For complex queries
maintenance_work_mem = 128MB    # For maintenance operations
checkpoint_completion_target = 0.9
wal_buffers = 16MB
max_wal_size = 4GB

# Restart PostgreSQL
sudo systemctl restart postgresql-15
```

### Application Optimization
```bash
# PM2 cluster mode for backend
sudo -u hrmapp pm2 start /opt/skyraksys-hrm/backend/server.js -i max --name "hrm-backend"

# Enable PM2 monitoring
sudo -u hrmapp pm2 install pm2-server-monit
```

### Nginx Optimization
```bash
# Update nginx.conf
sudo nano /etc/nginx/nginx.conf

# Key settings:
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
client_max_body_size 10M;

# Enable gzip compression
gzip on;
gzip_types text/css application/javascript application/json;
```

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Service Won't Start
```bash
# Check service status
sudo systemctl status hrm-backend

# Check logs
sudo journalctl -u hrm-backend -n 50

# Common fixes:
sudo systemctl daemon-reload
sudo systemctl reset-failed hrm-backend
sudo systemctl start hrm-backend
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql-15

# Test database connection
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT version();"

# Check connection settings
sudo nano /opt/skyraksys-hrm/.env
```

#### 3. Permission Issues
```bash
# Fix file ownership
sudo chown -R hrmapp:hrmapp /opt/skyraksys-hrm
sudo chmod -R 755 /opt/skyraksys-hrm
sudo chmod 600 /opt/skyraksys-hrm/.env

# Fix log permissions
sudo chown -R hrmapp:hrmapp /var/log/skyraksys-hrm
sudo chmod 644 /var/log/skyraksys-hrm/*.log
```

#### 4. Payslip Generation Issues
```bash
# Check PDF directory permissions
sudo mkdir -p /opt/skyraksys-hrm/uploads/payslips
sudo chown -R hrmapp:hrmapp /opt/skyraksys-hrm/uploads
sudo chmod -R 755 /opt/skyraksys-hrm/uploads

# Test payslip generation
curl -X POST http://localhost:5000/api/payslips/test-generate
```

#### 5. High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Restart services to clear memory
sudo systemctl restart hrm-backend
sudo systemctl restart postgresql-15
```

### Log Analysis
```bash
# Application error patterns
sudo grep -i "error" /var/log/skyraksys-hrm/error.log | tail -20

# Database slow queries
sudo -u postgres psql -d skyraksys_hrm_prod -c "
    SELECT query, calls, total_time, mean_time 
    FROM pg_stat_statements 
    WHERE mean_time > 1000 
    ORDER BY mean_time DESC;
"

# Nginx error analysis  
sudo grep "error" /var/log/nginx/error.log | tail -10
```

---

## 📞 Support and Maintenance

### Regular Maintenance Tasks

**Daily:**
- ✅ Check system health and service status
- ✅ Review application logs for errors
- ✅ Verify automated backups completed

**Weekly:**
- ✅ Update system packages: `sudo dnf update`
- ✅ Check disk space usage
- ✅ Review security logs and fail2ban status
- ✅ Test backup restore procedure

**Monthly:**
- ✅ PostgreSQL maintenance: `VACUUM ANALYZE`
- ✅ Log rotation and cleanup
- ✅ Security audit and password updates
- ✅ Performance analysis and optimization

### Production Checklist

**Before Go-Live:**
- [ ] SSL certificates installed and configured
- [ ] Domain name configured correctly
- [ ] Database passwords changed from defaults
- [ ] JWT secrets updated with strong values
- [ ] Company information configured in .env
- [ ] Email settings configured for notifications
- [ ] Backup system tested and verified
- [ ] All default passwords changed
- [ ] Firewall rules configured properly
- [ ] Monitoring and alerting set up

**Post-Deployment:**
- [ ] Create admin user account
- [ ] Configure payslip templates
- [ ] Import employee data
- [ ] Set up department and position structures
- [ ] Test payslip generation workflow
- [ ] Verify email notifications
- [ ] Train HR staff on system usage
- [ ] Document custom configurations

---

## 📧 Contact Information

**Technical Support:**
- **Email:** support@skyraksys.com
- **Website:** https://www.skyraksys.com
- **Phone:** +91 89398 88577

**Documentation:**
- **API Documentation:** `http://your-domain.com/api/docs`
- **User Manual:** Available in application help section
- **Developer Guide:** Contact support for access

---

*This deployment guide is continuously updated. Please check for the latest version before deployment.*

**Last Updated:** November 2024  
**Guide Version:** 2.0  
**System Compatibility:** RHEL 9.6, Enhanced Payslip System*