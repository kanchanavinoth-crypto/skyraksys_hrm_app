import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  useTheme,
  alpha,
  Container,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  EventNote as LeaveIcon,
  Schedule as TimesheetIcon,
  Add as AddIcon,
  TrendingUp as StatsIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Schedule as ClockIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useLoading } from '../../../contexts/LoadingContext';
import { dashboardService } from '../../../services/dashboard.service';

const EmployeeDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLoading: isLoadingFn, setLoading } = useLoading();
  const isLoading = isLoadingFn('employee-dashboard');
  const [employeeStats, setEmployeeStats] = useState({
    leaveBalance: {},
    pendingRequests: { leaves: 0, timesheets: 0 },
    recentActivity: [],
    upcomingLeaves: [],
    currentMonth: { hoursWorked: 0, expectedHours: 0, daysWorked: 0, efficiency: 0 }
  });

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getEmployeeStats();
      
      if (response.success) {
        setEmployeeStats(response.data);
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      // Set fallback empty data on error
      setEmployeeStats({
        leaveBalance: {},
        pendingRequests: { leaves: 0, timesheets: 0 },
        recentActivity: [],
        upcomingLeaves: [],
        currentMonth: { hoursWorked: 0, expectedHours: 0, daysWorked: 0, efficiency: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const QuickActionCard = ({ icon, title, description, onClick, color = 'primary' }) => (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': { 
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8]
        },
        height: '100%',
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`
      }}
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Box sx={{ mb: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" fontWeight="600" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  const StatCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%', border: `1px solid ${alpha(theme.palette[color].main, 0.2)}` }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="700" color={`${color}.main`}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.7 }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="700" gutterBottom>
          Welcome, {user?.firstName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Requests"
            value={employeeStats.pendingRequests.leaves + employeeStats.pendingRequests.timesheets}
            subtitle={`${employeeStats.pendingRequests.leaves} leaves • ${employeeStats.pendingRequests.timesheets} timesheets`}
            icon={<PendingIcon sx={{ fontSize: 32 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Hours This Month"
            value={employeeStats.currentMonth.hoursWorked || 0}
            subtitle={`${employeeStats.currentMonth.efficiency || 0}% efficiency`}
            icon={<ClockIcon sx={{ fontSize: 32 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Annual Leave"
            value={employeeStats.leaveBalance.annual?.remaining || 0}
            subtitle={`of ${employeeStats.leaveBalance.annual?.total || 0} days`}
            icon={<CalendarIcon sx={{ fontSize: 32 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Leaves"
            value={employeeStats.upcomingLeaves.length}
            subtitle="approved requests"
            icon={<LeaveIcon sx={{ fontSize: 32 }} />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" fontWeight="600" sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            icon={<TimesheetIcon sx={{ fontSize: 32, color: 'primary.main' }} />}
            title="Submit Timesheet"
            description="Log your daily hours"
            onClick={() => navigate('/add-timesheet')}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            icon={<LeaveIcon sx={{ fontSize: 32, color: 'warning.main' }} />}
            title="Request Leave"
            description="Apply for time off"
            onClick={() => navigate('/add-leave-request')}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            icon={<PersonIcon sx={{ fontSize: 32, color: 'info.main' }} />}
            title="My Records"
            description="View your history"
            onClick={() => navigate('/employee-records')}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            icon={<StatsIcon sx={{ fontSize: 32, color: 'success.main' }} />}
            title="My Profile"
            description="Personal details"
            onClick={() => navigate('/employee-profile')}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Additional Quick Actions Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            icon={<StatsIcon sx={{ fontSize: 32, color: 'secondary.main' }} />}
            title="Payslips"
            description="View & download"
            onClick={() => navigate('/employee-payslips')}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            icon={<LeaveIcon sx={{ fontSize: 32, color: 'primary.main' }} />}
            title="Leave Balance"
            description="Check availability"
            onClick={() => navigate('/leave-requests')}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            icon={<TimesheetIcon sx={{ fontSize: 32, color: 'warning.main' }} />}
            title="Timesheet History"
            description="Past submissions"
            onClick={() => navigate('/employee-records')}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            icon={<PersonIcon sx={{ fontSize: 32, color: 'info.main' }} />}
            title="Help & Support"
            description="Get assistance"
            onClick={() => navigate('/help')}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      {employeeStats.recentActivity.length > 0 && (
        <>
          <Typography variant="h5" fontWeight="600" sx={{ mb: 3 }}>
            Recent Activity
          </Typography>
          <Card>
            <List>
              {employeeStats.recentActivity.slice(0, 5).map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {activity.type === 'leave' ? <LeaveIcon /> : <TimesheetIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.action}
                      secondary={new Date(activity.date).toLocaleDateString()}
                    />
                    <Chip 
                      label={activity.status} 
                      size="small" 
                      color={activity.status === 'approved' ? 'success' : 'default'}
                    />
                  </ListItem>
                  {index < employeeStats.recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Card>
        </>
      )}
    </Container>
  );
};

export default EmployeeDashboard;