# 📋 Form Standardization & Error Recovery Implementation Guide

## 🎯 Form Standardization Recommendations

### Current State Analysis
Your codebase currently has multiple form implementations:
- `EmployeeForm.js` - Main employee form with tabs
- `ValidatedEmployeeForm.js` - Stepper-based form with validation
- `ResponsiveForm.js` - Generic responsive form wrapper
- `UserManagement.js` - User creation forms
- Various component-specific forms

### 🏗️ **Recommended Standardized Form Architecture**

#### **1. Universal Form Component**

Create a standardized form component that all forms should use:

```javascript
// components/common/StandardForm.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fade,
  LinearProgress
} from '@mui/material';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useNotification } from '../../contexts/NotificationContext';

const StandardForm = ({
  title,
  subtitle,
  steps = [],
  initialData = {},
  validationSchema = {},
  onSubmit,
  onCancel,
  submitText = "Submit",
  cancelText = "Cancel",
  showStepper = false,
  autoSave = false,
  autoSaveInterval = 30000,
  children,
  maxWidth = "md",
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showError, showWarning } = useNotification();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'

  // Enhanced form validation hook
  const {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    validateField,
    validateAll,
    resetForm,
    setFieldValue,
    setFieldError,
    getFieldProps
  } = useFormValidation({
    initialValues: initialData,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true
  });

  // Auto-save functionality
  React.useEffect(() => {
    if (!autoSave || !isDirty) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        // Call auto-save API endpoint
        await onAutoSave?.(values);
        setAutoSaveStatus('saved');
        showSuccess('Form auto-saved', { autoHideDuration: 2000 });
      } catch (error) {
        setAutoSaveStatus('error');
        showWarning('Auto-save failed', { autoHideDuration: 3000 });
      }
    }, autoSaveInterval);

    return () => clearTimeout(autoSaveTimer);
  }, [values, isDirty, autoSave, autoSaveInterval]);

  // Step validation
  const isStepValid = useCallback((stepIndex) => {
    if (!steps[stepIndex]?.fields) return true;
    
    const stepFields = steps[stepIndex].fields;
    return stepFields.every(field => !errors[field]);
  }, [steps, errors]);

  const canProceedToNextStep = useMemo(() => {
    return isStepValid(currentStep);
  }, [currentStep, isStepValid]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (!canProceedToNextStep) {
      setSubmitAttempted(true);
      // Validate current step fields
      const stepFields = steps[currentStep]?.fields || [];
      stepFields.forEach(field => validateField(field, values[field]));
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  }, [canProceedToNextStep, currentStep, steps, validateField, values]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleStepClick = useCallback((stepIndex) => {
    // Allow navigation to previous steps or valid next steps
    if (stepIndex <= currentStep || isStepValid(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  }, [currentStep, isStepValid]);

  // Enhanced submit handler
  const handleSubmit = useCallback(async (event) => {
    event?.preventDefault();
    setSubmitAttempted(true);
    
    try {
      // Validate entire form
      const validationResult = await validateAll();
      if (!validationResult.isValid) {
        setFormErrors(validationResult.errors);
        
        // Focus first error field
        const firstErrorField = Object.keys(validationResult.errors)[0];
        if (firstErrorField) {
          const element = document.querySelector(`[name="${firstErrorField}"]`);
          element?.focus();
        }
        
        showError('Please fix the errors below', { autoHideDuration: 5000 });
        return;
      }

      setIsSubmitting(true);
      setFormErrors({});
      
      // Call submit handler
      const result = await onSubmit(values);
      
      if (result?.success !== false) {
        showSuccess('Form submitted successfully');
        resetForm();
        setSubmitAttempted(false);
      } else {
        throw new Error(result?.message || 'Submission failed');
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle different types of errors
      if (error.response?.status === 422) {
        // Validation errors from backend
        const backendErrors = error.response.data.errors || {};
        setFormErrors(backendErrors);
        showError('Please fix the validation errors');
      } else if (error.response?.status === 409) {
        // Conflict errors (e.g., duplicate email)
        showError(error.response.data.message || 'Data conflict occurred');
      } else if (error.response?.status >= 500) {
        // Server errors
        showError('Server error occurred. Please try again later.');
      } else {
        // Generic errors
        showError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateAll, onSubmit, showSuccess, showError, resetForm]);

  // Render form content
  const renderFormContent = () => {
    if (typeof children === 'function') {
      return children({
        values,
        errors: { ...errors, ...formErrors },
        touched,
        isValid,
        isDirty,
        isSubmitting,
        submitAttempted,
        currentStep,
        handleChange,
        handleBlur,
        setFieldValue,
        setFieldError,
        getFieldProps
      });
    }
    return children;
  };

  return (
    <Paper 
      elevation={2}
      sx={{ 
        maxWidth: theme.breakpoints.values[maxWidth],
        mx: 'auto',
        p: { xs: 2, md: 4 },
        mt: 2
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        
        {/* Auto-save indicator */}
        {autoSave && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {autoSaveStatus === 'saving' && 'Saving...'}
              {autoSaveStatus === 'saved' && 'All changes saved'}
              {autoSaveStatus === 'error' && 'Auto-save failed'}
            </Typography>
            {autoSaveStatus === 'saving' && (
              <CircularProgress size={12} />
            )}
          </Box>
        )}
      </Box>

      {/* Progress indicator for multi-step forms */}
      {isSubmitting && (
        <LinearProgress sx={{ mb: 2 }} />
      )}

      {/* Stepper for multi-step forms */}
      {showStepper && steps.length > 1 && (
        <Stepper 
          activeStep={currentStep} 
          orientation={isMobile ? "vertical" : "horizontal"}
          sx={{ mb: 4 }}
        >
          {steps.map((step, index) => (
            <Step 
              key={step.label}
              completed={index < currentStep || isStepValid(index)}
            >
              <StepLabel 
                onClick={() => handleStepClick(index)}
                sx={{ 
                  cursor: index <= currentStep ? 'pointer' : 'default',
                  opacity: index <= currentStep ? 1 : 0.6
                }}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Global form errors */}
      {Object.keys(formErrors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Please fix the following errors:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {Object.entries(formErrors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Form content */}
      <form onSubmit={handleSubmit} noValidate>
        <Fade in={!isSubmitting}>
          <Box>
            {renderFormContent()}
          </Box>
        </Fade>

        {/* Form actions */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 4,
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2
        }}>
          {/* Navigation for multi-step forms */}
          {showStepper && steps.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleBack}
                disabled={currentStep === 0 || isSubmitting}
                variant="outlined"
              >
                Back
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNextStep || isSubmitting}
                  variant="contained"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  variant="contained"
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                >
                  {isSubmitting ? 'Submitting...' : submitText}
                </Button>
              )}
            </Box>
          )}

          {/* Single-step form actions */}
          {(!showStepper || steps.length <= 1) && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {onCancel && (
                <Button
                  onClick={onCancel}
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {cancelText}
                </Button>
              )}
              <Button
                type="submit"
                disabled={(!isValid && submitAttempted) || isSubmitting}
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? 'Submitting...' : submitText}
              </Button>
            </Box>
          )}
        </Box>
      </form>
    </Paper>
  );
};

export default StandardForm;
```

