import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLoading } from '../../../contexts/LoadingContext';
import { useNotifications } from '../../../contexts/NotificationContext';
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
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  useTheme,
  alpha,
  FormHelperText,
  Avatar,
  Chip,
  Switch,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  IconButton,
  Tooltip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  ContactMail as ContactIcon,
  AccountBalance as BankIcon,
  Login as LoginIcon,
  AttachMoney as AttachMoneyIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  HelpOutline as HelpIcon,
  InfoOutlined as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, unstable_useBlocker as useBlocker } from 'react-router-dom';
import { validateEmployeeForm, transformEmployeeDataForAPI, validateField } from '../../../utils/employeeValidation';
import { employeeService } from '../../../services/employee.service';
import { authService } from '../../../services/auth.service';
import UserAccountManager from './UserAccountManager';
import PhotoUploadSimple from '../../common/PhotoUploadSimple';

// Helper Component: Field with Tooltip
const FieldWithTooltip = ({ tooltip, children }) => {
  if (!tooltip) return children;
  
  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      <Tooltip 
        title={tooltip} 
        arrow 
        placement="top"
        sx={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
      >
        <IconButton size="small" sx={{ p: 0.5 }}>
          <HelpIcon fontSize="small" color="action" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

// Modern Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  const { showNotification } = useNotifications();
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ 
          p: { xs: 3, md: 4 },
          bgcolor: 'white',
          minHeight: '500px'
        }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TabBasedEmployeeForm = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    // Required fields
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
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
    photoUrl: '',
    
    // Optional employment fields
    employmentType: 'Full-time',
    workLocation: '',
    joiningDate: '',
    confirmationDate: '',
    resignationDate: '',
    lastWorkingDate: '',
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
    accountHolderName: '',
    
    // Optional salary structure
    salaryStructure: '',
    
    // Comprehensive salary details (NEW NESTED FORMAT)
    salary: {
      // Basic Salary Components
      basicSalary: '',
      currency: 'INR',
      payFrequency: 'monthly',
      effectiveFrom: '',
      
      // Allowances (NESTED)
      allowances: {
        hra: '',
        transport: '',
        medical: '',
        food: '',
        communication: '',
        special: '',
        other: ''
      },
      
      // Deductions (NESTED)
      deductions: {
        pf: '',
        professionalTax: '',
        incomeTax: '',
        esi: '',
        other: ''
      },
      
      // Benefits (NESTED)
      benefits: {
        bonus: '',
        incentive: '',
        overtime: ''
      },
      
      // Tax Information (NESTED)
      taxInformation: {
        taxRegime: 'old',
        ctc: '',
        takeHome: ''
      },
      
      // Salary Notes
      salaryNotes: ''
    },
    
    // User account details
    userAccount: {
      enableLogin: false,
      role: 'employee',
      password: '',
      confirmPassword: '',
      forcePasswordChange: true
    }
  });
  
  // UI state
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({}); // Track which fields user has interacted with
  const [wasSubmitted, setWasSubmitted] = useState(false); // Track if form was submitted
  // Loading state managed by LoadingContext
  const { isLoading: isLoadingFn, setLoading } = useLoading();
  const isLoading = isLoadingFn('employee-form');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  
  // Reference data
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loadingRefData, setLoadingRefData] = useState(true);
  
  // Photo upload state
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  
  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  // Auto-save state
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimeoutRef = React.useRef(null);

  // Check authentication on component mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      loadReferenceData();
      
      // Try to restore draft from localStorage
      const savedDraft = localStorage.getItem('employeeFormDraft');
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          const savedTime = new Date(draftData.savedAt);
          const hoursSinceLastSave = (new Date() - savedTime) / (1000 * 60 * 60);
          
          // Only restore if saved within last 24 hours
          if (hoursSinceLastSave < 24) {
            const shouldRestore = window.confirm(
              `Found a draft saved ${Math.round(hoursSinceLastSave * 60)} minutes ago. Would you like to restore it?`
            );
            
            if (shouldRestore) {
              const { savedAt, isDraft, ...restoredData } = draftData;
              setFormData(prevData => ({
                ...prevData,
                ...restoredData
              }));
              setLastSaved(savedTime);
              console.log('✅ Draft restored from localStorage');
            }
          } else {
            // Clean up old draft
            localStorage.removeItem('employeeFormDraft');
          }
        } catch (error) {
          console.error('Error restoring draft:', error);
          localStorage.removeItem('employeeFormDraft');
        }
      }
    } else {
      setSubmitError('Please login to access this page.');
      setLoadingRefData(false);
    }
  }, []);
  
  // Warn user about unsaved changes when leaving page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
  
  // Auto-save to localStorage every 30 seconds or on form change
  useEffect(() => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Only auto-save if user has made changes
    if (hasUnsavedChanges && isAuthenticated) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        setAutoSaving(true);
        try {
          const draftData = {
            ...formData,
            savedAt: new Date().toISOString(),
            isDraft: true
          };
          localStorage.setItem('employeeFormDraft', JSON.stringify(draftData));
          setLastSaved(new Date());
          console.log('💾 Auto-saved to localStorage');
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setAutoSaving(false);
        }
      }, 30000); // Auto-save after 30 seconds of inactivity
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, hasUnsavedChanges, isAuthenticated]);

  // Load reference data function
  const loadReferenceData = useCallback(async () => {
    try {
      setLoadingRefData(true);
      setSubmitError('');
      
      // Check if user is authenticated
      const user = authService.getCurrentUser();
      if (!user) {
        setSubmitError('Authentication required. Please login.');
        return;
      }

      // Load departments, managers in parallel with better error handling
      const [deptResponse, mgrsResponse] = await Promise.all([
        employeeService.getDepartments().catch(err => {
          console.error('Error loading departments:', err);
          return { data: { data: [] } }; // Fallback
        }),
        employeeService.getManagers().catch(err => {
          console.error('Error loading managers:', err);
          return { data: { data: [] } }; // Fallback
        })
      ]);
      
      setDepartments(deptResponse.data?.data || []);
      setManagers(mgrsResponse.data?.data || []);
      
      // Fetch positions from backend API
      const positionsResponse = await employeeService.getPositions().catch(err => {
        console.error('Error loading positions:', err);
        return { data: { data: [] } };
      });
      setPositions(positionsResponse.data?.data || []);
      
    } catch (error) {
      console.error('Error loading reference data:', error);
      setSubmitError(`Failed to load form data: ${error.message}. Please check your connection and try again.`);
    } finally {
      setLoadingRefData(false);
    }
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!formData.firstName && !formData.lastName && !formData.email) {
      // Don't save empty forms
      return;
    }

    const draftKey = 'employee-form-draft';
    const draftData = {
      formData,
      timestamp: new Date().toISOString(),
      activeTab
    };
    
    try {
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      console.log('✅ Draft auto-saved');
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [formData, activeTab]);

  // Load draft on mount
  useEffect(() => {
    const draftKey = 'employee-form-draft';
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const { formData: savedFormData, timestamp, activeTab: savedTab } = JSON.parse(savedDraft);
        const draftAge = Date.now() - new Date(timestamp).getTime();
        
        // Only restore drafts less than 24 hours old
        if (draftAge < 24 * 60 * 60 * 1000) {
          const shouldRestore = window.confirm(
            `Found a saved draft from ${new Date(timestamp).toLocaleString()}.\n\nWould you like to restore it?`
          );
          
          if (shouldRestore) {
            // Merge saved draft with default values to ensure required defaults are present
            const mergedFormData = {
              ...savedFormData,
              salary: {
                currency: 'INR',
                payFrequency: 'monthly',
                ...savedFormData.salary,
                allowances: {
                  hra: '',
                  transport: '',
                  medical: '',
                  food: '',
                  communication: '',
                  special: '',
                  other: '',
                  ...savedFormData.salary?.allowances
                },
                deductions: {
                  pf: '',
                  professionalTax: '',
                  incomeTax: '',
                  esi: '',
                  other: '',
                  ...savedFormData.salary?.deductions
                },
                benefits: {
                  bonus: '',
                  incentive: '',
                  overtime: '',
                  ...savedFormData.salary?.benefits
                },
                taxInformation: {
                  taxRegime: 'old',
                  ctc: '',
                  takeHome: '',
                  ...savedFormData.salary?.taxInformation
                }
              }
            };
            setFormData(mergedFormData);
            setActiveTab(savedTab || 0);
            console.log('✅ Draft restored with default values merged');
          } else {
            localStorage.removeItem(draftKey);
          }
        } else {
          localStorage.removeItem(draftKey); // Remove old drafts
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSubmit();
        return;
      }

      // Escape to cancel/go back
      if (event.key === 'Escape') {
        event.preventDefault();
        if (window.confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
          navigate('/employees');
        }
        return;
      }

      // Arrow keys for tab navigation (when not in input field)
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        if (event.key === 'ArrowRight' && activeTab < 5) {
          setActiveTab(prev => prev + 1);
        } else if (event.key === 'ArrowLeft' && activeTab > 0) {
          setActiveTab(prev => prev - 1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [activeTab, navigate]);

  // Handle field changes with real-time validation
  const handleFieldChange = useCallback((fieldName, value) => {
    setFormData(prev => {
      let newFormData = { ...prev };
      
      // Handle nested field paths like 'salary.basicSalary' or 'salary.allowances.hra'
      if (fieldName.includes('.')) {
        const fieldPath = fieldName.split('.');
        let current = newFormData;
        
        // Navigate to the parent object, creating nested objects if they don't exist
        for (let i = 0; i < fieldPath.length - 1; i++) {
          const key = fieldPath[i];
          if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
          }
          current = current[key];
        }
        
        // Set the final value
        const finalKey = fieldPath[fieldPath.length - 1];
        current[finalKey] = value;
      } else {
        newFormData[fieldName] = value;
      }
      
      return newFormData;
    });
    
    // Mark form as having unsaved changes
    setHasUnsavedChanges(true);
    
    // Clear error for this field when user types (don't revalidate until blur)
    setErrors(prevErrors => ({
      ...prevErrors,
      [fieldName]: null
    }));
    
    // Clear submit messages
    setSubmitError('');
    setSubmitSuccess('');
  }, []);

  // Handle field blur - validate when user leaves a field
  const handleFieldBlur = useCallback((fieldName) => {
    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
    
    // Get the field value (handle nested paths like 'salary.currency')
    let fieldValue;
    if (fieldName.includes('.')) {
      const fieldPath = fieldName.split('.');
      fieldValue = formData;
      for (const key of fieldPath) {
        fieldValue = fieldValue?.[key];
        if (fieldValue === undefined) break;
      }
    } else {
      fieldValue = formData[fieldName];
    }
    
    // Validate field on blur
    const fieldError = validateField(fieldName, fieldValue, formData);
    if (fieldError) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [fieldName]: fieldError
      }));
    }
  }, [formData]);

  // Validate current tab
  const isCurrentTabValid = useMemo(() => {
    // Don't show tab validation errors until user tries to submit
    if (!wasSubmitted) return true;
    
    const validation = validateEmployeeForm(formData);
    
    switch (activeTab) {
      case 0: // Personal Information
        const personalFields = ['firstName', 'lastName', 'email'];
        return personalFields.every(field => !validation.errors[field]);
        
      case 1: // Employment & Compensation (combined tab)
        const employmentFields = ['hireDate', 'departmentId', 'positionId'];
        return employmentFields.every(field => !validation.errors[field]);
        
      case 2: // Contact & Emergency (all optional)
        return true;
        
      case 3: // Statutory, Banking & Access (all optional)
        return true;
        
      default:
        return validation.isValid;
    }
  }, [formData, activeTab, wasSubmitted]);
  
  // Get validation status for all tabs (for badge display)
  const getTabValidationStatus = useMemo(() => {
    const validation = validateEmployeeForm(formData);
    
    return {
      0: { // Personal Information
        requiredFields: ['firstName', 'lastName', 'email'],
        hasErrors: ['firstName', 'lastName', 'email'].some(field => validation.errors[field]),
        isComplete: formData.firstName && formData.lastName && formData.email &&
                    !validation.errors.firstName && !validation.errors.lastName && !validation.errors.email
      },
      1: { // Employment & Compensation
        requiredFields: ['hireDate', 'departmentId', 'positionId'],
        hasErrors: ['hireDate', 'departmentId', 'positionId'].some(field => validation.errors[field]),
        isComplete: formData.hireDate && formData.departmentId && formData.positionId &&
                    !validation.errors.hireDate && !validation.errors.departmentId && !validation.errors.positionId
      },
      2: { // Contact & Emergency
        requiredFields: [],
        hasErrors: ['phone', 'emergencyContactPhone'].some(field => validation.errors[field]),
        isComplete: true // All fields optional
      },
      3: { // Statutory, Banking & Access
        requiredFields: [],
        hasErrors: ['aadhaarNumber', 'panNumber', 'ifscCode'].some(field => validation.errors[field]),
        isComplete: true // All fields optional
      }
    };
  }, [formData]);

  // Handle tab change
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (!isAuthenticated) {
        setSubmitError('Please login to create employees.');
        return;
      }

      // Mark that user has attempted to submit
      setWasSubmitted(true);

      setLoading(true);
      setSubmitError('');
      setSubmitSuccess('');
      
      // Validate user account if enabled
      if (formData.userAccount.enableLogin) {
        if (formData.userAccount.password !== formData.userAccount.confirmPassword) {
          setErrors({ 'userAccount.password': 'Passwords do not match' });
          setSubmitError('Password validation failed:\n\n• Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.userAccount.password.length < 6) {
          setErrors({ 'userAccount.password': 'Password must be at least 6 characters' });
          setSubmitError('Password validation failed:\n\n• Password must be at least 6 characters');
          setLoading(false);
          return;
        }
      }
      
      // Final validation
      const validation = validateEmployeeForm(formData);
      if (!validation.isValid) {
        console.log('Employee form validation failed:', validation.errors);
        console.log('Current form data:', formData);
        setErrors(validation.errors);
        
        // Mark all fields with errors as touched
        const errorFields = Object.keys(validation.errors);
        const touchedErrorFields = errorFields.reduce((acc, field) => {
          acc[field] = true;
          return acc;
        }, {});
        setTouchedFields(prev => ({ ...prev, ...touchedErrorFields }));
        
        // Create detailed error message
        const fieldLabels = {
          firstName: 'First Name',
          lastName: 'Last Name', 
          email: 'Email',
          employeeId: 'Employee ID',
          hireDate: 'Hire Date',
          departmentId: 'Department',
          positionId: 'Position',
          phone: 'Phone',
          dateOfBirth: 'Date of Birth',
          gender: 'Gender',
          maritalStatus: 'Marital Status',
          employmentType: 'Employment Type',
          pinCode: 'PIN Code',
          aadhaarNumber: 'Aadhaar Number',
          panNumber: 'PAN Number',
          ifscCode: 'IFSC Code',
          bankAccountNumber: 'Bank Account Number',
          emergencyContactPhone: 'Emergency Contact Phone',
          probationPeriod: 'Probation Period',
          noticePeriod: 'Notice Period',
          salaryStructure: 'Salary Structure'
        };
        
        const errorList = errorFields.map(field => {
          const label = fieldLabels[field] || field;
          return `• ${label}: ${validation.errors[field]}`;
        }).join('\n');
        
        setSubmitError(`Please fix the following validation errors:\n\n${errorList}`);
        
        // Scroll to first error field
        const firstErrorField = errorFields[0];
        const element = document.getElementById(firstErrorField) || 
                        document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => element.focus(), 300);
        }
        
        setLoading(false);
        return;
      }
      
      // Transform data for API
      const apiData = transformEmployeeDataForAPI(formData);
      
      // Submit to backend with detailed logging
      console.log('=== Employee Creation Debug ===');
      console.log('Original form data:', formData);
      console.log('Transformed API data:', apiData);
      console.log('Transformed API data FULL:', JSON.stringify(apiData, null, 2));
      console.log('dateOfBirth in apiData:', apiData.dateOfBirth);
      console.log('Selected photo:', selectedPhoto ? selectedPhoto.name : 'None');
      console.log('API endpoint: POST /api/employees');
      
      // Use createWithPhoto if photo is selected, otherwise use regular create
      let response;
      if (selectedPhoto) {
        // Remove photoUrl from apiData when using file upload
        const { photoUrl, ...apiDataWithoutPhoto } = apiData;
        console.log('📸 Creating employee WITH photo...');
        response = await employeeService.createWithPhoto(apiDataWithoutPhoto, selectedPhoto);
      } else {
        console.log('📝 Creating employee WITHOUT photo...');
        response = await employeeService.create(apiData);
      }
      
      console.log('✅ Employee creation response:', response);
      console.log('   Response data:', response?.data);
      console.log('   Employee ID:', response?.data?.employeeId || response?.employeeId);
      
      // If user account is enabled, create user account
      const employeeData = response?.data || response;
      if (formData.userAccount.enableLogin && employeeData?.id) {
        try {
          const userAccountData = {
            role: formData.userAccount.role,
            password: formData.userAccount.password,
            forcePasswordChange: formData.userAccount.forcePasswordChange
          };
          
          await authService.createUserAccount(employeeData.id, userAccountData);
          setSubmitSuccess(`Employee and user account created successfully! Employee ID: ${employeeData?.employeeId || 'Generated'}`);
        } catch (userError) {
          console.warn('Employee created but user account failed:', userError);
          setSubmitSuccess(`Employee created successfully! Employee ID: ${employeeData?.employeeId || 'Generated'}. User account creation failed - you can set this up later.`);
        }
      } else {
        setSubmitSuccess(`Employee created successfully! Employee ID: ${employeeData?.employeeId || 'Generated'}`);
      }
      
      // Clear draft after successful creation
      localStorage.removeItem('employeeFormDraft');
      console.log('🗑️ Draft cleared after successful creation');
      
      // Clear unsaved changes flag
      setHasUnsavedChanges(false);
      
      // Optional: Reset form or navigate
      setTimeout(() => {
        navigate('/employees');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating employee:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error response headers:', error.response?.headers);
      
      // Enhanced error details logging
      if (error.response?.data) {
        const responseData = error.response.data;
        console.log('=== DETAILED BACKEND ERROR ===');
        console.log('Backend errors array:', responseData.errors);
        console.log('Validation guide:', responseData.validationGuide);
        console.log('Received data by backend:', responseData.receivedData);
        
        // Log each individual error
        if (responseData.errors && Array.isArray(responseData.errors)) {
          responseData.errors.forEach((err, index) => {
            console.log(`Error ${index + 1}:`, err);
          });
        }
      }
      
      if (error.response?.status === 401) {
        setSubmitError('Session expired. Please login again.');
        authService.logout();
        navigate('/login');
      } else {
        // Try to extract detailed validation errors
        let errorMessage = 'Failed to create employee. Please check the form and try again.';
        
        if (error.response?.data) {
          const responseData = error.response.data;
          
          if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
            // Extract specific field validation errors for user-friendly display
            const fieldErrors = responseData.errors.map((err, index) => {
              if (typeof err === 'object' && err.field && err.message) {
                return `${err.field}: ${err.message}`;
              } else if (typeof err === 'string') {
                return err;
              } else if (err.path && err.message) {
                // Sequelize validation error format
                return `${err.path}: ${err.message}`;
              }
              return `Error ${index + 1}: ${JSON.stringify(err)}`;
            });
            
            errorMessage = `Please fix the following issues:\n\n${fieldErrors.join('\n')}`;
          } else if (responseData.message) {
            errorMessage = responseData.message;
          } else if (responseData.error) {
            errorMessage = responseData.error;
          }
        }
        
        setSubmitError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Navigation handler
  const handleBackToEmployees = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingNavigation('/employees');
      setShowUnsavedDialog(true);
    } else {
      navigate('/employees');
    }
  }, [navigate, hasUnsavedChanges]);

  // Handle login redirect
  const handleLoginRedirect = () => {
    navigate('/login');
  };
  
  // Unsaved changes dialog handlers
  const handleCancelNavigation = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };
  
  const handleConfirmNavigation = () => {
    setShowUnsavedDialog(false);
    setHasUnsavedChanges(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  // Photo handling functions
  const handlePhotoSelect = (file) => {
    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };
  
  // Save as Draft handler
  const handleSaveAsDraft = async () => {
    try {
      setLoading(true);
      setSubmitError('');
      
      // Save form data to localStorage
      const draftData = {
        ...formData,
        savedAt: new Date().toISOString(),
        isDraft: true
      };
      
      localStorage.setItem('employeeFormDraft', JSON.stringify(draftData));
      setLastSaved(new Date());
      
      setSubmitSuccess('Draft saved successfully! You can continue later.');
      setHasUnsavedChanges(false);
      
      // Navigate back after a delay
      setTimeout(() => {
        navigate('/employees');
      }, 1500);
    } catch (error) {
      console.error('Error saving draft:', error);
      setSubmitError('Failed to save draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show modern authentication error if not logged in
  if (!loadingRefData && !isAuthenticated) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'grey.50', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: 2
      }}>
        <Card 
          elevation={4} 
          sx={{ 
            maxWidth: 480, 
            p: { xs: 3, sm: 4 }, 
            textAlign: 'center',
            borderRadius: 3
          }}
        >
          <Avatar 
            sx={{ 
              mx: 'auto', 
              mb: 3, 
              width: 64, 
              height: 64,
              bgcolor: 'primary.main',
              boxShadow: 2
            }}
          >
            <LoginIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h4" gutterBottom fontWeight={700} color="primary.main">
            Authentication Required
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
            You need to be logged in to access the employee creation form. 
            Please authenticate to continue.
          </Typography>
          <Button
            variant="contained"
            startIcon={<LoginIcon />}
            onClick={handleLoginRedirect}
            size="large"
            sx={{ 
              py: 1.5, 
              px: 4,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            Go to Login
          </Button>
        </Card>
      </Box>
    );
  }

  if (loadingRefData) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          bgcolor: 'grey.50',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flexDirection: 'column',
          gap: 3
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="primary.main" fontWeight={600}>
          Loading form data...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we prepare the employee creation form
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Modern Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  color: 'primary.main',
                  mb: 0.5,
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' }
                }}
              >
                Add New Employee
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                Create a comprehensive employee profile with all necessary details
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              {/* Auto-save Status Indicator */}
              {lastSaved && (
                <Chip
                  size="small"
                  icon={autoSaving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon fontSize="small" />}
                  label={
                    autoSaving 
                      ? 'Saving...' 
                      : `Saved ${(() => {
                          const minutes = Math.floor((new Date() - lastSaved) / 60000);
                          if (minutes < 1) return 'just now';
                          if (minutes === 1) return '1 min ago';
                          if (minutes < 60) return `${minutes} mins ago`;
                          const hours = Math.floor(minutes / 60);
                          return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
                        })()}`
                  }
                  sx={{
                    bgcolor: autoSaving ? 'rgba(99, 102, 241, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    color: autoSaving ? 'primary.main' : '#10b981',
                    border: `1px solid ${autoSaving ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              )}
              
              {currentUser && (
                <Chip 
                  avatar={
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main',
                        width: 28,
                        height: 28
                      }}
                    >
                      {currentUser.firstName?.[0] || 'U'}
                    </Avatar>
                  }
                  label={`${currentUser.firstName || ''} ${currentUser.lastName || ''}`}
                  sx={{ 
                    fontWeight: 600,
                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                    color: theme.palette.primary.main,
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    '& .MuiChip-label': {
                      px: 1.5
                    }
                  }}
                />
              )}
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBackToEmployees}
                variant="outlined"
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    bordercolor: theme.palette.primary.main,
                    bgcolor: 'rgba(99, 102, 241, 0.04)',
                    color: theme.palette.primary.main
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Back
              </Button>
            </Box>
          </Box>

          {/* Info Card */}
          <Card 
            elevation={0} 
            sx={{ 
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.100',
              borderRadius: 2
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap'
                }}
              >
                <Box component="span" sx={{ fontSize: '1.1rem' }}>💡</Box>
                <Typography component="span" variant="body2">
                  <strong>Quick Tips:</strong>
                </Typography>
                <Typography component="span" variant="body2">
                  Press
                </Typography>
                <Chip label="Ctrl+S" size="small" sx={{ height: 20, fontSize: '0.7rem', mx: 0.5 }} />
                <Typography component="span" variant="body2">
                  to save •
                </Typography>
                <Chip label="Esc" size="small" sx={{ height: 20, fontSize: '0.7rem', mx: 0.5 }} />
                <Typography component="span" variant="body2">
                  to cancel • Form auto-saves as you type
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Progress Messages */}
        {submitError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-message': {
                whiteSpace: 'pre-line'
              }
            }}
          >
            {submitError}
          </Alert>
        )}

        {submitSuccess && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              borderRadius: 2
            }}
          >
            {submitSuccess}
          </Alert>
        )}

        {/* Modern Tab-based Form */}
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
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ 
              bgcolor: 'white',
              borderBottom: '2px solid #e2e8f0',
              '& .MuiTab-root': {
                minHeight: 64,
                py: 2,
                px: 3,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                color: theme.palette.text.secondary,
                transition: 'all 0.2s ease',
                borderBottom: '3px solid transparent',
                '&:hover': {
                  bgcolor: 'rgba(99, 102, 241, 0.04)',
                  color: theme.palette.primary.main,
                  borderBottomColor: 'rgba(99, 102, 241, 0.2)'
                },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  borderBottomcolor: theme.palette.primary.main,
                  '& .MuiSvgIcon-root': {
                    color: theme.palette.primary.main
                  }
                }
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              },
              '& .MuiTabs-scrollButtons': {
                color: theme.palette.primary.main,
                '&.Mui-disabled': {
                  opacity: 0.3
                }
              }
            }}
          >
            <Tab 
              icon={<PersonIcon />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Personal Info</span>
                  {getTabValidationStatus[0].hasErrors && (
                    <Chip 
                      label="✗" 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        minWidth: 20,
                        fontSize: '0.7rem',
                        bgcolor: '#fee2e2',
                        color: '#dc2626',
                        '& .MuiChip-label': { px: 0.5 }
                      }} 
                    />
                  )}
                  {!getTabValidationStatus[0].hasErrors && getTabValidationStatus[0].isComplete && (
                    <Chip 
                      label="✓" 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        minWidth: 20,
                        fontSize: '0.7rem',
                        bgcolor: '#d1fae5',
                        color: '#059669',
                        '& .MuiChip-label': { px: 0.5 }
                      }} 
                    />
                  )}
                  {!getTabValidationStatus[0].hasErrors && !getTabValidationStatus[0].isComplete && (
                    <Chip 
                      label="⚠" 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        minWidth: 20,
                        fontSize: '0.7rem',
                        bgcolor: '#fef3c7',
                        color: '#d97706',
                        '& .MuiChip-label': { px: 0.5 }
                      }} 
                    />
                  )}
                </Box>
              }
              id="employee-tab-0"
              aria-controls="employee-tabpanel-0"
            />
            <Tab 
              icon={<WorkIcon />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Employment & Compensation</span>
                  {getTabValidationStatus[1].hasErrors && (
                    <Chip 
                      label="✗" 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        minWidth: 20,
                        fontSize: '0.7rem',
                        bgcolor: '#fee2e2',
                        color: '#dc2626',
                        '& .MuiChip-label': { px: 0.5 }
                      }} 
                    />
                  )}
                  {!getTabValidationStatus[1].hasErrors && getTabValidationStatus[1].isComplete && (
                    <Chip 
                      label="✓" 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        minWidth: 20,
                        fontSize: '0.7rem',
                        bgcolor: '#d1fae5',
                        color: '#059669',
                        '& .MuiChip-label': { px: 0.5 }
                      }} 
                    />
                  )}
                  {!getTabValidationStatus[1].hasErrors && !getTabValidationStatus[1].isComplete && (
                    <Chip 
                      label="⚠" 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        minWidth: 20,
                        fontSize: '0.7rem',
                        bgcolor: '#fef3c7',
                        color: '#d97706',
                        '& .MuiChip-label': { px: 0.5 }
                      }} 
                    />
                  )}
                </Box>
              }
              id="employee-tab-1"
              aria-controls="employee-tabpanel-1"
            />
            <Tab 
              icon={<ContactIcon />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Contact & Emergency</span>
                  {getTabValidationStatus[2].hasErrors && (
                    <Chip 
                      label="✗" 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        minWidth: 20,
                        fontSize: '0.7rem',
                        bgcolor: '#fee2e2',
                        color: '#dc2626',
                        '& .MuiChip-label': { px: 0.5 }
                      }} 
                    />
                  )}
                  {!getTabValidationStatus[2].hasErrors && (
                    <Chip 
                      label="✓" 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        minWidth: 20,
                        fontSize: '0.7rem',
                        bgcolor: '#d1fae5',
                        color: '#059669',
                        '& .MuiChip-label': { px: 0.5 }
                      }} 
                    />
                  )}
                </Box>
              }
              id="employee-tab-2"
              aria-controls="employee-tabpanel-2"
            />
            <Tab 
              icon={<BankIcon />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Statutory, Banking & Access</span>
                  {getTabValidationStatus[3].hasErrors && (
                    <Chip 
                      label="✗" 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        minWidth: 20,
                        fontSize: '0.7rem',
                        bgcolor: '#fee2e2',
                        color: '#dc2626',
                        '& .MuiChip-label': { px: 0.5 }
                      }} 
                    />
                  )}
                  {!getTabValidationStatus[3].hasErrors && (
                    <Chip 
                      label="✓" 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        minWidth: 20,
                        fontSize: '0.7rem',
                        bgcolor: '#d1fae5',
                        color: '#059669',
                        '& .MuiChip-label': { px: 0.5 }
                      }} 
                    />
                  )}
                </Box>
              }
              id="employee-tab-3"
              aria-controls="employee-tabpanel-3"
            />
          </Tabs>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <PersonalInformationTab 
            formData={formData}
            errors={errors}
            touchedFields={touchedFields}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            selectedPhoto={selectedPhoto}
            photoPreview={photoPreview}
            onPhotoSelect={handlePhotoSelect}
            onPhotoRemove={handlePhotoRemove}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          {/* Combined Employment & Compensation Tab */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <EmploymentInformationTab
              formData={formData}
              errors={errors}
              touchedFields={touchedFields}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              departments={departments}
              positions={positions}
              managers={managers}
              loadingRefData={loadingRefData}
            />
            <Divider sx={{ my: 2 }}>
              <Chip label="Compensation Details" size="small" />
            </Divider>
            <SalaryStructureTab
              formData={formData}
              errors={errors}
              touchedFields={touchedFields}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
            />
          </Box>
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <ContactEmergencyTab
            formData={formData}
            errors={errors}
            touchedFields={touchedFields}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          {/* Combined Statutory, Banking & Access Tab */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StatutoryBankingTab
              formData={formData}
              errors={errors}
              touchedFields={touchedFields}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
            />
            <Divider sx={{ my: 2 }}>
              <Chip label="User Access" size="small" />
            </Divider>
            <UserAccountTab
              formData={formData}
              errors={errors}
              touchedFields={touchedFields}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
            />
          </Box>
        </TabPanel>

        {/* Modern Form Actions */}
        <Box 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            bgcolor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'grey.200',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              disabled={activeTab === 0}
              onClick={() => setActiveTab(prev => prev - 1)}
              variant="outlined"
              sx={{ 
                minWidth: 100,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Previous
            </Button>
            <Button
              disabled={activeTab === 3}
              variant="outlined"
              onClick={() => setActiveTab(prev => prev + 1)}
              sx={{ 
                minWidth: 100,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Next
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Progress Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Step {activeTab + 1} of 4
              </Typography>
              <Box 
                sx={{ 
                  width: 100, 
                  height: 4, 
                  bgcolor: 'grey.200', 
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    width: `${((activeTab + 1) / 4) * 100}%`, 
                    height: '100%', 
                    bgcolor: 'primary.main',
                    transition: 'width 0.3s ease'
                  }} 
                />
              </Box>
            </Box>
            
            {/* Validation Status */}
            <Chip 
              label={isCurrentTabValid ? "✓ Valid" : "⚠ Incomplete"}
              size="small"
              sx={{ 
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 28,
                color: isCurrentTabValid ? '#10b981' : '#f59e0b',
                bgcolor: isCurrentTabValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${isCurrentTabValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                '& .MuiChip-label': {
                  px: 1.5
                }
              }}
            />
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBackToEmployees}
                disabled={isLoading}
                startIcon={<ArrowBackIcon />}
                sx={{ 
                  minWidth: 120,
                  py: 1.5,
                  px: 3,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    bgcolor: '#f8fafc'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                onClick={handleSaveAsDraft}
                disabled={isLoading}
                startIcon={<SaveIcon />}
                sx={{ 
                  minWidth: 140,
                  py: 1.5,
                  px: 3,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'primary.50'
                  }
                }}
              >
                Save as Draft
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isLoading || !isCurrentTabValid}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{ 
                  minWidth: 180,
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4
                  },
                  '&:disabled': {
                    bgcolor: 'grey.300',
                    color: 'grey.500'
                  }
                }}
              >
                {isLoading ? 'Creating Employee...' : 'Create Employee'}
              </Button>
            </Box>
          </Box>
        </Box>
        </Card>
      </Box>
      
      {/* Unsaved Changes Warning Dialog */}
      <Dialog
        open={showUnsavedDialog}
        onClose={handleCancelNavigation}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: { xs: '90%', sm: 400 },
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6" component="span" fontWeight={600}>
            Unsaved Changes
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes that will be lost if you leave this page. 
            Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCancelNavigation}
            variant="outlined"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            Stay on Page
          </Button>
          <Button 
            onClick={handleConfirmNavigation}
            variant="contained"
            color="warning"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            Leave Without Saving
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Modern Personal Information Tab Component
const PersonalInformationTab = ({ 
  formData, 
  errors, 
  touchedFields = {},
  onChange, 
  onBlur,
  selectedPhoto, 
  photoPreview, 
  onPhotoSelect, 
  onPhotoRemove 
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {/* Profile Photo Section */}
    <Card 
      elevation={0} 
      sx={{ 
        p: 3, 
        bgcolor: 'primary.50', 
        border: '1px solid', 
        borderColor: 'primary.100',
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Avatar
          sx={{ 
            width: 80, 
            height: 80, 
            bgcolor: 'primary.main',
            fontSize: '2rem',
            fontWeight: 'bold'
          }}
          src={photoPreview}
        >
          {formData.firstName?.[0] || 'N'}{formData.lastName?.[0] || 'E'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h6" gutterBottom color="primary.main" fontWeight={700}>
            Employee Photo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a professional photo that will be used across the system
          </Typography>
          <PhotoUploadSimple
            photo={selectedPhoto}
            photoPreview={photoPreview}
            onPhotoSelect={onPhotoSelect}
            onPhotoRemove={onPhotoRemove}
            label="Upload Photo"
            size={120}
            helperText="JPEG, PNG or WebP • Max 5MB"
          />
        </Box>
      </Box>
    </Card>

    {/* Essential Information */}
    <Box>
      <Typography variant="h6" gutterBottom color="primary.main" fontWeight={700} sx={{ mb: 3 }}>
        Essential Information
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="firstName"
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            onBlur={() => onBlur && onBlur('firstName')}
            error={touchedFields.firstName && !!errors.firstName}
            helperText={touchedFields.firstName && errors.firstName ? errors.firstName : ''}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="lastName"
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            onBlur={() => onBlur && onBlur('lastName')}
            error={touchedFields.lastName && !!errors.lastName}
            helperText={touchedFields.lastName && errors.lastName ? errors.lastName : ''}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="employeeId"
            name="employeeId"
            label="Employee ID"
            value={formData.employeeId}
            onChange={(e) => onChange('employeeId', e.target.value)}
            onBlur={() => onBlur && onBlur('employeeId')}
            error={touchedFields.employeeId && !!errors.employeeId}
            helperText={touchedFields.employeeId && errors.employeeId ? errors.employeeId : "Unique identifier (e.g., EMP001)"}
            placeholder="EMP001"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            onBlur={() => onBlur && onBlur('email')}
            error={touchedFields.email && !!errors.email}
            helperText={touchedFields.email && errors.email ? errors.email : ''}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
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
          <TextField
            fullWidth
            id="phone"
            name="phone"
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 15);
              onChange('phone', value);
            }}
            onBlur={() => onBlur && onBlur('phone')}
            error={touchedFields.phone && !!errors.phone}
            helperText={touchedFields.phone && errors.phone ? errors.phone : 'Format: 1234567890 (10-15 digits)'}
            placeholder="1234567890"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Gender</InputLabel>
            <Select
              value={formData.gender}
              onChange={(e) => onChange('gender', e.target.value)}
              label="Gender"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Marital Status</InputLabel>
            <Select
              value={formData.maritalStatus}
              onChange={(e) => onChange('maritalStatus', e.target.value)}
              label="Marital Status"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="Single">Single</MenuItem>
              <MenuItem value="Married">Married</MenuItem>
              <MenuItem value="Divorced">Divorced</MenuItem>
              <MenuItem value="Widowed">Widowed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Nationality"
            value={formData.nationality}
            onChange={(e) => onChange('nationality', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
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
          <TextField
            fullWidth
            label="Address"
            value={formData.address}
            onChange={(e) => onChange('address', e.target.value)}
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="City"
            value={formData.city}
            onChange={(e) => onChange('city', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="State"
            value={formData.state}
            onChange={(e) => onChange('state', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="PIN Code"
            value={formData.pinCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              onChange('pinCode', value);
            }}
            error={!!errors.pinCode}
            helperText={errors.pinCode || 'Format: 123456 (6 digits)'}
            placeholder="123456"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Grid>
      </Grid>
    </Box>
  </Box>
);

// Employment Information Tab Component
const EmploymentInformationTab = ({ formData, errors, touchedFields = {}, onChange, onBlur, departments, positions, managers, loadingRefData }) => {
  // Filter positions by selected department (Cascading dropdown)
  const filteredPositions = React.useMemo(() => {
    if (!formData.departmentId) {
      return positions; // Show all positions if no department selected
    }
    return positions.filter(pos => pos.departmentId === formData.departmentId);
  }, [positions, formData.departmentId]);

  return (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="hireDate"
        name="hireDate"
        label="Hire Date"
        type="date"
        value={formData.hireDate}
        onChange={(e) => onChange('hireDate', e.target.value)}
        onBlur={() => onBlur && onBlur('hireDate')}
        error={touchedFields.hireDate && !!errors.hireDate}
        helperText={touchedFields.hireDate && errors.hireDate ? errors.hireDate : 'Date when employee was hired'}
        InputLabelProps={{ shrink: true }}
        required
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth error={touchedFields.departmentId && !!errors.departmentId} required>
        <InputLabel>Department</InputLabel>
        <Select
          id="departmentId"
          name="departmentId"
          value={formData.departmentId}
          onChange={(e) => {
            onChange('departmentId', e.target.value);
            // Clear position when department changes (cascading effect)
            if (formData.positionId) {
              const selectedPosition = positions.find(p => p.id === formData.positionId);
              if (selectedPosition && selectedPosition.departmentId !== e.target.value) {
                onChange('positionId', '');
              }
            }
          }}
          onBlur={() => onBlur && onBlur('departmentId')}
          label="Department"
          disabled={departments.length === 0}
        >
          {departments.length === 0 ? (
            <MenuItem value="" disabled>
              {loadingRefData ? 'Loading departments...' : 'No departments available'}
            </MenuItem>
          ) : (
            departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))
          )}
        </Select>
        <FormHelperText>
          {touchedFields.departmentId && errors.departmentId ? errors.departmentId : 'Select the department this employee belongs to'}
        </FormHelperText>
      </FormControl>
    </Grid>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth error={touchedFields.positionId && !!errors.positionId} required>
        <InputLabel>Position</InputLabel>
        <Select
          id="positionId"
          name="positionId"
          value={formData.positionId}
          onChange={(e) => onChange('positionId', e.target.value)}
          onBlur={() => onBlur && onBlur('positionId')}
          label="Position"
          disabled={filteredPositions.length === 0 || !formData.departmentId}
        >
          {filteredPositions.length === 0 ? (
            <MenuItem value="" disabled>
              {loadingRefData ? 'Loading positions...' : 
               !formData.departmentId ? 'Please select a department first' : 
               'No positions available for this department'}
            </MenuItem>
          ) : (
            filteredPositions.map((pos) => (
              <MenuItem key={pos.id} value={pos.id}>
                {pos.title}{pos.level ? ` (${pos.level})` : ''}
              </MenuItem>
            ))
          )}
        </Select>
        <FormHelperText>
          {touchedFields.positionId && errors.positionId ? errors.positionId :
           (formData.departmentId 
             ? `${filteredPositions.length} position(s) available in selected department` 
             : 'Select department first to see available positions')}
        </FormHelperText>
      </FormControl>
    </Grid>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Manager</InputLabel>
        <Select
          id="managerId"
          name="managerId"
          value={formData.managerId}
          onChange={(e) => onChange('managerId', e.target.value)}
          onBlur={() => onBlur && onBlur('managerId')}
          label="Manager"
        >
          <MenuItem value="">None</MenuItem>
          {managers.map((mgr) => (
            <MenuItem key={mgr.id} value={mgr.id}>
              {mgr.firstName} {mgr.lastName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Employment Type</InputLabel>
        <Select
          id="employmentType"
          name="employmentType"
          value={formData.employmentType}
          onChange={(e) => onChange('employmentType', e.target.value)}
          onBlur={() => onBlur && onBlur('employmentType')}
          label="Employment Type"
        >
          <MenuItem value="Full-time">Full-time</MenuItem>
          <MenuItem value="Part-time">Part-time</MenuItem>
          <MenuItem value="Contract">Contract</MenuItem>
          <MenuItem value="Intern">Intern</MenuItem>
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="workLocation"
        name="workLocation"
        label="Work Location"
        value={formData.workLocation}
        onChange={(e) => onChange('workLocation', e.target.value)}
        onBlur={() => onBlur && onBlur('workLocation')}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="probationPeriod"
        name="probationPeriod"
        label="Probation Period (months)"
        type="number"
        value={formData.probationPeriod}
        onChange={(e) => {
          const value = parseInt(e.target.value) || 0;
          if (value >= 0 && value <= 24) {
            onChange('probationPeriod', value);
          }
        }}
        onBlur={() => onBlur && onBlur('probationPeriod')}
        error={touchedFields.probationPeriod && !!errors.probationPeriod}
        helperText={touchedFields.probationPeriod && errors.probationPeriod ? errors.probationPeriod : "Number of months (0-24)"}
        inputProps={{ min: 0, max: 24 }}
        placeholder="6"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="noticePeriod"
        name="noticePeriod"
        label="Notice Period (days)"
        type="number"
        value={formData.noticePeriod}
        onChange={(e) => {
          const value = parseInt(e.target.value) || 0;
          if (value >= 0 && value <= 365) {
            onChange('noticePeriod', value);
          }
        }}
        onBlur={() => onBlur && onBlur('noticePeriod')}
        error={touchedFields.noticePeriod && !!errors.noticePeriod}
        helperText={errors.noticePeriod || "Number of days (0-365)"}
        inputProps={{ min: 0, max: 365 }}
        placeholder="30"
      />
    </Grid>
  </Grid>
);
};

// Salary Structure Tab Component
const SalaryStructureTab = ({ formData, errors, touchedFields = {}, onChange, onBlur }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>
        Basic Salary Information
      </Typography>
      <Divider sx={{ mb: 3 }} />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="salary.basicSalary"
        name="salary.basicSalary"
        label="Basic Salary"
        type="text"
        value={formData.salary?.basicSalary || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.basicSalary', value);
        }}
        onBlur={() => onBlur && onBlur('salary.basicSalary')}
        error={touchedFields['salary.basicSalary'] && !!errors['salary.basicSalary']}
        helperText={touchedFields['salary.basicSalary'] && errors['salary.basicSalary'] ? errors['salary.basicSalary'] : 'Optional: Enter basic salary amount'}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
        placeholder="50000"
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth error={touchedFields['salary.currency'] && !!errors['salary.currency']}>
        <InputLabel>Currency</InputLabel>
        <Select
          id="salary.currency"
          name="salary.currency"
          value={formData.salary?.currency || 'INR'}
          onChange={(e) => onChange('salary.currency', e.target.value)}
          onBlur={() => onBlur && onBlur('salary.currency')}
          label="Currency"
        >
          <MenuItem value="INR">INR</MenuItem>
          <MenuItem value="USD">USD</MenuItem>
          <MenuItem value="EUR">EUR</MenuItem>
          <MenuItem value="GBP">GBP</MenuItem>
        </Select>
        {touchedFields['salary.currency'] && errors['salary.currency'] && <FormHelperText>{errors['salary.currency']}</FormHelperText>}
      </FormControl>
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth error={touchedFields['salary.payFrequency'] && !!errors['salary.payFrequency']}>
        <InputLabel>Pay Frequency</InputLabel>
        <Select
          id="salary.payFrequency"
          name="salary.payFrequency"
          value={formData.salary?.payFrequency || 'monthly'}
          onChange={(e) => onChange('salary.payFrequency', e.target.value)}
          onBlur={() => onBlur && onBlur('salary.payFrequency')}
          label="Pay Frequency"
        >
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="biweekly">Bi-weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
          <MenuItem value="annually">Annually</MenuItem>
        </Select>
        {touchedFields['salary.payFrequency'] && errors['salary.payFrequency'] && <FormHelperText>{errors['salary.payFrequency']}</FormHelperText>}
      </FormControl>
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="salary.effectiveFrom"
        name="salary.effectiveFrom"
        label="Effective From"
        type="date"
        value={formData.salary?.effectiveFrom || ''}
        onChange={(e) => onChange('salary.effectiveFrom', e.target.value)}
        onBlur={() => onBlur && onBlur('salary.effectiveFrom')}
        error={touchedFields['salary.effectiveFrom'] && !!errors['salary.effectiveFrom']}
        helperText={touchedFields['salary.effectiveFrom'] && errors['salary.effectiveFrom'] ? errors['salary.effectiveFrom'] : ''}
        InputLabelProps={{ shrink: true }}
      />
    </Grid>

    {/* Allowances Section */}
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Allowances
      </Typography>
      <Divider sx={{ mb: 3 }} />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="salary.allowances.hra"
        name="salary.allowances.hra"
        label="House Rent Allowance (HRA)"
        type="text"
        value={formData.salary?.allowances?.hra || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.allowances.hra', value);
        }}
        onBlur={() => onBlur && onBlur('salary.allowances.hra')}
        error={touchedFields['salary.allowances.hra'] && !!errors['salary.allowances.hra']}
        helperText={touchedFields['salary.allowances.hra'] && errors['salary.allowances.hra'] ? errors['salary.allowances.hra'] : ''}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="salary.allowances.transport"
        name="salary.allowances.transport"
        label="Transport Allowance"
        type="text"
        value={formData.salary?.allowances?.transport || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.allowances.transport', value);
        }}
        onBlur={() => onBlur && onBlur('salary.allowances.transport')}
        error={touchedFields['salary.allowances.transport'] && !!errors['salary.allowances.transport']}
        helperText={touchedFields['salary.allowances.transport'] && errors['salary.allowances.transport'] ? errors['salary.allowances.transport'] : ''}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Medical Allowance"
        type="text"
        value={formData.salary?.allowances?.medical || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.allowances.medical', value);
        }}
        error={!!errors['salary.allowances.medical']}
        helperText={errors['salary.allowances.medical']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Food Allowance"
        type="text"
        value={formData.salary?.allowances?.food || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.allowances.food', value);
        }}
        error={!!errors['salary.allowances.food']}
        helperText={errors['salary.allowances.food']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Communication Allowance"
        type="text"
        value={formData.salary?.allowances?.communication || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.allowances.communication', value);
        }}
        error={!!errors['salary.allowances.communication']}
        helperText={errors['salary.allowances.communication']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Special Allowance"
        type="text"
        value={formData.salary?.allowances?.special || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.allowances.special', value);
        }}
        error={!!errors['salary.allowances.special']}
        helperText={errors['salary.allowances.special']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Other Allowance"
        type="text"
        value={formData.salary?.allowances?.other || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.allowances.other', value);
        }}
        error={!!errors['salary.allowances.other']}
        helperText={errors['salary.allowances.other']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>

    {/* Deductions Section */}
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Deductions
      </Typography>
      <Divider sx={{ mb: 3 }} />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Provident Fund (PF)"
        type="text"
        value={formData.salary?.deductions?.pf || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.deductions.pf', value);
        }}
        error={!!errors['salary.deductions.pf']}
        helperText={errors['salary.deductions.pf']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Professional Tax"
        type="text"
        value={formData.salary?.deductions?.professionalTax || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.deductions.professionalTax', value);
        }}
        error={!!errors['salary.deductions.professionalTax']}
        helperText={errors['salary.deductions.professionalTax']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Income Tax"
        type="text"
        value={formData.salary?.deductions?.incomeTax || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.deductions.incomeTax', value);
        }}
        error={!!errors['salary.deductions.incomeTax']}
        helperText={errors['salary.deductions.incomeTax']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="ESI (Employee State Insurance)"
        type="text"
        value={formData.salary?.deductions?.esi || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.deductions.esi', value);
        }}
        error={!!errors['salary.deductions.esi']}
        helperText={errors['salary.deductions.esi']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Other Deductions"
        type="text"
        value={formData.salary?.deductions?.other || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.deductions.other', value);
        }}
        error={!!errors['salary.deductions.other']}
        helperText={errors['salary.deductions.other']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>

    {/* Benefits Section */}
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Benefits & Incentives
      </Typography>
      <Divider sx={{ mb: 3 }} />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Bonus"
        type="text"
        value={formData.salary?.benefits?.bonus || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.benefits.bonus', value);
        }}
        error={!!errors['salary.benefits.bonus']}
        helperText={errors['salary.benefits.bonus']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Incentive"
        type="text"
        value={formData.salary?.benefits?.incentive || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.benefits.incentive', value);
        }}
        error={!!errors['salary.benefits.incentive']}
        helperText={errors['salary.benefits.incentive']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Overtime"
        type="text"
        value={formData.salary?.benefits?.overtime || ''}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '');
          onChange('salary.benefits.overtime', value);
        }}
        error={!!errors['salary.benefits.overtime']}
        helperText={errors['salary.benefits.overtime']}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        }}
      />
    </Grid>

    {/* Tax Information Section */}
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Tax Information
      </Typography>
      <Divider sx={{ mb: 3 }} />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth error={!!errors['salary.taxInformation.taxRegime']}>
        <InputLabel>Tax Regime</InputLabel>
        <Select
          value={formData.salary?.taxInformation?.taxRegime || 'old'}
          onChange={(e) => onChange('salary.taxInformation.taxRegime', e.target.value)}
          label="Tax Regime"
        >
          <MenuItem value="old">Old Tax Regime</MenuItem>
          <MenuItem value="new">New Tax Regime</MenuItem>
        </Select>
        {errors['salary.taxInformation.taxRegime'] && <FormHelperText>{errors['salary.taxInformation.taxRegime']}</FormHelperText>}
      </FormControl>
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="CTC (Cost to Company)"
        type="number"
        value={formData.salary?.taxInformation?.ctc || ''}
        onChange={(e) => onChange('salary.taxInformation.ctc', parseFloat(e.target.value) || 0)}
        error={!!errors['salary.taxInformation.ctc']}
        helperText={errors['salary.taxInformation.ctc']}
        inputProps={{ min: 0, step: 0.01 }}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Take Home Salary"
        type="number"
        value={formData.salary?.taxInformation?.takeHome || ''}
        onChange={(e) => onChange('salary.taxInformation.takeHome', parseFloat(e.target.value) || 0)}
        error={!!errors['salary.taxInformation.takeHome']}
        helperText={errors['salary.taxInformation.takeHome']}
        inputProps={{ min: 0, step: 0.01 }}
      />
    </Grid>

    {/* Additional Notes */}
    <Grid item xs={12}>
      <TextField
        fullWidth
        label="Salary Notes"
        multiline
        rows={3}
        value={formData.salary?.salaryNotes || ''}
        onChange={(e) => onChange('salary.salaryNotes', e.target.value)}
        error={!!errors['salary.salaryNotes']}
        helperText={errors['salary.salaryNotes'] || 'Additional notes about salary structure, benefits, or special conditions'}
      />
    </Grid>
  </Grid>
);

// Contact & Emergency Tab Component
const ContactEmergencyTab = ({ formData, errors, touchedFields = {}, onChange, onBlur }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>
        Emergency Contact Information
      </Typography>
      <Divider sx={{ mb: 3 }} />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="emergencyContactName"
        name="emergencyContactName"
        label="Emergency Contact Name"
        value={formData.emergencyContactName}
        onChange={(e) => onChange('emergencyContactName', e.target.value)}
        onBlur={() => onBlur && onBlur('emergencyContactName')}
        helperText="Optional"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="emergencyContactPhone"
        name="emergencyContactPhone"
        label="Emergency Contact Phone"
        value={formData.emergencyContactPhone}
        onChange={(e) => {
          // Only allow digits and limit to 15 characters
          const value = e.target.value.replace(/\D/g, '').slice(0, 15);
          onChange('emergencyContactPhone', value);
        }}
        onBlur={() => onBlur && onBlur('emergencyContactPhone')}
        error={touchedFields.emergencyContactPhone && !!errors.emergencyContactPhone}
        helperText={touchedFields.emergencyContactPhone && errors.emergencyContactPhone ? errors.emergencyContactPhone : 'Optional - Format: 1234567890 (10-15 digits)'}
        placeholder="1234567890"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth error={touchedFields.emergencyContactRelation && !!errors.emergencyContactRelation}>
        <InputLabel>Relationship</InputLabel>
        <Select
          id="emergencyContactRelation"
          name="emergencyContactRelation"
          value={formData.emergencyContactRelation}
          onChange={(e) => onChange('emergencyContactRelation', e.target.value)}
          onBlur={() => onBlur && onBlur('emergencyContactRelation')}
          label="Relationship"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          <MenuItem value="Spouse">Spouse</MenuItem>
          <MenuItem value="Parent">Parent</MenuItem>
          <MenuItem value="Child">Child</MenuItem>
          <MenuItem value="Sibling">Sibling</MenuItem>
          <MenuItem value="Friend">Friend</MenuItem>
          <MenuItem value="Guardian">Guardian</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </Select>
        {touchedFields.emergencyContactRelation && errors.emergencyContactRelation && (
          <FormHelperText>{errors.emergencyContactRelation}</FormHelperText>
        )}
      </FormControl>
    </Grid>
  </Grid>
);

// Statutory & Banking Tab Component
const StatutoryBankingTab = ({ formData, errors, touchedFields = {}, onChange, onBlur }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>
        Statutory Details
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        All statutory fields are optional but recommended for payroll compliance
      </Typography>
      <Divider sx={{ mb: 3 }} />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="aadhaarNumber"
        name="aadhaarNumber"
        label="Aadhaar Number"
        value={formData.aadhaarNumber}
        onChange={(e) => {
          // Only allow digits and limit to 12 characters
          const value = e.target.value.replace(/\D/g, '').slice(0, 12);
          onChange('aadhaarNumber', value);
        }}
        onBlur={() => onBlur && onBlur('aadhaarNumber')}
        error={touchedFields.aadhaarNumber && !!errors.aadhaarNumber}
        helperText={touchedFields.aadhaarNumber && errors.aadhaarNumber ? errors.aadhaarNumber : 'Optional - Format: 123456789012 (12 digits)'}
        placeholder="123456789012"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Aadhaar is a 12-digit unique identification number issued by UIDAI. Example: 123456789012" arrow>
                <IconButton edge="end" size="small">
                  <HelpIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="panNumber"
        name="panNumber"
        label="PAN Number"
        value={formData.panNumber}
        onChange={(e) => {
          // Format and validate PAN pattern
          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
          onChange('panNumber', value);
        }}
        onBlur={() => onBlur && onBlur('panNumber')}
        error={touchedFields.panNumber && !!errors.panNumber}
        helperText={touchedFields.panNumber && errors.panNumber ? errors.panNumber : 'Optional - Format: ABCDE1234F (5 letters, 4 digits, 1 letter)'}
        placeholder="ABCDE1234F"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="PAN (Permanent Account Number) format: 5 uppercase letters, 4 digits, 1 uppercase letter. Example: ABCDE1234F" arrow>
                <IconButton edge="end" size="small">
                  <HelpIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="uanNumber"
        name="uanNumber"
        label="UAN Number"
        value={formData.uanNumber}
        onChange={(e) => {
          // Allow alphanumeric only, uppercase, 12+ characters
          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
          onChange('uanNumber', value);
        }}
        onBlur={() => onBlur && onBlur('uanNumber')}
        error={touchedFields.uanNumber && !!errors.uanNumber}
        helperText={touchedFields.uanNumber && errors.uanNumber ? errors.uanNumber : 'Optional - Universal Account Number for EPF (12+ alphanumeric)'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="UAN (Universal Account Number) is a unique number allotted by EPFO for tracking EPF contributions. Format: 12 or more alphanumeric characters" arrow>
                <IconButton edge="end" size="small">
                  <HelpIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="pfNumber"
        name="pfNumber"
        label="PF Number"
        value={formData.pfNumber}
        onChange={(e) => onChange('pfNumber', e.target.value)}
        onBlur={() => onBlur && onBlur('pfNumber')}
        error={touchedFields.pfNumber && !!errors.pfNumber}
        helperText={touchedFields.pfNumber && errors.pfNumber ? errors.pfNumber : 'Optional - Employee Provident Fund number'}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="esiNumber"
        name="esiNumber"
        label="ESI Number"
        value={formData.esiNumber}
        onChange={(e) => {
          // Allow alphanumeric only, uppercase, 10-17 characters
          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
          onChange('esiNumber', value);
        }}
        onBlur={() => onBlur && onBlur('esiNumber')}
        error={touchedFields.esiNumber && !!errors.esiNumber}
        helperText={touchedFields.esiNumber && errors.esiNumber ? errors.esiNumber : 'Optional - Employee State Insurance number (10-17 alphanumeric)'}
        placeholder="ESI00000001234"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="ESI Number is a unique identification number for Employee State Insurance. Format: 10-17 alphanumeric characters" arrow>
                <IconButton edge="end" size="small">
                  <HelpIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }}
      />
    </Grid>
    
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Banking Details
      </Typography>
      <Divider sx={{ mb: 3 }} />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="bankName"
        name="bankName"
        label="Bank Name"
        value={formData.bankName}
        onChange={(e) => onChange('bankName', e.target.value)}
        onBlur={() => onBlur && onBlur('bankName')}
        error={touchedFields.bankName && !!errors.bankName}
        helperText={touchedFields.bankName && errors.bankName ? errors.bankName : 'Name of the bank'}
        placeholder="State Bank of India"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="bankAccountNumber"
        name="bankAccountNumber"
        label="Account Number"
        value={formData.bankAccountNumber}
        onChange={(e) => onChange('bankAccountNumber', e.target.value)}
        onBlur={() => onBlur && onBlur('bankAccountNumber')}
        error={touchedFields.bankAccountNumber && !!errors.bankAccountNumber}
        helperText={touchedFields.bankAccountNumber && errors.bankAccountNumber ? errors.bankAccountNumber : 'Bank account number (9-20 digits)'}
        placeholder="12345678901234"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        id="ifscCode"
        name="ifscCode"
        label="IFSC Code"
        value={formData.ifscCode}
        onChange={(e) => {
          // Format IFSC code: ABCD0123456 (4 letters, 1 zero, 6 alphanumeric)
          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
          onChange('ifscCode', value);
        }}
        onBlur={() => onBlur && onBlur('ifscCode')}
        error={touchedFields.ifscCode && !!errors.ifscCode}
        helperText={touchedFields.ifscCode && errors.ifscCode ? errors.ifscCode : 'Format: SBIN0000123 (4 letters, 0, 6 characters)'}
        placeholder="SBIN0000123"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="IFSC (Indian Financial System Code): 11 characters - 4 bank code letters + 0 + 6 branch code. Example: SBIN0000123" arrow>
                <IconButton edge="end" size="small">
                  <HelpIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Account Holder Name"
        value={formData.accountHolderName}
        onChange={(e) => onChange('accountHolderName', e.target.value)}
        error={!!errors.accountHolderName}
        helperText={errors.accountHolderName || 'Name as per bank records'}
        placeholder="John Doe"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Bank Branch"
        value={formData.bankBranch}
        onChange={(e) => onChange('bankBranch', e.target.value)}
        error={!!errors.bankBranch}
        helperText={errors.bankBranch || 'Branch name and location'}
        placeholder="Main Branch, Mumbai"
      />
    </Grid>
  </Grid>
);

// User Account Tab Component
const UserAccountTab = ({ formData, errors, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleUserAccountChange = (field, value) => {
    const newUserAccount = {
      ...formData.userAccount,
      [field]: value
    };
    
    onChange('userAccount', newUserAccount);
    
    // Real-time password validation
    if (field === 'password' || field === 'confirmPassword') {
      // You can add specific password validation here if needed
      // The main validation is handled by the validateField function
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleUserAccountChange('password', password);
    handleUserAccountChange('confirmPassword', password);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          User Account Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure login access and permissions for this employee
        </Typography>
      </Grid>

      {/* Enable Login Toggle */}
      <Grid item xs={12}>
        <Card sx={{ p: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.userAccount.enableLogin}
                onChange={(e) => {
                  handleUserAccountChange('enableLogin', e.target.checked);
                  if (e.target.checked && !formData.userAccount.password) {
                    handleUserAccountChange('password', 'password123');
                    handleUserAccountChange('confirmPassword', 'password123');
                  }
                }}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle1">Enable User Login</Typography>
                <Typography variant="body2" color="text.secondary">
                  Allow this employee to log into the system
                </Typography>
              </Box>
            }
          />
        </Card>
      </Grid>

      {formData.userAccount.enableLogin && (
        <>
          {/* Role Selection */}
          <Grid item xs={12}>
            <Card sx={{ p: 2 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">
                  <Typography variant="subtitle1">User Role</Typography>
                </FormLabel>
                <RadioGroup
                  value={formData.userAccount.role}
                  onChange={(e) => handleUserAccountChange('role', e.target.value)}
                  row
                  sx={{ mt: 1 }}
                >
                  <FormControlLabel 
                    value="employee" 
                    control={<Radio />} 
                    label="Employee" 
                  />
                  <FormControlLabel 
                    value="manager" 
                    control={<Radio />} 
                    label="Manager" 
                  />
                  <FormControlLabel 
                    value="hr" 
                    control={<Radio />} 
                    label="HR" 
                  />
                  <FormControlLabel 
                    value="admin" 
                    control={<Radio />} 
                    label="Admin" 
                  />
                </RadioGroup>
                
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {formData.userAccount.role === 'employee' && 'Basic access to personal information and requests'}
                    {formData.userAccount.role === 'manager' && 'Can manage team members and approve requests'}
                    {formData.userAccount.role === 'hr' && 'Can manage all employees and HR processes'}
                    {formData.userAccount.role === 'admin' && 'Full system access and administrative privileges'}
                  </Typography>
                </Box>
              </FormControl>
            </Card>
          </Grid>

          {/* Password Section */}
          <Grid item xs={12}>
            <Card sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1">Password Setup</Typography>
                <Button
                  onClick={generateRandomPassword}
                  startIcon={<RefreshIcon />}
                  size="small"
                  variant="outlined"
                >
                  Generate Password
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.userAccount.password}
                    onChange={(e) => handleUserAccountChange('password', e.target.value)}
                    error={!!errors['userAccount.password']}
                    helperText={errors['userAccount.password']}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      )
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.userAccount.confirmPassword}
                    onChange={(e) => handleUserAccountChange('confirmPassword', e.target.value)}
                    error={
                      !!errors['userAccount.confirmPassword'] ||
                      (formData.userAccount.password !== formData.userAccount.confirmPassword && 
                       formData.userAccount.confirmPassword !== '')
                    }
                    helperText={
                      errors['userAccount.confirmPassword'] ||
                      (formData.userAccount.password !== formData.userAccount.confirmPassword && 
                       formData.userAccount.confirmPassword !== ''
                        ? 'Passwords do not match'
                        : '')
                    }
                    required
                  />
                </Grid>
              </Grid>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.userAccount.forcePasswordChange}
                    onChange={(e) => handleUserAccountChange('forcePasswordChange', e.target.checked)}
                  />
                }
                label="Force password change on first login"
                sx={{ mt: 2 }}
              />
            </Card>
          </Grid>

          {/* Quick Setup Info */}
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="subtitle2">Quick Setup Tips:</Typography>
              <Typography variant="body2">
                • Default password: "password123" (recommended for new employees)
                • Use "Generate Password" for a secure random password
                • Force password change ensures security on first login
                • Employee role is recommended for most staff members
              </Typography>
            </Alert>
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default TabBasedEmployeeForm;
