# Admin Debug Panel - Complete Implementation Guide

## 🎯 Overview

A comprehensive internal administration tool that provides:
- **System Information Monitoring** - OS, memory, CPU, database status
- **Configuration Management** - View/edit .env variables, backup/restore
- **Log Viewer** - Real-time log viewing with search and filtering
- **No Authentication Required** - Direct access for internal use

## 📁 Files Created/Modified

### Backend Services

#### 1. `backend/services/log.service.js` (NEW - 215 lines)
**Purpose**: Read and manage application log files

**Features**:
- Read logs with pagination (combined.log, error.log, access.log)
- Search/filter log entries
- Get log file statistics (size, line count)
- Clear log files
- Tail logs (get latest N lines)

**Methods**:
```javascript
readLog(logType, { lines, offset, search })    // Read log with pagination
getLogFiles()                                   // Get all log files info
clearLog(logType)                              // Clear specific log
tailLog(logType, lines)                        // Get latest entries
getLogStats()                                  // Get log statistics
```

#### 2. `backend/services/config.service.js` (NEW - 282 lines)
**Purpose**: Manage .env configuration file

**Features**:
- Read .env file with section parsing
- Update single/multiple configuration variables
- Create automatic backups before changes
- Restore from backups
- Validate configuration values
- List all backup files

**Methods**:
```javascript
readEnvFile()                                  // Parse .env into sections
getAllConfig()                                 // Get all configuration
updateConfig(key, value)                       // Update single variable
updateMultipleConfig(updates)                  // Bulk update
createBackup()                                 // Create .env backup
restoreFromBackup(backupFile)                  // Restore backup
listBackups()                                  // List backup files
validateConfig(config)                         // Validate configuration
```

#### 3. `backend/routes/debug.routes.js` (ENHANCED - 595 lines)
**Purpose**: API endpoints for debug panel

**New Endpoints**:

**System Information**:
```
GET  /api/debug/system/info       - OS, CPU, memory, Node.js info
GET  /api/debug/system/database   - Database status, size, connections
```

**Configuration Management**:
```
GET    /api/debug/config          - Get all configuration
PUT    /api/debug/config/:key     - Update single config variable
PUT    /api/debug/config          - Update multiple variables
POST   /api/debug/config/backup   - Create configuration backup
GET    /api/debug/config/backups  - List all backups
POST   /api/debug/config/restore  - Restore from backup
```

**Log Viewing**:
```
GET    /api/debug/logs            - List all log files with stats
GET    /api/debug/logs/:logType   - Read log with pagination
GET    /api/debug/logs/:logType/tail - Get latest log entries
DELETE /api/debug/logs/:logType   - Clear specific log
```

**Existing Endpoints** (preserved):
```
GET  /api/debug/stats             - Dashboard statistics
GET  /api/debug/employees         - All employees
GET  /api/debug/users             - All users
GET  /api/debug/departments       - All departments
GET  /api/debug/positions         - All positions
GET  /api/debug/leaves            - All leave requests
GET  /api/debug/timesheets        - All timesheets
GET  /api/debug/payslips          - All payslips
PUT  /api/debug/leaves/:id/approve - Approve leave
PUT  /api/debug/leaves/:id/reject  - Reject leave
POST /api/debug/seed-demo         - Seed demo data
POST /api/debug/sql               - Execute SQL query
```

**Security Features**:
- Sensitive values (passwords, secrets) are masked in responses
- SQL injection protection (dangerous keywords blocked)
- Automatic backup before config changes
- Production mode check commented out (enable if needed)

### Frontend Component

#### 4. `frontend/src/components/features/admin/AdminDebugPanel.js` (NEW - 1,086 lines)
**Purpose**: Modern UI for system administration

**Features**:

**Tab 1 - System Info**:
- Application details (name, version, environment, Node version, port)
- Server information (platform, architecture, hostname, uptime)
- Memory usage with percentage indicator
- CPU details (model, cores, speed)
- Database status (connection, size, version, table statistics)
- Real-time refresh capability

**Tab 2 - Configuration Editor**:
- Grouped by sections (General, Database, JWT, Security, CORS, Email)
- Edit any environment variable
- Save single or multiple changes
- Create backups before changes
- View backup history
- Restore from any backup
- Warning messages about server restart

**Tab 3 - Log Viewer**:
- Select log type (combined, error, access)
- Adjustable lines per page (50, 100, 200, 500)
- Real-time search/filter
- Monospace terminal-style display
- Clear log functionality
- Log file statistics (size, total lines)
- Pagination support

