# 🚀 Server-Side Git Deployment Instructions

## 🛡️ **100% SAFE - Your Configs Are Preserved**

This deployment method **GUARANTEES** that all your existing production configurations remain intact:

### ✅ **What Gets Preserved**
- ✅ **Backend .env file** (database credentials, secrets)
- ✅ **Nginx configuration** (only updated if new version tests successfully)
- ✅ **Systemd service config** (only updated if different)
- ✅ **Uploads directory** (all user uploaded files)
- ✅ **Log files** (application logs)
- ✅ **Custom configurations** (any local modifications)
- ✅ **Database data** (completely untouched)

### 🔄 **What Gets Updated**
- ✅ **Application code** (frontend/backend JavaScript)
- ✅ **Dependencies** (npm packages)
- ✅ **Database schema** (via migrations - safe)
- ✅ **Performance monitoring** (new features)

---

## 🖥️ **Method 1: Deploy from Server (Recommended)**

SSH to your production server and run:

```bash
# Connect to your RHEL server
ssh root@95.216.14.232

# Download the deployment script
cd /tmp
wget https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/redhatprod/scripts/deploy-from-git.sh

# Make executable and run
chmod +x deploy-from-git.sh
bash deploy-from-git.sh
```

**OR** if you have the code already on server:

```bash
# If you already have the project on server
ssh root@95.216.14.232
cd /opt/skyraksys-hrm/skyraksys_hrm_app/redhatprod/scripts
bash deploy-from-git.sh
```

---

## 🔧 **Method 2: Manual Git Update (Step by Step)**

If you prefer to see each step:

```bash
# 1. Connect to server
ssh root@95.216.14.232

# 2. Backup current config (safety first!)
mkdir -p /opt/skyraksys-hrm/backups/manual-$(date +%Y%m%d_%H%M%S)
cp /opt/skyraksys-hrm/skyraksys_hrm_app/backend/.env /opt/skyraksys-hrm/backups/manual-$(date +%Y%m%d_%H%M%S)/

# 3. Stop services
systemctl stop skyraksys-hrm-backend nginx

# 4. Update code from Git
cd /opt/skyraksys-hrm/skyraksys_hrm_app
git stash  # Preserve any local changes
git pull origin master

# 5. Backend update
cd backend
sudo -u skyraksys npm install --production
sudo -u skyraksys npx sequelize-cli db:migrate

# 6. Frontend update  
cd ../frontend
sudo -u skyraksys npm install
sudo -u skyraksys npm run build
cp -r build/* /var/www/html/hrm/
chown -R nginx:nginx /var/www/html/hrm

# 7. Start services
systemctl start skyraksys-hrm-backend nginx

# 8. Verify
curl http://localhost:3001/api/health
curl http://localhost/
```

---

## 🔍 **Method 3: Copy Script to Server**

Copy the deployment script to your server:

```bash
# From your local machine, copy the script
scp skyraksys_hrm_app/redhatprod/scripts/deploy-from-git.sh root@95.216.14.232:/tmp/

# Then on server
ssh root@95.216.14.232
chmod +x /tmp/deploy-from-git.sh
bash /tmp/deploy-from-git.sh
```

---

## 🛡️ **Safety Features Built-In**

### **Automatic Backups**
Every deployment creates timestamped backups:
- Configuration files → `/opt/skyraksys-hrm/backups/`
- System configs → Automatically backed up before changes
- Rollback ready → Can restore from any backup

### **Configuration Testing**
- **Nginx config**: Tested before deployment, reverted if invalid
- **Service files**: Only updated if different from current
- **Database**: Migrations are reversible and safe

### **Service Management**
- **Graceful shutdown**: Services stopped properly
- **Health checks**: Verified after deployment
- **Automatic restart**: Services restarted in correct order

### **Error Handling**
- **Rollback capability**: Restore from backup if issues
- **Detailed logging**: All actions logged for troubleshooting
- **Status validation**: Each step verified before proceeding

---

## 📊 **What You Get After Deployment**

### **New Features Available**
- 📈 **Performance Dashboard**: Real-time server metrics for admins
- ⚡ **Manager Quick Actions**: Fast access to approvals
- 🎨 **Minimalistic UI**: Cleaner, faster interfaces
- 🔍 **Enhanced Monitoring**: RHEL-specific system metrics
- 🛡️ **Better Security**: Improved role-based access

### **Admin Features**
- **Server Performance**: CPU, memory, database metrics
- **RHEL Monitoring**: OS version, load average, disk usage
- **Real-time Data**: Auto-refreshing performance dashboard
- **System Health**: Comprehensive service monitoring

### **All Users**
- **Client Performance**: Browser metrics and load times
- **Improved Speed**: Optimized UI components
- **Better Navigation**: Enhanced dashboard layouts

---

## 🚨 **Troubleshooting**

### If Deployment Fails:
```bash
# Check service status
systemctl status skyraksys-hrm-backend nginx postgresql

# View logs
journalctl -u skyraksys-hrm-backend -n 20
journalctl -u nginx -n 20

# Rollback if needed
cd /opt/skyraksys-hrm/backups
ls -la  # Find latest backup
# Restore configs from backup directory
```

### If Services Won't Start:
```bash
# Check configuration
nginx -t  # Test nginx config
sudo -u skyraksys node -c  # Test backend config

# Check permissions
chown -R skyraksys:skyraksys /opt/skyraksys-hrm/skyraksys_hrm_app
chown -R nginx:nginx /var/www/html/hrm

# Restart services
systemctl restart skyraksys-hrm-backend nginx
```

---

## ✅ **Recommended Approach**

**Use Method 1 (deploy-from-git.sh)** because it:
- ✅ Preserves ALL your existing configurations
- ✅ Creates automatic backups
- ✅ Tests configurations before applying
- ✅ Provides detailed logging and status
- ✅ Handles errors gracefully
- ✅ Verifies health after deployment

**Estimated Time**: 5-10 minutes
**Downtime**: 2-3 minutes during service restart
**Risk Level**: Very Low (extensive safety measures)

Your production environment and all configurations will be completely safe! 🛡️