# 🔄 Emergency Rollback Procedure
## Quickly Revert to Previous Working Version

**Last Updated:** October 22, 2025  
**Use When:** Deployment fails or critical issues found  
**Time Required:** 5-10 minutes

---

## 🚨 **WHEN TO ROLLBACK**

Rollback immediately if:
- ❌ Critical functionality is broken
- ❌ Data loss or corruption detected
- ❌ Security vulnerability introduced
- ❌ Application completely down
- ❌ Database migration failed

**Don't rollback for:**
- ✅ Minor UI issues
- ✅ Non-critical bugs
- ✅ Performance degradation (unless severe)
- ✅ Issues that can be hotfixed quickly

---

## 🎯 **ROLLBACK STRATEGY**

### **Quick Rollback (5 minutes):**
1. Restore backup files
2. Restart services
3. Verify system works

### **Full Rollback (10 minutes):**
1. Stop all services
2. Restore all backups
3. Rollback database if needed
4. Restart services
5. Verify and test

---

## ⚡ **QUICK ROLLBACK**

### **Step 1: Stop Services**

```bash
systemctl stop hrm-frontend
systemctl stop hrm-backend
```

### **Step 2: Restore from Backup**

```bash
# Find latest backup
ls -lt /root/hrm-backup-* | head -n 1

# Set backup directory (use your actual backup dir)
BACKUP_DIR="/root/hrm-backup-20251022-103000"

# Restore service files
cp $BACKUP_DIR/hrm-backend.service /etc/systemd/system/
cp $BACKUP_DIR/hrm-frontend.service /etc/systemd/system/

# Restore environment files
cp $BACKUP_DIR/.env.production /opt/skyraksys-hrm/frontend/
cp $BACKUP_DIR/ecosystem.config.js /opt/skyraksys-hrm/

# Reload systemd
systemctl daemon-reload
```

### **Step 3: Restart Services**

```bash
systemctl start hrm-backend
systemctl start hrm-frontend

# Verify they're running
systemctl status hrm-backend
systemctl status hrm-frontend
```

### **Step 4: Quick Verify**

```bash
# Test backend
curl http://95.216.14.232/api/health

# Test frontend
curl -I http://95.216.14.232

# Expected: Both should respond 200 OK
```

**✅ If working:** Rollback complete  
**❌ If not working:** Proceed to Full Rollback

---

## 🔄 **FULL ROLLBACK**

### **Step 1: Stop Everything**

```bash
systemctl stop hrm-frontend
systemctl stop hrm-backend
systemctl stop nginx
```

### **Step 2: Backup Current State (Just in Case)**

```bash
mkdir -p /root/hrm-failed-$(date +%Y%m%d-%H%M%S)
FAILED_DIR="/root/hrm-failed-$(date +%Y%m%d-%H%M%S)"

cp -r /opt/skyraksys-hrm/backend $FAILED_DIR/
cp -r /opt/skyraksys-hrm/frontend $FAILED_DIR/
cp /etc/systemd/system/hrm-*.service $FAILED_DIR/
```

### **Step 3: Restore Application Code**

**Option A: From Git**
```bash
cd /opt/skyraksys-hrm
git log --oneline -10  # Find last working commit
git reset --hard <commit-hash>
git clean -fd
```

**Option B: From Manual Backup**
```bash
# If you have a full backup
cd /opt/skyraksys-hrm
rm -rf backend frontend
cp -r /backup/backend .
cp -r /backup/frontend .
chown -R hrmapp:hrmapp backend frontend
```

### **Step 4: Rebuild Frontend**

```bash
cd /opt/skyraksys-hrm/frontend
sudo -u hrmapp npm run build
```

### **Step 5: Restore Database (If Needed)**

**⚠️ Only if database migration failed!**

```bash
# List available backups
sudo -u postgres psql -c "\l+"

# Restore from backup
sudo -u postgres pg_restore -d skyraksys_hrm_prod /backup/database_backup.dump

# Or restore from SQL dump
sudo -u postgres psql skyraksys_hrm_prod < /backup/database_backup.sql
```

### **Step 6: Restart All Services**

```bash
# Reload systemd
systemctl daemon-reload

# Start services
systemctl start hrm-backend
systemctl start hrm-frontend
systemctl start nginx

# Enable on boot
systemctl enable hrm-backend
systemctl enable hrm-frontend
```

### **Step 7: Verify Everything**

```bash
# Check services
systemctl status hrm-backend
systemctl status hrm-frontend
systemctl status nginx

# Test backend
curl http://95.216.14.232/api/health

# Test frontend
curl -I http://95.216.14.232

# Test login
curl -X POST http://95.216.14.232/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Kx9mP7qR2nF8sA5t"}'
```

---

## 📋 **ROLLBACK CHECKLIST**

### **Before Rollback:**
- [ ] Identify what's broken
- [ ] Find latest backup directory
- [ ] Notify team (if applicable)
- [ ] Document the issue

### **During Rollback:**
- [ ] Stop all services
- [ ] Restore from backups
- [ ] Reload configurations
- [ ] Restart services

