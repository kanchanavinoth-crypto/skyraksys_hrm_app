# 🚀 SkyrakSys HRM Production Deployment - Quick Reference

## ⚡ FASTEST DEPLOYMENT OPTIONS

### **Option 1: Direct from GitHub** ⭐ **RECOMMENDED**
```bash
ssh root@95.216.14.232
curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/deploy-from-github.sh | bash
```
✅ **One command deploys everything**  
✅ **Always gets latest code**  
✅ **No file management needed**

### **Option 2: Git Clone + Deploy**
```bash
ssh root@95.216.14.232
cd /opt/skyraksys-hrm
git clone https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git
cd skyraksys_hrm_app
chmod +x *.sh
./FINAL-PRODUCTION-DEPLOY.sh
```

### **Option 3: Update Existing Setup**
```bash
ssh root@95.216.14.232
cd /opt/skyraksys-hrm/skyraksys_hrm_app
git pull origin master
chmod +x *.sh
./master-deploy.sh
```

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

### Deploy from GitHub (Recommended)
```bash
curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/deploy-from-github.sh | bash
```

### Update & Deploy
```bash
cd /opt/skyraksys-hrm/skyraksys_hrm_app && git pull origin master && ./master-deploy.sh
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