# 🚀 SkyRakSys HRM - Unix Server Setup Guide (Beginner-Friendly)

## 📋 Step-by-Step Setup Guide

### Step 1: System Requirements

#### Minimum Requirements
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB free space
- Operating System: Ubuntu 20.04+, Debian 11+, CentOS 8+, or macOS 10.14+

#### Recommended Requirements
- CPU: 4+ cores
- RAM: 8GB or more
- Storage: 50GB+ SSD
- Fast internet connection

### Step 2: Prepare Your Server

Open terminal and copy-paste these commands one by one:

```bash
# Update your system
sudo apt update
sudo apt upgrade -y

# Install required packages
sudo apt install curl git wget unzip -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x or higher
```

### Step 3: Download and Setup

```bash
# Create directory for application
sudo mkdir -p /opt/skyraksys
cd /opt/skyraksys

# Download application package
git clone https://github.com/your-repo/skyraksys-hrm.git
cd skyraksys-hrm/PRODUnix

# Make scripts executable
chmod +x scripts/*.sh *.sh
```

### Step 4: Run Automated Setup

The easiest way to set up is using our automated script:

```bash
# Run setup script
sudo ./setup-production.sh
```

This script will:
- ✅ Install all required software
- ✅ Set up PostgreSQL database
- ✅ Configure environment variables
- ✅ Set up SSL certificates
- ✅ Create startup services
- ✅ Generate secure passwords

### Step 5: Important Security Steps

After setup completes:

1. **Save Generated Passwords**
   ```bash
   # Copy password file to your local machine
   cat config/generated-passwords.txt
   
   # After saving passwords elsewhere, delete the file
   rm config/generated-passwords.txt
   ```

2. **Change Default Passwords**
   - Log in to application (http://your-server-ip:3001)
   - Go to Settings → Change Password
   - Update admin password
   - Update database password
   - Update other service passwords

### Step 6: Start the Application

```bash
# Start all services
./start.sh

# Check status
./status.sh
```

### Step 7: Access Your Application

- Frontend: http://your-server-ip:3001
- API: http://your-server-ip:8080
- Health Check: http://your-server-ip:3001/health

## 🔧 Common Management Commands

### Starting and Stopping
```bash
# Start application
./start.sh

# Stop application
./stop.sh

# Restart application
./restart.sh

# Check status
./status.sh
```

### View Logs
```bash
# View all logs
./logs.sh

# View specific component logs
./logs.sh frontend
./logs.sh backend
./logs.sh database
```

### Backup and Restore
```bash
# Create backup
./backup.sh

# List backups
./backup.sh list

# Restore from backup
./restore.sh backup_filename
```

## 🔍 Troubleshooting Guide

### 1. Application Won't Start
- Check if ports are available:
  ```bash
  sudo netstat -tulpn | grep -E '3001|8080'
  ```
- Check logs for errors:
  ```bash
  ./logs.sh
  ```

### 2. Database Connection Issues
- Verify PostgreSQL is running:
  ```bash
  sudo systemctl status postgresql
  ```
- Check database logs:
  ```bash
  ./logs.sh database
  ```

### 3. Permission Issues
- Fix ownership:
  ```bash
  sudo chown -R $USER:$USER /opt/skyraksys
  ```
- Fix script permissions:
  ```bash
  chmod +x scripts/*.sh *.sh
  ```

## 🛡️ Security Best Practices

1. **Change All Default Passwords**
   - Database passwords
   - Admin user passwords
   - Application secrets

2. **Enable Firewall**
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   ```

3. **Setup SSL/HTTPS**
   ```bash
   # Install certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d yourdomain.com
   ```

4. **Regular Updates**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Update application
   ./update.sh
   ```

## 📊 Monitoring Your Application

### 1. System Monitoring
```bash
# View resource usage
htop

# View disk space
df -h

# View memory usage
free -h
```

### 2. Application Monitoring
```bash
# View application status
./status.sh

# View real-time logs
./logs.sh -f

# Check health status
curl http://localhost:3001/health
```

## 🆘 Getting Help

If you encounter issues:

1. **Check Logs**
   ```bash
   ./logs.sh
   ```

2. **View Error Details**
   ```bash
   ./diagnose.sh
   ```

3. **Contact Support**
   - Email: support@skyraksys.com
   - Support Portal: https://support.skyraksys.com
   - Emergency: +1-XXX-XXX-XXXX

## 🔄 Regular Maintenance

### Daily Tasks
- Check application status
- Monitor disk space
- Review error logs

### Weekly Tasks
- Create backups
- Update system packages
- Review security logs

### Monthly Tasks
- Rotate log files
- Check SSL certificates
- Review user accounts

## ✅ Post-Installation Checklist

- [ ] All services running (./status.sh shows green)
- [ ] Changed all default passwords
- [ ] Saved passwords in secure location
- [ ] Enabled firewall
- [ ] Set up SSL/HTTPS
- [ ] Created first backup
- [ ] Tested application access
- [ ] Configured monitoring
- [ ] Documented custom configurations
- [ ] Set up automatic updates

## 🔗 Additional Resources

- [Complete Documentation](docs/README.md)
- [Security Guide](docs/SECURITY.md)
- [Backup Guide](docs/BACKUP.md)
- [Monitoring Guide](docs/MONITORING.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)