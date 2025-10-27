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

// Lazy loaded components for better performance
const EmployeeList = lazy(() => import('./components/EmployeeList'));
const EmployeeForm = lazy(() => import('./components/EmployeeForm'));
const PayrollCalculate = lazy(() => import('./components/PayrollCalculate'));
const PayrollHistory = lazy(() => import('./components/PayrollHistory'));
const PayslipList = lazy(() => import('./components/PayslipList'));
const PayslipView = lazy(() => import('./components/PayslipView'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const DepartmentManagement = lazy(() => import('./components/DepartmentManagement'));
const SalaryStructureManagement = lazy(() => import('./components/SalaryStructureManagement'));
const LeaveSubmission = lazy(() => import('./components/LeaveSubmission'));
const LeaveApproval = lazy(() => import('./components/LeaveApproval'));
const LeaveBalancesList = lazy(() => import('./components/LeaveBalancesList'));
const AttendanceTracking = lazy(() => import('./components/AttendanceTracking'));
const AttendanceReports = lazy(() => import('./components/AttendanceReports'));
const ComplianceReports = lazy(() => import('./components/ComplianceReports'));

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
              
              {/* Employee Management */}
              <Route path="employees" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Employees..." />}>
                  <EmployeeList />
                </Suspense>
              } />
              <Route path="employees/new" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Employee Form..." />}>
                  <EmployeeForm />
                </Suspense>
              } />
              <Route path="employees/edit/:id" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Employee Form..." />}>
                  <EmployeeForm />
                </Suspense>
              } />
              
              {/* Payroll Management */}
              <Route path="payroll/calculate" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Payroll Calculator..." />}>
                  <PayrollCalculate />
                </Suspense>
              } />
              <Route path="payroll/history" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Payroll History..." />}>
                  <PayrollHistory />
                </Suspense>
              } />
              
              {/* Payslip Management */}
              <Route path="payslips" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Payslips..." />}>
                  <PayslipList />
                </Suspense>
              } />
              <Route path="payslips/:id" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Payslip..." />}>
                  <PayslipView />
                </Suspense>
              } />
              
              {/* Leave Management */}
              <Route path="leave-request" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Leave Submission..." />}>
                  <LeaveSubmission />
                </Suspense>
              } />
              <Route path="leave-approval" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Leave Approval..." />}>
                  <LeaveApproval />
                </Suspense>
              } />
              <Route path="leave-balances" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Leave Balances..." />}>
                  <LeaveBalancesList />
                </Suspense>
              } />
              
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
              
              {/* Attendance Management */}
              <Route path="attendance/tracking" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Attendance Tracking..." />}>
                  <AttendanceTracking />
                </Suspense>
              } />
              <Route path="attendance/reports" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Attendance Reports..." />}>
                  <AttendanceReports />
                </Suspense>
              } />
              
              {/* Admin Management */}
              <Route path="admin/users" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading User Management..." />}>
                  <UserManagement />
                </Suspense>
              } />
              <Route path="admin/departments" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Department Management..." />}>
                  <DepartmentManagement />
                </Suspense>
              } />
              <Route path="admin/salary-structures" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Salary Structures..." />}>
                  <SalaryStructureManagement />
                </Suspense>
              } />
              
              {/* Compliance & Reports */}
              <Route path="reports/compliance" element={
                <Suspense fallback={<EnhancedLoadingFallback text="Loading Compliance Reports..." />}>
                  <ComplianceReports />
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
