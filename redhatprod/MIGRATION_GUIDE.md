# Database Migration & Seeding Guide

## Overview

This guide covers running database migrations in production with comprehensive before/after reporting and demo data seeding.

**⚠️ IMPORTANT (Nov 5, 2025):** Migrations now use `backend/config/config.js` which loads database credentials from `.env` file (same as application). No need to set DATABASE_URL - migrations read DB_USER/DB_PASSWORD directly from environment via dotenv. See commit 17c00a1 for details.

## Scripts Available

### 1. `03_migrate_and_seed_production.sh` (Production - Full)
**Purpose:** Complete migration with detailed reporting and optional demo data seeding

**Features:**
- ✅ Captures database state before migration
- ✅ Runs all pending migrations
- ✅ Captures database state after migration
- ✅ Generates detailed before/after comparison report
- ✅ Interactive demo data seeding with options
- ✅ Saves timestamped reports to `/opt/skyraksys-hrm/migration-reports/`

**Usage:**
```bash
# On production server
ssh root@95.216.14.232
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash 03_migrate_and_seed_production.sh
```

**Interactive Prompts:**
When existing users are found, you'll be asked:
1. Skip seeding (keep existing data) - **SAFE**
2. Clear all data and re-seed - **DESTRUCTIVE**
3. Add demo data alongside existing - **ADDITIVE**

**Report Location:**
```bash
/opt/skyraksys-hrm/migration-reports/migration_report_YYYYMMDD_HHMMSS.txt
```

---

### 2. `migration-report.sh` (Quick Report)
**Purpose:** Generate quick snapshot of current database state

**Usage:**
```bash
# Local testing
cd /opt/skyraksys-hrm/redhatprod/scripts
bash migration-report.sh

# For production database, edit the script:
# Change: DB_NAME="skyraksys_hrm_dev"
# To:     DB_NAME="skyraksys_hrm_prod"
```

**What it shows:**
- All tables with sizes
- Row counts per table
- Migration history
- User list
- Department summary

---

## Manual Migration Steps (Alternative)

If you prefer to run migrations manually:

### Step 1: Backup Current State
```bash
# Dump current database
sudo -u postgres pg_dump skyraksys_hrm_prod > /tmp/backup_before_migration.sql

# Save table list
sudo -u postgres psql -d skyraksys_hrm_prod -c "\dt" > /tmp/tables_before.txt
```

### Step 2: Run Migrations
```bash
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:migrate
```

### Step 3: Check Migration Status
```bash
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT * FROM \"SequelizeMeta\" ORDER BY name;"
```

### Step 4: Verify Tables
```bash
sudo -u postgres psql -d skyraksys_hrm_prod -c "\dt"
```

### Step 5: Seed Demo Data (Optional)
```bash
cd /opt/skyraksys-hrm/backend

# Check if users exist
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT COUNT(*) FROM users;"

# If no users, seed demo data
sudo -u hrmapp npx sequelize-cli db:seed:all
```

---

## Demo Data Details

When seeded, the following demo data is created:

### Users (5 accounts)
| Email | Password | Role | Name |
|-------|----------|------|------|
| admin@skyraksys.com | admin123 | admin | System Administrator |
| hr@skyraksys.com | admin123 | hr | Sarah Johnson |
| lead@skyraksys.com | admin123 | manager | John Smith |
| employee1@skyraksys.com | admin123 | employee | Michael Brown |
| employee2@skyraksys.com | admin123 | employee | Emily Davis |

### Additional Demo Data
- **5 Departments:** HR, Engineering, Sales, Marketing, Finance
- **11 Positions:** Various roles across departments
- **5 Employees:** Linked to the 5 users above
- **5 Leave Types:** Annual, Sick, Casual, etc.
- **Leave Balances:** For each employee
- **3 Projects:** Sample projects with tasks
- **Salary Structures:** Sample salary configurations
- **2 Payslip Templates:** Standard and detailed

---

## Understanding the Migration Report

### Example Report Sections

#### 1. Pre-Migration State
```
📊 Tables Before Migration (25 total):
1  departments
2  employees
3  leave_requests
...

📈 Row Counts Before Migration:
departments                    : 5 rows
employees                      : 5 rows
users                          : 5 rows
```

#### 2. Migration Execution
```
Migration Output:
Sequelize CLI [Node: 22.16.0, CLI: 6.6.3, ORM: 6.37.7]
== 20240115123456-add-column-xyz: migrating =======
== 20240115123456-add-column-xyz: migrated (0.234s)
```

#### 3. Post-Migration State
```
📊 Tables After Migration (26 total):
1  attendance_records    [NEW]
2  departments
...
```

#### 4. Changes Summary
```
📊 Summary of Changes:
Tables before:        25
Tables after:         26
New tables added:     1
Tables removed:       0

Migrations before:    15
Migrations after:     16
New migrations run:   1

✨ New Tables Added:
1  attendance_records
```

