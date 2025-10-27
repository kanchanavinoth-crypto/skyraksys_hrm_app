import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Pagination,
  Stack,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Fade,
  Zoom
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  EventNote as EventNoteIcon,
  GroupAdd as GroupAddIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { leaveBalanceAdminService } from '../../../services/leave-balance-admin.service';

const LeaveBalanceModern = () => {
  // State management
  const [balances, setBalances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Bulk initialization
  const [showBulkInit, setShowBulkInit] = useState(false);
  const [bulkInitData, setBulkInitData] = useState({});

  // Individual creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState({
    employeeId: '',
    leaveTypeId: '',
    year: new Date().getFullYear(),
    totalAccrued: 0,
    carryForward: 0
  });

  // Edit mode
  const [editingBalance, setEditingBalance] = useState(null);
  const [editData, setEditData] = useState({});

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
    loadData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadData(1);
  }, [selectedEmployee, selectedLeaveType, selectedYear]);

  const loadInitialData = async () => {
    try {
      const [employeesRes, leaveTypesRes] = await Promise.all([
        leaveBalanceAdminService.getEmployees(),
        leaveBalanceAdminService.getLeaveTypes()
      ]);

      setEmployees(employeesRes.data || []);
      setLeaveTypes(leaveTypesRes.data || []);
    } catch (err) {
      setError('Failed to load initial data: ' + err.message);
    }
  };

  const loadData = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        limit: 10,
        year: selectedYear
      };

      if (selectedEmployee) params.employeeId = selectedEmployee;
      if (selectedLeaveType) params.leaveTypeId = selectedLeaveType;

      const response = await leaveBalanceAdminService.getAll(params);

      setBalances(response.data.balances || []);
      setCurrentPage(response.data.pagination.currentPage);
      setTotalPages(response.data.pagination.pages);
      setTotalRecords(response.data.pagination.total);
    } catch (err) {
      setError('Failed to load leave balances: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkInit = async () => {
    if (Object.keys(bulkInitData).length === 0) {
      setError('Please set allocations for at least one leave type');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await leaveBalanceAdminService.bulkInitialize({
        year: selectedYear,
        leaveAllocations: bulkInitData
      });

      setSuccess('Leave balances initialized successfully!');
      setShowBulkInit(false);
      setBulkInitData({});
      await loadData();
    } catch (err) {
      setError('Failed to initialize leave balances: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await leaveBalanceAdminService.create(createData);

      setSuccess('Leave balance created successfully!');
      setShowCreateForm(false);
      setCreateData({
        employeeId: '',
        leaveTypeId: '',
        year: new Date().getFullYear(),
        totalAccrued: 0,
        carryForward: 0
      });
      await loadData();
    } catch (err) {
      setError('Failed to create leave balance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (balanceId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await leaveBalanceAdminService.update(balanceId, editData);

      setSuccess('Leave balance updated successfully!');
      setEditingBalance(null);
      setEditData({});
      await loadData();
    } catch (err) {
      setError('Failed to update leave balance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (balanceId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this leave balance?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await leaveBalanceAdminService.delete(balanceId);

      setSuccess('Leave balance deleted successfully!');
      await loadData();
    } catch (err) {
      setError('Failed to delete leave balance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (balance) => {
    setEditingBalance(balance.id);
    setEditData({
      totalAccrued: balance.totalAccrued,
      totalTaken: balance.totalTaken,
      totalPending: balance.totalPending,
      carryForward: balance.carryForward
    });
  };

  const cancelEdit = () => {
    setEditingBalance(null);
    setEditData({});
  };

  const handleResetFilters = () => {
    setSelectedEmployee('');
    setSelectedLeaveType('');
    setSelectedYear(new Date().getFullYear());
  };

  const getBalanceColor = (balance) => {
    if (balance > 10) return 'success';
    if (balance > 5) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Fade in timeout={500}>
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                <EventNoteIcon sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    Leave Balance Administration
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    Manage employee leave allocations and balances
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Tooltip title="Bulk Initialize Leave Balances">
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<GroupAddIcon />}
                    onClick={() => setShowBulkInit(true)}
                    disabled={loading}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    Bulk Initialize
                  </Button>
                </Tooltip>
                <Tooltip title="Add Individual Leave Balance">
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowCreateForm(true)}
                    disabled={loading}
                    sx={{ 
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                    }}
                  >
                    Add Balance
                  </Button>
                </Tooltip>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>

      {/* Alerts */}
      {error && (
        <Zoom in>
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Zoom>
      )}

      {success && (
        <Zoom in>
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
            {success}
          </Alert>
        </Zoom>
      )}

      {/* Filters Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterListIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Filters
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number.parseInt(e.target.value, 10))}
                InputProps={{
                  inputProps: { min: 2020, max: 2030 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Employee"
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <MenuItem value="">All Employees</MenuItem>
                  {employees.map(emp => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={selectedLeaveType}
                  label="Leave Type"
                  onChange={(e) => setSelectedLeaveType(e.target.value)}
                >
                  <MenuItem value="">All Leave Types</MenuItem>
                  {leaveTypes.map(type => (
                    <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleResetFilters}
                sx={{ height: '56px' }}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {balances.length} of {totalRecords} leave balances for year {selectedYear}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Leave Balances Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Employee</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Leave Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total Allocated</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Taken</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pending</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Available</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }}>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && balances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <EventNoteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        No leave balances found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && balances.length > 0 && (
                  balances.map((balance, index) => (
                    <Fade in key={balance.id} timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
                      <TableRow hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {balance.employee.firstName} {balance.employee.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {balance.employee.employeeId}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={balance.leaveType.name}
                            color="info"
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          {editingBalance === balance.id ? (
                            <Box>
                              <TextField
                                size="small"
                                type="number"
                                label="Allocated"
                                inputProps={{ step: 0.5 }}
                                value={editData.totalAccrued}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  totalAccrued: Number.parseFloat(e.target.value)
                                })}
                                sx={{ width: '100px', mb: 1 }}
                              />
                              <TextField
                                size="small"
                                type="number"
                                label="Carry Fwd"
                                inputProps={{ step: 0.5 }}
                                value={editData.carryForward}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  carryForward: Number.parseFloat(e.target.value)
                                })}
                                sx={{ width: '100px' }}
                              />
                            </Box>
                          ) : (
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {(Number(balance.totalAccrued || 0) + Number(balance.carryForward || 0)).toFixed(1)} days
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ({balance.totalAccrued || 0} + {balance.carryForward || 0} CF)
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingBalance === balance.id ? (
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ step: 0.5 }}
                              value={editData.totalTaken}
                              onChange={(e) => setEditData({
                                ...editData,
                                totalTaken: Number.parseFloat(e.target.value)
                              })}
                              sx={{ width: '100px' }}
                            />
                          ) : (
                            <Typography variant="body2" color="warning.main" fontWeight="bold">
                              {balance.totalTaken} days
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingBalance === balance.id ? (
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ step: 0.5 }}
                              value={editData.totalPending}
                              onChange={(e) => setEditData({
                                ...editData,
                                totalPending: Number.parseFloat(e.target.value)
                              })}
                              sx={{ width: '100px' }}
                            />
                          ) : (
                            <Typography variant="body2" color="info.main" fontWeight="bold">
                              {balance.totalPending} days
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${balance.balance} days`}
                            color={getBalanceColor(balance.balance)}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {editingBalance === balance.id ? (
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="Save">
                                <IconButton
                                  color="success"
                                  size="small"
                                  onClick={() => handleEdit(balance.id)}
                                  disabled={loading}
                                >
                                  <SaveIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancel">
                                <IconButton
                                  color="default"
                                  size="small"
                                  onClick={cancelEdit}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          ) : (
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="Edit">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => startEdit(balance)}
                                  disabled={loading}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleDelete(balance.id)}
                                  disabled={loading}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    </Fade>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => loadData(page)}
                color="primary"
                size="large"
                disabled={loading}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Bulk Initialize Dialog */}
      <Dialog
        open={showBulkInit}
        onClose={() => {
          setShowBulkInit(false);
          setBulkInitData({});
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupAddIcon sx={{ mr: 1 }} />
            Bulk Initialize Leave Balances
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Set total leave allocation for all active employees for year {selectedYear}.</strong>
            <br />
            Enter the total days to allocate (this will be set as "Accrued" with 0 carry forward).
            <br />
            This will only create balances for employees who don't already have them for this year.
          </Alert>

          <Grid container spacing={2}>
            {leaveTypes.map(type => (
              <Grid item xs={12} sm={6} key={type.id}>
                <TextField
                  fullWidth
                  label={`${type.name} - Total Days to Allocate`}
                  type="number"
                  inputProps={{ step: 0.5, min: 0 }}
                  value={bulkInitData[type.id] || ''}
                  onChange={(e) => setBulkInitData({
                    ...bulkInitData,
                    [type.id]: e.target.value
                  })}
                  helperText={`e.g., ${type.maxDaysPerYear || 20} days`}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setShowBulkInit(false);
              setBulkInitData({});
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleBulkInit}
            disabled={loading || Object.keys(bulkInitData).length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <GroupAddIcon />}
          >
            {loading ? 'Initializing...' : 'Initialize Balances'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Balance Dialog */}
      <Dialog
        open={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setCreateData({
            employeeId: '',
            leaveTypeId: '',
            year: new Date().getFullYear(),
            totalAccrued: 0,
            carryForward: 0
          });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AddIcon sx={{ mr: 1 }} />
            Create Leave Balance
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Employee</InputLabel>
              <Select
                value={createData.employeeId}
                label="Employee"
                onChange={(e) => setCreateData({ ...createData, employeeId: e.target.value })}
              >
                <MenuItem value="">Select Employee</MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={createData.leaveTypeId}
                label="Leave Type"
                onChange={(e) => setCreateData({ ...createData, leaveTypeId: e.target.value })}
              >
                <MenuItem value="">Select Leave Type</MenuItem>
                {leaveTypes.map(type => (
                  <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Year"
                  type="number"
                  value={createData.year}
                  onChange={(e) => {
                    const val = e.target.value === '' ? new Date().getFullYear() : Number.parseInt(e.target.value, 10);
                    setCreateData({ ...createData, year: val });
                  }}
                  InputProps={{
                    inputProps: { min: 2020, max: 2030 }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Accrued Days (Current Year)"
                  type="number"
                  inputProps={{ step: 0.5, min: 0 }}
                  value={createData.totalAccrued}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number.parseFloat(e.target.value);
                    setCreateData({ ...createData, totalAccrued: val });
                  }}
                  helperText="Days allocated for this year"
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Carry Forward Days (From Previous Year)"
              type="number"
              inputProps={{ step: 0.5, min: 0 }}
              value={createData.carryForward}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number.parseFloat(e.target.value);
                setCreateData({ ...createData, carryForward: val });
              }}
              helperText="Unused days from previous year"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setShowCreateForm(false);
              setCreateData({
                employeeId: '',
                leaveTypeId: '',
                year: new Date().getFullYear(),
                totalAccrued: 0,
                carryForward: 0
              });
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreate}
            disabled={loading || !createData.employeeId || !createData.leaveTypeId}
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {loading ? 'Creating...' : 'Create Balance'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveBalanceModern;
