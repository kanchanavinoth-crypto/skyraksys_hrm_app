# Admin Debug Panel - Quick Start Guide 🚀

## 🎯 Access the Panel

**URL:** `http://localhost:3000/admin/debug`

No authentication required (internal tool only).

---

## 🌍 Environment Switching

### Select Environment (Top-Right Corner)
- 🟢 **LOCAL** - Your development machine
- 🔵 **DEV** - Development server  
- 🟠 **STAGING** - Pre-production testing
- 🔴 **PROD** - ⚠️ Live production system

### PROD Safety
When selecting PROD, you'll see:
1. ⚠️ Confirmation dialog
2. 🚨 Red warning banner at top
3. 💾 Selection saved in localStorage

---

## 🗄️ Database Tools Tab

### Tab 1: SQL Console

**Run a Query:**
```sql
SELECT * FROM "Employees" LIMIT 10;
```

**Features:**
- ✅ Execute button
- ✅ Results table with row count
- ✅ Query history (last 20 queries)
- ✅ Read-only mode toggle (default: ON)

**Safety:**
- 🔒 Read-only mode blocks: DROP, DELETE, UPDATE, INSERT, ALTER
- ⚠️ Toggle OFF to enable write operations

---

### Tab 2: Table Browser

**View Table Data:**
1. Click any table name in left panel
2. See first 50 rows in right panel
3. Click "Schema" to see structure

**Features:**
- 📊 Table sizes and column counts
- 🔍 Schema viewer with PKs, FKs, indexes
- 💾 Backup button per table
- ♻️ Refresh button

**Schema Info Includes:**
- Column names, types, nullable, defaults
- Primary Keys (PK badges)
- Foreign Key relationships
- Index information

---

### Tab 3: Database Stats

**Overview:**
- 📈 Total database size
- 📊 Table count
- 🔢 Total rows

**Largest Tables:**
- See which tables consume most space
- Helpful for optimization

**Active Connections:**
- 👤 User and application
- 🟢 Connection state (active/idle)
- 🔍 Current query

---

## 💡 Quick Tips

### SQL Console Tips
```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Count rows in a table
SELECT COUNT(*) FROM "Employees";

-- Recent data
SELECT * FROM "Timesheets" 
WHERE "createdAt" > NOW() - INTERVAL '7 days';

-- Join example
SELECT e."fullName", d."name" 
FROM "Employees" e 
JOIN "Departments" d ON e."departmentId" = d.id 
LIMIT 10;
```

### Best Practices
- ✅ Always start with `LIMIT` on SELECT queries
- ✅ Keep read-only mode ON unless necessary
- ✅ Test queries on LOCAL/DEV before PROD
- ✅ Use EXPLAIN ANALYZE for slow queries
- ✅ Backup tables before making changes

### Common Queries

**List All Users:**
```sql
SELECT id, email, role, "isActive" FROM "Users";
```

**Recent Activity:**
```sql
SELECT * FROM "ActivityLogs" 
ORDER BY "createdAt" DESC 
LIMIT 50;
```

**Employee Count by Department:**
```sql
SELECT d.name, COUNT(e.id) as employee_count
FROM "Departments" d
LEFT JOIN "Employees" e ON e."departmentId" = d.id
GROUP BY d.name;
```

**Find Duplicate Emails:**
```sql
SELECT email, COUNT(*) 
FROM "Users" 
GROUP BY email 
HAVING COUNT(*) > 1;
```

---

## 🔧 Troubleshooting

**Tables Not Loading?**
- Check System Info tab → Database status
- Verify backend is running (http://localhost:5000)

**Query Fails?**
- Check read-only mode setting
- Verify table names are quoted: `"TableName"`
- Review error message in notification

**Environment Not Switching?**
- Check browser console (F12)
- Clear localStorage and try again
- Verify backend API is accessible

---

## ⚠️ Important Warnings

### PRODUCTION Environment
- 🔴 All changes affect LIVE data
- 🔴 Always confirm operations twice
- 🔴 Backup before destructive changes
- 🔴 Use read-only mode by default

### Dangerous Operations
These are BLOCKED in read-only mode:
- `DROP DATABASE/TABLE/SCHEMA`
- `DELETE FROM`
- `UPDATE ... SET`
- `INSERT INTO`
- `ALTER TABLE`
- `TRUNCATE`

Toggle read-only OFF only when absolutely necessary!

---

## 📊 Feature Comparison

| Feature | Available | Notes |
|---------|-----------|-------|
| View Tables | ✅ | All tables with sizes |
| View Data | ✅ | First 50 rows, paginated |
| View Schema | ✅ | Columns, PKs, FKs, indexes |
| Execute SELECT | ✅ | Read-only mode |
| Execute INSERT/UPDATE/DELETE | ⚠️ | Requires read-only OFF |
| Query History | ✅ | Last 20 queries |
| Backup Table | ✅ | Creates timestamped copy |
| Export Data | ❌ | Coming soon |
| Syntax Highlighting | ❌ | Coming soon |

---

## 🎨 UI Guide

### Color Codes
- 🟢 Green - Safe, Success, Local
- 🔵 Blue - Info, Development, Active
- 🟠 Orange - Warning, Staging
- 🔴 Red - Danger, Production, Error

### Icons
- 🔍 Search/Execute
- 💾 Save/Backup
- ♻️ Refresh
- ⚙️ Settings
- 📊 Data/Stats
- 🗄️ Database
- 📝 Logs

---

## 🚀 Next Steps

After mastering Database Tools, explore:
1. **System Info** - View server health and metrics
2. **Configuration** - Edit environment variables
3. **Log Viewer** - Read application logs

---

## 📞 Need Help?

**Check Logs:**
- Backend: `backend/logs/error.log`
- Frontend: Browser Console (F12)

**Common Issues:**
1. Database connection errors → Check PostgreSQL status
2. Query syntax errors → Use double quotes for table names
3. Environment not switching → Clear browser cache

---

**Happy Debugging! 🎉**

*Version: 2.0.0 | Last Updated: October 24, 2025*
