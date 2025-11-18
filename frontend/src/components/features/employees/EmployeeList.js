import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  Grid,
  Avatar,
  Stack,
  Divider,
  Tooltip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  MenuItem,
  useTheme,
  alpha,
  Grow,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  Work as WorkIcon,
  CalendarToday as CalendarTodayIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  ViewModule as CardViewIcon,
  ViewList as TableViewIcon,
  VpnKey as VpnKeyIcon,
  Lock as LockIcon,
  PersonAdd as PersonAddIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useLoading } from '../../../contexts/LoadingContext';
import employeeService from '../../../services/EmployeeService';
import { authService } from '../../../services/auth.service';

const EmployeeList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { setLoading } = useLoading();
  const theme = useTheme();
  
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50); // Show 50 employees per page
  
  // Sorting and filtering
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  // User account creation dialog state
  const [userAccountDialogOpen, setUserAccountDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [userAccountData, setUserAccountData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (searchTerm || statusFilter !== '' || departmentFilter !== 'all') {
      let filtered = employees || [];
      
      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(employee =>
          employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.position?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply status filter
      if (statusFilter !== '') {
        filtered = filtered.filter(employee => 
          (employee.status || 'active') === statusFilter
        );
      }
      
      // Apply department filter
      if (departmentFilter !== 'all') {
        filtered = filtered.filter(employee => 
          employee.department?.id === departmentFilter
        );
      }
      
      setFilteredEmployees(filtered);
      setPage(0); // Reset to first page when filters change
    } else {
      setFilteredEmployees(employees || []);
    }
  }, [searchTerm, employees, statusFilter, departmentFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setLocalLoading(true);
      setError(null);
      // Load employees - backend will use role-based default limit (1000 for admin/HR)
      console.log('🔄 Requesting employees from backend');
      console.log('👤 Current user role:', user?.role);
      const response = await employeeService.getAll();
      console.log('📦 Raw response from backend:', response);
      console.log('📊 Response structure:', JSON.stringify(response, null, 2));
      console.log('📊 Backend pagination info:', response.data?.pagination);
      console.log('📄 Backend data:', response.data);
      // Backend returns { success: true, data: [...] }, so we need response.data.data
      const employeeData = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
      console.log('✅ Loaded employees:', employeeData.length);
      console.log('📊 Total records from backend:', response.data?.pagination?.totalRecords);
      console.log('📊 Employee data:', employeeData);
      console.log('👤 First employee:', employeeData[0]);
      setEmployees(employeeData);
      setFilteredEmployees(employeeData);
    } catch (error) {
      console.error('Error loading employees:', error);
      setError('Failed to load employees. Please try again.');
      setEmployees([]);
      setFilteredEmployees([]);
      showError('Failed to load employees');
    } finally {
      setLoading(false);
      setLocalLoading(false);
    }
  };

  const handleAddEmployee = () => {
    navigate('/employees/add');
  };

  const handleEditEmployee = (employee) => {
    console.log('handleEditEmployee called with:', employee);
    
    // Try to get the ID from the employee object (if passed as object) or use the parameter directly
    const employeeId = typeof employee === 'object' ? employee.id : employee;
    const employeeStringId = typeof employee === 'object' ? employee.employeeId : null;
    
    console.log('Extracted employeeId (UUID):', employeeId);
    console.log('Extracted employeeStringId:', employeeStringId);
    
    if (!employeeId) {
      console.error('Cannot edit employee: ID is missing');
      console.error('Employee object received:', employee);
      setError('Cannot edit employee: ID is missing');
      return;
    }
    navigate(`/employees/${employeeId}/edit`);
  };

  const handleViewEmployee = (employeeId) => {
    navigate(`/employees/${employeeId}`);
  };

  // Handle delete click
  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation (soft delete - terminates employee)
  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    
    try {
      setLoading(true);
      await employeeService.delete(employeeToDelete.id);
      showSuccess(`Employee ${employeeToDelete.firstName} ${employeeToDelete.lastName} has been terminated`);
      loadEmployees();
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Error terminating employee:', error);
      showError('Failed to terminate employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Wrapper function for card actions
  const handleDelete = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      handleDeleteClick(employee);
    }
  };

  // Handle create user account dialog
  const handleCreateUserAccount = (employee) => {
    setSelectedEmployee(employee);
    setUserAccountData({
      email: employee.email || '',
      password: '',
      confirmPassword: '',
      role: 'employee'
    });
    setUserAccountDialogOpen(true);
  };

  const handleCloseUserAccountDialog = () => {
    setUserAccountDialogOpen(false);
    setSelectedEmployee(null);
    setUserAccountData({
      email: '',
      password: '',
      confirmPassword: '',
      role: 'employee'
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleUserAccountDataChange = (field, value) => {
    setUserAccountData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateUserSubmit = async () => {
    // Validation
    if (!userAccountData.email || !userAccountData.password || !userAccountData.confirmPassword) {
      showError('All fields are required');
      return;
    }

    if (userAccountData.password.length < 8) {
      showError('Password must be at least 8 characters long');
      return;
    }

    if (userAccountData.password !== userAccountData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    setCreatingUser(true);
    try {
      const result = await authService.createEmployeeUserAccount(selectedEmployee.id, {
        password: userAccountData.password,
        role: userAccountData.role,
        forcePasswordChange: true
      });

      if (result.success) {
        showSuccess(`User account created successfully for ${selectedEmployee.firstName} ${selectedEmployee.lastName}!`);
        handleCloseUserAccountDialog();
        loadEmployees(); // Reload to get updated user info
      } else {
        showError(result.message || 'Failed to create user account');
      }
    } catch (error) {
      console.error('Error creating user account:', error);
      showError(error.response?.data?.message || 'Failed to create user account');
    } finally {
      setCreatingUser(false);
    }
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Get unique departments for filter
  const uniqueDepartments = React.useMemo(() => {
    const depts = new Map();
    employees.forEach(emp => {
      if (emp.department?.id && emp.department?.name) {
        depts.set(emp.department.id, emp.department.name);
      }
    });
    return Array.from(depts, ([id, name]) => ({ id, name }));
  }, [employees]);
  
  // Paginated data
  const paginatedEmployees = React.useMemo(() => {
    return filteredEmployees.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredEmployees, page, rowsPerPage]);

  const getStatusChip = (status) => {
    const statusConfig = {
      'active': { 
        color: theme.palette.success.main, 
        bg: alpha(theme.palette.success.main, 0.1), 
        label: 'ACTIVE',
        border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
      },
      'inactive': { 
        color: theme.palette.text.secondary, 
        bg: alpha(theme.palette.text.secondary, 0.1), 
        label: 'INACTIVE',
        border: `1px solid ${alpha(theme.palette.text.secondary, 0.3)}`
      },
      'terminated': { 
        color: theme.palette.error.main, 
        bg: alpha(theme.palette.error.main, 0.1), 
        label: 'TERMINATED',
        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
      },
      'on_leave': { 
        color: theme.palette.warning.main, 
        bg: alpha(theme.palette.warning.main, 0.1), 
        label: 'ON LEAVE',
        border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
      }
    };
    
    const config = statusConfig[status] || statusConfig['active'];
    
    return (
      <Chip 
        label={config.label}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: '0.75rem',
          color: config.color,
          bgcolor: config.bg,
          border: config.border,
          height: 24,
          '& .MuiChip-label': {
            px: 1.5
          }
        }}
      />
    );
  };

  const canEdit = user?.role === 'admin' || user?.role === 'hr';

  // Table view rendering
  const renderTableView = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2, mt: 2, border: '1px solid', borderColor: 'divider' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Employee ID</TableCell>
            <TableCell sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Department</TableCell>
            <TableCell sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Position</TableCell>
            <TableCell sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Status</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedEmployees.map((emp) => (
            <TableRow key={emp.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={emp.photoUrl ? `http://localhost:5000${emp.photoUrl}` : undefined} sx={{ width: 32, height: 32 }}>
                    {emp.firstName?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="600">
                      {emp.firstName} {emp.lastName}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>{emp.employeeId}</TableCell>
              <TableCell>{emp.email}</TableCell>
              <TableCell>{emp.department?.name || '-'}</TableCell>
              <TableCell>{emp.position?.name || '-'}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Chip
                    label={emp.status}
                    color={
                      emp.status === 'Active' ? 'success' :
                      emp.status === 'On Leave' ? 'warning' :
                      emp.status === 'Inactive' ? 'default' : 'error'
                    }
                    size="small"
                    variant="outlined"
                  />
                  {emp.user && (
                    <Chip
                      label={emp.user.isActive ? 'Login: Enabled' : 'Login: Disabled'}
                      color={emp.user.isActive ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell align="right">
                {!emp.userId ? (
                  <Tooltip title="Create User Account">
                    <IconButton 
                      size="small" 
                      onClick={() => handleCreateUserAccount(emp)}
                      sx={{ color: 'success.main' }}
                    >
                      <VpnKeyIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Manage User Account">
                    <IconButton 
                      size="small" 
                      onClick={() => navigate(`/employees/${emp.id}/user-account`)}
                      sx={{ color: emp.user?.isActive ? 'primary.main' : 'warning.main' }}
                    >
                      <VpnKeyIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="View Profile">
                  <IconButton size="small" onClick={() => navigate(`/employees/${emp.id}`)}>
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Employee">
                  <IconButton size="small" onClick={() => navigate(`/employees/${emp.id}`)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Terminate Employee">
                  <IconButton size="small" color="error" onClick={() => handleDelete(emp.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {paginatedEmployees.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="text.secondary">
                  No employees found.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Modern Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 0.5
            }}
          >
            Employee Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Manage and organize your workforce
          </Typography>
        </Box>
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddEmployee}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Add New Employee
          </Button>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Card sx={{ mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <CardContent>
            <Typography variant="h6">⚠️ Error</Typography>
            <Typography>{error}</Typography>
            <Button 
              variant="contained" 
              onClick={loadEmployees} 
              sx={{ mt: 2 }}
              color="inherit"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modern Search and Filters */}
      <Card 
        sx={{ 
          mb: 3, 
          borderRadius: 2,
          bgcolor: 'white',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{ flex: 1 }}
            />
            
            <TextField
              select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              SelectProps={{
                displayEmpty: true
              }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="on_leave">On Leave</MenuItem>
              <MenuItem value="terminated">Terminated</MenuItem>
            </TextField>
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate('/employees/add')}
              sx={{
                borderRadius: 2,
                px: 3
              }}
            >
              Add Employee
            </Button>
          </Box>
          
          {/* Results Summary */}
          <Box sx={{ 
            mt: 2.5, 
            pt: 2.5, 
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Showing {Math.min(page * rowsPerPage + 1, filteredEmployees.length)}-{Math.min((page + 1) * rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
            </Typography>
            <Chip 
              label={`Total: ${employees.length}`} 
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600 }} 
            />
          </Box>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, v) => v && setViewMode(v)}
          size="small"
        >
          <ToggleButton value="cards">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CardViewIcon sx={{ fontSize: 18 }} />
              Cards
            </Box>
          </ToggleButton>
          <ToggleButton value="table">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TableViewIcon sx={{ fontSize: 18 }} />
              Table
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Render either cards or table */}
      {viewMode === 'cards' ? (
        <Grid container spacing={3}>
          {paginatedEmployees.map((employee, index) => (
            <Grow in timeout={300 + index * 50} key={employee.id}>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      borderColor: 'primary.main'
                    }
                  }}
                  onClick={() => navigate(`/employees/${employee.id}`)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      {/* Avatar & Name */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={employee.photoUrl ? `http://localhost:5000${employee.photoUrl}` : undefined}
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: 'primary.main'
                          }}
                        >
                          {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                        </Avatar>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="700">
                            {employee.firstName} {employee.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {employee.employeeId}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                          <Chip
                            label={employee.status}
                            size="small"
                            color={employee.status === 'Active' ? 'success' : 'default'}
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                          {employee.user && (
                            <Chip
                              label={employee.user.isActive ? 'Login: On' : 'Login: Off'}
                              size="small"
                              color={employee.user.isActive ? 'success' : 'error'}
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      <Divider />
                      
                      {/* Details */}
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WorkIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {employee.position?.title || 'No Position'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {employee.department?.name || 'No Department'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2" noWrap>
                            {employee.email}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarTodayIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            Joined {new Date(employee.hireDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                      
                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
                        {!employee.userId ? (
                          <Tooltip title="Create User Account">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateUserAccount(employee);
                              }}
                              sx={{
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) }
                              }}
                            >
                              <VpnKeyIcon fontSize="small" color="success" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Manage User Account">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/employees/${employee.id}/user-account`);
                              }}
                              sx={{
                                bgcolor: alpha(
                                  employee.user?.isActive 
                                    ? theme.palette.primary.main 
                                    : theme.palette.warning.main, 
                                  0.1
                                ),
                                '&:hover': { 
                                  bgcolor: alpha(
                                    employee.user?.isActive 
                                      ? theme.palette.primary.main 
                                      : theme.palette.warning.main, 
                                    0.2
                                  ) 
                                }
                              }}
                            >
                              <VpnKeyIcon 
                                fontSize="small" 
                                sx={{ 
                                  color: employee.user?.isActive 
                                    ? 'primary.main' 
                                    : 'warning.main' 
                                }} 
                              />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="View Profile">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/employees/${employee.id}`);
                            }}
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) }
                            }}
                          >
                            <VisibilityIcon fontSize="small" color="info" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Edit Employee">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/employees/${employee.id}`);
                            }}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                            }}
                          >
                            <EditIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Terminate Employee">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(employee.id);
                            }}
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                            }}
                          >
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grow>
          ))}
          
          {/* Empty State */}
          {filteredEmployees.length === 0 && (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 8,
                  textAlign: 'center',
                  bgcolor: 'white',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" gutterBottom color="text.secondary">
                  No employees found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first employee'}
                </Typography>
                {!searchTerm && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/employees/add')}
                  >
                    Add Employee
                  </Button>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      ) : (
        renderTableView()
      )}

      {/* Pagination Controls */}
      {filteredEmployees.length > 0 && (
        <Box 
          sx={{ 
            mt: 4, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            p: 2,
            bgcolor: 'white',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Rows per page:
            </Typography>
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              size="small"
              sx={{ minWidth: 80 }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              {Math.min(page * rowsPerPage + 1, filteredEmployees.length)}-{Math.min((page + 1) * rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length}
            </Typography>
          </Box>
          
          <Pagination 
            count={Math.ceil(filteredEmployees.length / rowsPerPage)} 
            page={page + 1}
            onChange={(e, newPage) => handleChangePage(e, newPage - 1)}
            color="primary"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 600
              }
            }}
          />
        </Box>
      )}
      
      {/* Floating Action Button for Mobile */}
      {canEdit && (
        <Fab
          color="primary"
          aria-label="add employee"
          onClick={handleAddEmployee}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' }
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Terminate Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.error.main, 0.1),
                width: 48,
                height: 48
              }}
            >
              <WarningIcon sx={{ color: 'error.main', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Terminate Employee?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This will deactivate the employee account
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to terminate{' '}
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {employeeToDelete?.firstName} {employeeToDelete?.lastName}
            </Box>
            {employeeToDelete?.employeeId && (
              <>
                {' '}(ID: <Box component="span" sx={{ fontWeight: 500 }}>{employeeToDelete.employeeId}</Box>)
              </>
            )}
            ?
          </Typography>
          <Box 
            sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: alpha(theme.palette.info.main, 0.1), 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
            }}
          >
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> This is a soft delete. The employee status will be set to "Terminated" and their user account will be deactivated. The employee record will remain in the system for historical purposes.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="outlined"
            color="error"
            disabled={localLoading}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            {localLoading ? 'Terminating...' : 'Terminate Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Account Dialog */}
      <Dialog
        open={userAccountDialogOpen}
        onClose={handleCloseUserAccountDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon sx={{ color: 'success.main' }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Create User Account
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Enable login access for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ mt: 3 }}>
          <Stack spacing={3}>
            {/* Email Field */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={userAccountData.email}
              onChange={(e) => handleUserAccountDataChange('email', e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              helperText="This email will be used for login"
            />

            {/* Role Selection */}
            <FormControl fullWidth required>
              <InputLabel>User Role</InputLabel>
              <Select
                value={userAccountData.role}
                onChange={(e) => handleUserAccountDataChange('role', e.target.value)}
                label="User Role"
                startAdornment={
                  <InputAdornment position="start">
                    <BusinessIcon color="action" />
                  </InputAdornment>
                }
              >
                <MenuItem value="employee">
                  <Box>
                    <Typography variant="body2" fontWeight="medium">Employee</Typography>
                    <Typography variant="caption" color="text.secondary">Basic user access</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="manager">
                  <Box>
                    <Typography variant="body2" fontWeight="medium">Manager</Typography>
                    <Typography variant="caption" color="text.secondary">Team management permissions</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="hr">
                  <Box>
                    <Typography variant="body2" fontWeight="medium">HR Manager</Typography>
                    <Typography variant="caption" color="text.secondary">HR management access</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="admin">
                  <Box>
                    <Typography variant="body2" fontWeight="medium">Administrator</Typography>
                    <Typography variant="caption" color="text.secondary">Full system access</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Divider>
              <Typography variant="caption" color="text.secondary">
                Password Setup
              </Typography>
            </Divider>

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={userAccountData.password}
              onChange={(e) => handleUserAccountDataChange('password', e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Minimum 8 characters"
            />

            {/* Confirm Password Field */}
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={userAccountData.confirmPassword}
              onChange={(e) => handleUserAccountDataChange('confirmPassword', e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box 
              sx={{ 
                p: 2, 
                bgcolor: alpha(theme.palette.info.main, 0.1), 
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <Typography variant="caption" color="text.secondary">
                💡 <strong>Note:</strong> The user will be able to login immediately with these credentials. 
                Make sure to securely share the password with the employee.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCloseUserAccountDialog}
            variant="outlined"
            disabled={creatingUser}
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateUserSubmit}
            variant="outlined"
            color="success"
            disabled={creatingUser}
            startIcon={creatingUser ? null : <PersonAddIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {creatingUser ? 'Creating Account...' : 'Create User Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;
