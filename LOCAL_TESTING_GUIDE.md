# Local Testing Before Production Deployment

## Quick Start - Test Everything Locally

Before deploying to production, run these commands to ensure everything works:

```powershell
# From D:\skyraksys_hrm\backend directory

# Step 1: Validate current database state
node scripts/validate-database-local.js

# Step 2: If validation fails, reset and seed
node reset-database.js
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# Step 3: Validate again
node scripts/validate-database-local.js

# Step 4: Test user creation
node check-users.js
```

---

## Complete Local Test Workflow

### 1. **Database Structure Validation**

Run the validation script to check everything:

```powershell
cd D:\skyraksys_hrm\backend
node scripts/validate-database-local.js
```

**What it checks:**
- ✅ All 15+ tables exist
- ✅ Primary keys on all tables
- ✅ Foreign keys (39 expected)
- ✅ Indexes present
- ✅ Required data seeded
- ✅ Data integrity
- ✅ Migrations completed

**Expected Output:**
```
========================================
🔍 DATABASE VALIDATION (LOCAL)
========================================

STEP 1: Database Connection
  ✓ Connected to database

STEP 2: Table Structure
  ✓ departments
  ✓ positions
  ✓ users
  ✓ employees
  ... (15 total)

STEP 3: Primary Keys
  ✓ All tables have primary keys

STEP 4: Foreign Keys
  ✓ Foreign key count looks good (39 found)

STEP 5: Indexes
  ✓ Total indexes: 574

STEP 6: Required Data
  ✓ Users: 5 found
  ✓ Admin user exists
  ✓ Departments: 5 found
  ✓ Positions: 11 found
  ✓ Employees: 5 found
  ✓ Leave Types: 5 found
  ✓ Projects: 3 found
  ✓ Payslip Templates: 4 found

STEP 7: Data Integrity
  ✓ All data correctly linked

STEP 8: Migration Status
  ✓ Migrations have been run

✅ ALL CHECKS PASSED!
Database is ready for production use!
✅ Safe to deploy to production!
```

---

### 2. **Test Seeding from Scratch**

Simulate a fresh production deployment:

```powershell
# Clear everything
node reset-database.js

# Run migrations (like production will)
npx sequelize-cli db:migrate

# Seed demo data (like production will)
npx sequelize-cli db:seed:all

# Validate everything
node validate-local-database.js
```

**What to look for:**
- ✅ No errors during migration
- ✅ Seeder shows complete summary
- ✅ Validation passes with 0 errors
- ✅ All 5 users created
- ✅ All departments, positions, projects created

---

### 3. **Test Custom Password**

Test using SEED_DEFAULT_PASSWORD:

```powershell
# Edit .env file
# Add or update: SEED_DEFAULT_PASSWORD=TestP@ssw0rd123!

# Clear and re-seed
node reset-database.js
npx sequelize-cli db:seed:all

# Check if password was used
node check-users.js
```

**Expected Output from Seeder:**
```
✅ Initial data seeded successfully!

📊 Data Summary:
   • 5 Departments
   • 11 Positions
   • 5 Users
   ... etc

🔐 Default Credentials:
   Password: TestP@ssw0rd123!
   • admin@skyraksys.com (Admin)
   • hr@skyraksys.com (HR)
   ... etc
```

---

### 4. **Test Login with Seeded Users**

Start the backend and test login:

```powershell
# Terminal 1: Start backend
cd D:\skyraksys_hrm\backend
npm run dev

# Terminal 2: Test login
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@skyraksys.com\",\"password\":\"admin123\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@skyraksys.com",
    "role": "admin",
    "firstName": "System",
    "lastName": "Administrator"
  }
}
```

---

### 5. **Test All Data Was Seeded**

Verify specific data:

```powershell
# Check departments
node check-departments.js

# Check users
node check-users.js

# Query specific data
node -e "const {Sequelize} = require('sequelize'); const config = require('./config/config.json')['development']; const seq = new Sequelize(config.database, config.username, config.password, {host: config.host, dialect: config.dialect, logging: false}); seq.query('SELECT name FROM departments ORDER BY name').then(([r]) => {console.log('Departments:'); r.forEach(d => console.log('  -', d.name)); seq.close()});"
```

**Expected Departments:**
- Engineering
- Finance
- Human Resources
- Marketing
- Sales

**Expected Positions (11):**
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

---

### 6. **Test Foreign Key Constraints**

Verify referential integrity:

```powershell
# Try to create employee without user (should fail)
node -e "const {Sequelize} = require('sequelize'); const config = require('./config/config.json')['development']; const seq = new Sequelize(config.database, config.username, config.password, {host: config.host, dialect: config.dialect, logging: false}); seq.query(\"INSERT INTO employees (id, \\\"employeeId\\\", \\\"userId\\\", \\\"departmentId\\\", \\\"positionId\\\", \\\"firstName\\\", \\\"lastName\\\", email, status, \\\"hireDate\\\", \\\"createdAt\\\", \\\"updatedAt\\\") VALUES (gen_random_uuid(), 'TEST001', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'Test', 'User', 'test@test.com', 'Active', NOW(), NOW(), NOW());\").then(() => {console.log('ERROR: Should have failed!'); seq.close();}).catch(err => {console.log('✓ Foreign key constraint working:', err.message.substring(0, 50)); seq.close();});"
```

