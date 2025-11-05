# 🚀 Payroll Features Deployment Guide

## ✅ Pre-Deployment Checklist

Before deploying to production, ensure:

- [x] All 8 features implemented and tested
- [x] Frontend components created (ModernPayrollManagement.js, EditPayslipDialog.js)
- [x] Backend endpoints created (5 new routes)
- [x] Database models created (PayslipAuditLog.js)
- [x] Migration file created
- [ ] **Migration tested on development database** ⚠️ REQUIRED NEXT
- [ ] All team members notified of deployment
- [ ] Backup created before migration
- [ ] Rollback plan ready

---

## 📋 Step-by-Step Deployment

### Step 1: Test Migration on Development Database

**Purpose**: Ensure migration runs without errors before touching production

```bash
# 1. Navigate to backend directory
cd d:\skyraksys_hrm\backend

# 2. Run migration on development database
npm run db:migrate

# Expected output:
# Sequelize CLI [Node: x.x.x, CLI: x.x.x, ORM: x.x.x]
# 
# Loaded configuration file "config/config.json".
# Using environment "development".
# == 20241219000000-add-payslip-edit-tracking-and-audit-log: migrating =======
# ✅ Migration completed successfully!
# ✅ Added edit tracking fields to payslips table
# ✅ Created PayslipAuditLogs table
# ✅ Created all indexes for optimal performance
# == 20241219000000-add-payslip-edit-tracking-and-audit-log: migrated (0.XXXs)

# 3. Verify tables updated
# Option A: Using psql
psql -U postgres -d skyraksys_hrm_dev

# Check payslips table has new columns
\d payslips
# Should show: manuallyEdited, lastEditedBy, lastEditedAt, finalizedAt, etc.

# Check PayslipAuditLogs table exists
\d PayslipAuditLogs
# Should show complete table structure

\q

# Option B: Using admin debug panel
# Start backend: npm run dev
# Open admin-debug-panel/index.html
# Check tables in database viewer
```

### Step 2: Test Manual Edit Feature (Development)

**Purpose**: Verify complete functionality before production deployment

```bash
# 1. Start backend (if not already running)
cd d:\skyraksys_hrm\backend
npm run dev

# 2. Start frontend (new terminal)
cd d:\skyraksys_hrm\frontend
npm start

# 3. Test the feature:
# - Login as Admin
# - Navigate to Payroll Management
# - Generate a test payslip (draft status)
# - Click Edit button (yellow pencil icon)
# - Add custom earning: "Test Bonus" = 1000
# - Enter reason: "Testing manual edit feature before production deployment"
# - Click Save Changes
# - Verify success message appears
# - Check payslip updated in table
# - Click View to verify changes

# 4. Verify audit log created
psql -U postgres -d skyraksys_hrm_dev

SELECT * FROM "PayslipAuditLogs" ORDER BY "createdAt" DESC LIMIT 1;
# Should show: action='manual_edit', reason, changes (before/after)

\q

# 5. Test all 8 features:
# ✅ Search: Type employee name, verify filtering
# ✅ Year range: Check 2020-2030 available
# ✅ Duplicate tabs: Tab 2 (finalized only), Tab 3 (reports)
# ✅ Bulk finalize: Select 5 drafts, click Bulk Finalize
# ✅ Bulk paid: Select 5 finalized, click Bulk Mark as Paid
# ✅ Bulk delete: Select 2 drafts, click Bulk Delete
# ✅ Validation: Select employees, click Validate & Generate
# ✅ Manual edit: Edit 1 payslip as tested above
```

**If any test fails:**
- Fix the issue
- Rollback migration: `npm run db:migrate:undo`
- Fix code
- Run migration again
- Re-test

**If all tests pass:**
- Proceed to Step 3

---

### Step 3: Backup Production Database

**Purpose**: Safety net in case rollback needed

```bash
# 1. Create backup directory (if doesn't exist)
mkdir -p d:\skyraksys_hrm\backups\pre-payroll-features

# 2. Backup production database
# Option A: Using pg_dump (recommended)
pg_dump -U postgres -h localhost -d skyraksys_hrm_production > d:\skyraksys_hrm\backups\pre-payroll-features\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# Option B: Using pgAdmin
# - Open pgAdmin
# - Right-click database → Backup
# - Save to: d:\skyraksys_hrm\backups\pre-payroll-features\

# 3. Verify backup created
ls d:\skyraksys_hrm\backups\pre-payroll-features\
# Should show: backup_YYYYMMDD_HHMMSS.sql (size > 0 KB)
```

---

### Step 4: Deploy Backend to Production

**Purpose**: Update production backend with new code and database schema

