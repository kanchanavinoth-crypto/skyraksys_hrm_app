# 🔧 Backend Scripts Directory

This directory contains utility scripts for managing the SkyRakSys HRM system.

## 📋 Script Categories

### 👥 **User Management Scripts**
- `create-admin.js` - Create admin user account
- `create-demo-users.js` - Create demo user accounts for testing
- `create-test-employee.js` - Create test employee records
- `list-employees.js` - List all employees in the system
- `list-users.js` - List all user accounts
- `update-admin.js` - Update admin account details
- `update-demo-passwords.js` - Update demo user passwords

### 🔧 **Database Management Scripts**
- `seed-data.js` - Seed initial data into database
- `setup-test-data.js` - Setup test data for development
- `fix-constraints.js` - Fix database constraint issues
- `fix-demo-passwords.js` - Fix demo user password issues
- `recreate-timesheet-table.js` - Recreate timesheet table structure

### 🎭 **Demo Scripts**
- `demo-resubmit.js` - Demonstrate timesheet resubmit workflow

## 🚀 How to Use Scripts

### Setup Initial Data
```bash
cd backend
node scripts/seed-data.js
```

### Create Admin User
```bash
node scripts/create-admin.js
```

### Create Demo Users
```bash
node scripts/create-demo-users.js
```

### List Current Users
```bash
node scripts/list-users.js
```

### List Current Employees
```bash
node scripts/list-employees.js
```

### Setup Test Environment
```bash
node scripts/setup-test-data.js
```

## ⚠️ Important Notes

- **Run scripts with caution** - Some scripts modify database data
- **Backup database** before running destructive scripts
- **Check environment** - Ensure you're running against correct database
- **Admin privileges** - Some scripts require admin database access

## 📊 Script Status

All scripts are tested and working properly with the current system configuration.
