import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Alert,
  Container,
  Fab,
  useTheme,
  useMediaQuery,
  Stack,
  Chip,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import ResponsiveTable, { EmployeeMobileCard } from '../common/ResponsiveTable';
import { employeeService } from '../../services/employee.service';

const EmployeeList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { canManageEmployees } = useAuth();
  
  const [employees, setEmployees] = useState([]);
  // Loading state managed by LoadingContext
  const { isLoading: isLoadingFn, setLoading } = useLoading();
  const isLoading = isLoadingFn('employee-list');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Table columns configuration
  const columns = [
    {
      id: 'employee',
      label: 'Employee',
      minWidth: 200,
      primary: true,
      render: (value, employee) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar>
            {employee.user?.firstName?.charAt(0) || <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {employee.user?.firstName} {employee.user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {employee.employeeId}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'department',
      label: 'Department',
      minWidth: 150,
      render: (value) => value || 'Not assigned'
    },
    {
      id: 'position',
      label: 'Position',
      minWidth: 150,
      render: (value) => value || 'Not assigned'
    },
    {
      id: 'hireDate',
      label: 'Hire Date',
      minWidth: 120,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      align: 'center',
      render: (value) => (
        <Chip
          label={value}
          color={value === 'active' ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      align: 'center',
      render: (value, employee) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <IconButton
            size="small"
            onClick={() => navigate(`/employees/${employee.id}`)}
            sx={{ minWidth: 32, minHeight: 32 }}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
          {canManageEmployees && (
            <IconButton
              size="small"
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
              sx={{ minWidth: 32, minHeight: 32 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )
    }
  ];

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading('employee-list', true);
      const response = await employeeService.getAll();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setError('Failed to load employees. Please try again.');
    } finally {
      setLoading('employee-list', false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredEmployees = employees.filter(employee => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.user?.firstName?.toLowerCase().includes(searchLower) ||
      employee.user?.lastName?.toLowerCase().includes(searchLower) ||
      employee.user?.email?.toLowerCase().includes(searchLower) ||
      employee.department?.toLowerCase().includes(searchLower) ||
      employee.position?.toLowerCase().includes(searchLower) ||
      employee.employeeId?.toLowerCase().includes(searchLower)
    );
  });

  // Custom mobile card render function
  const renderEmployeeMobileCard = (employee, index) => (
    <EmployeeMobileCard 
      key={employee.id} 
      employee={employee}
      onView={() => navigate(`/employees/${employee.id}`)}
      onEdit={canManageEmployees ? () => navigate(`/employees/${employee.id}/edit`) : undefined}
    />
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 3,
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="bold"
          sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
        >
          Employee Directory
        </Typography>
        
        {canManageEmployees && !isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-employee')}
            size="large"
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              minHeight: 48
            }}
          >
            Add Employee
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }} 
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Search */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search employees by name, email, department, or position..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
        
        {searchTerm && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mt: 1 }}
          >
            Found {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </Paper>

      {/* Employee Table/Cards */}
      <ResponsiveTable
        columns={columns}
        data={filteredEmployees}
        loading={isLoading}
        renderMobileCard={renderEmployeeMobileCard}
        mobileBreakpoint="md"
        sx={{
          '& .MuiTableCell-head': {
            backgroundColor: theme.palette.grey[50],
            fontWeight: 'bold'
          }
        }}
      />

      {/* Mobile FAB for Add Employee */}
      {canManageEmployees && isMobile && (
        <Fab
          color="primary"
          aria-label="add employee"
          onClick={() => navigate('/add-employee')}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: theme.zIndex.speedDial
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Empty State */}
      {!isLoading && filteredEmployees.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {searchTerm ? 'No employees found' : 'No employees yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first employee'
            }
          </Typography>
          {canManageEmployees && !searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/add-employee')}
              size="large"
              sx={{ minHeight: 48 }}
            >
              Add First Employee
            </Button>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default EmployeeList;

const EmployeeList = () => {
  const navigate = useNavigate();
  const { canManageEmployees } = useAuth();
  
  const [employees, setEmployees] = useState([]);
  // Loading state managed by LoadingContext
  const { isLoading: isLoadingFn, setLoading } = useLoading();
  const isLoading = isLoadingFn('employee-list');
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, [page, rowsPerPage, searchTerm]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm
      };
      
      const response = await employeeService.getAll(params);
      setEmployees(response.data || []);
      setTotalCount(response.pagination?.totalRecords || 0);
    } catch (error) {
      console.error('Error loading employees:', error);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleMenuOpen = (event, employee) => {
    setAnchorEl(event.currentTarget);
    setSelectedEmployee(employee);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEmployee(null);
  };

  const handleView = () => {
    navigate(`/employees/${selectedEmployee.id}`);
    handleMenuClose();
  };

  const handleEdit = () => {
    navigate(`/employees/${selectedEmployee.id}/edit`);
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'on leave':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && employees.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Employee Management
        </Typography>
        {canManageEmployees() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/employees/new')}
          >
            Add Employee
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search employees by name, email, or department..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Employee Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Hire Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>
                        {employee.user?.firstName?.charAt(0) || <PersonIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {employee.user?.firstName} {employee.user?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {employee.user?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {employee.department?.name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {employee.position?.title || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(employee.hireDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={employee.status || 'Active'}
                      color={getStatusColor(employee.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, employee)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No employees found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {canManageEmployees() && (
          <MenuItem onClick={handleEdit}>
            <EditIcon sx={{ mr: 1 }} />
            Edit Employee
          </MenuItem>
        )}
      </Menu>

      {/* Floating Action Button */}
      {canManageEmployees() && (
        <Fab
          color="primary"
          aria-label="add employee"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => navigate('/employees/new')}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default EmployeeList;
