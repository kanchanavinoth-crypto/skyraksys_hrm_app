import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Badge,
  Avatar,
  Stack,
  Divider,
  useTheme,
  alpha,
  Fade,
  Tooltip,
  useMediaQuery // ✅ ADD THIS IMPORT
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useLoading } from '../../../contexts/LoadingContext';
import ResponsiveTable, { LeaveRequestMobileCard } from '../../common/ResponsiveTable';
import { leaveService } from '../../../services/leave.service';

const ModernLeaveManagement = () => {
  const { showSuccess, showError } = useNotification(); // ✅ Already destructured
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, isAdmin, isHR, isEmployee } = useAuth();
  
  // Hooks must be called first, before any conditional logic
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['All', 'Pending', 'Approved', 'Rejected'];
  // Loading state managed by LoadingContext
  const { isLoading: isLoadingFn, setLoading } = useLoading();
  const isLoading = isLoadingFn('leave-management');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [requestsResponse, balancesResponse] = await Promise.all([
        leaveService.getAll(),
        leaveService.getBalance()
      ]);

      setLeaveRequests(requestsResponse.data || []);
      setLeaveBalances(balancesResponse || []);
      
    } catch (error) {
      console.error('Error loading leave data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  // Redirect employees to their personal leave page
  if (isEmployee()) {
    navigate('/leave-requests');
    return null;
  }

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave', color: 'primary' },
    { value: 'sick', label: 'Sick Leave', color: 'error' },
    { value: 'personal', label: 'Personal Leave', color: 'warning' },
    { value: 'maternity', label: 'Maternity Leave', color: 'secondary' },
    { value: 'emergency', label: 'Emergency Leave', color: 'info' }
  ];

  const statusColors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    cancelled: 'default'
  };

  const handleApprovalAction = async () => {
    try {
      await leaveService.updateStatus(selectedRequest.id, approvalAction, approvalComments);
      
      await loadData(); // Refresh data
      
      setApprovalDialog(false);
      setApprovalComments('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating leave request:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <ApproveIcon color="success" />;
      case 'rejected': return <RejectIcon color="error" />;
      case 'pending': return <PendingIcon color="warning" />;
      default: return <PendingIcon />;
    }
  };

  const getLeaveTypeInfo = (type) => {
    // Handle if type is an object (from API with associations)
    const typeName = typeof type === 'object' && type?.name 
      ? type.name.toLowerCase() 
      : typeof type === 'string' 
        ? type.toLowerCase() 
        : '';
    
    // Try to match with predefined types
    const matchedType = leaveTypes.find(lt => 
      lt.value === typeName || 
      lt.label.toLowerCase() === typeName
    );
    
    if (matchedType) {
      return matchedType;
    }
    
    // Fallback: return a safe object with the type name
    const displayName = typeof type === 'object' && type?.name 
      ? type.name 
      : typeof type === 'string' 
        ? type 
        : 'Unknown';
    
    return { label: displayName, color: 'default' };
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = 
      (request.employeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (request.employeeId?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.leaveType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const paginatedRequests = filteredRequests.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // ✅ ADD THIS FUNCTION - Calculate count by status
  const getCountByStatus = (status) => {
    if (status === 'All') {
      return leaveRequests.length;
    }
    return leaveRequests.filter(req => req.status === status).length;
  };

  // ✅ ADD THIS FUNCTION - Handle status update
  const handleStatusUpdate = async (leaveId, newStatus) => {
    try {
      setLoading(true);
      await leaveService.updateStatus(leaveId, {
        status: newStatus,
        approverComments: ''
      });
      
      showSuccess(`Leave request ${newStatus.toLowerCase()} successfully`); // ✅ FIXED
      await loadData();
    } catch (error) {
      console.error(`Error updating leave status:`, error);
      showError(error.response?.data?.message || `Failed to ${newStatus.toLowerCase()} leave request`); // ✅ FIXED
    } finally {
      setLoading(false);
    }
  };

  const LeaveRequestsTab = () => (
    <Box>
      {/* Header with Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Leave Requests Management
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => console.log('Export leave requests')}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-leave-request')}
          >
            New Request
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search employee"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Leave Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {leaveTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredRequests.length} requests
                </Typography>
                <Badge badgeContent={leaveRequests.filter(r => r.status === 'pending').length} color="warning">
                  <FilterIcon color="action" />
                </Badge>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs and Quick Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 100
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tab}
                  <Chip
                    label={getCountByStatus(tab)}
                    size="small"
                    variant="outlined"
                    color={tab === 'Pending' ? 'warning' : 'default'}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
        
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setFilterOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Filters
        </Button>
      </Box>

      {/* Requests Table */}
      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Leave Type</TableCell>
                <TableCell sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Days</TableCell>
                <TableCell sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Reason</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaveRequests
                .filter(leave => activeTab === 0 || leave.status === tabs[activeTab])
                .map((leave, index) => {
                  const leaveTypeInfo = getLeaveTypeInfo(leave.leaveType);
                  const employeeName = leave.employeeName || 
                                      (leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : '') ||
                                      'Unknown Employee';
                  const employeeId = leave.employeeId || leave.employee?.employeeId || 'N/A';
                  
                  return (
                    <Fade in timeout={200 + index * 50} key={leave.id}>
                      <TableRow
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.02)
                          }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={leave.employee?.photoUrl}
                              sx={{ width: 36, height: 36 }}
                            >
                              {leave.employee?.firstName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="600">
                                {employeeName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {employeeId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={leaveTypeInfo.label}
                            color={leaveTypeInfo.color}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' - '}
                            {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={`${leave.totalDays} ${leave.totalDays === 1 ? 'day' : 'days'}`}
                            size="small"
                            variant="outlined"
                            color="info"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={leave.status}
                            size="small"
                            variant="outlined"
                            color={
                              leave.status === 'Approved' ? 'success' :
                              leave.status === 'Pending' ? 'warning' :
                              'error'
                            }
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title={leave.reason}>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {leave.reason}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        
                        <TableCell align="right">
                          {leave.status === 'Pending' && (
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  onClick={() => handleStatusUpdate(leave.id, 'Approved')}
                                  sx={{
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) }
                                  }}
                                >
                                  <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  onClick={() => handleStatusUpdate(leave.id, 'Rejected')}
                                  sx={{
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                  }}
                                >
                                  <CancelIcon fontSize="small" sx={{ color: 'error.main' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                          
                          {leave.status !== 'Pending' && (
                            <Typography variant="caption" color="text.secondary">
                              {leave.status === 'Approved' ? 'Approved' : 'Rejected'}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    </Fade>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredRequests.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
        />
      </Card>
    </Box>
  );

  const LeaveBalancesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Leave Balances Overview
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => console.log('Export leave balances')}
        >
          Export Report
        </Button>
      </Box>

      {!leaveBalances || leaveBalances.length === 0 ? (
        <Alert severity="info">
          No leave balance data available. Navigate to Admin → Leave Balances to manage employee leave allocations.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {leaveBalances.map((balance, index) => {
            // API returns individual balance records, not grouped by employee
            const employeeName = balance.employee 
              ? `${balance.employee.firstName} ${balance.employee.lastName}` 
              : 'Unknown Employee';
            const employeeId = balance.employee?.employeeId || 'N/A';
            const department = balance.employee?.department || 'N/A';
            const leaveTypeName = balance.leaveType?.name || 'Unknown Type';
            
            return (
              <Grid item xs={12} md={6} lg={4} key={balance.id || index}>
                <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                        {employeeName.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">{employeeName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {employeeId} • {department}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={2}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {leaveTypeName}
                          </Typography>
                          <Chip 
                            label={`${balance.balance || 0} days left`}
                            color={
                              (balance.balance || 0) >= 10 ? 'success' :
                              (balance.balance || 0) >= 5 ? 'warning' : 'error'
                            }
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        
                        {/* Progress bar */}
                        <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, height: 8, mb: 2 }}>
                          <Box
                            sx={{
                              bgcolor: (balance.balance || 0) >= 10 ? 'success.main' :
                                      (balance.balance || 0) >= 5 ? 'warning.main' : 'error.main',
                              height: '100%',
                              borderRadius: 1,
                              width: `${Math.min(((balance.balance || 0) / (Number(balance.totalAccrued || 0) + Number(balance.carryForward || 0))) * 100, 100)}%`,
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </Box>

                        {/* Detailed breakdown */}
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Total Allocated
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {(Number(balance.totalAccrued || 0) + Number(balance.carryForward || 0)).toFixed(1)} days
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Taken
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {balance.totalTaken || 0} days
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Pending
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {balance.totalPending || 0} days
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Available
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {balance.balance || 0} days
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              bgcolor: 'white',
              color: 'text.primary',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Leave Management
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Manage employee leave requests and balances
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Tabs */}
          <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
            >
              <Tab
                label={
                  <Badge badgeContent={leaveRequests.filter(r => r.status === 'pending').length} color="warning">
                    Leave Requests
                  </Badge>
                }
              />
              <Tab label="Leave Balances" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && <LeaveRequestsTab />}
              {activeTab === 1 && <LeaveBalancesTab />}
            </Box>
          </Paper>

          {/* Approval Dialog */}
          <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              {approvalAction === 'approved' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
            <DialogContent>
              {selectedRequest && (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Employee:</strong> {selectedRequest.employeeName}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Leave Type:</strong> {getLeaveTypeInfo(selectedRequest.leaveType).label}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Duration:</strong> {selectedRequest.startDate} to {selectedRequest.endDate} ({selectedRequest.days} days)
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    <strong>Reason:</strong> {selectedRequest.reason}
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Comments"
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder={`Add comments for ${approvalAction === 'approved' ? 'approval' : 'rejection'}...`}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setApprovalDialog(false)} variant="outlined">Cancel</Button>
              <Button
                variant="outlined"
                color={approvalAction === 'approved' ? 'success' : 'error'}
                onClick={() => handleApprovalAction(approvalAction)}
              >
                {approvalAction === 'approved' ? 'Approve' : 'Reject'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default ModernLeaveManagement;
