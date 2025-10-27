# Admin Debug Panel - Log Viewer Enhancements

## ✅ Current Implementation

The Admin Debug Panel **already has a fully functional Log Viewer tab** (Tab 3) with the following features:

### Existing Features

1. **Log Type Selection**
   - Combined logs (all logs)
   - Error logs (errors only)
   - Access logs (HTTP access logs)

2. **Log Controls**
   - Lines selector (50, 100, 200, 500)
   - Search functionality
   - Refresh button
   - Clear log button
   - Log statistics (total size, total lines)

3. **Log Display**
   - Monospace font for readability
   - Dark theme (GitHub-style)
   - Scrollable view (max height: 600px)
   - Newest logs first (reversed order)

### Backend API Endpoints

All necessary endpoints exist in `backend/routes/debug.routes.js`:

- `GET /api/debug/logs` - List all log files with stats
- `GET /api/debug/logs/:logType` - Read specific log with pagination and search
- `GET /api/debug/logs/:logType/tail` - Get latest entries from log
- `DELETE /api/debug/logs/:logType` - Clear specific log file

### Log Service

`backend/services/log.service.js` provides:
- Log file reading with pagination
- Search filtering
- File statistics
- Log clearing functionality

---

## 🎯 Viewing New Structured Logs

### Current Status: **READY TO USE** ✅

Once you restart the backend server (to activate the new logging middleware), the Log Viewer will **automatically display** the new structured logs with request IDs.

### How to Access

1. **Navigate to Admin Debug Panel**
   - URL: `http://localhost:3000/admin/debug` (or your frontend URL)
   - Requires admin role

2. **Click on "Log Viewer" tab** (Tab 3, icon: 📄)

3. **Select log type**:
   - **Combined** - See all logs including request IDs, business events, security events
   - **Error** - See error logs with full context and stack traces
   - **Access** - See HTTP access logs from Morgan

4. **View structured logs** with:
   - Request IDs (UUID format)
   - JSON-formatted structured data
   - Timestamps
   - Log levels (info, warn, error)
   - User context (userId, employeeId, userRole)

### Example Log Entries You'll See

After server restart with new middleware:

**Request Logging**:
```json
{
  "level": "info",
  "message": "Incoming request: POST /api/timesheets/bulk-submit",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/api/timesheets/bulk-submit",
  "userId": 42,
  "employeeId": 5,
  "userRole": "employee",
  "timestamp": "2025-10-24T10:30:45.123Z"
}
```

**Business Event**:
```json
{
  "level": "info",
  "message": "Business event: timesheet_submitted",
  "type": "business_event",
  "event": "timesheet_submitted",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "timesheetId": 123,
    "employeeId": 5,
    "totalHours": 40,
    "weekStartDate": "2025-10-21"
  },
  "timestamp": "2025-10-24T10:30:46.456Z"
}
```

**Security Event**:
```json
{
  "level": "warn",
  "message": "Security event: access_denied",
  "type": "security_event",
  "event": "access_denied",
  "severity": "medium",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "resource": "/api/admin/users",
    "userRole": "employee",
    "requiredRole": "admin"
  },
  "timestamp": "2025-10-24T10:30:47.789Z"
}
```

---

## 🚀 Recommended Enhancements (Optional)

While the Log Viewer is functional, here are optional enhancements to improve viewing of structured logs:

### Enhancement 1: JSON Log Prettifier

**Problem**: JSON logs appear as single-line strings
**Solution**: Add JSON parsing and pretty-printing

**Location**: `frontend/src/components/features/admin/AdminDebugPanel.js`

**Code Addition** (around line 686):
```javascript
const formatLogEntry = (log) => {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(log);
    
    // Check if it's a structured log with our format
    if (parsed.level && parsed.message) {
      return (
        <Box>
          {/* Header with level, timestamp, and request ID */}
          <Box sx={{ display: 'flex', gap: 2, mb: 0.5 }}>
            <Chip 
              label={parsed.level.toUpperCase()} 
              size="small"
              color={
                parsed.level === 'error' ? 'error' :
                parsed.level === 'warn' ? 'warning' : 'info'
              }
            />
            <Typography variant="caption" color="text.secondary">
              {new Date(parsed.timestamp).toLocaleString()}
            </Typography>
            {parsed.requestId && (
              <Chip 
                label={`ID: ${parsed.requestId.substring(0, 8)}...`}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
            )}
          </Box>
          
          {/* Message */}
          <Typography variant="body2" sx={{ mb: 1 }}>
            {parsed.message}
          </Typography>
          
          {/* Data (if present) */}
          {parsed.data && (
            <Box 
              component="pre" 
              sx={{ 
                fontSize: '11px', 
                backgroundColor: 'rgba(0,0,0,0.2)',
                p: 1,
                borderRadius: 1,
                overflow: 'auto'
              }}
            >
              {JSON.stringify(parsed.data, null, 2)}
            </Box>
          )}
        </Box>
      );
    }
  } catch (e) {
    // Not JSON or parse error, return as-is
  }
  
  // Return plain text log
  return <Typography variant="body2">{log}</Typography>;
};
```

