import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Tooltip,
  CircularProgress,
  Alert,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Drafts as DraftIcon,
  Send as SubmittedIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { timesheetService } from '../../../services/timesheet.service';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const TimesheetHistory = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    loadTimesheets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [timesheets, statusFilter, dateRange]);

  const loadTimesheets = async () => {
    setLoading(true);
    try {
      const response = await timesheetService.getAll({ limit: 1000, page: 1 });
      const allTimesheets = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      
      console.log('DEBUG: Current user:', user);
      console.log('DEBUG: User employee ID:', user?.employee?.id);
      console.log('DEBUG: All timesheets loaded:', allTimesheets.length);
      console.log('DEBUG: Sample timesheet:', allTimesheets[0]);
      
      // Filter to show only current user's timesheets
      // Try multiple possible employee ID fields
      const myEmployeeId = user?.employee?.id || user?.employeeId;
      const myTimesheets = allTimesheets.filter(ts => {
        const matches = ts.employeeId === myEmployeeId;
        if (allTimesheets.indexOf(ts) === 0) {
          console.log('DEBUG: Comparing timesheet.employeeId', ts.employeeId, 'with user employee ID', myEmployeeId, '- Match:', matches);
        }
        return matches;
      });
      
      console.log('DEBUG: Filtered timesheets for current user:', myTimesheets.length);
      
      setTimesheets(myTimesheets);
      showAlert('success', `Loaded ${myTimesheets.length} timesheets`);
    } catch (error) {
      console.error('Error loading timesheets:', error);
      showAlert('error', error.response?.data?.message || 'Failed to load timesheets');
      setTimesheets([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...timesheets];

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(ts => ts.status === statusFilter);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(ts => 
        dayjs(ts.weekStartDate).isAfter(dayjs(dateRange.start).subtract(1, 'day'))
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(ts => 
        dayjs(ts.weekStartDate).isBefore(dayjs(dateRange.end).add(1, 'day'))
      );
    }

    // Sort by week start date (most recent first)
    filtered.sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());

    setFilteredTimesheets(filtered);
    setPage(0);
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleViewDetails = (timesheet) => {
    // Find all timesheets for this week
    const weekTimesheets = timesheets.filter(ts => 
      ts.employeeId === timesheet.employeeId &&
      ts.weekStartDate === timesheet.weekStartDate
    );
    
    setSelectedTimesheet({
      ...timesheet,
      weekTimesheets: weekTimesheets
    });
    setViewDialogOpen(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'default',
      'Submitted': 'warning',
      'Approved': 'success',
      'Rejected': 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Draft': <DraftIcon />,
      'Submitted': <SubmittedIcon />,
      'Approved': <ApprovedIcon />,
      'Rejected': <RejectedIcon />
    };
    return icons[status] || <DraftIcon />;
  };

  const formatDate = (date) => {
    return dayjs(date).format('MMM DD, YYYY');
  };

  const getTotalHours = (timesheet) => {
    const hours = timesheet.totalHoursWorked || calculateWeekTotal(timesheet);
    return parseFloat(hours) || 0;
  };

  const calculateWeekTotal = (timesheet) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.reduce((total, day) => {
      return total + parseFloat(timesheet[`${day}Hours`] || 0);
    }, 0);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setDateRange({ start: '', end: '' });
    showAlert('info', 'Filters cleared');
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Week Start', 'Week End', 'Project', 'Task', 'Hours', 'Status', 'Submitted Date', 'Approved/Rejected Date'],
      ...filteredTimesheets.map(ts => [
        formatDate(ts.weekStartDate),
        formatDate(ts.weekEndDate),
        ts.project?.name || 'N/A',
        ts.task?.name || 'N/A',
        getTotalHours(ts),
        ts.status,
        ts.submittedAt ? formatDate(ts.submittedAt) : '-',
        ts.approvedAt ? formatDate(ts.approvedAt) : (ts.rejectedAt ? formatDate(ts.rejectedAt) : '-')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_timesheets_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showAlert('success', 'Timesheets exported successfully');
  };

  const getSummaryStats = () => {
    return {
      total: filteredTimesheets.length,
      draft: filteredTimesheets.filter(ts => ts.status === 'Draft').length,
      submitted: filteredTimesheets.filter(ts => ts.status === 'Submitted').length,
      approved: filteredTimesheets.filter(ts => ts.status === 'Approved').length,
      rejected: filteredTimesheets.filter(ts => ts.status === 'Rejected').length,
      totalHours: filteredTimesheets.reduce((sum, ts) => sum + getTotalHours(ts), 0)
    };
  };

  const paginatedTimesheets = filteredTimesheets.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const stats = getSummaryStats();

  return (
    <Box sx={{ p: 3, bgcolor: theme.palette.background.default, minHeight: '100vh' }}>
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3,
          bgcolor: 'white',
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom color="text.primary">
              My Timesheet History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and track your submitted timesheets
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportToCSV}
              disabled={filteredTimesheets.length === 0}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              startIcon={filterOpen ? <FilterIcon /> : <FilterIcon />}
              onClick={() => setFilterOpen(!filterOpen)}
            >
              {filterOpen ? 'Hide' : 'Show'} Filters
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Alert */}
      <Collapse in={alert.show}>
        <Alert 
          severity={alert.type} 
          sx={{ mb: 2, borderRadius: 2 }} 
          onClose={() => setAlert({ ...alert, show: false })}
        >
          {alert.message}
        </Alert>
      </Collapse>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            bgcolor: 'white', 
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4]
            }
          }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Total Timesheets</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            bgcolor: alpha(theme.palette.text.secondary, 0.05), 
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.text.secondary, 0.2)}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4]
            }
          }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Draft</Typography>
              <Typography variant="h4" fontWeight="bold" color="text.secondary">{stats.draft}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            bgcolor: alpha(theme.palette.warning.main, 0.1), 
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4]
            }
          }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Submitted</Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">{stats.submitted}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            bgcolor: alpha(theme.palette.success.main, 0.1), 
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4]
            }
          }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Approved</Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">{stats.approved}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.1), 
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4]
            }
          }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Total Hours</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">{stats.totalHours.toFixed(1)}h</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Collapse in={filterOpen}>
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Submitted">Submitted</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Start Date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="End Date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button 
                fullWidth
                variant="outlined" 
                onClick={clearFilters}
                disabled={!statusFilter && !dateRange.start && !dateRange.end}
                sx={{ height: '40px' }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Timesheets Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <TableRow>
              <TableCell><strong>Week Period</strong></TableCell>
              <TableCell><strong>Project / Task</strong></TableCell>
              <TableCell align="center"><strong>Hours</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell><strong>Submitted</strong></TableCell>
              <TableCell><strong>Response</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paginatedTimesheets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CalendarIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No timesheets found
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {statusFilter || dateRange.start || dateRange.end 
                        ? 'Try adjusting your filters' 
                        : 'Start by submitting your first timesheet'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTimesheets.map((timesheet, index) => (
                <TableRow 
                  key={timesheet.id} 
                  hover
                  sx={{ 
                    bgcolor: index % 2 === 0 ? 'white' : alpha(theme.palette.background.default, 0.3),
                    '&:hover': { bgcolor: `${alpha(theme.palette.primary.main, 0.05)} !important` }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDate(timesheet.weekStartDate)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Week {timesheet.weekNumber}, {timesheet.year}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {timesheet.project?.name || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {timesheet.task?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {getTotalHours(timesheet).toFixed(1)}h
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      icon={getStatusIcon(timesheet.status)}
                      label={timesheet.status} 
                      color={getStatusColor(timesheet.status)} 
                      size="small"
                      sx={{ fontWeight: 500, minWidth: 100 }}
                    />
                  </TableCell>
                  <TableCell>
                    {timesheet.submittedAt ? (
                      <>
                        <Typography variant="body2">
                          {formatDate(timesheet.submittedAt)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {dayjs(timesheet.submittedAt).fromNow()}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="textSecondary">Not submitted</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {timesheet.status === 'Approved' && timesheet.approvedAt && (
                      <>
                        <Typography variant="body2" color="success.main">
                          Approved
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {dayjs(timesheet.approvedAt).fromNow()}
                        </Typography>
                      </>
                    )}
                    {timesheet.status === 'Rejected' && timesheet.rejectedAt && (
                      <>
                        <Typography variant="body2" color="error.main">
                          Rejected
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {dayjs(timesheet.rejectedAt).fromNow()}
                        </Typography>
                      </>
                    )}
                    {(timesheet.status === 'Draft' || timesheet.status === 'Submitted') && (
                      <Typography variant="body2" color="textSecondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewDetails(timesheet)}
                        sx={{ 
                          bgcolor: 'action.hover',
                          '&:hover': { bgcolor: 'info.light', color: 'info.main' }
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTimesheets.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid #e0e0e0' }}
        />
      </TableContainer>

      {/* View Details Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.light',
          color: 'primary.dark',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <ViewIcon />
          Timesheet Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedTimesheet && (
            <Box>
              {/* Week & Status Info */}
              <Paper sx={{ p: 2.5, mb: 2, bgcolor: alpha(theme.palette.background.default, 0.6) }} elevation={0}>
                <Typography variant="overline" color="textSecondary" fontWeight={600}>
                  Week Information
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
                      Week Period
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatDate(selectedTimesheet.weekStartDate)} - {formatDate(selectedTimesheet.weekEndDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip 
                        icon={getStatusIcon(selectedTimesheet.status)}
                        label={selectedTimesheet.status} 
                        color={getStatusColor(selectedTimesheet.status)} 
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                  </Grid>
                  {selectedTimesheet.approverComments && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
                        Comments from Approver
                      </Typography>
                      <Alert severity={selectedTimesheet.status === 'Rejected' ? 'error' : 'info'} sx={{ mt: 1 }}>
                        {selectedTimesheet.approverComments}
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Hours Breakdown Table */}
              <Paper sx={{ p: 2.5, mb: 2 }} elevation={1}>
                <Typography variant="overline" color="textSecondary" fontWeight={600}>
                  Hours Breakdown
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.background.default, 0.6) }}>
                        <TableCell><strong>Project / Task</strong></TableCell>
                        <TableCell align="center"><strong>Mon</strong></TableCell>
                        <TableCell align="center"><strong>Tue</strong></TableCell>
                        <TableCell align="center"><strong>Wed</strong></TableCell>
                        <TableCell align="center"><strong>Thu</strong></TableCell>
                        <TableCell align="center"><strong>Fri</strong></TableCell>
                        <TableCell align="center"><strong>Sat</strong></TableCell>
                        <TableCell align="center"><strong>Sun</strong></TableCell>
                        <TableCell align="center"><strong>Total</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedTimesheet.weekTimesheets || [selectedTimesheet]).map((ts) => (
                        <TableRow key={ts.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {ts.project?.name || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {ts.task?.name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{parseFloat(ts.mondayHours || 0).toFixed(1)}</TableCell>
                          <TableCell align="center">{parseFloat(ts.tuesdayHours || 0).toFixed(1)}</TableCell>
                          <TableCell align="center">{parseFloat(ts.wednesdayHours || 0).toFixed(1)}</TableCell>
                          <TableCell align="center">{parseFloat(ts.thursdayHours || 0).toFixed(1)}</TableCell>
                          <TableCell align="center">{parseFloat(ts.fridayHours || 0).toFixed(1)}</TableCell>
                          <TableCell align="center">{parseFloat(ts.saturdayHours || 0).toFixed(1)}</TableCell>
                          <TableCell align="center">{parseFloat(ts.sundayHours || 0).toFixed(1)}</TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {getTotalHours(ts).toFixed(1)}h
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Description */}
              {selectedTimesheet.description && (
                <Paper sx={{ p: 2.5, bgcolor: alpha(theme.palette.background.default, 0.6) }} elevation={0}>
                  <Typography variant="overline" color="textSecondary" fontWeight={600}>
                    Description
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedTimesheet.description}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewDialogOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimesheetHistory;