### **After Rollback:**
- [ ] Verify services running
- [ ] Test critical functionality
- [ ] Check logs for errors
- [ ] Notify team that rollback is complete

---

## 🗄️ **DATABASE ROLLBACK**

### **Check If Database Needs Rollback:**

```bash
# Check recent migrations
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT * FROM SequelizeMeta ORDER BY name DESC LIMIT 5;"
```

### **Rollback Last Migration:**

```bash
cd /opt/skyraksys-hrm/backend
npx sequelize-cli db:migrate:undo
```

### **Rollback Multiple Migrations:**

```bash
# Rollback last 3 migrations
npx sequelize-cli db:migrate:undo --step 3
```

### **Rollback to Specific Migration:**

```bash
npx sequelize-cli db:migrate:undo:all --to XXXXXXXXXXXXXX-migration-name.js
```

---

## 🔍 **POST-ROLLBACK VERIFICATION**

### **Test 1: Services Running**
```bash
systemctl status hrm-backend hrm-frontend nginx
```

### **Test 2: API Works**
```bash
curl http://95.216.14.232/api/health
```

### **Test 3: Frontend Loads**
```bash
curl -I http://95.216.14.232
```

### **Test 4: Login Works**
```bash
# Open browser: http://95.216.14.232
# Login with: admin@company.com / Kx9mP7qR2nF8sA5t
```

### **Test 5: No Errors in Logs**
```bash
journalctl -u hrm-backend -n 50 --no-pager
journalctl -u hrm-frontend -n 50 --no-pager
tail -n 50 /var/log/nginx/hrm_error.log
```

---

## 📊 **COMMON ROLLBACK SCENARIOS**

### **Scenario 1: Frontend Build Failed**

**Issue:** `npm run build` failed or produced bad build

**Rollback:**
```bash
# Restore previous build
cp -r /opt/skyraksys-hrm/frontend/build_backup /opt/skyraksys-hrm/frontend/build
systemctl restart hrm-frontend
```

---

### **Scenario 2: Database Migration Failed**

**Issue:** Migration broke database schema

**Rollback:**
```bash
# Undo migration
cd /opt/skyraksys-hrm/backend
npx sequelize-cli db:migrate:undo

# Restart backend
systemctl restart hrm-backend
```

---

### **Scenario 3: Config File Corruption**

**Issue:** Bad configuration in .env or service files

**Rollback:**
```bash
# Find backup
BACKUP_DIR="/root/hrm-backup-20251022-103000"

# Restore configs
cp $BACKUP_DIR/.env.production /opt/skyraksys-hrm/frontend/
cp $BACKUP_DIR/ecosystem.config.js /opt/skyraksys-hrm/
cp $BACKUP_DIR/hrm-backend.service /etc/systemd/system/
cp $BACKUP_DIR/hrm-frontend.service /etc/systemd/system/

# Apply
systemctl daemon-reload
systemctl restart hrm-backend hrm-frontend
```

---

### **Scenario 4: Dependencies Broke**

**Issue:** npm install introduced breaking changes

**Rollback:**
```bash
# Restore package-lock.json from backup
cd /opt/skyraksys-hrm/backend
git checkout HEAD -- package-lock.json
sudo -u hrmapp npm ci  # Clean install

cd /opt/skyraksys-hrm/frontend
git checkout HEAD -- package-lock.json
sudo -u hrmapp npm ci
sudo -u hrmapp npm run build

# Restart
systemctl restart hrm-backend hrm-frontend
```

---

## 🛡️ **PREVENT FUTURE ROLLBACKS**

### **Best Practices:**
1. ✅ Always backup before deployment
2. ✅ Test in staging environment first
3. ✅ Use git tags for releases
4. ✅ Document all changes
5. ✅ Have rollback plan ready
6. ✅ Monitor logs during deployment
7. ✅ Verify immediately after deployment

### **Backup Strategy:**
```bash
# Before any deployment, run:
./redhatprod/scripts/fix_deployment_issues.sh

# This automatically creates backups in:
# /root/hrm-backup-YYYYMMDD-HHMMSS/
```

---

## 🆘 **EMERGENCY CONTACTS**

If rollback fails, escalate to:

1. **System Administrator**
2. **Database Administrator**
3. **Development Team Lead**

**Provide:**
- Error logs
- What was changed
- What was attempted
- Backup locations

---

## 🔗 **RELATED DOCS**

- [Post-Deployment Tests](./05-POST-DEPLOYMENT-TESTS.md) - Verify after rollback
- [Troubleshooting Guide](./08-TROUBLESHOOTING.md) - Fix issues
- [Step-by-Step Guide](./02-STEP-BY-STEP-GUIDE.md) - Fresh deployment

---

## ⚠️ **IMPORTANT NOTES**

1. **Always backup before rollback** - You might need current state later
2. **Test after rollback** - Ensure system is actually working
3. **Document everything** - What went wrong, how you fixed it
4. **Don't panic** - Rollback is designed to be safe and quick
5. **Learn from it** - Update deployment process to prevent recurrence

---

**Rollback Procedure Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** ✅ Tested & Ready
