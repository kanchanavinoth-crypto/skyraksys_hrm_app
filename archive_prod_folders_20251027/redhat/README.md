# 🏢 SkyrakSys HRM - Red Hat Linux Deployment Package

## 📋 **What This Is**

This is a complete, production-ready deployment package for **SkyrakSys HRM** on **Red Hat Enterprise Linux**. Everything you need to install and run the application is included.

---

## 🚀 **Quick Start (For Experienced Users)**

```bash
# Download and extract to your server
# Navigate to this directory, then run:
sudo ./scripts/install-complete.sh

# Verify installation:
./scripts/final-verification.sh

# Access your application:
http://your-server-ip
```

**Default Login:** admin@skyraksys.com / admin123

---

## 📖 **Documentation Guide**

### 👶 **New to Linux?** 
**Start here:** `BEGINNER_GUIDE.md`
- Step-by-step instructions with explanations
- What each command does and why
- Common problems and solutions

### 💼 **System Administrator?**
**Start here:** `INSTALLATION_GUIDE.md`
- Technical installation procedures
- Configuration options
- Security considerations

### 🔧 **Having Problems?**
**Check here:** `TROUBLESHOOTING.md`
- Common issues and solutions
- Diagnostic commands
- Emergency recovery procedures

---

## 📁 **Package Contents**

```
redhat/
├── 📄 README.md                 ← You are here
├── 📖 BEGINNER_GUIDE.md         ← Start here if new to Linux
├── 📖 INSTALLATION_GUIDE.md     ← Technical installation guide
├── 🔧 TROUBLESHOOTING.md        ← Problem solving guide
├── 🗂️  scripts/                 ← Automated installation scripts
│   ├── install-complete.sh      ← Main installer (automated)
│   ├── manual-install.sh        ← Manual installation steps
│   ├── maintenance.sh           ← System maintenance tools
│   ├── backup.sh                ← Backup and restore tools
│   ├── verify-deployment.sh     ← Basic deployment test
│   └── final-verification.sh    ← Comprehensive testing
├── ⚙️  config/                  ← Configuration files
│   ├── nginx/                   ← Web server configuration
│   ├── systemd/                 ← System service files
│   ├── .env.production.template ← Environment configuration
│   └── ecosystem.config.js      ← Process manager configuration
└── 📦 packages/                 ← Required software packages
    └── rpm-packages.txt         ← List of system packages
```

---

## 🎯 **Choose Your Installation Method**

### **Option 1: Automated Installation (Recommended)**
Best for: Most users, production deployments
```bash
sudo ./scripts/install-complete.sh
```
- Fully automated
- Includes all dependencies
- Production-ready configuration
- Takes 10-15 minutes

### **Option 2: Manual Installation**
Best for: Custom configurations, learning
```bash
./scripts/manual-install.sh
```
- Step-by-step process
- Full control over each step
- Good for understanding the system
- Takes 30-45 minutes

### **Option 3: Guided Installation (Beginners)**
Best for: First-time Linux users
1. Read `BEGINNER_GUIDE.md` first
2. Run automated installer with guidance
3. Use troubleshooting guide if needed

---

## ✅ **System Requirements**

| Component | Requirement | Recommended |
|-----------|-------------|-------------|
| **OS** | RHEL 8+ / CentOS 8+ / Rocky Linux 8+ | RHEL 9 |
| **RAM** | 2 GB minimum | 4 GB |
| **Disk** | 10 GB free space | 20 GB |
| **CPU** | 1 core | 2+ cores |
| **Network** | Internet access for setup | Stable connection |

---

## 🔧 **What Gets Installed**

### **System Components:**
- ✅ PostgreSQL 15 (Database)
- ✅ Node.js 18+ (Runtime)
- ✅ PM2 (Process Manager)
- ✅ Nginx (Web Server)
- ✅ Git (Version Control)

