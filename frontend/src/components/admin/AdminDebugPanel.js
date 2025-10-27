/**
 * ⚠️ DEPRECATED - Legacy Admin Debug Panel
 * 
 * This component is NO LONGER USED in the application.
 * 
 * REPLACEMENT: components/features/admin/AdminDebugPanel.js
 * 
 * As of 2025-10-25, both debug routes now use the enhanced panel:
 *   - /admin/debug → Enhanced panel
 *   - /secret-admin-debug-console-x9z → Enhanced panel (redirected)
 * 
 * The enhanced panel includes:
 *   - Environment Selector
 *   - System Info
 *   - Configuration Management
 *   - Log Viewer with request ID tracking
 *   - Database Tools (improved SQL console)
 * 
 * This file can be safely deleted after verifying the enhanced panel works correctly.
 * 
 * See: ADMIN_DEBUG_ROUTES_MERGED.md for migration details
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Refresh,
  Search,
  Add,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Dashboard,
  People,
  Business,
  Work,
  PersonAdd,
  EventNote,
  Timer,
  Receipt,
  Code,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminDebugPanel = () => {
  // Log API base for debugging
  console.log('🔧 Admin Debug Panel - API Base:', API_BASE);
  
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResults, setSqlResults] = useState(null);

  useEffect(() => {
    loadData();
  }, [currentTab]);

  const showNotification = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const apiCall = async (endpoint, method = 'GET', data = null) => {
    try {
      const url = `${API_BASE}/debug${endpoint}`;
      console.log('🔍 API Call:', method, url);
      
      const config = { 
        method, 
        url,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      if (data) config.data = data;
      
      const response = await axios(config);
      console.log('✅ API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Error:', {
        url: `${API_BASE}/debug${endpoint}`,
        method,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message 
        || error.response?.statusText 
        || error.message 
        || 'Network error - check if backend is running on port 5000';
      
      showNotification(errorMessage, 'error');
      throw error;
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      switch (currentTab) {
        case 0: // Dashboard
          const statsData = await apiCall('/stats');
          setStats(statsData.data);
          break;
        case 1: // Employees
          const empData = await apiCall('/employees');
          setEmployees(empData.data);
          break;
        case 2: // Departments
          const deptData = await apiCall('/departments');
          setDepartments(deptData.data);
          break;
        case 3: // Positions
          const posData = await apiCall('/positions');
          setPositions(posData.data);
          break;
        case 4: // Users
          const userData = await apiCall('/users');
          setUsers(userData.data);
          break;
        case 5: // Leaves
          const leaveData = await apiCall('/leaves');
          console.log('📋 Leaves data loaded:', leaveData.data?.length || 0, 'records');
          setLeaves(leaveData.data || []);
          break;
        case 6: // Timesheets
          const tsData = await apiCall('/timesheets');
          setTimesheets(tsData.data);
          break;
        case 7: // Payslips
          const psData = await apiCall('/payslips');
          setPayslips(psData.data);
          break;
      }
    } catch (error) {
      // Error already handled in apiCall
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      await apiCall(`/leaves/${id}/approve`, 'PUT');
      showNotification('Leave approved successfully', 'success');
      loadData();
    } catch (error) {
      // Error handled in apiCall
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await apiCall(`/leaves/${id}/reject`, 'PUT');
      showNotification('Leave rejected successfully', 'success');
      loadData();
    } catch (error) {
      // Error handled in apiCall
    }
  };

  const handleSeedDemo = async () => {
    try {
      const result = await apiCall('/seed-demo', 'POST');
      showNotification(`Demo data seeded: ${result.data.departments} depts, ${result.data.positions} positions`, 'success');
      loadData();
    } catch (error) {
      // Error handled in apiCall
    }
  };

  const handleExecuteSQL = async () => {
    if (!sqlQuery.trim()) {
      showNotification('Please enter a SQL query', 'warning');
      return;
    }
    try {
      const result = await apiCall('/sql', 'POST', { query: sqlQuery });
      setSqlResults(result.data);
      showNotification(`Query executed: ${result.metadata.rowCount} rows returned`, 'success');
    } catch (error) {
      // Error handled in apiCall
    }
  };

  const renderDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <People sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">{stats.employees || 0}</Typography>
            <Typography variant="body2">Employees</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
          <CardContent>
            <PersonAdd sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">{stats.users || 0}</Typography>
            <Typography variant="body2">Users</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
          <CardContent>
            <EventNote sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">{stats.pendingLeaves || 0}</Typography>
            <Typography variant="body2">Pending Leaves</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
          <CardContent>
            <Receipt sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">{stats.payslips || 0}</Typography>
            <Typography variant="body2">Payslips</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={handleSeedDemo} sx={{ mr: 1 }}>
              Seed Demo Data
            </Button>
            <Button variant="outlined" startIcon={<Refresh />} onClick={loadData}>
              Refresh Stats
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderEmployees = () => {
    const filteredEmployees = employees.filter(e => 
      !searchTerm || 
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <TableContainer 
        component={Paper} 
        sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>Department</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>Position</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', textAlign: 'center' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography variant="body2">
                    {searchTerm ? 'No employees found matching your search' : 'No employees data available'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((emp, index) => (
                <TableRow 
                  key={emp.id}
                  sx={{ 
                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                    '&:hover': { bgcolor: 'action.selected' },
                    transition: 'background-color 0.2s'
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                      {emp.employeeId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: 'primary.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'primary.contrastText',
                          fontWeight: 600,
                          fontSize: '0.875rem'
                        }}
                      >
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {emp.firstName} {emp.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {emp.email || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={emp.department?.name || 'N/A'} 
                      size="small"
                      variant="outlined"
                      sx={{ 
                        borderRadius: 1,
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {emp.position?.title || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip 
                      label={emp.status} 
                      color={emp.status === 'Active' ? 'success' : 'default'} 
                      size="small"
                      sx={{ 
                        fontWeight: 500,
                        minWidth: 70
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderUsers = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last Login</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.filter(u => 
            !searchTerm || 
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.role?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.firstName} {user.lastName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Chip label={user.role} color="primary" size="small" />
              </TableCell>
              <TableCell>
                <Chip 
                  label={user.isActive ? 'Active' : 'Inactive'} 
                  color={user.isActive ? 'success' : 'default'} 
                  size="small" 
                />
              </TableCell>
              <TableCell>
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderDepartments = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Employees</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {departments.filter(d => 
            !searchTerm || 
            d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.description?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((dept) => (
            <TableRow key={dept.id}>
              <TableCell>{dept.id}</TableCell>
              <TableCell>{dept.name}</TableCell>
              <TableCell>{dept.description || 'N/A'}</TableCell>
              <TableCell>{dept.employees?.length || 0}</TableCell>
              <TableCell>
                <Chip 
                  label={dept.isActive ? 'Active' : 'Inactive'} 
                  color={dept.isActive ? 'success' : 'default'} 
                  size="small" 
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderPositions = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Level</TableCell>
            <TableCell>Employees</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {positions.filter(p => 
            !searchTerm || 
            p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.level?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((pos) => (
            <TableRow key={pos.id}>
              <TableCell>{pos.id}</TableCell>
              <TableCell>{pos.title}</TableCell>
              <TableCell>{pos.level || 'N/A'}</TableCell>
              <TableCell>{pos.employees?.length || 0}</TableCell>
              <TableCell>
                <Chip 
                  label={pos.isActive ? 'Active' : 'Inactive'} 
                  color={pos.isActive ? 'success' : 'default'} 
                  size="small" 
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderLeaves = () => {
    const filteredLeaves = leaves.filter(l => 
      !searchTerm || 
      `${l.employee?.firstName} ${l.employee?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Days</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLeaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {leaves.length === 0 
                      ? '📋 No leave requests found in the database' 
                      : '🔍 No leave requests match your search'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>
                    {leave.employee?.firstName} {leave.employee?.lastName}
                  </TableCell>
                  <TableCell>{leave.leaveType}</TableCell>
                  <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>{leave.numberOfDays}</TableCell>
                  <TableCell>
                    <Chip 
                      label={leave.status} 
                      color={
                        leave.status === 'Approved' ? 'success' : 
                        leave.status === 'Rejected' ? 'error' : 
                        'warning'
                      } 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {leave.status === 'Pending' && (
                      <>
                        <IconButton 
                          color="success" 
                          size="small" 
                          onClick={() => handleApproveLeave(leave.id)}
                        >
                          <CheckCircle />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          size="small" 
                          onClick={() => handleRejectLeave(leave.id)}
                        >
                          <Cancel />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderTimesheets = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Week</TableCell>
            <TableCell>Year</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Total Hours</TableCell>
            <TableCell>Submitted</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {timesheets.filter(t => 
            !searchTerm || 
            `${t.employee?.firstName} ${t.employee?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((ts) => (
            <TableRow key={ts.id}>
              <TableCell>
                {ts.employee?.firstName} {ts.employee?.lastName}
              </TableCell>
              <TableCell>Week {ts.weekNumber}</TableCell>
              <TableCell>{ts.year}</TableCell>
              <TableCell>
                <Chip 
                  label={ts.status} 
                  color={
                    ts.status === 'approved' ? 'success' : 
                    ts.status === 'rejected' ? 'error' : 
                    'warning'
                  } 
                  size="small" 
                />
              </TableCell>
              <TableCell>{ts.totalHours || 0}h</TableCell>
              <TableCell>
                {ts.submittedAt ? new Date(ts.submittedAt).toLocaleDateString() : 'Not submitted'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderPayslips = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Month</TableCell>
            <TableCell>Year</TableCell>
            <TableCell>Gross Salary</TableCell>
            <TableCell>Net Salary</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payslips.filter(p => 
            !searchTerm || 
            `${p.employee?.firstName} ${p.employee?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((ps) => (
            <TableRow key={ps.id}>
              <TableCell>
                {ps.employee?.firstName} {ps.employee?.lastName}
              </TableCell>
              <TableCell>{ps.month}</TableCell>
              <TableCell>{ps.year}</TableCell>
              <TableCell>₹{ps.grossSalary?.toLocaleString() || 0}</TableCell>
              <TableCell>₹{ps.netSalary?.toLocaleString() || 0}</TableCell>
              <TableCell>
                <Chip 
                  label={ps.status} 
                  color={ps.status === 'paid' ? 'success' : 'warning'} 
                  size="small" 
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // SQL Query Templates
  const sqlTemplates = [
    { 
      label: 'Select Template...', 
      value: '' 
    },
    { 
      label: '📋 View All Employees', 
      value: 'SELECT id, "employeeId", "firstName", "lastName", email, status FROM employees LIMIT 20;',
      description: 'List all employees with basic info'
    },
    { 
      label: '👤 Create New User', 
      value: `INSERT INTO users ("firstName", "lastName", email, password, role, "isActive", "createdAt", "updatedAt") 
VALUES ('John', 'Doe', 'john.doe@company.com', '$2b$10$hashedpassword', 'employee', true, NOW(), NOW());`,
      description: 'Create a new user account (requires hashed password)'
    },
    { 
      label: '🏢 View Departments with Counts', 
      value: `SELECT d.id, d.name, d.description, COUNT(e.id) as employee_count 
FROM departments d 
LEFT JOIN employees e ON e."departmentId" = d.id 
GROUP BY d.id, d.name, d.description 
ORDER BY employee_count DESC;`,
      description: 'List departments with employee counts'
    },
    { 
      label: '💼 View Positions with Counts', 
      value: `SELECT p.id, p.title, p.level, COUNT(e.id) as employee_count 
FROM positions p 
LEFT JOIN employees e ON e."positionId" = p.id 
GROUP BY p.id, p.title, p.level 
ORDER BY employee_count DESC;`,
      description: 'List positions with employee counts'
    },
    { 
      label: '🏖️ Pending Leave Requests', 
      value: `SELECT lr.id, e."firstName", e."lastName", lr."leaveType", lr."startDate", lr."endDate", lr."numberOfDays", lr.reason 
FROM leave_requests lr 
JOIN employees e ON lr."employeeId" = e.id 
WHERE lr.status = 'Pending' AND lr."deletedAt" IS NULL 
ORDER BY lr."startDate" DESC;`,
      description: 'Show all pending leave requests'
    },
    { 
      label: '⏰ Recent Timesheets', 
      value: `SELECT t.id, e."firstName", e."lastName", t."weekNumber", t.year, t.status, t."totalHours", t."submittedAt" 
FROM timesheets t 
JOIN employees e ON t."employeeId" = e.id 
WHERE t."deletedAt" IS NULL 
ORDER BY t.year DESC, t."weekNumber" DESC 
LIMIT 20;`,
      description: 'View recent timesheet submissions'
    },
    { 
      label: '💰 Recent Payslips', 
      value: `SELECT p.id, e."firstName", e."lastName", p.month, p.year, p."grossSalary", p."netSalary", p.status 
FROM payslips p 
JOIN employees e ON p."employeeId" = e.id 
WHERE p."deletedAt" IS NULL 
ORDER BY p.year DESC, p.month DESC 
LIMIT 20;`,
      description: 'View recent payslips'
    },
    { 
      label: '📊 Employee Statistics', 
      value: `SELECT 
  COUNT(*) as total_employees,
  COUNT(CASE WHEN status = 'Active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'Inactive' THEN 1 END) as inactive,
  COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male,
  COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female
FROM employees 
WHERE "deletedAt" IS NULL;`,
      description: 'Get employee statistics by status and gender'
    },
    { 
      label: '🔐 Active User Accounts', 
      value: `SELECT u.id, u."firstName", u."lastName", u.email, u.role, u."lastLoginAt", e."employeeId" 
FROM users u 
LEFT JOIN employees e ON u.id = e."userId" 
WHERE u."isActive" = true AND u."deletedAt" IS NULL 
ORDER BY u."lastLoginAt" DESC NULLS LAST;`,
      description: 'List all active users with last login'
    },
    { 
      label: '🗄️ Database Tables', 
      value: `SELECT table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count 
FROM information_schema.tables t 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
ORDER BY table_name;`,
      description: 'List all database tables'
    },
    { 
      label: '🔍 Search Employee by Email', 
      value: `SELECT id, "employeeId", "firstName", "lastName", email, "phoneNumber", status 
FROM employees 
WHERE email ILIKE '%@%' AND "deletedAt" IS NULL 
LIMIT 10;`,
      description: 'Search employees by email pattern'
    }
  ];

  const handleTemplateSelect = (event) => {
    const selectedValue = event.target.value;
    if (selectedValue) {
      setSqlQuery(selectedValue);
    }
  };

  const renderSQLConsole = () => (
    <Box>
      <Alert severity="warning" sx={{ mb: 2 }}>
        ⚠️ SQL Console - Use with caution! DROP, TRUNCATE, and ALTER commands are blocked.
      </Alert>
      
      {/* Query Templates Dropdown */}
      <TextField
        select
        fullWidth
        variant="outlined"
        label="📝 Query Templates"
        helperText="Select a pre-built query template to get started"
        onChange={handleTemplateSelect}
        sx={{ mb: 2 }}
        SelectProps={{
          native: true,
        }}
      >
        {sqlTemplates.map((template, index) => (
          <option key={index} value={template.value}>
            {template.label}
          </option>
        ))}
      </TextField>

      {/* SQL Query Input */}
      <TextField
        fullWidth
        multiline
        rows={8}
        variant="outlined"
        label="SQL Query"
        value={sqlQuery}
        onChange={(e) => setSqlQuery(e.target.value)}
        placeholder="SELECT * FROM employees LIMIT 10;"
        helperText="Modify the query as needed, then click Execute"
        sx={{ mb: 2 }}
      />
      
      <Button 
        variant="contained" 
        startIcon={<Code />} 
        onClick={handleExecuteSQL}
        sx={{ mb: 2, mr: 1 }}
      >
        Execute Query
      </Button>
      <Button 
        variant="outlined" 
        onClick={() => setSqlQuery('')}
        sx={{ mb: 2 }}
      >
        Clear
      </Button>
      {sqlResults && (
        <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom>
            Results ({sqlResults.length} rows):
          </Typography>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(sqlResults, null, 2)}
          </pre>
        </Paper>
      )}
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      <Alert 
        severity="warning" 
        sx={{ 
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '& .MuiAlert-icon': { fontSize: 28 }
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          ⚠️ <strong>ADMIN DEBUG PANEL</strong> - Development Only - No Authentication Required
        </Typography>
      </Alert>
      
      <Card 
        sx={{ 
          mb: 3, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
                🔧 Admin Debug Panel
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Database inspection and management console
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<Refresh />} 
              onClick={loadData}
              disabled={loading}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3
              }}
            >
              Refresh Data
            </Button>
          </Box>
          
          <Tabs 
            value={currentTab} 
            onChange={(e, v) => setCurrentTab(v)} 
            variant="scrollable" 
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 64,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              },
              '& .Mui-selected': {
                color: 'primary.main',
                fontWeight: 600
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab icon={<Dashboard />} label="Dashboard" iconPosition="start" />
            <Tab icon={<People />} label="Employees" iconPosition="start" />
            <Tab icon={<Business />} label="Departments" iconPosition="start" />
            <Tab icon={<Work />} label="Positions" iconPosition="start" />
            <Tab icon={<PersonAdd />} label="Users" iconPosition="start" />
            <Tab icon={<EventNote />} label="Leaves" iconPosition="start" />
            <Tab icon={<Timer />} label="Timesheets" iconPosition="start" />
            <Tab icon={<Receipt />} label="Payslips" iconPosition="start" />
            <Tab icon={<Code />} label="SQL Console" iconPosition="start" />
          </Tabs>
        </CardContent>
      </Card>

      {currentTab > 0 && currentTab < 8 && (
        <TextField
          fullWidth
          variant="outlined"
          placeholder="🔍 Search by name, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ 
            mb: 3,
            bgcolor: 'white',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
            }
          }}
        />
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {currentTab === 0 && renderDashboard()}
              {currentTab === 1 && renderEmployees()}
              {currentTab === 2 && renderDepartments()}
              {currentTab === 3 && renderPositions()}
              {currentTab === 4 && renderUsers()}
              {currentTab === 5 && renderLeaves()}
              {currentTab === 6 && renderTimesheets()}
              {currentTab === 7 && renderPayslips()}
              {currentTab === 8 && renderSQLConsole()}
            </>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDebugPanel;
