import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import modernTheme from './theme/modernTheme';
import { SnackbarProvider } from 'notistack';
import { getDefaultDashboard } from './utils/roleConfig';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Error Boundary (enhanced)
import SmartErrorBoundary from './components/common/SmartErrorBoundary';

// Core Components (loaded immediately)
import Login from './components/common/Login';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardRedirect from './components/common/DashboardRedirect';

// Dashboard Components
const AdminDashboard = lazy(() => import('./components/features/dashboard/AdminDashboard'));
const EmployeeDashboard = lazy(() => import('./components/features/dashboard/EmployeeDashboard'));
const ManagerDashboard = lazy(() => import('./components/manager/ManagerDashboard'));
const PerformanceDashboard = lazy(() => import('./components/features/dashboard/PerformanceDashboard'));

// Employee Management Components
const EmployeeList = lazy(() => import('./components/features/employees/EmployeeList'));
const EmployeeForm = lazy(() => import('./components/features/employees/EmployeeForm'));
const EmployeeProfile = lazy(() => import('./components/features/employees/EmployeeProfileModern'));
const EmployeeEdit = lazy(() => import('./components/features/employees/EmployeeEdit'));
const EmployeeRecords = lazy(() => import('./components/features/employees/EmployeeRecords'));
const MyProfile = lazy(() => import('./components/features/employees/MyProfile'));
const UserAccountManagementPage = lazy(() => import('./components/features/employees/UserAccountManagementPage'));

// Debug Components
const SimpleValidationDiagnostic = React.lazy(() => import('./components/debug/SimpleValidationDiagnostic'));

// Leave Management Components
const LeaveManagement = lazy(() => import('./components/features/leave/LeaveManagement'));
const EmployeeLeaveRequests = lazy(() => import('./components/features/leave/EmployeeLeaveRequests'));
const LeaveBalance = lazy(() => import('./components/features/leave/LeaveBalanceModern'));
const AddLeaveRequest = lazy(() => import('./components/features/leave/AddLeaveRequestModern'));

// Timesheet Components (Consolidated)
const ModernWeeklyTimesheet = lazy(() => import('./components/features/timesheet/ModernWeeklyTimesheet'));
const TimesheetApproval = lazy(() => import('./components/features/timesheet/TimesheetApproval'));
const TimesheetHistory = lazy(() => import('./components/features/timesheet/TimesheetHistory'));

// Payroll Components
const PayrollManagement = lazy(() => import('./components/features/payroll/ModernPayrollManagement'));
const PayslipTemplateManager = lazy(() => import('./components/features/payroll/PayslipTemplateManager'));
const EmployeePayslips = lazy(() => import('./components/features/payroll/EmployeePayslips'));

// Admin Components
const UserManagement = lazy(() => import('./components/features/admin/UserManagementEnhanced'));
const PositionManagement = lazy(() => import('./components/features/admin/PositionManagement'));
const SystemSettings = lazy(() => import('./components/features/admin/SystemSettings'));
const ProjectTaskConfiguration = lazy(() => import('./components/features/admin/ProjectTaskConfiguration'));
const ReportsModule = lazy(() => import('./components/features/admin/ReportsModule'));
const PayslipTemplateConfiguration = lazy(() => import('./components/admin/PayslipTemplateConfiguration'));
const EnhancedPayslipTemplateConfiguration = lazy(() => import('./components/admin/EnhancedPayslipTemplateConfiguration'));
const PayslipManagement = lazy(() => import('./components/admin/PayslipManagement'));
const ConsolidatedReports = lazy(() => import('./components/admin/ConsolidatedReports'));
const AdminConfigPage = lazy(() => import('./components/features/admin/AdminConfigPage'));
// Enhanced Admin Debug Panel with Environment Selector, Database Tools, and Log Viewer
const AdminDebugPanel = lazy(() => import('./components/features/admin/AdminDebugPanel'));

// Material-UI Theme
// Modern theme imported from theme/modernTheme.js
// Comprehensive design system with purple gradients, Inter font, and modern components

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

EnhancedLoadingFallback.propTypes = {
  text: PropTypes.string,
};

