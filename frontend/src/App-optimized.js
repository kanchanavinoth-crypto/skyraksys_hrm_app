import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import { SnackbarProvider } from 'notistack';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Core Components (loaded immediately)
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded Components for Performance Optimization
const AdvancedEmployeesList = lazy(() => 
  import('./components/AdvancedEmployeesList').catch(() => 
    import('./components/employee.component') // Fallback to legacy component
  )
);

const ValidatedEmployeeForm = lazy(() => 
  import('./components/ValidatedEmployeeForm')
);

const EnhancedEmployeeEdit = lazy(() => 
  import('./components/EnhancedEmployeeEdit')
);

const ModernLeaveManagement = lazy(() => 
  import('./components/ModernLeaveManagement')
);

const ModernTimesheetManagement = lazy(() => 
  import('./components/ModernTimesheetManagement')
);

const ModernPayrollManagement = lazy(() => 
  import('./components/ModernPayrollManagement')
);

const Settings = lazy(() => 
  import('./components/Settings')
);

// Modern Form Components (lazy loaded)
const ModernTimesheetSubmission = lazy(() => 
  import('./components/ModernTimesheetSubmission')
);

const ModernLeaveSubmission = lazy(() => 
  import('./components/ModernLeaveSubmission')
);

const ModernPayslipGeneration = lazy(() => 
  import('./components/ModernPayslipGeneration')
);

// Employee-specific Components (lazy loaded)
const EmployeeDashboard = lazy(() => 
  import('./components/EmployeeDashboard')
);

const EmployeeLeaveRequests = lazy(() => 
  import('./components/EmployeeLeaveRequests')
);

const EmployeePayslips = lazy(() => 
  import('./components/EmployeePayslips')
);

const EmployeeRecords = lazy(() => 
  import('./components/EmployeeRecords')
);

// Legacy Components (lazy loaded for backward compatibility)
const LeaveRequestsList = lazy(() => 
  import('./components/leave-requests-list.component')
);

const LeaveBalancesList = lazy(() => 
  import('./components/leave-balances-list.component')
);

// Enhanced Loading Component
const EnhancedLoadingFallback = ({ text = "Loading..." }) => (
  <Box 
    display="flex" 
    flexDirection="column"
    justifyContent="center" 
    alignItems="center" 
    minHeight="400px"
    sx={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      borderRadius: 2,
      m: 2,
      p: 4
    }}
  >
    <CircularProgress 
      size={50} 
      thickness={4}
      sx={{ 
        color: 'primary.main',
        mb: 2,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
      }} 
    />
    <Typography 
      variant="h6" 
      color="text.secondary"
      sx={{ 
        fontWeight: 500,
        textAlign: 'center',
        animation: 'pulse 2s infinite'
      }}
    >
      {text}
    </Typography>
    <Typography 
      variant="body2" 
      color="text.disabled"
      sx={{ mt: 1, textAlign: 'center' }}
    >
      Optimizing your experience...
    </Typography>
  </Box>
);

// Create optimized theme with performance considerations
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      dark: '#1565c0',
      light: '#42a5f5',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    }
  },
  custom: {
    drawer: {
      background: 'linear-gradient(180deg, #1976d2 0%, #1565c0 100%)',
      color: 'rgba(255,255,255,0.9)',
      hoverBg: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
      activeBg: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
      activeBorder: '1px solid rgba(255,255,255,0.2)',
      iconColor: 'rgba(255,255,255,0.7)',
      iconColorActive: '#ffffff',
    }
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h6: {
      fontWeight: 'bold',
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
          // Optimize rendering performance
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          // Optimize button interactions
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          // Optimize list rendering
          willChange: 'transform',
        },
      },
    },
  },
});

// Route-based code splitting configuration
const routeConfigs = {
  employees: {
    component: AdvancedEmployeesList,
    preload: true, // Preload this commonly used component
    loadingText: "Loading Employee Management..."
  },
  'add-employee': {
    component: ValidatedEmployeeForm,
    loadingText: "Loading Employee Form..."
  },
  'leave-management': {
    component: ModernLeaveManagement,
    loadingText: "Loading Leave Management..."
  },
  'timesheet-management': {
    component: ModernTimesheetManagement,
    loadingText: "Loading Timesheet Management..."
  },
  'payroll-management': {
    component: ModernPayrollManagement,
    loadingText: "Loading Payroll Management..."
  }
};

function App() {
  // Preload critical components after initial render
  React.useEffect(() => {
    const preloadComponents = async () => {
      try {
        // Preload the most commonly accessed components
        await Promise.all([
          import('./components/AdvancedEmployeesList'),
          import('./components/Dashboard')
        ]);
        console.log('🚀 Critical components preloaded');
      } catch (error) {
        console.warn('⚠️ Component preloading failed:', error);
      }
    };

    // Preload after a short delay to not block initial render
    const timer = setTimeout(preloadComponents, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        dense
        preventDuplicate
      >
        <AuthProvider>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes with Lazy Loading */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* Employee Management - Lazy Loaded */}
                <Route path="employees" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Employee Management..." />}>
                    <AdvancedEmployeesList />
                  </Suspense>
                } />
                
                <Route path="add-employee" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Employee Form..." />}>
                    <ValidatedEmployeeForm />
                  </Suspense>
                } />
                
                <Route path="employees/:id" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Employee Editor..." />}>
                    <EnhancedEmployeeEdit />
                  </Suspense>
                } />
              
                {/* Leave Management - Lazy Loaded */}
                <Route path="leave-management" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Leave Management..." />}>
                    <ModernLeaveManagement />
                  </Suspense>
                } />
                
                <Route path="leave-requests" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Leave Requests..." />}>
                    <EmployeeLeaveRequests />
                  </Suspense>
                } />
                
                <Route path="add-leave-request" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Leave Submission..." />}>
                    <ModernLeaveSubmission />
                  </Suspense>
                } />
                
                <Route path="leave-balances" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Leave Balances..." />}>
                    <LeaveBalancesList />
                  </Suspense>
                } />
                
                {/* Timesheet Management - Lazy Loaded */}
                <Route path="timesheet-management" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Timesheet Management..." />}>
                    <ModernTimesheetManagement />
                  </Suspense>
                } />
                
                <Route path="add-timesheet" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Timesheet Form..." />}>
                    <ModernTimesheetSubmission />
                  </Suspense>
                } />
                
                {/* Payroll Management - Lazy Loaded */}
                <Route path="payroll-management" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Payroll Management..." />}>
                    <ModernPayrollManagement />
                  </Suspense>
                } />
                
                <Route path="payslips" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Payslips..." />}>
                    <EmployeePayslips />
                  </Suspense>
                } />
                
                <Route path="generate-payslips" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Payslip Generator..." />}>
                    <ModernPayslipGeneration />
                  </Suspense>
                } />
                
                {/* Employee-specific Routes - Lazy Loaded */}
                <Route path="employee-payslips" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Your Payslips..." />}>
                    <EmployeePayslips />
                  </Suspense>
                } />
                
                <Route path="employee-records" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Your Records..." />}>
                    <EmployeeRecords />
                  </Suspense>
                } />

                {/* Settings - Lazy Loaded */}
                <Route path="settings" element={
                  <Suspense fallback={<EnhancedLoadingFallback text="Loading Settings..." />}>
                    <Settings />
                  </Suspense>
                } />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Box>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
