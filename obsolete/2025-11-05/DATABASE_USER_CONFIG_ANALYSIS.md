# 🔍 Database User Configuration Analysis

**Date:** November 5, 2025  
**Status:** ⚠️ POTENTIAL ISSUE IDENTIFIED

---

## Current Configuration

### Production Database Setup (`02_setup_database.sh`)

**Creates:**
- Database: `skyraksys_hrm_prod`
- User: `hrm_app` (with generated password)
- Privileges: ALL on database and schema

```bash
# Line 46 in 02_setup_database.sh
DB_USER="hrm_app"

# Lines 285-286
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
```

### Production .env Template

**Configures:**
```bash
DB_USER=hrm_app
DB_PASSWORD=CHANGE_THIS_PASSWORD  # From .db_password file
```

### Application Runtime (server.js, models/index.js)

**Uses:** Environment variables from `.env`:
- Reads `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME` from `.env`
- Connects with these credentials

### Sequelize Migrations (`config/config.json`)

**Problem identified:**

**Development:**
```json
{
  "username": "postgres",
  "password": "admin"
}
```
✅ Works for local dev

**Production:**
```json
{
  "use_env_variable": "DATABASE_URL"
}
```
❌ **`DATABASE_URL` is NOT defined in `.env.production.template`!**

---

## The Issue

### What Happens in Production:

1. **Database setup** creates user `hrm_app` ✅
2. **`.env` file** configures `DB_USER=hrm_app` ✅
3. **Application runtime** connects as `hrm_app` ✅
4. **Migrations run as Linux user `hrmapp`** via:
   ```bash
   sudo -u hrmapp npx sequelize-cli db:migrate
   ```
5. **Sequelize CLI reads `config/config.json`** which expects `DATABASE_URL` ❌
6. **`DATABASE_URL` is NOT SET** in `.env` ❌

### Expected Behavior:

Sequelize migrations will FAIL because `DATABASE_URL` environment variable doesn't exist!

**Error:**
```
ERROR: Environment variable DATABASE_URL is not defined
```

---

## Why This Might Not Have Failed Yet

### Possibility 1: Application Runtime Connection
If models/index.js builds connection from individual env vars (DB_USER, DB_PASSWORD, etc.), migrations might fall back to this.

### Possibility 2: Manual DATABASE_URL Setup
Production server might have `DATABASE_URL` set manually in `.env` (not from template).

### Possibility 3: Development Override
If migrations run in development mode, they use `username: "postgres"`.

---

## Solution Options

### ✅ Option A: Fix config.json to Match .env Template (RECOMMENDED)

Update `backend/config/config.json` production section:

```json
"production": {
  "username": "${DB_USER}",
  "password": "${DB_PASSWORD}",
  "database": "${DB_NAME}",
  "host": "${DB_HOST}",
  "port": "${DB_PORT}",
  "dialect": "postgres",
  "logging": false,
  "pool": {
    "max": 10,
    "min": 2,
    "acquire": 60000,
    "idle": 30000
  }
}
```

**Problem:** Sequelize doesn't support `${VAR}` interpolation in config.json.

### ✅ Option B: Use .sequelizerc to Load Env Vars (RECOMMENDED)

Create `backend/.sequelizerc`:

```javascript
const path = require('path');
require('dotenv').config();

module.exports = {
  'config': path.resolve('config', 'config.js'),  // Use .js instead of .json
  'models-path': path.resolve('models'),
  'seeders-path': path.resolve('seeders'),
  'migrations-path': path.resolve('migrations')
};
```

Rename `config.json` to `config.js` and use env vars directly.

### ✅ Option C: Add DATABASE_URL to .env Template (SIMPLEST)

Add to `.env.production.template`:

```bash
# Sequelize CLI Connection (for migrations)
# Built from individual DB params above
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
```

Then manually construct it in production deployment script.

### ✅ Option D: Use Same User for Everything (CURRENT WORKING STATE)

**If it's working now:**
- Both app and migrations use `hrm_app` user
- Connection established via individual env vars (not DATABASE_URL)
- Sequelize might be ignoring `use_env_variable` and falling back

---

## Current Working Configuration (If Already Deployed)

### How It Might Be Working:

1. **models/index.js** builds connection from `process.env.DB_*` vars
2. **Migrations inherit this connection** from models
3. **`use_env_variable: "DATABASE_URL"`** is ignored if variable doesn't exist
4. **Sequelize falls back** to default connection from models

### Verification Needed:

Check production server:
```bash
# 1. Check if DATABASE_URL is set
cat /opt/skyraksys-hrm/backend/.env | grep DATABASE_URL

# 2. Check what user migrations actually use
sudo -u hrmapp npx sequelize-cli db:migrate:status

# 3. Check database ownership
sudo -u postgres psql -d skyraksys_hrm_prod -c "\dt"
# Look at Owner column - should be hrm_app
```

---

## Recommended Fix

### Step 1: Update config.json

Replace `config.json` with `config.js`:

**File: `backend/config/config.js`**
```javascript
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'skyraksys_hrm',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME_TEST || 'skyraksys_hrm_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  
  production: {
    username: process.env.DB_USER || 'hrm_app',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'skyraksys_hrm_prod',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 60000,
      idle: 30000
    }
  }
};
```

### Step 2: Update MIGRATION_FIX_NOTICE.md

Add section about database user consistency.

---

## Summary

### Current State:
- ✅ Database user: `hrm_app`
- ✅ .env template: `DB_USER=hrm_app`
- ✅ Application runtime: Uses `hrm_app`
- ⚠️ Migrations config: Expects `DATABASE_URL` (not set!)
- ❓ Actual behavior: Unknown (needs production verification)

### Risk Level:
**MEDIUM** - May cause migration failures on fresh production deployment if `DATABASE_URL` is not set.

### Action Required:
1. Verify if migrations are actually working in production
2. If failing: Implement Option above (convert config.json to config.js)
3. Test migrations on fresh database with fix
4. Update production deployment guide with correct configuration

---

**Next Step:** Check if production server already has DATABASE_URL set, or if migrations are working via fallback mechanism.
