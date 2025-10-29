import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Box,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  ContactPhone as ContactIcon,
  AccountBalance as BankIcon,
  Security as SecurityIcon,
  AttachMoney as MoneyIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { validateEmployeeForm, transformEmployeeDataForAPI, validateField } from '../../../utils/employeeValidation';
import { employeeService } from '../../../services/employee.service';
import { useAuth } from '../../../contexts/AuthContext';
import PhotoUpload from '../../common/PhotoUpload';

// Utility function for date formatting
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};

const EnhancedEmployeeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  
  // Employee data
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    // Required fields
    firstName: '',
    lastName: '',
    email: '',
    hireDate: '',
    departmentId: '',
    positionId: '',
    
    // Optional fields
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    nationality: 'Indian',
    maritalStatus: '',
    employmentType: 'Full-time',
    workLocation: '',
    joiningDate: '',
    confirmationDate: '',
    resignationDate: '',
    lastWorkingDate: '',
    probationPeriod: 6,
    noticePeriod: 30,
    managerId: '',
    
    // Contact info
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    
    // Statutory info
    aadhaarNumber: '',
    panNumber: '',
    uanNumber: '',
    pfNumber: '',
    esiNumber: '',
    
    // Banking info
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    bankBranch: '',
    accountHolderName: '',
    
    // Comprehensive Compensation (matching EmployeeForm structure)
    salary: {
      // Basic Salary Components
      basicSalary: '',
      currency: 'INR',
      payFrequency: 'Monthly',
      effectiveFrom: '',
      
      // Allowances
      allowances: {
        hra: '',
        transport: '',
        medical: '',
        food: '',
        communication: '',
        special: '',
        other: ''
      },
      
      // Deductions
      deductions: {
        pf: '',
        professionalTax: '',
        incomeTax: '',
        esi: '',
        other: ''
      },
      
      // Benefits
      benefits: {
        bonus: '',
        incentive: '',
        overtime: ''
      },
      
      // Tax Information
      taxRegime: 'Old',
      salaryNotes: ''
    },
    
    // Status
    status: 'Active',
    isActive: true
  });
  
  // Validation
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  
  // Metadata
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  
  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');

  // Load employee data
  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await employeeService.get(id);
        const employee = response.data || response;
        
        setOriginalData(employee);
        
        // Extract IDs, handling both direct IDs and nested objects
        const extractId = (directId, nestedObj) => {
          if (directId) return directId;
          if (nestedObj && nestedObj.id) return nestedObj.id;
          return '';
        };
        
        // Build form data, ensuring we use the ID fields correctly
        const loadedFormData = {
          // Personal Information
          firstName: employee.firstName || '',
          lastName: employee.lastName || '',
          email: employee.email || '',
          phone: employee.phone || '',
          dateOfBirth: formatDateForInput(employee.dateOfBirth),
          gender: employee.gender || '',
          address: employee.address || '',
          city: employee.city || '',
          state: employee.state || '',
          pinCode: employee.pinCode || '',
          nationality: employee.nationality || 'Indian',
          maritalStatus: employee.maritalStatus || '',
          
          // Employment Information
          employeeId: employee.employeeId || '',
          hireDate: formatDateForInput(employee.hireDate),
          departmentId: extractId(employee.departmentId, employee.department),
          positionId: extractId(employee.positionId, employee.position),
          employmentType: employee.employmentType || 'Full-time',
          workLocation: employee.workLocation || '',
          joiningDate: formatDateForInput(employee.joiningDate),
          confirmationDate: formatDateForInput(employee.confirmationDate),
          probationPeriod: employee.probationPeriod || 6,
          noticePeriod: employee.noticePeriod || 30,
          managerId: extractId(employee.managerId, employee.manager),
          
          // Emergency Contact
          emergencyContactName: employee.emergencyContactName || '',
          emergencyContactPhone: employee.emergencyContactPhone || '',
          emergencyContactRelation: employee.emergencyContactRelation || '',
          
          // Statutory Details
          aadhaarNumber: employee.aadhaarNumber || '',
          panNumber: employee.panNumber || '',
          uanNumber: employee.uanNumber || '',
          pfNumber: employee.pfNumber || '',
          esiNumber: employee.esiNumber || '',
          
          // Bank Details
          bankName: employee.bankName || '',
          bankAccountNumber: employee.bankAccountNumber || '',
          ifscCode: employee.ifscCode || '',
          bankBranch: employee.bankBranch || '',
          accountHolderName: employee.accountHolderName || '',
          
          // Comprehensive Compensation (extract from salaryStructure or salary)
          salary: {
            basicSalary: employee.salaryStructure?.basicSalary || employee.salary?.basicSalary || '',
            currency: employee.salaryStructure?.currency || employee.salary?.currency || 'INR',
            payFrequency: employee.salaryStructure?.payFrequency || employee.salary?.payFrequency || 'Monthly',
            effectiveFrom: formatDateForInput(
              employee.salaryStructure?.effectiveFrom || 
              employee.salary?.effectiveFrom || 
              employee.salary?.effectiveDate ||
              employee.hireDate ||
              employee.joiningDate
            ),
            
            allowances: {
              hra: employee.salaryStructure?.allowances?.hra || employee.salary?.allowances?.hra || '',
              transport: employee.salaryStructure?.allowances?.transport || employee.salary?.allowances?.transport || '',
              medical: employee.salaryStructure?.allowances?.medical || employee.salary?.allowances?.medical || '',
              food: employee.salaryStructure?.allowances?.food || employee.salary?.allowances?.food || '',
              communication: employee.salaryStructure?.allowances?.communication || employee.salary?.allowances?.communication || '',
              special: employee.salaryStructure?.allowances?.special || employee.salary?.allowances?.special || '',
              other: employee.salaryStructure?.allowances?.other || employee.salary?.allowances?.other || ''
            },
            
            deductions: {
              pf: employee.salaryStructure?.deductions?.pf || employee.salary?.deductions?.pf || '',
              professionalTax: employee.salaryStructure?.deductions?.professionalTax || employee.salary?.deductions?.professionalTax || '',
              incomeTax: employee.salaryStructure?.deductions?.incomeTax || employee.salary?.deductions?.incomeTax || '',
              esi: employee.salaryStructure?.deductions?.esi || employee.salary?.deductions?.esi || '',
              other: employee.salaryStructure?.deductions?.other || employee.salary?.deductions?.other || ''
            },
            
            benefits: {
              bonus: employee.salaryStructure?.benefits?.bonus || employee.salary?.benefits?.bonus || '',
              incentive: employee.salaryStructure?.benefits?.incentive || employee.salary?.benefits?.incentive || '',
              overtime: employee.salaryStructure?.benefits?.overtime || employee.salary?.benefits?.overtime || ''
            },
            
            taxRegime: employee.salaryStructure?.taxRegime || employee.salary?.taxRegime || 'Old',
            salaryNotes: employee.salaryStructure?.salaryNotes || employee.salary?.salaryNotes || ''
          },
          
          // Status
          status: employee.status || 'Active',
          isActive: employee.status === 'Active'
        };
        
        setFormData(loadedFormData);
        
        // Set photo preview with full URL
        if (employee.photoUrl) {
          const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
          const photoUrl = employee.photoUrl.startsWith('http') 
            ? employee.photoUrl 
            : `${baseUrl}${employee.photoUrl}`;
          setPhotoPreview(photoUrl);
        }
        
      } catch (err) {
        console.error('Error loading employee:', err);
        setError('Failed to load employee data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadEmployee();
    }
  }, [id]);

  // Load metadata
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setMetadataLoading(true);
        const [deptResponse, posResponse, managersResponse] = await Promise.all([
          employeeService.getDepartments(),
          employeeService.getPositions(),
          employeeService.getManagers()
        ]);
        
        // Extract data from nested response structure: response.data.data
        const departmentsData = Array.isArray(deptResponse.data?.data) 
          ? deptResponse.data.data 
          : (Array.isArray(deptResponse.data) ? deptResponse.data : []);
          
        const positionsData = Array.isArray(posResponse.data?.data) 
          ? posResponse.data.data 
          : (Array.isArray(posResponse.data) ? posResponse.data : []);
          
        const managersData = Array.isArray(managersResponse.data?.data) 
          ? managersResponse.data.data 
          : (Array.isArray(managersResponse.data) ? managersResponse.data : []);
        
        setDepartments(departmentsData);
        setPositions(positionsData);
        setManagers(managersData);
      } catch (err) {
        console.error('Error loading metadata:', err);
        // Set empty arrays as fallback
        setDepartments([]);
        setPositions([]);
        setManagers([]);
      } finally {
        setMetadataLoading(false);
      }
    };

    loadMetadata();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (!saving && !metadataLoading) {
          handleSave();
        }
      }
      // Escape to cancel
      else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [saving, metadataLoading, formData]);

  // Check for unsaved changes
  useEffect(() => {
    if (originalData && Object.keys(formData).length > 0) {
      // Helper to extract ID from either direct ID or nested object
      const extractId = (directId, nestedObj) => {
        if (directId) return directId;
        if (nestedObj && nestedObj.id) return nestedObj.id;
        return '';
      };
      
      // Build the original form data in the same way we load it
      const originalFormData = {
        firstName: originalData.firstName || '',
        lastName: originalData.lastName || '',
        email: originalData.email || '',
        phone: originalData.phone || '',
        dateOfBirth: formatDateForInput(originalData.dateOfBirth),
        gender: originalData.gender || '',
        address: originalData.address || '',
        city: originalData.city || '',
        state: originalData.state || '',
        pinCode: originalData.pinCode || '',
        nationality: originalData.nationality || 'Indian',
        maritalStatus: originalData.maritalStatus || '',
        employeeId: originalData.employeeId || '',
        hireDate: formatDateForInput(originalData.hireDate),
        departmentId: extractId(originalData.departmentId, originalData.department),
        positionId: extractId(originalData.positionId, originalData.position),
        employmentType: originalData.employmentType || 'Full-time',
        workLocation: originalData.workLocation || '',
        joiningDate: formatDateForInput(originalData.joiningDate),
        confirmationDate: formatDateForInput(originalData.confirmationDate),
        probationPeriod: originalData.probationPeriod || 6,
        noticePeriod: originalData.noticePeriod || 30,
        managerId: extractId(originalData.managerId, originalData.manager),
        emergencyContactName: originalData.emergencyContactName || '',
        emergencyContactPhone: originalData.emergencyContactPhone || '',
        emergencyContactRelation: originalData.emergencyContactRelation || '',
        aadhaarNumber: originalData.aadhaarNumber || '',
        panNumber: originalData.panNumber || '',
        uanNumber: originalData.uanNumber || '',
        pfNumber: originalData.pfNumber || '',
        esiNumber: originalData.esiNumber || '',
        bankName: originalData.bankName || '',
        bankAccountNumber: originalData.bankAccountNumber || '',
        ifscCode: originalData.ifscCode || '',
        bankBranch: originalData.bankBranch || '',
        accountHolderName: originalData.accountHolderName || '',
        
        salary: {
          basicSalary: originalData.salaryStructure?.basicSalary || originalData.salary?.basicSalary || '',
          currency: originalData.salaryStructure?.currency || originalData.salary?.currency || 'INR',
          payFrequency: originalData.salaryStructure?.payFrequency || originalData.salary?.payFrequency || 'Monthly',
          effectiveFrom: formatDateForInput(
            originalData.salaryStructure?.effectiveFrom || 
            originalData.salary?.effectiveFrom || 
            originalData.salary?.effectiveDate ||
            originalData.hireDate ||
            originalData.joiningDate
          ),
          
          allowances: {
            hra: originalData.salaryStructure?.allowances?.hra || originalData.salary?.allowances?.hra || '',
            transport: originalData.salaryStructure?.allowances?.transport || originalData.salary?.allowances?.transport || '',
            medical: originalData.salaryStructure?.allowances?.medical || originalData.salary?.allowances?.medical || '',
            food: originalData.salaryStructure?.allowances?.food || originalData.salary?.allowances?.food || '',
            communication: originalData.salaryStructure?.allowances?.communication || originalData.salary?.allowances?.communication || '',
            special: originalData.salaryStructure?.allowances?.special || originalData.salary?.allowances?.special || '',
            other: originalData.salaryStructure?.allowances?.other || originalData.salary?.allowances?.other || ''
          },
          
          deductions: {
            pf: originalData.salaryStructure?.deductions?.pf || originalData.salary?.deductions?.pf || '',
            professionalTax: originalData.salaryStructure?.deductions?.professionalTax || originalData.salary?.deductions?.professionalTax || '',
            incomeTax: originalData.salaryStructure?.deductions?.incomeTax || originalData.salary?.deductions?.incomeTax || '',
            esi: originalData.salaryStructure?.deductions?.esi || originalData.salary?.deductions?.esi || '',
            other: originalData.salaryStructure?.deductions?.other || originalData.salary?.deductions?.other || ''
          },
          
          benefits: {
            bonus: originalData.salaryStructure?.benefits?.bonus || originalData.salary?.benefits?.bonus || '',
            incentive: originalData.salaryStructure?.benefits?.incentive || originalData.salary?.benefits?.incentive || '',
            overtime: originalData.salaryStructure?.benefits?.overtime || originalData.salary?.benefits?.overtime || ''
          },
          
          taxRegime: originalData.salaryStructure?.taxRegime || originalData.salary?.taxRegime || 'Old',
          salaryNotes: originalData.salaryStructure?.salaryNotes || originalData.salary?.salaryNotes || ''
        },
        
        status: originalData.status || 'Active',
        isActive: originalData.status === 'Active'
      };
      
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, originalData]);

  // Form handlers
  const handleInputChange = (field, value) => {
    // Handle nested field paths like 'salary.basicSalary' or 'salary.allowances.hra'
    if (field.includes('.')) {
      const keys = field.split('.');
      setFormData(prev => {
        const updated = { ...prev };
        let current = updated;
        
        // Navigate to the nested object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          } else {
            current[keys[i]] = { ...current[keys[i]] };
          }
          current = current[keys[i]];
        }
        
        // Set the value
        current[keys[keys.length - 1]] = value;
        return updated;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Real-time validation
    const fieldValidation = validateField(field, value, formData);
    setFieldErrors(prev => ({
      ...prev,
      [field]: fieldValidation
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Validate form
      const validation = validateEmployeeForm(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setError('Please fix the validation errors before saving.');
        
        // Scroll to top to show error message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // Transform data for API
      const apiData = transformEmployeeDataForAPI(formData);
      apiData.status = formData.isActive ? 'Active' : 'Inactive';
      
      console.log('Sending to API:', apiData);
      console.log('Form data before transform:', formData);
      
      // Update employee
      await employeeService.update(id, apiData);
      
      setSuccess('Employee updated successfully!');
      setValidationErrors({});
      
      // Navigate back to employee list after successful update
      setTimeout(() => {
        navigate('/employees');
      }, 1500);
      
    } catch (err) {
      console.error('Error updating employee:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Show detailed error message
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to update employee. Please try again.';
      
      // If there are validation errors from backend, show them
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Transform array of error objects into field: message object
        const backendErrors = err.response.data.errors.reduce((acc, error) => {
          // Handle both object format {field, message} and string format
          if (typeof error === 'object' && error.field && error.message) {
            acc[error.field] = error.message;
          } else if (typeof error === 'string') {
            acc[error] = error;
          }
          return acc;
        }, {});
        
        setValidationErrors(backendErrors);
        setError(`Validation failed: ${errorMessage}`);
      } else {
        setError(errorMessage);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await employeeService.delete(id);
      setSuccess('Employee deleted successfully!');
      setTimeout(() => {
        navigate('/employees');
      }, 1500);
    } catch (err) {
      setError('Failed to delete employee. Please try again.');
    }
    setDeleteDialogOpen(false);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/employees');
      }
    } else {
      navigate('/employees');
    }
  };

  // Steps for the form
  const steps = [
    {
      label: 'Basic Information',
      icon: <PersonIcon />,
      fields: ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender', 'nationality', 'maritalStatus']
    },
    {
      label: 'Employment Details',
      icon: <WorkIcon />,
      fields: ['hireDate', 'departmentId', 'positionId', 'managerId', 'employmentType', 'workLocation', 'joiningDate', 'confirmationDate', 'resignationDate', 'lastWorkingDate', 'probationPeriod', 'noticePeriod']
    },
    {
      label: 'Contact & Address',
      icon: <ContactIcon />,
      fields: ['address', 'city', 'state', 'pinCode', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation']
    },
    {
      label: 'Statutory Information',
      icon: <SecurityIcon />,
      fields: ['aadhaarNumber', 'panNumber', 'uanNumber', 'pfNumber', 'esiNumber']
    },
    {
      label: 'Banking Details',
      icon: <BankIcon />,
      fields: ['bankName', 'bankAccountNumber', 'ifscCode', 'bankBranch', 'accountHolderName']
    }
  ];

  // Add Compensation step for admin/HR only
  if (user?.role === 'admin' || user?.role === 'hr') {
    steps.push({
      label: 'Compensation',
      icon: <MoneyIcon />,
      fields: [
        // Basic salary info
        'salary.basicSalary', 'salary.currency', 'salary.payFrequency', 'salary.effectiveFrom',
        // Allowances
        'salary.allowances.hra', 'salary.allowances.transport', 'salary.allowances.medical',
        'salary.allowances.food', 'salary.allowances.communication', 'salary.allowances.special', 'salary.allowances.other',
        // Deductions
        'salary.deductions.pf', 'salary.deductions.professionalTax', 'salary.deductions.incomeTax',
        'salary.deductions.esi', 'salary.deductions.other',
        // Benefits
        'salary.benefits.bonus', 'salary.benefits.incentive', 'salary.benefits.overtime',
        // Tax info
        'salary.taxRegime', 'salary.salaryNotes'
      ],
      restrictedToRoles: ['admin', 'hr']
    });
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4 }}>
      <Container maxWidth="lg">
        {/* Modern Header Card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            mb: 3,
            overflow: 'visible',
            background: 'linear-gradient(to bottom, #ffffff, #f8fafc)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar
                  src={photoPreview}
                  sx={{ 
                    width: 80, 
                    height: 80,
                    border: '4px solid #e5e7eb',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)',
                  }}
                >
                  {formData.firstName?.[0]}{formData.lastName?.[0]}
                </Avatar>
              </Grid>
              
              <Grid item xs>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: { xs: '1.5rem', md: '2rem' }
                  }}
                >
                  Edit Employee: {formData.firstName} {formData.lastName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {originalData?.employeeId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">•</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData.email}
                  </Typography>
                </Box>
                <Chip 
                  label={formData.isActive ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: formData.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: formData.isActive ? '#10b981' : '#ef4444',
                    border: '1px solid',
                    borderColor: formData.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                  }}
                />
              </Grid>
              
              <Grid item>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={user?.role !== 'admin'}
                    sx={{
                      borderColor: '#fecaca',
                      color: '#ef4444',
                      '&:hover': {
                        borderColor: '#ef4444',
                        bgcolor: 'rgba(239, 68, 68, 0.05)'
                      }
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    sx={{
                      borderColor: '#cbd5e1',
                      color: '#64748b',
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
                    disabled={saving}
                    sx={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
                      },
                      '&:disabled': {
                        bgcolor: '#e5e7eb',
                        color: '#9ca3af'
                      }
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* Alerts */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              borderRadius: 2,
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }} 
            onClose={() => {
              setError('');
              setValidationErrors({});
            }}
          >
            <Typography variant="body1" fontWeight={600} gutterBottom>
              {error}
            </Typography>
            {Object.keys(validationErrors).length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Please fix the following {Object.keys(validationErrors).length} field(s):
                </Typography>
                <Box component="ul" sx={{ m: 1, pl: 2 }}>
                  {Object.entries(validationErrors).map(([field, message]) => {
                    // Format field name for better readability
                    const formattedField = field
                      .replace(/salary\./g, 'Salary › ')
                      .replace(/allowances\./g, 'Allowances › ')
                      .replace(/deductions\./g, 'Deductions › ')
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase())
                      .trim();
                    
                    return (
                      <li key={field}>
                        <Typography variant="body2" sx={{ py: 0.5 }}>
                          <strong style={{ color: '#dc2626' }}>{formattedField}:</strong> {message}
                        </Typography>
                      </li>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Alert>
        )}
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2, 
              borderRadius: 2,
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }} 
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2, 
              borderRadius: 2,
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}
          >
            You have unsaved changes. Don't forget to save before leaving this page.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Photo Upload */}
          <Grid item xs={12} md={4}>
            <Card 
              elevation={0} 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#1e293b'
                }}
              >
                Profile Photo
              </Typography>
              <PhotoUpload
                employeeId={id}
                currentPhotoUrl={originalData?.photoUrl}
                onUploadSuccess={(data) => {
                  setPhotoPreview(data.photoUrl ? `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}${data.photoUrl}` : '');
                  setSuccess('Photo updated successfully!');
                }}
                onUploadError={(error) => {
                  setError(error.message || 'Failed to upload photo');
                }}
                size={120}
              />
            </Card>

            {/* Employee Status */}
            <Card 
              elevation={0} 
              sx={{ 
                p: 3, 
                mt: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#1e293b'
                }}
              >
                Employee Status
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#6366f1',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        bgcolor: '#6366f1',
                      },
                    }}
                  />
                }
                label={formData.isActive ? 'Active' : 'Inactive'}
                sx={{
                  '& .MuiFormControlLabel-label': {
                    fontWeight: 500,
                    color: formData.isActive ? '#10b981' : '#64748b'
                  }
                }}
              />
            </Card>
          </Grid>

          {/* Form Steps */}
          <Grid item xs={12} md={8}>
            <Card 
              elevation={0} 
              sx={{ 
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
            {metadataLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
              </Box>
            ) : (
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      icon={step.icon}
                      onClick={() => setActiveStep(index)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {step.label}
                  </StepLabel>
                  <StepContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {step.fields.map((field) => {
                        const isRequired = ['firstName', 'lastName', 'email', 'hireDate', 'departmentId', 'positionId'].includes(field);
                        
                        if (field === 'departmentId') {
                          return (
                            <Grid item xs={12} sm={6} key={field}>
                              <FormControl fullWidth error={!!fieldErrors[field]}>
                                <InputLabel required={isRequired}>Department</InputLabel>
                                <Select
                                  value={formData[field] || ''}
                                  onChange={(e) => handleInputChange(field, e.target.value)}
                                  label="Department"
                                >
                                  <MenuItem value="">
                                    <em>Select Department</em>
                                  </MenuItem>
                                  {Array.isArray(departments) ? departments.map((dept) => (
                                    <MenuItem key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </MenuItem>
                                  )) : []}
                                </Select>
                                {fieldErrors[field] && (
                                  <Typography variant="caption" color="error">
                                    {fieldErrors[field]}
                                  </Typography>
                                )}
                              </FormControl>
                            </Grid>
                          );
                        }
                        
                        if (field === 'positionId') {
                          // Filter positions by selected department (cascading filter)
                          const filteredPositions = formData.departmentId
                            ? positions.filter(pos => pos.departmentId === formData.departmentId)
                            : positions;

                          return (
                            <Grid item xs={12} sm={6} key={field}>
                              <FormControl fullWidth error={!!fieldErrors[field]}>
                                <InputLabel required={isRequired}>Position</InputLabel>
                                <Select
                                  value={formData[field] || ''}
                                  onChange={(e) => handleInputChange(field, e.target.value)}
                                  label="Position"
                                  disabled={!formData.departmentId}
                                >
                                  <MenuItem value="">
                                    <em>{!formData.departmentId ? 'Select Department First' : 'Select Position'}</em>
                                  </MenuItem>
                                  {Array.isArray(filteredPositions) ? filteredPositions.map((pos) => (
                                    <MenuItem key={pos.id} value={pos.id}>
                                      {pos.title}
                                    </MenuItem>
                                  )) : []}
                                </Select>
                                {fieldErrors[field] && (
                                  <Typography variant="caption" color="error">
                                    {fieldErrors[field]}
                                  </Typography>
                                )}
                                {!formData.departmentId && (
                                  <Typography variant="caption" color="textSecondary">
                                    Please select a department first
                                  </Typography>
                                )}
                              </FormControl>
                            </Grid>
                          );
                        }
                        
                        if (field === 'managerId') {
                          return (
                            <Grid item xs={12} sm={6} key={field}>
                              <FormControl fullWidth>
                                <InputLabel>Manager</InputLabel>
                                <Select
                                  value={formData[field] || ''}
                                  onChange={(e) => handleInputChange(field, e.target.value)}
                                  label="Manager"
                                >
                                  <MenuItem value="">
                                    <em>No Manager</em>
                                  </MenuItem>
                                  {Array.isArray(managers) ? managers.filter(mgr => mgr.id !== id).map((mgr) => (
                                    <MenuItem key={mgr.id} value={mgr.id}>
                                      {mgr.firstName} {mgr.lastName}
                                    </MenuItem>
                                  )) : []}
                                </Select>
                              </FormControl>
                            </Grid>
                          );
                        }
                        
                        if (['gender', 'maritalStatus', 'employmentType', 'nationality', 'workLocation', 'emergencyContactRelation'].includes(field)) {
                          const options = {
                            gender: ['Male', 'Female', 'Other'],
                            maritalStatus: ['Single', 'Married', 'Divorced', 'Widowed'],
                            employmentType: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Consultant'],
                            nationality: ['Indian', 'American', 'British', 'Canadian', 'Australian', 'German', 'French', 'Japanese', 'Chinese', 'Other'],
                            workLocation: ['Office', 'Remote', 'Hybrid', 'Field', 'Client Site'],
                            emergencyContactRelation: ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Guardian', 'Other']
                          };
                          
                          // Normalize value to match option case (capitalize first letter)
                          let normalizedValue = formData[field] || '';
                          if (normalizedValue && field === 'workLocation') {
                            // Try to find matching option (case-insensitive)
                            const matchingOption = options[field].find(
                              opt => opt.toLowerCase() === normalizedValue.toLowerCase()
                            );
                            normalizedValue = matchingOption || normalizedValue;
                          }
                          
                          return (
                            <Grid item xs={12} sm={6} key={field}>
                              <FormControl fullWidth>
                                <InputLabel>{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}</InputLabel>
                                <Select
                                  value={normalizedValue}
                                  onChange={(e) => handleInputChange(field, e.target.value)}
                                  label={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                                >
                                  <MenuItem value="">
                                    <em>Select {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}</em>
                                  </MenuItem>
                                  {Array.isArray(options[field]) ? options[field].map((option) => (
                                    <MenuItem key={option} value={option}>
                                      {option}
                                    </MenuItem>
                                  )) : []}
                                </Select>
                              </FormControl>
                            </Grid>
                          );
                        }
                        
                        // Handle nested salary fields
                        const getNestedValue = (obj, path) => {
                          return path.split('.').reduce((curr, key) => curr?.[key], obj);
                        };
                        
                        // Salary field handlers
                        if (field.startsWith('salary.')) {
                          const value = getNestedValue(formData, field) || '';
                          const fieldParts = field.split('.');
                          const fieldName = fieldParts[fieldParts.length - 1];
                          
                          // Salary dropdown fields
                          if (field === 'salary.currency') {
                            // Normalize value to match dropdown options (case-insensitive)
                            const currencyOptions = ['INR', 'USD', 'EUR', 'GBP'];
                            let normalizedValue = value || 'INR';
                            
                            if (value) {
                              const matchingOption = currencyOptions.find(
                                opt => opt.toUpperCase() === value.toUpperCase()
                              );
                              normalizedValue = matchingOption || 'INR';
                            }
                            
                            return (
                              <Grid item xs={12} sm={6} key={field}>
                                <FormControl fullWidth>
                                  <InputLabel>Currency *</InputLabel>
                                  <Select
                                    value={normalizedValue}
                                    onChange={(e) => handleInputChange(field, e.target.value)}
                                    label="Currency *"
                                  >
                                    <MenuItem value="INR">INR (₹)</MenuItem>
                                    <MenuItem value="USD">USD ($)</MenuItem>
                                    <MenuItem value="EUR">EUR (€)</MenuItem>
                                    <MenuItem value="GBP">GBP (£)</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                            );
                          }
                          
                          if (field === 'salary.payFrequency') {
                            // Normalize value to match dropdown options (case-insensitive)
                            const frequencyOptions = ['Weekly', 'Biweekly', 'Monthly', 'Annually'];
                            let normalizedValue = value || 'Monthly';
                            
                            if (value) {
                              // Try to find matching option (case-insensitive)
                              const matchingOption = frequencyOptions.find(
                                opt => opt.toLowerCase() === value.toLowerCase()
                              );
                              normalizedValue = matchingOption || 'Monthly';
                            }
                            
                            return (
                              <Grid item xs={12} sm={6} key={field}>
                                <FormControl fullWidth>
                                  <InputLabel>Pay Frequency *</InputLabel>
                                  <Select
                                    value={normalizedValue}
                                    onChange={(e) => handleInputChange(field, e.target.value)}
                                    label="Pay Frequency *"
                                  >
                                    <MenuItem value="Weekly">Weekly</MenuItem>
                                    <MenuItem value="Biweekly">Bi-weekly</MenuItem>
                                    <MenuItem value="Monthly">Monthly</MenuItem>
                                    <MenuItem value="Annually">Annually</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                            );
                          }
                          
                          if (field === 'salary.taxRegime') {
                            // Normalize value to match dropdown options
                            const taxOptions = ['Old', 'New'];
                            let normalizedValue = value || 'Old';
                            
                            if (value) {
                              const matchingOption = taxOptions.find(
                                opt => opt.toLowerCase() === value.toLowerCase()
                              );
                              normalizedValue = matchingOption || 'Old';
                            }
                            
                            return (
                              <Grid item xs={12} sm={6} key={field}>
                                <FormControl fullWidth>
                                  <InputLabel>Tax Regime</InputLabel>
                                  <Select
                                    value={normalizedValue}
                                    onChange={(e) => handleInputChange(field, e.target.value)}
                                    label="Tax Regime"
                                  >
                                    <MenuItem value="Old">Old Tax Regime</MenuItem>
                                    <MenuItem value="New">New Tax Regime</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                            );
                          }
                          
                          if (field === 'salary.salaryNotes') {
                            return (
                              <Grid item xs={12} key={field}>
                                <TextField
                                  fullWidth
                                  label="Salary Notes"
                                  type="text"
                                  multiline
                                  rows={3}
                                  value={value}
                                  onChange={(e) => handleInputChange(field, e.target.value)}
                                  helperText="Additional notes about salary structure, benefits, or special conditions"
                                />
                              </Grid>
                            );
                          }
                          
                          // Salary number fields with proper labels
                          const salaryFieldLabels = {
                            basicSalary: 'Basic Salary (₹) *',
                            effectiveFrom: 'Effective From *',
                            // Allowances
                            hra: 'House Rent Allowance (HRA)',
                            transport: 'Transport Allowance',
                            medical: 'Medical Allowance',
                            food: 'Food Allowance',
                            communication: 'Communication Allowance',
                            special: 'Special Allowance',
                            other: fieldParts[1] === 'allowances' ? 'Other Allowances' : 'Other',
                            // Deductions
                            pf: 'Provident Fund (PF)',
                            professionalTax: 'Professional Tax',
                            incomeTax: 'Income Tax',
                            esi: 'ESI',
                            // Benefits
                            bonus: 'Bonus',
                            incentive: 'Incentive',
                            overtime: 'Overtime Pay'
                          };
                          
                          const label = salaryFieldLabels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1');
                          const fieldType = field === 'salary.effectiveFrom' ? 'date' : 'number';
                          const isRequired = ['salary.basicSalary', 'salary.effectiveFrom'].includes(field);
                          
                          return (
                            <Grid item xs={12} sm={6} key={field}>
                              <TextField
                                fullWidth
                                label={label}
                                type={fieldType}
                                value={value}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                required={isRequired}
                                error={!!fieldErrors[field]}
                                helperText={fieldErrors[field]}
                                InputLabelProps={fieldType === 'date' ? { shrink: true } : {}}
                                inputProps={fieldType === 'number' ? { min: 0, step: 0.01 } : {}}
                              />
                            </Grid>
                          );
                        }
                        
                        const fieldType = ['hireDate', 'dateOfBirth', 'joiningDate', 'confirmationDate', 'resignationDate', 'lastWorkingDate'].includes(field) ? 'date' : 
                                         ['probationPeriod', 'noticePeriod'].includes(field) ? 'number' : 'text';
                        
                        // Custom labels for specific fields
                        const fieldLabels = {
                          probationPeriod: 'Probation Period (months)',
                          noticePeriod: 'Notice Period (days)'
                        };
                        
                        const label = fieldLabels[field] || field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
                        
                        return (
                          <Grid item xs={12} sm={6} key={field}>
                            <TextField
                              fullWidth
                              label={label}
                              type={fieldType}
                              value={formData[field] || ''}
                              onChange={(e) => handleInputChange(field, e.target.value)}
                              required={isRequired}
                              error={!!fieldErrors[field] || !!validationErrors[field]}
                              helperText={fieldErrors[field] || validationErrors[field]}
                              InputLabelProps={fieldType === 'date' ? { shrink: true } : {}}
                              inputProps={{
                                ...(fieldType === 'number' && {
                                  min: 0,
                                  max: field === 'probationPeriod' ? 24 : field === 'noticePeriod' ? 90 : undefined,
                                  step: ['basicSalary', 'hra', 'da', 'medicalAllowance', 'specialAllowance'].includes(field) ? '0.01' : '1'
                                })
                              }}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                    
                    {/* Show total salary calculation for compensation step */}
                    {step.label === 'Compensation' && formData.salary && (
                      <Box sx={{ mt: 3, p: 3, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
                        <Typography variant="h6" gutterBottom color="primary.main">
                          💰 Salary Breakdown
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        
                        {/* Gross Salary Calculation */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Gross Monthly Salary
                          </Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={6}><Typography variant="body2">Basic Salary:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2" align="right">₹{parseFloat(formData.salary?.basicSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Grid>
                            
                            {formData.salary?.allowances?.hra > 0 && (
                              <>
                                <Grid item xs={6}><Typography variant="body2">HRA:</Typography></Grid>
                                <Grid item xs={6}><Typography variant="body2" align="right">₹{parseFloat(formData.salary.allowances.hra).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Grid>
                              </>
                            )}
                            
                            {formData.salary?.allowances?.transport > 0 && (
                              <>
                                <Grid item xs={6}><Typography variant="body2">Transport:</Typography></Grid>
                                <Grid item xs={6}><Typography variant="body2" align="right">₹{parseFloat(formData.salary.allowances.transport).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Grid>
                              </>
                            )}
                            
                            {formData.salary?.allowances?.medical > 0 && (
                              <>
                                <Grid item xs={6}><Typography variant="body2">Medical:</Typography></Grid>
                                <Grid item xs={6}><Typography variant="body2" align="right">₹{parseFloat(formData.salary.allowances.medical).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Grid>
                              </>
                            )}
                            
                            {(parseFloat(formData.salary?.allowances?.food || 0) + 
                              parseFloat(formData.salary?.allowances?.communication || 0) + 
                              parseFloat(formData.salary?.allowances?.special || 0) + 
                              parseFloat(formData.salary?.allowances?.other || 0)) > 0 && (
                              <>
                                <Grid item xs={6}><Typography variant="body2">Other Allowances:</Typography></Grid>
                                <Grid item xs={6}><Typography variant="body2" align="right">₹{(
                                  parseFloat(formData.salary?.allowances?.food || 0) + 
                                  parseFloat(formData.salary?.allowances?.communication || 0) + 
                                  parseFloat(formData.salary?.allowances?.special || 0) + 
                                  parseFloat(formData.salary?.allowances?.other || 0)
                                ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Grid>
                              </>
                            )}
                          </Grid>
                        </Box>
                        
                        {/* Deductions */}
                        {(parseFloat(formData.salary?.deductions?.pf || 0) + 
                          parseFloat(formData.salary?.deductions?.professionalTax || 0) + 
                          parseFloat(formData.salary?.deductions?.incomeTax || 0) + 
                          parseFloat(formData.salary?.deductions?.esi || 0) + 
                          parseFloat(formData.salary?.deductions?.other || 0)) > 0 && (
                          <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="error.main">
                              Less: Deductions
                            </Typography>
                            <Grid container spacing={1}>
                              {formData.salary?.deductions?.pf > 0 && (
                                <>
                                  <Grid item xs={6}><Typography variant="body2">PF:</Typography></Grid>
                                  <Grid item xs={6}><Typography variant="body2" align="right" color="error.main">-₹{parseFloat(formData.salary.deductions.pf).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Grid>
                                </>
                              )}
                              
                              {formData.salary?.deductions?.professionalTax > 0 && (
                                <>
                                  <Grid item xs={6}><Typography variant="body2">Professional Tax:</Typography></Grid>
                                  <Grid item xs={6}><Typography variant="body2" align="right" color="error.main">-₹{parseFloat(formData.salary.deductions.professionalTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Grid>
                                </>
                              )}
                              
                              {formData.salary?.deductions?.incomeTax > 0 && (
                                <>
                                  <Grid item xs={6}><Typography variant="body2">Income Tax:</Typography></Grid>
                                  <Grid item xs={6}><Typography variant="body2" align="right" color="error.main">-₹{parseFloat(formData.salary.deductions.incomeTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Grid>
                                </>
                              )}
                              
                              {formData.salary?.deductions?.esi > 0 && (
                                <>
                                  <Grid item xs={6}><Typography variant="body2">ESI:</Typography></Grid>
                                  <Grid item xs={6}><Typography variant="body2" align="right" color="error.main">-₹{parseFloat(formData.salary.deductions.esi).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Grid>
                                </>
                              )}
                              
                              {formData.salary?.deductions?.other > 0 && (
                                <>
                                  <Grid item xs={6}><Typography variant="body2">Other Deductions:</Typography></Grid>
                                  <Grid item xs={6}><Typography variant="body2" align="right" color="error.main">-₹{parseFloat(formData.salary.deductions.other).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Grid>
                                </>
                              )}
                            </Grid>
                          </Box>
                        )}
                        
                        {/* Net Salary */}
                        <Box sx={{ mt: 2, pt: 2, borderTop: '2px solid', borderColor: 'primary.main' }}>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="h6" fontWeight="bold">Net Monthly Take Home:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="h6" fontWeight="bold" align="right" color="success.main">
                                ₹{(
                                  parseFloat(formData.salary?.basicSalary || 0) +
                                  parseFloat(formData.salary?.allowances?.hra || 0) +
                                  parseFloat(formData.salary?.allowances?.transport || 0) +
                                  parseFloat(formData.salary?.allowances?.medical || 0) +
                                  parseFloat(formData.salary?.allowances?.food || 0) +
                                  parseFloat(formData.salary?.allowances?.communication || 0) +
                                  parseFloat(formData.salary?.allowances?.special || 0) +
                                  parseFloat(formData.salary?.allowances?.other || 0) -
                                  parseFloat(formData.salary?.deductions?.pf || 0) -
                                  parseFloat(formData.salary?.deductions?.professionalTax || 0) -
                                  parseFloat(formData.salary?.deductions?.incomeTax || 0) -
                                  parseFloat(formData.salary?.deductions?.esi || 0) -
                                  parseFloat(formData.salary?.deductions?.other || 0)
                                ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">Annual CTC:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary" align="right">
                                ₹{(
                                  (parseFloat(formData.salary?.basicSalary || 0) +
                                  parseFloat(formData.salary?.allowances?.hra || 0) +
                                  parseFloat(formData.salary?.allowances?.transport || 0) +
                                  parseFloat(formData.salary?.allowances?.medical || 0) +
                                  parseFloat(formData.salary?.allowances?.food || 0) +
                                  parseFloat(formData.salary?.allowances?.communication || 0) +
                                  parseFloat(formData.salary?.allowances?.special || 0) +
                                  parseFloat(formData.salary?.allowances?.other || 0)) * 12
                                ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 2 }}>
                      <Button
                        disabled={index === 0}
                        onClick={() => setActiveStep(index - 1)}
                        sx={{ 
                          mr: 1,
                          color: '#64748b',
                          '&:hover': {
                            bgcolor: 'rgba(148, 163, 184, 0.05)'
                          }
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => index === steps.length - 1 ? handleSave() : setActiveStep(index + 1)}
                        disabled={saving}
                        sx={{
                          background: index === steps.length - 1 
                            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                            : '#6366f1',
                          color: 'white',
                          fontWeight: 600,
                          '&:hover': {
                            background: index === steps.length - 1
                              ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                              : '#4f46e5',
                          },
                          '&:disabled': {
                            bgcolor: '#e5e7eb',
                            color: '#9ca3af'
                          }
                        }}
                      >
                        {index === steps.length - 1 ? 'Save Changes' : 'Next'}
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: 480
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)' }}>
              <DeleteIcon sx={{ color: '#ef4444' }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Delete Employee?
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                This action cannot be undone
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ color: '#475569' }}>
            Are you sure you want to delete{' '}
            <Box component="span" sx={{ fontWeight: 600, color: '#1e293b' }}>
              {formData.firstName} {formData.lastName}
            </Box>
            ? All associated data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{
              color: '#64748b',
              borderColor: '#cbd5e1',
              '&:hover': {
                borderColor: '#94a3b8',
                bgcolor: 'rgba(148, 163, 184, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{
              bgcolor: '#ef4444',
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#dc2626'
              },
              boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)'
            }}
          >
            Delete Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </Box>
  );
};

export default EnhancedEmployeeEdit;