#### **2. Enhanced Form Field Components**

Create standardized field components:

```javascript
// components/common/FormFields.js
import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Switch,
  Autocomplete,
  DatePicker,
  InputAdornment,
  IconButton,
  Chip,
  Box
} from '@mui/material';
import { Visibility, VisibilityOff, Clear } from '@mui/icons-material';

// Standard Text Field with enhanced features
export const StandardTextField = ({
  name,
  label,
  required = false,
  type = 'text',
  multiline = false,
  rows = 1,
  placeholder,
  helperText,
  error,
  value,
  onChange,
  onBlur,
  disabled = false,
  clearable = false,
  showPasswordToggle = false,
  formatValue,
  maxLength,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  
  const handleChange = (event) => {
    let newValue = event.target.value;
    
    // Apply formatting if provided
    if (formatValue) {
      newValue = formatValue(newValue);
    }
    
    // Apply max length
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }
    
    onChange(newValue);
  };

  const handleClear = () => {
    onChange('');
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <TextField
      name={name}
      label={label}
      type={inputType}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      placeholder={placeholder}
      helperText={error || helperText}
      error={!!error}
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      fullWidth
      variant="outlined"
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            {clearable && value && (
              <IconButton onClick={handleClear} edge="end" size="small">
                <Clear />
              </IconButton>
            )}
            {type === 'password' && showPasswordToggle && (
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            )}
          </InputAdornment>
        ),
        ...props.InputProps
      }}
      {...props}
    />
  );
};

// Standard Select Field
export const StandardSelectField = ({
  name,
  label,
  required = false,
  options = [],
  value,
  onChange,
  onBlur,
  error,
  helperText,
  disabled = false,
  multiple = false,
  placeholder = "Select an option",
  ...props
}) => {
  return (
    <FormControl fullWidth error={!!error} disabled={disabled}>
      <InputLabel required={required}>{label}</InputLabel>
      <Select
        name={name}
        value={value || (multiple ? [] : '')}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        label={label}
        multiple={multiple}
        renderValue={multiple ? (selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => {
              const option = options.find(opt => opt.value === value);
              return (
                <Chip key={value} label={option?.label || value} size="small" />
              );
            })}
          </Box>
        ) : undefined}
        {...props}
      >
        {!multiple && (
          <MenuItem value="">
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {(error || helperText) && (
        <FormHelperText>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

// Standard Date Field
export const StandardDateField = ({
  name,
  label,
  required = false,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  disabled = false,
  minDate,
  maxDate,
  ...props
}) => {
  return (
    <DatePicker
      label={label}
      value={value ? new Date(value) : null}
      onChange={(newValue) => {
        const isoDate = newValue ? newValue.toISOString().split('T')[0] : '';
        onChange(isoDate);
      }}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      renderInput={(params) => (
        <TextField
          {...params}
          name={name}
          required={required}
          fullWidth
          error={!!error}
          helperText={error || helperText}
          onBlur={onBlur}
          {...props}
        />
      )}
    />
  );
};

// Auto-complete field for searching
export const StandardAutocompleteField = ({
  name,
  label,
  required = false,
  options = [],
  value,
  onChange,
  onBlur,
  error,
  helperText,
  disabled = false,
  multiple = false,
  loading = false,
  onSearch,
  ...props
}) => {
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    if (onSearch && inputValue) {
      const timer = setTimeout(() => {
        onSearch(inputValue);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [inputValue, onSearch]);

  return (
    <Autocomplete
      options={options}
      value={value || (multiple ? [] : null)}
      onChange={(event, newValue) => onChange(newValue)}
      onBlur={onBlur}
      disabled={disabled}
      multiple={multiple}
      loading={loading}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      getOptionLabel={(option) => option.label || option.name || option.toString()}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      renderInput={(params) => (
        <TextField
          {...params}
          name={name}
          label={label}
          required={required}
          error={!!error}
          helperText={error || helperText}
          {...props}
        />
      )}
      renderTags={multiple ? (value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            variant="outlined"
            label={option.label || option.name}
            {...getTagProps({ index })}
          />
        ))
      : undefined}
    />
  );
};
```