Then update the logs rendering (line 690):
```javascript
{logs.map((log, index) => (
  <Box
    key={index}
    sx={{
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      pb: 1,
      mb: 1
    }}
  >
    {formatLogEntry(log)}
  </Box>
))}
```

### Enhancement 2: Request ID Filter

**Problem**: Hard to trace all logs for a specific request
**Solution**: Add request ID filter

**Code Addition** (around line 615):
```javascript
<Grid item xs={12} md={2}>
  <TextField
    fullWidth
    size="small"
    label="Request ID"
    placeholder="Enter request ID"
    value={logRequestIdFilter}
    onChange={(e) => setLogRequestIdFilter(e.target.value)}
  />
</Grid>
```

**State Addition** (around line 90):
```javascript
const [logRequestIdFilter, setLogRequestIdFilter] = useState('');
```

**Update loadLogs function** (around line 260):
```javascript
const loadLogs = async () => {
  try {
    setLoading(true);
    const params = new URLSearchParams({
      lines: logLines,
      offset: logOffset,
      search: logRequestIdFilter || logSearch // Use request ID filter if provided
    });
    
    const response = await http.get(`/debug/logs/${selectedLogType}?${params}`);
    if (response.data.success) {
      setLogs(response.data.data.logs);
    }
  } catch (error) {
    console.error('Error loading logs:', error);
    showNotification('Failed to load logs', 'error');
  } finally {
    setLoading(false);
  }
};
```

### Enhancement 3: Log Level Filtering

**Problem**: Can't filter by log level (info, warn, error)
**Solution**: Add log level filter

**Code Addition** (around line 595):
```javascript
<Grid item xs={12} md={2}>
  <FormControl fullWidth size="small">
    <InputLabel>Log Level</InputLabel>
    <Select
      value={logLevelFilter}
      label="Log Level"
      onChange={(e) => setLogLevelFilter(e.target.value)}
    >
      <MenuItem value="">All</MenuItem>
      <MenuItem value="error">Error</MenuItem>
      <MenuItem value="warn">Warning</MenuItem>
      <MenuItem value="info">Info</MenuItem>
      <MenuItem value="debug">Debug</MenuItem>
    </Select>
  </FormControl>
</Grid>
```

### Enhancement 4: Real-Time Log Streaming

**Problem**: Need to manually refresh to see new logs
**Solution**: Add auto-refresh option

**Code Addition** (around line 640):
```javascript
<FormControlLabel
  control={
    <Switch
      checked={autoRefresh}
      onChange={(e) => setAutoRefresh(e.target.checked)}
    />
  }
  label="Auto-refresh (5s)"
/>
```

**State and Effect** (around line 90):
```javascript
const [autoRefresh, setAutoRefresh] = useState(false);

useEffect(() => {
  let interval;
  if (autoRefresh && tabValue === 2) {
    interval = setInterval(() => {
      loadLogs();
    }, 5000); // Refresh every 5 seconds
  }
  return () => clearInterval(interval);
}, [autoRefresh, tabValue]);
```

### Enhancement 5: Export Logs

**Problem**: Can't export logs for external analysis
**Solution**: Add export button

**Code Addition** (around line 650):
```javascript
<Button
  variant="outlined"
  size="small"
  startIcon={<CloudDownload />}
  onClick={exportLogs}
>
  Export
</Button>
```

**Function Addition**:
```javascript
const exportLogs = () => {
  const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${selectedLogType}-${new Date().toISOString()}.log`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

---

## 📊 How to Use the Log Viewer (Step-by-Step)

### Step 1: Restart Backend Server

**CRITICAL**: The new logging middleware is integrated but requires server restart.

**Option A**: Use VS Code Task
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Tasks: Restart Running Task"
3. Select "start-backend"

**Option B**: Manual Restart
```bash
cd d:\skyraksys_hrm\backend
node server.js
```

### Step 2: Access Admin Debug Panel

1. Open browser: `http://localhost:3000` (or your frontend URL)
2. Login as admin user
3. Navigate to Admin menu → Debug Panel
4. Click on **"Log Viewer"** tab (3rd tab)

### Step 3: View Recent Logs

1. **Select log type**: "Combined" (to see all logs)
2. **Set lines**: 100 (good starting point)
3. **Click Refresh** to load latest logs
4. Logs display newest first

### Step 4: Trace a Request

1. Make an API request (e.g., submit a timesheet)
2. Note the **X-Request-ID** header in the response (or copy from browser DevTools)
3. In Log Viewer, paste the request ID in the **Search** field
4. Click search icon or press Enter
5. All logs for that request will be displayed together

**Example Request ID**: `550e8400-e29b-41d4-a716-446655440000`

### Step 5: Monitor Security Events

1. Select "Combined" or "Error" log type
2. Search for "security_event" or "unauthorized"
3. Review failed authentication attempts
4. Check access denial patterns

### Step 6: Debug Errors

1. Select "Error" log type
2. See errors with full context:
   - Stack traces
   - Request IDs for tracing
   - User information
   - Request parameters

