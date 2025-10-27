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
              onChange={(e, newValue) => setActiveTab(newValue)}
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
            <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: 'white', minHeight: '600px' }}>
              {activeTab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Essential Information */}
                  <Box>
                    <Typography variant="h6" gutterBottom color="primary.main" fontWeight={700} sx={{ mb: 3 }}>
                      Essential Information
                    </Typography>
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
                    <Typography variant="h6" gutterBottom color="primary.main" fontWeight={700} sx={{ mb: 3 }}>
                      Personal Details
                    </Typography>
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
                    <Typography variant="h6" gutterBottom color="primary.main" fontWeight={700} sx={{ mb: 3 }}>
                      Address Information
                    </Typography>
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
                    <Typography variant="h6" gutterBottom color="primary.main" fontWeight={700} sx={{ mb: 3 }}>
                      Employment Information
                    </Typography>
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
                            <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Basic Salary
                              </Typography>
                              <Typography variant="h5" fontWeight={700} color="success.main">
                                {employee.salary.currency || 'INR'} {employee.salary.basicSalary?.toLocaleString() || '0'}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Currency
                              </Typography>
                              <Typography variant="h6" fontWeight={600}>
                                {employee.salary.currency || 'INR'}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Pay Frequency
                              </Typography>
                              <Typography variant="h6" fontWeight={600}>
                                {employee.salary.payFrequency || 'Not set'}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Effective From
                              </Typography>
                              <Typography variant="h6" fontWeight={600}>
                                {employee.salary.effectiveFrom ? new Date(employee.salary.effectiveFrom).toLocaleDateString() : 'Not set'}
                              </Typography>
                            </Box>
                          </Grid>

                          {/* Allowances Section */}
                          {(employee.salary.houseRentAllowance || employee.salary.transportAllowance || 
                            employee.salary.medicalAllowance || employee.salary.foodAllowance || 
                            employee.salary.communicationAllowance || employee.salary.specialAllowance || 
                            employee.salary.otherAllowances) && (
                            <>
                              <Grid item xs={12} sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                  Allowances
                                </Typography>
                              </Grid>
                              
                              {employee.salary.houseRentAllowance > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      House Rent Allowance (HRA)
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="info.main">
                                      {employee.salary.currency || 'INR'} {employee.salary.houseRentAllowance?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.transportAllowance > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Transport Allowance
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="info.main">
                                      {employee.salary.currency || 'INR'} {employee.salary.transportAllowance?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.medicalAllowance > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Medical Allowance
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="info.main">
                                      {employee.salary.currency || 'INR'} {employee.salary.medicalAllowance?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.foodAllowance > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Food Allowance
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="info.main">
                                      {employee.salary.currency || 'INR'} {employee.salary.foodAllowance?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.communicationAllowance > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Communication Allowance
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="info.main">
                                      {employee.salary.currency || 'INR'} {employee.salary.communicationAllowance?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.specialAllowance > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Special Allowance
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="info.main">
                                      {employee.salary.currency || 'INR'} {employee.salary.specialAllowance?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.otherAllowances > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.100' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Other Allowances
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="info.main">
                                      {employee.salary.currency || 'INR'} {employee.salary.otherAllowances?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                            </>
                          )}

                          {/* Deductions Section */}
                          {(employee.salary.providentFund || employee.salary.professionalTax || 
                            employee.salary.incomeTax || employee.salary.esi || 
                            employee.salary.otherDeductions) && (
                            <>
                              <Grid item xs={12} sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                  Deductions
                                </Typography>
                              </Grid>
                              
                              {employee.salary.providentFund > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Provident Fund (PF)
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="warning.dark">
                                      {employee.salary.currency || 'INR'} {employee.salary.providentFund?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.professionalTax > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Professional Tax
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="warning.dark">
                                      {employee.salary.currency || 'INR'} {employee.salary.professionalTax?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.incomeTax > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Income Tax (TDS)
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="warning.dark">
                                      {employee.salary.currency || 'INR'} {employee.salary.incomeTax?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.esi > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      ESI
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="warning.dark">
                                      {employee.salary.currency || 'INR'} {employee.salary.esi?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.otherDeductions > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Other Deductions
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="warning.dark">
                                      {employee.salary.currency || 'INR'} {employee.salary.otherDeductions?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                            </>
                          )}

                          {/* Additional Benefits */}
                          {(employee.salary.bonus || employee.salary.incentive || employee.salary.overtime) && (
                            <>
                              <Grid item xs={12} sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                  Additional Benefits
                                </Typography>
                              </Grid>
                              
                              {employee.salary.bonus > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Bonus
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="success.dark">
                                      {employee.salary.currency || 'INR'} {employee.salary.bonus?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.incentive > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Incentive
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="success.dark">
                                      {employee.salary.currency || 'INR'} {employee.salary.incentive?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              {employee.salary.overtime > 0 && (
                                <Grid item xs={12} sm={6} md={4}>
                                  <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Overtime Pay
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="success.dark">
                                      {employee.salary.currency || 'INR'} {employee.salary.overtime?.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                            </>
                          )}

                          {/* Summary Cards */}
                          {(employee.salary.ctc || employee.salary.takeHome) && (
                            <>
                              <Grid item xs={12} sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                  Summary
                                </Typography>
                              </Grid>
                              
                              {employee.salary.ctc > 0 && (
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
                  <Typography variant="h6" gutterBottom color="primary.main" fontWeight={700} sx={{ mb: 3 }}>
                    Emergency Contact
                  </Typography>
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
                    <Typography variant="h6" gutterBottom color="primary.main" fontWeight={700} sx={{ mb: 3 }}>
                      Statutory Information
                    </Typography>
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
                    <Typography variant="h6" gutterBottom color="primary.main" fontWeight={700} sx={{ mb: 3 }}>
                      Banking Information
                    </Typography>
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
                    </Grid>
                  </Box>
                </Box>
              )}
            </Box>
          </Card>
        </Box>
      </Box>

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
    </>
  );
}

export default React.memo(EnhancedEmployeeProfile);