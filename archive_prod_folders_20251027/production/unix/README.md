# SkyRakSys HRM Production Setup (Unix/Linux)

Complete production deployment package for Unix/Linux systems including Ubuntu, Debian, CentOS, RHEL, Fedora, Arch Linux, and macOS.

## 🚀 Quick Start

### Prerequisites
- Unix/Linux or macOS system
- Root or sudo access
- Internet connection for package installation

### Automated Setup

```bash
# Clone or download the production package
cd PRODUnix

# Make scripts executable
chmod +x scripts/*.sh

# Run the main setup script
sudo ./scripts/setup-production.sh
```

The setup script will:
1. Detect your operating system
2. Install required dependencies (Node.js, PostgreSQL, Nginx, PM2)
3. Configure the database
4. Set up SSL certificates
5. Configure environment variables
6. Create startup scripts
7. Start the application

## 📋 Manual Setup Guide

### 1. System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB free space
- OS: Ubuntu 18.04+, Debian 9+, CentOS 7+, RHEL 7+, Fedora 30+, Arch Linux, macOS 10.14+

**Recommended:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ SSD
- Load balancer for high availability

### 2. Dependencies Installation

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install -y curl wget gnupg2 software-properties-common

# Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Nginx
sudo apt install -y nginx

# PM2
sudo npm install -g pm2

# Additional tools
sudo apt install -y git zip unzip htop
```

#### CentOS/RHEL/Fedora:
```bash
# CentOS/RHEL
sudo yum update -y
sudo yum install -y curl wget

# Fedora
sudo dnf update -y
sudo dnf install -y curl wget

# Node.js 18 LTS
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs  # CentOS/RHEL
# sudo dnf install -y nodejs  # Fedora

# PostgreSQL 15
sudo yum install -y postgresql-server postgresql-contrib  # CentOS/RHEL
# sudo dnf install -y postgresql-server postgresql-contrib  # Fedora

# Initialize PostgreSQL
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Nginx
sudo yum install -y nginx  # CentOS/RHEL
# sudo dnf install -y nginx  # Fedora

# PM2
sudo npm install -g pm2
```

#### Arch Linux:
```bash
sudo pacman -Syu
sudo pacman -S nodejs npm postgresql nginx git

# Initialize PostgreSQL
sudo -u postgres initdb -D /var/lib/postgres/data
sudo systemctl enable postgresql
sudo systemctl start postgresql

# PM2
sudo npm install -g pm2
```

#### macOS:
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node postgresql nginx

# Start services
brew services start postgresql
brew services start nginx

# PM2
npm install -g pm2
```

### 3. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

-- In PostgreSQL prompt:
CREATE DATABASE skyraksys_hrm;
CREATE USER hrm_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_user;
ALTER USER hrm_user CREATEDB;
\q
```

### 4. Application Setup

```bash
# Create application directory
sudo mkdir -p /opt/skyraksys-hrm
sudo chown $USER:$USER /opt/skyraksys-hrm
cd /opt/skyraksys-hrm

