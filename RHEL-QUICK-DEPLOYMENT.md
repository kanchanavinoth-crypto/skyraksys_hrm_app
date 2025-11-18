# 🚀 RHEL Quick Deployment Guide - After Git Upload

## ⚡ FASTEST DEPLOYMENT (One Command)

After uploading your project to Git, deploy with **ONE COMMAND**:

```bash
# SSH to your RHEL server
ssh root@95.216.14.232

# Deploy instantly from Git
curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/rhel-quick-deploy.sh | bash
```

## 🔧 BEFORE DEPLOYMENT: Update Configuration

**⚠️ IMPORTANT**: The deployment script is already configured with your production values:

```bash
# 1. GitHub Repository URL
GITHUB_REPO="https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git"

# 2. Database Configuration  
DB_PASSWORD="SkyRakDB#2025!Prod@HRM$Secure"

# 3. Server Domain/IP
DOMAIN="95.216.14.232"

# 4. JWT Secret (production-ready)
JWT_SECRET="SkyRakHRM#2025!JWT@Prod$SecureKey#Authentication"
```

## 🎯 DEPLOYMENT OPTIONS

### Option 1: Direct GitHub Deployment ⭐ **RECOMMENDED**
```bash
# Single command - downloads and runs everything
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/skyraksys_hrm_app/master/rhel-quick-deploy.sh | bash
```

### Option 2: Git Clone + Deploy
```bash
# Manual clone then deploy
cd /opt
git clone https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git
cd skyraksys_hrm_app
chmod +x rhel-quick-deploy.sh
./rhel-quick-deploy.sh
```

### Option 3: Using Existing Deployment Scripts
```bash
# Use your existing production scripts
cd /opt
git clone https://github.com/YOUR_USERNAME/skyraksys_hrm_app.git
cd skyraksys_hrm_app
chmod +x *.sh

# Choose one:
./FINAL-PRODUCTION-DEPLOY.sh    # Complete setup with options
./master-deploy.sh              # Automated deployment
./deploy-from-github.sh         # GitHub-specific deployment
```

## 📋 STEP-BY-STEP DEPLOYMENT PROCESS

### 1. Upload to GitHub
```bash
# In your local project directory
git add .
git commit -m "Production ready deployment"
git push origin master
```

### 2. Deploy on RHEL Server (No Configuration Needed!)
```bash
# Method 1: Direct deployment (fastest) - READY TO USE!
ssh root@95.216.14.232
curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/rhel-quick-deploy.sh | bash

# Method 2: Manual deployment
ssh root@95.216.14.232
cd /opt
git clone https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git
cd skyraksys_hrm_app
chmod +x rhel-quick-deploy.sh
./rhel-quick-deploy.sh
```

**✅ All settings are already configured with your production values!**

## 🛠️ WHAT THE DEPLOYMENT SCRIPT DOES

The `rhel-quick-deploy.sh` script automatically:

1. ✅ **System Setup**
   - Installs Node.js 18.x, PostgreSQL, Nginx
   - Installs PM2 process manager
   - Updates system packages

2. ✅ **Database Configuration**
   - Initializes PostgreSQL
   - Creates production database and user
   - Sets up proper permissions

3. ✅ **Application Deployment**
   - Clones/updates from Git repository
   - Installs backend dependencies
   - Builds frontend for production
   - Runs database migrations

4. ✅ **Service Configuration**
   - Configures Nginx as reverse proxy
   - Sets up PM2 for process management
   - Configures automatic startup
   - Opens firewall ports

5. ✅ **Production Optimization**
   - Enables gzip compression
   - Sets security headers
   - Configures logging
   - Optimizes for performance

## 🔍 POST-DEPLOYMENT VERIFICATION

After deployment, verify everything works:

```bash
# Check application status
pm2 status

# View application logs
pm2 logs skyraksys-hrm

# Test API health
curl http://your-server-ip/api/health

# Check Nginx status
systemctl status nginx

# View deployment logs
tail -f /var/log/skyraksys-deployment.log
```

## 🚨 TROUBLESHOOTING

### If deployment fails:
```bash
# Check logs
tail -100 /var/log/skyraksys-deployment.log

# Check PM2 status
pm2 status
pm2 logs

# Check Nginx
systemctl status nginx
nginx -t

# Check database connection
sudo -u postgres psql -d skyraksys_hrm_prod -c "\\dt"
```

### Common fixes:
```bash
# Restart services
systemctl restart nginx
pm2 restart skyraksys-hrm

# Fix permissions
cd /opt/skyraksys_hrm_app
chown -R root:root .
chmod +x *.sh

# Update from Git
cd /opt/skyraksys_hrm_app
git pull origin master
pm2 restart skyraksys-hrm
```

## 🔄 UPDATING AFTER DEPLOYMENT

To update your application after making changes:

```bash
# SSH to server
ssh root@your-server-ip

# Navigate to app directory
cd /opt/skyraksys_hrm_app

# Pull latest changes
git pull origin master

# Rebuild frontend if needed
cd frontend && npm run build

# Restart application
pm2 restart skyraksys-hrm

# Or use the update script if available
./master-deploy.sh
```

## 🎯 PRODUCTION URLS

After deployment, your application will be available at:

- **Main Application**: `http://your-domain-or-ip/`
- **API Health Check**: `http://your-domain-or-ip/api/health`
- **Admin Panel**: `http://your-domain-or-ip/admin`
- **Email Configuration**: `http://your-domain-or-ip/email-configuration` (admin only)

## 📞 NEED HELP?

If you encounter issues:

1. **Check the deployment logs**: `/var/log/skyraksys-deployment.log`
2. **Review PM2 logs**: `pm2 logs skyraksys-hrm`
3. **Verify configuration files** in the app directory
4. **Test database connectivity**
5. **Check firewall settings**

## 🏆 PRODUCTION READY!

Your SkyrakSys HRM application is now:
- ✅ Running on RHEL in production mode
- ✅ Optimized for performance and security
- ✅ Auto-restarting on failures
- ✅ Logging all activities
- ✅ Using production database
- ✅ Served through Nginx reverse proxy
- ✅ Managed by PM2 process manager

**Deploy once, run forever!** 🚀

---

*Generated for SkyrakSys HRM v3.0 - Production Deployment Guide*