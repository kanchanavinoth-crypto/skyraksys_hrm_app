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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Skeleton,
  Avatar,
  Stack,
  Divider,
  useTheme,
  Fade,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  History as HistoryIcon,
  ArrowBack as BackIcon,
  CalendarMonth as CalendarIcon,
  Schedule as TimesheetIcon,
  EventNote as LeaveIcon,
  TrendingUp as StatsIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { timesheetService } from '../../../services/timesheet.service';
import LeaveService from '../../../services/LeaveService';

const EmployeeRecords = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [timesheetHistory, setTimesheetHistory] = useState([]);
  const [weeklyTimesheetData, setWeeklyTimesheetData] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [yearFilter, setYearFilter] = useState('2025');
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'list'

  useEffect(() => {
    loadEmployeeRecords();
  }, []);

  const loadEmployeeRecords = async () => {
    try {
      setLoading(true);
      
      // Load real timesheet data from API
      try {
        // Get timesheet history using the history endpoint
        const historyResponse = await timesheetService.getHistory();
        
        if (historyResponse && historyResponse.data) {
          const timesheets = historyResponse.data;
          
          // Group timesheets by week for display
          const weeklyGroups = {};
          
          timesheets.forEach(timesheet => {
            const workDate = new Date(timesheet.workDate);
            const year = workDate.getFullYear();
            const weekNumber = getWeekNumber(workDate);
            const weekKey = `${year}-W${weekNumber}`;
            
            if (!weeklyGroups[weekKey]) {
              // Calculate week start and end dates
              const firstDayOfYear = new Date(year, 0, 1);
              const daysToAdd = (weekNumber - 1) * 7;
              const weekStart = new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
              
              // Adjust to start of week (Monday)
              const dayOfWeek = weekStart.getDay();
              const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              weekStart.setDate(weekStart.getDate() - daysFromMonday);
              
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekEnd.getDate() + 6);
              
              weeklyGroups[weekKey] = {
                id: weekKey,
                week: `Week ${weekNumber} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${year})`,
                year: year,
                weekNumber: weekNumber,
                timesheets: [],
                totalHours: 0,
                regularHours: 0,
                overtimeHours: 0,
                status: 'draft',
                submittedDate: null
              };
            }
            
            weeklyGroups[weekKey].timesheets.push(timesheet);
          });
          
          // Process each week group to calculate totals and status
          const weeklyHistory = Object.values(weeklyGroups).map(week => {
            const totalHours = week.timesheets.reduce((sum, ts) => sum + (ts.hoursWorked || 0), 0);
            const regularHours = Math.min(totalHours, 40);
            const overtimeHours = Math.max(totalHours - 40, 0);
            
            // Determine week status
            const submittedTimesheets = week.timesheets.filter(ts => ts.status === 'Submitted' || ts.status === 'Approved' || ts.status === 'Rejected');
            const draftTimesheets = week.timesheets.filter(ts => ts.status === 'Draft');
            
            let weekStatus = 'draft';
            let submittedDate = null;
            
            if (submittedTimesheets.length > 0) {
              if (submittedTimesheets.every(ts => ts.status === 'Approved')) {
                weekStatus = 'approved';
              } else if (submittedTimesheets.some(ts => ts.status === 'Rejected')) {
                weekStatus = 'rejected';
              } else {
                weekStatus = 'submitted';
              }
              
              // Get the latest submitted date
              const submittedDates = submittedTimesheets
                .map(ts => ts.submittedAt || ts.updatedAt)
                .filter(date => date)
                .sort((a, b) => new Date(b) - new Date(a));
              
              if (submittedDates.length > 0) {
                submittedDate = new Date(submittedDates[0]).toLocaleDateString('en-US');
              }
            }
            
            return {
              ...week,
              totalHours,
              regularHours,
              overtimeHours,
              status: weekStatus,
              submittedDate: submittedDate || 'Not submitted',
              timesheetCount: week.timesheets.length,
              draftCount: draftTimesheets.length,
              submittedCount: submittedTimesheets.length
            };
          });
          
          // Sort by year and week descending (most recent first)
          weeklyHistory.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.weekNumber - a.weekNumber;
          });
          
          setTimesheetHistory(weeklyHistory);
        }
        
      } catch (timesheetError) {
        console.error('Error loading timesheet data:', timesheetError);
        // Set empty array on error
        setTimesheetHistory([]);
      }

      // Load leave history
      try {
        const leaveResponse = await LeaveService.getAll();
        if (leaveResponse?.data) {
          const leaves = Array.isArray(leaveResponse.data) ? leaveResponse.data : 
                        (leaveResponse.data.data ? leaveResponse.data.data : []);
          
          // Sort by applied date descending
          const sortedLeaves = leaves.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setLeaveHistory(sortedLeaves);
        }
      } catch (leaveError) {
        console.error('Error loading leave data:', leaveError);
        // Set empty array on error
        setLeaveHistory([]);
      }

      // Load attendance history
      try {
        // For now, use empty array - implement attendance API later
        setAttendanceHistory([]);
      } catch (attendanceError) {
        console.error('Error loading attendance data:', attendanceError);
        setAttendanceHistory([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading employee records:', error);
      setLoading(false);
    }
  };

  // Helper function to get week number (ISO week)
  const getWeekNumber = (date) => {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
    // January 4 is always in week 1
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count weeks from there
    return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <ApprovedIcon color="success" />;
      case 'rejected': return <RejectedIcon color="error" />;
      case 'pending': return <PendingIcon color="warning" />;
      default: return <PendingIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const LeaveHistoryTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Leave Request History
      </Typography>
      
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Leave Type</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Applied Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Comments</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 6 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton height={40} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                leaveHistory.map((leave) => (
                  <TableRow key={leave.id} hover>
                    <TableCell>
                      <Chip
                        label={leave.type}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {leave.days} days
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(leave.appliedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(leave.status)}
                        <Chip
                          label={leave.status.toUpperCase()}
                          color={getStatusColor(leave.status)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {leave.approverComments}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );

  const TimesheetHistoryTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Timesheet Submission History
      </Typography>
      
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Week Period</TableCell>
                <TableCell align="right">Regular Hours</TableCell>
                <TableCell align="right">Overtime Hours</TableCell>
                <TableCell align="right">Total Hours</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 6 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton height={40} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                timesheetHistory.map((timesheet) => (
                  <TableRow key={timesheet.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {timesheet.week}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {timesheet.regularHours}h
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={timesheet.overtimeHours > 0 ? 'warning.main' : 'text.secondary'}>
                        {timesheet.overtimeHours}h
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {timesheet.totalHours}h
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(timesheet.status)}
                        <Chip
                          label={timesheet.status.toUpperCase()}
                          color={getStatusColor(timesheet.status)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {timesheet.submittedDate}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );

  const AttendanceHistoryTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Monthly Attendance Summary
      </Typography>
      
      <Grid container spacing={3}>
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Skeleton height={100} />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          attendanceHistory.map((attendance, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarIcon sx={{ color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {attendance.month}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {attendance.daysWorked}/{attendance.totalDays} days
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {attendance.percentage.toFixed(1)}%
                    </Typography>
                    <Chip
                      label={attendance.percentage >= 95 ? 'Excellent' : attendance.percentage >= 90 ? 'Good' : 'Average'}
                      color={attendance.percentage >= 95 ? 'success' : attendance.percentage >= 90 ? 'primary' : 'warning'}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <BackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                My Records
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                View your historical attendance, leave, and timesheet data
              </Typography>
            </Box>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <LeaveIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {leaveHistory.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Leave Requests
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TimesheetIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {timesheetHistory.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Timesheets Submitted
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <StatsIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {attendanceHistory.length > 0 ? (attendanceHistory.reduce((sum, a) => sum + a.percentage, 0) / attendanceHistory.length).toFixed(1) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Attendance
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Paper sx={{ borderRadius: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
            >
              <Tab 
                icon={<LeaveIcon />} 
                label="Leave History" 
                iconPosition="start"
              />
              <Tab 
                icon={<TimesheetIcon />} 
                label="Timesheet History" 
                iconPosition="start"
              />
              <Tab 
                icon={<CalendarIcon />} 
                label="Attendance Summary" 
                iconPosition="start"
              />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && <LeaveHistoryTab />}
              {activeTab === 1 && <TimesheetHistoryTab />}
              {activeTab === 2 && <AttendanceHistoryTab />}
            </Box>
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default EmployeeRecords;