---

## 🔄 Enhanced Error Recovery Patterns

### **1. Retry Mechanism with Exponential Backoff**

```javascript
// utils/errorRecovery.js
export class ErrorRecoveryManager {
  constructor() {
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.baseDelay = 1000;
  }

  async executeWithRetry(operation, options = {}) {
    const {
      maxRetries = this.maxRetries,
      baseDelay = this.baseDelay,
      shouldRetry = this.defaultShouldRetry,
      onRetry,
      operationId = 'default'
    } = options;

    let attempt = 0;
    let lastError;

    while (attempt <= maxRetries) {
      try {
        const result = await operation();
        // Reset retry count on success
        this.retryAttempts.delete(operationId);
        return result;
      } catch (error) {
        lastError = error;
        attempt++;

        if (attempt > maxRetries || !shouldRetry(error, attempt)) {
          this.retryAttempts.delete(operationId);
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        
        // Track retry attempts
        this.retryAttempts.set(operationId, attempt);

        // Call retry callback if provided
        if (onRetry) {
          onRetry(error, attempt, delay);
        }

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  defaultShouldRetry(error, attempt) {
    // Retry on network errors, timeouts, and 5xx server errors
    if (!error.response) {
      return true; // Network error
    }

    const status = error.response.status;
    return status >= 500 || status === 408 || status === 429; // Server error, timeout, or rate limit
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRetryCount(operationId) {
    return this.retryAttempts.get(operationId) || 0;
  }
}

export const errorRecoveryManager = new ErrorRecoveryManager();
```

### **2. Enhanced API Service with Recovery**

