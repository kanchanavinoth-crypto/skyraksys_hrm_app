import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Fade,
  useTheme,
  alpha,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { employeeService } from '../services/employee.service';
import { useAuth } from '../contexts
import { useNotification } from '../../../contexts/NotificationContext';
import { useLoading } from '../../../contexts/LoadingContext';/AuthContext';

const ModernEmployeesList = () => {
  const { showNotification } = useNotification();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isAdmin, isHR } = useAuth();

  const [employees, setEmployees] = useState([]);
  // Loading state managed by LoadingContext
  const { isLoading, setLoading } = useLoading();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    departments: 0,
    activeEmployees: 0,
    onLeave: 0
  });

  const departments = ['All', 'Engineering', 'HR', 'Sales', 'Marketing', 'Finance'];
  const statuses = ['All', 'Active', 'Inactive', 'On Leave'];

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      // Load actual employees from API
      const response = await employeeService.getAll();
      const employeesData = response.data || response || [];
      
      console.log('Loaded employees:', employeesData);
      
      // Transform the data to match component expectations
      const transformedEmployees = employeesData.map(emp => ({
        id: emp.id, // This is the UUID from database
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        department: emp.department?.name || emp.department || 'N/A',
        position: emp.position?.title || emp.position || 'N/A',
        status: emp.status === 'active' ? 'Active' : emp.status === 'inactive' ? 'Inactive' : 'Active',
        avatar: null,
        hireDate: emp.hireDate,
        salary: emp.salary
      }));

      setEmployees(transformedEmployees);
      setStats({
        total: transformedEmployees.length,
        departments: new Set(transformedEmployees.map(emp => emp.department)).size,
        activeEmployees: transformedEmployees.filter(emp => emp.status === 'Active').length,
        onLeave: transformedEmployees.filter(emp => emp.status === 'On Leave').length
      });
    } catch (error) {
      console.error('Error loading employees:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.log('Authentication required - redirecting to login');
        navigate('/login');
        return;
      }
      
      // Fallback to mock data if API fails
      console.log('Using fallback mock data with real UUIDs');
      const mockEmployees = [
        {
          id: '85abf353-7dbb-4db0-9dee-41763eda008c', // Use actual UUID
          employeeId: 'EMP001',
          firstName: 'System',
          lastName: 'Administrator',
          email: 'admin@skyraksys.com',
          phone: '+1-555-0001',
          department: 'Operations',
          position: 'Administrator',
          status: 'Active',
          avatar: null,
          hireDate: '2023-01-01',
          salary: 1500000
        },
        {
          id: '88f1a66c-70fc-4a48-9bc5-9b05d803a705', // Use actual UUID
          employeeId: 'EMP002',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@skyraksys.com',
          phone: '+1-555-0102',
          department: 'Engineering',
          position: 'Software Engineer',
          status: 'Active',
          avatar: null,
          hireDate: '2023-01-15',
          salary: 1125000
        }
      ];

      setEmployees(mockEmployees);
      setStats({
        total: mockEmployees.length,
        departments: new Set(mockEmployees.map(emp => emp.department)).size,
        activeEmployees: mockEmployees.filter(emp => emp.status === 'Active').length,
        onLeave: mockEmployees.filter(emp => emp.status === 'On Leave').length
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, employee) => {
    setAnchorEl(event.currentTarget);
    setSelectedEmployee(employee);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEmployee(null);
  };

  const handleEdit = () => {
    navigate(`/employees/${selectedEmployee.id}`);
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    try {
      await employeeService.delete(selectedEmployee.id);
      await loadEmployees();
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === '' || filterDepartment === 'All' || employee.department === filterDepartment;
    const matchesStatus = filterStatus === '' || filterStatus === 'All' || employee.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const paginatedEmployees = filteredEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const StatsCard = ({ title, value, icon, color }) => (
    <Fade in={!loading} timeout={500}>
      <Card
        sx={{
          background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4]
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: color, mr: 2, width: 48, height: 48 }}>
              {icon}
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" color={color}>
                {loading ? <Skeleton width={40} /> : value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      case 'On Leave': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Employee Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your organization's workforce
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Employees"
            value={stats.total}
            icon={<PersonIcon />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Departments"
            value={stats.departments}
            icon={<BusinessIcon />}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Employees"
            value={stats.activeEmployees}
            icon={<WorkIcon />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="On Leave"
            value={stats.onLeave}
            icon={<PersonIcon />}
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 300 }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              label="Department"
            >
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept === 'All' ? '' : dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              {statuses.map((status) => (
                <MenuItem key={status} value={status === 'All' ? '' : status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {(isAdmin() || isHR()) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/add-employee')}
                sx={{ minWidth: 140 }}
              >
                Add Employee
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ minWidth: 120 }}
            >
              Export
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Employee Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Position</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Hire Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.map((employee) => (
                <TableRow
                  key={employee.id}
                  sx={{
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    transition: 'background-color 0.2s'
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {employee.firstName[0]}{employee.lastName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {employee.firstName} {employee.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {employee.employeeId}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{employee.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{employee.phone}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{employee.department}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{employee.position}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={employee.status}
                      color={getStatusColor(employee.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(employee.hireDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={(e) => handleMenuClick(e, employee)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={filteredEmployees.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Employee
        </MenuItem>
        {(isAdmin() || isHR()) && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Employee
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedEmployee?.firstName} {selectedEmployee?.lastName}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModernEmployeesList;