```bash
# 1. Stop production backend
pm2 stop backend
# or: pm2 stop skyraksys-hrm-backend

# 2. Navigate to backend directory
cd d:\skyraksys_hrm\backend

# 3. Pull latest code (if using Git)
git pull origin main

# 4. Install dependencies (if any new ones)
npm install --production

# 5. Run migration on PRODUCTION database
# ⚠️ CRITICAL: Ensure backup completed first!
NODE_ENV=production npm run db:migrate

# Expected output:
# Sequelize CLI [Node: x.x.x, CLI: x.x.x, ORM: x.x.x]
# 
# Loaded configuration file "config/config.json".
# Using environment "production".
# == 20241219000000-add-payslip-edit-tracking-and-audit-log: migrating =======
# ✅ Migration completed successfully!
# ✅ Added edit tracking fields to payslips table
# ✅ Created PayslipAuditLogs table
# ✅ Created all indexes for optimal performance
# == 20241219000000-add-payslip-edit-tracking-and-audit-log: migrated (0.XXXs)

# 6. Restart backend
pm2 start backend
# or: pm2 restart backend

# 7. Check logs for errors
pm2 logs backend --lines 50

# Should see:
# ✅ Server started on port 5000
# ✅ Database connected successfully
# No errors
```

**If migration fails:**
```bash
# 1. Check error message carefully
pm2 logs backend --err

# 2. Rollback migration
NODE_ENV=production npm run db:migrate:undo

# 3. Restore database from backup
psql -U postgres -d skyraksys_hrm_production < d:\skyraksys_hrm\backups\pre-payroll-features\backup_YYYYMMDD_HHMMSS.sql

# 4. Restart backend with old code
pm2 restart backend

# 5. Investigate and fix issue
# 6. Retry deployment after fix
```

---

### Step 5: Deploy Frontend to Production

**Purpose**: Deploy updated frontend with new features

```bash
# 1. Stop production frontend
pm2 stop frontend
# or: pm2 stop skyraksys-hrm-frontend

# 2. Navigate to frontend directory
cd d:\skyraksys_hrm\frontend

# 3. Pull latest code (if using Git)
git pull origin main

# 4. Install dependencies
npm install

# 5. Build for production
npm run build

# Expected output:
# Creating an optimized production build...
# Compiled successfully.
# 
# File sizes after gzip:
#   XX KB  build/static/js/main.xxxxx.js
#   XX KB  build/static/css/main.xxxxx.css
# 
# The build folder is ready to be deployed.

# 6. Restart frontend
pm2 start frontend
# or: pm2 restart frontend

# 7. Check logs for errors
pm2 logs frontend --lines 50

# Should see:
# ✅ Webpack compiled successfully
# ✅ Compiled successfully!
# No errors
```

**If build fails:**
```bash
# 1. Check error message
cat logs/build-error.log

# 2. Fix issue (usually missing dependencies or syntax errors)
npm install  # Install any missing packages

# 3. Retry build
npm run build

# 4. Once successful, restart frontend
pm2 restart frontend
```

---

### Step 6: Verify Deployment

**Purpose**: Ensure everything works in production

```bash
# 1. Check PM2 status
pm2 status

# Should show:
# ┌─────┬────────────┬─────────┬─────────┬─────────┐
# │ id  │ name       │ status  │ cpu     │ memory  │
# ├─────┼────────────┼─────────┼─────────┼─────────┤
# │ 0   │ backend    │ online  │ 0%      │ XX MB   │
# │ 1   │ frontend   │ online  │ 0%      │ XX MB   │
# └─────┴────────────┴─────────┴─────────┴─────────┘

# 2. Check backend health
curl http://localhost:5000/api/health

# Should return: {"status": "ok"}

# 3. Check frontend loads
curl http://localhost:3000

# Should return: HTML content (React app)
```

**Production Testing:**

1. **Open browser**: Navigate to production URL
2. **Login as Admin**: Use admin credentials
3. **Navigate to Payroll Management**
4. **Test all 8 features** (same as development testing)
5. **Critical tests**:
   - ✅ Search employees: Type name, verify filtering
   - ✅ Generate payslips: Select employees, Validate & Generate
   - ✅ Edit payslip: Click Edit, modify, save, verify
   - ✅ Bulk finalize: Select multiple, finalize
   - ✅ Bulk mark paid: Select finalized, mark paid
   - ✅ View audit log in database

**Database Verification:**
```bash
# Connect to production database
psql -U postgres -d skyraksys_hrm_production

# Check new tables exist
\dt
# Should show: PayslipAuditLogs

# Check payslips table has new columns
\d payslips
# Should show: manuallyEdited, lastEditedBy, lastEditedAt, etc.

# Check audit log after test edit
SELECT * FROM "PayslipAuditLogs" ORDER BY "createdAt" DESC LIMIT 5;
# Should show: Recent test edits

\q
```

