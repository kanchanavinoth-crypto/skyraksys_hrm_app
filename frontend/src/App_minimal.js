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

// New Timesheet and Leave Management Components
const TimesheetManager = lazy(() => import('./components/TimesheetManager'));
const EnhancedLeaveRequest = lazy(() => import('./components/EnhancedLeaveRequest'));

// Material-UI Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Enhanced Loading Component
const EnhancedLoadingFallback = ({ text = "Loading..." }) => (
  <Box 
    display="flex" 
    flexDirection="column"
    justifyContent="center" 
    alignItems="center" 
    minHeight="300px"
    gap={2}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="textSecondary">
      {text}
    </Typography>
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* New Enhanced Leave and Timesheet Routes */}
              <Route path="enhanced-leave-request" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Enhanced Leave Request..." />}>
                  <EnhancedLeaveRequest />
                </Suspense>
              } />
              <Route path="timesheet" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Timesheet Manager..." />}>
                  <TimesheetManager />
                </Suspense>
              } />
            </Route>
          </Routes>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
