# Skyraksys HRM - Quick Deployment Checklist
## For Server: 95.216.14.232

**⚡ Quick Reference - All configurations are pre-set!**

---

## ✅ **PRE-FLIGHT CHECK** (5 minutes)

```bash
# On server 95.216.14.232 as root:

# 1. Check Node.js
node --version  # Should be 18+

# 2. Check PostgreSQL
systemctl status postgresql-15

# 3. Check Nginx
nginx -v

# 4. Check disk space
df -h  # Should have at least 2GB free
```

---

## 🚀 **DEPLOYMENT IN 10 STEPS** (30 minutes)

### 1️⃣ CREATE DIRECTORIES (1 min)
```bash
mkdir -p /opt/skyraksys-hrm
useradd -r -s /bin/bash -d /home/hrmapp -m hrmapp
chown -R hrmapp:hrmapp /opt/skyraksys-hrm
```

### 2️⃣ TRANSFER CODE (5 min)
From Windows machine:
```cmd
cd d:\skyraksys_hrm
scp -r backend frontend redhatprod ecosystem.config.js root@95.216.14.232:/opt/skyraksys-hrm/
```

### 3️⃣ SET PERMISSIONS (1 min)
```bash
chown -R hrmapp:hrmapp /opt/skyraksys-hrm
chmod +x /opt/skyraksys-hrm/redhatprod/scripts/*.sh
```

### 4️⃣ SETUP DATABASE (3 min)
```bash
sudo -i -u postgres
psql -c "CREATE USER hrm_app WITH PASSWORD 'Kc9nQd4wZx7vUe3pLb2mTa6rYf8sHg1J';"
psql -c "CREATE DATABASE skyraksys_hrm_prod OWNER hrm_app;"
psql -c "GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_app;"
psql -d skyraksys_hrm_prod -c "GRANT ALL ON SCHEMA public TO hrm_app;"
psql -d skyraksys_hrm_prod -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hrm_app;"
psql -d skyraksys_hrm_prod -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hrm_app;"
exit
```

### 5️⃣ INSTALL DEPENDENCIES (5 min)
```bash
# Backend
su - hrmapp
cd /opt/skyraksys-hrm/backend
npm install
exit

# Frontend
su - hrmapp
cd /opt/skyraksys-hrm/frontend
npm install
exit

# Global tools
npm install -g pm2 serve@14
```

### 6️⃣ BUILD FRONTEND (3 min)
```bash
su - hrmapp
cd /opt/skyraksys-hrm/frontend
npm run build
exit
```

### 7️⃣ RUN DEPLOYMENT SCRIPT (5 min)
```bash
cd /opt/skyraksys-hrm/redhatprod/scripts
./fix_deployment_issues.sh
# Choose option 1 (Systemd) or 2 (PM2)
```

### 8️⃣ CONFIGURE NGINX (2 min)
```bash
dnf install -y nginx
cp /opt/skyraksys-hrm/redhatprod/configs/nginx-hrm-static.95.216.14.232.conf /etc/nginx/conf.d/hrm.conf
nginx -t
systemctl enable nginx
systemctl start nginx
```

### 9️⃣ CONFIGURE FIREWALL (1 min)
```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --reload
```

### 🔟 SEED DEMO DATA (2 min)
```bash
su - hrmapp
cd /opt/skyraksys-hrm/backend
node scripts/seedRunner.js
exit
```

---

## ✅ **VERIFICATION** (2 minutes)

```bash
# Test backend
curl http://localhost:5000/api/health
# Expected: {"status":"ok",...}

# Test frontend  
curl http://localhost:3000
# Expected: HTML content

# Test Nginx proxy
curl http://95.216.14.232/api/health
# Expected: {"status":"ok",...}

# Check services
systemctl status hrm-backend hrm-frontend nginx
# All should be: active (running)
```

---

## 🌐 **ACCESS APPLICATION**

**URL:** http://95.216.14.232

**Login Credentials:**
- **Admin:** `admin@company.com` / `Kx9mP7qR2nF8sA5t`
- **Simple:** `prodadmin@company.com` / `admin`

---

## 📊 **MONITORING**

```bash
# View logs (Systemd)
journalctl -u hrm-backend -f
journalctl -u hrm-frontend -f

# View logs (PM2)
pm2 logs

# Check status
systemctl status hrm-backend hrm-frontend nginx

# Or with PM2
pm2 status
```

---

## 🔧 **QUICK FIXES**

### Backend not starting?
```bash
journalctl -u hrm-backend -n 50
systemctl restart hrm-backend
```

### Frontend not loading?
```bash
systemctl restart hrm-frontend nginx
```

### Database connection error?
```bash
systemctl restart postgresql-15
systemctl restart hrm-backend
```

### Can't access from browser?
```bash
# Check firewall
firewall-cmd --list-all

# Check Nginx
systemctl status nginx
nginx -t
```

---

## 📁 **KEY FILES & PORTS**

| Component | Location | Port |
|-----------|----------|------|
| Backend | /opt/skyraksys-hrm/backend | 5000 |
| Frontend | /opt/skyraksys-hrm/frontend | 3000 |
| Nginx | /etc/nginx/conf.d/hrm.conf | 80 |
| Backend .env | /opt/skyraksys-hrm/backend/.env | - |
| Frontend .env | /opt/skyraksys-hrm/frontend/.env.production | - |
| Logs | /var/log/skyraksys-hrm/ | - |

**API URL (Production):** `http://95.216.14.232/api`  
**Database:** `skyraksys_hrm_prod` on `localhost:5432`

---

## 🆘 **EMERGENCY ROLLBACK**

If something goes wrong:
```bash
# Stop all services
systemctl stop hrm-backend hrm-frontend nginx

# Restore from backup (created by fix script)
ls /root/hrm-backup-*
cp /root/hrm-backup-*/hrm-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl start hrm-backend hrm-frontend
```

---

## ✅ **SUCCESS INDICATORS**

- ✅ Login page loads at http://95.216.14.232
- ✅ Can login with demo credentials
- ✅ Dashboard displays after login
- ✅ No red errors in browser console (F12)
- ✅ All services show "active (running)"
- ✅ Logs show no critical errors

---

## 📞 **GET HELP**

**Check full guide:** `PRODUCTION_DEPLOYMENT_STEP_BY_STEP.md`

**View detailed logs:**
```bash
# Backend
journalctl -u hrm-backend -n 100

# Frontend  
journalctl -u hrm-frontend -n 100

# Nginx
tail -100 /var/log/nginx/hrm_error.log
```

---

**Total Time:** ~30-45 minutes  
**Difficulty:** Novice-friendly  
**All configs:** Pre-configured ✅

🎉 **You're ready to deploy!**
