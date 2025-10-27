# 🔧 Complete Troubleshooting Guide
## Solutions to Common Deployment Issues

**Last Updated:** October 22, 2025  
**Coverage:** All common issues and solutions  

---

## 📋 **TABLE OF CONTENTS**

1. [Service Issues](#service-issues)
2. [Frontend Issues](#frontend-issues)
3. [Backend Issues](#backend-issues)
4. [Database Issues](#database-issues)
5. [CORS Issues](#cors-issues)
6. [Network Issues](#network-issues)
7. [Permission Issues](#permission-issues)
8. [Performance Issues](#performance-issues)

---

## 🔴 **SERVICE ISSUES**

### **Issue: Service Won't Start**

**Symptoms:**
```bash
systemctl status hrm-backend
# Shows: failed (Result: exit-code)
```

**Diagnosis:**
```bash
# Check logs
journalctl -u hrm-backend -n 50

# Common errors:
# - Port already in use
# - Missing ExecStart
# - Permission denied
# - Node not found
```

**Solutions:**

**Solution 1: Port in use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill it
kill -9 <PID>

# Or change PORT in .env
```

**Solution 2: Missing ExecStart**
```bash
# Run deployment script to fix
cd /opt/skyraksys-hrm/redhatprod/scripts
./fix_deployment_issues.sh
```

**Solution 3: Permission denied**
```bash
# Fix ownership
chown -R hrmapp:hrmapp /opt/skyraksys-hrm

# Fix service file permissions
chmod 644 /etc/systemd/system/hrm-*.service
systemctl daemon-reload
```

---

### **Issue: Service Keeps Restarting**

**Symptoms:**
```bash
systemctl status hrm-backend
# Shows: activating (auto-restart)
```

**Diagnosis:**
```bash
# Check why it's crashing
journalctl -u hrm-backend -f
```

**Common Causes:**
- Database connection failed
- Missing dependencies
- Syntax error in code
- Missing .env file

**Solutions:**

**For database issues:**
```bash
# Check PostgreSQL is running
systemctl status postgresql-15

# Test connection
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT 1;"
```

**For missing dependencies:**
```bash
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npm install
systemctl restart hrm-backend
```

---

## 🎨 **FRONTEND ISSUES**

### **Issue: Blank Page or White Screen**

**Symptoms:**
- Browser shows blank page
- No errors in console (or generic error)

**Diagnosis:**
```bash
# Check if build exists
ls -la /opt/skyraksys-hrm/frontend/build/

# Check build contents
cat /opt/skyraksys-hrm/frontend/build/index.html
```

**Solutions:**

**Solution 1: Build missing or corrupt**
```bash
cd /opt/skyraksys-hrm/frontend
sudo -u hrmapp npm run build
systemctl restart hrm-frontend
```

**Solution 2: Wrong API URL in build**
```bash
# Check API URL
grep -r "REACT_APP_API_URL" /opt/skyraksys-hrm/frontend/build/

# If wrong, fix and rebuild
echo "REACT_APP_API_URL=http://95.216.14.232/api" > .env.production
sudo -u hrmapp npm run build
systemctl restart hrm-frontend
```

---

### **Issue: API Calls Fail (Network Errors)**

**Symptoms:**
- Console shows "Failed to fetch"
- Network tab shows failed requests

**Diagnosis:**
```bash
# Check what URL frontend is calling
# Open DevTools → Network tab
# Click on failed request
# Check Request URL

# Should be: http://95.216.14.232/api/...
# NOT: http://localhost:5000/api/...
```

**Solutions:**

See [CORS Troubleshooting](../cors/CORS-TROUBLESHOOTING.md) for detailed fixes

---

## ⚙️ **BACKEND ISSUES**

### **Issue: 502 Bad Gateway**

**Symptoms:**
- Nginx returns 502 error
- Frontend can't reach backend

**Diagnosis:**
```bash
# Check if backend is running
systemctl status hrm-backend

# Check backend logs
journalctl -u hrm-backend -n 50

# Test backend directly
curl http://localhost:5000/api/health
```

**Solutions:**

**Solution 1: Backend not running**
```bash
systemctl start hrm-backend
systemctl enable hrm-backend
```

**Solution 2: Backend crashed**
```bash
# Check why it crashed
journalctl -u hrm-backend -n 100

# Fix the issue (database, permissions, etc.)
# Then restart
systemctl restart hrm-backend
```

**Solution 3: Wrong port in Nginx**
```bash
# Check Nginx upstream
grep -A 3 "upstream backend" /etc/nginx/conf.d/hrm.conf

# Should be: server 127.0.0.1:5000;
# Fix if needed and reload
nginx -t
systemctl reload nginx
```

---

### **Issue: Database Connection Failed**

**Symptoms:**
- Backend logs show "connect ECONNREFUSED"
- Health endpoint returns error

**Diagnosis:**
```bash
# Check PostgreSQL is running
systemctl status postgresql-15

# Check connection details
cat /opt/skyraksys-hrm/backend/.env | grep DB_
```

**Solutions:**

**Solution 1: PostgreSQL not running**
```bash
systemctl start postgresql-15
systemctl enable postgresql-15
```

**Solution 2: Wrong credentials**
```bash
# Test connection manually
sudo -u postgres psql -d skyraksys_hrm_prod -U hrm_app

# If fails, reset password
sudo -u postgres psql -c "ALTER USER hrm_app WITH PASSWORD 'Kc9nQd4wZx7vUe3pLb2mTa6rYf8sHg1J';"

# Update .env if needed
```

**Solution 3: Database doesn't exist**
```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE skyraksys_hrm_prod;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_app;"

# Restart backend
systemctl restart hrm-backend
```

---

## 🗄️ **DATABASE ISSUES**

### **Issue: Tables Don't Exist**

**Symptoms:**
- Backend logs show "relation does not exist"
- Queries fail

**Solutions:**

**Solution 1: Run migrations**
```bash
cd /opt/skyraksys-hrm/backend
npx sequelize-cli db:migrate

# Restart backend
systemctl restart hrm-backend
```

**Solution 2: Reseed database**
```bash
cd /opt/skyraksys-hrm
node redhatprod/scripts/seedRunner.js
```

---

### **Issue: Permission Denied on Tables**

**Symptoms:**
- Error: "permission denied for table users"

**Solutions:**
```bash
# Grant permissions to hrm_app user
sudo -u postgres psql -d skyraksys_hrm_prod << 'EOF'
GRANT ALL ON SCHEMA public TO hrm_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO hrm_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO hrm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hrm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hrm_app;
EOF

# Restart backend
systemctl restart hrm-backend
```

---

## 🌐 **CORS ISSUES**

See dedicated [CORS Troubleshooting Guide](../cors/CORS-TROUBLESHOOTING.md)

**Quick Fixes:**

1. **TRUST_PROXY not enabled:**
```bash
echo "TRUST_PROXY=true" >> /opt/skyraksys-hrm/backend/.env
systemctl restart hrm-backend
```

2. **Wrong API URL in frontend:**
```bash
cd /opt/skyraksys-hrm/frontend
echo "REACT_APP_API_URL=http://95.216.14.232/api" > .env.production
npm run build
systemctl restart hrm-frontend
```

---

## 🔗 **NETWORK ISSUES**

### **Issue: Can't Access from Browser**

**Symptoms:**
- Browser shows "Connection refused"
- curl from server works, but not from outside

**Diagnosis:**
```bash
# Check if Nginx is listening on port 80
netstat -tlnp | grep :80

# Check firewall
firewall-cmd --list-all
```

**Solutions:**

**Solution 1: Nginx not running**
```bash
systemctl start nginx
systemctl enable nginx
```

**Solution 2: Firewall blocking**
```bash
# Open port 80
firewall-cmd --permanent --add-service=http
firewall-cmd --reload

# Verify
firewall-cmd --list-all
```

**Solution 3: SELinux blocking**
```bash
# Check SELinux status
getenforce

# If enforcing, allow Nginx to connect
setsebool -P httpd_can_network_connect 1
```

---

## 🔐 **PERMISSION ISSUES**

### **Issue: Permission Denied**

**Symptoms:**
- Error: "EACCES: permission denied"
- Can't write to logs or files

**Solutions:**

**Fix application permissions:**
```bash
# Fix ownership
chown -R hrmapp:hrmapp /opt/skyraksys-hrm

# Fix log directory
mkdir -p /var/log/skyraksys-hrm
chown -R hrmapp:hrmapp /var/log/skyraksys-hrm
chmod 755 /var/log/skyraksys-hrm
```

**Fix service file permissions:**
```bash
chmod 644 /etc/systemd/system/hrm-*.service
systemctl daemon-reload
```

---

## 🚀 **PERFORMANCE ISSUES**

### **Issue: Slow Response Times**

**Symptoms:**
- Pages load slowly
- API calls take > 3 seconds

**Diagnosis:**
```bash
# Check system resources
top
free -h
df -h

# Check database connections
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT count(*) FROM pg_stat_activity;"
```

**Solutions:**

**Solution 1: High CPU/Memory**
```bash
# Check what's using resources
top -o %CPU

# If backend is high, restart it
systemctl restart hrm-backend
```

**Solution 2: Database slow**
```bash
# Analyze database
sudo -u postgres psql -d skyraksys_hrm_prod -c "VACUUM ANALYZE;"

# Check for slow queries
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

---

## 📋 **DIAGNOSTIC COMMANDS**

### **Check Everything:**
```bash
# Services
systemctl status hrm-backend hrm-frontend nginx postgresql-15

# Ports
netstat -tlnp | grep -E ':(80|5000|5432) '

# Processes
ps aux | grep -E '(node|nginx|postgres)'

# Logs
journalctl -u hrm-backend -n 20
journalctl -u hrm-frontend -n 20
tail -20 /var/log/nginx/hrm_error.log

# Disk space
df -h

# Memory
free -h
```

---

## 🆘 **EMERGENCY FIXES**

### **Nuclear Option: Complete Reset**

⚠️ **WARNING: This will lose data! Backup first!**

```bash
# Stop everything
systemctl stop hrm-backend hrm-frontend nginx

# Backup
mkdir -p /root/emergency-backup-$(date +%Y%m%d)
cp -r /opt/skyraksys-hrm /root/emergency-backup-$(date +%Y%m%d)/

# Reset database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS skyraksys_hrm_prod;"
sudo -u postgres psql -c "CREATE DATABASE skyraksys_hrm_prod;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_app;"

# Redeploy
cd /opt/skyraksys-hrm/redhatprod/scripts
./fix_deployment_issues.sh

# Reseed
cd /opt/skyraksys-hrm
node redhatprod/scripts/seedRunner.js
```

---

## 🔗 **RELATED DOCS**

- [CORS Troubleshooting](../cors/CORS-TROUBLESHOOTING.md) - CORS-specific issues
- [Post-Deployment Tests](./05-POST-DEPLOYMENT-TESTS.md) - Verify fixes
- [Rollback Procedure](./06-ROLLBACK.md) - Revert changes

---

**Troubleshooting Guide Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** ✅ Complete
