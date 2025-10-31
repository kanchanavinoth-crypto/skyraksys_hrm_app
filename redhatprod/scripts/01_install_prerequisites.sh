#!/bin/bash

# RHEL 9.6 Production Deployment Script - Prerequisites Installation
# Skyraksys HRM System - Server Setup
# Run as root user

set -e

echo "=========================================="
echo "RHEL 9.6 Production Server Setup"
echo "Skyraksys HRM System"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=========================================="
    echo -e "$1"
    echo -e "==========================================${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (sudo ./01_install_prerequisites.sh)"
    exit 1
fi

# Update system
print_header "SYSTEM UPDATE"
print_status "Updating system packages..."
dnf update -y

# Install EPEL repository
print_status "Installing EPEL repository..."
dnf install -y epel-release

# Install development tools
print_header "DEVELOPMENT TOOLS"
print_status "Installing development tools..."
dnf groupinstall -y "Development Tools"
dnf install -y gcc-c++ make git curl wget unzip vim nano htop tree

# Install Node.js 18.x LTS
print_header "NODE.JS INSTALLATION"
print_status "Installing Node.js 18.x LTS..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js version: $NODE_VERSION"
print_status "NPM version: $NPM_VERSION"

# Install PM2 globally
print_status "Installing PM2 process manager..."
npm install -g pm2

# Install PostgreSQL 17
print_header "POSTGRESQL INSTALLATION"
print_status "Installing PostgreSQL 17..."

# Add PostgreSQL 17 official repository
print_status "Adding PostgreSQL official repository..."
dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Disable built-in PostgreSQL module
dnf -qy module disable postgresql

# Install PostgreSQL 17
dnf install -y postgresql17-server postgresql17-contrib postgresql17-devel

# Initialize PostgreSQL
print_status "Initializing PostgreSQL database..."
/usr/pgsql-17/bin/postgresql-17-setup initdb

# Enable and start PostgreSQL
print_status "Starting PostgreSQL service..."
systemctl enable postgresql-17
systemctl start postgresql-17

# Install Nginx
print_header "NGINX INSTALLATION"
print_status "Installing Nginx..."
dnf install -y nginx

# Enable and start Nginx
systemctl enable nginx
systemctl start nginx

# Install Redis (for session storage and caching)
print_header "REDIS INSTALLATION"
print_status "Installing Redis..."
dnf install -y redis

# Enable and start Redis
systemctl enable redis
systemctl start redis

# Install Python and pip (for additional utilities)
print_header "PYTHON INSTALLATION"
print_status "Installing Python and pip..."
dnf install -y python3 python3-pip python3-devel

# Install useful Python packages
pip3 install psycopg2-binary requests

# Install system monitoring tools
print_header "MONITORING TOOLS"
print_status "Installing monitoring tools..."
dnf install -y htop iotop nethogs iftop ncdu

# Install security tools
print_header "SECURITY TOOLS"
print_status "Installing security tools..."
dnf install -y fail2ban ufw

# Configure firewall
print_status "Configuring firewall..."
systemctl enable firewalld
systemctl start firewalld

# Open necessary ports
firewall-cmd --permanent --add-port=80/tcp    # HTTP
firewall-cmd --permanent --add-port=3000/tcp  # Frontend
firewall-cmd --permanent --add-port=5000/tcp  # Backend API
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload

# Create application user
print_header "APPLICATION USER SETUP"
APP_USER="hrmapp"
if id "$APP_USER" &>/dev/null; then
    print_warning "User $APP_USER already exists"
else
    print_status "Creating application user: $APP_USER"
    useradd -r -m -s /bin/bash $APP_USER
    usermod -aG wheel $APP_USER
fi

# Create application directories
print_status "Creating application directories..."
mkdir -p /opt/skyraksys-hrm
mkdir -p /opt/skyraksys-hrm/backend
mkdir -p /opt/skyraksys-hrm/frontend
mkdir -p /opt/skyraksys-hrm/logs
mkdir -p /opt/skyraksys-hrm/backups
mkdir -p /opt/skyraksys-hrm/uploads
mkdir -p /var/log/skyraksys-hrm

# Set ownership
chown -R $APP_USER:$APP_USER /opt/skyraksys-hrm
chown -R $APP_USER:$APP_USER /var/log/skyraksys-hrm

