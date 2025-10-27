/**
 * Enhanced Employee Profile Component with Field-Level Permissions
 * Demonstrates comprehensive security implementation with granular access control
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Button,
  Avatar,
  Box,
  Typography,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Paper,
  MenuItem,
  Divider,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
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
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useLoading } from '../../../contexts/LoadingContext';
import { 
  useFieldPermissions, 
  PermissionField, 
  PermissionFieldGroup, 
  SecurityIndicator 
} from '../../../hooks/useFieldPermissions';
import { employeeService } from '../../../services/employee.service';
import UserAccountManager from './UserAccountManager';

function EnhancedEmployeeProfile() {
  const { showNotification } = useNotifications();
  const { id } = useParams();
  const { user } = useAuth();
  const {
    canViewField,
    canEditField,
    canAccessSensitive,
    filterEmployeeData,
    getFieldCategory,
    validateFieldEdit,
    FIELD_CATEGORIES,
    SENSITIVE_FIELDS
  } = useFieldPermissions(id);

  const [employee, setEmployee] = useState(null);
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showSensitive, setShowSensitive] = useState(false);
  const [showUserAccountManager, setShowUserAccountManager] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [auditHistory, setAuditHistory] = useState([]);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState([]);

  // Optimized useEffect with proper dependencies
  const fetchEmployee = useCallback(async () => {
    try {
      setIsLocalLoading(true);
      console.log('Fetching employee with ID:', id);
      const response = await employeeService.getById(id);
      console.log('Employee fetch response:', response);
      if (response.success) {
        const employeeData = response.data;
        console.log('Setting employee data:', employeeData);
        setEmployee(employeeData);
        setFormData(employeeData);
      } else {
        console.log('Response was not successful:', response);
        setEmployee(null);
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      setEmployee(null);
      if (error.response?.status === 403) {
        setSecurityAlerts(prev => [...prev, {
          severity: 'error',
          message: 'Access denied: Insufficient permissions to view this employee'
        }]);
      }
    } finally {
      setIsLocalLoading(false);
    }
  }, [id]);

  const fetchSecurityContext = useCallback(async () => {
    try {
      // Fetch audit history if user has permission
      if (canAccessSensitive() || user.role === 'admin') {
        const auditResponse = await employeeService.getAuditHistory(id);
        if (auditResponse.success) {
          setAuditHistory(auditResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching security context:', error);
    }
  }, [id, canAccessSensitive, user.role]);

  useEffect(() => {
    fetchEmployee();
    fetchSecurityContext();
  }, [fetchEmployee, fetchSecurityContext]);

  const handleEdit = useCallback(() => {
    setEditing(true);
    setErrors({});
  }, []);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setFormData(employee);
    setErrors({});
  }, [employee]);

  const handleSave = useCallback(async () => {
    try {
      // Validate permissions before sending
      const changedFields = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== employee[key]) {
          changedFields[key] = formData[key];
        }
      });

      const validation = validateFieldEdit(changedFields);
      if (!validation.isValid) {
        setErrors({ permission: validation.errors.join(', ') });
        return;
      }

      const response = await employeeService.update(id, changedFields);
      console.log('Update response in component:', response);
      if (response.success) {
        setEmployee(response.data);
        setEditing(false);
        showNotification('Employee updated successfully', 'success');
        setSecurityAlerts(prev => [...prev, {
          severity: 'success',
          message: 'Employee updated successfully'
        }]);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update employee';
      showNotification(errorMessage, 'error');
      setErrors({ 
        submit: errorMessage 
      });
    }
  }, [formData, employee, validateFieldEdit, id, showNotification]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const toggleSensitiveView = useCallback(() => {
    setShowSensitive(prev => !prev);
  }, []);

  const handleAuditDialogOpen = useCallback(() => {
    setShowAuditDialog(true);
  }, []);

  const handleAuditDialogClose = useCallback(() => {
    setShowAuditDialog(false);
  }, []);

  // Memoized computed values for performance
  const changedFields = useMemo(() => {
    if (!employee || !formData) return {};
    const changes = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== employee[key]) {
        changes[key] = formData[key];
      }
    });
    return changes;
  }, [formData, employee]);

  const hasUnsavedChanges = useMemo(() => {
    return Object.keys(changedFields).length > 0;
  }, [changedFields]);

  const securityLevel = useMemo(() => {
    if (!employee) return 'unknown';
    const sensitiveFieldsCount = SENSITIVE_FIELDS.filter(field => 
      employee[field] && canViewField(field)
    ).length;
    return sensitiveFieldsCount > 5 ? 'high' : sensitiveFieldsCount > 2 ? 'medium' : 'low';
  }, [employee, canViewField, SENSITIVE_FIELDS]);

  const renderFieldByCategory = useCallback((category, fields) => {
    const visibleFields = fields.filter(field => canViewField(field));
    
    if (visibleFields.length === 0) {
      return null;
    }

    return (
      <PermissionFieldGroup category={category} targetEmployeeId={id}>
        <Grid container spacing={2}>
          {visibleFields.map(field => (
            <Grid item xs={12} sm={6} lg={4} key={field}>
              <PermissionField fieldName={field} targetEmployeeId={id}>
                <Box position="relative">
                  {renderFieldInput(field)}
                  {SENSITIVE_FIELDS.includes(field) && !canAccessSensitive() && (
                    <Box 
                      position="absolute" 
                      top={0} 
                      left={0} 
                      right={0} 
                      bottom={0}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bgcolor="rgba(0,0,0,0.1)"
                      borderRadius={1}
                    >
                      <Typography variant="body2" color="text.secondary">
                        🔒 RESTRICTED
                      </Typography>
                    </Box>
                  )}
                </Box>
              </PermissionField>
            </Grid>
          ))}
        </Grid>
      </PermissionFieldGroup>
    );
  }, [canViewField, id, formData, handleFieldChange, editing, canEditField, canAccessSensitive, SENSITIVE_FIELDS]);

  const getSelectOptions = useCallback((field) => {
    switch (field) {
      case 'status':
        return [
          { value: 'Active', label: 'Active' },
          { value: 'Inactive', label: 'Inactive' },
          { value: 'Terminated', label: 'Terminated' },
          { value: 'On Leave', label: 'On Leave' }
        ];
      case 'employmentType':
        return [
          { value: 'Full-time', label: 'Full-time' },
          { value: 'Part-time', label: 'Part-time' },
          { value: 'Contract', label: 'Contract' },
          { value: 'Intern', label: 'Intern' }
        ];
      case 'gender':
        return [
          { value: 'Male', label: 'Male' },
          { value: 'Female', label: 'Female' },
          { value: 'Other', label: 'Other' },
          { value: 'Prefer not to say', label: 'Prefer not to say' }
        ];
      case 'maritalStatus':
        return [
          { value: 'Single', label: 'Single' },
          { value: 'Married', label: 'Married' },
          { value: 'Divorced', label: 'Divorced' },
          { value: 'Widowed', label: 'Widowed' }
        ];
      default:
        return [];
    }
  }, []);

  const getFieldPlaceholder = useCallback((field) => {
    const placeholders = {
      firstName: 'Enter first name',
      lastName: 'Enter last name',
      email: 'Enter email address',
      phone: 'Enter phone number',
      address: 'Enter full address',
      city: 'Enter city',
      state: 'Enter state',
      pinCode: 'Enter PIN code',
      emergencyContactName: 'Enter emergency contact name',
      emergencyContactPhone: 'Enter emergency contact phone',
      aadhaarNumber: 'Enter Aadhaar number',
      panNumber: 'Enter PAN number',
      bankName: 'Enter bank name',
      bankAccountNumber: 'Enter account number',
      ifscCode: 'Enter IFSC code',
    };
    return placeholders[field] || `Enter ${formatFieldLabel(field).toLowerCase()}`;
  }, []);

  const renderFieldInput = useCallback((field) => {
    const isDateField = ['hireDate', 'joiningDate', 'confirmationDate', 'dateOfBirth', 'resignationDate', 'lastWorkingDate'].includes(field);
    const isSelectField = ['departmentId', 'positionId', 'managerId', 'status', 'employmentType', 'gender', 'maritalStatus'].includes(field);
    const isSensitiveField = SENSITIVE_FIELDS.includes(field);
    
    let fieldValue = formData[field] || '';
    let displayValue = fieldValue;

    // Handle special field displays
    if (field === 'departmentId' && employee?.department) {
      displayValue = employee.department.name;
    } else if (field === 'positionId' && employee?.position) {
      displayValue = employee.position.title;
    } else if (field === 'managerId' && employee?.manager) {
      displayValue = `${employee.manager.firstName} ${employee.manager.lastName}`;
    }

    // Handle sensitive field masking
    if (isSensitiveField && !showSensitive && !editing && fieldValue) {
      displayValue = '••••••••••••';
    }

    // Date field with proper formatting
    if (isDateField) {
      return (
        <TextField
          fullWidth
          label={formatFieldLabel(field)}
          value={fieldValue ? fieldValue.split('T')[0] : ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          disabled={!editing || !canEditField(field)}
          variant={editing ? "outlined" : "filled"}
          type="date"
          InputLabelProps={{
            shrink: true,
          }}
          InputProps={{
            readOnly: !editing,
            endAdornment: SENSITIVE_FIELDS.includes(field) && (
              <SecurityIndicator fieldName={field} />
            )
          }}
        />
      );
    }

    // Select fields with proper options
    if (isSelectField && editing) {
      return (
        <TextField
          fullWidth
          select
          label={formatFieldLabel(field)}
          value={fieldValue}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          disabled={!canEditField(field)}
          variant="outlined"
          InputProps={{
            endAdornment: SENSITIVE_FIELDS.includes(field) && (
              <SecurityIndicator fieldName={field} />
            )
          }}
        >
          {getSelectOptions(field).map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    // Regular text field
    return (
      <TextField
        fullWidth
        label={formatFieldLabel(field)}
        value={displayValue}
        onChange={(e) => handleFieldChange(field, e.target.value)}
        disabled={!editing || !canEditField(field)}
        variant={editing ? "outlined" : "filled"}
        InputProps={{
          readOnly: !editing,
          endAdornment: SENSITIVE_FIELDS.includes(field) && (
            <SecurityIndicator fieldName={field} />
          )
        }}
        type="text"
        multiline={field === 'address'}
        rows={field === 'address' ? 3 : 1}
        placeholder={getFieldPlaceholder(field)}
      />
    );
  }, [formData, employee, editing, canEditField, SENSITIVE_FIELDS, handleFieldChange, showSensitive, getSelectOptions, getFieldPlaceholder]);

  const formatFieldLabel = (field) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Personal Information
        return renderFieldByCategory('personal', FIELD_CATEGORIES.personal);
      case 1: // Employment Information
        return renderFieldByCategory('employment', FIELD_CATEGORIES.employment);
      case 2: // Contact Information
        return renderFieldByCategory('contact', FIELD_CATEGORIES.contact);
      case 3: // Statutory Information
        return renderFieldByCategory('statutory', FIELD_CATEGORIES.statutory);
      case 4: // Banking Information
        return renderFieldByCategory('banking', FIELD_CATEGORIES.banking);
      case 5: // Salary Information
        return renderFieldByCategory('salary', FIELD_CATEGORIES.salary);
      default:
        return null;
    }
  };

  const renderSecurityControls = () => {
    if (!canAccessSensitive() && user.role !== 'admin') {
      console.log('User cannot access sensitive data. Role:', user.role);
      return null;
    }

    console.log('Rendering security controls. showSensitive:', showSensitive);
    return (
      <Box mb={2}>
        <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Security Controls
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              size="small"
              variant="outlined"
              startIcon={showSensitive ? <VisibilityOffIcon /> : <VisibilityIcon />}
              onClick={() => {
                console.log('Toggling sensitive data. Current state:', showSensitive);
                setShowSensitive(!showSensitive);
              }}
            >
              {showSensitive ? 'Hide' : 'Show'} Sensitive Data
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setShowAuditDialog(true)}
            >
              View Audit History
            </Button>
            <Chip 
              label={`Role: ${user.role}`} 
              color="primary" 
              size="small" 
            />
            <Chip 
              label={`Sensitive Access: ${canAccessSensitive() ? 'Yes' : 'No'}`} 
              color={canAccessSensitive() ? 'success' : 'warning'} 
              size="small" 
            />
          </Box>
        </Paper>
      </Box>
    );
  };

  if (isLocalLoading) {
    return (
      <Box p={{ xs: 1, sm: 2, md: 3 }}>
        <Typography>Loading employee data...</Typography>
      </Box>
    );
  }

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
                whiteSpace: 'pre-line'
              }
            }}
            onClose={() => setSecurityAlerts(prev => prev.filter((_, i) => i !== index))}
          >
            {alert.message}
          </Alert>
        ))}

        {/* Security Controls */}
        {renderSecurityControls()}

        {/* Modern Header */}
        <Box sx={{ mb: 4 }}>
          <Card 
            elevation={0} 
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={3}>
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar 
                    src={employee.photoUrl}
                    sx={{ 
                      width: { xs: 80, md: 100 }, 
                      height: { xs: 80, md: 100 },
                      border: '4px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      fontSize: { xs: '2rem', md: '2.5rem' },
                      fontWeight: 'bold'
                    }}
                  >
                    {employee.firstName?.[0]}{employee.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography 
                      variant="h3" 
                      component="h1" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                        mb: 1
                      }}
                    >
                      {employee.firstName} {employee.lastName}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        opacity: 0.9,
                        fontSize: { xs: '1rem', md: '1.25rem' },
                        mb: 1
                      }}
                    >
                      {employee.position?.title} • {employee.department?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={employee.status} 
                        color={employee.status === 'Active' ? 'success' : 'default'}
                        sx={{ 
                          bgcolor: employee.status === 'Active' ? 'success.main' : 'grey.500',
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                      <Chip 
                        label={`ID: ${employee.employeeId}`}
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    disabled={!canEditField('firstName')}
                    sx={{ 
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: 'white',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.5)',
                        bgcolor: 'rgba(255,255,255,0.1)'
                      },
                      '&:disabled': {
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.3)'
                      }
                    }}
                  >
                    Edit Profile
                  </Button>
                  
                  {(canAccessSensitive() || user.role === 'admin') && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={showSensitive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        onClick={() => setShowSensitive(!showSensitive)}
                        sx={{ 
                          borderColor: 'rgba(255,255,255,0.3)',
                          color: 'white',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: 'rgba(255,255,255,0.5)',
                            bgcolor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        {showSensitive ? 'Hide' : 'Show'} Sensitive
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => setShowAuditDialog(true)}
                        sx={{ 
                          borderColor: 'rgba(255,255,255,0.3)',
                          color: 'white',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: 'rgba(255,255,255,0.5)',
                            bgcolor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        Audit History
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

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
                        <Typography variant="h6" fontWeight={600}>
                          {employee.firstName}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Last Name
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {employee.lastName}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Email Address
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {employee.email}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Phone Number
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {employee.phone || 'Not provided'}
                          </Typography>
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
                        <Typography variant="h6" fontWeight={600}>
                          {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'Not provided'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Gender
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {employee.gender || 'Not specified'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Marital Status
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {employee.maritalStatus || 'Not specified'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Nationality
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {employee.nationality || 'Not specified'}
                        </Typography>
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
                          <Typography variant="h6" fontWeight={600}>
                            {employee.address || 'Not provided'}
                          </Typography>
                          {(employee.city || employee.state || employee.pinCode) && (
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                              {[employee.city, employee.state, employee.pinCode].filter(Boolean).join(', ')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
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
                        <Typography variant="h6" fontWeight={600}>
                          {employee.department?.name || 'Not assigned'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Position
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {employee.position?.title || 'Not assigned'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Hire Date
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'Not provided'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Employment Type
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {employee.employmentType || 'Not specified'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Manager
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : 'No manager assigned'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Work Location
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {employee.workLocation || 'Not specified'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
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
                      <Typography variant="h6" fontWeight={600}>
                        {employee.emergencyContactName || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Contact Phone
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {employee.emergencyContactPhone || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Relationship
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {employee.emergencyContactRelation || 'Not specified'}
                      </Typography>
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
                      <Grid item xs={12} sm={6} key={field}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {showSensitive || canAccessSensitive() 
                              ? (employee[field] || 'Not provided')
                              : '••••••••••••'
                            }
                          </Typography>
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
                        <Typography variant="h6" fontWeight={600}>
                          {employee.bankName || 'Not provided'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Account Number
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {showSensitive || canAccessSensitive() 
                            ? (employee.bankAccountNumber || 'Not provided')
                            : '••••••••••••'
                          }
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          IFSC Code
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {employee.ifscCode || 'Not provided'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Account Holder Name
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {employee.accountHolderName || 'Not provided'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </Box>
        </Card>
      </Box>
    </Box>        <CardContent>
          {/* Permission Errors */}
          {errors.permission && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.permission}
            </Alert>
          )}

          {/* Submit Errors */}
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Alert>
          )}

          {/* Tabs for different sections */}
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ 
              mb: 3,
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              },
            }}
            variant="scrollable"
            scrollButtons="auto"
          </Box>
        </Card>
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
      
      {/* User Account Manager Dialog */}
      <UserAccountManager
        open={showUserAccountManager}
        onClose={() => setShowUserAccountManager(false)}
        employee={employee}
        mode="edit"
        onUpdate={(userData) => {
          showNotification('User account updated successfully', 'success');
          fetchEmployee(); // Refresh employee data
        }}
      />
    </Box>
    </>
  );
}

export default React.memo(EnhancedEmployeeProfile);
