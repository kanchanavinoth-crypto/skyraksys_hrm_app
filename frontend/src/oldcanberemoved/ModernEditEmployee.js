import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Avatar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
  Stack,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Delete as DeleteIcon,
  VpnKey as VpnKeyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { employeeService } from '../services/employee.service';
import { salaryService } from '../services/salary.service';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

const ModernEditEmployee = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isHR } = useAuth();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Employee data
  const [employeeData, setEmployeeData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    department: '',
    position: '',
    status: '',
    hireDate: '',
    salary: '',
    hasUserAccount: false,
    userRole: '',
    isUserActive: false,
    // Personal Details
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    nationality: '',
    maritalStatus: '',
    pinCode: '',
    // Employment Details
    employmentType: '',
    workLocation: '',
    reportingManager: '',
    joiningDate: '',
    confirmationDate: '',
    probationPeriod: '',
    noticePeriod: '',
    // Compensation Details
    payFrequency: '',
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    // Statutory Information
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
    accountHolderName: ''
  });

  // Password reset dialog
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // User account creation dialog
  const [userAccountDialog, setUserAccountDialog] = useState(false);
  const [createUserRole, setCreateUserRole] = useState('employee');
  const [createUserPassword, setCreateUserPassword] = useState('');

  // Dropdown data
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  const roles = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr', label: 'HR Manager' },
    { value: 'admin', label: 'Administrator' }
  ];

  useEffect(() => {
    loadEmployeeData();
    loadDropdownData();
  }, [id]);

  const loadDropdownData = async () => {
    try {
      // Load departments
      const deptResponse = await employeeService.getDepartments();
      setDepartments(deptResponse || []);
      
      // Load positions
      const posResponse = await employeeService.getPositions();
      setPositions(posResponse || []);
    } catch (err) {
      console.error('Error loading dropdown data:', err);
    }
  };

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading employee data for ID:', id);
      console.log('Current URL:', window.location.href);
      
      // Load employee data from API
      const employee = await employeeService.get(id);
      console.log('Employee data loaded:', employee);
      
      // Try to get user account information
      let userAccountData = null;
      try {
        const userResult = await authService.getUserByEmployeeId(id);
        userAccountData = userResult.data;
        console.log('User account data:', userAccountData);
      } catch (err) {
        // Employee might not have a user account
        console.log('No user account found for employee:', err.message);
      }
      
      setEmployeeData({
        id: employee.id,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        employeeId: employee.employeeId || '',
        department: employee.department?.name || employee.departmentId || '',
        position: employee.position?.name || employee.positionId || '',
        status: employee.status || 'active',
        hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
        salary: employee.salary || '',
        hasUserAccount: !!userAccountData?.user,
        userRole: userAccountData?.user?.role || '',
        isUserActive: userAccountData?.user?.isActive || false,
        userId: userAccountData?.user?.id || null,
        // Personal Details
        dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
        gender: employee.gender || '',
        address: employee.address || '',
        city: employee.city || '',
        state: employee.state || '',
        zipCode: employee.zipCode || '',
        nationality: employee.nationality || '',
        maritalStatus: employee.maritalStatus || '',
        pinCode: employee.pinCode || '',
        // Employment Details
        employmentType: employee.employmentType || '',
        workLocation: employee.workLocation || '',
        reportingManager: employee.reportingManager || '',
        joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
        confirmationDate: employee.confirmationDate ? employee.confirmationDate.split('T')[0] : '',
        probationPeriod: employee.probationPeriod || '',
        noticePeriod: employee.noticePeriod || '',
        // Compensation Details
        payFrequency: employee.payFrequency || '',
        // Emergency Contact
        emergencyContactName: employee.emergencyContactName || '',
        emergencyContactPhone: employee.emergencyContactPhone || '',
        emergencyContactRelation: employee.emergencyContactRelation || '',
        // Statutory Information
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
        accountHolderName: employee.accountHolderName || ''
      });
    } catch (err) {
      console.error('Error loading employee:', err);
      
      // More detailed error message
      let errorMessage = 'Failed to load employee data';
      if (err.response?.status === 404) {
        errorMessage = `Employee with ID "${id}" not found. Please check the URL or contact your administrator.`;
      } else if (err.response?.status === 401) {
        errorMessage = 'You are not authorized to view this employee. Please log in again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to view this employee.';
      } else if (err.message) {
        errorMessage = `Failed to load employee data: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEmployeeData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSaveEmployee = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Prepare employee data (exclude user-specific fields)
      const employeeUpdateData = {
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.email,
        phone: employeeData.phone,
        department: employeeData.department,
        position: employeeData.position,
        status: employeeData.status,
        hireDate: employeeData.hireDate,
        salary: employeeData.salary
      };
      
      // Update employee data
      await employeeService.update(id, employeeUpdateData);
      
      // Update user role if user account exists
      if (employeeData.hasUserAccount && employeeData.userId) {
        try {
          await authService.updateUserRole(employeeData.userId, employeeData.userRole);
        } catch (err) {
          console.warn('Failed to update user role:', err);
        }
      }
      
      setSuccess('Employee updated successfully!');
    } catch (err) {
      setError('Failed to update employee');
      console.error('Error updating employee:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      
      // Call API to reset password
      const result = await authService.resetPassword({
        userId: employeeData.userId,
        newPassword: newPassword
      });
      
      if (result.success) {
        setSuccess('Password reset successfully!');
        setPasswordDialog(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password');
      console.error('Error resetting password:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUserAccount = async () => {
    try {
      setSaving(true);
      
      const userData = {
        email: employeeData.email,
        password: createUserPassword,
        role: createUserRole
      };
      
      const result = await authService.register(userData);
      
      if (result.success) {
        setSuccess('User account created successfully!');
        setEmployeeData(prev => ({
          ...prev,
          hasUserAccount: true,
          userRole: createUserRole,
          isUserActive: true
        }));
        setUserAccountDialog(false);
        setCreateUserPassword('');
      } else {
        setError(result.message || 'Failed to create user account');
      }
    } catch (err) {
      setError('Failed to create user account');
      console.error('Error creating user account:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserStatus = async () => {
    try {
      setSaving(true);
      
      // Call API to toggle user status
      const result = await authService.toggleUserStatus(
        employeeData.userId, 
        !employeeData.isUserActive
      );
      
      if (result.success) {
        setEmployeeData(prev => ({
          ...prev,
          isUserActive: !prev.isUserActive
        }));
        
        setSuccess(`User account ${!employeeData.isUserActive ? 'activated' : 'deactivated'} successfully!`);
      } else {
        setError(result.message || 'Failed to update user status');
      }
    } catch (err) {
      setError('Failed to update user status');
      console.error('Error updating user status:', err);
    } finally {
      setSaving(false);
    }
  };

  // --- Compensation Tab ---
  const CompensationTab = () => {
    const [salaryStructure, setSalaryStructure] = useState({
      basicSalary: '',
      hra: '',
      allowances: '',
      pfContribution: '',
      tds: '',
      professionalTax: '',
      otherDeductions: ''
    });
    const [compSaving, setCompSaving] = useState(false);
    const [compError, setCompError] = useState('');
    const [compSuccess, setCompSuccess] = useState('');
    const [salaryStructureId, setSalaryStructureId] = useState(null);

    useEffect(() => {
      const loadSalaryStructure = async () => {
        try {
          const salary = await salaryService.getSalaryStructure(id);
          if (salary) {
            setSalaryStructure({
              basicSalary: salary.basicSalary || '',
              hra: salary.hra || '',
              allowances: salary.allowances || '',
              pfContribution: salary.pfContribution || '',
              tds: salary.tds || '',
              professionalTax: salary.professionalTax || '',
              otherDeductions: salary.otherDeductions || ''
            });
            setSalaryStructureId(salary.id);
          }
        } catch (error) {
          // If no salary structure exists, keep empty state
          console.log('No salary structure found, creating new one');
        }
      };
      
      if (id) {
        loadSalaryStructure();
      }
    }, [id]);

    const handleSalaryChange = (field) => (e) => {
      setSalaryStructure(prev => ({
        ...prev,
        [field]: e.target.value
      }));
      setCompError('');
      setCompSuccess('');
    };

    const handleSalarySave = async () => {
      setCompSaving(true);
      setCompError('');
      setCompSuccess('');
      
      try {
        if (salaryStructureId) {
          // Update existing salary structure
          await salaryService.updateSalaryStructure(salaryStructureId, salaryStructure);
        } else {
          // Create new salary structure
          const newSalary = await salaryService.createSalaryStructure(id, salaryStructure);
          setSalaryStructureId(newSalary.id);
        }
        setCompSuccess('Salary structure updated successfully!');
      } catch (err) {
        console.error('Salary update error:', err);
        setCompError('Failed to update salary structure.');
      } finally {
        setCompSaving(false);
      }
    };

    const canEdit = isAdmin || isHR;

    const totalEarnings = parseFloat(salaryStructure.basicSalary || 0) + 
                         parseFloat(salaryStructure.hra || 0) + 
                         parseFloat(salaryStructure.allowances || 0);
    
    const totalDeductions = parseFloat(salaryStructure.pfContribution || 0) + 
                           parseFloat(salaryStructure.tds || 0) + 
                           parseFloat(salaryStructure.professionalTax || 0) + 
                           parseFloat(salaryStructure.otherDeductions || 0);
    
    const netSalary = totalEarnings - totalDeductions;

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <WorkIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Compensation & Salary Structure
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {/* Earnings Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                💰 Earnings
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Basic Salary"
                type="number"
                value={salaryStructure.basicSalary}
                onChange={handleSalaryChange('basicSalary')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  readOnly: !canEdit
                }}
                disabled={compSaving}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="HRA (House Rent Allowance)"
                type="number"
                value={salaryStructure.hra}
                onChange={handleSalaryChange('hra')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  readOnly: !canEdit
                }}
                disabled={compSaving}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Other Allowances"
                type="number"
                value={salaryStructure.allowances}
                onChange={handleSalaryChange('allowances')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  readOnly: !canEdit
                }}
                disabled={compSaving}
                helperText="Transport, Medical, Special allowances combined"
              />
            </Grid>

            {/* Deductions Section */}
            <Grid item xs={12} sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'error.main', fontWeight: 'bold' }}>
                📉 Deductions
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PF Contribution"
                type="number"
                value={salaryStructure.pfContribution}
                onChange={handleSalaryChange('pfContribution')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  readOnly: !canEdit
                }}
                disabled={compSaving}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="TDS (Tax Deducted at Source)"
                type="number"
                value={salaryStructure.tds}
                onChange={handleSalaryChange('tds')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  readOnly: !canEdit
                }}
                disabled={compSaving}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Professional Tax"
                type="number"
                value={salaryStructure.professionalTax}
                onChange={handleSalaryChange('professionalTax')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  readOnly: !canEdit
                }}
                disabled={compSaving}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Other Deductions"
                type="number"
                value={salaryStructure.otherDeductions}
                onChange={handleSalaryChange('otherDeductions')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  readOnly: !canEdit
                }}
                disabled={compSaving}
                helperText="ESI, loans, other deductions combined"
              />
            </Grid>

            {/* Summary Section */}
            <Grid item xs={12} sx={{ mt: 3 }}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  💼 Salary Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Total Earnings
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      ₹{totalEarnings.toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Total Deductions
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      ₹{totalDeductions.toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Net Salary
                    </Typography>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      ₹{netSalary.toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Save Button */}
            <Grid item xs={12}>
              {canEdit && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSalarySave}
                  disabled={compSaving}
                  sx={{ mt: 2 }}
                >
                  {compSaving ? 'Saving...' : 'Save Salary Structure'}
                </Button>
              )}
            </Grid>
          </Grid>

          {compError && <Alert severity="error" sx={{ mt: 2 }}>{compError}</Alert>}
          {compSuccess && <Alert severity="success" sx={{ mt: 2 }}>{compSuccess}</Alert>}
        </CardContent>
      </Card>
    );
  };

  const PersonalInfoTab = () => (
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Personal Information
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                fontSize: '2rem',
                bgcolor: 'primary.main'
              }}
            >
              {employeeData.firstName?.charAt(0)}{employeeData.lastName?.charAt(0)}
            </Avatar>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              value={employeeData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={employeeData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={employeeData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              value={employeeData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const EmploymentInfoTab = () => (
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <WorkIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Employment Information
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Employee ID"
              value={employeeData.employeeId}
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={employeeData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                label="Department"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id || dept} value={dept.name || dept}>
                    {dept.name || dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                value={employeeData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                label="Position"
              >
                {positions.map((pos) => (
                  <MenuItem key={pos.id || pos} value={pos.title || pos}>
                    {pos.title || pos}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Hire Date"
              type="date"
              value={employeeData.hireDate}
              onChange={(e) => handleInputChange('hireDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Salary"
              type="number"
              value={employeeData.salary}
              onChange={(e) => handleInputChange('salary', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={employeeData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="terminated">Terminated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const LoginConfigurationTab = () => (
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Login Configuration
          </Typography>
        </Stack>

        {employeeData.hasUserAccount ? (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              This employee has a user account and can login to the system.
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Login Email"
                  value={employeeData.email}
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>User Role</InputLabel>
                  <Select
                    value={employeeData.userRole}
                    onChange={(e) => handleInputChange('userRole', e.target.value)}
                    label="User Role"
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={employeeData.isUserActive}
                      onChange={handleToggleUserStatus}
                      disabled={saving}
                    />
                  }
                  label={
                    <Box>
                      <Typography>Account Status</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employeeData.isUserActive ? 'Account is active and can login' : 'Account is disabled'}
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Password Management
                </Typography>
                
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<VpnKeyIcon />}
                    onClick={() => setPasswordDialog(true)}
                    disabled={!employeeData.isUserActive}
                  >
                    Reset Password
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<RefreshIcon />}
                    disabled={!employeeData.isUserActive}
                  >
                    Force Password Change
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              This employee does not have a user account. They cannot login to the system.
            </Alert>

            <Button
              variant="contained"
              startIcon={<SecurityIcon />}
              onClick={() => setUserAccountDialog(true)}
              sx={{ mt: 2 }}
            >
              Create User Account
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Emergency Contact Tab Component
  const EmergencyTab = () => (
    <Card elevation={1}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Emergency Contact Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Emergency Contact Name"
              name="emergencyContactName"
              value={employeeData.emergencyContactName || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Emergency Contact Phone"
              name="emergencyContactPhone"
              value={employeeData.emergencyContactPhone || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Relationship"
              name="emergencyContactRelation"
              value={employeeData.emergencyContactRelation || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Statutory Information Tab Component
  const StatutoryTab = () => (
    <Card elevation={1}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Statutory Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Aadhaar Number"
              name="aadhaarNumber"
              value={employeeData.aadhaarNumber || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="PAN Number"
              name="panNumber"
              value={employeeData.panNumber || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="UAN Number"
              name="uanNumber"
              value={employeeData.uanNumber || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="PF Number"
              name="pfNumber"
              value={employeeData.pfNumber || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ESI Number"
              name="esiNumber"
              value={employeeData.esiNumber || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Bank Information Tab Component
  const BankTab = () => (
    <Card elevation={1}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Bank Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Bank Name"
              name="bankName"
              value={employeeData.bankName || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Account Number"
              name="bankAccountNumber"
              value={employeeData.bankAccountNumber || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="IFSC Code"
              name="ifscCode"
              value={employeeData.ifscCode || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Branch"
              name="bankBranch"
              value={employeeData.bankBranch || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Account Holder Name"
              name="accountHolderName"
              value={employeeData.accountHolderName || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading employee data...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Employee ID: {id}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EditIcon sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    Edit Employee
                  </Typography>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                    {employeeData.firstName} {employeeData.lastName} - {employeeData.employeeId}
                  </Typography>
                </Box>
              </Box>
              
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/employees')}
                sx={{
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.5)'
                  }
                }}
              >
                Back to Employees
              </Button>
            </Box>
          </Paper>

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {error}
              </Typography>
              {error.includes('not found') && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Try these valid employee IDs:
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      sx={{ mr: 1, mb: 1 }}
                      onClick={() => navigate('/employees/85abf353-7dbb-4db0-9dee-41763eda008c')}
                    >
                      Admin (EMP001)
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      sx={{ mr: 1, mb: 1 }}
                      onClick={() => navigate('/employees/88f1a66c-70fc-4a48-9bc5-9b05d803a705')}
                    >
                      John Doe (EMP002)
                    </Button>
                  </Box>
                </Box>
              )}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Tabs */}
          <Paper sx={{ borderRadius: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
            >
              <Tab label="Personal Info" />
              <Tab label="Employment" />
              <Tab label="Compensation" />
              <Tab label="Emergency" />
              <Tab label="Statutory" />
              <Tab label="Bank" />
              {(isAdmin() || isHR()) && <Tab label="Login Configuration" />}
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && <PersonalInfoTab />}
              {activeTab === 1 && <EmploymentInfoTab />}
              {activeTab === 2 && <CompensationTab />}
              {activeTab === 3 && <EmergencyTab />}
              {activeTab === 4 && <StatutoryTab />}
              {activeTab === 5 && <BankTab />}
              {activeTab === 6 && (isAdmin() || isHR()) && <LoginConfigurationTab />}

              {/* Action Buttons */}
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/employees')}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSaveEmployee}
                  disabled={saving}
                  sx={{
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                    }
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Password Reset Dialog */}
          <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter a new password for {employeeData.firstName} {employeeData.lastName}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Minimum 6 characters"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    error={confirmPassword && newPassword !== confirmPassword}
                    helperText={
                      confirmPassword && newPassword !== confirmPassword
                        ? "Passwords do not match"
                        : "Re-enter the password"
                    }
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handlePasswordReset}
                disabled={!newPassword || newPassword !== confirmPassword || saving}
              >
                {saving ? <CircularProgress size={20} /> : 'Reset Password'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Create User Account Dialog */}
          <Dialog open={userAccountDialog} onClose={() => setUserAccountDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Create User Account</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create a login account for {employeeData.firstName} {employeeData.lastName}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Login Email"
                    value={employeeData.email}
                    disabled
                    helperText="Employee email will be used as login email"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>User Role</InputLabel>
                    <Select
                      value={createUserRole}
                      onChange={(e) => setCreateUserRole(e.target.value)}
                      label="User Role"
                    >
                      {roles.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Initial Password"
                    type="password"
                    value={createUserPassword}
                    onChange={(e) => setCreateUserPassword(e.target.value)}
                    helperText="Minimum 6 characters"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setUserAccountDialog(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleCreateUserAccount}
                disabled={!createUserPassword || createUserPassword.length < 6 || saving}
              >
                {saving ? <CircularProgress size={20} /> : 'Create Account'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default ModernEditEmployee;
