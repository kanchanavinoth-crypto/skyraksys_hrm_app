# 🔧 SkyrakSys HRM - Deployment Troubleshooting Guide

## 🚨 When Things Go Wrong - Don't Panic!

This guide helps you fix common problems during deployment. Each problem has a simple explanation and step-by-step solution.

---

## 📋 **Quick Diagnostic Commands**

**Run these first to gather information:**

```bash
# Check what's running
sudo systemctl status postgresql-15 nginx skyraksys-hrm

# Check application process
sudo -u hrm pm2 status

# Check if ports are open
sudo ss -tulpn | grep -E ':80|:443|:8080|:5432'

# Check recent errors
sudo journalctl -xe --since "10 minutes ago"
```

---

## 🔍 **Installation Problems**

### **Problem 1: "Command not found" during installation**

**What it means:** A required tool isn't installed.

**Solutions:**

```bash
# If 'wget' is missing:
sudo dnf install -y wget

# If 'curl' is missing:
sudo dnf install -y curl

# If 'git' is missing:
sudo dnf install -y git

# If 'unzip' is missing:
sudo dnf install -y unzip

# Install all common tools at once:
sudo dnf install -y wget curl git unzip nano vim
```

### **Problem 2: "Permission denied" errors**

**What it means:** You don't have permission to run the command.

**Solutions:**

```bash
# Add 'sudo' before commands that modify the system:
sudo dnf install package-name
sudo systemctl start service-name
sudo mkdir /opt/directory

# Make scripts executable:
chmod +x scripts/*.sh

# Check if you're in the right directory:
pwd
ls -la
```

### **Problem 3: "No space left on device"**

**What it means:** Your server is out of disk space.

**Check disk space:**
```bash
df -h
```

**Solutions:**
```bash
# Clean package cache:
sudo dnf clean all

# Remove old logs:
sudo journalctl --vacuum-time=7d

# Check large files:
sudo find / -type f -size +100M 2>/dev/null | head -10

# Remove unnecessary packages:
sudo dnf autoremove
```

### **Problem 4: Internet/Network issues**

**Test connectivity:**
```bash
# Test basic internet:
ping -c 3 google.com

# Test DNS resolution:
nslookup github.com

# Check firewall:
sudo firewall-cmd --list-all
```

**Solutions:**
```bash
# If firewall is blocking:
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# If DNS issues:
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
```

---

## 🗄️ **Database Problems**

### **Problem 1: PostgreSQL won't start**

**Check status:**
```bash
sudo systemctl status postgresql-15
```

**Common solutions:**
```bash
# Initialize database if not done:
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb

# Fix permissions:
sudo chown -R postgres:postgres /var/lib/pgsql/15/

# Start the service:
sudo systemctl start postgresql-15
sudo systemctl enable postgresql-15

# Check logs for specific errors:
sudo tail -f /var/lib/pgsql/15/data/log/postgresql-*.log
```

### **Problem 2: "Database connection failed"**

**Test database connection:**
```bash
# Test as postgres user:
sudo -u postgres psql -c "SELECT version();"

# Test application database:
sudo -u postgres psql -d skyraksys_hrm -c "SELECT 1;"
```

**Solutions:**
```bash
# Create database if missing:
sudo -u postgres createdb skyraksys_hrm

# Create user if missing:
sudo -u postgres psql -c "CREATE USER hrm_admin WITH ENCRYPTED PASSWORD 'YourPassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_admin;"

# Check environment file:
cat /opt/skyraksys_hrm/backend/.env
# Make sure DB_PASSWORD matches what you set
```

### **Problem 3: "Cannot connect to database server"**

**Check if PostgreSQL is listening:**
```bash
sudo ss -tulpn | grep 5432
```

**Check configuration:**
```bash
# Check if PostgreSQL allows connections:
sudo cat /var/lib/pgsql/15/data/postgresql.conf | grep listen_addresses

# Should show: listen_addresses = 'localhost'
# If not, edit the file:
sudo nano /var/lib/pgsql/15/data/postgresql.conf
# Change: #listen_addresses = 'localhost' to: listen_addresses = 'localhost'

# Restart PostgreSQL:
sudo systemctl restart postgresql-15
```

---

## 🌐 **Web Server Problems**

### **Problem 1: "502 Bad Gateway" error**

**What it means:** Nginx can't connect to the backend application.

**Check backend application:**
```bash
# Is the app running?
sudo -u hrm pm2 status

# Is it listening on port 8080?
sudo ss -tulpn | grep 8080

# Check app logs:
sudo -u hrm pm2 logs
```

**Solutions:**
```bash
# Restart the application:
sudo -u hrm pm2 restart all

# If not running, start it:
cd /opt/skyraksys_hrm
sudo -u hrm pm2 start ecosystem.config.js --env production

# Check if port 8080 is free:
sudo lsof -i :8080
```

### **Problem 2: "Cannot access website" (Connection refused)**

**Check Nginx status:**
```bash
sudo systemctl status nginx
```

**Check if Nginx is listening:**
```bash
sudo ss -tulpn | grep :80
```

**Solutions:**
```bash
# Start Nginx:
sudo systemctl start nginx

# Check Nginx configuration:
sudo nginx -t

# If configuration error, fix it:
sudo nano /etc/nginx/conf.d/skyraksys_hrm.conf

# Restart Nginx:
sudo systemctl restart nginx

# Check Nginx logs:
sudo tail -f /var/log/nginx/error.log
```

### **Problem 3: "404 Not Found" for API calls**

**Check Nginx configuration:**
```bash
sudo nginx -t
sudo cat /etc/nginx/conf.d/skyraksys_hrm.conf
```

**Test backend directly:**
```bash
curl http://localhost:8080/api/health
```