function App() {
  return (
    <SmartErrorBoundary level="application">
      <ThemeProvider theme={modernTheme}>
        <CssBaseline />
        <LoadingProvider>
          <NotificationProvider>
            <SnackbarProvider 
              maxSnack={3}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <AuthProvider>
                <SmartErrorBoundary level="routing">
                  <Routes>
                    {/* Admin Debug Panel - Enhanced version with Environment Selector, Database Tools, and Log Viewer */}
                    <Route path="/admin/debug" element={
                      <Suspense fallback={<EnhancedLoadingFallback text="Loading Debug Panel..." />}>
                        <AdminDebugPanel />
                      </Suspense>
                    } />
                    
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<DashboardRedirect />} />
                      <Route path="dashboard" element={<DashboardRedirect />} />
                      
                      {/* Role-Specific Dashboard Routes with Error Boundaries */}
                      <Route path="admin-dashboard" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Admin Dashboard..." />}>
                            <AdminDashboard />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      
                      <Route path="employee-dashboard" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Employee Dashboard..." />}>
                            <EmployeeDashboard />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      
                      <Route path="manager-dashboard" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Manager Dashboard..." />}>
                            <ManagerDashboard />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      
                      <Route path="performance-dashboard" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Performance Dashboard..." />}>
                            <PerformanceDashboard />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      
                      {/* Employee Management Routes with Error Boundaries */}
                      <Route path="employees" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Employees..." />}>
                            <EmployeeList />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="employees/add" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Add Employee..." />}>
                            <EmployeeForm />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="employees/:id" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Employee Profile..." />}>
                            <EmployeeProfile />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="employees/:id/edit" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Employee Edit..." />}>
                            <EmployeeEdit />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="employees/:id/user-account" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading User Account Management..." />}>
                            <UserAccountManagementPage />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="my-profile" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading My Profile..." />}>
                            <MyProfile />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="employee-records" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Employee Records..." />}>
                            <EmployeeRecords />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="add-employee" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Add Employee..." />}>
                            <EmployeeForm />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      
                      {/* Leave Management Routes with Error Boundaries */}
                      <Route path="leave-management" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Leave Management..." />}>
                            <LeaveManagement />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="leave-requests" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Leave Requests..." />}>
                            <EmployeeLeaveRequests />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="add-leave-request" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Leave Request Form..." />}>
                            <AddLeaveRequest />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="admin/leave-balances" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Leave Balance Admin..." />}>
                            <LeaveBalance />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      
                      {/* Timesheet Management Routes (Consolidated) */}
                      <Route path="timesheets" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Timesheets..." />}>
                            <ModernWeeklyTimesheet />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="timesheets/week/:weekStart" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Weekly Timesheet..." />}>
                            <ModernWeeklyTimesheet />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="timesheets/approvals" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Timesheet Approvals..." />}>
                            <TimesheetApproval />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="timesheets/history" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Timesheet History..." />}>
                            <TimesheetHistory />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      
                      {/* Legacy timesheet routes - redirect to consolidated component */}
                      <Route path="timesheet-management" element={<Navigate to="/timesheets" replace />} />
                      <Route path="add-timesheet" element={<Navigate to="/timesheets" replace />} />
                      <Route path="weekly-timesheet" element={<Navigate to="/timesheets" replace />} />
                      <Route path="timesheet-history" element={<Navigate to="/timesheets/history" replace />} />
                      <Route path="timesheet-manager" element={<Navigate to="/timesheets" replace />} />
                      {/* Payroll Management Routes with Error Boundaries */}
                      <Route path="payroll-management" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Payroll Management..." />}>
                            <PayrollManagement />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="employee-payslips" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Employee Payslips..." />}>
                            <EmployeePayslips />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      
                      {/* Admin Routes with Error Boundaries */}
                      <Route path="user-management" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading User Management..." />}>
                            <UserManagement />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="position-management" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Position Management..." />}>
                            <PositionManagement />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="project-task-config" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Project Configuration..." />}>
                            <ProjectTaskConfiguration />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="reports" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Reports..." />}>
                            <ReportsModule />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="settings" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Settings..." />}>
                            <SystemSettings />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      <Route path="admin/config" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Admin Config..." />}>
                            <AdminConfigPage />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      
                      {/* New Admin Routes with Error Boundaries */}
                      <Route path="admin/payslip-templates" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Enhanced Payslip Template Configuration..." />}>
                            <EnhancedPayslipTemplateConfiguration />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      {/* Old template configuration (kept as fallback) */}
                      <Route path="admin/payslip-templates-old" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Payslip Template Manager..." />}>
                            <PayslipTemplateManager />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      {/* Removed: admin/payslip-management - Use /payroll-management instead */}
                      <Route path="admin/consolidated-reports" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Consolidated Reports..." />}>
                            <ConsolidatedReports />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                      
                      {/* Debug Routes */}
                      <Route path="debug/validation" element={
                        <SmartErrorBoundary level="page">
                          <Suspense fallback={<EnhancedLoadingFallback text="Loading Validation Diagnostic..." />}>
                            <SimpleValidationDiagnostic />
                          </Suspense>
                        </SmartErrorBoundary>
                      } />
                    </Route>
                  </Routes>
                </SmartErrorBoundary>
              </AuthProvider>
            </SnackbarProvider>
          </NotificationProvider>
        </LoadingProvider>
      </ThemeProvider>
    </SmartErrorBoundary>
  );
}

export default App;
