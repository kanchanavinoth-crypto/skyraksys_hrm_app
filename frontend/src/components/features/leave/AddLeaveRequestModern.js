import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Paper,
  Alert,
  Chip,
  Stack,
  Divider,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  EventAvailable as EventAvailableIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import LeaveDataService from '../../../services/LeaveService';
import { useAuth } from '../../../contexts/AuthContext';

const AddLeaveRequestModern = () => {
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    totalDays: 0,
    reason: '',
    isCancellation: false,  // Track if this is a cancellation request
    originalLeaveRequestId: '' // NEW: ID of leave request being cancelled
  });

  // UI state
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [requestType, setRequestType] = useState('new'); // 'new' or 'cancellation'
  const [existingLeaveRequests, setExistingLeaveRequests] = useState([]); // NEW: For cancellation dropdown

  // Load initial data
  useEffect(() => {
    loadLeaveTypes();
    loadExistingLeaveRequests(); // Load user's leave requests for cancellation
    
    // Auto-select current user (leave requests can only be submitted by the user themselves)
    if (user) {
      setFormData(prev => ({ ...prev, employeeId: user.id }));
    }
  }, [user]);

  // Load leave balance when employee and leave type are selected
  useEffect(() => {
    if (formData.employeeId && formData.leaveTypeId) {
      loadLeaveBalance();
    }
  }, [formData.employeeId, formData.leaveTypeId]);

  // Calculate days when dates change
  useEffect(() => {
    calculateTotalDays();
  }, [formData.startDate, formData.endDate]);

  const loadLeaveTypes = async () => {
    try {
      console.log('Loading leave types...');
      const response = await LeaveDataService.getLeaveTypes();
      console.log('Leave types API response:', response.data);
      
      if (response.data.success && response.data.data) {
        // Map to include color coding and extract only needed fields
        const typesWithColors = response.data.data.map(type => ({
          id: type.id,
          name: type.name,
          description: type.description,
          maxDaysPerYear: type.maxDaysPerYear,
          color: getLeaveTypeColor(type.name)
        }));
        console.log('Leave types loaded:', typesWithColors);
        setLeaveTypes(typesWithColors);
      } else {
        console.warn('Invalid leave types response, using fallback');
        // Fallback to default types if API fails (without hardcoded max days)
        setLeaveTypes([
          { id: 1, name: 'Annual Leave', color: '#4caf50' },
          { id: 2, name: 'Sick Leave', color: '#ff9800' },
          { id: 3, name: 'Personal Leave', color: '#2196f3' },
          { id: 4, name: 'Emergency Leave', color: '#f44336' }
        ]);
      }
    } catch (err) {
      console.error('Error loading leave types:', err);
      // Fallback to default types if API fails (without hardcoded max days)
      setLeaveTypes([
        { id: 1, name: 'Annual Leave', color: '#4caf50' },
        { id: 2, name: 'Sick Leave', color: '#ff9800' },
        { id: 3, name: 'Personal Leave', color: '#2196f3' },
        { id: 4, name: 'Emergency Leave', color: '#f44336' }
      ]);
    }
  };

  const loadExistingLeaveRequests = async () => {
    try {
      console.log('Loading existing leave requests for cancellation...');
      // Fetch user's leave requests with status 'Pending' or 'Approved'
      const response = await LeaveDataService.getAll();
      console.log('Leave requests API response:', response.data);
      
      if (response.data.success && response.data.data) {
        // Filter for Pending and Approved requests only
        const cancellableRequests = response.data.data.filter(
          req => req.status?.toLowerCase() === 'pending' || req.status?.toLowerCase() === 'approved'
        );
        console.log('Cancellable requests:', cancellableRequests);
        setExistingLeaveRequests(cancellableRequests);
      } else {
        setExistingLeaveRequests([]);
      }
    } catch (err) {
      console.error('Error loading existing leave requests:', err);
      setExistingLeaveRequests([]);
    }
  };

  const getLeaveTypeColor = (name) => {
    const colorMap = {
      'Annual Leave': '#4caf50',
      'Sick Leave': '#ff9800',
      'Personal Leave': '#2196f3',
      'Emergency Leave': '#f44336',
      'Maternity Leave': '#e91e63',
      'Paternity Leave': '#9c27b0'
    };
    return colorMap[name] || '#2196f3';
  };

  const loadLeaveBalance = async () => {
    try {
      console.log('Loading leave balance...', { 
        employeeId: formData.employeeId, 
        leaveTypeId: formData.leaveTypeId 
      });
      
      // Use user's own balance (from JWT token)
      const response = await LeaveDataService.getLeaveBalances();
      console.log('Balance API response:', response.data);
      
      if (response.data.success && response.data.data) {
        // Find the balance for the selected leave type
        const balance = response.data.data.find(
          b => b.leaveTypeId === formData.leaveTypeId
        );
        console.log('Found balance:', balance);
        setLeaveBalance(balance || null);
        
        if (!balance) {
          console.warn('No balance found for leave type:', formData.leaveTypeId);
        }
      } else {
        console.warn('Invalid balance response:', response.data);
        setLeaveBalance(null);
      }
    } catch (err) {
      console.error('Error loading leave balance:', err);
      console.error('Error details:', err.response?.data);
      setLeaveBalance(null);
    }
  };

  const calculateTotalDays = () => {
    const { startDate, endDate } = formData;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end >= start) {
        const timeDiff = end.getTime() - start.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        setFormData(prev => ({ ...prev, totalDays: daysDiff }));
      } else {
        setFormData(prev => ({ ...prev, totalDays: 0 }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.employeeId) {
      errors.employeeId = 'Please select an employee';
    }

    // For cancellation, validate original leave request selection
    if (formData.isCancellation && !formData.originalLeaveRequestId) {
      errors.originalLeaveRequestId = 'Please select a leave request to cancel';
    }

    if (!formData.leaveTypeId) {
      errors.leaveTypeId = 'Please select a leave type';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        errors.endDate = 'End date must be after start date';
      }
    }

    if (!formData.reason || formData.reason.trim().length < 10) {
      errors.reason = 'Please provide a detailed reason (minimum 10 characters)';
    }

    if (formData.totalDays <= 0) {
      errors.totalDays = 'Total days must be greater than 0';
    }

    if (leaveBalance && formData.totalDays > leaveBalance.balance) {
      errors.totalDays = `Insufficient leave balance. Available: ${leaveBalance.balance} days`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    setLoading(true);

    // Backend uses JWT token for employeeId, not from request body
    const data = {
      leaveTypeId: formData.leaveTypeId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason.trim(),
      isHalfDay: false, // Can be extended later for half-day support
      isCancellation: formData.isCancellation, // Flag for cancellation requests
      cancellationNote: formData.isCancellation ? formData.reason.trim() : undefined,
      originalLeaveRequestId: formData.isCancellation ? formData.originalLeaveRequestId : undefined
    };

    try {
      console.log('Submitting leave request:', data);
      const response = await LeaveDataService.create(data);
      console.log('Submit response:', response.data);
      
      if (response.data.success) {
        const successMessage = formData.isCancellation 
          ? 'Leave cancellation request submitted successfully! Your request will be reviewed.'
          : 'Leave request submitted successfully!';
        setSuccess(successMessage);
        setSubmitted(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          handleNewRequest();
        }, 3000);
      } else {
        const errorMsg = response.data.message || 'Failed to submit leave request';
        console.error('Submit failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error submitting leave request:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Submitted data was:', data);
      console.error('Selected leave type:', getSelectedLeaveType());
      
      // Extract validation errors if available
      let errorMsg = 'Failed to submit leave request. Please try again.';
      
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Backend returned validation errors
        console.error('Validation errors:', err.response.data.errors);
        const validationMessages = err.response.data.errors.map(e => 
          `${e.field}: ${e.message}`
        ).join(', ');
        errorMsg = `Validation failed: ${validationMessages}`;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequest = () => {
    setFormData({
      employeeId: user?.id || '',
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      totalDays: 0,
      reason: '',
      isCancellation: false,
      originalLeaveRequestId: ''
    });
    setRequestType('new'); // Reset to new request
    setSubmitted(false);
    setError('');
    setSuccess('');
    setValidationErrors({});
    setLeaveBalance(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getSelectedLeaveType = () => {
    return leaveTypes.find(type => type.id === formData.leaveTypeId);
  };

  if (submitted) {
    const isCancellationRequest = formData.isCancellation;
    return (
      <Box sx={{ p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            maxWidth: 600,
            mx: 'auto',
            mt: 8,
            p: 6,
            textAlign: 'center',
            bgcolor: isCancellationRequest ? 'warning.50' : 'success.50',
            border: '2px solid',
            borderColor: isCancellationRequest ? 'warning.main' : 'success.main',
            borderRadius: 2
          }}
        >
          <CheckCircleIcon 
            sx={{ 
              fontSize: 80, 
              color: isCancellationRequest ? 'warning.main' : 'success.main', 
              mb: 2 
            }} 
          />
          <Typography 
            variant="h4" 
            gutterBottom 
            color={isCancellationRequest ? 'warning.main' : 'success.main'} 
            fontWeight="bold"
          >
            {isCancellationRequest ? 'Cancellation Request Submitted!' : 'Request Submitted!'}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {isCancellationRequest 
              ? 'Your leave cancellation request has been submitted successfully and is pending approval.'
              : 'Your leave request has been submitted successfully and is pending approval.'
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You will be notified once your request is reviewed.
          </Typography>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<RefreshIcon />}
            onClick={handleNewRequest}
          >
            Submit Another Request
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: 'white',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <CalendarIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              Leave Request
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submit your leave application for approval
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Left Column - Form */}
          <Grid item xs={12} lg={8}>
            {/* Current User Info */}
            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Requesting leave for:</strong> {user?.firstName} {user?.lastName} (ID: {user?.employeeId || user?.id})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Note: You can only submit leave requests for yourself
              </Typography>
            </Alert>

            {/* Request Type Toggle */}
            <Card sx={{ mb: 3, bgcolor: requestType === 'cancellation' ? 'warning.50' : 'background.paper' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Request Type
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack direction="row" spacing={2}>
                  <Button
                    variant={requestType === 'new' ? 'contained' : 'outlined'}
                    color="primary"
                    onClick={() => {
                      setRequestType('new');
                      setFormData(prev => ({ ...prev, isCancellation: false }));
                    }}
                    fullWidth
                  >
                    New Leave Request
                  </Button>
                  <Button
                    variant={requestType === 'cancellation' ? 'contained' : 'outlined'}
                    color="warning"
                    onClick={() => {
                      setRequestType('cancellation');
                      setFormData(prev => ({ ...prev, isCancellation: true }));
                    }}
                    fullWidth
                  >
                    Cancel Existing Leave
                  </Button>
                </Stack>
                {requestType === 'cancellation' && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Cancellation Request:</strong> Select the dates of the approved leave you want to cancel. 
                      Your request will be reviewed by management.
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Leave Details */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {requestType === 'cancellation' ? 'Select Leave to Cancel' : 'Leave Details'}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  {/* Cancellation: Show dropdown of existing requests */}
                  {requestType === 'cancellation' && (
                    <Grid item xs={12}>
                      <FormControl fullWidth error={!!validationErrors.originalLeaveRequestId}>
                        <InputLabel>Select Leave Request to Cancel *</InputLabel>
                        <Select
                          value={formData.originalLeaveRequestId}
                          label="Select Leave Request to Cancel *"
                          onChange={(e) => {
                            const selectedRequest = existingLeaveRequests.find(r => r.id === e.target.value);
                            if (selectedRequest) {
                              setFormData(prev => ({
                                ...prev,
                                originalLeaveRequestId: selectedRequest.id,
                                leaveTypeId: selectedRequest.leaveTypeId,
                                startDate: selectedRequest.startDate,
                                endDate: selectedRequest.endDate,
                                totalDays: selectedRequest.totalDays || selectedRequest.days || 0
                              }));
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>Select a leave request</em>
                          </MenuItem>
                          {existingLeaveRequests.length === 0 ? (
                            <MenuItem disabled>
                              <em>No pending/approved leave requests found</em>
                            </MenuItem>
                          ) : (
                            existingLeaveRequests.map((request) => {
                              const leaveTypeName = typeof request.leaveType === 'object' 
                                ? request.leaveType.name 
                                : leaveTypes.find(t => t.id === request.leaveTypeId)?.name || 'Leave';
                              const statusChipColor = request.status?.toLowerCase() === 'approved' ? 'success' : 'warning';
                              
                              return (
                                <MenuItem key={request.id} value={request.id}>
                                  <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                                    <Chip 
                                      label={leaveTypeName} 
                                      size="small" 
                                      color="primary"
                                      sx={{ minWidth: 100 }}
                                    />
                                    <Typography variant="body2">
                                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ({request.totalDays || request.days || 0} days)
                                    </Typography>
                                    <Chip 
                                      label={request.status?.toUpperCase()} 
                                      size="small" 
                                      color={statusChipColor}
                                    />
                                  </Stack>
                                </MenuItem>
                              );
                            })
                          )}
                        </Select>
                        {validationErrors.originalLeaveRequestId && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                            {validationErrors.originalLeaveRequestId}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                  )}

                  {/* New Request: Show leave type dropdown */}
                  {requestType === 'new' && (
                    <Grid item xs={12}>
                      <FormControl fullWidth error={!!validationErrors.leaveTypeId}>
                        <InputLabel>Leave Type *</InputLabel>
                      <Select
                        value={formData.leaveTypeId}
                        label="Leave Type *"
                        onChange={(e) => handleInputChange('leaveTypeId', e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Select a leave type</em>
                        </MenuItem>
                        {leaveTypes.map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor: type.color
                                }}
                              />
                              <Typography>{type.name}</Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                      {validationErrors.leaveTypeId && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                          {validationErrors.leaveTypeId}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  )}

                  {/* Start Date */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: (() => {
                          const twoWeeksAgo = new Date();
                          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                          return twoWeeksAgo.toISOString().split('T')[0];
                        })(),
                        readOnly: requestType === 'cancellation' // Read-only for cancellation
                      }}
                      disabled={requestType === 'cancellation'}
                      error={!!validationErrors.startDate}
                      helperText={validationErrors.startDate || (requestType === 'new' ? 'Can select up to 2 weeks in the past' : 'Auto-filled from selected request')}
                    />
                  </Grid>

                  {/* End Date */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: formData.startDate || (() => {
                          const twoWeeksAgo = new Date();
                          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                          return twoWeeksAgo.toISOString().split('T')[0];
                        })(),
                        readOnly: requestType === 'cancellation' // Read-only for cancellation
                      }}
                      disabled={requestType === 'cancellation'}
                      error={!!validationErrors.endDate}
                      helperText={validationErrors.endDate}
                    />
                  </Grid>

                  {/* Total Days - Read-only */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Total Days"
                      value={formData.totalDays}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <Chip 
                              label={`${formData.totalDays} day${formData.totalDays !== 1 ? 's' : ''}`}
                              color={formData.totalDays > 0 ? 'primary' : 'default'}
                              size="small"
                            />
                          </InputAdornment>
                        )
                      }}
                      error={!!validationErrors.totalDays}
                      helperText={validationErrors.totalDays || 'Automatically calculated based on start and end dates'}
                    />
                  </Grid>

                  {/* Reason */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={requestType === 'cancellation' ? 'Reason for Cancellation' : 'Reason for Leave'}
                      multiline
                      rows={4}
                      required
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder={
                        requestType === 'cancellation'
                          ? 'Please explain why you need to cancel this approved leave...'
                          : 'Please provide a detailed reason for your leave request...'
                      }
                      error={!!validationErrors.reason}
                      helperText={validationErrors.reason || `${formData.reason.length}/500 characters (minimum 10)`}
                      inputProps={{ maxLength: 500 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                type="button"
                variant="outlined"
                size="large"
                onClick={handleNewRequest}
                disabled={loading}
              >
                Reset Form
              </Button>
              <Button
                type="submit"
                variant="outlined"
                color={requestType === 'cancellation' ? 'warning' : 'primary'}
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                disabled={loading || !formData.employeeId}
                sx={{ minWidth: 200 }}
              >
                {loading 
                  ? 'Submitting...' 
                  : requestType === 'cancellation' 
                    ? 'Submit Cancellation Request' 
                    : 'Submit Leave Request'
                }
              </Button>
            </Box>
          </Grid>

          {/* Right Column - Info Panel */}
          <Grid item xs={12} lg={4}>
            {/* Leave Balance Card - Only show for new requests, not cancellations */}
            {leaveBalance && formData.leaveTypeId && requestType === 'new' && (
              <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <EventAvailableIcon color="primary" />
                    <Typography variant="h6" color="primary">
                      Current Balance
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Leave Type
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {getSelectedLeaveType()?.name}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Available Balance
                      </Typography>
                      <Typography 
                        variant="h4" 
                        fontWeight="bold"
                        color={leaveBalance.balance < 5 ? 'error' : 'success.main'}
                      >
                        {leaveBalance.balance} days
                      </Typography>
                    </Box>

                    <Divider />

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Total Allocated
                        </Typography>
                        <Typography variant="body2">
                          {(Number(leaveBalance.totalAccrued || 0) + Number(leaveBalance.carryForward || 0)).toFixed(1)} days
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Taken
                        </Typography>
                        <Typography variant="body2">
                          {leaveBalance.totalTaken || 0} days
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Pending
                        </Typography>
                        <Typography variant="body2">
                          {leaveBalance.totalPending || 0} days
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Requesting
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formData.totalDays} days
                        </Typography>
                      </Grid>
                    </Grid>

                    {formData.totalDays > 0 && (
                      <>
                        <Divider />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Balance After Request
                          </Typography>
                          <Typography 
                            variant="h6" 
                            fontWeight="bold"
                            color={
                              (leaveBalance.balance - formData.totalDays) < 0 
                                ? 'error' 
                                : (leaveBalance.balance - formData.totalDays) < 3
                                  ? 'warning.main'
                                  : 'success.main'
                            }
                          >
                            {(leaveBalance.balance - formData.totalDays).toFixed(1)} days
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Stack>

                  {leaveBalance.balance < 5 && (
                    <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
                      <Typography variant="caption">
                        Low balance! You have only {leaveBalance.balance} days remaining.
                      </Typography>
                    </Alert>
                  )}

                  {formData.totalDays > leaveBalance.balance && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      <Typography variant="caption">
                        Insufficient balance! You need {formData.totalDays - leaveBalance.balance} more days.
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Guidelines Card */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  <InfoIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'middle' }} />
                  Guidelines
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Stack spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    • Submit requests at least 3 days in advance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Emergency leaves can be submitted same-day
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Provide detailed reasons for approval
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Check your leave balance before requesting
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • You'll receive email notification on approval/rejection
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Contact HR for leave policy questions
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default AddLeaveRequestModern;
