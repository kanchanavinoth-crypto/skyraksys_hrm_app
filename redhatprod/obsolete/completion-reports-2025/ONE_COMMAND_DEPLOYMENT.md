# One-Command Deployment - Complete Guide

## Overview

The `deploy.sh` master deployment script provides a fully automated, zero-configuration deployment process for the Skyraksys HRM system on RHEL 9.6.

**Key Features:**
- ✅ **Zero Manual Configuration**: All configs generated automatically
- ✅ **Single Command**: One command deploys everything
- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Comprehensive Health Checks**: Verifies all components
- ✅ **Detailed Logging**: Complete deployment audit trail
- ✅ **Beautiful Output**: Color-coded progress indicators
- ✅ **Rollback Ready**: Structured steps for troubleshooting

---

## Quick Start

### Minimal Command

```bash
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash deploy.sh YOUR_SERVER_IP
```

**Examples:**

```bash
# Using IP address
sudo bash deploy.sh 95.216.14.232

# Using domain name
sudo bash deploy.sh hrm.company.com

# Auto-detect public IP (interactive)
sudo bash deploy.sh
```

---

## What It Does

### Automated Steps

The script executes 7 major steps automatically:

#### **Step 1: Generate Configuration Files**
- Creates backend `.env` with 100+ variables
- Generates secure JWT secrets (64 characters)
- Generates secure session secrets (48 characters)
- Creates Nginx configuration with your IP/domain
- Retrieves database password from `.db_password` file
- Sets proper file permissions (600 for sensitive files)
- Creates deployment summary report

**Files Generated:**
- `/opt/skyraksys-hrm/backend/.env`
- `/opt/skyraksys-hrm/redhatprod/configs/nginx-hrm-YOUR_IP.conf`
- `/opt/skyraksys-hrm/DEPLOYMENT_CONFIG_SUMMARY.txt`

#### **Step 2: Install Prerequisites**
- Node.js 22.16.0 (via NodeSource)
- PostgreSQL 17.x (official repository)
- Nginx (latest stable)
- System dependencies (git, curl, build tools)
- Creates `hrmapp` system user and group

**Package Sources:**
- Node.js: https://rpm.nodesource.com/setup_22.x
- PostgreSQL: https://download.postgresql.org/pub/repos/yum/

#### **Step 3: Setup Database**
- Creates PostgreSQL database: `skyraksys_hrm_prod`
- Creates database user: `hrm_user`
- Sets password from `.db_password` file
- Runs Sequelize migrations (11 migration files)
- Configures database for optimal performance

**Database Objects Created:**
```sql
-- Tables (via Sequelize migrations)
Users, Departments, Employees, EmployeeLeaves, 
Timesheets, TimesheetEntries, PayrollBatches, 
Payslips, AuditLogs, etc.

-- Indexes, constraints, and relationships
-- all handled by Sequelize
```

#### **Step 4: Deploy Application**
- Installs backend dependencies (`npm ci` in backend/)
- Installs frontend dependencies (`npm ci` in frontend/)
- Builds frontend for production (`npm run build`)
- Sets ownership to `hrmapp` user
- Configures application directories

**Directories:**
- `/opt/skyraksys-hrm/backend/` (Express.js API)
- `/opt/skyraksys-hrm/frontend/build/` (React build)
- `/opt/skyraksys-hrm/uploads/` (file storage)
- `/opt/skyraksys-hrm/logs/` (application logs)

#### **Step 5: Configure System Services**
- Installs systemd service files
- Configures backend service (hrm-backend)
- Configures frontend service (hrm-frontend)
- Installs Nginx configuration
- Enables services for auto-start
- Starts all services

**Services Created:**
- `hrm-backend.service` (Node.js backend on port 5000)
- `hrm-frontend.service` (React frontend on port 3000)
- Nginx reverse proxy (port 80/443)

#### **Step 6: Configure Firewall**
- Opens HTTP (port 80)
- Opens HTTPS (port 443)
- Reloads firewall rules

**Firewall Commands:**
```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

#### **Step 7: Health Checks**
- Backend health: `GET http://localhost:5000/api/health`
- Frontend health: `GET http://localhost:3000`
- Database connectivity: `psql` connection test
- Service status checks
- Maximum 12 attempts with 5-second intervals

---

## Usage Patterns

### Standard Deployment

```bash
# Clone repository
cd /opt
git clone https://github.com/your-org/skyraksys-hrm.git
cd skyraksys-hrm/redhatprod/scripts

# Deploy
sudo bash deploy.sh 95.216.14.232

# Follow on-screen prompts
# Confirm deployment when prompted
# Wait ~10-15 minutes
# View deployment summary
```

### Automated Deployment (CI/CD)

```bash
# Non-interactive deployment
sudo bash deploy.sh "$SERVER_IP" <<EOF
y
EOF

# Or with environment variable
export DEPLOY_SERVER_IP="95.216.14.232"
sudo bash deploy.sh "$DEPLOY_SERVER_IP"
```

### Re-deployment (Updates)

