import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  ContactPhone as ContactIcon,
  AccountBalance as BankIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { employeeService } from '../../../services/employee.service';

/**
 * Self-Service Employee Profile View
 * Allows employees to view their complete profile information
 * with appropriate privacy controls for sensitive data
 */
const MyProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [showSensitiveData, setShowSensitiveData] = useState({
    bank: false,
    statutory: false
  });

  // Load employee data
  useEffect(() => {
    const loadMyProfile = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get current user's employee ID
        const employeeId = user.employeeId || user.id;
        const response = await employeeService.get(employeeId);
        
        if (response.success) {
          setEmployee(response.data);
        } else {
          setError('Failed to load your profile information');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Unable to load your profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadMyProfile();
    }
  }, [user]);

  const toggleSensitiveData = (section) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const maskSensitiveData = (value, type = 'default') => {
    if (!value) return 'Not provided';
    
    switch (type) {
      case 'account':
        return `****${value.slice(-4)}`;
      case 'pan':
        return `${value.slice(0, 2)}****${value.slice(-2)}`;
      case 'aadhaar':
        return `****-****-${value.slice(-4)}`;
      default:
        return `****${value.slice(-2)}`;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'on leave': return 'warning';
      default: return 'default';
    }
  };

  const profileSections = [
    {
      label: 'Personal Information',
      icon: <PersonIcon />,
      component: 'personal'
    },
    {
      label: 'Employment Details',
      icon: <WorkIcon />,
      component: 'employment'
    },
    {
      label: 'Contact Information',
      icon: <ContactIcon />,
      component: 'contact'
    },
    {
      label: 'Statutory Information',
      icon: <SecurityIcon />,
      component: 'statutory'
    },
    {
      label: 'Banking Details',
      icon: <BankIcon />,
      component: 'banking'
    }
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading your profile...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!employee) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          No employee profile found. Please contact HR if this is an error.
        </Alert>
      </Container>
    );
  }

  const renderPersonalInfo = () => (
    <Card>
      <CardHeader 
        title="Personal Information"
        avatar={<Avatar><PersonIcon /></Avatar>}
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Full Name</Typography>
            <Typography variant="body1">{employee.firstName} {employee.lastName}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Employee ID</Typography>
            <Typography variant="body1">{employee.employeeId}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Email</Typography>
            <Typography variant="body1">{employee.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Phone</Typography>
            <Typography variant="body1">{employee.phone || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Date of Birth</Typography>
            <Typography variant="body1">{formatDate(employee.dateOfBirth)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Gender</Typography>
            <Typography variant="body1">{employee.gender || 'Not specified'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Marital Status</Typography>
            <Typography variant="body1">{employee.maritalStatus || 'Not specified'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Nationality</Typography>
            <Typography variant="body1">{employee.nationality || 'Not specified'}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderEmploymentInfo = () => (
    <Card>
      <CardHeader 
        title="Employment Details"
        avatar={<Avatar><WorkIcon /></Avatar>}
        action={
          <Chip 
            label={employee.status || 'Active'} 
            color={getStatusColor(employee.status)}
            variant="outlined"
          />
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Department</Typography>
            <Typography variant="body1">{employee.department?.name || 'Not assigned'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Position</Typography>
            <Typography variant="body1">{employee.position?.title || 'Not assigned'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Manager</Typography>
            <Typography variant="body1">
              {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : 'No manager assigned'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Employment Type</Typography>
            <Typography variant="body1">{employee.employmentType || 'Full-time'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Hire Date</Typography>
            <Typography variant="body1">{formatDate(employee.hireDate)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Joining Date</Typography>
            <Typography variant="body1">{formatDate(employee.joiningDate)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Confirmation Date</Typography>
            <Typography variant="body1">{formatDate(employee.confirmationDate)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Work Location</Typography>
            <Typography variant="body1">{employee.workLocation || 'Office'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Probation Period</Typography>
            <Typography variant="body1">{employee.probationPeriod || 6} months</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Notice Period</Typography>
            <Typography variant="body1">{employee.noticePeriod || 30} days</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderContactInfo = () => (
    <Card>
      <CardHeader 
        title="Contact & Address Information"
        avatar={<Avatar><ContactIcon /></Avatar>}
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Address</Typography>
            <Typography variant="body1">{employee.address || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="textSecondary">City</Typography>
            <Typography variant="body1">{employee.city || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="textSecondary">State</Typography>
            <Typography variant="body1">{employee.state || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="textSecondary">PIN Code</Typography>
            <Typography variant="body1">{employee.pinCode || 'Not provided'}</Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Emergency Contact Name</Typography>
            <Typography variant="body1">{employee.emergencyContactName || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Emergency Contact Phone</Typography>
            <Typography variant="body1">{employee.emergencyContactPhone || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Relationship</Typography>
            <Typography variant="body1">{employee.emergencyContactRelation || 'Not specified'}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderStatutoryInfo = () => (
    <Card>
      <CardHeader 
        title="Statutory Information"
        avatar={<Avatar><SecurityIcon /></Avatar>}
        action={
          <IconButton onClick={() => toggleSensitiveData('statutory')}>
            {showSensitiveData.statutory ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        }
      />
      <CardContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            This section contains sensitive information. Click the eye icon to {showSensitiveData.statutory ? 'hide' : 'show'} details.
          </Typography>
        </Alert>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Aadhaar Number</Typography>
            <Typography variant="body1">
              {showSensitiveData.statutory 
                ? (employee.aadhaarNumber || 'Not provided')
                : maskSensitiveData(employee.aadhaarNumber, 'aadhaar')
              }
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">PAN Number</Typography>
            <Typography variant="body1">
              {showSensitiveData.statutory 
                ? (employee.panNumber || 'Not provided')
                : maskSensitiveData(employee.panNumber, 'pan')
              }
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">UAN Number</Typography>
            <Typography variant="body1">
              {showSensitiveData.statutory 
                ? (employee.uanNumber || 'Not provided')
                : maskSensitiveData(employee.uanNumber)
              }
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">PF Number</Typography>
            <Typography variant="body1">
              {showSensitiveData.statutory 
                ? (employee.pfNumber || 'Not provided')
                : maskSensitiveData(employee.pfNumber)
              }
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">ESI Number</Typography>
            <Typography variant="body1">
              {showSensitiveData.statutory 
                ? (employee.esiNumber || 'Not provided')
                : maskSensitiveData(employee.esiNumber)
              }
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderBankingInfo = () => (
    <Card>
      <CardHeader 
        title="Banking Details"
        avatar={<Avatar><BankIcon /></Avatar>}
        action={
          <IconButton onClick={() => toggleSensitiveData('bank')}>
            {showSensitiveData.bank ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        }
      />
      <CardContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            This section contains sensitive banking information. Click the eye icon to {showSensitiveData.bank ? 'hide' : 'show'} details.
          </Typography>
        </Alert>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Bank Name</Typography>
            <Typography variant="body1">{employee.bankName || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Account Holder Name</Typography>
            <Typography variant="body1">{employee.accountHolderName || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Account Number</Typography>
            <Typography variant="body1">
              {showSensitiveData.bank 
                ? (employee.bankAccountNumber || 'Not provided')
                : maskSensitiveData(employee.bankAccountNumber, 'account')
              }
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">IFSC Code</Typography>
            <Typography variant="body1">{employee.ifscCode || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Bank Branch</Typography>
            <Typography variant="body1">{employee.bankBranch || 'Not provided'}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderStepContent = (step) => {
    switch (step) {
      case 0: return renderPersonalInfo();
      case 1: return renderEmploymentInfo();
      case 2: return renderContactInfo();
      case 3: return renderStatutoryInfo();
      case 4: return renderBankingInfo();
      default: return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
              <BadgeIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom>
                My Profile
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Review your personal and employment information
              </Typography>
            </Box>
          </Box>
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              variant="outlined"
              sx={{ mr: 2 }}
            >
              Back to Dashboard
            </Button>
            <Button
              startIcon={<EditIcon />}
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
              variant="contained"
              disabled={user.role === 'employee'} // Only allow editing if user has permission
            >
              Edit Profile
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Profile Content */}
      <Grid container spacing={3}>
        {/* Navigation Stepper */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {profileSections.map((section, index) => (
                <Step key={section.label}>
                  <StepLabel
                    icon={section.icon}
                    onClick={() => setActiveStep(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {section.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Profile Content */}
        <Grid item xs={12} md={9}>
          {renderStepContent(activeStep)}
          
          {/* Navigation Buttons */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={() => setActiveStep(prev => prev - 1)}
              variant="outlined"
            >
              Previous
            </Button>
            <Button
              disabled={activeStep === profileSections.length - 1}
              onClick={() => setActiveStep(prev => prev + 1)}
              variant="contained"
            >
              Next
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Information Alert */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Data Accuracy:</strong> Please review your information carefully. 
          If you notice any discrepancies or need to update your details, please contact HR or use the edit function if available.
          For sensitive information changes (banking, statutory details), additional verification may be required.
        </Typography>
      </Alert>
    </Container>
  );
};

export default MyProfile;