```javascript
// services/enhancedApiService.js
import axios from 'axios';
import { errorRecoveryManager } from '../utils/errorRecovery';
import { notificationService } from '../contexts/NotificationContext';

class EnhancedApiService {
  constructor(baseURL) {
    this.api = axios.create({
      baseURL,
      timeout: 30000
    });

    this.setupInterceptors();
    this.offlineQueue = [];
    this.isOnline = navigator.onLine;
    this.setupOfflineHandling();
  }

  setupInterceptors() {
    // Request interceptor for auth tokens
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshToken();
            return this.api(originalRequest);
          } catch (refreshError) {
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // Handle offline scenarios
        if (!this.isOnline) {
          return this.handleOfflineRequest(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  setupOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
      notificationService.showSuccess('Connection restored. Syncing data...');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      notificationService.showWarning('You are offline. Changes will be saved locally.');
    });
  }

  async executeRequest(requestFn, options = {}) {
    const {
      showSuccessMessage,
      showErrorMessage = true,
      retryable = true,
      operationId,
      fallbackData
    } = options;

    try {
      let result;

      if (retryable) {
        result = await errorRecoveryManager.executeWithRetry(
          requestFn,
          {
            operationId,
            onRetry: (error, attempt, delay) => {
              notificationService.showWarning(
                `Request failed. Retrying in ${delay/1000}s... (Attempt ${attempt})`
              );
            }
          }
        );
      } else {
        result = await requestFn();
      }

      if (showSuccessMessage) {
        notificationService.showSuccess(showSuccessMessage);
      }

      return result.data;
    } catch (error) {
      console.error('API request failed:', error);

      if (showErrorMessage) {
        const errorMessage = this.getErrorMessage(error);
        notificationService.showError(errorMessage, {
          action: retryable ? {
            label: 'Retry',
            callback: () => this.executeRequest(requestFn, options)
          } : null
        });
      }

      // Return fallback data if available
      if (fallbackData !== undefined) {
        return fallbackData;
      }

      throw error;
    }
  }

  getErrorMessage(error) {
    if (!error.response) {
      return 'Network error. Please check your connection and try again.';
    }

    const { status, data } = error.response;

    switch (status) {
      case 400:
        return data.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return data.message || 'Data conflict. Please refresh and try again.';
      case 422:
        return 'Please fix the validation errors and try again.';
      case 429:
        return 'Too many requests. Please wait a moment before trying again.';
      case 500:
        return 'Server error. Our team has been notified.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return data.message || 'An unexpected error occurred.';
    }
  }

  async handleOfflineRequest(request) {
    // Queue request for when online
    return new Promise((resolve, reject) => {
      this.offlineQueue.push({
        request,
        resolve,
        reject,
        timestamp: Date.now()
      });
    });
  }

  async processOfflineQueue() {
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of queue) {
      try {
        const response = await this.api(item.request);
        item.resolve(response);
      } catch (error) {
        item.reject(error);
      }
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.api.post('/auth/refresh', {
      refreshToken
    });

    const { accessToken } = response.data;
    localStorage.setItem('accessToken', accessToken);

    return accessToken;
  }

  handleAuthError() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
}

export const apiService = new EnhancedApiService(process.env.REACT_APP_API_URL);
```

### **3. Smart Error Boundary Component**

```javascript
// components/common/SmartErrorBoundary.js
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Stack,
  Divider
} from '@mui/material';
import { Refresh, Home, BugReport } from '@mui/icons-material';

class SmartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // Send to error monitoring service (e.g., Sentry)
    console.error('Error caught by boundary:', error, errorInfo);
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleReportBug = () => {
    const errorReport = {
      error: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Open email client with pre-filled error report
    const subject = encodeURIComponent('Error Report - SkyRakSys HRM');
    const body = encodeURIComponent(
      `Please describe what you were doing when this error occurred:\n\n` +
      `Error Details:\n${JSON.stringify(errorReport, null, 2)}`
    );
    
    window.location.href = `mailto:support@skyraksys.com?subject=${subject}&body=${body}`;
  };

  render() {
    if (this.state.hasError) {
      const { error, retryCount } = this.state;
      const { fallback, level = 'page' } = this.props;

      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: level === 'page' ? '50vh' : '200px',
            p: 3
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Box textAlign="center">
                  <Typography variant="h5" color="error" gutterBottom>
                    Something went wrong
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {level === 'page' 
                      ? "We're sorry, but something unexpected happened while loading this page."
                      : "This component encountered an error and couldn't be displayed."
                    }
                  </Typography>
                </Box>

                {retryCount > 0 && (
                  <Alert severity="info">
                    Retry attempt #{retryCount}. If the problem persists, please report it.
                  </Alert>
                )}

                <Divider />

                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={this.handleRetry}
                  >
                    Try Again
                  </Button>
                  
                  {level === 'page' && (
                    <Button
                      variant="outlined"
                      startIcon={<Home />}
                      onClick={this.handleGoHome}
                    >
                      Go Home
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<BugReport />}
                    onClick={this.handleReportBug}
                  >
                    Report Issue
                  </Button>
                </Stack>

                {process.env.NODE_ENV === 'development' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="error">
                      Development Error Details:
                    </Typography>
                    <pre style={{ 
                      fontSize: '0.75rem',
                      backgroundColor: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {error?.toString()}
                    </pre>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default SmartErrorBoundary;
```