```bash
# Pull latest code
cd /opt/skyraksys-hrm
git pull origin main

# Re-run deployment (idempotent)
cd redhatprod/scripts
sudo bash deploy.sh 95.216.14.232

# Existing configs will be preserved if valid
# Services will be restarted
```

---

## Output and Logging

### Console Output

The script provides beautiful, color-coded output:

```
========================================
SKYRAKSYS HRM - AUTOMATED DEPLOYMENT
========================================

[INFO] Operating System: Red Hat Enterprise Linux 9.6
[INFO] Server Address: 95.216.14.232
[INFO] Application Path: /opt/skyraksys-hrm

Continue with deployment? (y/N): y

========================================
STARTING DEPLOYMENT
========================================

[STEP 1/7] Generating Configuration Files
[SUCCESS] ✓ All configuration files generated automatically

[STEP 2/7] Installing Prerequisites
[INFO] Installing Node.js, PostgreSQL, Nginx...
[SUCCESS] ✓ Prerequisites installed successfully

...
```

### Log File

Complete deployment log saved to: `/var/log/skyraksys-hrm/deployment.log`

```bash
# View deployment log
sudo cat /var/log/skyraksys-hrm/deployment.log

# View in real-time (during deployment)
sudo tail -f /var/log/skyraksys-hrm/deployment.log
```

### Deployment Summary

After successful deployment, a summary is displayed:

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║          🎉 Skyraksys HRM Deployed Successfully! 🎉            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

Deployment Information:
  • Server: 95.216.14.232
  • Frontend: http://95.216.14.232
  • Backend API: http://95.216.14.232/api
  • Health Check: http://95.216.14.232/api/health

Service Status:
  • Backend: active
  • Frontend: active
  • Nginx: active
  • PostgreSQL: active

Configuration Files:
  • Environment: /opt/skyraksys-hrm/backend/.env
  • Nginx Config: /etc/nginx/conf.d/hrm.conf
  • DB Password: /opt/skyraksys-hrm/.db_password

Default Login:
  • Username: admin@skyraksys.com
  • Password: Admin@123

Next Steps:
  1. Access your application: http://95.216.14.232
  2. Login with default admin credentials
  3. Setup SSL certificate: sudo bash 06_setup_ssl.sh
```

---

## Prerequisites

### Server Requirements

- **Operating System**: RHEL 9.6 (or compatible)
- **RAM**: Minimum 4GB (8GB recommended)
- **CPU**: Minimum 2 cores (4 cores recommended)
- **Disk**: Minimum 20GB free space
- **Network**: Internet connectivity required

### Access Requirements

- Root or sudo access
- SSH access to server
- Ports 80 and 443 available
- SELinux in enforcing mode (script handles this)

### Required Files

The script expects these files to exist:

```
/opt/skyraksys-hrm/
├── .db_password                     (database password file)
├── backend/                         (Node.js backend code)
├── frontend/                        (React frontend code)
└── redhatprod/
    ├── scripts/
    │   ├── 00_generate_configs.sh   (config generator)
    │   ├── 01_install_prerequisites.sh
    │   ├── 02_setup_database.sh
    │   └── 03_deploy_application.sh
    ├── templates/
    │   └── .env.production.template
    └── systemd/
        ├── hrm-backend.service
        └── hrm-frontend.service
```

---

## Error Handling

### Automatic Error Detection

The script uses `set -e` to exit on any error. Each step is validated before proceeding.

### Common Errors and Solutions

#### Error: "Database connection failed"

**Cause**: PostgreSQL not running or credentials incorrect

**Solution**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql-17

# Verify password file
cat /opt/skyraksys-hrm/.db_password

# Check database
sudo -u postgres psql -l
```

#### Error: "Backend health check failed"

**Cause**: Backend service not starting

**Solution**:
```bash
# Check backend logs
sudo journalctl -u hrm-backend -n 50

# Check .env file
sudo cat /opt/skyraksys-hrm/backend/.env

# Manually restart
sudo systemctl restart hrm-backend
```

#### Error: "Configuration generator not found"

**Cause**: Script run from wrong directory

**Solution**:
```bash
# Must be in scripts directory
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash deploy.sh YOUR_IP
```

---

## Advanced Usage

### Custom Configuration

To customize the deployment:

1. **Generate configs first** (to get template):
```bash
sudo bash 00_generate_configs.sh YOUR_IP
```

2. **Edit generated files**:
```bash
sudo nano /opt/skyraksys-hrm/backend/.env
```

3. **Skip config generation in main script**:
```bash
# Comment out step_1_generate_configs in deploy.sh
# Or manually run steps 2-7
```

### Partial Deployment

Run individual steps:

```bash
# Just install prerequisites
sudo bash 01_install_prerequisites.sh

# Just setup database
sudo bash 02_setup_database.sh

# Just deploy application
sudo bash 03_deploy_application.sh
```

### Debug Mode

Enable verbose output:

```bash
# Add to beginning of deploy.sh
set -x  # Print all commands

# Or run with bash debug
bash -x deploy.sh YOUR_IP
```

---

## Post-Deployment

### Essential Tasks

1. **Change default admin password**:
```bash
# Login to application
# Navigate to Settings > Change Password
```

