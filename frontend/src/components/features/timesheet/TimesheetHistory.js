import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
  Skeleton,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DatePicker,
  Checkbox,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Send as SubmitIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  Article as DraftIcon,
  History as HistoryIcon,
  DateRange as DateRangeIcon,
  AccessTime as TimeIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
// Date picker functionality disabled - using native HTML5 date inputs instead
import { useAuth } from '../../../contexts/AuthContext';
import { useLoading } from '../../../contexts/LoadingContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { timesheetService } from '../../../services/timesheet.service';

const TimesheetHistory = ({ 
  employeeId = null, 
  showHeader = true, 
  currentWeek = null,
  onWeekChange = null 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAdmin, isHR, isManager } = useAuth();
  const { setLoading } = useLoading();
  const { showSuccess, showError } = useNotification();

  // State management
  const [timesheets, setTimesheets] = useState([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState([]);
  const [loading, setLocalLoading] = useState(true);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editTimesheetData, setEditTimesheetData] = useState(null);
  const [submitDialog, setSubmitDialog] = useState(false);
  const [resubmitComments, setResubmitComments] = useState('');
  
  // Bulk operations state
  const [selectedDrafts, setSelectedDrafts] = useState(new Set());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  // Data insights for better UX
  const [dataDateRange, setDataDateRange] = useState({ earliest: null, latest: null });
  const [hasFilteredOutData, setHasFilteredOutData] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Load timesheet history
  const loadTimesheetHistory = async () => {
    try {
      setLocalLoading(true);
      setLoading(true);
      
      console.log('🔍 TimesheetHistory: Loading timesheet data...');
      
      const params = {
        limit: 100  // Load more records by default to ensure users see their historical data
      };
      if (employeeId && (isAdmin || isHR)) {
        params.employeeId = employeeId;
      }
      
      console.log('📊 TimesheetHistory: API params:', params);
      
      const response = await timesheetService.getAll(params);
      console.log('📬 TimesheetHistory: API response:', { 
        success: response?.success, 
        dataType: typeof response?.data,
        dataLength: Array.isArray(response?.data) ? response.data.length : 'Not array'
      });
      
      const timesheetData = response.success ? response.data : (response.data || []);
      console.log('📋 TimesheetHistory: Processed timesheet data:', {
        length: timesheetData.length,
        sample: timesheetData[0] ? `Week ${timesheetData[0].weekNumber}, ${timesheetData[0].year}` : 'No data'
      });
      
      // Calculate data date range for better UX guidance
      if (timesheetData.length > 0) {
        const dates = timesheetData.map(t => dayjs(t.date || t.weekStartDate)).sort((a, b) => a.diff(b));
        const dataRange = {
          earliest: dates[0].format('YYYY-MM-DD'),
          latest: dates[dates.length - 1].format('YYYY-MM-DD')
        };
        setDataDateRange(dataRange);
        console.log('📈 Data date range calculated:', {
          earliest: dataRange.earliest,
          latest: dataRange.latest,
          span: `${dates[dates.length - 1].diff(dates[0], 'day')} days`,
          totalRecords: timesheetData.length
        });
      } else {
        setDataDateRange({ earliest: null, latest: null });
      }
      
      setTimesheets(timesheetData);
      applyFilters(timesheetData);
      
    } catch (error) {
      console.error('❌ TimesheetHistory: Error loading timesheet history:', error);
      console.error('❌ TimesheetHistory: Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      showError('Failed to load timesheet history');
      setTimesheets([]);
      setFilteredTimesheets([]);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  // Group timesheets by week
  const groupTimesheetsByWeek = (timesheets) => {
    const weekGroups = {};
    
    timesheets.forEach(timesheet => {
      const weekStartDate = dayjs(timesheet.weekStartDate);
      const weekStart = weekStartDate.startOf('week');
      const weekKey = weekStart.format('YYYY-MM-DD');
      
      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = {
          weekStart: weekStart,
          weekEnd: weekStart.endOf('week'),
          timesheets: [], // Array to hold multiple timesheets
          totalHours: 0,
          status: timesheet.status, // Will be updated to reflect overall status
          canEdit: false // Will be updated based on all timesheets in the week
        };
      }
      
      // Add this timesheet to the week group
      weekGroups[weekKey].timesheets.push(timesheet);
      weekGroups[weekKey].totalHours += parseFloat(timesheet.totalHoursWorked) || 0;
      
      // Update overall status and edit capability
      const group = weekGroups[weekKey];
      const allStatuses = group.timesheets.map(ts => ts.status);
      
      // Determine overall status priority: Submitted > Approved > Rejected > Draft
      if (allStatuses.includes('Submitted')) {
        group.status = 'Submitted';
      } else if (allStatuses.includes('Approved')) {
        group.status = 'Approved';
      } else if (allStatuses.includes('Rejected')) {
        group.status = 'Rejected';
      } else {
        group.status = 'Draft';
      }
      
      // Can allow entry if any timesheet is Draft or Rejected
      group.canEdit = group.timesheets.some(ts => ts.status === 'Draft' || ts.status === 'Rejected');
    });
    
    // Convert to array and sort by week start date (newest first)
    return Object.values(weekGroups).sort((a, b) => b.weekStart.valueOf() - a.weekStart.valueOf());
  };

  // Apply filters to timesheets
  const applyFilters = (data = timesheets) => {
    console.log('🔍 TimesheetHistory: Applying filters...', {
      inputDataLength: data.length,
      statusFilter,
      dateRangeFilter,
      startDate,
      endDate
    });
    
    let filtered = [...data];

    // Status filter
    if (statusFilter !== 'all') {
      const beforeStatusFilter = filtered.length;
      filtered = filtered.filter(ts => ts.status === statusFilter);
      console.log(`📊 TimesheetHistory: Status filter (${statusFilter}): ${beforeStatusFilter} → ${filtered.length}`);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = dayjs();
      let filterStartDate, filterEndDate;

      switch (dateRangeFilter) {
        case 'thisWeek':
          filterStartDate = now.startOf('week');
          filterEndDate = now.endOf('week');
          break;
        case 'lastWeek':
          filterStartDate = now.subtract(1, 'week').startOf('week');
          filterEndDate = now.subtract(1, 'week').endOf('week');
          break;
        case 'thisMonth':
          filterStartDate = now.startOf('month');
          filterEndDate = now.endOf('month');
          break;
        case 'lastMonth':
          filterStartDate = now.subtract(1, 'month').startOf('month');
          filterEndDate = now.subtract(1, 'month').endOf('month');
          break;
        case 'custom':
          if (startDate && endDate) {
            filterStartDate = dayjs(startDate);
            filterEndDate = dayjs(endDate);
          }
          break;
        default:
          break;
      }

      if (filterStartDate && filterEndDate) {
        const beforeDateFilter = filtered.length;
        console.log(`📅 TimesheetHistory: Date filter range: ${filterStartDate.format('YYYY-MM-DD')} to ${filterEndDate.format('YYYY-MM-DD')}`);
        
        filtered = filtered.filter(ts => {
          const weekStartDate = dayjs(ts.weekStartDate);
          const isInRange = weekStartDate.isAfter(filterStartDate.subtract(1, 'day')) && 
                           weekStartDate.isBefore(filterEndDate.add(1, 'day'));
          
          if (!isInRange && ts.weekNumber === 38 && ts.year === 2025) {
            console.log(`🔍 Week 38 filtered out: ${ts.weekStartDate} not in range ${filterStartDate.format('YYYY-MM-DD')} to ${filterEndDate.format('YYYY-MM-DD')}`);
          }
          
          return isInRange;
        });
        
        console.log(`📊 TimesheetHistory: Date filter: ${beforeDateFilter} → ${filtered.length}`);
      }
    }

    // Sort by week start date (newest first)
    filtered.sort((a, b) => dayjs(b.weekStartDate).valueOf() - dayjs(a.weekStartDate).valueOf());

    // Group by weeks for weekly timesheet display
    const weeklyGroups = groupTimesheetsByWeek(filtered);
    console.log('📊 TimesheetHistory: Final filtered result:', {
      filteredCount: filtered.length,
      weeklyGroups: weeklyGroups.length,
      weeks: weeklyGroups.map(g => `Week ${g.weekStart.format('W, YYYY')}`).slice(0, 5)
    });
    
    // Smart data detection: If no results with current filters but data exists, suggest showing all
    const hasDataButNoResults = weeklyGroups.length === 0 && data.length > 0 && dateRangeFilter !== 'all';
    setHasFilteredOutData(hasDataButNoResults);
    
    if (hasDataButNoResults) {
      console.log('💡 TimesheetHistory: Smart data detection triggered:', {
        currentFilter: dateRangeFilter,
        totalDataAvailable: data.length,
        dataDateRange: dataDateRange,
        suggestion: 'Show all time data to see available timesheets'
      });
    }
    
    setFilteredTimesheets(weeklyGroups);
    setPage(1); // Reset to first page when filters change
  };

  useEffect(() => {
    loadTimesheetHistory();
  }, [employeeId]);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, dateRangeFilter, startDate, endDate]);

  // Get status color and icon
  const getStatusConfig = (status) => {
    const configs = {
      Draft: { color: 'default', icon: <DraftIcon />, label: 'Draft' },
      Submitted: { color: 'warning', icon: <PendingIcon />, label: 'Submitted' },
      Approved: { color: 'success', icon: <ApprovedIcon />, label: 'Approved' },
      Rejected: { color: 'error', icon: <RejectedIcon />, label: 'Rejected' }
    };
    return configs[status] || configs.Draft;
  };

  // Handle timesheet submission
  const handleSubmitTimesheet = async (timesheetId) => {
    try {
      await timesheetService.submit(timesheetId);
      showSuccess('Timesheet submitted for approval successfully');
      loadTimesheetHistory(); // Refresh data
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      showError(error.response?.data?.message || 'Failed to submit timesheet');
    }
  };

  // Handle bulk draft submission
  const handleBulkSubmitDrafts = async () => {
    if (selectedDrafts.size === 0) return;
    
    setBulkSubmitting(true);
    try {
      const timesheetIds = Array.from(selectedDrafts);
      const response = await fetch('/api/timesheets/bulk-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ timesheetIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit timesheets');
      }

      const result = await response.json();
      showSuccess(`Successfully submitted ${result.data.submitted} timesheets for approval`);
      setSelectedDrafts(new Set()); // Clear selection
      loadTimesheetHistory(); // Refresh data
    } catch (error) {
      console.error('Error bulk submitting timesheets:', error);
      showError('Failed to submit timesheets. Please try again.');
    }
    setBulkSubmitting(false);
  };

  // Handle bulk submit with specific timesheet IDs
  const handleBulkSubmit = async (timesheetIds) => {
    if (!timesheetIds || timesheetIds.length === 0) return;
    
    setBulkSubmitting(true);
    try {
      const response = await fetch('/api/timesheets/bulk-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ timesheetIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit timesheets');
      }

      const result = await response.json();
      showSuccess(`Successfully submitted ${result.data.submitted} timesheets for approval`);
      loadTimesheetHistory(); // Refresh data
    } catch (error) {
      console.error('Error bulk submitting timesheets:', error);
      showError('Failed to submit timesheets. Please try again.');
    }
    setBulkSubmitting(false);
  };

  // Handle view week details
  const handleViewDetails = (weekGroup) => {
    setSelectedTimesheet(weekGroup); // Set the entire week group for viewing multiple timesheets
    setDetailDialog(true);
  };

  // Handle entry for multiple tasks for the same week
  const handleEntryMultipleTasks = (weekGroup) => {
    // For now, this will navigate to the main timesheet entry page for that week
    // Could be enhanced to open an entry dialog with table format
    console.log('Entry for multiple tasks for week:', weekGroup.weekStart.format('YYYY-MM-DD'));
    showError('Multiple task entry will open in the main timesheet entry. Navigate to Submit Timesheet and select the week.');
  };

  // Handle draft selection toggle
  const handleDraftToggle = (timesheetId) => {
    const newSelected = new Set(selectedDrafts);
    if (newSelected.has(timesheetId)) {
      newSelected.delete(timesheetId);
    } else {
      newSelected.add(timesheetId);
    }
    setSelectedDrafts(newSelected);
  };

  // Handle select all drafts
  const handleSelectAllDrafts = () => {
    // Get all draft timesheet IDs from weekly timesheets
    const draftWeeks = filteredTimesheets.filter(week => week.status === 'Draft');
    const allDraftIds = draftWeeks.flatMap(week => 
      week.timesheets.filter(ts => ts.status === 'Draft').map(ts => ts.id)
    );
    
    if (selectedDrafts.size === allDraftIds.length && allDraftIds.length > 0) {
      setSelectedDrafts(new Set()); // Deselect all
    } else {
      setSelectedDrafts(new Set(allDraftIds)); // Select all
    }
  };

  // Handle timesheet resubmission
  const handleResubmitTimesheet = async () => {
    try {
      await timesheetService.resubmit(selectedTimesheet.id, resubmitComments);
      showSuccess('Timesheet resubmitted successfully');
      setSubmitDialog(false);
      setResubmitComments('');
      setSelectedTimesheet(null);
      loadTimesheetHistory(); // Refresh data
    } catch (error) {
      console.error('Error resubmitting timesheet:', error);
      showError(error.response?.data?.message || 'Failed to resubmit timesheet');
    }
  };

  // Handle timesheet update
  const handleUpdateTimesheet = async () => {
    try {
      // Calculate total hours with proper number conversion
      const totalHours = (
        parseFloat(editTimesheetData.mondayHours || 0) +
        parseFloat(editTimesheetData.tuesdayHours || 0) +
        parseFloat(editTimesheetData.wednesdayHours || 0) +
        parseFloat(editTimesheetData.thursdayHours || 0) +
        parseFloat(editTimesheetData.fridayHours || 0) +
        parseFloat(editTimesheetData.saturdayHours || 0) +
        parseFloat(editTimesheetData.sundayHours || 0)
      );

      const updateData = {
        mondayHours: parseFloat(editTimesheetData.mondayHours || 0),
        tuesdayHours: parseFloat(editTimesheetData.tuesdayHours || 0),
        wednesdayHours: parseFloat(editTimesheetData.wednesdayHours || 0),
        thursdayHours: parseFloat(editTimesheetData.thursdayHours || 0),
        fridayHours: parseFloat(editTimesheetData.fridayHours || 0),
        saturdayHours: parseFloat(editTimesheetData.saturdayHours || 0),
        sundayHours: parseFloat(editTimesheetData.sundayHours || 0),
        description: editTimesheetData.description || ''
      };

      await timesheetService.update(editTimesheetData.id, updateData);
      showSuccess('Timesheet updated successfully');
      setEditDialog(false);
      setEditTimesheetData(null);
      loadTimesheetHistory(); // Refresh data
    } catch (error) {
      console.error('Error updating timesheet:', error);
      showError(error.response?.data?.message || 'Failed to update timesheet');
    }
  };

  // Paginated timesheets
  const paginatedTimesheets = filteredTimesheets.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalPages = Math.ceil(filteredTimesheets.length / rowsPerPage);

  // Calculate summary stats for weekly display
  const summaryStats = {
    total: filteredTimesheets.length, // Number of weeks
    totalHours: filteredTimesheets.reduce((sum, week) => sum + week.totalHours, 0),
    draft: filteredTimesheets.filter(week => week.status === 'Draft').length,
    submitted: filteredTimesheets.filter(week => week.status === 'Submitted').length,
    approved: filteredTimesheets.filter(week => week.status === 'Approved').length,
    rejected: filteredTimesheets.filter(week => week.status === 'Rejected').length
  };

  if (loading) {
    return (
      <Box p={3}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {showHeader && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Timesheet History
          </Typography>
          
          {/* Current Week Indicator */}
          {currentWeek && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" color="info.contrastText">
                📍 Currently viewing week: <strong>
                  {currentWeek.format('MMM D')} - {currentWeek.add(6, 'day').format('MMM D, YYYY')}
                  (Week {currentWeek.isoWeek()}, {currentWeek.year()})
                </strong>
              </Typography>
              <Typography variant="caption" color="info.contrastText" sx={{ opacity: 0.8 }}>
                Matching weeks are highlighted below
              </Typography>
            </Box>
          )}
          
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                  <Typography variant="h6" color="primary">
                    {summaryStats.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Weeks
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                  <Typography variant="h6" color="primary">
                    {(summaryStats.totalHours || 0).toFixed(1)}h
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Hours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                  <Typography variant="h6" color="warning.main">
                    {summaryStats.draft}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Draft Weeks
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                  <Typography variant="h6" color="info.main">
                    {summaryStats.submitted}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Submitted Weeks
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                  <Typography variant="h6" color="success.main">
                    {summaryStats.approved}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Approved Weeks
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                  <Typography variant="h6" color="error.main">
                    {summaryStats.rejected}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Rejected Weeks
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRangeFilter}
                  label="Date Range"
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                >
                  {dateRangeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {dateRangeFilter === 'custom' && (
              <>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={startDate ? startDate.format('YYYY-MM-DD') : ''}
                    onChange={(e) => setStartDate(dayjs(e.target.value))}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={endDate ? endDate.format('YYYY-MM-DD') : ''}
                    onChange={(e) => setEndDate(dayjs(e.target.value))}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
            
            {/* Data Range Information */}
            {dataDateRange.earliest && dataDateRange.latest && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 1.5, 
                  backgroundColor: 'background.default', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      📊 Your timesheet data:
                    </Typography>
                    <Chip 
                      label={`${dayjs(dataDateRange.earliest).format('MMM DD, YYYY')} - ${dayjs(dataDateRange.latest).format('MMM DD, YYYY')}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({timesheets.length} timesheet{timesheets.length !== 1 ? 's' : ''})
                    </Typography>
                    {hasFilteredOutData && (
                      <Chip 
                        label="Filters may be hiding data"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Box>
              </Grid>
            )}
            
            {/* Bulk Submit Section */}
            {selectedDrafts.size > 0 && (
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDrafts.size} draft(s) selected
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<SubmitIcon />}
                    onClick={handleBulkSubmitDrafts}
                    disabled={bulkSubmitting}
                    size="small"
                  >
                    {bulkSubmitting ? 'Submitting...' : `Submit ${selectedDrafts.size} Draft(s)`}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedDrafts(new Set())}
                    size="small"
                  >
                    Clear Selection
                  </Button>
                </Stack>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Enhanced Empty State with Smart Messaging */}
      {filteredTimesheets.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            
            {/* Context-aware messaging based on data availability */}
            {timesheets.length === 0 ? (
              // No data at all
              <>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Timesheet History Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You haven't submitted any timesheets yet. Start tracking your time to see your history here.
                </Typography>
              </>
            ) : hasFilteredOutData ? (
              // Data exists but current filters hide it
              <>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Timesheets Match Current Filters
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  You have {timesheets.length} timesheet{timesheets.length !== 1 ? 's' : ''} available, but none match your current filter settings.
                </Typography>
                {dataDateRange.earliest && dataDateRange.latest && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Your timesheet data ranges from {dayjs(dataDateRange.earliest).format('MMM DD, YYYY')} to {dayjs(dataDateRange.latest).format('MMM DD, YYYY')}.
                  </Typography>
                )}
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    setDateRangeFilter('all');
                    setStatusFilter('all');
                  }}
                  sx={{ mt: 1 }}
                >
                  Show All Timesheets
                </Button>
              </>
            ) : (
              // Data exists but filtered out by other criteria
              <>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Timesheets Match Current Filters
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Try adjusting your filter settings to see your timesheet history.
                </Typography>
                {dataDateRange.earliest && dataDateRange.latest && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Available data: {dayjs(dataDateRange.earliest).format('MMM DD, YYYY')} - {dayjs(dataDateRange.latest).format('MMM DD, YYYY')}
                  </Typography>
                )}
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    setDateRangeFilter('all');
                    setStatusFilter('all');
                  }}
                  sx={{ mt: 1 }}
                >
                  Reset Filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile View */}
          {isMobile ? (
            <Stack spacing={2}>
              {paginatedTimesheets.map((weekGroup, index) => {
                const statusConfig = getStatusConfig(weekGroup.status);
                const isCurrentWeek = currentWeek && 
                  weekGroup.weekStart.format('YYYY-MM-DD') === currentWeek.format('YYYY-MM-DD');
                
                return (
                  <Card 
                    key={weekGroup.weekStart.format('YYYY-MM-DD')}
                    sx={{
                      border: isCurrentWeek ? 2 : 1,
                      borderColor: isCurrentWeek ? 'primary.main' : 'divider',
                      backgroundColor: isCurrentWeek ? 'action.selected' : 'inherit'
                    }}
                  >
                    <CardContent>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Week of {weekGroup.weekStart.format('MMM DD, YYYY')}
                            </Typography>
                            <Chip
                              icon={statusConfig.icon}
                              label={statusConfig.label}
                              color={statusConfig.color}
                              size="small"
                            />
                          </Box>
                          <Typography variant="h6" color="primary">
                            {weekGroup.totalHours.toFixed(1)}h
                          </Typography>
                        </Box>
                        
                        <Box>
                          {weekGroup.timesheets.length === 1 ? (
                            // Single timesheet
                            <>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <WorkIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                {weekGroup.timesheets[0].project?.name || 'No Project'} - {weekGroup.timesheets[0].task?.name || 'No Task'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {weekGroup.timesheets[0].description}
                              </Typography>
                            </>
                          ) : (
                            // Multiple timesheets
                            <>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <WorkIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                {weekGroup.timesheets.length} Task Entries
                              </Typography>
                              <Box sx={{ ml: 2 }}>
                                {weekGroup.timesheets.slice(0, 2).map((ts, idx) => (
                                  <Typography key={idx} variant="caption" color="text.secondary" display="block">
                                    • {ts.project?.name || 'No Project'} - {ts.task?.name || 'No Task'} ({parseFloat(ts.totalHoursWorked || 0).toFixed(1)}h)
                                  </Typography>
                                ))}
                                {weekGroup.timesheets.length > 2 && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    ... and {weekGroup.timesheets.length - 2} more
                                  </Typography>
                                )}
                              </Box>
                            </>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* Go to Entry button */}
                          {onWeekChange && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => {
                                onWeekChange(weekGroup.weekStart);
                                // Note: This would switch to entry tab in parent component
                              }}
                              sx={{ minWidth: 'auto', px: 1 }}
                            >
                              Go to Entry
                            </Button>
                          )}
                          
                          {weekGroup.status === 'Draft' && weekGroup.timesheets.length > 0 && (
                            <Checkbox
                              checked={weekGroup.timesheets.every(ts => selectedDrafts.has(ts.id))}
                              indeterminate={weekGroup.timesheets.some(ts => selectedDrafts.has(ts.id)) && !weekGroup.timesheets.every(ts => selectedDrafts.has(ts.id))}
                              onChange={(e) => {
                                weekGroup.timesheets.forEach(ts => {
                                  if (e.target.checked) {
                                    setSelectedDrafts(prev => new Set([...prev, ts.id]));
                                  } else {
                                    setSelectedDrafts(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(ts.id);
                                      return newSet;
                                    });
                                  }
                                });
                              }}
                              size="small"
                            />
                          )}
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedTimesheet(weekGroup);
                              setDetailDialog(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                          {weekGroup.canEdit && weekGroup.timesheets.length === 1 && (
                            <IconButton
                              size="small"
                              onClick={() => {
                                const timesheet = weekGroup.timesheets[0];
                                const editData = {
                                  ...timesheet,
                                  mondayHours: parseFloat(timesheet.mondayHours || 0),
                                  tuesdayHours: parseFloat(timesheet.tuesdayHours || 0),
                                  wednesdayHours: parseFloat(timesheet.wednesdayHours || 0),
                                  thursdayHours: parseFloat(timesheet.thursdayHours || 0),
                                  fridayHours: parseFloat(timesheet.fridayHours || 0),
                                  saturdayHours: parseFloat(timesheet.saturdayHours || 0),
                                  sundayHours: parseFloat(timesheet.sundayHours || 0)
                                };
                                setEditTimesheetData(editData);
                                setEditDialog(true);
                              }}
                              color="warning"
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                          {weekGroup.status === 'Draft' && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<SubmitIcon />}
                              onClick={() => {
                                const draftIds = weekGroup.timesheets
                                  .filter(ts => ts.status === 'Draft')
                                  .map(ts => ts.id);
                                if (draftIds.length === 1) {
                                  handleSubmitTimesheet(draftIds[0]);
                                } else if (draftIds.length > 1) {
                                  handleBulkSubmit(draftIds);
                                }
                              }}
                            >
                              Submit
                            </Button>
                          )}
                          {weekGroup.status === 'Rejected' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => {
                                setSelectedTimesheet(weekGroup.timesheets[0]); // For rejected, show first timesheet for resubmit
                                setSubmitDialog(true);
                              }}
                            >
                              Resubmit
                            </Button>
                          )}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          ) : (
            /* Desktop View */
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Tooltip title="Select all weeks with drafts">
                        <Checkbox
                          indeterminate={selectedDrafts.size > 0 && selectedDrafts.size < filteredTimesheets.filter(week => week.status === 'Draft').length}
                          checked={filteredTimesheets.filter(week => week.status === 'Draft').length > 0 && selectedDrafts.size === filteredTimesheets.filter(week => week.status === 'Draft').length}
                          onChange={handleSelectAllDrafts}
                          disabled={filteredTimesheets.filter(week => week.status === 'Draft').length === 0}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>Week Period</TableCell>
                    <TableCell>Project/Task</TableCell>
                    <TableCell align="center">Hours</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTimesheets.map((weekGroup) => {
                    const statusConfig = getStatusConfig(weekGroup.status);
                    const isCurrentWeek = currentWeek && 
                      weekGroup.weekStart.format('YYYY-MM-DD') === currentWeek.format('YYYY-MM-DD');
                    
                    return (
                      <TableRow 
                        key={weekGroup.weekStart.format('YYYY-MM-DD')} 
                        hover
                        sx={{
                          backgroundColor: isCurrentWeek ? 'action.selected' : 'inherit',
                          '&:hover': {
                            backgroundColor: isCurrentWeek ? 'action.hover' : 'action.hover'
                          }
                        }}
                      >
                        <TableCell padding="checkbox">
                          {weekGroup.status === 'Draft' && weekGroup.timesheets.length > 0 ? (
                            weekGroup.timesheets.length === 1 ? (
                              <Checkbox
                                checked={selectedDrafts.has(weekGroup.timesheets[0].id)}
                                onChange={() => handleDraftToggle(weekGroup.timesheets[0].id)}
                              />
                            ) : (
                              <Tooltip title={`${weekGroup.timesheets.length} draft entries`}>
                                <Checkbox
                                  indeterminate={weekGroup.timesheets.some(ts => selectedDrafts.has(ts.id)) && !weekGroup.timesheets.every(ts => selectedDrafts.has(ts.id))}
                                  checked={weekGroup.timesheets.every(ts => selectedDrafts.has(ts.id))}
                                  onChange={(e) => {
                                    weekGroup.timesheets.forEach(ts => {
                                      if (e.target.checked) {
                                        setSelectedDrafts(prev => new Set([...prev, ts.id]));
                                      } else {
                                        setSelectedDrafts(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(ts.id);
                                          return newSet;
                                        });
                                      }
                                    });
                                  }}
                                />
                              </Tooltip>
                            )
                          ) : (
                            <Box sx={{ width: 24, height: 24 }} />
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {weekGroup.weekStart.format('MMM DD')} - {weekGroup.weekEnd.format('MMM DD, YYYY')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {weekGroup.weekStart.format('MMMM YYYY')}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Box>
                            {weekGroup.timesheets.length === 1 ? (
                              // Single timesheet - show project/task normally
                              <>
                                <Typography variant="body2" fontWeight="medium">
                                  {weekGroup.timesheets[0].project?.name || 'No Project'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {weekGroup.timesheets[0].task?.name || 'No Task'}
                                </Typography>
                              </>
                            ) : (
                              // Multiple timesheets - show count and abbreviate
                              <>
                                <Typography variant="body2" fontWeight="medium">
                                  {weekGroup.timesheets.length} Task Entries
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {weekGroup.timesheets.map(ts => ts.project?.name || 'No Project').join(', ').substring(0, 40)}
                                  {weekGroup.timesheets.map(ts => ts.project?.name || 'No Project').join(', ').length > 40 ? '...' : ''}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="medium">
                            {(weekGroup.totalHours || 0).toFixed(1)}h
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Chip
                            label={weekGroup.status}
                            color={statusConfig.color}
                            size="small"
                            icon={statusConfig.icon}
                          />
                        </TableCell>
                        
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            {/* Go to Entry button */}
                            {onWeekChange && (
                              <Tooltip title="Go to Entry Tab">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => {
                                    onWeekChange(weekGroup.weekStart);
                                  }}
                                  sx={{ minWidth: 'auto', px: 1 }}
                                >
                                  Entry
                                </Button>
                              </Tooltip>
                            )}
                            
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(weekGroup)}
                                color="primary"
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            
                            {weekGroup.canEdit && weekGroup.timesheets.length === 1 && (
                              <Tooltip title="Timesheet Entry">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const timesheet = weekGroup.timesheets[0];
                                    const editData = {
                                      ...timesheet,
                                      mondayHours: parseFloat(timesheet.mondayHours || 0),
                                      tuesdayHours: parseFloat(timesheet.tuesdayHours || 0),
                                      wednesdayHours: parseFloat(timesheet.wednesdayHours || 0),
                                      thursdayHours: parseFloat(timesheet.thursdayHours || 0),
                                      fridayHours: parseFloat(timesheet.fridayHours || 0),
                                      saturdayHours: parseFloat(timesheet.saturdayHours || 0),
                                      sundayHours: parseFloat(timesheet.sundayHours || 0)
                                    };
                                    setEditTimesheetData(editData);
                                    setEditDialog(true);
                                  }}
                                  color="warning"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {weekGroup.canEdit && weekGroup.timesheets.length > 1 && (
                              <Tooltip title="Entry for Multiple Tasks">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleEntryMultipleTasks(weekGroup)}
                                  startIcon={<EditIcon />}
                                >
                                  Entry
                                </Button>
                              </Tooltip>
                            )}
                            
                            {weekGroup.status === 'Draft' && (
                              <Tooltip title="Submit Timesheet">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const draftIds = weekGroup.timesheets
                                      .filter(ts => ts.status === 'Draft')
                                      .map(ts => ts.id);
                                    if (draftIds.length === 1) {
                                      handleSubmitTimesheet(draftIds[0]);
                                    } else if (draftIds.length > 1) {
                                      handleBulkSubmit(draftIds);
                                    }
                                  }}
                                  color="success"
                                >
                                  <SubmitIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedTimesheet?.timesheets ? (
            `Timesheet Details - Week of ${selectedTimesheet.weekStart.format('MMM DD, YYYY')}`
          ) : (
            `Timesheet Details - Week of ${dayjs(selectedTimesheet?.weekStartDate).format('MMM DD, YYYY')}`
          )}
        </DialogTitle>
        <DialogContent>
          {selectedTimesheet && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {selectedTimesheet.timesheets ? (
                // Multiple timesheets view
                <>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Week Period</Typography>
                    <Typography variant="body2">
                      {selectedTimesheet.weekStart.format('MMM DD')} - {selectedTimesheet.weekStart.add(6, 'day').format('MMM DD, YYYY')}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Total Hours</Typography>
                    <Typography variant="body2">
                      {selectedTimesheet.totalHours.toFixed(1)} hours across {selectedTimesheet.timesheets.length} task entries
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Task Breakdown</Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
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
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 80 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedTimesheet.timesheets.map((timesheet, index) => (
                            <TableRow key={timesheet.id || index}>
                              <TableCell>{timesheet.project?.name || 'No Project'}</TableCell>
                              <TableCell>{timesheet.task?.name || 'No Task'}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet.mondayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet.tuesdayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet.wednesdayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet.thursdayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet.fridayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet.saturdayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center">{parseFloat(timesheet.sundayHours || 0).toFixed(1)}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                {parseFloat(timesheet.totalHoursWorked || 0).toFixed(1)}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={timesheet.status}
                                  color={getStatusConfig(timesheet.status).color}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Overall Status</Typography>
                    <Chip
                      icon={getStatusConfig(selectedTimesheet.status).icon}
                      label={getStatusConfig(selectedTimesheet.status).label}
                      color={getStatusConfig(selectedTimesheet.status).color}
                    />
                  </Box>
                </>
              ) : (
                // Single timesheet view (legacy)
                <>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Project & Task</Typography>
                    <Typography variant="body2">
                      {selectedTimesheet.project?.name || 'No Project'} - {selectedTimesheet.task?.name || 'No Task'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Hours Worked</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>{parseFloat(selectedTimesheet.totalHoursWorked || 0).toFixed(1)} hours total</Typography>
                    
                    {/* Daily breakdown for weekly timesheets */}
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>Daily Breakdown:</Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mt: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          Mon: {parseFloat(selectedTimesheet.mondayHours || 0).toFixed(1)}h
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          Tue: {parseFloat(selectedTimesheet.tuesdayHours || 0).toFixed(1)}h
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          Wed: {parseFloat(selectedTimesheet.wednesdayHours || 0).toFixed(1)}h
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          Thu: {parseFloat(selectedTimesheet.thursdayHours || 0).toFixed(1)}h
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          Fri: {parseFloat(selectedTimesheet.fridayHours || 0).toFixed(1)}h
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          Sat: {parseFloat(selectedTimesheet.saturdayHours || 0).toFixed(1)}h
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', gridColumn: 'span 2' }}>
                          Sun: {parseFloat(selectedTimesheet.sundayHours || 0).toFixed(1)}h
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Description</Typography>
                    <Typography variant="body2">{selectedTimesheet.description}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Status</Typography>
                    <Chip
                      icon={getStatusConfig(selectedTimesheet.status).icon}
                      label={getStatusConfig(selectedTimesheet.status).label}
                      color={getStatusConfig(selectedTimesheet.status).color}
                    />
                  </Box>

                  {selectedTimesheet.submittedAt && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Submitted At</Typography>
                      <Typography variant="body2">
                        {dayjs(selectedTimesheet.submittedAt).format('MMM DD, YYYY HH:mm')}
                      </Typography>
                    </Box>
                  )}

                  {selectedTimesheet.approvedAt && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Approved At</Typography>
                      <Typography variant="body2">
                        {dayjs(selectedTimesheet.approvedAt).format('MMM DD, YYYY HH:mm')}
                      </Typography>
                    </Box>
                  )}

                  {selectedTimesheet.rejectedAt && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Rejected At</Typography>
                      <Typography variant="body2">
                        {dayjs(selectedTimesheet.rejectedAt).format('MMM DD, YYYY HH:mm')}
                      </Typography>
                    </Box>
                  )}

                  {selectedTimesheet.approverComments && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Manager Comments</Typography>
                      <Typography variant="body2">{selectedTimesheet.approverComments}</Typography>
                    </Box>
                  )}
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Timesheet - Week of {editTimesheetData && dayjs(editTimesheetData.weekStartDate).format('MMM DD, YYYY')}
        </DialogTitle>
        <DialogContent>
          {editTimesheetData && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {editTimesheetData.project?.name} - {editTimesheetData.task?.name}
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, mt: 2 }}>
                <TextField
                  label="Monday"
                  type="number"
                  value={editTimesheetData.mondayHours || 0}
                  onChange={(e) => setEditTimesheetData(prev => ({
                    ...prev,
                    mondayHours: parseFloat(e.target.value) || 0
                  }))}
                  inputProps={{ min: 0, max: 24, step: 0.5 }}
                  size="small"
                />
                <TextField
                  label="Tuesday"
                  type="number"
                  value={editTimesheetData.tuesdayHours || 0}
                  onChange={(e) => setEditTimesheetData(prev => ({
                    ...prev,
                    tuesdayHours: parseFloat(e.target.value) || 0
                  }))}
                  inputProps={{ min: 0, max: 24, step: 0.5 }}
                  size="small"
                />
                <TextField
                  label="Wednesday"
                  type="number"
                  value={editTimesheetData.wednesdayHours || 0}
                  onChange={(e) => setEditTimesheetData(prev => ({
                    ...prev,
                    wednesdayHours: parseFloat(e.target.value) || 0
                  }))}
                  inputProps={{ min: 0, max: 24, step: 0.5 }}
                  size="small"
                />
                <TextField
                  label="Thursday"
                  type="number"
                  value={editTimesheetData.thursdayHours || 0}
                  onChange={(e) => setEditTimesheetData(prev => ({
                    ...prev,
                    thursdayHours: parseFloat(e.target.value) || 0
                  }))}
                  inputProps={{ min: 0, max: 24, step: 0.5 }}
                  size="small"
                />
                <TextField
                  label="Friday"
                  type="number"
                  value={editTimesheetData.fridayHours || 0}
                  onChange={(e) => setEditTimesheetData(prev => ({
                    ...prev,
                    fridayHours: parseFloat(e.target.value) || 0
                  }))}
                  inputProps={{ min: 0, max: 24, step: 0.5 }}
                  size="small"
                />
                <TextField
                  label="Saturday"
                  type="number"
                  value={editTimesheetData.saturdayHours || 0}
                  onChange={(e) => setEditTimesheetData(prev => ({
                    ...prev,
                    saturdayHours: parseFloat(e.target.value) || 0
                  }))}
                  inputProps={{ min: 0, max: 24, step: 0.5 }}
                  size="small"
                />
                <TextField
                  label="Sunday"
                  type="number"
                  value={editTimesheetData.sundayHours || 0}
                  onChange={(e) => setEditTimesheetData(prev => ({
                    ...prev,
                    sundayHours: parseFloat(e.target.value) || 0
                  }))}
                  inputProps={{ min: 0, max: 24, step: 0.5 }}
                  size="small"
                />
              </Box>
              
              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
                value={editTimesheetData.description || ''}
                onChange={(e) => setEditTimesheetData(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                sx={{ mt: 2 }}
              />
              
              <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2">
                  Total Hours: {(
                    parseFloat(editTimesheetData.mondayHours || 0) +
                    parseFloat(editTimesheetData.tuesdayHours || 0) +
                    parseFloat(editTimesheetData.wednesdayHours || 0) +
                    parseFloat(editTimesheetData.thursdayHours || 0) +
                    parseFloat(editTimesheetData.fridayHours || 0) +
                    parseFloat(editTimesheetData.saturdayHours || 0) +
                    parseFloat(editTimesheetData.sundayHours || 0)
                  ).toFixed(1)}h
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => handleUpdateTimesheet()} 
            variant="contained"
            color="primary"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resubmit Dialog */}
      <Dialog open={submitDialog} onClose={() => setSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resubmit Timesheet</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comments (Optional)"
            placeholder="Add any comments about your resubmission..."
            value={resubmitComments}
            onChange={(e) => setResubmitComments(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialog(false)}>Cancel</Button>
          <Button
            onClick={handleResubmitTimesheet}
            variant="contained"
            color="warning"
          >
            Resubmit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimesheetHistory;