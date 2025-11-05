# Local Development Environment - Standardized Configuration

**Last Updated:** November 5, 2025  
**Status:** ✅ All files synchronized

---

## 🔧 Standardized Local Configuration

All local environment files have been updated to use consistent settings to avoid confusion.

### **Database Configuration**

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=hrm_app
DB_PASSWORD=hrm_secure_2024
DB_DIALECT=postgres
DB_SSL=false
```

### **Demo Data Configuration**

```env
SEED_DEMO_DATA=true
SEED_DEFAULT_PASSWORD=admin123
```

---

## 📁 Files Updated

| File | Status | Purpose |
|------|--------|---------|
| `backend/.env` | ✅ Updated | Main development environment |
| `backend/.env.example` | ✅ Updated | Template for new developers |
| `backend/.env.backup` | ✅ Updated | Backup configuration |

---

## ✅ Verification Tests

### **Connection Test Results:**

```
✅ DB_USER: hrm_app
✅ DB_PASSWORD: hrm_secure_2024
✅ DB_NAME: skyraksys_hrm
✅ Connection: Successful
```

### **Demo Users:**

All demo users created with password: `admin123`

| Email | Password | Role |
|-------|----------|------|
| admin@skyraksys.com | admin123 | Super Admin |
| hr@skyraksys.com | admin123 | HR Manager |
| lead@skyraksys.com | admin123 | Team Lead |
| employee1@skyraksys.com | admin123 | Employee |
| employee2@skyraksys.com | admin123 | Employee |

---

## ⚠️ Important Notes

### **1. Windows Environment Variables**

Previously, there was a Windows environment variable `$env:DB_PASSWORD = "test123"` that overrode the `.env` file.

**This has been removed** to ensure `.env` file settings are used.

**To verify no environment variables override .env:**
```powershell
# Check for DB environment variables
Get-ChildItem Env: | Where-Object { $_.Name -like "DB_*" }

# Remove if any exist
Remove-Item Env:\DB_PASSWORD
Remove-Item Env:\DB_USER
```

### **2. PostgreSQL User**

The `hrm_app` user was created with proper permissions:

```sql
-- User: hrm_app
-- Password: hrm_secure_2024
-- Database: skyraksys_hrm
-- Permissions: ALL on database, schema, tables, sequences
```

### **3. Port Configuration**

- **Database Port:** 5432 (PostgreSQL default)
- **Backend API Port:** 5000
- **Frontend Dev Port:** 3000

---

## 🚀 Quick Start (After Updates)

### **1. Verify Configuration**

```powershell
cd d:\skyraksys_hrm\backend
Get-Content .env | Select-String "DB_|SEED_"
```

**Expected Output:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=hrm_app
DB_PASSWORD=hrm_secure_2024
SEED_DEMO_DATA=true
SEED_DEFAULT_PASSWORD=admin123
```

### **2. Test Database Connection**

```powershell
cd d:\skyraksys_hrm\backend
node check-db.js
```

**Expected:**
```
✅ Database connection successful!
📊 Database: skyraksys_hrm
👤 User: hrm_app
📋 Found 21 tables
```

### **3. Start Backend**

```powershell
cd d:\skyraksys_hrm\backend
npm run dev
```

### **4. Start Frontend**

```powershell
cd d:\skyraksys_hrm\frontend
npm start
```

### **5. Login**

```
URL: http://localhost:3000
Email: admin@skyraksys.com
Password: admin123
```

---

## 🔍 Troubleshooting

### **Issue: Connection Fails**

**Solution:**
```powershell
# 1. Check PostgreSQL is running
# Windows Services → PostgreSQL

# 2. Test connection
node -e "const {Sequelize} = require('sequelize'); require('dotenv').config(); const s = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {host: 'localhost', dialect: 'postgres'}); s.authenticate().then(() => {console.log('OK'); s.close();}).catch(e => {console.error(e.message); s.close();});"

# 3. Recreate user if needed
node setup-local-db.js
```

### **Issue: Demo Users Don't Exist**

**Solution:**
```powershell
cd d:\skyraksys_hrm\backend
npx sequelize-cli db:seed:all
```

### **Issue: Environment Variable Override**

**Solution:**
```powershell
# Check for overrides
Get-ChildItem Env: | Where-Object { $_.Name -like "DB_*" }

# Remove any DB environment variables
Remove-Item Env:\DB_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:\DB_USER -ErrorAction SilentlyContinue
Remove-Item Env:\DB_NAME -ErrorAction SilentlyContinue

# Restart terminal and test again
```

---

## 📊 Configuration Comparison

### **Local Development vs Production**

| Setting | Local (Dev) | Production (RHEL) |
|---------|-------------|-------------------|
| **DB User** | hrm_app | hrm_app |
| **DB Password** | hrm_secure_2024 | SkyRakDB#2025!Prod@HRM$Secure |
| **DB Name** | skyraksys_hrm | skyraksys_hrm_prod |
| **Demo Password** | admin123 | admin123 |
| **SEED_DEMO_DATA** | true | false (after setup) |

---

## ✅ Checklist

Before starting development, ensure:

- [ ] `.env` file has correct DB credentials
- [ ] No Windows environment variables override `.env`
- [ ] PostgreSQL service is running
- [ ] Database `skyraksys_hrm` exists
- [ ] User `hrm_app` has proper permissions
- [ ] Migrations have been run (21 tables exist)
- [ ] Demo users are seeded (5 users exist)
- [ ] Backend starts without errors on port 5000
- [ ] Frontend starts without errors on port 3000
- [ ] Can login with admin@skyraksys.com / admin123

---

**All local environment files are now synchronized and consistent!** ✅

**No more confusion!** 🎉
