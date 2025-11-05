# Remote Testing Guide - Deploy & Monitor from VS Code

**Test and monitor your production deployment from Visual Studio Code on Windows**

---

## 🎯 Quick Start

### **Step 1: Open VS Code Terminal**
Press `` Ctrl+` `` or go to **Terminal → New Terminal**

### **Step 2: Navigate to Project**
```powershell
cd d:\skyraksys_hrm\redhatprod
```

### **Step 3: Test Connection**
```powershell
.\test-deployment-local.ps1 -Action test-connection
```

### **Step 4: Deploy to Production**
```powershell
.\test-deployment-local.ps1 -Action deploy
```

---

## 📋 Available Commands

### **Connection & Status**

```powershell
# Test SSH connection to server
.\test-deployment-local.ps1 -Action test-connection

# Check all services status (PostgreSQL, Nginx, PM2)
.\test-deployment-local.ps1 -Action status

# Run comprehensive health check
.\test-deployment-local.ps1 -Action health

# Test all web endpoints
.\test-deployment-local.ps1 -Action web-test
```

### **Deployment**

```powershell
# Pull latest code from GitHub to server
.\test-deployment-local.ps1 -Action pull-latest

# Start full deployment (takes 10-15 minutes)
.\test-deployment-local.ps1 -Action deploy
```

### **Log Monitoring**

```powershell
# Stream deployment logs in real-time (Ctrl+C to stop)
.\test-deployment-local.ps1 -Action logs

# View backend application logs
.\test-deployment-local.ps1 -Action backend-logs

# View frontend application logs
.\test-deployment-local.ps1 -Action frontend-logs
```

### **Application Control**

```powershell
# Restart application
.\test-deployment-local.ps1 -Action restart

# Stop application
.\test-deployment-local.ps1 -Action stop

# Start application
.\test-deployment-local.ps1 -Action start
```

### **Database**

```powershell
# Check database connection and tables
.\test-deployment-local.ps1 -Action db-check
```

---

## 🚀 Typical Deployment Workflow

### **First Time Deployment:**

```powershell
# 1. Test connection
.\test-deployment-local.ps1 -Action test-connection
# Expected: "Connection successful!"

# 2. Deploy everything
.\test-deployment-local.ps1 -Action deploy
# This takes 10-15 minutes
# Watch output in terminal

# 3. Check status
.\test-deployment-local.ps1 -Action status
# Expected: All services "active (running)"

# 4. Test endpoints
.\test-deployment-local.ps1 -Action web-test
# Expected: All HTTP Status: 200

# 5. Open browser
start http://95.216.14.232
# Login: admin@example.com / admin123
```

### **Update Existing Deployment:**

```powershell
# 1. Pull latest code
.\test-deployment-local.ps1 -Action pull-latest

# 2. Restart application
.\test-deployment-local.ps1 -Action restart

# 3. Check logs
.\test-deployment-local.ps1 -Action backend-logs

# 4. Verify health
.\test-deployment-local.ps1 -Action health
```

### **Troubleshooting:**

```powershell
# 1. Check what's wrong
.\test-deployment-local.ps1 -Action status

# 2. Check logs for errors
.\test-deployment-local.ps1 -Action backend-logs

# 3. Check database
.\test-deployment-local.ps1 -Action db-check

# 4. Try restart
.\test-deployment-local.ps1 -Action restart
```

---

## 📊 Command Reference

| Command | What It Does | When to Use |
|---------|--------------|-------------|
| **test-connection** | Tests SSH to 95.216.14.232 | First step, verify access |
| **deploy** | Full deployment (all 7 steps) | Initial setup or major updates |
| **status** | Shows PostgreSQL, Nginx, PM2 status | Quick health check |
| **health** | Runs comprehensive checks | Detailed diagnosis |
| **logs** | Live deployment log stream | During deployment |
| **backend-logs** | Backend app logs (last 100) | Debug backend issues |
| **frontend-logs** | Frontend app logs (last 100) | Debug frontend issues |
| **db-check** | Database tables & user count | Verify migrations ran |
| **web-test** | Tests all HTTP endpoints | Verify all services respond |
| **restart** | Restarts backend & frontend | After code changes |
| **stop** | Stops application | Maintenance |
| **start** | Starts application | After maintenance |
| **pull-latest** | Git pull on server | Get latest code |

---

## 🔍 Understanding Output

### **Successful Deployment Output:**

```
========================================
SkyrakSys HRM - Remote Deployment Test
========================================

Starting deployment on 95.216.14.232...
This will take 10-15 minutes...

[STEP 1/7] Generating Configuration Files
✓ All configuration files generated automatically

[STEP 2/7] Installing Prerequisites
✓ Node.js 22.x installed
✓ PostgreSQL 17.x installed
✓ Nginx installed

[STEP 3/7] Setting Up Database
✓ Database user created
✓ Migrations completed (11 migrations)
✓ Demo data seeded