#### 5. Final Database State
```
📊 Final Row Counts:
Users                          : 5
Employees                      : 5
Departments                    : 5
Positions                      : 11

👥 User List:
   email                    | role     | name                  | active
----------------------------+----------+-----------------------+--------
admin@skyraksys.com         | admin    | System Administrator  | t
hr@skyraksys.com            | hr       | Sarah Johnson         | t
...
```

---

## Common Scenarios

### Scenario 1: Fresh Production Database
**Goal:** Run migrations and seed demo data for initial testing

```bash
sudo bash 03_migrate_and_seed_production.sh
# Script will automatically seed demo data (no users exist)
```

### Scenario 2: Production with Existing Users
**Goal:** Run new migrations but keep existing user data

```bash
sudo bash 03_migrate_and_seed_production.sh
# When prompted, choose option 1: Skip seeding
```

### Scenario 3: Reset Everything
**Goal:** Clear all data and start fresh with demo data

```bash
sudo bash 03_migrate_and_seed_production.sh
# When prompted, choose option 2: Clear and re-seed
# Type 'YES' to confirm
```

### Scenario 4: Just Check Current State
**Goal:** Generate report without making changes

```bash
bash migration-report.sh
```

---

## Troubleshooting

### Migration Fails
```bash
# Check backend logs
sudo journalctl -u hrm-backend -n 50

# Check PostgreSQL logs
sudo tail -f /var/lib/pgsql/17/data/log/postgresql-*.log

# Test database connection
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp node test-db-connection.js
```

### Seeding Fails
```bash
# Check if migrations are complete first
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT COUNT(*) FROM \"SequelizeMeta\";"

# Check for foreign key constraints
sudo -u postgres psql -d skyraksys_hrm_prod -c "\d+ users"
sudo -u postgres psql -d skyraksys_hrm_prod -c "\d+ employees"

# Manually undo and retry
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:seed:undo:all
sudo -u hrmapp npx sequelize-cli db:seed:all
```

### View Migration Reports
```bash
# List all reports
ls -lh /opt/skyraksys-hrm/migration-reports/

# View latest report
cat /opt/skyraksys-hrm/migration-reports/migration_report_*.txt | tail -n 100

# View specific report
cat /opt/skyraksys-hrm/migration-reports/migration_report_20250104_143022.txt
```

---

## Best Practices

### Before Running Migrations

1. ✅ **Backup the database**
   ```bash
   sudo -u postgres pg_dump skyraksys_hrm_prod > /tmp/backup_$(date +%Y%m%d).sql
   ```

2. ✅ **Test migrations locally first**
   ```bash
   # On local machine
   cd D:\skyraksys_hrm\backend
   npx sequelize-cli db:migrate
   ```

3. ✅ **Review migration files**
   ```bash
   cd /opt/skyraksys-hrm/backend/migrations
   ls -l
   cat 20240101000000-*.js  # Review the migration
   ```

4. ✅ **Check for pending migrations**
   ```bash
   cd /opt/skyraksys-hrm/backend
   sudo -u hrmapp npx sequelize-cli db:migrate:status
   ```

### After Running Migrations

1. ✅ **Verify table structure**
   ```bash
   sudo -u postgres psql -d skyraksys_hrm_prod -c "\d+ table_name"
   ```

2. ✅ **Test backend startup**
   ```bash
   sudo systemctl restart hrm-backend
   sudo journalctl -u hrm-backend -n 20
   ```

3. ✅ **Test API endpoints**
   ```bash
   curl http://localhost:5000/api/health
   curl http://95.216.14.232/api/health
   ```

4. ✅ **Test login with demo accounts**
   ```bash
   curl -X POST http://95.216.14.232/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@skyraksys.com","password":"admin123"}'
   ```

---

## Security Notes

⚠️ **IMPORTANT:** Demo data is for testing only!

- Default password `admin123` is **NOT secure** for production
- After testing, either:
  - Delete demo accounts
  - Change all passwords
  - Disable demo accounts
  
```bash
# Change admin password via psql
sudo -u postgres psql -d skyraksys_hrm_prod -c "
  UPDATE users 
  SET password = '$2a$12$NEW_BCRYPT_HASH_HERE' 
  WHERE email = 'admin@skyraksys.com';
"
```

---

## Quick Reference Commands

```bash
# Run full migration with reporting
sudo bash 03_migrate_and_seed_production.sh

# Generate quick report
bash migration-report.sh

# Check migration status
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:migrate:status

# Rollback last migration
sudo -u hrmapp npx sequelize-cli db:migrate:undo

# Rollback all migrations
sudo -u hrmapp npx sequelize-cli db:migrate:undo:all

# Seed demo data
sudo -u hrmapp npx sequelize-cli db:seed:all

# Undo all seeds
sudo -u hrmapp npx sequelize-cli db:seed:undo:all

# View migration reports
ls -lh /opt/skyraksys-hrm/migration-reports/
cat /opt/skyraksys-hrm/migration-reports/migration_report_*.txt
```

---

## Support

For issues or questions:
- Check logs: `sudo journalctl -u hrm-backend -f`
- Review migration reports: `/opt/skyraksys-hrm/migration-reports/`
- Contact: info@skyraksys.com
