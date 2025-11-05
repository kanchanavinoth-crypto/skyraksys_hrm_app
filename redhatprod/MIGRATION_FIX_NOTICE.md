# ⚠️ CRITICAL: Migration Fix Notice

**Date:** November 5, 2025  
**Commit:** cb801fa  
**Status:** REQUIRED for production deployment

---

## 🔥 Issue Discovered

Production server (95.216.14.232) migration failures:
- **Error:** "No description found for 'leave_requests' table"
- **Cause:** Add-* migrations ran before table creation migrations
- **Root cause:** Application used hybrid architecture (sequelize.sync() + incomplete migrations)

---

## ✅ Fix Implemented

### 1. Comprehensive Base Migration
**File:** `backend/migrations/20241201000000-create-base-tables.js`
- Creates all 15 core tables in one atomic transaction
- 700+ lines of complete schema definition
- Runs first (timestamp: 2024-12-01)

### 2. Idempotent Guards
All migrations updated with existence checks:
- `20241218000000-create-payslips.js` - Check if payslips table exists
- `20250127000000-add-leave-cancellation-fields.js` - Try/catch on describeTable
- `20250127014300-add-leave-cancellation-fields.js` - Nested try/catch
- `20250127020000-create-leave-requests.js` - Check if table exists
- `20250917000001-add-weekly-timesheet-columns.js` - Check if columns exist
- `20251027000001-add-performance-indexes.js` - Check if audit_logs exists

### 3. Fresh Database Testing
✅ All 10 migrations tested successfully from empty database
✅ Verified on local Windows PostgreSQL 17
✅ All relationships intact
✅ Demo data seeding works

---

## 📋 Migration List (Correct Order)

1. **20241201000000-create-base-tables.js** ⭐ NEW - Creates all core tables
2. **20241218000000-create-payslips.js** - Creates payslips table
3. **20241219000000-add-payslip-edit-tracking-and-audit-log.js** - Adds edit tracking
4. **20250127000000-add-leave-cancellation-fields.js** - Adds cancellation fields
5. **20250127014300-add-leave-cancellation-fields.js** - Duplicate (legacy)
6. **20250127020000-create-leave-requests.js** - Creates leave_requests (if not exists)
7. **20250824000000-create-payslip-template.js** - Creates PayslipTemplates
8. **20250917000001-add-weekly-timesheet-columns.js** - Adds weekStartDate column
9. **20251026000001-remove-unique-timesheet-constraint.js** - Removes constraint
10. **20251027000001-add-performance-indexes.js** - Creates indexes

---

## 🚀 Deployment Instructions

### Before Deploying

1. **Pull latest code:**
   ```bash
   cd /opt/skyraksys-hrm
   sudo git pull origin main
   ```

2. **Verify migration fix present:**
   ```bash
   cd backend/migrations
   ls -la 20241201000000-create-base-tables.js
   # Should exist (33KB file)
   ```

3. **Check commit:**
   ```bash
   git log --oneline -1
   # Should show cb801fa or later
   ```

### Fresh Database Deployment

```bash
cd /opt/skyraksys-hrm/backend

# Run migrations
sudo -u hrmapp npx sequelize-cli db:migrate

# Verify all 10 migrations applied
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT COUNT(*) FROM \"SequelizeMeta\";"
# Should return: 10

# Seed demo data (optional)
sudo -u hrmapp npx sequelize-cli db:seed:all
```

### Existing Database with Old Migrations

If database already has migrations applied (before fix):

```bash
cd /opt/skyraksys-hrm/backend

# Check current migrations
sudo -u hrmapp npx sequelize-cli db:migrate:status

# Run new migrations (idempotent - will skip existing tables)
sudo -u hrmapp npx sequelize-cli db:migrate

# The base migration will see tables already exist and skip creation
# Other migrations will check if columns exist before adding
```

---

## ✅ Verification

After deployment, verify:

```bash
# 1. Check all migrations applied
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT name FROM \"SequelizeMeta\" ORDER BY name;"

# 2. Check all tables exist
sudo -u postgres psql -d skyraksys_hrm_prod -c "\dt"
# Should show 18-19 tables

# 3. Check table ownership (should all be hrm_app)
sudo -u postgres psql -d skyraksys_hrm_prod -c "\dt"
# Owner column should show: hrm_app

# 4. Test backend health
curl http://localhost:5000/api/health
# Should return: {"status":"healthy","database":"connected"}

# 5. Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@skyraksys.com","password":"admin123"}'
# Should return access token

# 6. Verify .env configuration
cat /opt/skyraksys-hrm/backend/.env | grep DB_USER
# Should show: DB_USER=hrm_app

# 7. Verify config.js exists (Nov 5, 2025 fix)
ls -la /opt/skyraksys-hrm/backend/config/config.js
# Should exist (config.json is legacy, not used anymore)
```

---

## 📊 Why This Happened

### Comprehensive Audit Gap

**November 4, 2025 audit (9.5/10 score):**
- ✅ Reviewed ~5,000 lines of bash deployment scripts
- ✅ Checked security configuration, Nginx, systemd services
- ❌ **Did NOT review individual migration JavaScript files**
- ❌ **No fresh-database migration testing**

### Why Issue Wasn't Caught Locally

- Local workspace had migrations already applied in working order
- Application used `sequelize.sync()` for table creation (masked migration issues)
- Production was first fresh deployment hitting this code path

### Lesson Learned

✅ Always test migrations on fresh database  
✅ Review migration files, not just deployment scripts  
✅ Add CI/CD test: "Apply all migrations to empty database"  
✅ Avoid hybrid architecture (sync + migrations) - pick one

---

## 🔄 Rollback Plan

If migration fails in production:

```bash
# 1. Stop services
sudo systemctl stop hrm-backend hrm-frontend

# 2. Restore database from backup
sudo -u postgres pg_restore -d skyraksys_hrm_prod /path/to/backup.sql

# 3. Revert code
cd /opt/skyraksys-hrm
sudo git checkout <previous-commit>

# 4. Restart services
sudo systemctl start hrm-backend hrm-frontend
```

---

## 📞 Support

If you encounter migration issues:

1. Check backend logs: `sudo journalctl -u hrm-backend -n 100`
2. Check PostgreSQL logs: `sudo tail -f /var/lib/pgsql/17/data/log/postgresql-*.log`
3. Verify database connection: `cd backend && node -e "require('./models').sequelize.authenticate()"`
4. Check migration status: `npx sequelize-cli db:migrate:status`

---

## ✅ Status

- **Local Testing:** ✅ Complete (Windows PostgreSQL 17)
- **Database Integrity:** ✅ Verified (19 tables, all relationships intact)
- **Authentication:** ✅ Tested (admin login works)
- **Demo Data:** ✅ Seeded (5 users, 5 employees, 3 projects)
- **Production Ready:** ✅ YES - Ready for deployment

**Commit to deploy:** cb801fa or later  
**Migration fix file:** backend/migrations/20241201000000-create-base-tables.js

---

**Last Updated:** November 5, 2025  
**Author:** System Administrator  
**Priority:** CRITICAL - Deploy before next production deployment
