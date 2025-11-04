# Database Seeding & Validation Guide

## What Gets Seeded

When you run `npx sequelize-cli db:seed:all`, the following data is created:

### 1. **Departments (5)**
- Human Resources
- Engineering
- Sales
- Marketing
- Finance

### 2. **Positions (11)**
- HR Manager
- HR Executive
- Software Engineer
- Senior Software Engineer
- Team Lead
- Sales Executive
- Sales Manager
- Marketing Executive
- Marketing Manager
- Finance Manager
- Accountant

### 3. **Users (5)** - All with configurable password
| Email | Role | Name |
|-------|------|------|
| admin@skyraksys.com | admin | System Administrator |
| hr@skyraksys.com | hr | Sarah Johnson |
| lead@skyraksys.com | manager | John Smith |
| employee1@skyraksys.com | employee | Michael Brown |
| employee2@skyraksys.com | employee | Emily Davis |

### 4. **Employees (5)**
- EMP0001 - System Administrator (Admin, HR Dept)
- EMP0002 - Sarah Johnson (HR Manager, HR Dept)
- EMP0003 - John Smith (Team Lead, Engineering)
- EMP0004 - Michael Brown (Software Engineer, Engineering)
- EMP0005 - Emily Davis (Software Engineer, Engineering)

### 5. **Leave Types (5)**
- Annual Leave (21 days default)
- Sick Leave (12 days default)
- Casual Leave (12 days default)
- Maternity Leave (180 days)
- Paternity Leave (15 days)

### 6. **Leave Balances**
- Automatically created for all employees
- Based on leave type defaults

### 7. **Projects (3)**
- ERP System Implementation
- Mobile App Development
- Website Redesign

### 8. **Tasks**
- Multiple tasks for each project
- Includes planning, development, testing phases

### 9. **Salary Structures (5)**
- Complete salary breakdown for each employee
- Includes: Basic, HRA, Allowances, PF, TDS, Professional Tax
- INR currency

---

## Configuration

### Set Custom Default Password

**Option 1: Environment Variable (Recommended)**

Edit `.env` file:
```bash
SEED_DEFAULT_PASSWORD=YourSecurePassword123!
```

**Option 2: Use Default**
If not set, defaults to `admin123`

### Example Configurations

**Local Development (.env):**
```bash
SEED_DEFAULT_PASSWORD=admin123
SEED_DEMO_DATA=true
```

**Production (.env):**
```bash
SEED_DEFAULT_PASSWORD=P@ssw0rd2024!Secure
SEED_DEMO_DATA=false  # Set to true only for initial setup
```

---

## Running the Seeder

### Local Development
```bash
cd D:\skyraksys_hrm\backend
npx sequelize-cli db:seed:all
```

### Production Server
```bash
ssh root@95.216.14.232
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:seed:all
```

### Using Migration Script (Recommended for Production)
```bash
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash 03_migrate_and_seed_production.sh
```

---

## Validating the Database

After seeding, validate everything is correct:

```bash
# On production server
cd /opt/skyraksys-hrm/redhatprod/scripts
bash validate-database.sh
```

### What Gets Validated

✅ **Structure:**
- All required tables exist
- Primary keys configured
- Foreign keys in place
- Indexes present

✅ **Data:**
- Users seeded (at least 1 admin)
- Departments created
- Positions available
- Employees linked to users
- Leave types defined
- Projects available
- Salary structures configured

✅ **Integrity:**
- No orphaned records
- All employees have positions
- All employees have departments
- Referential integrity maintained

✅ **Migrations:**
- All migrations executed
- SequelizeMeta table populated

### Example Output

