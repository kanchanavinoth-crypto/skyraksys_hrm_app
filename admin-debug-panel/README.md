# HRM Admin Debug Panel

## 🎯 Purpose
A **standalone, no-authentication admin panel** for directly viewing and manipulating the HRM database. Perfect for:
- **Testing**: Quickly verify what's in the database
- **Debugging**: See real-time data changes
- **Seeding**: Add test data easily
- **Data Correction**: Fix issues directly
- **Development**: No need to go through the main app

## ⚠️ WARNING
**NO AUTHENTICATION** - Use ONLY in development environment!
**NEVER** deploy this to production or expose it publicly.

## 🚀 Quick Start

### Option 1: Using Python (Easiest)
```bash
cd admin-debug-panel
python -m http.server 8080
```
Then open: http://localhost:8080

### Option 2: Using Node.js
```bash
cd admin-debug-panel
npx http-server -p 8080
```
Then open: http://localhost:8080

### Option 3: Using PHP
```bash
cd admin-debug-panel
php -S localhost:8080
```
Then open: http://localhost:8080

### Option 4: Using Live Server (VS Code Extension)
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Click "Open with Live Server"

## 📋 Features

### 1. Dashboard
- **Real-time stats** for all entities
- **Quick actions** for bulk operations
- **System overview** at a glance

### 2. Employees Management
- ✅ View all employees
- ✅ Add new employees
- ✅ Search employees
- ✅ View employee details (JSON)
- ✅ Delete employees
- 🔜 Edit employees (coming soon)

### 3. Departments Management
- ✅ View all departments
- ✅ Add new departments
- ✅ Delete departments
- 🔜 Edit departments (coming soon)

### 4. Positions Management
- ✅ View all positions
- ✅ Add new positions
- ✅ Delete positions
- 🔜 Edit positions (coming soon)

### 5. Users Management
- ✅ View all users
- ✅ View user details
- ✅ Reset passwords
- See login history

### 6. Leave Requests
- ✅ View all leaves
- ✅ Approve leaves
- ✅ Reject leaves
- See leave status

### 7. Timesheets
- ✅ View all timesheets
- ✅ See submission status
- View timesheet details

### 8. Payslips
- ✅ View all payslips
- ✅ View payslip details
- 🔜 Download payslips (coming soon)

### 9. SQL Console (Advanced)
- 🔜 Run custom SQL queries
- 🔜 View query results
- *Requires backend endpoint*

## 🔧 Configuration

### Update API Base URL
In `admin-debug.js`, change this line if your backend is on a different port:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

## 📊 How It Works

### Architecture
```
Admin Debug Panel (Port 8080)
     ↓ (HTTP Requests)
Backend API (Port 5000)
     ↓
PostgreSQL Database
```

### Data Flow
1. **Panel sends HTTP requests** to backend API
2. **Backend processes** requests (no auth check needed for debug endpoints)
3. **Database returns** data
4. **Panel displays** data in tables/cards

## 🎨 Features Breakdown

### View Operations
- 👁️ **View**: See full JSON data in modal
- 📊 **List**: See all records in table format
- 🔍 **Search**: Filter records by text

### Modify Operations
- ➕ **Add**: Create new records with forms
- ✏️ **Edit**: Update existing records (coming soon)
- 🗑️ **Delete**: Remove records (with confirmation)

### Bulk Operations
- 🌱 **Seed Demo Data**: Create sample records
- 🗑️ **Clear All Data**: Delete everything (dangerous!)
- 📥 **Export Data**: Download JSON export

## 🎯 Use Cases

### 1. Testing After Development
```
1. Make changes in main app
2. Open debug panel
3. Verify data in database
4. Check if relationships are correct
```

### 2. Seeding Test Data
```
1. Open debug panel
2. Click "Seed Demo Data"
3. Creates departments, positions, employees
4. Ready for testing!
```

### 3. Fixing Data Issues
```
1. Employee has wrong department?
2. Open debug panel
3. Click edit (or delete and recreate)
4. Fixed!
```

### 4. Verifying User Accounts
```
1. Created user in main app
2. Open debug panel → Users tab
3. See if user was created
4. Check role, email, status
```

## 🔐 Security Notes

### ⚠️ NEVER DO THIS:
- ❌ Deploy to production
- ❌ Expose to internet
- ❌ Use with real user data
- ❌ Keep running when not needed

### ✅ SAFE PRACTICES:
- ✅ Use only on localhost
- ✅ Run only in development
- ✅ Close when done
- ✅ Use with test data only

## 🐛 Troubleshooting

### Panel shows "Loading..." forever
**Cause**: Backend not running or wrong URL
**Fix**:
1. Check backend is running on port 5000
2. Check `API_BASE_URL` in `admin-debug.js`
3. Check browser console for errors

### CORS Errors
**Cause**: Backend blocking requests
**Fix**: Backend `.env` should have:
```env
CORS_ALLOW_ALL=true  # For development only!
```

### "429 Too Many Requests"
**Cause**: Rate limiting enabled
**Fix**: Disable rate limiting in development:
```env
RATE_LIMIT_ENABLED=false
```

### Empty Tables
**Cause**: No data in database
**Fix**:
1. Click "Seed Demo Data" button
2. Or add data through main app first

## 📝 Backend Requirements

### Existing Endpoints Used
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- (etc. for all entities)

### Optional: Add Debug Endpoints
Create `/backend/routes/debug.routes.js`:
```javascript
// SQL Console endpoint
router.post('/sql', async (req, res) => {
    const { query } = req.body;
    const result = await sequelize.query(query);
    res.json({ success: true, data: result });
});

// Bulk clear endpoint
router.delete('/clear-all', async (req, res) => {
    await Employee.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    // etc.
    res.json({ success: true });
});
```

## 🎓 Tips & Tricks

### Quick Testing Workflow
1. Open main app (port 3000)
2. Open debug panel (port 8080)
3. Side-by-side windows
4. Make changes in main app → Refresh debug panel
5. Instant verification!

### Data Export for Backup
1. Click "Export All Data"
2. Saves JSON file
3. Can import back later (feature coming soon)

### Mass Data Creation
1. Use "Seed Demo Data" button
2. Creates realistic test data
3. Saves time vs manual entry

## 🚀 Future Enhancements

### Planned Features
- [ ] Edit functionality for all entities
- [ ] Bulk import from JSON
- [ ] SQL console with syntax highlighting
- [ ] Data relationships visualizer
- [ ] Audit log viewer
- [ ] Performance metrics
- [ ] Database health checks
- [ ] Backup/restore functionality

### Nice to Have
- [ ] Dark mode
- [ ] Customizable columns
- [ ] Export to CSV/Excel
- [ ] Real-time data updates (WebSocket)
- [ ] Advanced filtering
- [ ] Saved queries
- [ ] Data comparison tool

## 📄 File Structure
```
admin-debug-panel/
├── index.html          # Main HTML file
├── admin-debug.js      # All JavaScript logic
├── README.md           # This file
└── server.js           # Optional: Node.js server
```

## 🎉 Getting Started

1. **Start your backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the debug panel**:
   ```bash
   cd admin-debug-panel
   python -m http.server 8080
   ```

3. **Open in browser**:
   ```
   http://localhost:8080
   ```

4. **Start testing!**

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify backend is running
3. Check API base URL configuration
4. Ensure CORS is enabled in backend

## 🎯 Remember

**This is a DEVELOPMENT TOOL only!**
- No authentication
- No authorization
- No security
- Direct database access
- Use responsibly!

---

**Happy Debugging! 🛠️**
