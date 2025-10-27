# 🚀 SkyrakSys HRM - Red Hat Linux Quick Start Guide

## 📋 Pre-Installation Checklist

Before starting the installation, ensure you have:

- [x] Red Hat Enterprise Linux 8+ or CentOS 8+
- [x] Root or sudo access
- [x] Internet connection
- [x] Domain name (for SSL) or IP address
- [x] At least 4GB RAM and 20GB free disk space

## ⚡ Quick Installation (Automated)

### Step 1: Download and Prepare
```bash
# Download the repository
wget https://github.com/Otyvino/skyrakskys_hrm/archive/refs/heads/main.zip
unzip main.zip
cd skyrakskys_hrm-main/redhat

# Make scripts executable
chmod +x scripts/*.sh
```

### Step 2: Run Complete Installation
```bash
# Run the automated installer (as root)
sudo ./scripts/install-complete.sh

# Follow the interactive prompts:
# - Enter domain name (e.g., hrm.yourcompany.com)
# - Set database password
# - Provide admin email for SSL
# - Configure other settings as prompted
```

### Step 3: Verify Installation
```bash
# Run deployment verification
sudo ./scripts/verify-deployment.sh

# Check system status
sudo ./scripts/maintenance.sh status
```

## 🔧 Manual Installation (Step by Step)

If you prefer manual control or need to troubleshoot:

### Step 1: System Preparation
```bash
# Update system
sudo dnf update -y
sudo dnf install -y epel-release
sudo dnf groupinstall -y "Development Tools"

# Configure firewall
sudo systemctl start firewalld
sudo systemctl enable firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Step 2: Install Components
```bash
# Install Node.js
sudo ./scripts/install-nodejs.sh

# Install PostgreSQL
sudo ./scripts/install-postgresql.sh

# Install Nginx
sudo ./scripts/install-nginx.sh
```

### Step 3: Deploy Application
```bash
# Create application user
sudo useradd -m -s /bin/bash hrm
sudo mkdir -p /opt/skyraksys_hrm
sudo chown hrm:hrm /opt/skyraksys_hrm

# Clone and deploy
sudo -u hrm git clone https://github.com/Otyvino/skyrakskys_hrm.git /opt/skyraksys_hrm
cd /opt/skyraksys_hrm/backend
sudo -u hrm npm ci --production

cd ../frontend
sudo -u hrm npm ci
sudo -u hrm npm run build
```

### Step 4: Configure Services
```bash
# Setup database
sudo -u postgres createdb skyraksys_hrm
sudo -u postgres createuser hrm_admin

# Configure environment
sudo cp /opt/skyraksys_hrm/redhat/config/.env.production.template /etc/skyraksys_hrm/.env.production
# Edit the file with your settings

# Setup systemd service
sudo cp /opt/skyraksys_hrm/redhat/systemd/skyraksys-hrm.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable skyraksys-hrm
sudo systemctl start skyraksys-hrm

# Configure Nginx
sudo cp /opt/skyraksys_hrm/redhat/nginx/skyraksys_hrm.conf /etc/nginx/conf.d/
# Edit domain name in the config file
sudo nginx -t
sudo systemctl restart nginx
```

## 🔐 SSL Certificate Setup

### Using Let's Encrypt (Recommended)
```bash
# Install certbot
sudo dnf install -y certbot python3-certbot-nginx

# Obtain certificate (replace yourdomain.com)
sudo certbot --nginx -d yourdomain.com --email admin@yourdomain.com --agree-tos --non-interactive

# Verify auto-renewal
sudo systemctl enable certbot-renew.timer
```

### Using Self-Signed Certificate (Development)
```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/skyraksys.key \
  -out /etc/ssl/certs/skyraksys.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"

# Update Nginx configuration to use the certificate
```

## 📊 Post-Installation

### Verify Everything is Working
```bash
# Check services status
sudo systemctl status postgresql-15 nginx skyraksys-hrm