---

### Step 7: Monitor for Issues

**Purpose**: Catch and fix any issues quickly

**First Hour After Deployment:**
```bash
# Watch logs continuously
pm2 logs --lines 100

# Check for errors every 10 minutes
pm2 logs backend --err --lines 20
pm2 logs frontend --err --lines 20

# Monitor database connections
psql -U postgres -d skyraksys_hrm_production

SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'skyraksys_hrm_production';
# Should be reasonable (< 100 connections)

\q
```

**First Day After Deployment:**
- Check logs every 2 hours
- Monitor user feedback
- Track any error reports
- Verify audit logs being created correctly

**First Week After Deployment:**
- Daily log review
- Gather HR team feedback
- Monitor performance metrics
- Check audit log table size growth

---

## 🆘 Rollback Plan

### If Critical Issue Discovered

**Immediate Rollback:**

```bash
# 1. Stop services
pm2 stop backend frontend

# 2. Rollback database migration
cd d:\skyraksys_hrm\backend
NODE_ENV=production npm run db:migrate:undo

# 3. Restore database from backup (if needed)
psql -U postgres -d skyraksys_hrm_production < d:\skyraksys_hrm\backups\pre-payroll-features\backup_YYYYMMDD_HHMMSS.sql

# 4. Checkout previous Git commit (if using Git)
git log --oneline  # Find previous commit hash
git checkout <previous-commit-hash>

# 5. Rebuild frontend
cd ../frontend
npm run build

# 6. Restart services
pm2 restart backend frontend

# 7. Verify rollback successful
curl http://localhost:5000/api/health
curl http://localhost:3000

# 8. Check logs
pm2 logs --lines 50
```

**Partial Rollback (Keep database, rollback code only):**

```bash
# If new columns cause no issue, just rollback code:
git checkout <previous-commit-hash>
cd frontend && npm run build
pm2 restart backend frontend
```

---

## 📊 Post-Deployment Checklist

### Immediate (Within 1 Hour)
- [ ] All services running (pm2 status shows "online")
- [ ] No errors in logs (pm2 logs)
- [ ] Can login to application
- [ ] Payroll Management page loads
- [ ] All 8 features work as expected
- [ ] Audit log created on test edit
- [ ] Database backup saved securely

### Within 24 Hours
- [ ] Notify HR team features are live
- [ ] Provide quick training session (30 min)
- [ ] Share user documentation links
- [ ] Monitor logs for any errors
- [ ] Gather initial user feedback
- [ ] Document any issues discovered

### Within 1 Week
- [ ] Conduct full team training (1 hour)
- [ ] Review audit logs for anomalies
- [ ] Optimize database indexes if needed
- [ ] Create maintenance schedule
- [ ] Plan Phase 2 enhancements (if any)

---

## 📞 Support Contacts

**Technical Issues:**
- Backend errors: Check `backend/logs/error.log`
- Frontend errors: Check browser console (F12)
- Database issues: Check PostgreSQL logs

**For Help:**
1. Review troubleshooting guide: `MANUAL_EDIT_PAYSLIP_IMPLEMENTATION.md`
2. Check error messages carefully
3. Search documentation for similar issues
4. Contact development team if unresolved

---

## 🎯 Success Criteria

Deployment considered successful when:
- ✅ All 8 features working in production
- ✅ No errors in logs for 1 hour
- ✅ HR team can complete test payroll cycle
- ✅ Audit logs being created correctly
- ✅ Performance acceptable (no slowdowns)
- ✅ Database migration completed without issues

---

## 📝 Deployment Log Template

**Copy this and fill in during deployment:**

```
Deployment Date: _____________________
Deployed By: _____________________

Pre-Deployment:
[ ] Migration tested on dev: _____________________
[ ] All features tested: _____________________
[ ] Backup created: _____________________
[ ] Team notified: _____________________

Deployment Steps:
[ ] Backend stopped: _____________________
[ ] Migration run: _____________________
[ ] Backend restarted: _____________________
[ ] Frontend built: _____________________
[ ] Frontend restarted: _____________________

Verification:
[ ] Services online: _____________________
[ ] Features working: _____________________
[ ] Audit log working: _____________________
[ ] No errors: _____________________

Issues Encountered:
_____________________
_____________________

Resolution:
_____________________
_____________________

Final Status: SUCCESS / ROLLBACK / PARTIAL
Notes:
_____________________
_____________________
```

---

**REMEMBER:**
1. ⚠️ Always test on development first
2. ⚠️ Always backup before migration
3. ⚠️ Monitor logs immediately after deployment
4. ⚠️ Have rollback plan ready
5. ✅ Document everything

**Good luck with deployment! 🚀**

