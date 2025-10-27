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
  Paper
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
  ViewList as TableViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useLoading } from '../../../contexts/LoadingContext';
import employeeService from '../../../services/EmployeeService';

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
  const [rowsPerPage, setRowsPerPage] = useState(25); // Changed from 10 to 25 to show more employees by default
  
  // Sorting and filtering
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (searchTerm || statusFilter !== 'all' || departmentFilter !== 'all') {
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
      if (statusFilter !== 'all') {
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
      const response = await employeeService.getAll();
      console.log('📦 Raw response from backend:', response);
      console.log('📊 Response structure:', JSON.stringify(response, null, 2));
      console.log('� Backend pagination info:', response.pagination);
      console.log('📄 Backend data:', response.data);
      // Backend returns { success: true, data: [...] }, so we need response.data.data
      const employeeData = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
      console.log('✅ Loaded employees:', employeeData.length);
      console.log('📊 Total records from backend:', response.pagination?.totalRecords);
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

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    
    try {
      setLoading(true);
      await employeeService.delete(employeeToDelete.id);
      showSuccess(`Employee ${employeeToDelete.firstName} ${employeeToDelete.lastName} deleted successfully`);
      loadEmployees();
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Error deleting employee:', error);
      showError('Failed to delete employee. Please try again.');
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
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.1)', 
        label: 'ACTIVE',
        border: '1px solid rgba(16, 185, 129, 0.3)'
      },
      'inactive': { 
        color: '#64748b', 
        bg: 'rgba(100, 116, 139, 0.1)', 
        label: 'INACTIVE',
        border: '1px solid rgba(100, 116, 139, 0.3)'
      },
      'terminated': { 
        color: '#ef4444', 
        bg: 'rgba(239, 68, 68, 0.1)', 
        label: 'TERMINATED',
        border: '1px solid rgba(239, 68, 68, 0.3)'
      },
      'on_leave': { 
        color: '#f59e0b', 
        bg: 'rgba(245, 158, 11, 0.1)', 
        label: 'ON LEAVE',
        border: '1px solid rgba(245, 158, 11, 0.3)'
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
    <TableContainer component={Paper} sx={{ borderRadius: 2, mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Name</strong></TableCell>
            <TableCell><strong>Employee ID</strong></TableCell>
            <TableCell><strong>Email</strong></TableCell>
            <TableCell><strong>Department</strong></TableCell>
            <TableCell><strong>Position</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell align="right"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((emp) => (
            <TableRow key={emp.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={emp.photoUrl} sx={{ width: 32, height: 32 }}>
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
                <Chip
                  label={emp.status}
                  color={
                    emp.status === 'Active' ? 'success' :
                    emp.status === 'On Leave' ? 'warning' :
                    emp.status === 'Inactive' ? 'default' : 'error'
                  }
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="View Profile">
                  <IconButton size="small" onClick={() => navigate(`/employees/${emp.id}`)}>
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => navigate(`/employees/${emp.id}/edit`)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => handleDelete(emp.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {employees.length === 0 && (
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
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
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
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddEmployee}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(99, 102, 241, 0.35)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease'
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
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
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
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  background: alpha(theme.palette.primary.main, 0.02)
                }
              }}
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
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/employees/add-modern')}
              sx={{
                borderRadius: 2,
                px: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.5)}`
                }
              }}
            >
              Add Employee
            </Button>
          </Box>
          
          {/* Results Summary */}
          <Box sx={{ 
            mt: 2.5, 
            pt: 2.5, 
            borderTop: '1px solid #e2e8f0',
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
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                color: '#6366f1',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }} 
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
          {filteredEmployees.map((employee, index) => (
            <Grow in timeout={300 + index * 50} key={employee.id}>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    }
                  }}
                  onClick={() => navigate(`/employees/${employee.id}`)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      {/* Avatar & Name */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={employee.photoUrl}
                          sx={{
                            width: 56,
                            height: 56,
                            border: `3px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
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
                        
                        <Chip
                          label={employee.status}
                          size="small"
                          color={employee.status === 'Active' ? 'success' : 'default'}
                          sx={{ fontWeight: 600 }}
                        />
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
                              navigate(`/employees/${employee.id}/edit`);
                            }}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                            }}
                          >
                            <EditIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete Employee">
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
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderRadius: 3
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
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/employees/add-modern')}
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

      {/* Delete Confirmation Dialog */}
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
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                width: 48,
                height: 48
              }}
            >
              <WarningIcon sx={{ color: '#ef4444', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Delete Employee?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This action cannot be undone
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to delete{' '}
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {employeeToDelete?.firstName} {employeeToDelete?.lastName}
            </Box>
            {employeeToDelete?.employeeId && (
              <>
                {' '}(ID: <Box component="span" sx={{ fontWeight: 500 }}>{employeeToDelete.employeeId}</Box>)
              </>
            )}
            ? All associated data will be permanently removed.
          </Typography>
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
            variant="contained"
            color="error"
            disabled={localLoading}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            {localLoading ? 'Deleting...' : 'Delete Employee'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;