# Copy application files (adjust paths as needed)
cp -r /path/to/PRODUnix/* ./

# Set up environment
cp config/.env.template .env
nano .env  # Edit configuration

# Install dependencies
npm install

# Backend setup
cd backend
npm install --production
cd ..

# Frontend setup
cd frontend
npm install
npm run build
cd ..

# Create necessary directories
mkdir -p logs/{backend,frontend} data/{postgres,redis,uploads} backups

# Set permissions
chmod +x *.sh
chmod +x scripts/*.sh
```

### 5. Environment Configuration

Edit the `.env` file:
```bash
nano .env
```

**Critical settings to configure:**
```bash
# Database
DB_PASSWORD=your_secure_database_password
DB_USER=hrm_user

# Security
JWT_SECRET=your_super_secret_jwt_key_64_chars_minimum
SESSION_SECRET=your_session_secret_key

# Domain (for production)
DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com/api

# SSL (if using HTTPS)
SSL_ENABLED=true
LETSENCRYPT_ENABLED=true
LETSENCRYPT_EMAIL=admin@yourdomain.com
```

### 6. SSL Certificate Setup

#### Option A: Self-signed certificates (development/testing)
```bash
./scripts/generate-ssl.sh --self-signed
```

#### Option B: Let's Encrypt (production)
```bash
./scripts/generate-ssl.sh --letsencrypt yourdomain.com
```

#### Option C: Custom certificates
```bash
# Copy your certificates
cp your-cert.crt nginx/ssl/server.crt
cp your-cert.key nginx/ssl/server.key
cp your-ca.crt nginx/ssl/ca.crt
```

### 7. Database Migration

```bash
# Run database migrations
cd backend
npm run migrate
npm run seed  # Optional: load sample data
cd ..
```

### 8. Start Application

```bash
# Start with PM2
./start.sh

# Or start manually
npm run start:production
```

## 🔧 Management Commands

### Application Control

```bash
# Start application
./start.sh

# Stop application
./stop.sh

# Restart application
./restart.sh

# Check status
./status.sh

# View logs
./logs.sh

# Health check
./health-check.sh

# Create backup
./backup.sh

# Update application
./update.sh
```

### PM2 Commands

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs
pm2 logs skyraksys-hrm-backend
pm2 logs skyraksys-hrm-frontend

# Restart specific service
pm2 restart skyraksys-hrm-backend
pm2 restart skyraksys-hrm-frontend

# Scale services
pm2 scale skyraksys-hrm-backend 4

# Save PM2 configuration
pm2 save
pm2 startup  # Enable auto-start on boot
```

### Database Management

```bash
# Connect to database
psql -h localhost -U hrm_user -d skyraksys_hrm

# Create backup
pg_dump -h localhost -U hrm_user -d skyraksys_hrm > backup.sql

# Restore backup
psql -h localhost -U hrm_user -d skyraksys_hrm < backup.sql

# Reset database
./scripts/reset-database.sh
```

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Copy Docker files
cp -r docker ../

# Build and start services
docker-compose -f docker/docker-compose.yml up -d

# Check status
docker-compose -f docker/docker-compose.yml ps

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

### Docker Commands

```bash
# Build images
docker-compose build

# Scale services
docker-compose up -d --scale backend=3

# Update services
docker-compose pull
docker-compose up -d

# Backup volumes
docker run --rm -v skyraksys_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

## 📊 Monitoring & Maintenance

### Health Monitoring

```bash
# Basic health check
curl http://localhost/health

# Detailed health check
curl http://localhost:3001/health/detailed

# Application metrics
pm2 monit

# System resources
htop
df -h
free -m
```

### Log Management

```bash
# Application logs
tail -f logs/backend/combined.log
tail -f logs/frontend/combined.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*.log

# System logs
journalctl -u nginx -f
journalctl -u postgresql -f
```

### Performance Tuning

#### PostgreSQL Optimization
```sql
-- In psql as postgres user
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

#### Nginx Optimization
```bash
# Edit nginx configuration
sudo nano /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx
```

#### Node.js Optimization
```bash
# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Use PM2 cluster mode
pm2 scale skyraksys-hrm-backend max
```

## 🔒 Security Configuration

### Firewall Setup

#### Ubuntu/Debian (UFW):
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5432/tcp  # Block external database access
```

#### CentOS/RHEL/Fedora (Firewalld):
```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Security Headers

The Nginx configuration includes:
- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options

### Database Security

```sql
-- In PostgreSQL
-- Disable default postgres user if not needed
ALTER USER postgres WITH PASSWORD 'strong_password';

-- Enable SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = 'server.crt';
ALTER SYSTEM SET ssl_key_file = 'server.key';
```

## 🔄 Backup & Recovery

### Automated Backups

The backup script creates:
- Database dumps (compressed)
- Application files
- Configuration files
- Logs (optional)

```bash
# Manual backup
./backup.sh

# Schedule automatic backups
crontab -e
# Add: 0 2 * * * /opt/skyraksys-hrm/backup.sh
```

### Recovery Process

```bash
# Stop application
./stop.sh

# Restore database
psql -h localhost -U hrm_user -d skyraksys_hrm < backups/YYYYMMDD_HHMMSS/database.sql

# Restore files
cp -r backups/YYYYMMDD_HHMMSS/uploads ./

# Start application
./start.sh
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :8080
sudo lsof -i :3000

# Kill process
sudo kill -9 PID
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U hrm_user -d skyraksys_hrm -c "SELECT NOW();"

# Reset password
sudo -u postgres psql -c "ALTER USER hrm_user WITH PASSWORD 'new_password';"
```

#### Permission Issues
```bash
# Fix file permissions
chmod +x *.sh scripts/*.sh
chown -R $USER:$USER .

# Fix PostgreSQL permissions
sudo chown -R postgres:postgres /var/lib/postgresql/
```

#### Memory Issues
```bash
# Check memory usage
free -m
ps aux --sort=-%mem | head

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Log Analysis

```bash
# Check for errors
grep -i error logs/backend/error.log
grep -i error logs/frontend/error.log

# Check authentication issues
grep -i "auth\|login" logs/backend/combined.log

# Check database issues
grep -i "database\|postgres" logs/backend/combined.log
```

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Automatic update (if git repository)
./update.sh

# Manual update
./stop.sh
# Replace application files
npm install
cd frontend && npm run build && cd ..
./start.sh
```

### System Updates

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade

# CentOS/RHEL
sudo yum update

# Fedora
sudo dnf update

# Arch Linux
sudo pacman -Syu

# macOS
brew update && brew upgrade
```

### Dependency Updates

```bash
# Check outdated packages
npm outdated

# Update packages
npm update

# Update PM2
npm install -g pm2@latest
pm2 update
```

## 📞 Support

### System Information

```bash
# Generate system report
./scripts/system-info.sh > system-report.txt

# Include in support requests:
cat system-report.txt
```

### Log Collection

```bash
# Collect all logs
tar -czf support-logs.tar.gz logs/

# Include recent logs only
find logs/ -name "*.log" -mtime -7 -exec tar -czf recent-logs.tar.gz {} +
```

## 📝 Configuration Reference

### Environment Variables

See `config/.env.template` for all available configuration options.

### File Structure

```
PRODUnix/
├── scripts/           # Setup and management scripts
├── docker/           # Docker configurations
├── nginx/            # Nginx configurations
├── config/           # Configuration templates
├── docs/             # Documentation
├── logs/             # Application logs
├── data/             # Data directories
├── backups/          # Backup storage
├── *.sh              # Quick management scripts
└── README.md         # This file
```

## 📈 Performance Monitoring

### Metrics to Monitor

- CPU usage
- Memory usage
- Disk space
- Database connections
- Response times
- Error rates

### Monitoring Tools

```bash
# System monitoring
htop
iotop
netstat -tulpn

# Application monitoring
pm2 monit

# Database monitoring
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

---

For additional support or questions, please refer to the main project documentation or create an issue in the project repository.