[STEP 4/7] Deploying Application
✓ Backend deployed
✓ Frontend built and deployed

[STEP 5/7] Configuring Services
✓ PM2 configured
✓ Services started

[STEP 6/7] Configuring Firewall
✓ Ports opened: 80, 3000, 5000

[STEP 7/7] Running Health Checks
✓ All checks passed

========================================
DEPLOYMENT SUCCESSFUL!
========================================
```

### **Status Check Output:**

```
1. PostgreSQL Status:
active

2. Nginx Status:
active

3. PM2 Applications:
┌─────┬──────────────────────┬─────────┬─────────┐
│ id  │ name                 │ status  │ restart │
├─────┼──────────────────────┼─────────┼─────────┤
│ 0   │ skyraksys-hrm-backend│ online  │ 0       │
│ 1   │ skyraksys-hrm-frontend│ online │ 0       │
└─────┴──────────────────────┴─────────┴─────────┘

4. API Health Check:
{
  "success": true,
  "message": "API is running"
}

5. Open Ports:
80/tcp 3000/tcp 5000/tcp
```

---

## 🛠️ Alternative: Direct SSH from VS Code

### **Method 1: Terminal SSH**

```powershell
# Connect to server
ssh root@95.216.14.232

# Once connected, run commands directly
cd /opt/skyraksys-hrm/redhatprod/scripts
bash deploy.sh 95.216.14.232

# Monitor logs
tail -f /var/log/skyraksys-hrm/deployment.log

# Exit SSH
exit
```

### **Method 2: VS Code Remote-SSH Extension**

1. Install extension: **Remote - SSH** (ms-vscode-remote.remote-ssh)
2. Press `F1` → Type "Remote-SSH: Connect to Host"
3. Enter: `root@95.216.14.232`
4. New VS Code window opens connected to server
5. Use terminal directly on server
6. Edit server files in VS Code
7. Full remote development experience

---

## 📝 Common Tasks

### **Monitor Live Deployment:**

```powershell
# Terminal 1: Start deployment
.\test-deployment-local.ps1 -Action deploy

# Terminal 2: Watch logs (open new terminal)
.\test-deployment-local.ps1 -Action logs
```

### **Check Why Backend Won't Start:**

```powershell
# Check status
.\test-deployment-local.ps1 -Action status

# Check backend logs for errors
.\test-deployment-local.ps1 -Action backend-logs

# Check database connection
.\test-deployment-local.ps1 -Action db-check

# Try restart
.\test-deployment-local.ps1 -Action restart
```

### **After Pushing Code Changes:**

```powershell
# 1. Commit and push locally (in VS Code)
git add .
git commit -m "Your changes"
git push origin master

# 2. Pull on server
.\test-deployment-local.ps1 -Action pull-latest

# 3. Restart application
.\test-deployment-local.ps1 -Action restart

# 4. Check logs
.\test-deployment-local.ps1 -Action backend-logs
```

---

## ⚠️ Prerequisites

### **On Your Windows Machine:**

✅ **SSH Client** (built into Windows 10/11)
```powershell
# Test if SSH is available
ssh -V
# Expected: OpenSSH_for_Windows...
```

✅ **PowerShell** (included in VS Code)

✅ **SSH Key or Password for root@95.216.14.232**

### **On Production Server:**

✅ SSH access enabled
✅ Port 22 open in firewall
✅ Root access or sudo privileges

---

## 🔐 First-Time Setup

### **Configure SSH Access:**

If you haven't set up SSH yet:

```powershell
# Generate SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to server (one time)
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@95.216.14.232 "cat >> ~/.ssh/authorized_keys"

# Test connection
ssh root@95.216.14.232 "echo 'Success'"
```

Or use password authentication (you'll be prompted each time).

---

## 🎯 Quick Reference Card

**Print this out and keep next to your desk:**

```
═══════════════════════════════════════════════
 SKYRAKSYS HRM - REMOTE TESTING QUICK REFERENCE
═══════════════════════════════════════════════

SERVER: 95.216.14.232
SCRIPT: .\test-deployment-local.ps1

┌─────────────────────────────────────────────┐
│ MOST USED COMMANDS                          │
├─────────────────────────────────────────────┤
│ Test connection:                            │
│   -Action test-connection                   │
│                                             │
│ Deploy:                                     │
│   -Action deploy                            │
│                                             │
│ Check status:                               │
│   -Action status                            │
│                                             │
│ View logs:                                  │
│   -Action backend-logs                      │
│                                             │
│ Restart:                                    │
│   -Action restart                           │
└─────────────────────────────────────────────┘

AFTER CODE CHANGES:
  1. .\test-deployment-local.ps1 -Action pull-latest
  2. .\test-deployment-local.ps1 -Action restart
  3. .\test-deployment-local.ps1 -Action backend-logs

IF SOMETHING BREAKS:
  1. .\test-deployment-local.ps1 -Action status
  2. .\test-deployment-local.ps1 -Action backend-logs
  3. .\test-deployment-local.ps1 -Action db-check
  4. .\test-deployment-local.ps1 -Action restart