### **Application Components:**
- ✅ SkyrakSys HRM Backend (API Server)
- ✅ SkyrakSys HRM Frontend (Web Interface)
- ✅ Database Schema and Seed Data
- ✅ SSL Configuration (Let's Encrypt ready)

### **Security & Operations:**
- ✅ Firewall Configuration
- ✅ System User (hrm)
- ✅ Log Rotation
- ✅ Automatic Startup Services
- ✅ Backup Scripts

---

## 🚦 **After Installation**

### **Verify Everything Works:**
```bash
./scripts/final-verification.sh
```

### **Access Your Application:**
- **Web Interface:** http://your-server-ip
- **Default Login:** admin@skyraksys.com / admin123
- **API Health:** http://your-server-ip/api/health

### **Important First Steps:**
1. Change default admin password
2. Create additional user accounts
3. Configure backup schedule
4. Set up monitoring

---

## 🆘 **Getting Help**

### **Quick Diagnostics:**
```bash
# Check all services:
sudo systemctl status postgresql-15 nginx skyraksys-hrm

# Check application:
sudo -u hrm pm2 status

# View recent logs:
sudo journalctl -xe --since "10 minutes ago"
```

### **Common Issues:**
- **502 Bad Gateway:** Backend not running → `sudo systemctl start skyraksys-hrm`
- **Cannot connect:** Firewall issue → `sudo firewall-cmd --add-service=http --permanent`
- **Database errors:** PostgreSQL not running → `sudo systemctl start postgresql-15`

### **Full Troubleshooting:**
See `TROUBLESHOOTING.md` for detailed problem-solving guide.

---

## � **Maintenance Operations**

### **Daily Operations:**
```bash
# Check system health:
./scripts/final-verification.sh

# View application logs:
sudo -u hrm pm2 logs

# Restart application:
sudo systemctl restart skyraksys-hrm
```

### **Weekly Operations:**
```bash
# Create backup:
./scripts/backup.sh

# Update system packages:
sudo dnf update

# Clear old logs:
sudo journalctl --vacuum-time=7d
```

### **Using Maintenance Script:**
```bash
# Interactive maintenance menu:
./scripts/maintenance.sh

# Specific operations:
./scripts/maintenance.sh backup
./scripts/maintenance.sh update
./scripts/maintenance.sh monitor
```

---

## 🔒 **Security Notes**

### **Default Security Measures:**
- Application runs as non-root user (hrm)
- Database access restricted to localhost
- Firewall configured for HTTP/HTTPS only
- SELinux compatible configuration

### **Additional Security (Recommended):**
1. Set up SSL certificates: `sudo certbot --nginx`
2. Configure fail2ban: `sudo dnf install fail2ban`
3. Regular security updates: `sudo dnf update`
4. Monitor logs regularly

---

## 📞 **Support Information**

### **Documentation Hierarchy:**
1. **Quick Fix:** Check `TROUBLESHOOTING.md`
2. **Understanding:** Read `BEGINNER_GUIDE.md`
3. **Deep Dive:** Study `INSTALLATION_GUIDE.md`

### **Log Locations:**
- **Application:** `sudo -u hrm pm2 logs`
- **Web Server:** `/var/log/nginx/`
- **Database:** `/var/lib/pgsql/15/data/log/`
- **System:** `sudo journalctl -u skyraksys-hrm`

### **Generating Support Reports:**
```bash
# Create comprehensive system report:
./scripts/final-verification.sh > support-report.txt

# Include in support request along with:
# - What you were trying to do
# - What error you encountered
# - When the problem started
```

---

## 🎉 **Success!**

If you've successfully deployed SkyrakSys HRM, you now have:

✅ A production-ready HR management system  
✅ Automated backups and maintenance  
✅ Professional web server configuration  
✅ Secure database setup  
✅ Monitoring and logging  
✅ Easy upgrade procedures  

**Welcome to SkyrakSys HRM on Red Hat Linux!**

---

*For the latest updates and documentation, visit the project repository.*

#### Update System
```bash
# Update system packages
sudo dnf update -y

# Install EPEL repository
sudo dnf install -y epel-release

# Install essential packages
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y wget curl git unzip nano vim
```

#### Configure Firewall
```bash
# Start and enable firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Open required ports
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### Configure SELinux (Optional - for enhanced security)
```bash
# Check SELinux status
sestatus

# Configure SELinux for web applications
sudo setsebool -P httpd_can_network_connect 1
sudo setsebool -P httpd_can_network_relay 1
```

### Step 2: Install Node.js

#### Install Node.js 18.x LTS
```bash
# Install Node.js repository
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# Install Node.js and npm
sudo dnf install -y nodejs

# Verify installation
node --version
npm --version

# Install global packages
sudo npm install -g pm2 serve
```

### Step 3: Install PostgreSQL

#### Install PostgreSQL 15
```bash
# Install PostgreSQL repository
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Install PostgreSQL 15
sudo dnf install -y postgresql15-server postgresql15

# Initialize database
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb

# Start and enable PostgreSQL
sudo systemctl start postgresql-15
sudo systemctl enable postgresql-15

# Configure PostgreSQL
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'PostgresAdmin2024';"
```

#### Configure PostgreSQL
```bash
# Edit PostgreSQL configuration
sudo nano /var/lib/pgsql/15/data/postgresql.conf

# Update these settings:
# listen_addresses = 'localhost'
# port = 5432
# max_connections = 100

# Edit authentication
sudo nano /var/lib/pgsql/15/data/pg_hba.conf

# Add this line for local connections:
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5

# Restart PostgreSQL
sudo systemctl restart postgresql-15
```

### Step 4: Install Nginx

#### Install and Configure Nginx
```bash
# Install Nginx
sudo dnf install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Backup default config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
```

### Step 5: Create Application User

#### Setup Application User
```bash
# Create hrm user
sudo useradd -m -s /bin/bash hrm
sudo usermod -aG wheel hrm

# Create application directories
sudo mkdir -p /opt/skyraksys_hrm
sudo mkdir -p /var/log/skyraksys_hrm
sudo mkdir -p /etc/skyraksys_hrm

# Set permissions
sudo chown -R hrm:hrm /opt/skyraksys_hrm
sudo chown -R hrm:hrm /var/log/skyraksys_hrm
sudo chown -R hrm:hrm /etc/skyraksys_hrm
```

### Step 6: Deploy Application

#### Download and Setup Application
```bash
# Switch to hrm user
sudo su - hrm

# Clone repository
cd /opt/skyraksys_hrm
git clone https://github.com/Otyvino/skyrakskys_hrm.git .

# Install backend dependencies
cd backend
npm ci --production

# Install frontend dependencies and build
cd ../frontend
npm ci
npm run build

# Create production directories
mkdir -p /opt/skyraksys_hrm/logs
mkdir -p /opt/skyraksys_hrm/uploads
```

### Step 7: Database Setup

#### Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database and user
CREATE DATABASE skyraksys_hrm;
CREATE USER hrm_admin WITH ENCRYPTED PASSWORD 'HrmSecure2024!';
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_admin;
ALTER USER hrm_admin CREATEDB;
\q

# Run migrations (as hrm user)
sudo su - hrm
cd /opt/skyraksys_hrm/backend
npm run migrate
npm run seed
```

### Step 8: Configure Environment

#### Create Production Environment File
```bash
# Create environment file
sudo nano /etc/skyraksys_hrm/.env.production

# Add configuration (see config/.env.production.template)
```

### Step 9: Setup PM2 Process Manager

#### Configure PM2
```bash
# Switch to hrm user
sudo su - hrm

# Start application with PM2
cd /opt/skyraksys_hrm
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

# Follow the instructions to setup PM2 startup script
```

### Step 10: Configure Nginx Reverse Proxy

#### Setup Nginx Configuration
```bash
# Copy nginx configuration
sudo cp /opt/skyraksys_hrm/redhat/nginx/skyraksys_hrm.conf /etc/nginx/conf.d/

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Step 11: SSL Certificate Setup

#### Install Let's Encrypt SSL
```bash
# Install certbot
sudo dnf install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Setup auto-renewal
sudo systemctl enable certbot-renew.timer
```

### Step 12: System Services

#### Create SystemD Services
```bash
# Copy service files
sudo cp /opt/skyraksys_hrm/redhat/systemd/*.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable skyraksys-hrm
sudo systemctl start skyraksys-hrm
```

---

## 🔧 Configuration Files

All configuration files are provided in the respective folders:
- `config/` - Environment and application configs
- `nginx/` - Nginx reverse proxy configuration
- `systemd/` - SystemD service files
- `scripts/` - Installation and maintenance scripts

---

## 🔍 Post-Installation Verification

### Check Services Status
```bash
# Check all services
sudo systemctl status postgresql-15
sudo systemctl status nginx
sudo systemctl status skyraksys-hrm

# Check PM2 processes
sudo su - hrm -c "pm2 status"

# Test application
curl -k https://localhost/api/health
```

### Check Logs
```bash
# Application logs
sudo tail -f /var/log/skyraksys_hrm/combined.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/lib/pgsql/15/data/log/postgresql-*.log
```

---

## 🛡️ Security Hardening

### Firewall Configuration
```bash
# Restrict PostgreSQL access
sudo firewall-cmd --permanent --remove-port=5432/tcp
sudo firewall-cmd --reload

# Only allow necessary ports
sudo firewall-cmd --list-all
```

### System Security
```bash
# Update system regularly
sudo dnf update -y

# Configure fail2ban (optional)
sudo dnf install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📊 Monitoring & Maintenance

### Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
iostat
df -h
```

### Database Maintenance
```bash
# Database backup
pg_dump -U hrm_admin -h localhost skyraksys_hrm > backup_$(date +%Y%m%d).sql

# Vacuum database
sudo -u postgres psql -d skyraksys_hrm -c "VACUUM ANALYZE;"
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Check with `netstat -tulpn`
2. **Permission issues**: Verify user permissions
3. **Database connection**: Check PostgreSQL service and credentials
4. **SSL issues**: Verify certificate and Nginx config
5. **Application errors**: Check PM2 logs

### Support Commands
```bash
# Check application status
sudo systemctl status skyraksys-hrm

# Restart services
sudo systemctl restart skyraksys-hrm
sudo systemctl restart nginx
sudo systemctl restart postgresql-15

# View logs
journalctl -u skyraksys-hrm -f
```

---

## 📞 Support & Documentation

- **Full Documentation**: `/opt/skyraksys_hrm/docs/`
- **Log Files**: `/var/log/skyraksys_hrm/`
- **Configuration**: `/etc/skyraksys_hrm/`
- **Application**: `/opt/skyraksys_hrm/`

---

**Deployment Date**: $(date)  
**Version**: Production v2.0.0  
**Environment**: Red Hat Enterprise Linux

🚀 Key Features Included:
1. Automated Installation
✅ Complete system setup with one script
✅ Interactive configuration prompts
✅ Error handling and rollback capability
✅ Progress tracking and status reporting
2. Production-Ready Configuration
✅ Nginx reverse proxy with SSL support
✅ PostgreSQL 15 with optimized settings
✅ PM2 process management
✅ SystemD service integration
✅ Firewall and security configuration
3. Security Features
✅ SSL/TLS certificate automation (Let's Encrypt)
✅ Security headers and CORS configuration
✅ Rate limiting and DDoS protection
✅ SELinux compatibility
✅ Secure file permissions
4. Monitoring & Maintenance
✅ Comprehensive maintenance script
✅ Real-time monitoring capabilities
✅ Automated backup procedures
✅ Log management and rotation
✅ Performance optimization
5. Deployment Verification
✅ 20+ automated verification tests
✅ System requirements validation
✅ Service status monitoring
✅ API endpoint testing
✅ Performance metrics collection
🎯 Production Readiness:
Your application is now ready for Red Hat Enterprise Linux deployment with:

High Availability: PM2 clustering and automatic restarts
Scalability: Optimized configurations for production loads
Security: Enterprise-grade security measures
Monitoring: Comprehensive health checks and alerts
Maintenance: Automated backup, update, and maintenance procedures
📋 Next Steps for Your Team:
Transfer files to Red Hat server
Run automated installation script
Configure domain name and SSL
Verify deployment with included scripts
Set up monitoring and backup schedules
The deployment package includes everything needed for a professional, production-ready installation on Red Hat Linux! 🚀