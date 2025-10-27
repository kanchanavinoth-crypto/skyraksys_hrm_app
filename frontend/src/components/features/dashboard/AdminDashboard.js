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
  Toolbar
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
      
      // ✅ CORRECT: Extract from nested structure
      const stats = response.data?.data?.stats || {};
      
      setStats({
        employees: stats.employees || { total: 0, active: 0, onLeave: 0, newHires: 0 },
        leaves: stats.leaves || { pending: 0, approved: 0, rejected: 0 },
        timesheets: stats.timesheets || { pending: 0, submitted: 0, approved: 0 },
        payroll: stats.payroll || { processed: 0, pending: 0, total: 0 }
      });
    } catch (error) {
      console.error('❌ Dashboard error:', error);
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
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.03)} 0%, ${alpha(theme.palette[color].light, 0.08)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': onClick ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
          opacity: 0,
          transition: 'opacity 0.3s ease'
        } : {},
        '&:hover': onClick ? { 
          transform: 'translateY(-8px)',
          boxShadow: `0 16px 32px -12px ${alpha(theme.palette[color].main, 0.35)}`,
          border: `1px solid ${alpha(theme.palette[color].main, 0.3)}`,
          '&::before': { opacity: 1 }
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              color="text.secondary" 
              variant="body2" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '1px',
                mb: 1
              }}
            >
              {title}
            </Typography>
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
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
          SKYRAKSYS HRM
        </Typography>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={18} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: theme.shadows[2]
            }
          }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Toolbar>

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
            background: theme.palette.primary.gradient,
            borderRadius: 1,
            display: 'block'
          }
        }}
      >
        Employee Overview
      </Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
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
            background: theme.palette.primary.gradient,
            borderRadius: 1,
            display: 'block'
          }
        }}
      >
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