WEB ACCESS:
  URL:   http://95.216.14.232
  Login: admin@example.com
  Pass:  admin123 (change immediately!)

═══════════════════════════════════════════════
```

---

## 💡 Pro Tips

1. **Open Multiple Terminals:**
   - Terminal 1: Run deployment
   - Terminal 2: Monitor logs
   - Terminal 3: Check status

2. **Use Tab Completion:**
   ```powershell
   .\test-deployment-local.ps1 -Action <Tab>
   # Cycles through available actions
   ```

3. **Save Common Commands:**
   Create aliases in PowerShell profile:
   ```powershell
   # Open profile
   notepad $PROFILE
   
   # Add aliases
   function Deploy-HRM { .\redhatprod\test-deployment-local.ps1 -Action deploy }
   function Status-HRM { .\redhatprod\test-deployment-local.ps1 -Action status }
   function Logs-HRM { .\redhatprod\test-deployment-local.ps1 -Action logs }
   ```

4. **Watch Deployment Progress:**
   Open script and see exactly what each action does!

---

## 🆘 Troubleshooting

### **"Cannot connect to server"**
```powershell
# Test network connectivity
ping 95.216.14.232

# Test SSH port
Test-NetConnection -ComputerName 95.216.14.232 -Port 22

# Check if firewall is blocking
# (Check Windows Firewall settings)
```

### **"Permission denied"**
- Check SSH key is loaded
- Verify you have root access
- Try with password: `ssh root@95.216.14.232`

### **"Script not found"**
```powershell
# Make sure you're in the right directory
cd d:\skyraksys_hrm\redhatprod

# Check file exists
ls test-deployment-local.ps1
```

### **"Execution policy error"**
```powershell
# Allow script execution (one time)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📚 Additional Resources

- **Full Deployment Guide:** `redhatprod/START_HERE.md`
- **Manual Installation:** `redhatprod/MANUAL_INSTALLATION_GUIDE.md`
- **Production Secrets:** `redhatprod/PRODUCTION_SECRETS.md`
- **Documentation Review:** `redhatprod/MANUAL_VS_AUTOMATED_REVIEW.md`

---

**Last Updated:** November 5, 2025  
**Script Location:** `d:\skyraksys_hrm\redhatprod\test-deployment-local.ps1`  
**Server:** 95.216.14.232 (RHEL 9.6)

**Happy Deploying!** 🚀


# Test SSH connection
ssh root@95.216.14.232

# Once connected, run deployment
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash deploy.sh 95.216.14.232

# Watch logs in real-time
tail -f /var/log/skyraksys-hrm/deployment.log

Option 2: Use Remote-SSH Extension
Press F1 → "Remote-SSH: Connect to Host"
Enter: root@95.216.14.232
Opens new VS Code window connected to server
Use integrated terminal directly on server
Edit files, view logs, run commands all remotely

 Option 3: Monitor Logs from Local Terminal

 # Stream deployment log
ssh root@95.216.14.232 "tail -f /var/log/skyraksys-hrm/deployment.log"

# Check backend logs
ssh root@95.216.14.232 "pm2 logs skyraksys-hrm-backend --lines 50"

# Check health
ssh root@95.216.14.232 "curl -s http://localhost:5000/api/health"

# Check all services
ssh root@95.216.14.232 "systemctl status postgresql-17 nginx && pm2 status"



Option 4: Create Deployment Test Script
Let me create a local script you can run from VS Code:

Created test-deployment-local.ps1

Perfect! Now you can test from VS Code:

🎯 Quick Start - Test from VS Code Terminal:

# 1. Test connection first
cd d:\skyraksys_hrm\redhatprod
.\test-deployment-local.ps1 -Action test-connection

# 2. Check current status
.\test-deployment-local.ps1 -Action status

# 3. Deploy (full deployment)
.\test-deployment-local.ps1 -Action deploy

# 4. Monitor logs in real-time
.\test-deployment-local.ps1 -Action logs

# 5. Health check
.\test-deployment-local.ps1 -Action health

ommand	Description
test-connection	Test SSH to server
deploy	Start full deployment (10-15 min)
status	Check all services
health	Run health check script
logs	Stream deployment logs
backend-logs	View backend logs
frontend-logs	View frontend logs
db-check	Check database
web-test	Test all endpoints
restart	Restart application
pull-latest	Pull latest code



# Step 1: Test connection
.\test-deployment-local.ps1 -Action test-connection

# Step 2: Pull latest code on server
.\test-deployment-local.ps1 -Action pull-latest

# Step 3: Deploy
.\test-deployment-local.ps1 -Action deploy

# Step 4: Watch it deploy (opens in new terminal)
# Press Ctrl+C to stop watching, deployment continues

# Step 5: Check status
.\test-deployment-local.ps1 -Action status

# Step 6: Verify everything works
.\test-deployment-local.ps1 -Action web-test