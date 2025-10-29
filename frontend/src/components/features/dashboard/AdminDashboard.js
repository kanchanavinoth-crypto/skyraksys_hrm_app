import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  useTheme,
  alpha,
  Stack,
  CircularProgress,
  Container,
  Toolbar,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Chip,
  Divider,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  EventNote as LeaveIcon,
  Schedule as TimesheetIcon,
  AccountBalance as PayrollIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useLoading } from '../../../contexts/LoadingContext';
import { useNotification } from '../../../contexts/NotificationContext';
import EmployeeDashboard from './EmployeeDashboard';
import ManagerDashboard from './ManagerDashboard';
import { dashboardService } from '../../../services/dashboard.service';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isEmployee, isAdmin, isHR, isManager } = useAuth();
  const { showNotification } = useNotification();
  
  const { isLoading: isLoadingFn, setLoading } = useLoading();
  const isLoading = isLoadingFn('admin-dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState({
    employees: { total: 0, active: 0, onLeave: 0, newHires: 0 },
    leaves: { pending: 0, approved: 0, rejected: 0 },
    timesheets: { pending: 0, submitted: 0, approved: 0 },
    payroll: { processed: 0, pending: 0, total: 0 }
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getStats();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load dashboard data');
      }
      
      // ✅ CORRECT: Extract from nested structure
      const stats = response.data?.data?.stats || {};
      
      setStats({
        employees: stats.employees || { total: 0, active: 0, onLeave: 0, newHires: 0 },
        leaves: stats.leaves || { pending: 0, approved: 0, rejected: 0 },
        timesheets: stats.timesheets || { pending: 0, submitted: 0, approved: 0 },
        payroll: stats.payroll || { processed: 0, pending: 0, total: 0 }
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Dashboard error:', error);
      setError(error.message || 'Failed to load dashboard data');
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    if (!error) {
      showNotification('✅ Dashboard data refreshed successfully', 'success');
    }
  };

  useEffect(() => {
    if (isAdmin || isHR) {
      loadDashboardData();
    }
  }, [isAdmin, isHR]);

  // Return employee or manager dashboard if not admin/HR
  if (isEmployee && !isAdmin && !isHR) {
    return <EmployeeDashboard />;
  }

  if (isManager && !isAdmin && !isHR) {
    return <ManagerDashboard />;
  }

  const StatCard = ({ title, value, subtitle, icon, color = 'primary', onClick, badge, progress }) => (
    <Card 
      component={onClick ? "button" : "div"}
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.03)} 0%, ${alpha(theme.palette[color].light, 0.08)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'left',
        ...(onClick && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
            opacity: 0,
            transition: 'opacity 0.3s ease'
          },
          '&:hover': { 
            transform: 'translateY(-8px)',
            boxShadow: `0 16px 32px -12px ${alpha(theme.palette[color].main, 0.35)}`,
            border: `1px solid ${alpha(theme.palette[color].main, 0.3)}`,
            '&::before': { opacity: 1 }
          },
          '&:focus': {
            outline: `2px solid ${theme.palette[color].main}`,
            outlineOffset: 2
          }
        })
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View ${title} details` : title}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography 
                color="text.secondary" 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '1px'
                }}
              >
                {title}
              </Typography>
              {badge && (
                <Chip 
                  label={badge} 
                  size="small" 
                  color={color}
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                />
              )}
            </Stack>
            <Typography 
              variant="h3" 
              fontWeight="800" 
              sx={{ 
                mb: 0.5,
                lineHeight: 1,
                background: `linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].dark})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontWeight: 500, fontSize: '0.85rem' }}
              >
                {subtitle}
              </Typography>
            )}
            {progress !== undefined && (
              <Box sx={{ mt: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette[color].main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette[color].main
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {progress}% complete
                </Typography>
              </Box>
            )}
          </Box>
          <Box 
            sx={{ 
              width: 72,
              height: 72,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.15)}, ${alpha(theme.palette[color].light, 0.25)})`,
              color: `${color}.main`,
              transition: 'all 0.3s ease',
              flexShrink: 0,
              ...(onClick && {
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)'
                }
              })
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 40 } })}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: 400,
            gap: 2
          }}
        >
          <CircularProgress 
            size={48} 
            thickness={4}
            sx={{
              color: theme.palette.primary.main,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round'
              }
            }}
          />
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            Loading dashboard data...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              Welcome back, {user?.name || 'Admin'}! 👋
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lastUpdated 
                ? `Last updated: ${lastUpdated.toLocaleString()}`
                : 'Loading dashboard data...'
              }
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh dashboard data">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing || isLoading}
                color="primary"
                sx={{
                  width: 48,
                  height: 48,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={loadDashboardData}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Failed to Load Dashboard</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Quick Actions */}
      {!isLoading && !error && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
          <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
            ⚡ Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/employees/add')}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                Add Employee
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PayrollIcon />}
                onClick={() => navigate('/payroll')}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                Generate Payroll
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<LeaveIcon />}
                onClick={() => navigate('/leave-requests')}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                Manage Leaves
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TimesheetIcon />}
                onClick={() => navigate('/timesheet-approval')}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                Review Timesheets
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Alerts Section */}
      {!isLoading && !error && (stats.leaves.pending > 0 || stats.timesheets.submitted > 0) && (
        <Stack spacing={2} sx={{ mb: 4 }}>
          {stats.leaves.pending > 0 && (
            <Alert 
              severity="warning" 
              icon={<WarningIcon />}
              action={
                <Button color="inherit" size="small" onClick={() => navigate('/leave-requests')}>
                  Review
                </Button>
              }
            >
              <AlertTitle>Pending Leave Requests</AlertTitle>
              <strong>{stats.leaves.pending}</strong> leave requests are waiting for your approval
            </Alert>
          )}
          {stats.timesheets.submitted > 0 && (
            <Alert 
              severity="info" 
              icon={<InfoIcon />}
              action={
                <Button color="inherit" size="small" onClick={() => navigate('/timesheet-approval')}>
                  Review
                </Button>
              }
            >
              <AlertTitle>Submitted Timesheets</AlertTitle>
              <strong>{stats.timesheets.submitted}</strong> timesheets are awaiting approval
            </Alert>
          )}
        </Stack>
      )}

      {/* Employee Stats */}
      <Typography 
        variant="h5" 
        fontWeight="700" 
        sx={{ 
          mb: 3,
          color: 'text.primary',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          '&::before': {
            content: '""',
            width: 4,
            height: 24,
            background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            borderRadius: 1,
            display: 'block'
          }
        }}
      >
        👥 Employee Overview
      </Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={stats.employees.total}
            subtitle={`${stats.employees.active} active`}
            icon={<PeopleIcon />}
            color="primary"
            onClick={() => navigate('/employees')}
            badge="View All"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="On Leave Today"
            value={stats.employees.onLeave}
            subtitle="employees"
            icon={<LeaveIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Hires"
            value={stats.employees.newHires}
            subtitle="this month"
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Leaves"
            value={stats.leaves.pending}
            subtitle="awaiting approval"
            icon={<LeaveIcon />}
            color="error"
            onClick={() => navigate('/leave-requests')}
            badge={stats.leaves.pending > 0 ? "Action Needed" : undefined}
          />
        </Grid>
      </Grid>

      {/* Timesheet & Payroll Stats */}
      <Typography 
        variant="h5" 
        fontWeight="700" 
        sx={{ 
          mb: 3,
          color: 'text.primary',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          '&::before': {
            content: '""',
            width: 4,
            height: 24,
            background: `linear-gradient(180deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
            borderRadius: 1,
            display: 'block'
          }
        }}
      >
        📊 Operations Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Submitted Timesheets"
            value={stats.timesheets.submitted}
            subtitle="awaiting approval"
            icon={<TimesheetIcon />}
            color="info"
            onClick={() => navigate('/timesheet-approval')}
            badge={stats.timesheets.submitted > 0 ? "Review" : undefined}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Draft Timesheets"
            value={stats.timesheets.pending}
            subtitle="not submitted"
            icon={<TimesheetIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved Timesheets"
            value={stats.timesheets.approved}
            subtitle="this month"
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Payroll Processed"
            value={stats.payroll.processed}
            subtitle={`of ${stats.payroll.total} employees`}
            icon={<PayrollIcon />}
            color="primary"
            onClick={() => navigate('/payroll')}
            progress={stats.payroll.total > 0 ? Math.round((stats.payroll.processed / stats.payroll.total) * 100) : 0}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;