# Check application health
curl http://localhost/api/health

# View logs
sudo journalctl -u skyraksys-hrm -f
```

### Access Your Application
- **Frontend**: https://yourdomain.com
- **API**: https://yourdomain.com/api
- **Health Check**: https://yourdomain.com/api/health

### Default Login Credentials
The system will create default users with secure passwords displayed in the logs:
- Admin: admin@company.com
- HR: hr@company.com  
- Employee: employee@company.com

## 🛠️ Management Commands

### Daily Operations
```bash
# Check system status
sudo ./scripts/maintenance.sh status

# View logs
sudo ./scripts/maintenance.sh logs

# Backup database
sudo ./scripts/maintenance.sh backup

# Restart services
sudo ./scripts/maintenance.sh restart
```

### Application Updates
```bash
# Update application
sudo ./scripts/maintenance.sh update

# Verify after update
sudo ./scripts/verify-deployment.sh
```

### Monitoring
```bash
# Continuous monitoring
sudo ./scripts/maintenance.sh monitor

# Check performance
sudo ./scripts/maintenance.sh disk
```

## 🚨 Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   sudo journalctl -u skyraksys-hrm -f
   sudo systemctl status skyraksys-hrm
   ```

2. **Database connection issues**
   ```bash
   sudo -u postgres psql -l
   sudo systemctl status postgresql-15
   ```

3. **Nginx configuration errors**
   ```bash
   sudo nginx -t
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Permission issues**
   ```bash
   sudo chown -R hrm:hrm /opt/skyraksys_hrm
   sudo chmod 600 /opt/skyraksys_hrm/backend/.env
   ```

### Getting Help
- Check logs: `/var/log/skyraksys_hrm/`
- Nginx logs: `/var/log/nginx/`
- System logs: `journalctl -u skyraksys-hrm`
- Database logs: `/var/lib/pgsql/15/data/log/`

## 📁 File Locations

### Important Directories
- **Application**: `/opt/skyraksys_hrm/`
- **Configuration**: `/etc/skyraksys_hrm/`
- **Logs**: `/var/log/skyraksys_hrm/`
- **Backups**: `/opt/backups/skyraksys_hrm/`
- **SSL Certificates**: `/etc/letsencrypt/live/yourdomain.com/`

### Configuration Files
- **Nginx**: `/etc/nginx/conf.d/skyraksys_hrm.conf`
- **SystemD**: `/etc/systemd/system/skyraksys-hrm.service`
- **Environment**: `/etc/skyraksys_hrm/.env.production`
- **PM2**: `/opt/skyraksys_hrm/ecosystem.config.js`

## 🔄 Backup and Recovery

### Automated Backups
The maintenance script creates automatic database backups:
```bash
# Manual backup
sudo ./scripts/maintenance.sh backup

# Restore from backup
sudo -u postgres psql skyraksys_hrm < /opt/backups/skyraksys_hrm/backup_file.sql
```

### Full System Backup
```bash
# Backup application and configuration
sudo tar -czf /tmp/skyraksys_hrm_backup.tar.gz \
  /opt/skyraksys_hrm \
  /etc/skyraksys_hrm \
  /etc/nginx/conf.d/skyraksys_hrm.conf \
  /etc/systemd/system/skyraksys-hrm.service
```

## 🎯 Production Checklist

- [ ] SSL certificate configured
- [ ] Firewall properly configured
- [ ] Regular backups scheduled
- [ ] Monitoring set up
- [ ] Log rotation configured
- [ ] Security updates enabled
- [ ] Performance optimization applied
- [ ] Documentation updated
- [ ] Team trained on management procedures

---

**Support**: For technical support, check the logs and documentation in `/opt/skyraksys_hrm/docs/`  
**Updates**: Use `sudo ./scripts/maintenance.sh update` for application updates  
**Monitoring**: Use `sudo ./scripts/maintenance.sh monitor` for real-time monitoring
