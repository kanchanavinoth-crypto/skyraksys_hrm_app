# 🚀 Quick Start - Deploy in 5 Minutes
## Skyraksys HRM - Fastest Way to Production

**Time Required:** 5 minutes  
**Difficulty:** Easy  
**Prerequisites:** Server access, code files

---

## ⚡ **ONE-COMMAND DEPLOYMENT**

### **Step 1: Transfer Files (1 minute)**
```bash
# On Windows, open CMD or PowerShell
scp -r backend frontend redhatprod ecosystem.config.js root@95.216.14.232:/opt/skyraksys-hrm/
```

### **Step 2: Deploy (3 minutes)**
```bash
# Connect to server
ssh root@95.216.14.232

# Run deployment script
cd /opt/skyraksys-hrm/redhatprod/scripts
chmod +x fix_deployment_issues.sh
./fix_deployment_issues.sh
```

### **Step 3: Access (1 minute)**
```bash
# Open browser
http://95.216.14.232

# Login with:
Email: admin@company.com
Password: Kx9mP7qR2nF8sA5t
```

---

## ✅ **THAT'S IT!**

The deployment script automatically:
- ✅ Configures all environment files
- ✅ Builds frontend with correct API URL
- ✅ Creates systemd services
- ✅ Starts all services
- ✅ Verifies everything works

---

## 🔍 **VERIFY DEPLOYMENT**

```bash
# Check if backend is running
curl http://95.216.14.232/api/health

# Expected: {"status":"ok"}
```

---

## ⚠️ **IF ISSUES OCCUR**

See detailed guides:
- [Step-by-Step Guide](./02-STEP-BY-STEP-GUIDE.md)
- [Troubleshooting](./08-TROUBLESHOOTING.md)
- [CORS Issues](../cors/CORS-TROUBLESHOOTING.md)

---

**Next:** [Complete Step-by-Step Guide](./02-STEP-BY-STEP-GUIDE.md)
