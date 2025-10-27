import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Chip,
  Avatar,
  Button,
  Paper,
  Typography,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  ContactMail as ContactIcon,
  AccountBalance as BankIcon,
  Login as LoginIcon
} from '@mui/icons-material';

// Import our new standardized components
import StandardForm from '../../common/StandardForm';
import {
  StandardTextField,
  StandardSelectField,
  StandardDateField
} from '../../common/FormFields';
import SmartErrorBoundary from '../../common/SmartErrorBoundary';

// Import existing utilities and services
import { useNotification } from '../../../contexts/NotificationContext';
import { validationSchemas } from '../../../hooks/useFormValidation';
import { employeeService } from '../../../services/employee.service';
import { authService } from '../../../services/auth.service';
import enhancedApiService from '../../../services/enhancedApiService';

/**
 * Modernized Employee Form using StandardForm components
 */
const ModernEmployeeForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  // User authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Reference data
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);

  // Form initial data
  const initialFormData = {
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    nationality: 'Indian',
    maritalStatus: '',
    
    // Employment Information
    hireDate: '',
    departmentId: '',
    positionId: '',
    employmentType: 'Full-time',
    workLocation: '',
    joiningDate: '',
    confirmationDate: '',
    probationPeriod: 6,
    noticePeriod: 30,
    managerId: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    
    // Statutory Details
    aadhaarNumber: '',
    panNumber: '',
    uanNumber: '',
    pfNumber: '',
    esiNumber: '',
    
    // Bank Details
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    bankBranch: '',
    accountHolderName: '',
    
    // User Account
    enableLogin: false,
    role: 'employee',
    password: '',
    confirmPassword: '',
    forcePasswordChange: true,

    // Photo
    photoUrl: ''
  };

  // Multi-step form configuration
  const formSteps = [
    {
      label: 'Personal Information',
      icon: <PersonIcon />,
      fields: ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender']
    },
    {
      label: 'Employment Details',
      icon: <WorkIcon />,
      fields: ['hireDate', 'departmentId', 'positionId', 'employmentType', 'managerId']
    },
    {
      label: 'Contact & Emergency',
      icon: <ContactIcon />,
      fields: ['address', 'city', 'state', 'pinCode', 'emergencyContactName', 'emergencyContactPhone']
    },
    {
      label: 'Statutory & Banking',
      icon: <BankIcon />,
      fields: ['aadhaarNumber', 'panNumber', 'bankAccountNumber', 'ifscCode']
    },
    {
      label: 'User Account',
      icon: <LoginIcon />,
      fields: ['enableLogin', 'role', 'password', 'confirmPassword']
    }
  ];

  // Validation schema for the employee form
  const employeeValidationSchema = {
    // Personal Information (Required)
    firstName: validationSchemas.employee.firstName,
    lastName: validationSchemas.employee.lastName,
    email: validationSchemas.employee.email,
    phone: validationSchemas.employee.phone,
    
    // Employment Information (Required)
    hireDate: validationSchemas.employee.hireDate,
    departmentId: validationSchemas.employee.departmentId,
    positionId: validationSchemas.employee.positionId,
    
    // Optional but validated if provided
    aadhaarNumber: validationSchemas.employee.aadhaarNumber,
    panNumber: validationSchemas.employee.panNumber,
    ifscCode: validationSchemas.employee.ifscCode,
    
    // Custom validation for user account
    password: {
      validate: (value, allValues) => {
        if (!allValues.enableLogin) return null;
        if (!value) return 'Password is required when login is enabled';
        if (value.length < 8) return 'Password must be at least 8 characters long';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain uppercase, lowercase, and number';
        }
        return null;
      }
    },
    confirmPassword: {
      validate: (value, allValues) => {
        if (!allValues.enableLogin) return null;
        if (value !== allValues.password) return 'Passwords do not match';
        return null;
      }
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      loadReferenceData();
    }
  }, []);

  // Load reference data
  const loadReferenceData = useCallback(async () => {
    try {
      const [deptResponse, mgrsResponse] = await Promise.all([
        enhancedApiService.get('/employees/departments', {
          fallbackData: [],
          showErrorMessage: false
        }),
        enhancedApiService.get('/employees/managers', {
          fallbackData: [],
          showErrorMessage: false
        })
      ]);
      
      setDepartments(deptResponse || []);
      setManagers(mgrsResponse || []);
      
      // Set available positions (should come from API in real implementation)
      const availablePositions = [
        { value: '492ef285-d16a-4d6d-bedd-2bc6be4a9ab9', label: 'HR Manager' },
        { value: 'b8c1f5df-0723-4792-911a-9f88b78d2552', label: 'Software Developer' },
        { value: 'd3e48711-7935-417e-88f8-13d925533b5e', label: 'System Administrator' }
      ];
      setPositions(availablePositions);
      
    } catch (error) {
      console.error('Error loading reference data:', error);
      showError('Failed to load form data. Some dropdowns may be empty.');
    }
  }, [showError]);

  // Handler functions use correct scope
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm(prev => ({ ...prev, photoUrl: ev.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSalaryChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value
      }
    }));
  };

  // Handle form submission
  const handleSubmit = useCallback(async (formValues) => {
    try {
      // Transform data for API
      const apiData = {
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        email: formValues.email,
        phone: formValues.phone,
        dateOfBirth: formValues.dateOfBirth,
        gender: formValues.gender,
        address: formValues.address,
        city: formValues.city,
        state: formValues.state,
        pinCode: formValues.pinCode,
        nationality: formValues.nationality,
        maritalStatus: formValues.maritalStatus,
        hireDate: formValues.hireDate,
        departmentId: formValues.departmentId,
        positionId: formValues.positionId,
        employmentType: formValues.employmentType,
        workLocation: formValues.workLocation,
        joiningDate: formValues.joiningDate,
        managerId: formValues.managerId,
        emergencyContactName: formValues.emergencyContactName,
        emergencyContactPhone: formValues.emergencyContactPhone,
        emergencyContactRelation: formValues.emergencyContactRelation,
        aadhaarNumber: formValues.aadhaarNumber,
        panNumber: formValues.panNumber,
        uanNumber: formValues.uanNumber,
        pfNumber: formValues.pfNumber,
        esiNumber: formValues.esiNumber,
        bankName: formValues.bankName,
        bankAccountNumber: formValues.bankAccountNumber,
        ifscCode: formValues.ifscCode,
        bankBranch: formValues.bankBranch,
        accountHolderName: formValues.accountHolderName,
        photoUrl: formValues.photoUrl
      };

      // Create employee
      const response = await enhancedApiService.post('/employees', apiData, {
        showSuccessMessage: 'Employee created successfully!',
        operationId: 'create-employee'
      });

      // Create user account if enabled
      if (formValues.enableLogin && response.id) {
        try {
          const userAccountData = {
            role: formValues.role,
            password: formValues.password,
            forcePasswordChange: formValues.forcePasswordChange
          };
          
          await enhancedApiService.post(`/employees/${response.id}/user-account`, userAccountData, {
            showSuccessMessage: 'User account created successfully!',
            operationId: 'create-user-account'
          });
        } catch (userError) {
          console.warn('Employee created but user account failed:', userError);
          showError('Employee created successfully, but user account setup failed. You can configure this later.');
        }
      }

      // Navigate back to employees list after short delay
      setTimeout(() => {
        navigate('/employees');
      }, 2000);

      return { success: true };

    } catch (error) {
      console.error('Error creating employee:', error);
      
      if (error.response?.status === 401) {
        authService.logout();
        navigate('/login');
        throw new Error('Session expired. Please login again.');
      }
      
      throw error;
    }
  }, [navigate, showError]);

  // Auto-save functionality
  const handleAutoSave = useCallback(async (formValues) => {
    try {
      // Save draft to localStorage
      localStorage.setItem('employee-form-draft', JSON.stringify(formValues));
      console.log('Employee form auto-saved to localStorage');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, []);

  // Load draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('employee-form-draft');
      if (draft) {
        const draftData = JSON.parse(draft);
        // You could set this as initial data or prompt user to restore
        console.log('Found employee form draft:', draftData);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);

  // Cancel handler
  const handleCancel = useCallback(() => {
    // Clear draft
    localStorage.removeItem('employee-form-draft');
    navigate('/employees');
  }, [navigate]);

  // Render form fields based on current step
  const renderFormFields = useCallback(({ 
    values, 
    errors, 
    getFieldProps, 
    currentStep 
  }) => {
    const step = formSteps[currentStep];
    if (!step) return null;

    switch (currentStep) {
      case 0: // Personal Information
        return (
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <StandardTextField
              label="First Name"
              required
              {...getFieldProps('firstName')}
            />
            <StandardTextField
              label="Last Name"
              required
              {...getFieldProps('lastName')}
            />
            <StandardTextField
              label="Email Address"
              type="email"
              required
              {...getFieldProps('email')}
            />
            <StandardTextField
              label="Phone Number"
              type="tel"
              required
              formatValue={(value) => {
                // Simple phone formatting
                return value.replace(/\D/g, '').slice(0, 10);
              }}
              {...getFieldProps('phone')}
            />
            <StandardDateField
              label="Date of Birth"
              type="date"
              maxDate={new Date()}
              {...getFieldProps('dateOfBirth')}
            />
            <StandardSelectField
              label="Gender"
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
              ]}
              {...getFieldProps('gender')}
            />
          </Box>
        );

      case 1: // Employment Details
        return (
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <StandardDateField
              label="Hire Date"
              required
              {...getFieldProps('hireDate')}
            />
            <StandardSelectField
              label="Department"
              required
              options={departments.map(dept => ({
                value: dept.id,
                label: dept.name
              }))}
              loading={departments.length === 0}
              {...getFieldProps('departmentId')}
            />
            <StandardSelectField
              label="Position"
              required
              options={positions}
              loading={positions.length === 0}
              {...getFieldProps('positionId')}
            />
            <StandardSelectField
              label="Employment Type"
              options={[
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Contract', label: 'Contract' },
                { value: 'Internship', label: 'Internship' }
              ]}
              {...getFieldProps('employmentType')}
            />
            <StandardSelectField
              label="Reporting Manager"
              options={managers.map(mgr => ({
                value: mgr.id,
                label: `${mgr.firstName} ${mgr.lastName}`
              }))}
              placeholder="Select a manager (optional)"
              {...getFieldProps('managerId')}
            />
          </Box>
        );

      case 2: // Contact & Emergency
        return (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <StandardTextField
              label="Address"
              multiline
              rows={2}
              {...getFieldProps('address')}
            />
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
              <StandardTextField
                label="City"
                {...getFieldProps('city')}
              />
              <StandardTextField
                label="State"
                {...getFieldProps('state')}
              />
              <StandardTextField
                label="PIN Code"
                formatValue={(value) => value.replace(/\D/g, '').slice(0, 6)}
                {...getFieldProps('pinCode')}
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <h3>Emergency Contact</h3>
              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
                <StandardTextField
                  label="Emergency Contact Name"
                  {...getFieldProps('emergencyContactName')}
                />
                <StandardTextField
                  label="Emergency Contact Phone"
                  type="tel"
                  formatValue={(value) => value.replace(/\D/g, '').slice(0, 10)}
                  {...getFieldProps('emergencyContactPhone')}
                />
                <StandardSelectField
                  label="Relationship"
                  options={[
                    { value: 'Parent', label: 'Parent' },
                    { value: 'Spouse', label: 'Spouse' },
                    { value: 'Sibling', label: 'Sibling' },
                    { value: 'Friend', label: 'Friend' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  {...getFieldProps('emergencyContactRelation')}
                />
              </Box>
            </Box>
          </Box>
        );

      case 3: // Statutory & Banking
        return (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Box>
              <h3>Statutory Details</h3>
              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <StandardTextField
                  label="Aadhaar Number"
                  formatValue={(value) => {
                    // Format as XXXX XXXX XXXX
                    const digits = value.replace(/\D/g, '').slice(0, 12);
                    return digits.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3').trim();
                  }}
                  {...getFieldProps('aadhaarNumber')}
                />
                <StandardTextField
                  label="PAN Number"
                  formatValue={(value) => value.toUpperCase().slice(0, 10)}
                  {...getFieldProps('panNumber')}
                />
                <StandardTextField
                  label="UAN Number"
                  {...getFieldProps('uanNumber')}
                />
                <StandardTextField
                  label="PF Number"
                  {...getFieldProps('pfNumber')}
                />
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              <h3>Banking Details</h3>
              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <StandardTextField
                  label="Bank Name"
                  {...getFieldProps('bankName')}
                />
                <StandardTextField
                  label="Account Number"
                  {...getFieldProps('bankAccountNumber')}
                />
                <StandardTextField
                  label="IFSC Code"
                  formatValue={(value) => value.toUpperCase().slice(0, 11)}
                  {...getFieldProps('ifscCode')}
                />
                <StandardTextField
                  label="Bank Branch"
                  {...getFieldProps('bankBranch')}
                />
              </Box>
            </Box>
          </Box>
        );

      case 4: // User Account
        return (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <label>
                <input
                  type="checkbox"
                  checked={values.enableLogin}
                  onChange={(e) => getFieldProps('enableLogin').onChange(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Enable user login for this employee
              </label>
            </Box>

            {values.enableLogin && (
              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <StandardSelectField
                  label="User Role"
                  required
                  options={[
                    { value: 'employee', label: 'Employee' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'hr', label: 'HR' },
                    { value: 'admin', label: 'Admin' }
                  ]}
                  {...getFieldProps('role')}
                />
                <Box /> {/* Empty grid item for spacing */}
                <StandardTextField
                  label="Password"
                  type="password"
                  required
                  showPasswordToggle
                  helperText="Must be at least 8 characters with uppercase, lowercase, and number"
                  {...getFieldProps('password')}
                />
                <StandardTextField
                  label="Confirm Password"
                  type="password"
                  required
                  showPasswordToggle
                  {...getFieldProps('confirmPassword')}
                />
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  }, [departments, positions, managers]);

  // Show authentication error if not logged in
  if (!isAuthenticated) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3, textAlign: 'center' }}>
        <h2>Authentication Required</h2>
        <p>Please login to access the employee creation form.</p>
        <Button
          variant="contained"
          startIcon={<LoginIcon />}
          onClick={() => navigate('/login')}
        >
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <SmartErrorBoundary level="page">
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleCancel}
              variant="outlined"
              sx={{ mr: 2 }}
            >
              Back to Employees
            </Button>
          </Box>
          
          {currentUser && (
            <Chip 
              avatar={<Avatar>{currentUser.firstName?.[0] || 'U'}</Avatar>}
              label={`${currentUser.firstName || ''} ${currentUser.lastName || ''}`}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {/* Standardized Form */}
        <StandardForm
          title="Add New Employee"
          subtitle="Fill in the employee details across multiple steps"
          steps={formSteps}
          initialData={initialFormData}
          validationSchema={employeeValidationSchema}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onAutoSave={handleAutoSave}
          showStepper={true}
          autoSave={true}
          autoSaveInterval={30000}
          submitText="Create Employee"
          cancelText="Cancel"
          maxWidth="lg"
        >
          {renderFormFields}
        </StandardForm>
      </Box>
    </SmartErrorBoundary>
  );
};

export default ModernEmployeeForm;