import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLoading } from '../../../contexts
import { useNotification } from '../../../contexts/NotificationContext';/LoadingContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Divider,
  FormHelperText
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { validateEmployeeForm, transformEmployeeDataForAPI, validateField } from '../utils/employeeValidation';
import { employeeService } from '../services/employee.service';

const ValidatedEmployeeForm = () => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    // Required fields
    firstName: '',
    lastName: '',
    email: '',
    hireDate: '',
    departmentId: '',
    positionId: '',
    
    // Optional personal fields
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    nationality: 'Indian',
    maritalStatus: '',
    
    // Optional employment fields
    employmentType: 'Full-time',
    workLocation: '',
    joiningDate: '',
    confirmationDate: '',
    probationPeriod: 6,
    noticePeriod: 30,
    managerId: '',
    
    // Optional emergency contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    
    // Optional statutory details
    aadhaarNumber: '',
    panNumber: '',
    uanNumber: '',
    pfNumber: '',
    esiNumber: '',
    
    // Optional bank details
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    bankBranch: '',
    accountHolderName: ''
  });
  
  // UI state
  const [errors, setErrors] = useState({});
  // Loading state managed by LoadingContext
  const { isLoading, setLoading } = useLoading();
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  
  // Reference data
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loadingRefData, setLoadingRefData] = useState(true);

  // Load reference data function
  const loadReferenceData = useCallback(async () => {
    try {
      setLoadingRefData(true);
      
      // Load departments, positions, and managers in parallel
      const [deptResponse, mgrsResponse] = await Promise.all([
        employeeService.getDepartments(),
        employeeService.getManagers()
      ]);
      
      setDepartments(deptResponse.data.data || []);
      setManagers(mgrsResponse.data.data || []);
      
      // Set available positions (extracted from existing employee data)
      const availablePositions = [
        { 
          id: '492ef285-d16a-4d6d-bedd-2bc6be4a9ab9', 
          title: 'HR Manager',
          level: 'Senior',
          departmentId: '9cd7308d-ece9-4d6f-a6ea-aba9a2c060ee' // HR Department
        },
        { 
          id: 'b8c1f5df-0723-4792-911a-9f88b78d2552', 
          title: 'Software Developer',
          level: 'Junior',
          departmentId: 'a80ac751-b589-440d-8e5b-9457dd9d9a32' // IT Department
        },
        { 
          id: 'd3e48711-7935-417e-88f8-13d925533b5e', 
          title: 'System Administrator',
          level: 'Senior',
          departmentId: 'a80ac751-b589-440d-8e5b-9457dd9d9a32' // IT Department
        }
      ];
      setPositions(availablePositions);
      
    } catch (error) {
      console.error('Error loading reference data:', error);
      setSubmitError('Failed to load form data. Please refresh the page.');
    } finally {
      setLoadingRefData(false);
    }
  }, []);

  // Load reference data on component mount
  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  // Handle field changes with real-time validation
  const handleFieldChange = useCallback((fieldName, value) => {
    // Update form data
    setFormData(prev => {
      const newFormData = { ...prev, [fieldName]: value };
      
      // Real-time field validation using the new form data
      const fieldError = validateField(fieldName, value, newFormData);
      setErrors(prevErrors => ({
        ...prevErrors,
        [fieldName]: fieldError
      }));
      
      return newFormData;
    });
    
    // Clear submit messages
    setSubmitError('');
    setSubmitSuccess('');
  }, []);

  // Memoize the validation result to prevent calling it on every render
  const isCurrentStepValid = useMemo(() => {
    const validation = validateEmployeeForm(formData);
    
    switch (activeStep) {
      case 0: // Personal Information
        const personalFields = ['firstName', 'lastName', 'email', 'phone'];
        return personalFields.every(field => !validation.errors[field]);
        
      case 1: // Employment Information  
        const employmentFields = ['hireDate', 'departmentId', 'positionId'];
        return employmentFields.every(field => !validation.errors[field]);
        
      case 2: // Additional Details (all optional)
        return true;
        
      case 3: // Statutory & Bank Details (all optional)
        return true;
        
      default:
        return validation.isValid;
    }
  }, [formData, activeStep]);

  // Handle step navigation
  const handleNext = () => {
    // Update errors when actually navigating
    const validation = validateEmployeeForm(formData);
    setErrors(validation.errors);
    
    if (isCurrentStepValid) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setSubmitError('');
      setSubmitSuccess('');
      
      // Final validation
      const validation = validateEmployeeForm(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setSubmitError('Please fix the validation errors before submitting.');
        setLoading(false);
        return;
      }
      
      // Transform data for API
      const apiData = transformEmployeeDataForAPI(formData);
      
      // Submit to backend
      console.log('Submitting employee data:', apiData);
      const response = await employeeService.create(apiData);
      
      setSubmitSuccess(`Employee created successfully! Employee ID: ${response.data.data.employeeId}`);
      
      // Optional: Reset form or navigate
      setTimeout(() => {
        navigate('/employees');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating employee:', error);
      setSubmitError(
        error.response?.data?.message || 
        error.response?.data?.errors?.[0]?.message ||
        'Failed to create employee. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Navigation handler
  const handleBackToEmployees = useCallback(() => {
    navigate('/employees');
  }, [navigate]);

  // Step definitions
  const steps = [
    {
      label: 'Personal Information',
      description: 'Basic personal details',
    },
    {
      label: 'Employment Information', 
      description: 'Job-related information',
    },
    {
      label: 'Additional Details',
      description: 'Contact and personal details',
    },
    {
      label: 'Statutory & Banking',
      description: 'Government and bank details',
    }
  ];

  if (loadingRefData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading form data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToEmployees}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Back to Employees
          </Button>
          <Typography variant="h4" component="h1">
            Add New Employee
          </Typography>
        </Box>
        
        {/* Progress Messages */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        
        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {submitSuccess}
          </Alert>
        )}
      </Paper>

      {/* Stepper Form */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="h6">{step.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ mt: 2, mb: 2 }}>
                  {index === 0 && (
                    <PersonalInformationStep 
                      formData={formData}
                      errors={errors}
                      onChange={handleFieldChange}
                    />
                  )}
                  {index === 1 && (
                    <EmploymentInformationStep
                      formData={formData}
                      errors={errors}
                      onChange={handleFieldChange}
                      departments={departments}
                      positions={positions}
                      managers={managers}
                    />
                  )}
                  {index === 2 && (
                    <AdditionalDetailsStep
                      formData={formData}
                      errors={errors}
                      onChange={handleFieldChange}
                    />
                  )}
                  {index === 3 && (
                    <StatutoryBankingStep
                      formData={formData}
                      errors={errors}
                      onChange={handleFieldChange}
                    />
                  )}
                </Box>
                
                {/* Step Navigation */}
                <Box sx={{ mb: 2 }}>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                  {index === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading || !isCurrentStepValid}
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      {loading ? 'Creating...' : 'Create Employee'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!isCurrentStepValid}
                      endIcon={<ArrowForwardIcon />}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Box>
  );
};

// Personal Information Step Component
const PersonalInformationStep = ({ formData, errors, onChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="First Name *"
        value={formData.firstName}
        onChange={(e) => onChange('firstName', e.target.value)}
        error={!!errors.firstName}
        helperText={errors.firstName}
        required
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Last Name *"
        value={formData.lastName}
        onChange={(e) => onChange('lastName', e.target.value)}
        error={!!errors.lastName}
        helperText={errors.lastName}
        required
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Email Address *"
        type="email"
        value={formData.email}
        onChange={(e) => onChange('email', e.target.value)}
        error={!!errors.email}
        helperText={errors.email}
        required
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Phone Number"
        value={formData.phone}
        onChange={(e) => onChange('phone', e.target.value)}
        error={!!errors.phone}
        helperText={errors.phone || 'Format: 10-15 digits only'}
        placeholder="9876543210"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Date of Birth"
        type="date"
        value={formData.dateOfBirth}
        onChange={(e) => onChange('dateOfBirth', e.target.value)}
        error={!!errors.dateOfBirth}
        helperText={errors.dateOfBirth}
        InputLabelProps={{ shrink: true }}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth error={!!errors.gender}>
        <InputLabel>Gender</InputLabel>
        <Select
          value={formData.gender}
          onChange={(e) => onChange('gender', e.target.value)}
          label="Gender"
        >
          <MenuItem value="">Select Gender</MenuItem>
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </Select>
        {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
      </FormControl>
    </Grid>
  </Grid>
);

// Employment Information Step Component  
const EmploymentInformationStep = ({ formData, errors, onChange, departments, positions, managers }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Hire Date *"
        type="date"
        value={formData.hireDate}
        onChange={(e) => onChange('hireDate', e.target.value)}
        error={!!errors.hireDate}
        helperText={errors.hireDate}
        required
        InputLabelProps={{ shrink: true }}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth required error={!!errors.departmentId}>
        <InputLabel>Department *</InputLabel>
        <Select
          value={formData.departmentId}
          onChange={(e) => onChange('departmentId', e.target.value)}
          label="Department *"
        >
          <MenuItem value="">Select Department</MenuItem>
          {departments.map((dept) => (
            <MenuItem key={dept.id} value={dept.id}>
              {dept.name}
            </MenuItem>
          ))}
        </Select>
        {errors.departmentId && <FormHelperText>{errors.departmentId}</FormHelperText>}
      </FormControl>
    </Grid>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth required error={!!errors.positionId}>
        <InputLabel>Position *</InputLabel>
        <Select
          value={formData.positionId}
          onChange={(e) => onChange('positionId', e.target.value)}
          label="Position *"
        >
          <MenuItem value="">Select Position</MenuItem>
          {positions.map((pos) => (
            <MenuItem key={pos.id} value={pos.id}>
              {pos.title}
            </MenuItem>
          ))}
        </Select>
        {errors.positionId && <FormHelperText>{errors.positionId}</FormHelperText>}
      </FormControl>
    </Grid>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth error={!!errors.employmentType}>
        <InputLabel>Employment Type</InputLabel>
        <Select
          value={formData.employmentType}
          onChange={(e) => onChange('employmentType', e.target.value)}
          label="Employment Type"
        >
          <MenuItem value="Full-time">Full-time</MenuItem>
          <MenuItem value="Part-time">Part-time</MenuItem>
          <MenuItem value="Contract">Contract</MenuItem>
          <MenuItem value="Intern">Intern</MenuItem>
        </Select>
        {errors.employmentType && <FormHelperText>{errors.employmentType}</FormHelperText>}
      </FormControl>
    </Grid>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth error={!!errors.managerId}>
        <InputLabel>Reporting Manager</InputLabel>
        <Select
          value={formData.managerId}
          onChange={(e) => onChange('managerId', e.target.value)}
          label="Reporting Manager"
        >
          <MenuItem value="">No Manager</MenuItem>
          {managers.map((mgr) => (
            <MenuItem key={mgr.id} value={mgr.id}>
              {mgr.firstName} {mgr.lastName}
            </MenuItem>
          ))}
        </Select>
        {errors.managerId && <FormHelperText>{errors.managerId}</FormHelperText>}
      </FormControl>
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Work Location"
        value={formData.workLocation}
        onChange={(e) => onChange('workLocation', e.target.value)}
        error={!!errors.workLocation}
        helperText={errors.workLocation}
        placeholder="e.g., Mumbai Office"
      />
    </Grid>
  </Grid>
);

// Additional Details Step Component
const AdditionalDetailsStep = ({ formData, errors, onChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>Address Information</Typography>
    </Grid>
    <Grid item xs={12}>
      <TextField
        fullWidth
        label="Address"
        multiline
        rows={2}
        value={formData.address}
        onChange={(e) => onChange('address', e.target.value)}
        error={!!errors.address}
        helperText={errors.address}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="City"
        value={formData.city}
        onChange={(e) => onChange('city', e.target.value)}
        error={!!errors.city}
        helperText={errors.city}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="State"
        value={formData.state}
        onChange={(e) => onChange('state', e.target.value)}
        error={!!errors.state}
        helperText={errors.state}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="PIN Code"
        value={formData.pinCode}
        onChange={(e) => onChange('pinCode', e.target.value)}
        error={!!errors.pinCode}
        helperText={errors.pinCode || 'Format: 6 digits'}
        placeholder="400001"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth error={!!errors.maritalStatus}>
        <InputLabel>Marital Status</InputLabel>
        <Select
          value={formData.maritalStatus}
          onChange={(e) => onChange('maritalStatus', e.target.value)}
          label="Marital Status"
        >
          <MenuItem value="">Select Status</MenuItem>
          <MenuItem value="Single">Single</MenuItem>
          <MenuItem value="Married">Married</MenuItem>
          <MenuItem value="Divorced">Divorced</MenuItem>
          <MenuItem value="Widowed">Widowed</MenuItem>
        </Select>
        {errors.maritalStatus && <FormHelperText>{errors.maritalStatus}</FormHelperText>}
      </FormControl>
    </Grid>
    
    <Grid item xs={12}>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
    </Grid>
    <Grid item xs={12} sm={4}>
      <TextField
        fullWidth
        label="Emergency Contact Name"
        value={formData.emergencyContactName}
        onChange={(e) => onChange('emergencyContactName', e.target.value)}
        error={!!errors.emergencyContactName}
        helperText={errors.emergencyContactName}
      />
    </Grid>
    <Grid item xs={12} sm={4}>
      <TextField
        fullWidth
        label="Emergency Contact Phone"
        value={formData.emergencyContactPhone}
        onChange={(e) => onChange('emergencyContactPhone', e.target.value)}
        error={!!errors.emergencyContactPhone}
        helperText={errors.emergencyContactPhone}
        placeholder="9876543210"
      />
    </Grid>
    <Grid item xs={12} sm={4}>
      <TextField
        fullWidth
        label="Relationship"
        value={formData.emergencyContactRelation}
        onChange={(e) => onChange('emergencyContactRelation', e.target.value)}
        error={!!errors.emergencyContactRelation}
        helperText={errors.emergencyContactRelation}
        placeholder="e.g., Spouse, Parent"
      />
    </Grid>
  </Grid>
);

// Statutory & Banking Step Component
const StatutoryBankingStep = ({ formData, errors, onChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>Statutory Details (India)</Typography>
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Aadhaar Number"
        value={formData.aadhaarNumber}
        onChange={(e) => onChange('aadhaarNumber', e.target.value)}
        error={!!errors.aadhaarNumber}
        helperText={errors.aadhaarNumber || 'Format: 12 digits'}
        placeholder="123456789012"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="PAN Number"
        value={formData.panNumber}
        onChange={(e) => onChange('panNumber', e.target.value.toUpperCase())}
        error={!!errors.panNumber}
        helperText={errors.panNumber || 'Format: ABCDE1234F'}
        placeholder="ABCDE1234F"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="UAN Number"
        value={formData.uanNumber}
        onChange={(e) => onChange('uanNumber', e.target.value)}
        error={!!errors.uanNumber}
        helperText={errors.uanNumber}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="PF Number"
        value={formData.pfNumber}
        onChange={(e) => onChange('pfNumber', e.target.value)}
        error={!!errors.pfNumber}
        helperText={errors.pfNumber}
      />
    </Grid>
    
    <Grid item xs={12}>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" gutterBottom>Banking Details</Typography>
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Bank Name"
        value={formData.bankName}
        onChange={(e) => onChange('bankName', e.target.value)}
        error={!!errors.bankName}
        helperText={errors.bankName}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Account Number"
        value={formData.bankAccountNumber}
        onChange={(e) => onChange('bankAccountNumber', e.target.value)}
        error={!!errors.bankAccountNumber}
        helperText={errors.bankAccountNumber}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="IFSC Code"
        value={formData.ifscCode}
        onChange={(e) => onChange('ifscCode', e.target.value.toUpperCase())}
        error={!!errors.ifscCode}
        helperText={errors.ifscCode || 'Format: SBIN0000123'}
        placeholder="SBIN0000123"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Account Holder Name"
        value={formData.accountHolderName}
        onChange={(e) => onChange('accountHolderName', e.target.value)}
        error={!!errors.accountHolderName}
        helperText={errors.accountHolderName}
      />
    </Grid>
  </Grid>
);

export default ValidatedEmployeeForm;
