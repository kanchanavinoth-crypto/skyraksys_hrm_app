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
  Chip,
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
  Avatar,
  Stack,
  Fade,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Pending as PendingIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useLoading } from '../../../contexts/LoadingContext';
import { timesheetService } from '../../../services/timesheet.service';
import ResponsiveTable from '../../common/ResponsiveTable';

const ModernTimesheetManagement = () => {
  const navigate = useNavigate();
  const { isAdmin, isHR, isEmployee, isManager } = useAuth();
  
  // Hooks must be called first, before any conditional logic
  const [activeTab, setActiveTab] = useState(0);
  // Loading state managed by LoadingContext
  const { isLoading: isLoadingFn, setLoading } = useLoading();
  const isLoading = isLoadingFn('timesheet-management');
  const [timesheets, setTimesheets] = useState([]);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [selectedWeekTimesheets, setSelectedWeekTimesheets] = useState([]);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('current');
  const [alert, setAlert] = useState(null);
  
  const loadTimesheets = async () => {
    try {
      setLoading(true);
      
      const response = await timesheetService.getAll();
      setTimesheets(response.data || []);

    } catch (error) {
      console.error('Error loading timesheets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get status color and icon
  const getStatusConfig = (status) => {
    const configs = {
      'draft': { color: 'default', label: 'Draft' },
      'submitted': { color: 'warning', label: 'Submitted' },
      'approved': { color: 'success', label: 'Approved' },
      'rejected': { color: 'error', label: 'Rejected' }
    };
    return configs[status?.toLowerCase()] || configs.draft;
  };

  // Load all timesheets for the same week when viewing
  const loadWeekTimesheets = async (timesheet) => {
    try {
      // Get all timesheets for the same employee and week
      const response = await timesheetService.getAll({
        employeeId: timesheet.employeeId,
        year: timesheet.year,
        weekNumber: timesheet.weekNumber
      });
      
      const weekTimesheets = response.data || [];
      setSelectedWeekTimesheets(weekTimesheets);
      return weekTimesheets;
    } catch (error) {
      console.error('Error loading week timesheets:', error);
      return [timesheet]; // Fallback to single timesheet
    }
  };
  
  useEffect(() => {
    loadTimesheets();
  }, []);
  
  // Redirect employees to their personal timesheet page
  if (isEmployee()) {
    navigate('/weekly-timesheet');
    return null;
  }

  const statusColors = {
    draft: 'default',
    submitted: 'warning',
    approved: 'success',
    rejected: 'error'
  };

  const handleApprovalAction = async () => {
    if (!selectedTimesheet || !selectedTimesheet.id) {
      console.error('No timesheet selected for approval');
      return;
    }
    
    try {
      await timesheetService.updateStatus(selectedTimesheet.id, approvalAction, approvalComments);
      
      await loadTimesheets(); // Refresh data
      
      setApprovalDialog(false);
      setApprovalComments('');
      setSelectedTimesheet(null);
    } catch (error) {
      console.error('Error updating timesheet:', error);
    }
  };

  const handleResubmit = async (timesheetId, comments = '') => {
    try {
      await timesheetService.resubmit(timesheetId, comments);
      
      // Update local state - change status from rejected to draft
      const updatedTimesheets = timesheets.map(ts => 
        ts.id === timesheetId 
          ? { 
              ...ts, 
              status: 'draft',
              approverComments: '', // Clear previous rejection comments
              rejectedDate: null
            }
          : ts
      );
      
      setTimesheets(updatedTimesheets);
      
      // Show success message
      setAlert({ 
        severity: 'success', 
        message: 'Timesheet has been resubmitted successfully!' 
      });
      
    } catch (error) {
      console.error('Error resubmitting timesheet:', error);
      setAlert({ 
        severity: 'error', 
        message: error.response?.data?.message || 'Failed to resubmit timesheet' 
      });
    }
  };

  const getStatusIcon = (status) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'approved': return <ApproveIcon color="success" />;
      case 'rejected': return <RejectIcon color="error" />;
      case 'submitted': return <PendingIcon color="warning" />;
      case 'draft': return <TimerIcon color="action" />;
      default: return <TimerIcon color="action" />;
    }
  };

  const filteredTimesheets = timesheets.filter(timesheet => {
    const employeeName = timesheet.employee ? 
      `${timesheet.employee.firstName || ''} ${timesheet.employee.lastName || ''}`.trim() : '';
    const employeeId = timesheet.employee?.employeeId || '';
    const department = timesheet.employee?.department?.name || '';
    
    const matchesSearch = 
      employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const normalizedStatus = timesheet.status?.toLowerCase();
    const normalizedFilter = statusFilter?.toLowerCase();
    const matchesStatus = statusFilter === 'all' || normalizedStatus === normalizedFilter;
    
    // Period filter - show all statuses for all periods (remove status restriction)
    const matchesPeriod = periodFilter === 'all' || 
      (periodFilter === 'current') || // For current period, show all statuses including drafts
      (periodFilter === 'previous') || // For previous period, show all statuses
      (periodFilter === 'month'); // For monthly view, show all statuses
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const TimesheetOverviewTab = () => (
    <Box>
      {/* Header with Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Timesheet Management
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => console.log('Export timesheets')}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-timesheet')}
          >
            New Timesheet
          </Button>
        </Stack>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {timesheets.filter(t => t.status?.toLowerCase() === 'submitted').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Approval
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {timesheets.filter(t => t.status?.toLowerCase() === 'approved').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approved This Week
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {timesheets.reduce((sum, t) => sum + parseFloat(t.totalHoursWorked || 0), 0).toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Hours
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="error.main" fontWeight="bold">
              {timesheets.reduce((sum, t) => {
                const totalHours = parseFloat(t.totalHoursWorked || 0);
                return sum + (totalHours > 40 ? totalHours - 40 : 0);
              }, 0).toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overtime Hours
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
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
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  label="Period"
                >
                  <MenuItem value="all">All Periods</MenuItem>
                  <MenuItem value="current">Current Week</MenuItem>
                  <MenuItem value="previous">Previous Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {filteredTimesheets.length} timesheets
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Timesheets Table */}
      <ResponsiveTable
        data={filteredTimesheets}
        loading={isLoading}
        columns={[
          {
            id: 'employee',
            label: 'Employee',
            render: (value, timesheet) => (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {timesheet.employee ? 
                    `${timesheet.employee.firstName?.[0] || ''}${timesheet.employee.lastName?.[0] || ''}` : 
                    'NA'
                  }
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {timesheet.employee ? 
                      `${timesheet.employee.firstName || ''} ${timesheet.employee.lastName || ''}`.trim() : 
                      'N/A'
                    }
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {timesheet.employee?.employeeId || 'N/A'} • {timesheet.employee?.department?.name || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            )
          },
          {
            id: 'period',
            label: 'Week Period',
            render: (value, timesheet) => (
              <Typography variant="body2">
                {timesheet.weekStartDate && timesheet.weekEndDate ? 
                  `${new Date(timesheet.weekStartDate).toLocaleDateString()} - ${new Date(timesheet.weekEndDate).toLocaleDateString()}` :
                  'Invalid Date'
                }
              </Typography>
            )
          },
          {
            id: 'hours',
            label: 'Total Hours',
            render: (value, timesheet) => (
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {timesheet.totalHoursWorked ? parseFloat(timesheet.totalHoursWorked).toFixed(1) : '0.0'}h
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={timesheet.totalHoursWorked ? (parseFloat(timesheet.totalHoursWorked) / 40) * 100 : 0}
                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
              </Box>
            )
          },
          {
            id: 'overtime',
            label: 'Overtime',
            render: (value, timesheet) => {
              const totalHours = parseFloat(timesheet.totalHoursWorked || 0);
              const overtimeHours = totalHours > 40 ? totalHours - 40 : 0;
              return (
                <Typography 
                  variant="body2" 
                  color={overtimeHours > 0 ? 'warning.main' : 'text.secondary'}
                  fontWeight={overtimeHours > 0 ? 'bold' : 'normal'}
                >
                  {overtimeHours.toFixed(1)}h
                </Typography>
              );
            }
          },
          {
            id: 'submitted',
            label: 'Submitted',
            render: (value, timesheet) => (
              <Typography variant="body2">
                {timesheet.submittedDate && !isNaN(new Date(timesheet.submittedDate))
                  ? new Date(timesheet.submittedDate).toLocaleDateString()
                  : 'Not submitted'}
              </Typography>
            )
          },
          {
            id: 'status',
            label: 'Status',
            render: (value, timesheet) => (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getStatusIcon(timesheet.status)}
                <Chip
                  label={timesheet.status?.toUpperCase()}
                  color={statusColors[timesheet.status?.toLowerCase()]}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            )
          },
          {
            id: 'actions',
            label: 'Actions',
            align: 'center',
            render: (value, timesheet) => (
              <Stack direction="row" spacing={1} justifyContent="center">
                <Button
                  size="small"
                  onClick={async () => {
                    setSelectedTimesheet(timesheet);
                    await loadWeekTimesheets(timesheet);
                    setViewDialog(true);
                  }}
                >
                  View
                </Button>
                {(isAdmin() || isHR() || isManager()) && timesheet.status?.toLowerCase() === 'submitted' && (
                  <>
                    <Button
                      size="small"
                      color="success"
                      onClick={async () => {
                        setSelectedTimesheet(timesheet);
                        await loadWeekTimesheets(timesheet);
                        setApprovalAction('approved');
                        setApprovalDialog(true);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={async () => {
                        setSelectedTimesheet(timesheet);
                        await loadWeekTimesheets(timesheet);
                        setApprovalAction('rejected');
                        setApprovalDialog(true);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {timesheet.status?.toLowerCase() === 'rejected' && (
                  <Button
                    size="small"
                    color="primary"
                    variant="outlined"
                    onClick={() => handleResubmit(timesheet.id)}
                  >
                    Resubmit
                  </Button>
                )}
              </Stack>
            )
          }
        ]}
        renderMobileCard={(timesheet) => (
          <Card 
            sx={{ 
              mb: 2, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              '&:hover': {
                boxShadow: 2,
                borderColor: 'primary.main'
              }
            }}
          >
            <CardContent sx={{ p: 2 }}>
              {/* Header with Employee and Status */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Avatar 
                    sx={{ 
                      mr: 2, 
                      bgcolor: 'primary.main',
                      width: 40,
                      height: 40
                    }}
                  >
                    {timesheet.employee ? 
                      `${timesheet.employee.firstName?.[0] || ''}${timesheet.employee.lastName?.[0] || ''}` : 
                      'NA'
                    }
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {timesheet.employee ? 
                        `${timesheet.employee.firstName || ''} ${timesheet.employee.lastName || ''}`.trim() : 
                        'N/A'
                      }
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {timesheet.employee?.employeeId || 'N/A'} • {timesheet.employee?.department?.name || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={(timesheet.status || 'unknown').toUpperCase()}
                  color={statusColors[timesheet.status] || 'default'}
                  size="small"
                />
              </Box>

              {/* Period and Hours Info */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Week Period
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {timesheet.weekStartDate && timesheet.weekEndDate ? 
                        `${new Date(timesheet.weekStartDate).toLocaleDateString()} - ${new Date(timesheet.weekEndDate).toLocaleDateString()}` : 
                        'N/A'
                      }
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Week {timesheet.weekNumber}, {timesheet.year}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Hours Worked
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {timesheet.totalHoursWorked ? `${parseFloat(timesheet.totalHoursWorked).toFixed(1)}h` : '0h'}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={timesheet.totalHoursWorked ? (parseFloat(timesheet.totalHoursWorked) / 40) * 100 : 0}
                      sx={{ mt: 1, height: 4, borderRadius: 2 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Overtime
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={parseFloat(timesheet.totalHoursWorked || 0) > 40 ? 'warning.main' : 'text.secondary'}
                      fontWeight={parseFloat(timesheet.totalHoursWorked || 0) > 40 ? 'bold' : 'normal'}
                    >
                      {parseFloat(timesheet.totalHoursWorked || 0) > 40 ? 
                        `${(parseFloat(timesheet.totalHoursWorked) - 40).toFixed(1)}h` : 
                        '0h'
                      }
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Submitted
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {timesheet.submittedDate && !isNaN(new Date(timesheet.submittedDate))
                        ? new Date(timesheet.submittedDate).toLocaleDateString()
                        : 'Not submitted'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={async () => {
                    setSelectedTimesheet(timesheet);
                    await loadWeekTimesheets(timesheet);
                    setViewDialog(true);
                  }}
                  sx={{ flex: 1, minWidth: 'auto' }}
                >
                  View
                </Button>
                {(isAdmin() || isHR() || isManager()) && timesheet.status?.toLowerCase() === 'submitted' && (
                  <>
                    <Button 
                      size="small" 
                      variant="contained"
                      color="success"
                      onClick={async () => {
                        setSelectedTimesheet(timesheet);
                        await loadWeekTimesheets(timesheet);
                        setApprovalAction('approved');
                        setApprovalDialog(true);
                      }}
                      sx={{ flex: 1, minWidth: 'auto' }}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained"
                      color="error"
                      onClick={async () => {
                        setSelectedTimesheet(timesheet);
                        await loadWeekTimesheets(timesheet);
                        setApprovalAction('rejected');
                        setApprovalDialog(true);
                      }}
                      sx={{ flex: 1, minWidth: 'auto' }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {timesheet.status?.toLowerCase() === 'rejected' && (
                  <Button
                    size="small"
                    color="primary"
                    variant="outlined"
                    onClick={() => handleResubmit(timesheet.id)}
                    sx={{ flex: 1, minWidth: 'auto' }}
                  >
                    Resubmit
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      />
    </Box>
  );

  const TimesheetAnalyticsTab = () => (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Timesheet Analytics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Department Hours Summary
              </Typography>
              {['Engineering', 'HR', 'Sales'].map((dept, index) => {
                const deptHours = timesheets
                  .filter(t => (t.department || '') === dept)
                  .reduce((sum, t) => sum + (t.totalHours || 0), 0);
                return (
                  <Box key={dept} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{dept}</Typography>
                      <Typography variant="body2" fontWeight="bold">{deptHours}h</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(deptHours / 120) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Overtime Trends
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Overtime hours by week
              </Typography>
              {/* This would typically contain a chart */}
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h3" color="warning.main">
                  {timesheets.reduce((sum, t) => sum + t.overtimeHours, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total overtime hours this period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
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
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              color: 'white',
              borderRadius: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimeIcon sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Timesheet Management
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Track and approve employee working hours
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Tabs */}
          <Paper sx={{ borderRadius: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
            >
              <Tab label="Timesheets" />
              <Tab label="Analytics" />
            </Tabs>

            {/* Alert Display */}
            {alert && (
              <Box sx={{ px: 3, pt: 2 }}>
                <Alert 
                  severity={alert.severity} 
                  onClose={() => setAlert(null)}
                  sx={{ mb: 2 }}
                >
                  {alert.message}
                </Alert>
              </Box>
            )}

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && <TimesheetOverviewTab />}
              {activeTab === 1 && <TimesheetAnalyticsTab />}
            </Box>
          </Paper>

          {/* Approval Dialog */}
          <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="lg" fullWidth>
            <DialogTitle>
              {approvalAction === 'approved' ? 'Approve' : 'Reject'} Timesheet
            </DialogTitle>
            <DialogContent>
              {selectedWeekTimesheets.length > 0 && (
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Employee</Typography>
                    <Typography variant="body2">
                      {selectedWeekTimesheets.length > 0 ? 
                        (selectedWeekTimesheets[0]?.employee ? 
                          `${selectedWeekTimesheets[0].employee.firstName} ${selectedWeekTimesheets[0].employee.lastName}` : 
                          selectedWeekTimesheets[0]?.employeeName || 'Unknown Employee'
                        ) : 'N/A'
                      }
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Period</Typography>
                    <Typography variant="body2">
                      {selectedWeekTimesheets.length > 0 ? 
                        `${selectedWeekTimesheets[0]?.weekStarting || selectedWeekTimesheets[0]?.weekStartDate || 'N/A'} to ${selectedWeekTimesheets[0]?.weekEnding || selectedWeekTimesheets[0]?.weekEndDate || 'N/A'}` 
                        : 'N/A'
                      }
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Hours Worked</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {selectedWeekTimesheets.reduce((total, ts) => total + parseFloat(ts?.totalHoursWorked || ts?.totalHours || 0), 0).toFixed(1)} hours total
                    </Typography>
                    
                    {/* Daily breakdown table */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>Daily Breakdown:</Typography>
                      <Table size="small" sx={{ mt: 1, border: 1, borderColor: 'divider' }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Project</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>Task</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Mon</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Tue</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Wed</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Thu</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Fri</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Sat</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Sun</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 60 }}>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedWeekTimesheets.map((timesheet, index) => (
                            <TableRow key={timesheet.id || index}>
                              <TableCell>{timesheet?.project?.name || timesheet?.projectName || 'N/A'}</TableCell>
                              <TableCell>{timesheet?.task?.name || timesheet?.taskName || 'N/A'}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.mondayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.tuesdayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.wednesdayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.thursdayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.fridayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.saturdayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.sundayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                {parseFloat(timesheet?.totalHoursWorked || timesheet?.totalHours || 0).toFixed(1)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {selectedWeekTimesheets.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={10} align="center">No timesheet data available</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Box>
                  </Box>

                  {selectedWeekTimesheets.length > 0 && selectedWeekTimesheets[0].description && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Description</Typography>
                      <Typography variant="body2">{selectedWeekTimesheets[0].description}</Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Status</Typography>
                    {selectedWeekTimesheets.length > 0 && (
                      <Chip
                        label={getStatusConfig(selectedWeekTimesheets[0].status).label}
                        color={getStatusConfig(selectedWeekTimesheets[0].status).color}
                      />
                    )}
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Comments"
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder={`Add comments for ${approvalAction === 'approved' ? 'approval' : 'rejection'}...`}
                  />
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
              <Button
                variant="contained"
                color={approvalAction === 'approved' ? 'success' : 'error'}
                onClick={() => handleApprovalAction(approvalAction)}
              >
                {approvalAction === 'approved' ? 'Approve' : 'Reject'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="lg" fullWidth>
            <DialogTitle>
              Timesheet Details - {selectedWeekTimesheets.length > 0 ? 
                (selectedWeekTimesheets[0]?.employee ? 
                  `${selectedWeekTimesheets[0].employee.firstName} ${selectedWeekTimesheets[0].employee.lastName}` : 
                  selectedWeekTimesheets[0]?.employeeName || 'Unknown Employee'
                ) : 'Unknown Employee'
              }
            </DialogTitle>
            <DialogContent>
              {selectedWeekTimesheets.length > 0 && (
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Employee</Typography>
                    <Typography variant="body2">
                      {selectedWeekTimesheets.length > 0 ? 
                        (selectedWeekTimesheets[0]?.employee ? 
                          `${selectedWeekTimesheets[0].employee.firstName} ${selectedWeekTimesheets[0].employee.lastName}` : 
                          selectedWeekTimesheets[0]?.employeeName || 'Unknown Employee'
                        ) : 'N/A'
                      }
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Period</Typography>
                    <Typography variant="body2">
                      {selectedWeekTimesheets.length > 0 ? 
                        `${selectedWeekTimesheets[0]?.weekStarting || selectedWeekTimesheets[0]?.weekStartDate || 'N/A'} to ${selectedWeekTimesheets[0]?.weekEnding || selectedWeekTimesheets[0]?.weekEndDate || 'N/A'}` 
                        : 'N/A'
                      }
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Hours Worked</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {selectedWeekTimesheets.reduce((total, ts) => total + parseFloat(ts?.totalHoursWorked || ts?.totalHours || 0), 0).toFixed(1)} hours total
                    </Typography>
                    
                    {/* Daily breakdown table */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>Daily Breakdown:</Typography>
                      <Table size="small" sx={{ mt: 1, border: 1, borderColor: 'divider' }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Project</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>Task</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Mon</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Tue</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Wed</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Thu</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Fri</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Sat</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Sun</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 60 }}>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedWeekTimesheets.map((timesheet, index) => (
                            <TableRow key={timesheet.id || index}>
                              <TableCell>{timesheet?.project?.name || timesheet?.projectName || 'N/A'}</TableCell>
                              <TableCell>{timesheet?.task?.name || timesheet?.taskName || 'N/A'}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.mondayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.tuesdayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.wednesdayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.thursdayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.fridayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.saturdayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet?.sundayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                {parseFloat(timesheet?.totalHoursWorked || timesheet?.totalHours || 0).toFixed(1)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {selectedWeekTimesheets.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={10} align="center">No timesheet data available</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Status</Typography>
                    {selectedWeekTimesheets.length > 0 && (
                      <Chip
                        label={getStatusConfig(selectedWeekTimesheets[0].status).label}
                        color={getStatusConfig(selectedWeekTimesheets[0].status).color}
                      />
                    )}
                  </Box>

                  {selectedTimesheet && selectedTimesheet.entries && selectedTimesheet.entries.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Time Entries</Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Project</TableCell>
                            <TableCell>Task</TableCell>
                            <TableCell align="right">Hours</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedTimesheet && selectedTimesheet.entries && selectedTimesheet.entries.map((entry, index) => (
                            <TableRow key={index}>
                              <TableCell>{entry.date || 'N/A'}</TableCell>
                              <TableCell>{entry.projectName || 'N/A'}</TableCell>
                              <TableCell>{entry.taskName || 'N/A'}</TableCell>
                              <TableCell align="right">{entry.hours || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}

                  {selectedTimesheet && selectedTimesheet.description && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Description</Typography>
                      <Typography variant="body2">{selectedTimesheet.description}</Typography>
                    </Box>
                  )}

                  {selectedTimesheet && selectedTimesheet.comments && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Comments</Typography>
                      <Typography variant="body2" sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                        {selectedTimesheet.comments}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default ModernTimesheetManagement;
