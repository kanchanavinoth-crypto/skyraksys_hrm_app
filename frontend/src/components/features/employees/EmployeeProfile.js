/**
 * Enhanced Employee Profile Component with Field-Level Permissions
 * Demonstrates comprehensive security implementation with granular access control
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Grid,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AccountCircle as AccountCircleIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  ContactMail as ContactIcon,
  AccountBalance as BankIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Receipt as PayslipIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useLoading } from '../../../contexts/LoadingContext';
import { employeeService } from '../../../services/employee.service';
import PhotoUpload from '../../../components/common/PhotoUpload';
import PayslipViewer from '../../payslip/PayslipViewer';

// Permission constants and utilities
const PERMISSIONS = {
  EMPLOYEE: {
    CREATE: 'employee:create',
    READ: 'employee:read',
    UPDATE: 'employee:update',
    DELETE: 'employee:delete'
  }
};

// Sensitive field configuration (matching backend field names)
const sensitiveFieldConfig = {
  aadhaarNumber: { canView: ['admin', 'hr'], canEdit: ['admin', 'hr'] },
  panNumber: { canView: ['admin', 'hr'], canEdit: ['admin', 'hr'] },
  uanNumber: { canView: ['admin', 'hr'], canEdit: ['admin', 'hr'] },
  pfNumber: { canView: ['admin', 'hr'], canEdit: ['admin', 'hr'] },
  esiNumber: { canView: ['admin', 'hr'], canEdit: ['admin', 'hr'] },
  bankAccountNumber: { canView: ['admin', 'hr'], canEdit: ['admin', 'hr'] },
  salary: { canView: ['admin', 'hr'], canEdit: ['admin', 'hr'] }
};

// Permission check function
const hasPermission = (user, permission) => {
  if (!user) return false;
  // For now, simple role-based check
  return user.role === 'admin' || user.role === 'hr';
};

function EnhancedEmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const { setLoading } = useLoading();

  // State management
  const [employee, setEmployee] = useState(null);
  const [originalEmployee, setOriginalEmployee] = useState(null);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showSensitive, setShowSensitive] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [auditHistory, setAuditHistory] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [showPayslipViewer, setShowPayslipViewer] = useState(false);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);
  const [tabChangeDialog, setTabChangeDialog] = useState({ open: false, targetTab: null });

  // Constants for sensitive fields (matching backend field names)
  const SENSITIVE_FIELDS = [
    { key: 'aadhaarNumber', label: 'Aadhaar Number' },
    { key: 'panNumber', label: 'PAN Number' },
    { key: 'uanNumber', label: 'UAN Number' },
    { key: 'pfNumber', label: 'PF Number' },
    { key: 'esiNumber', label: 'ESI Number' }
  ];

  // Permission checks
  const canEditField = useCallback((fieldName) => {
    if (!user) return false;
    
    const config = sensitiveFieldConfig[fieldName];
    if (!config) {
      return hasPermission(user, PERMISSIONS.EMPLOYEE.UPDATE);
    }
    
    return config.canEdit.some(role => user.role === role);
  }, [user]);

  const canAccessSensitive = useCallback(() => {
    return user?.role === 'admin' || user?.role === 'hr';
  }, [user]);

  // Fetch employee data
  const fetchEmployee = useCallback(async () => {
    if (!id) return;
    
    setIsLoadingEmployee(true);
    setLoading(true);
    try {
      const data = await employeeService.getById(id);
      console.log('EmployeeProfile - Received employee data:', data);
      console.log('EmployeeProfile - Data type:', typeof data);
      console.log('EmployeeProfile - Data keys:', data ? Object.keys(data) : 'null');
      console.log('EmployeeProfile - Photo URL:', data?.photoUrl);
      console.log('EmployeeProfile - Photo URL type:', typeof data?.photoUrl);
      setEmployee(data);
      setOriginalEmployee({ ...data });
      
      // Check for security alerts
      const alerts = [];
      if (data.isActive === false) {
        alerts.push({
          severity: 'warning',
          message: 'This employee account is currently inactive.'
        });
      }
      if (data.lastLogin && new Date() - new Date(data.lastLogin) > 90 * 24 * 60 * 60 * 1000) {
        alerts.push({
          severity: 'info',
          message: 'This employee has not logged in for over 90 days.'
        });
      }
      setSecurityAlerts(alerts);
      
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      setErrors({ permission: 'Failed to load employee data. You may not have permission to view this employee.' });
    } finally {
      setIsLoadingEmployee(false);
      setLoading(false);
    }
  }, [id, setLoading]);

  // Fetch dropdown data
  const fetchDropdownData = useCallback(async () => {
    try {
      const [deptData, posData, managerData] = await Promise.all([
        employeeService.getDepartments(),
        employeeService.getPositions(),
        employeeService.getManagers()
      ]);
      // Extract data from response structure { data: { data: [...] } }
      setDepartments(deptData?.data?.data || deptData?.data || []);
      setPositions(posData?.data?.data || posData?.data || []);
      setManagers(managerData?.data?.data || managerData?.data || []);
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  }, []);

  // Fetch audit history
  const fetchAuditHistory = useCallback(async () => {
    if (!canAccessSensitive()) return;
    
    try {
      const history = await employeeService.getAuditHistory(id);
      setAuditHistory(history);
    } catch (error) {
      console.error('Failed to fetch audit history:', error);
    }
  }, [id, canAccessSensitive]);

  useEffect(() => {
    fetchEmployee();
    fetchDropdownData();
    fetchAuditHistory();
  }, [fetchEmployee, fetchDropdownData, fetchAuditHistory]);

  // Handle edit mode
  const handleEdit = () => {
    setEditing(true);
    setErrors({});
  };

  const handleCancel = () => {
    setEmployee({ ...originalEmployee });
    setEditing(false);
    setErrors({});
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedEmployee = await employeeService.update(id, employee);
      setEmployee(updatedEmployee);
      setOriginalEmployee({ ...updatedEmployee });
      setEditing(false);
      setErrors({ success: 'Employee updated successfully!' });
      showNotification('Employee updated successfully!', 'success');
      
      // Refresh audit history
      fetchAuditHistory();
    } catch (error) {
      console.error('Failed to update employee:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to update employee' });
    } finally {
      setLoading(false);
    }
  };

  // Handle field changes
  const handleFieldChange = (field, value) => {
    if (!canEditField(field)) {
      setErrors({ permission: `You don't have permission to edit ${field}` });
      return;
    }
    
    setEmployee(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null, permission: null }));
  };

  // Handle nested salary field changes
  const handleSalaryFieldChange = (field, value) => {
    if (!canEditField('salary')) {
      setErrors({ permission: `You don't have permission to edit salary information` });
      return;
    }
    
    setEmployee(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value
      }
    }));
    setErrors(prev => ({ ...prev, [field]: null, permission: null }));
  };

  // Show loading state while fetching data
  if (isLoadingEmployee) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          bgcolor: 'grey.50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
            Loading employee profile...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show error if employee not found after loading
  if (!employee) {
    return (
      <Box p={{ xs: 1, sm: 2, md: 3 }}>
        <Alert severity="error">
          Employee not found or access denied.
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3, md: 4 } }}>
          {/* Security Alerts */}
          {securityAlerts.map((alert, index) => (
            <Alert 
              key={index} 
              severity={alert.severity} 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontWeight: 500
                }
              }}
            >
              {alert.message}
            </Alert>
          ))}

          {/* Modern Profile Header */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              mb: 4,
              overflow: 'visible',
              background: 'linear-gradient(to bottom, #ffffff, #f8fafc)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ p: { xs: 3, md: 4 } }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm="auto">
                  <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                    <PhotoUpload
                      currentPhotoUrl={employee.photoUrl}
                      onPhotoChange={(photoUrl) => handleFieldChange('photoUrl', photoUrl)}
                      employeeId={id}
                      size={120}
                      showUpload={editing && canEditField('photoUrl')}
                      sx={{
                        '& .MuiAvatar-root': {
                          border: '4px solid #e5e7eb',
                          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)',
                        }
                      }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm>
                  <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                    <Typography 
                      variant="h4" 
                      component="h1" 
                      sx={{ 
                        fontWeight: 700,
                        mb: 1,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontSize: { xs: '1.75rem', sm: '2.125rem' }
                      }}
                    >
                      {employee.firstName} {employee.lastName}
                    </Typography>
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#64748b',
                        mb: 2,
                        fontWeight: 500,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}
                    >
                      {employee.position?.title || 'Position not assigned'} • {employee.department?.name || 'Department not assigned'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                      <Chip
                        label={employee.isActive ? 'Active' : 'Inactive'}
                        sx={{
                          fontWeight: 600,
                          bgcolor: employee.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: employee.isActive ? '#10b981' : '#ef4444',
                          border: '1px solid',
                          borderColor: employee.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                        }}
                      />
                      <Chip
                        label={`ID: ${employee.employeeId || 'Not assigned'}`}
                        sx={{
                          fontWeight: 500,
                          bgcolor: 'rgba(99, 102, 241, 0.05)',
                          color: '#6366f1',
                          border: '1px solid',
                          borderColor: 'rgba(99, 102, 241, 0.2)'
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm="auto">
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'row', sm: 'column' }, 
                    gap: 1,
                    justifyContent: { xs: 'center', sm: 'flex-end' },
                    flexWrap: 'wrap'
                  }}>
                    {/* Security Controls */}
                    {canAccessSensitive() && (
                      <Tooltip title="View audit history">
                        <IconButton
                          onClick={() => setShowAuditDialog(true)}
                          sx={{ 
                            bgcolor: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366f1',
                            '&:hover': { 
                              bgcolor: 'rgba(99, 102, 241, 0.2)',
                              transform: 'scale(1.05)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {canAccessSensitive() && (
                      <Tooltip title={showSensitive ? "Hide sensitive data" : "Show sensitive data"}>
                        <IconButton
                          onClick={() => setShowSensitive(!showSensitive)}
                          sx={{ 
                            bgcolor: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366f1',
                            '&:hover': { 
                              bgcolor: 'rgba(99, 102, 241, 0.2)',
                              transform: 'scale(1.05)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {showSensitive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Action Buttons */}
                    {(user?.role === 'admin' || user?.role === 'hr') && (
                      <>
                        <Button
                          variant="outlined"
                          startIcon={<PayslipIcon />}
                          onClick={() => setShowPayslipViewer(true)}
                          sx={{
                            borderColor: '#cbd5e1',
                            color: '#6366f1',
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: '#6366f1',
                              bgcolor: 'rgba(99, 102, 241, 0.05)'
                            }
                          }}
                        >
                          Payslip
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<AccountCircleIcon />}
                          onClick={() => navigate(`/employees/${id}/user-account`)}
                          sx={{
                            borderColor: '#cbd5e1',
                            color: '#6366f1',
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: '#6366f1',
                              bgcolor: 'rgba(99, 102, 241, 0.05)'
                            }
                          }}
                        >
                          User Account
                        </Button>
                      </>
                    )}
                    
                    {!editing ? (
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={handleEdit}
                        disabled={!canEditField('firstName')}
                        sx={{
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: 'white',
                          fontWeight: 600,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
                          },
                          '&:disabled': {
                            bgcolor: '#e5e7eb',
                            color: '#9ca3af'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          startIcon={<SaveIcon />}
                          onClick={handleSave}
                          sx={{
                            bgcolor: '#10b981',
                            color: 'white',
                            fontWeight: 600,
                            '&:hover': {
                              bgcolor: '#059669',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={handleCancel}
                          sx={{
                            borderColor: '#cbd5e1',
                            color: '#64748b',
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: '#94a3b8',
                              bgcolor: 'rgba(148, 163, 184, 0.05)'
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Card>

          {/* Alert Messages */}
          {errors.permission && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {errors.permission}
            </Alert>
          )}
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {errors.submit}
            </Alert>
          )}
          {errors.success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {errors.success}
            </Alert>
          )}

          {/* Modern Tabbed Content */}
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'grey.200',
              overflow: 'hidden'
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => {
                if (editing) {
                  // Show warning dialog when switching tabs in edit mode
                  setTabChangeDialog({ open: true, targetTab: newValue });
                } else {
                  setActiveTab(newValue);
                }
              }}
              variant="fullWidth"
              sx={{ 
                bgcolor: 'grey.50',
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minHeight: 72,
                  py: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  color: 'text.secondary',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'primary.50',
                    color: 'primary.main'
                  },
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiSvgIcon-root': {
                      color: 'white'
                    }
                  }
                },
                '& .MuiTabs-indicator': {
                  display: 'none'
                }
              }}
            >
              <Tab icon={<PersonIcon />} label="Personal Info" />
              <Tab icon={<WorkIcon />} label="Employment" />
              <Tab icon={<ContactIcon />} label="Contact & Emergency" />
              <Tab icon={<BankIcon />} label="Statutory & Banking" />
            </Tabs>

            {/* Tab Content */}
            <Box sx={{ 
              p: { xs: 3, md: 4 }, 
              bgcolor: 'white', 
              minHeight: '600px',
              pb: editing ? 12 : 4  // Extra bottom padding when editing to prevent sticky bar overlap
            }}>
              {activeTab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Essential Information */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        Essential Information
                      </Typography>
                      {editing && <Chip label="Editing" size="small" color="warning" icon={<EditIcon />} />}
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            First Name
                          </Typography>
                          {editing && canEditField('firstName') ? (
                            <TextField
                              fullWidth
                              value={employee.firstName || ''}
                              onChange={(e) => handleFieldChange('firstName', e.target.value)}
                              variant="outlined"
                              size="small"
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.firstName}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Last Name
                          </Typography>
                          {editing && canEditField('lastName') ? (
                            <TextField
                              fullWidth
                              value={employee.lastName || ''}
                              onChange={(e) => handleFieldChange('lastName', e.target.value)}
                              variant="outlined"
                              size="small"
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.lastName}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon color="primary" />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Email Address
                            </Typography>
                            {editing && canEditField('email') ? (
                              <TextField
                                fullWidth
                                type="email"
                                value={employee.email || ''}
                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                variant="outlined"
                                size="small"
                              />
                            ) : (
                              <Typography variant="h6" fontWeight={600}>
                                {employee.email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon color="primary" />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Phone Number
                            </Typography>
                            {editing && canEditField('phone') ? (
                              <TextField
                                fullWidth
                                value={employee.phone || ''}
                                onChange={(e) => handleFieldChange('phone', e.target.value)}
                                variant="outlined"
                                size="small"
                              />
                            ) : (
                              <Typography variant="h6" fontWeight={600}>
                                {employee.phone || 'Not provided'}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Personal Details */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        Personal Details
                      </Typography>
                      {editing && <Chip label="Editing" size="small" color="warning" icon={<EditIcon />} />}
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Date of Birth
                          </Typography>
                          {editing && canEditField('dateOfBirth') ? (
                            <TextField
                              fullWidth
                              type="date"
                              value={employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : ''}
                              onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                              variant="outlined"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'Not provided'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Gender
                          </Typography>
                          {editing && canEditField('gender') ? (
                            <FormControl fullWidth size="small">
                              <Select
                                value={employee.gender || ''}
                                onChange={(e) => handleFieldChange('gender', e.target.value)}
                              >
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                                <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.gender || 'Not specified'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Marital Status
                          </Typography>
                          {editing && canEditField('maritalStatus') ? (
                            <FormControl fullWidth size="small">
                              <Select
                                value={employee.maritalStatus || ''}
                                onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
                              >
                                <MenuItem value="single">Single</MenuItem>
                                <MenuItem value="married">Married</MenuItem>
                                <MenuItem value="divorced">Divorced</MenuItem>
                                <MenuItem value="widowed">Widowed</MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.maritalStatus || 'Not specified'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Nationality
                          </Typography>
                          {editing && canEditField('nationality') ? (
                            <TextField
                              fullWidth
                              value={employee.nationality || ''}
                              onChange={(e) => handleFieldChange('nationality', e.target.value)}
                              variant="outlined"
                              size="small"
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.nationality || 'Not specified'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Address Information */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        Address Information
                      </Typography>
                      {editing && <Chip label="Editing" size="small" color="warning" icon={<EditIcon />} />}
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <LocationIcon color="primary" sx={{ mt: 0.5 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Address
                            </Typography>
                            {editing && canEditField('address') ? (
                              <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={employee.address || ''}
                                onChange={(e) => handleFieldChange('address', e.target.value)}
                                variant="outlined"
                                size="small"
                              />
                            ) : (
                              <Typography variant="h6" fontWeight={600}>
                                {employee.address || 'Not provided'}
                              </Typography>
                            )}
                            {(employee.city || employee.state || employee.pinCode) && !editing && (
                              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                                {[employee.city, employee.state, employee.pinCode].filter(Boolean).join(', ')}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                      {editing && (
                        <>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="City"
                              value={employee.city || ''}
                              onChange={(e) => handleFieldChange('city', e.target.value)}
                              variant="outlined"
                              size="small"
                              disabled={!canEditField('city')}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="State"
                              value={employee.state || ''}
                              onChange={(e) => handleFieldChange('state', e.target.value)}
                              variant="outlined"
                              size="small"
                              disabled={!canEditField('state')}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="Pin Code"
                              value={employee.pinCode || ''}
                              onChange={(e) => handleFieldChange('pinCode', e.target.value)}
                              variant="outlined"
                              size="small"
                              disabled={!canEditField('pinCode')}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Box>
                </Box>
              )}

              {activeTab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Employment Information */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        Employment Information
                      </Typography>
                      {editing && <Chip label="Editing" size="small" color="warning" icon={<EditIcon />} />}
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Department
                          </Typography>
                          {editing && canEditField('departmentId') ? (
                            <FormControl fullWidth size="small">
                              <Select
                                value={employee.departmentId || ''}
                                onChange={(e) => handleFieldChange('departmentId', e.target.value)}
                              >
                                {departments.map((dept) => (
                                  <MenuItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.department?.name || 'Not assigned'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Position
                          </Typography>
                          {editing && canEditField('positionId') ? (
                            <FormControl fullWidth size="small">
                              <Select
                                value={employee.positionId || ''}
                                onChange={(e) => handleFieldChange('positionId', e.target.value)}
                              >
                                {positions.map((pos) => (
                                  <MenuItem key={pos.id} value={pos.id}>
                                    {pos.title}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.position?.title || 'Not assigned'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Hire Date
                          </Typography>
                          {editing && canEditField('hireDate') ? (
                            <TextField
                              fullWidth
                              type="date"
                              value={employee.hireDate ? employee.hireDate.split('T')[0] : ''}
                              onChange={(e) => handleFieldChange('hireDate', e.target.value)}
                              variant="outlined"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'Not provided'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Employment Type
                          </Typography>
                          {editing && canEditField('employmentType') ? (
                            <FormControl fullWidth size="small">
                              <Select
                                value={employee.employmentType || ''}
                                onChange={(e) => handleFieldChange('employmentType', e.target.value)}
                              >
                                <MenuItem value="full-time">Full Time</MenuItem>
                                <MenuItem value="part-time">Part Time</MenuItem>
                                <MenuItem value="contract">Contract</MenuItem>
                                <MenuItem value="temporary">Temporary</MenuItem>
                                <MenuItem value="intern">Intern</MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.employmentType || 'Not specified'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Manager
                          </Typography>
                          {editing && canEditField('managerId') ? (
                            <FormControl fullWidth size="small">
                              <Select
                                value={employee.managerId || ''}
                                onChange={(e) => handleFieldChange('managerId', e.target.value)}
                              >
                                <MenuItem value="">No manager</MenuItem>
                                {managers.map((manager) => (
                                  <MenuItem key={manager.id} value={manager.id}>
                                    {manager.firstName} {manager.lastName}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : 'No manager assigned'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Work Location
                          </Typography>
                          {editing && canEditField('workLocation') ? (
                            <TextField
                              fullWidth
                              value={employee.workLocation || ''}
                              onChange={(e) => handleFieldChange('workLocation', e.target.value)}
                              variant="outlined"
                              size="small"
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.workLocation || 'Not specified'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      {/* Additional Employment Dates */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Joining Date
                          </Typography>
                          {editing && canEditField('joiningDate') ? (
                            <TextField
                              fullWidth
                              type="date"
                              value={employee.joiningDate ? employee.joiningDate.split('T')[0] : ''}
                              onChange={(e) => handleFieldChange('joiningDate', e.target.value)}
                              variant="outlined"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'Not provided'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Confirmation Date
                          </Typography>
                          {editing && canEditField('confirmationDate') ? (
                            <TextField
                              fullWidth
                              type="date"
                              value={employee.confirmationDate ? employee.confirmationDate.split('T')[0] : ''}
                              onChange={(e) => handleFieldChange('confirmationDate', e.target.value)}
                              variant="outlined"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.confirmationDate ? new Date(employee.confirmationDate).toLocaleDateString() : 'Not provided'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Probation Period (months)
                          </Typography>
                          {editing && canEditField('probationPeriod') ? (
                            <TextField
                              fullWidth
                              type="number"
                              value={employee.probationPeriod || ''}
                              onChange={(e) => handleFieldChange('probationPeriod', parseInt(e.target.value) || 0)}
                              variant="outlined"
                              size="small"
                              inputProps={{ min: 0, max: 24 }}
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.probationPeriod ? `${employee.probationPeriod} months` : 'Not specified'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Notice Period (days)
                          </Typography>
                          {editing && canEditField('noticePeriod') ? (
                            <TextField
                              fullWidth
                              type="number"
                              value={employee.noticePeriod || ''}
                              onChange={(e) => handleFieldChange('noticePeriod', parseInt(e.target.value) || 0)}
                              variant="outlined"
                              size="small"
                              inputProps={{ min: 0, max: 365 }}
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.noticePeriod ? `${employee.noticePeriod} days` : 'Not specified'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Resignation Date
                          </Typography>
                          {editing && canEditField('resignationDate') ? (
                            <TextField
                              fullWidth
                              type="date"
                              value={employee.resignationDate ? employee.resignationDate.split('T')[0] : ''}
                              onChange={(e) => handleFieldChange('resignationDate', e.target.value)}
                              variant="outlined"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.resignationDate ? new Date(employee.resignationDate).toLocaleDateString() : 'Not provided'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Last Working Date
                          </Typography>
                          {editing && canEditField('lastWorkingDate') ? (
                            <TextField
                              fullWidth
                              type="date"
                              value={employee.lastWorkingDate ? employee.lastWorkingDate.split('T')[0] : ''}
                              onChange={(e) => handleFieldChange('lastWorkingDate', e.target.value)}
                              variant="outlined"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.lastWorkingDate ? new Date(employee.lastWorkingDate).toLocaleDateString() : 'Not provided'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Compensation Section - Only visible to admin/HR */}
                  {canAccessSensitive() && (
                    <Box sx={{ mt: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <AttachMoneyIcon color="primary" />
                        <Typography variant="h6" color="primary.main" fontWeight={700}>
                          Compensation Details
                        </Typography>
                        <Chip 
                          label="Confidential" 
                          size="small" 
                          color="error" 
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      
                      {employee.salary && Object.keys(employee.salary).length > 0 ? (
                        <Grid container spacing={3}>
                          {/* Basic Salary Information */}
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                              Basic Salary
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ p: 2, bgcolor: editing ? 'grey.50' : 'success.50', borderRadius: 2, border: '1px solid', borderColor: editing ? 'grey.300' : 'success.200' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Basic Salary
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.basicSalary || ''}
                                  onChange={(e) => handleSalaryFieldChange('basicSalary', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0, step: 1000 }}
                                />
                              ) : (
                                <Typography variant="h5" fontWeight={700} color="success.main">
                                  {employee.salary.currency || 'INR'} {employee.salary.basicSalary?.toLocaleString() || '0'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Currency
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={employee.salary.currency || 'INR'}
                                    onChange={(e) => handleSalaryFieldChange('currency', e.target.value)}
                                  >
                                    <MenuItem value="INR">INR</MenuItem>
                                    <MenuItem value="USD">USD</MenuItem>
                                    <MenuItem value="EUR">EUR</MenuItem>
                                    <MenuItem value="GBP">GBP</MenuItem>
                                  </Select>
                                </FormControl>
                              ) : (
                                <Typography variant="h6" fontWeight={600}>
                                  {employee.salary.currency || 'INR'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Pay Frequency
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={employee.salary.payFrequency || 'monthly'}
                                    onChange={(e) => handleSalaryFieldChange('payFrequency', e.target.value)}
                                  >
                                    <MenuItem value="weekly">Weekly</MenuItem>
                                    <MenuItem value="biweekly">Bi-weekly</MenuItem>
                                    <MenuItem value="monthly">Monthly</MenuItem>
                                    <MenuItem value="annually">Annually</MenuItem>
                                  </Select>
                                </FormControl>
                              ) : (
                                <Typography variant="h6" fontWeight={600}>
                                  {employee.salary.payFrequency || 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Effective From
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="date"
                                  value={employee.salary.effectiveFrom ? employee.salary.effectiveFrom.split('T')[0] : ''}
                                  onChange={(e) => handleSalaryFieldChange('effectiveFrom', e.target.value)}
                                  variant="outlined"
                                  size="small"
                                  InputLabelProps={{ shrink: true }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600}>
                                  {employee.salary.effectiveFrom ? new Date(employee.salary.effectiveFrom).toLocaleDateString() : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>

                          {/* Allowances Section */}
                          <Grid item xs={12} sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                              Allowances {editing && <Chip label="Edit Mode" size="small" color="info" sx={{ ml: 1 }} />}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                House Rent Allowance (HRA)
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.houseRentAllowance || ''}
                                  onChange={(e) => handleSalaryFieldChange('houseRentAllowance', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="info.main">
                                  {employee.salary.houseRentAllowance > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.houseRentAllowance?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Transport Allowance
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.transportAllowance || ''}
                                  onChange={(e) => handleSalaryFieldChange('transportAllowance', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="info.main">
                                  {employee.salary.transportAllowance > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.transportAllowance?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Medical Allowance
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.medicalAllowance || ''}
                                  onChange={(e) => handleSalaryFieldChange('medicalAllowance', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="info.main">
                                  {employee.salary.medicalAllowance > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.medicalAllowance?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Food Allowance
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.foodAllowance || ''}
                                  onChange={(e) => handleSalaryFieldChange('foodAllowance', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="info.main">
                                  {employee.salary.foodAllowance > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.foodAllowance?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Communication Allowance
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.communicationAllowance || ''}
                                  onChange={(e) => handleSalaryFieldChange('communicationAllowance', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="info.main">
                                  {employee.salary.communicationAllowance > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.communicationAllowance?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Special Allowance
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.specialAllowance || ''}
                                  onChange={(e) => handleSalaryFieldChange('specialAllowance', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="info.main">
                                  {employee.salary.specialAllowance > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.specialAllowance?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Other Allowances
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.otherAllowances || ''}
                                  onChange={(e) => handleSalaryFieldChange('otherAllowances', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="info.main">
                                  {employee.salary.otherAllowances > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.otherAllowances?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>

                          {/* Deductions Section */}
                          <Grid item xs={12} sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                              Deductions {editing && <Chip label="Edit Mode" size="small" color="warning" sx={{ ml: 1 }} />}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Provident Fund (PF)
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.providentFund || ''}
                                  onChange={(e) => handleSalaryFieldChange('providentFund', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="warning.dark">
                                  {employee.salary.providentFund > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.providentFund?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Professional Tax
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.professionalTax || ''}
                                  onChange={(e) => handleSalaryFieldChange('professionalTax', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="warning.dark">
                                  {employee.salary.professionalTax > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.professionalTax?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Income Tax (TDS)
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.incomeTax || ''}
                                  onChange={(e) => handleSalaryFieldChange('incomeTax', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="warning.dark">
                                  {employee.salary.incomeTax > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.incomeTax?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                ESI
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.esi || ''}
                                  onChange={(e) => handleSalaryFieldChange('esi', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="warning.dark">
                                  {employee.salary.esi > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.esi?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Other Deductions
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.otherDeductions || ''}
                                  onChange={(e) => handleSalaryFieldChange('otherDeductions', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="warning.dark">
                                  {employee.salary.otherDeductions > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.otherDeductions?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>

                          {/* Additional Benefits */}
                          <Grid item xs={12} sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                              Additional Benefits {editing && <Chip label="Edit Mode" size="small" color="success" sx={{ ml: 1 }} />}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Bonus
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.bonus || ''}
                                  onChange={(e) => handleSalaryFieldChange('bonus', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="success.dark">
                                  {employee.salary.bonus > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.bonus?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Incentive
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.incentive || ''}
                                  onChange={(e) => handleSalaryFieldChange('incentive', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="success.dark">
                                  {employee.salary.incentive > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.incentive?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Overtime Pay
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.overtime || ''}
                                  onChange={(e) => handleSalaryFieldChange('overtime', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h6" fontWeight={600} color="success.dark">
                                  {employee.salary.overtime > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.overtime?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>

                          {/* Summary Cards */}
                          <Grid item xs={12} sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                              Summary {editing && <Chip label="Edit Mode" size="small" color="primary" sx={{ ml: 1 }} />}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ 
                              p: 3, 
                              bgcolor: 'primary.50', 
                              borderRadius: 2, 
                              border: '2px solid', 
                              borderColor: 'primary.main' 
                            }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Cost to Company (CTC)
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.ctc || ''}
                                  onChange={(e) => handleSalaryFieldChange('ctc', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h4" fontWeight={700} color="primary.main">
                                  {employee.salary.ctc > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.ctc?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ 
                              p: 3, 
                              bgcolor: 'success.50', 
                              borderRadius: 2, 
                              border: '2px solid', 
                              borderColor: 'success.main' 
                            }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Take Home Salary
                              </Typography>
                              {editing && canEditField('salary') ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={employee.salary.takeHome || ''}
                                  onChange={(e) => handleSalaryFieldChange('takeHome', parseFloat(e.target.value) || 0)}
                                  variant="outlined"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                <Typography variant="h4" fontWeight={700} color="success.main">
                                  {employee.salary.takeHome > 0 ? `${employee.salary.currency || 'INR'} ${employee.salary.takeHome?.toLocaleString()}` : 'Not set'}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="primary.main">
                                      {employee.salary.currency || 'INR'} {employee.salary.ctc?.toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                      Annual Package
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.takeHome > 0 && (
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ 
                                    p: 3, 
                                    bgcolor: 'success.50', 
                                    borderRadius: 2, 
                                    border: '2px solid', 
                                    borderColor: 'success.main' 
                                  }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Take Home Salary
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="success.main">
                                      {employee.salary.currency || 'INR'} {employee.salary.takeHome?.toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                      Net Pay ({employee.salary.payFrequency || 'Monthly'})
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                            </>
                          )}

                          {/* Tax Information */}
                          {employee.salary.taxRegime && (
                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Tax Regime
                                </Typography>
                                <Typography variant="h6" fontWeight={600}>
                                  {employee.salary.taxRegime}
                                </Typography>
                              </Box>
                            </Grid>
                          )}

                          {/* Salary Notes */}
                          {employee.salary.salaryNotes && (
                            <Grid item xs={12}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Notes
                                </Typography>
                                <Typography variant="body1">
                                  {employee.salary.salaryNotes}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      ) : (
                        <Box 
                          sx={{ 
                            p: 4, 
                            textAlign: 'center', 
                            bgcolor: 'grey.50', 
                            borderRadius: 2,
                            border: '1px dashed',
                            borderColor: 'grey.300'
                          }}
                        >
                          <AttachMoneyIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No Compensation Data Available
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Salary details have not been configured for this employee yet.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      Emergency Contact
                    </Typography>
                    {editing && <Chip label="Editing" size="small" color="warning" icon={<EditIcon />} />}
                  </Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Contact Name
                        </Typography>
                        {editing && canEditField('emergencyContactName') ? (
                          <TextField
                            fullWidth
                            value={employee.emergencyContactName || ''}
                            onChange={(e) => handleFieldChange('emergencyContactName', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        ) : (
                          <Typography variant="h6" fontWeight={600}>
                            {employee.emergencyContactName || 'Not provided'}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Contact Phone
                        </Typography>
                        {editing && canEditField('emergencyContactPhone') ? (
                          <TextField
                            fullWidth
                            value={employee.emergencyContactPhone || ''}
                            onChange={(e) => handleFieldChange('emergencyContactPhone', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        ) : (
                          <Typography variant="h6" fontWeight={600}>
                            {employee.emergencyContactPhone || 'Not provided'}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Relationship
                        </Typography>
                        {editing && canEditField('emergencyContactRelation') ? (
                          <TextField
                            fullWidth
                            value={employee.emergencyContactRelation || ''}
                            onChange={(e) => handleFieldChange('emergencyContactRelation', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        ) : (
                          <Typography variant="h6" fontWeight={600}>
                            {employee.emergencyContactRelation || 'Not specified'}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeTab === 3 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Statutory Information */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        Statutory Information
                      </Typography>
                      {editing && <Chip label="Editing" size="small" color="warning" icon={<EditIcon />} />}
                    </Box>
                    <Grid container spacing={3}>
                      {SENSITIVE_FIELDS.map((field) => (
                        <Grid item xs={12} sm={6} key={field.key}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {field.label}
                            </Typography>
                            {editing && canEditField(field.key) ? (
                              <TextField
                                fullWidth
                                value={employee[field.key] || ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                variant="outlined"
                                size="small"
                              />
                            ) : (
                              <Typography variant="h6" fontWeight={600}>
                                {showSensitive || canAccessSensitive() 
                                  ? (employee[field.key] || 'Not provided')
                                  : '••••••••••••'
                                }
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  {/* Banking Information */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        Banking Information
                      </Typography>
                      {editing && <Chip label="Editing" size="small" color="warning" icon={<EditIcon />} />}
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Bank Name
                          </Typography>
                          {editing && canEditField('bankName') ? (
                            <TextField
                              fullWidth
                              value={employee.bankName || ''}
                              onChange={(e) => handleFieldChange('bankName', e.target.value)}
                              variant="outlined"
                              size="small"
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.bankName || 'Not provided'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Account Number
                          </Typography>
                          {editing && canEditField('bankAccountNumber') ? (
                            <TextField
                              fullWidth
                              value={employee.bankAccountNumber || ''}
                              onChange={(e) => handleFieldChange('bankAccountNumber', e.target.value)}
                              variant="outlined"
                              size="small"
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {showSensitive || canAccessSensitive() 
                                ? (employee.bankAccountNumber || 'Not provided')
                                : '••••••••••••'
                              }
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            IFSC Code
                          </Typography>
                          {editing && canEditField('ifscCode') ? (
                            <TextField
                              fullWidth
                              value={employee.ifscCode || ''}
                              onChange={(e) => handleFieldChange('ifscCode', e.target.value)}
                              variant="outlined"
                              size="small"
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.ifscCode || 'Not provided'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Account Holder Name
                          </Typography>
                          {editing && canEditField('accountHolderName') ? (
                            <TextField
                              fullWidth
                              value={employee.accountHolderName || ''}
                              onChange={(e) => handleFieldChange('accountHolderName', e.target.value)}
                              variant="outlined"
                              size="small"
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.accountHolderName || 'Not provided'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Bank Branch
                          </Typography>
                          {editing && canEditField('bankBranch') ? (
                            <TextField
                              fullWidth
                              value={employee.bankBranch || ''}
                              onChange={(e) => handleFieldChange('bankBranch', e.target.value)}
                              variant="outlined"
                              size="small"
                            />
                          ) : (
                            <Typography variant="h6" fontWeight={600}>
                              {employee.bankBranch || 'Not provided'}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              )}
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Sticky Floating Action Bar - Only visible in edit mode */}
      {editing && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'white',
            borderTop: '2px solid',
            borderColor: 'warning.main',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
            zIndex: 1100,
            py: 2,
            px: 3
          }}
        >
          <Box
            sx={{
              maxWidth: '1400px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                icon={<EditIcon />}
                label="Edit Mode Active" 
                color="warning" 
                sx={{ fontWeight: 600 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                Make your changes and click Save to update the profile
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#64748b',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#94a3b8',
                    bgcolor: 'rgba(148, 163, 184, 0.05)'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{
                  bgcolor: '#10b981',
                  color: 'white',
                  fontWeight: 600,
                  px: 4,
                  '&:hover': {
                    bgcolor: '#059669',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Audit History Dialog */}
      <Dialog 
        open={showAuditDialog} 
        onClose={() => setShowAuditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Audit History</DialogTitle>
        <DialogContent>
          {auditHistory.length > 0 ? (
            auditHistory.map((entry, index) => (
              <Box key={index} mb={2} p={2} border={1} borderColor="grey.300" borderRadius={1}>
                <Typography variant="subtitle2">
                  {entry.action} by {entry.userRole} on {new Date(entry.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Field: {entry.fieldName}, Previous: {entry.oldValue}, New: {entry.newValue}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography>No audit history available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuditDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Payslip Viewer Dialog */}
      <PayslipViewer
        open={showPayslipViewer}
        onClose={() => setShowPayslipViewer(false)}
        employee={employee}
        mode="generate"
      />

      {/* Tab Change Warning Dialog */}
      <Dialog
        open={tabChangeDialog.open}
        onClose={() => setTabChangeDialog({ open: false, targetTab: null })}
      >
        <DialogTitle>Switch Tab?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are currently in edit mode. Switching tabs will not save your changes.
          </Alert>
          <Typography>
            Do you want to switch to another tab? Your unsaved changes will remain but won't be saved until you click "Save Changes".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTabChangeDialog({ open: false, targetTab: null })}>
            Stay Here
          </Button>
          <Button 
            onClick={() => {
              setActiveTab(tabChangeDialog.targetTab);
              setTabChangeDialog({ open: false, targetTab: null });
            }}
            variant="contained"
            color="warning"
          >
            Switch Tab
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default React.memo(EnhancedEmployeeProfile);