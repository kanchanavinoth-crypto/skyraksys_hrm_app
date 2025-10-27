import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { SnackbarProvider } from 'notistack';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Create theme
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
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <AuthProvider>
          <Router>
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  
                  {/* Employee Management - Placeholder routes */}
                  <Route path="employees" element={<Dashboard />} />
                  <Route path="employees/new" element={<Dashboard />} />
                  <Route path="employees/:id" element={<Dashboard />} />
                  <Route path="employees/:id/edit" element={<Dashboard />} />
                  
                  {/* Leave Management - Placeholder routes */}
                  <Route path="leaves" element={<Dashboard />} />
                  <Route path="leaves/new" element={<Dashboard />} />
                  <Route path="leaves/balance" element={<Dashboard />} />
                  
                  {/* Timesheet Management - Placeholder routes */}
                  <Route path="timesheets" element={<Dashboard />} />
                  <Route path="timesheets/new" element={<Dashboard />} />
                  
                  {/* Payroll Management - Placeholder routes */}
                  <Route path="payroll" element={<Dashboard />} />
                  <Route path="payroll/new" element={<Dashboard />} />
                  <Route path="payroll/dashboard" element={<Dashboard />} />
                  
                  {/* User Management - Placeholder routes */}
                  <Route path="profile" element={<Dashboard />} />
                  <Route path="settings" element={<Dashboard />} />
                </Route>
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Box>
          </Router>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
