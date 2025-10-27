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
  Container
} from '@mui/material';
import {
  People as PeopleIcon,
  EventNote as LeaveIcon,
  Schedule as TimesheetIcon,
  AccountBalance as PayrollIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useLoading } from '../../../contexts/LoadingContext';
import EmployeeDashboard from './EmployeeDashboard';
import ManagerDashboard from './ManagerDashboard';
import { dashboardService } from '../../../services/dashboard.service';

const Dashboard = () => {
  const theme = useTheme();
  const { user, isEmployee, isAdmin, isHR, isManager } = useAuth();
  
  const { isLoading: isLoadingFn, setLoading } = useLoading();
  const isLoading = isLoadingFn('admin-dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    employees: { total: 0, active: 0, onLeave: 0, newHires: 0 },
    leaves: { pending: 0, approved: 0, rejected: 0 },
    timesheets: { pending: 0, submitted: 0, approved: 0 },
    payroll: { processed: 0, pending: 0, total: 0 }
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats();
      if (response.success) {
        setStats(response.data.stats || {
          employees: { total: 0, active: 0, onLeave: 0, newHires: 0 },
          leaves: { pending: 0, approved: 0, rejected: 0 },
          timesheets: { pending: 0, submitted: 0, approved: 0 },
          payroll: { processed: 0, pending: 0, total: 0 }
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats({
        employees: { total: 0, active: 0, onLeave: 0, newHires: 0 },
        leaves: { pending: 0, approved: 0, rejected: 0 },
        timesheets: { pending: 0, submitted: 0, approved: 0 },
        payroll: { processed: 0, pending: 0, total: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
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

  const StatCard = ({ title, value, subtitle, icon, color = 'primary', onClick }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        '&:hover': onClick ? { 
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8]
        } : {}
      }}
      onClick={onClick}
    >
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="700" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Employee Stats */}
      <Typography variant="h5" fontWeight="600" sx={{ mb: 3 }}>
        Employee Overview
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={stats.employees.total}
            subtitle={`${stats.employees.active} active`}
            icon={<PeopleIcon sx={{ fontSize: 32 }} />}
            color="primary"
            onClick={() => window.location.href = '/employees'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="On Leave Today"
            value={stats.employees.onLeave}
            subtitle="employees"
            icon={<LeaveIcon sx={{ fontSize: 32 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Hires"
            value={stats.employees.newHires}
            subtitle="this month"
            icon={<TrendingUpIcon sx={{ fontSize: 32 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Leaves"
            value={stats.leaves.pending}
            subtitle="awaiting approval"
            icon={<LeaveIcon sx={{ fontSize: 32 }} />}
            color="error"
            onClick={() => window.location.href = '/leave-requests'}
          />
        </Grid>
      </Grid>

      {/* Timesheet & Payroll Stats */}
      <Typography variant="h5" fontWeight="600" sx={{ mb: 3 }}>
        Operations Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Submitted Timesheets"
            value={stats.timesheets.submitted}
            subtitle="awaiting approval"
            icon={<TimesheetIcon sx={{ fontSize: 32 }} />}
            color="info"
            onClick={() => window.location.href = '/timesheet-approval'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Draft Timesheets"
            value={stats.timesheets.pending}
            subtitle="not submitted"
            icon={<TimesheetIcon sx={{ fontSize: 32 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved Timesheets"
            value={stats.timesheets.approved}
            subtitle="this month"
            icon={<TimesheetIcon sx={{ fontSize: 32 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Payroll Processed"
            value={stats.payroll.processed}
            subtitle={`of ${stats.payroll.total} employees`}
            icon={<PayrollIcon sx={{ fontSize: 32 }} />}
            color="primary"
            onClick={() => window.location.href = '/payroll'}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;