**UI Design**:
- Modern Material-UI components
- Purple/indigo gradient theme (#6366f1 → #8b5cf6)
- Responsive grid layout
- Loading states with spinners
- Success/error notifications
- Accordion sections for organization
- Color-coded status chips

### Configuration & Routing

#### 5. `frontend/src/App.js` (UPDATED)
**Changes**:
```javascript
// Import new component
const AdminDebugPanelNew = lazy(() => import('./components/features/admin/AdminDebugPanel'));

// Add route (no authentication)
<Route path="/admin/debug" element={
  <Suspense fallback={<EnhancedLoadingFallback text="Loading Debug Panel..." />}>
    <AdminDebugPanelNew />
  </Suspense>
} />
```

#### 6. `frontend/src/components/layout/Layout.js` (UPDATED)
**Changes**:
```javascript
// Add navigation link (admin only)
{ text: 'Debug Panel', icon: <SettingsIcon />, path: '/admin/debug', roles: ['admin'] },
```

#### 7. `backend/routes/debug.routes.js` (UPDATED)
**Security Configuration**:
```javascript
// Production check is COMMENTED OUT to allow use in prod
// Uncomment these lines if you want to disable in production:

// const checkDevelopmentMode = (req, res, next) => {
//     if (process.env.NODE_ENV === 'production') {
//         return res.status(403).json({
//             success: false,
//             message: 'Debug endpoints are disabled in production'
//         });
//     }
//     next();
// };
// router.use(checkDevelopmentMode);
```

## 🚀 Usage

### Access the Panel

**URL**: `http://95.216.14.232/admin/debug`

**Authentication**: None required (direct access)

**Access via Navigation**:
1. Login as admin user
2. Click "Debug Panel" in sidebar navigation
3. Or directly navigate to `/admin/debug`

### System Information Tab

**View**:
- Application version and environment
- Server platform and uptime
- Memory usage (total, used, free, %)
- CPU specifications
- Database connection status
- Database size and table counts

**Actions**:
- Click "Refresh All System Information" to update

### Configuration Editor Tab

**View Configuration**:
- All .env variables grouped by section
- Sensitive values are masked (***MASKED***)

**Edit Configuration**:
1. Modify any field(s)
2. Click "Save Changes"
3. Restart server to apply

**Backup Management**:
1. Click "Create Backup" to save current config
2. Click "Load Backups" to see backup history
3. Click restore icon to revert to backup

**Warning**: Server restart required after config changes!

### Log Viewer Tab

**View Logs**:
1. Select log type: Combined, Error, or Access
2. Choose lines per page: 50, 100, 200, 500
3. Enter search term (optional)
4. Click "Refresh"

**Clear Logs**:
1. Click trash icon next to "Refresh"
2. Confirm action
3. Log file is cleared

**Features**:
- Newest logs appear first
- Monospace terminal-style display
- Dark theme for readability
- Total size and line count displayed

## 🔐 Security Considerations

### Current Configuration
- **No Authentication**: Panel is accessible without login
- **Production Enabled**: Works in all environments (dev/prod)
- **Sensitive Data**: Passwords/secrets are masked in display
- **SQL Protection**: Dangerous keywords blocked
- **Backup Safety**: Auto-backup before config changes

### Recommended Security Measures

**Option 1 - IP Whitelisting** (Nginx/Apache):
```nginx
location /admin/debug {
    allow 192.168.1.0/24;   # Internal network
    deny all;
    proxy_pass http://localhost:3000;
}
```

**Option 2 - Enable Production Check**:
Uncomment lines in `backend/routes/debug.routes.js`:
```javascript
const checkDevelopmentMode = (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            success: false,
            message: 'Debug endpoints are disabled in production'
        });
    }
    next();
};
router.use(checkDevelopmentMode);
```

**Option 3 - Basic Authentication**:
Add middleware to check custom header/token:
```javascript
const checkDebugToken = (req, res, next) => {
    const token = req.headers['x-debug-token'];
    if (token !== process.env.DEBUG_PANEL_TOKEN) {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
};
router.use(checkDebugToken);
```

**Option 4 - VPN Access Only**:
Host on internal VPN, restrict external access

## 📊 Features Summary

### ✅ Implemented Features

**System Monitoring**:
- [x] Real-time system information
- [x] Memory usage monitoring
- [x] CPU specifications
- [x] Database connection status
- [x] Database size and statistics
- [x] Table row counts

**Configuration Management**:
- [x] View all .env variables
- [x] Edit single configuration
- [x] Bulk update configuration
- [x] Sensitive data masking
- [x] Automatic backups
- [x] Backup history
- [x] Restore from backup
- [x] Configuration validation

**Log Management**:
- [x] View combined logs
- [x] View error logs
- [x] View access logs
- [x] Log search/filter
- [x] Pagination (50/100/200/500 lines)
- [x] Tail logs (latest entries)
- [x] Clear logs
- [x] Log statistics
- [x] File size display

**User Interface**:
- [x] Modern Material-UI design
- [x] Tabbed navigation
- [x] Responsive layout
- [x] Loading states
- [x] Success/error notifications
- [x] Gradient theme
- [x] Accordion sections
- [x] Color-coded statuses

### 🎨 Design Highlights

**Color Scheme**:
- Primary: Indigo (#6366f1) → Purple (#8b5cf6) gradient
- Success: Green (#10b981)
- Error: Red (#ef4444)
- Background: Light grey (#f8fafc)

**Typography**:
- Font: Inter (system fallback)
- Monospace logs: Consolas, Monaco, Courier New

**Components**:
- Cards with shadows
- Gradient buttons
- Chip status indicators
- Table layouts
- Accordion panels
- Dialog modals

## 🧪 Testing Guide

### Test System Information
1. Navigate to `/admin/debug`
2. Verify "System Info" tab shows:
   - Application name and version
   - Current environment
   - Memory usage percentage
   - Database connection status
3. Click "Refresh All System Information"
4. Verify data updates

### Test Configuration Editor
1. Go to "Configuration" tab
2. Expand "Database Configuration" section
3. Change `DB_NAME` value
4. Click "Save Changes"
5. Verify success notification
6. Click "Create Backup"
7. Verify backup created
8. Click "Load Backups"
9. Verify backup appears in list
10. Click restore icon
11. Verify original value restored

### Test Log Viewer
1. Go to "Log Viewer" tab
2. Select "Error" log type
3. Select "100" lines
4. Enter search term (e.g., "error")
5. Click "Refresh"
6. Verify logs appear
7. Verify search filters results
8. Change to "Combined" log
9. Verify different logs load
10. Click trash icon
11. Confirm clear action
12. Verify log cleared

## 🔄 Restart After Config Changes

**Important**: Configuration changes require server restart to take effect.

**Option 1 - Manual Restart**:
```bash
# Kill and restart backend
cd backend
taskkill /F /IM node.exe
node server.js
```

**Option 2 - PM2 Restart**:
```bash
pm2 restart backend
```

**Option 3 - Task Manager**:
1. Stop backend task in VS Code
2. Restart using "start-backend" task

## 📝 Environment Variables Reference

### Application
```env
NODE_ENV=development|production
HOST=0.0.0.0
PORT=5000
```

### Database
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=hrm_admin
DB_PASSWORD=hrm_secure_2024
DB_DIALECT=postgres
```

### JWT
```env
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

### Email (SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=Skyraksys HRM <noreply@skyraksys.com>
```

### CORS
```env
CORS_ORIGIN=http://95.216.14.232
ALLOWED_ORIGINS=http://95.216.14.232,http://95.216.14.232:3000
```

## 🚨 Troubleshooting

### Issue: Configuration not updating
**Solution**: Restart backend server after saving changes

### Issue: Logs not showing
**Solution**: 
1. Check if log files exist in `backend/logs/`
2. Verify Winston logger is configured
3. Generate some activity to create logs

### Issue: Database info not loading
**Solution**:
1. Verify database connection in .env
2. Check PostgreSQL is running
3. Verify user has permission to query system tables

### Issue: "Service not configured" error
**Solution**: Check SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env

### Issue: Cannot save config
**Solution**:
1. Check file permissions on .env file
2. Verify backend has write access
3. Check for syntax errors in values

## 🎉 Summary

You now have a **complete internal admin tool** that can:

✅ **Monitor** system health and performance  
✅ **Manage** configuration without SSH access  
✅ **View** logs in real-time with search  
✅ **Backup** and restore configurations  
✅ **Access** without authentication (for internal use)  
✅ **Work** in both development and production  

The panel is production-ready and accessible at:
**`http://95.216.14.232/admin/debug`**

Admin users can also access it from the sidebar navigation!

---

**Created**: October 24, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