**Solutions:**
```bash
# If backend works but Nginx doesn't proxy:
# Check the proxy_pass line in Nginx config
sudo nano /etc/nginx/conf.d/skyraksys_hrm.conf

# Should have:
# location /api/ {
#     proxy_pass http://127.0.0.1:8080;
# }

# Restart Nginx after changes:
sudo systemctl restart nginx
```

---

## 📱 **Application Problems**

### **Problem 1: Application starts but crashes immediately**

**Check logs:**
```bash
sudo -u hrm pm2 logs --err
```

**Common causes and solutions:**

**Environment file issues:**
```bash
# Check if environment file exists:
ls -la /opt/skyraksys_hrm/backend/.env

# Check file contents:
cat /opt/skyraksys_hrm/backend/.env

# If missing, create it:
sudo -u hrm cp /opt/skyraksys_hrm/redhat/config/.env.production.template /opt/skyraksys_hrm/backend/.env
sudo -u hrm nano /opt/skyraksys_hrm/backend/.env
```

**Missing dependencies:**
```bash
cd /opt/skyraksys_hrm/backend
sudo -u hrm npm install
```

**Database migration issues:**
```bash
cd /opt/skyraksys_hrm/backend
sudo -u hrm npm run migrate
```

### **Problem 2: "Cannot login" or "Invalid credentials"**

**Check if default users exist:**
```bash
sudo -u postgres psql -d skyraksys_hrm -c "SELECT email FROM users;"
```

**Create default users if missing:**
```bash
cd /opt/skyraksys_hrm/backend
sudo -u hrm npm run seed
```

**Check application logs for authentication errors:**
```bash
sudo -u hrm pm2 logs | grep -i auth
```

### **Problem 3: Frontend shows "blank page" or loading forever**

**Check if frontend was built:**
```bash
ls -la /opt/skyraksys_hrm/frontend/build/
```

**Rebuild frontend:**
```bash
cd /opt/skyraksys_hrm/frontend
sudo -u hrm npm install
sudo -u hrm npm run build
```

**Check Nginx is serving frontend:**
```bash
curl -I http://localhost/
# Should return 200 OK
```

---

## 🔥 **Emergency Recovery**

### **Complete Service Restart**
```bash
# Stop everything:
sudo -u hrm pm2 stop all
sudo systemctl stop nginx
sudo systemctl stop postgresql-15

# Wait 10 seconds
sleep 10

# Start everything:
sudo systemctl start postgresql-15
sleep 5
sudo systemctl start nginx
sudo -u hrm pm2 start all
```

### **Reset to Clean State**
```bash
# Stop application:
sudo -u hrm pm2 stop all
sudo -u hrm pm2 delete all

# Reset database (WARNING: This deletes all data!):
sudo -u postgres dropdb skyraksys_hrm
sudo -u postgres createdb skyraksys_hrm
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_admin;"

# Restart application:
cd /opt/skyraksys_hrm/backend
sudo -u hrm npm run migrate
sudo -u hrm npm run seed
sudo -u hrm pm2 start ecosystem.config.js --env production
```

### **Complete Reinstallation**
```bash
# Remove application directory:
sudo rm -rf /opt/skyraksys_hrm

# Run installer again:
cd /path/to/installer
sudo ./scripts/install-complete.sh
```

---

## 📊 **Monitoring and Logs**

### **Real-time Monitoring**
```bash
# Watch all logs:
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log &
sudo -u hrm pm2 logs &

# Monitor system resources:
htop

# Watch network connections:
watch -n 2 'ss -tulpn | grep -E ":80|:443|:8080|:5432"'
```

### **Log Locations**
```bash
# Application logs:
sudo -u hrm pm2 logs
/var/log/skyraksys_hrm/

# Web server logs:
/var/log/nginx/access.log
/var/log/nginx/error.log

# Database logs:
/var/lib/pgsql/15/data/log/postgresql-*.log

# System logs:
sudo journalctl -u postgresql-15
sudo journalctl -u nginx
sudo journalctl -u skyraksys-hrm
```

---

## 🆘 **Getting More Help**

### **Create a Support Report**
```bash
# Gather system information:
echo "=== SYSTEM INFO ===" > /tmp/support-report.txt
uname -a >> /tmp/support-report.txt
cat /etc/redhat-release >> /tmp/support-report.txt
free -h >> /tmp/support-report.txt
df -h >> /tmp/support-report.txt

echo "=== SERVICE STATUS ===" >> /tmp/support-report.txt
sudo systemctl status postgresql-15 nginx skyraksys-hrm >> /tmp/support-report.txt

echo "=== PM2 STATUS ===" >> /tmp/support-report.txt
sudo -u hrm pm2 status >> /tmp/support-report.txt

echo "=== RECENT ERRORS ===" >> /tmp/support-report.txt
sudo journalctl -xe --since "1 hour ago" | tail -50 >> /tmp/support-report.txt

# View the report:
cat /tmp/support-report.txt
```

### **Test Basic Connectivity**
```bash
# Test all endpoints:
echo "Testing backend health:"
curl -s http://localhost:8080/api/health

echo "Testing frontend:"
curl -s -I http://localhost/

echo "Testing database:"
sudo -u postgres psql -d skyraksys_hrm -c "SELECT 1;"

echo "Testing external connectivity:"
ping -c 3 google.com
```

---

## ✅ **Prevention Tips**

1. **Always check logs** when something doesn't work
2. **Test each step** before moving to the next
3. **Keep backups** of working configurations
4. **Document changes** you make
5. **Monitor disk space** regularly
6. **Keep system updated** but test updates first

---

**Remember:** Most problems have simple solutions. Check the logs, verify the basics, and don't be afraid to restart services!
