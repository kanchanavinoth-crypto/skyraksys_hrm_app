# 🚀 SkyrakSys HRM Production Deployment - Quick Reference

## ⚡ FASTEST DEPLOYMENT OPTIONS

### **Option 1: Ultra-Fast Git Deployment** ⭐ **NEW & READY TO USE**
```bash
ssh root@95.216.14.232
curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/rhel-quick-deploy.sh | bash
```
✅ **Complete RHEL production setup in one command**  
✅ **All settings pre-configured for your server**  
✅ **Production optimized with security headers**

### **Option 2: Existing GitHub Deploy** 
```bash
ssh root@95.216.14.232
curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/deploy-from-github.sh | bash
```
✅ **One command deploys everything**  
✅ **Always gets latest code**  
✅ **No file management needed**

### **Option 3: Git Clone + Deploy**
```bash
ssh root@95.216.14.232
cd /opt
git clone https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git
cd skyraksys_hrm_app
chmod +x *.sh
./rhel-quick-deploy.sh
```

### **Option 4: Quick Update Existing**
```bash
ssh root@95.216.14.232
curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/quick-update.sh | bash
```
✅ **Smart update with automatic backup**  
✅ **Only rebuilds what changed**  
✅ **Rollback if update fails**

## 🎯 DEPLOYMENT SCRIPT CHOICES

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `FINAL-PRODUCTION-DEPLOY.sh` | Complete system with options | First time or full control |
| `master-deploy.sh` | Auto deployment | Regular updates |
| `ultimate-deploy.sh` | Advanced with error recovery | Complex environments |
| `deploy-production.sh` | Guided with validation | When you want guidance |

## 🔧 YOUR PRODUCTION SETUP

- **Server**: 95.216.14.232
- **Database**: skyraksys_hrm_prod  
- **Credentials**: ✅ All verified and consistent
- **Repository**: https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git

## 🎯 QUICK COMMANDS

### ⚡ Ultra-Fast Deployment (READY TO USE!)
```bash
curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/rhel-quick-deploy.sh | bash
```

### 🔄 Quick Update 
```bash
curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/quick-update.sh | bash
```

### 📋 View All Commands
```bash
curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/deployment-commands.sh | bash
```

### Check Status
```bash
pm2 status
curl http://95.216.14.232/api/health
```

### View Logs
```bash
pm2 logs
tail -f logs/*.log
```

## ✅ READY TO DEPLOY!

**Your system is production-ready with GitHub integration!** 🚀

Choose any deployment method above - they all use your actual production credentials and are fully tested.

---
*Quick reference for SkyrakSys HRM deployment* 📋