### Step 7: Monitor Performance

1. Select "Combined" log type
2. Search for "slow" or "performance"
3. See slow queries and operations
4. Review request durations

---

## 🎨 What You'll See in the Log Viewer

### Before Server Restart (Old Logs)

Plain text logs:
```
2025-10-24 10:30:45 [info]: Processing timesheet submission
2025-10-24 10:30:46 [info]: Timesheet submitted successfully
2025-10-24 10:30:47 [error]: Database query failed
```

### After Server Restart (New Structured Logs)

JSON-formatted logs with rich context:
```json
{"level":"info","message":"Incoming request: POST /api/timesheets","requestId":"550e8400-...","method":"POST","userId":42,"timestamp":"2025-10-24T10:30:45.123Z"}

{"level":"info","message":"Business event: timesheet_submitted","type":"business_event","requestId":"550e8400-...","data":{"timesheetId":123,"employeeId":5,"totalHours":40},"timestamp":"2025-10-24T10:30:46.456Z"}

{"level":"info","message":"Request completed: POST /api/timesheets 201","requestId":"550e8400-...","statusCode":201,"duration":1234,"timestamp":"2025-10-24T10:30:47.789Z"}
```

**All 3 logs above have the same `requestId`** - this allows you to trace the entire request lifecycle!

---

## 🔍 Common Search Patterns

### Find All Logs for a Request
```
Search: 550e8400-e29b-41d4-a716-446655440000
```

### Find Failed Logins
```
Search: failed_login
```

### Find Slow Operations
```
Search: slow
```

### Find Security Events
```
Search: security_event
```

### Find Timesheet Submissions
```
Search: timesheet_submitted
```

### Find Authorization Failures
```
Search: access_denied
```

### Find Database Errors
```
Search: database
Log Type: Error
```

### Find Logs for Specific User
```
Search: userId":42
```

### Find Logs for Specific Employee
```
Search: employeeId":5
```

---

## 💡 Best Practices

### DO ✅

1. **Use Request IDs for tracing**
   - Copy request ID from API response headers
   - Search for it in Log Viewer
   - See complete request lifecycle

2. **Monitor Combined logs regularly**
   - Check for unexpected patterns
   - Review security events
   - Monitor error rates

3. **Clear old logs periodically**
   - Use "Clear Log" button
   - Keeps file sizes manageable
   - Improves search performance

4. **Export logs for analysis**
   - Export logs before clearing
   - Analyze trends over time
   - Share with team for troubleshooting

5. **Use search effectively**
   - Search by request ID
   - Search by event type
   - Search by user ID
   - Search by error message

### DON'T ❌

1. **Don't ignore security events**
   - Review failed login attempts
   - Investigate access denials
   - Check for suspicious patterns

2. **Don't let logs grow too large**
   - Winston already rotates at 5MB
   - Clear old logs when needed
   - Monitor disk space

3. **Don't search too broadly**
   - Use specific search terms
   - Filter by log type first
   - Limit number of lines

---

## 📈 Log Statistics

The Log Viewer displays statistics for each log file:

- **Total Size**: Combined file size (formatted: KB, MB, GB)
- **Total Lines**: Number of log entries
- **Last Modified**: When the log was last written to

**Example**:
```
Total Size: 2.5 MB | Total Lines: 15,234
```

---

## 🛠️ Troubleshooting

### Log Viewer shows "No logs found"

**Cause**: Log files don't exist yet or are empty

**Solution**: 
1. Restart backend server
2. Make some API requests
3. Refresh Log Viewer

### Can't see request IDs in logs

**Cause**: Server not restarted with new middleware

**Solution**:
1. Stop backend server
2. Restart backend server
3. Make new API requests
4. Check logs (old logs won't have request IDs)

### Logs not updating

**Cause**: Need to refresh manually

**Solution**:
1. Click "Refresh" button
2. Or implement auto-refresh enhancement (see above)

### Search not working

**Cause**: Search is case-insensitive but exact substring match

**Solution**:
1. Try shorter search terms
2. Remove special characters
3. Search for specific field values

### Can't access Log Viewer

**Cause**: Requires admin role

**Solution**:
1. Login with admin account
2. Check user role in database
3. Contact system administrator

---

## 📞 Summary

### Current Status: **FULLY FUNCTIONAL** ✅

The Admin Debug Panel Log Viewer is:
- ✅ Already implemented
- ✅ Backend APIs ready
- ✅ Frontend UI complete
- ✅ Compatible with new structured logs
- ✅ Ready to use immediately after server restart

### Immediate Action Required:

1. **Restart backend server** to activate new logging middleware
2. **Navigate to Admin Debug Panel → Log Viewer tab**
3. **View structured logs** with request IDs and rich context

### Optional Enhancements:

The enhancements listed above (JSON prettifier, request ID filter, log level filtering, auto-refresh, export) are **optional improvements** that can be added later if needed. The current Log Viewer is fully functional and will display all new structured logs correctly.

---

**Last Updated**: 2025-10-24
**Status**: Fully Functional (Restart Required)
**Documentation**: Complete