2. **Setup SSL certificate**:
```bash
sudo bash 06_setup_ssl.sh hrm.company.com
```

3. **Configure email SMTP**:
```bash
sudo nano /opt/skyraksys-hrm/backend/.env
# Update SMTP_* variables
sudo systemctl restart hrm-backend
```

4. **Review security settings**:
```bash
sudo firewall-cmd --list-all
sudo sestatus
```

### Maintenance Commands

```bash
# View backend logs
sudo journalctl -u hrm-backend -f

# View frontend logs
sudo journalctl -u hrm-frontend -f

# Restart services
sudo systemctl restart hrm-backend hrm-frontend

# Check service status
sudo systemctl status hrm-backend hrm-frontend nginx

# Database backup
sudo -u postgres pg_dump skyraksys_hrm_prod > backup.sql

# Check disk space
df -h /opt/skyraksys-hrm
```

---

## Comparison: Before vs After

### Before (Manual Process)

```bash
# 1. Edit .env file manually (30+ variables)
vim backend/.env
# - Copy paste template
# - Generate JWT secret manually
# - Generate session secret manually
# - Configure database password
# - Set CORS origins
# - Set API URL
# ... 20 minutes of editing

# 2. Edit nginx config manually
vim nginx-hrm.conf
# - Replace SERVER_IP_HERE with actual IP
# - Update upstream ports
# - Configure server_name
# ... 5 minutes

# 3. Install prerequisites
sudo bash 01_install_prerequisites.sh

# 4. Setup database
sudo bash 02_setup_database.sh

# 5. Deploy application
sudo bash 03_deploy_application.sh

# 6. Start services manually
sudo systemctl start hrm-backend
sudo systemctl start hrm-frontend
sudo systemctl restart nginx

# 7. Test manually
curl http://YOUR_IP/api/health

# Total time: ~45-60 minutes
# Error risk: HIGH (typos, missing values)
```

### After (Automated Process)

```bash
# Single command!
sudo bash deploy.sh 95.216.14.232

# Total time: ~10-15 minutes
# Error risk: ZERO (fully automated)
# Manual configuration: NONE
```

---

## Troubleshooting

### Deployment Fails at Step 1

Check if config generator exists:
```bash
ls -l /opt/skyraksys-hrm/redhatprod/scripts/00_generate_configs.sh
```

### Deployment Fails at Step 2

Check internet connectivity:
```bash
ping -c 3 rpm.nodesource.com
ping -c 3 download.postgresql.org
```

### Deployment Fails at Step 3

Check PostgreSQL installation:
```bash
sudo systemctl status postgresql-17
sudo -u postgres psql -c "SELECT version();"
```

### Deployment Fails at Step 4

Check npm and node versions:
```bash
node --version  # Should be v22.16.0
npm --version   # Should be 10.x
```

### Deployment Fails at Step 5

Check systemd service files:
```bash
ls -l /opt/skyraksys-hrm/redhatprod/systemd/
sudo systemctl daemon-reload
```

### Health Checks Fail

```bash
# Check all services
sudo systemctl status hrm-backend hrm-frontend nginx

# Check ports
sudo netstat -tlnp | grep -E '(3000|5000|80)'

# Check logs
sudo journalctl -u hrm-backend --since "5 minutes ago"

# Check SELinux
sudo ausearch -m AVC -ts recent
```

---

## Security Considerations

### What's Secured Automatically

- ✅ JWT secrets: 64 characters, cryptographically random
- ✅ Session secrets: 48 characters, cryptographically random
- ✅ Database password: From secure `.db_password` file
- ✅ File permissions: 600 for sensitive files
- ✅ Service isolation: Dedicated `hrmapp` user
- ✅ Firewall: Only HTTP/HTTPS exposed
- ✅ Nginx: Security headers (HSTS, X-Frame-Options, etc.)

### Additional Security Steps

1. **Enable HTTPS**:
```bash
sudo bash 06_setup_ssl.sh hrm.company.com
```

2. **Rotate secrets regularly**:
```bash
# Every 90 days
sudo bash 00_generate_configs.sh YOUR_IP
sudo systemctl restart hrm-backend
```

3. **Disable demo data**:
```bash
sudo nano /opt/skyraksys-hrm/backend/.env
# Set: SEED_DEMO_DATA=false
```

4. **Enable rate limiting**:
```bash
sudo nano /opt/skyraksys-hrm/backend/.env
# Set: RATE_LIMIT_ENABLED=true
```

---

## Contributing

To improve the deployment script:

1. Test changes in development environment
2. Update documentation
3. Maintain idempotency
4. Add error handling
5. Update health checks

---

## Support

For issues or questions:

1. Check deployment log: `/var/log/skyraksys-hrm/deployment.log`
2. Check service logs: `journalctl -u hrm-backend -n 100`
3. Review configuration: `/opt/skyraksys-hrm/DEPLOYMENT_CONFIG_SUMMARY.txt`
4. Contact support: support@skyraksys.com

---

## Version History

- **v1.0**: Initial one-command deployment script
  - Integrated config generation
  - 7-step automated process
  - Comprehensive health checks
  - Beautiful output and logging