### **4. Hook for Form Error Recovery**

```javascript
// hooks/useErrorRecovery.js
import { useState, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

export const useErrorRecovery = (options = {}) => {
  const { showNotification } = useNotification();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  const {
    maxRecoveryAttempts = 3,
    onRecoverySuccess,
    onRecoveryFailure,
    onMaxAttemptsReached
  } = options;

  const executeWithRecovery = useCallback(async (operation, recoveryStrategies = []) => {
    try {
      const result = await operation();
      
      // Reset recovery state on success
      if (recoveryAttempts > 0) {
        setRecoveryAttempts(0);
        onRecoverySuccess?.();
        showNotification('Operation completed successfully', { type: 'success' });
      }
      
      return result;
    } catch (error) {
      console.error('Operation failed:', error);
      
      // Try recovery strategies
      for (const strategy of recoveryStrategies) {
        if (await strategy.canRecover(error)) {
          try {
            setIsRecovering(true);
            await strategy.recover(error);
            
            // Retry the original operation
            const result = await operation();
            setIsRecovering(false);
            setRecoveryAttempts(0);
            onRecoverySuccess?.();
            showNotification('Recovered successfully', { type: 'success' });
            return result;
          } catch (recoveryError) {
            console.error('Recovery strategy failed:', recoveryError);
          }
        }
      }
      
      setIsRecovering(false);
      setRecoveryAttempts(prev => prev + 1);
      
      if (recoveryAttempts >= maxRecoveryAttempts) {
        onMaxAttemptsReached?.(error);
        showNotification(
          'Maximum recovery attempts reached. Please contact support.',
          { type: 'error' }
        );
      } else {
        onRecoveryFailure?.(error, recoveryAttempts + 1);
        showNotification(
          `Operation failed. Attempt ${recoveryAttempts + 1} of ${maxRecoveryAttempts}`,
          { type: 'warning' }
        );
      }
      
      throw error;
    }
  }, [recoveryAttempts, maxRecoveryAttempts, onRecoverySuccess, onRecoveryFailure, onMaxAttemptsReached, showNotification]);

  return {
    executeWithRecovery,
    isRecovering,
    recoveryAttempts,
    hasReachedMaxAttempts: recoveryAttempts >= maxRecoveryAttempts
  };
};

// Common recovery strategies
export const recoveryStrategies = {
  tokenRefresh: {
    canRecover: (error) => error.response?.status === 401,
    recover: async (error) => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        // Attempt to refresh token
        await authService.refreshToken();
      } else {
        throw new Error('No refresh token available');
      }
    }
  },
  
  networkRetry: {
    canRecover: (error) => !error.response || error.code === 'NETWORK_ERROR',
    recover: async (error) => {
      // Wait for network to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if online
      if (!navigator.onLine) {
        throw new Error('Still offline');
      }
    }
  },
  
  dataRefresh: {
    canRecover: (error) => error.response?.status === 409, // Conflict
    recover: async (error) => {
      // Refresh data from server
      await dataService.refreshCache();
    }
  }
};
```

## 🎯 Implementation Steps

### **Phase 1: Form Standardization (Week 1-2)**
1. Create the `StandardForm` component
2. Create standardized field components
3. Migrate one form (Employee Form) to use new components
4. Test and validate the new implementation

### **Phase 2: Error Recovery Implementation (Week 3-4)**
1. Implement the enhanced API service with retry logic
2. Add the smart error boundary components
3. Create the error recovery hook
4. Update existing forms to use new error recovery patterns

### **Phase 3: Integration & Testing (Week 5-6)**
1. Migrate remaining forms to standardized components
2. Implement comprehensive error recovery across all forms
3. Add offline handling and data synchronization
4. Conduct thorough testing and user feedback

This implementation will significantly improve the consistency, reliability, and user experience of your form systems while providing robust error recovery mechanisms.