```
========================================
🔍 DATABASE VALIDATION
========================================

STEP 1: Database Connection
  ✓ Database exists
  ✓ Can connect to database

STEP 2: Table Structure
  ✓ departments
  ✓ positions
  ✓ users
  ✓ employees
  ✓ leave_types
  ✓ projects
  ✓ salary_structures
  ... (15 total tables)

STEP 3: Primary Keys
  ✓ All tables have primary keys

STEP 4: Foreign Keys
  ✓ Foreign key count looks good (15 found)

STEP 5: Indexes
  ✓ Critical field indexes present

STEP 6: Required Data
  ✓ Users: 5 found
  ✓ Admin user exists
  ✓ Departments: 5 found
  ✓ Positions: 11 found
  ✓ Employees: 5 found
  ✓ Leave Types: 5 found
  ✓ Projects: 3 found

STEP 7: Data Integrity
  ✓ All users have employee records
  ✓ All employees have positions
  ✓ All employees have departments

STEP 8: Migration Status
  ✓ Migrations have been run

✅ ALL CHECKS PASSED!
Database is ready for production use!
```

---

## Re-seeding (Start Fresh)

### Clear and Re-seed

**Local:**
```bash
cd D:\skyraksys_hrm\backend
node reset-database.js
npx sequelize-cli db:seed:all
```

**Production:**
```bash
cd /opt/skyraksys-hrm/backend
sudo -u hrmapp npx sequelize-cli db:seed:undo:all
sudo -u hrmapp npx sequelize-cli db:seed:all
```

**Or use the interactive script:**
```bash
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash 03_migrate_and_seed_production.sh
# Choose option 2 when prompted to clear and re-seed
```

---

## Troubleshooting

### Issue: Duplicate Key Error
**Cause:** Data already exists from previous seed  
**Solution:** Undo seeds first
```bash
npx sequelize-cli db:seed:undo:all
npx sequelize-cli db:seed:all
```

### Issue: Foreign Key Constraint Error
**Cause:** Migrations not run or incomplete  
**Solution:** Run migrations first
```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### Issue: No Admin User After Seeding
**Cause:** Seeder detected existing users and skipped  
**Solution:** Check if users exist
```bash
# Check existing users
node check-users.js

# If needed, clear and re-seed
npx sequelize-cli db:seed:undo:all
npx sequelize-cli db:seed:all
```

### Issue: Password Not Working
**Cause:** Using wrong password or password changed  
**Solution:** Check SEED_DEFAULT_PASSWORD in .env
```bash
# View current setting
grep SEED_DEFAULT_PASSWORD .env

# Password should match what was set during seeding
# Default is admin123 if not configured
```

---

## Security Best Practices

### For Production

1. **Change Default Password**
   ```bash
   # Set secure password in .env BEFORE seeding
   SEED_DEFAULT_PASSWORD=SecureP@ssw0rd2024!
   ```

2. **Seed Only Once**
   ```bash
   # After initial setup, disable demo data
   SEED_DEMO_DATA=false
   ```

3. **Change Passwords After First Login**
   - Force all demo users to change passwords on first login
   - Or manually update passwords in database

4. **Delete Demo Accounts**
   ```bash
   # After creating real users, delete demo accounts
   DELETE FROM users WHERE email LIKE '%@skyraksys.com';
   ```

5. **Disable Demo Accounts**
   ```bash
   # Or just disable them
   UPDATE users SET "isActive" = false WHERE email LIKE '%@skyraksys.com';
   ```

---

## Quick Reference

### Seeding Commands
```bash
# Seed all data
npx sequelize-cli db:seed:all

# Undo all seeds
npx sequelize-cli db:seed:undo:all

# Check database
node check-users.js
node check-departments.js

# Validate everything
bash redhatprod/scripts/validate-database.sh
```

### Default Credentials (if using default password)
```
URL: http://95.216.14.232 (or localhost:3000 for dev)
Email: admin@skyraksys.com
Password: admin123 (or value from SEED_DEFAULT_PASSWORD)
```

### What to Do After Seeding
1. ✅ Run validation script
2. ✅ Test login with admin account
3. ✅ Verify all modules work (departments, employees, leaves, etc.)
4. ✅ Change default passwords
5. ✅ Set SEED_DEMO_DATA=false in production .env

---

## Support

For detailed migration reports with before/after comparisons, use:
```bash
sudo bash redhatprod/scripts/03_migrate_and_seed_production.sh
```

Reports are saved to: `/opt/skyraksys-hrm/migration-reports/`