# Create log files
touch /var/log/skyraksys-hrm/application.log
touch /var/log/skyraksys-hrm/error.log
touch /var/log/skyraksys-hrm/access.log
chown $APP_USER:$APP_USER /var/log/skyraksys-hrm/*.log

# Configure PostgreSQL for application
print_header "POSTGRESQL CONFIGURATION"
print_status "Configuring PostgreSQL for application..."

# Backup original configuration
cp /var/lib/pgsql/17/data/postgresql.conf /var/lib/pgsql/17/data/postgresql.conf.backup
cp /var/lib/pgsql/17/data/pg_hba.conf /var/lib/pgsql/17/data/pg_hba.conf.backup

# Update PostgreSQL configuration
cat >> /var/lib/pgsql/17/data/postgresql.conf << EOF

# Custom configuration for HRM application
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
min_wal_size = 1GB
max_wal_size = 4GB

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%a.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Connection settings
idle_in_transaction_session_timeout = 300000
statement_timeout = 0
EOF

# Update pg_hba.conf for application access
cat >> /var/lib/pgsql/17/data/pg_hba.conf << EOF

# HRM Application access
local   skyraksys_hrm_prod    hrm_app                     md5
host    skyraksys_hrm_prod    hrm_app     127.0.0.1/32    md5
EOF

# Restart PostgreSQL to apply changes
systemctl restart postgresql-17

# Configure Nginx basic setup
print_status "Creating basic Nginx configuration..."
cat > /etc/nginx/conf.d/hrm.conf << 'EOF'
# Basic configuration - will be updated by deployment script
server {
    listen 80;
    server_name _;
    
    # Serve a simple maintenance page
    location / {
        return 503 'System is being set up. Please wait...';
        add_header Content-Type text/plain;
    }
}
EOF

# Restart Nginx
systemctl restart nginx

# Set up log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/skyraksys-hrm << 'EOF'
/var/log/skyraksys-hrm/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 hrmapp hrmapp
    postrotate
        /bin/systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF

# Install SSL certificates directory (for future SSL setup)
mkdir -p /etc/ssl/certs/skyraksys-hrm
mkdir -p /etc/ssl/private/skyraksys-hrm
chown root:root /etc/ssl/certs/skyraksys-hrm
chown root:root /etc/ssl/private/skyraksys-hrm
chmod 755 /etc/ssl/certs/skyraksys-hrm
chmod 700 /etc/ssl/private/skyraksys-hrm

# Create environment variables template
print_status "Creating environment template..."
cat > /opt/skyraksys-hrm/.env.template << 'EOF'
# Skyraksys HRM Environment Configuration - Production
# Copy this file to .env and update the values

# Application Settings
NODE_ENV=production
PORT=5000
FRONTEND_PORT=3000
API_BASE_URL=http://your-domain.com/api
FRONTEND_URL=http://your-domain.com

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=hrm_app
DB_PASSWORD=your_secure_password_here
DB_DIALECT=postgres

# Security Configuration
JWT_SECRET=your_jwt_secret_here_please_change_this_to_a_strong_secret
JWT_EXPIRES_IN=24h
SESSION_SECRET=your_session_secret_here_please_change_this
BCRYPT_ROUNDS=12

# Redis Configuration (for session storage and caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Email Configuration (for notifications and payslip delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@skyraksys.com
FROM_NAME=SKYRAKSYS HRM System

# File Upload Configuration
UPLOAD_PATH=/opt/skyraksys-hrm/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx

# PDF Generation (for payslips)
PDF_OUTPUT_PATH=/opt/skyraksys-hrm/uploads/payslips
PDF_TEMP_PATH=/tmp/hrm-pdfs

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/skyraksys-hrm/application.log
ERROR_LOG_FILE=/var/log/skyraksys-hrm/error.log
ACCESS_LOG_FILE=/var/log/skyraksys-hrm/access.log

# Company Information (for payslips and branding)
COMPANY_NAME=SKYRAKSYS TECHNOLOGIES LLP
COMPANY_ADDRESS=Plot-No: 27E, G.S.T. Road, Guduvanchery, Chennai, Tamil Nadu, 603202 India
COMPANY_EMAIL=info@skyraksys.com
COMPANY_PHONE=+91 89398 88577
COMPANY_WEBSITE=https://www.skyraksys.com
COMPANY_GST=33AABCS1234C1Z5
COMPANY_PAN=AABCS1234C

# Payroll Configuration
DEFAULT_WORKING_DAYS=22
PF_MAX_LIMIT=1800
PROFESSIONAL_TAX_LIMIT=15000
ESI_SALARY_LIMIT=25000
TDS_EXEMPTION_LIMIT=50000

# Security Headers and CORS
CORS_ORIGIN=http://your-domain.com
ALLOWED_ORIGINS=http://localhost:3000,http://your-domain.com
TRUST_PROXY=true

# Rate Limiting (aligned with server.js)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
RATE_LIMIT_AUTH_ENABLED=true
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX=20

# Demo Data Seeding Gate
SEED_DEMO_DATA=true  # TEMP: enables demo data for initial validation; set to false before production go-live

# Backup Configuration
BACKUP_RETENTION_DAYS=30
AUTO_BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *

# Monitoring and Health Check
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
PERFORMANCE_MONITORING=true
EOF

chown $APP_USER:$APP_USER /opt/skyraksys-hrm/.env.template

# Display service status
print_header "SERVICE STATUS"
print_status "PostgreSQL: $(systemctl is-active postgresql-17)"
print_status "Nginx: $(systemctl is-active nginx)"
print_status "Redis: $(systemctl is-active redis)"
print_status "Firewalld: $(systemctl is-active firewalld)"

# Display installed versions
print_header "INSTALLED VERSIONS"
print_status "Node.js: $(node --version)"
print_status "NPM: $(npm --version)"
print_status "PM2: $(pm2 --version)"
print_status "PostgreSQL: $(sudo -u postgres psql --version | head -1)"
print_status "Nginx: $(nginx -v 2>&1)"
print_status "Redis: $(redis-server --version)"

# Final message
print_header "INSTALLATION COMPLETE"
print_status "Prerequisites installation completed successfully!"
print_status ""
print_status "Next steps:"
print_status "1. Run ./02_setup_database.sh to setup the database"
print_status "2. Update /opt/skyraksys-hrm/.env with your configuration"
print_status "3. Run ./03_deploy_application.sh to deploy the application"
print_status ""
print_status "Application directory: /opt/skyraksys-hrm"
print_status "Log directory: /var/log/skyraksys-hrm"
print_status "Application user: $APP_USER"
print_status ""
print_warning "IMPORTANT: Please change the default passwords in the database setup!"

echo "Installation completed at: $(date)"