**Expected:** Error about foreign key constraint (this is good!)

---

### 7. **Compare with Production Schema**

Save your local schema for comparison:

```powershell
# Save local schema
pg_dump -U postgres -d skyraksys_hrm_dev --schema-only > schema_local.sql

# Compare table counts
node -e "const {Sequelize} = require('sequelize'); const config = require('./config/config.json')['development']; const seq = new Sequelize(config.database, config.username, config.password, {host: config.host, dialect: config.dialect, logging: false}); seq.query('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = \\\'public\\\'').then(([r]) => {console.log('Tables:', r[0].count); return seq.query('SELECT COUNT(*) as count FROM information_schema.table_constraints WHERE constraint_type = \\\'FOREIGN KEY\\\'');}).then(([r]) => {console.log('Foreign Keys:', r[0].count); seq.close()});"
```

---

## Full Local Test Checklist

Before deploying to production, verify:

### Database Structure
- [ ] ✅ All 15+ tables exist (`node scripts/validate-database-local.js`)
- [ ] ✅ Primary keys on all tables
- [ ] ✅ Foreign keys: 39+ found
- [ ] ✅ Indexes created
- [ ] ✅ No duplicate tables or old migrations

### Data Seeding
- [ ] ✅ 5 Departments created
- [ ] ✅ 11 Positions created
- [ ] ✅ 5 Users created (1 admin, 1 hr, 1 manager, 2 employees)
- [ ] ✅ 5 Employees linked to users
- [ ] ✅ 5 Leave Types created
- [ ] ✅ Leave Balances created for all employees
- [ ] ✅ 3 Projects created
- [ ] ✅ Tasks created for projects
- [ ] ✅ 5 Salary Structures created
- [ ] ✅ Payslip Templates created

### Data Integrity
- [ ] ✅ All employees have valid user IDs
- [ ] ✅ All employees have departments
- [ ] ✅ All employees have positions
- [ ] ✅ All positions linked to departments
- [ ] ✅ No orphaned records
- [ ] ✅ Foreign key constraints work

### Authentication
- [ ] ✅ Can login with admin@skyraksys.com
- [ ] ✅ Can login with hr@skyraksys.com
- [ ] ✅ Can login with other seeded accounts
- [ ] ✅ Wrong password fails
- [ ] ✅ Non-existent user fails

### Custom Configuration
- [ ] ✅ SEED_DEFAULT_PASSWORD works
- [ ] ✅ Seeder shows correct password in output
- [ ] ✅ All accounts use the configured password

---

## If Local Tests Pass

Your database is ready for production! Deploy with confidence:

```bash
# On production server
ssh root@95.216.14.232
cd /opt/skyraksys-hrm
git pull origin master

# Run migration script (includes validation)
cd redhatprod/scripts
sudo bash 03_migrate_and_seed_production.sh

# Or validate manually
bash validate-database.sh
```

---

## If Local Tests Fail

### Common Issues and Fixes

**Issue: Missing tables**
```powershell
# Run migrations
npx sequelize-cli db:migrate
```

**Issue: No users after seeding**
```powershell
# Check if seeder detected existing data
# Clear and re-seed
node reset-database.js
npx sequelize-cli db:seed:all
```

**Issue: Foreign key errors**
```powershell
# Check migration order
npx sequelize-cli db:migrate:status

# Re-run migrations in order
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
```

**Issue: Password not working**
```powershell
# Check SEED_DEFAULT_PASSWORD in .env
grep SEED_DEFAULT_PASSWORD .env

# If missing, add it and re-seed
echo SEED_DEFAULT_PASSWORD=admin123 >> .env
node reset-database.js
npx sequelize-cli db:seed:all
```

---

## Quick Command Reference

```powershell
# Validate everything
node scripts/validate-database-local.js

# Reset and start fresh
node reset-database.js
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# Check specific data
node check-users.js
node check-departments.js

# Test login
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@skyraksys.com\",\"password\":\"admin123\"}"

# View migration status
npx sequelize-cli db:migrate:status

# View seed status
npx sequelize-cli db:seed:status
```

---

## Success Criteria

Your local database is ready for production when:

1. ✅ `node scripts/validate-database-local.js` shows **0 errors**
2. ✅ All 15+ tables exist
3. ✅ All foreign keys present (39+)
4. ✅ 5 users created including admin
5. ✅ Can login with demo credentials
6. ✅ Seeder completes without errors
7. ✅ No orphaned or missing data

**When all checks pass, you can confidently deploy to production!** 🚀
