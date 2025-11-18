/**
 * Modern Minimalistic Employee Profile Component
 * Clean, simple design with auto-populated fields and salary section
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  TextField,
  Grid,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Fade,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
  PersonOutline as PersonIcon,
  AttachMoney as MoneyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CreditCard as CardIcon,
  Receipt as ReceiptIcon,
  ManageAccounts as ManageAccountsIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { employeeService } from '../../../services/employee.service';
import PayslipViewer from '../../payslip/PayslipViewer';

const EmployeeProfileModern = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  // State
  const [employee, setEmployee] = useState(null);
  const [originalEmployee, setOriginalEmployee] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [showStatutory, setShowStatutory] = useState(false);
  const [showPayslipViewer, setShowPayslipViewer] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);

  // Permission checks
  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr';
  const canEditSensitive = isAdmin || isHR;
  const canEdit = isAdmin || isHR || user?.role === 'manager';

  // Fetch employee data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch employee details and dropdown data in parallel
        const [empData, deptResponse, posResponse, mgrResponse] = await Promise.all([
          employeeService.getById(id),
          employeeService.getDepartments().catch(err => {
            console.error('Error loading departments:', err);
            return { data: { data: [] } };
          }),
          employeeService.getPositions().catch(err => {
            console.error('Error loading positions:', err);
            return { data: { data: [] } };
          }),
          employeeService.getManagers().catch(err => {
            console.error('Error loading managers:', err);
            return { data: { data: [] } };
          })
        ]);
        
        console.log('===== EMPLOYEE DATA DEBUG =====');
        console.log('Full employee data:', empData);
        console.log('Full employee data JSON:', JSON.stringify(empData, null, 2));
        console.log('Emergency Contact Name:', empData.emergencyContactName);
        console.log('Emergency Contact Phone:', empData.emergencyContactPhone);
        console.log('Emergency Contact Relation:', empData.emergencyContactRelation);
        console.log('Bank Account Number:', empData.bankAccountNumber);
        console.log('Bank Name:', empData.bankName);
        console.log('Bank Branch:', empData.bankBranch);
        console.log('IFSC Code:', empData.ifscCode);
        console.log('Account Holder Name:', empData.accountHolderName);
        console.log('Joining Date:', empData.joiningDate);
        console.log('Department:', empData.department);
        console.log('DepartmentId:', empData.departmentId);
        console.log('Position:', empData.position);
        console.log('PositionId:', empData.positionId);
        console.log('Manager:', empData.manager);
        console.log('ManagerId:', empData.managerId);
        console.log('Salary data:', empData.salary);
        console.log('===============================');
        
        setEmployee(empData);
        setOriginalEmployee({ ...empData });
        setDepartments(deptResponse.data?.data || []);
        setPositions(posResponse.data?.data || []);
        setManagers(mgrResponse.data?.data || []);
      } catch (error) {
        console.error('Error fetching employee:', error);
        showNotification('Failed to load employee data', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, showNotification]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await employeeService.update(id, employee);
      setEmployee(updated);
      setOriginalEmployee({ ...updated });
      setEditing(false);
      showNotification('Employee updated successfully', 'success');
    } catch (error) {
      console.error('Error saving employee:', error);
      showNotification(error.response?.data?.message || 'Failed to update employee', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEmployee({ ...originalEmployee });
    setEditing(false);
  };

  // Handle field change
  const handleChange = (field, value) => {
    setEmployee(prev => ({ ...prev, [field]: value }));
  };

  // Handle nested salary field changes
  const handleSalaryChange = (field, value) => {
    setEmployee(prev => {
      const salary = { ...(prev.salary || {}) };
      
      // Handle nested fields like 'allowances.hra', 'deductions.pf', etc.
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        salary[parent] = {
          ...(salary[parent] || {}),
          [child]: value === '' ? 0 : (parseFloat(value) || 0)
        };
      } else {
        // Handle top-level salary fields
        salary[field] = value === '' ? null : (parseFloat(value) || value);
      }
      
      return {
        ...prev,
        salary
      };
    });
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box p={4}>
        <Alert severity="error">Employee not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: 4, pb: editing ? 12 : 4 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/employees')} sx={{ bgcolor: 'white' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight={600} sx={{ flex: 1 }}>
            Employee Profile
          </Typography>
          
          {/* User Management Button - Admin/HR Only */}
          {!editing && canEditSensitive && (
            <Button
              variant="outlined"
              startIcon={<ManageAccountsIcon />}
              onClick={() => navigate(`/employees/${id}/user-account`)}
              sx={{
                borderColor: '#e0e0e0',
                color: '#10b981',
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                mr: 2,
                '&:hover': {
                  borderColor: '#10b981',
                  bgcolor: 'rgba(16, 185, 129, 0.05)'
                }
              }}
            >
              User Management
            </Button>
          )}
          
          {/* Payslip Button - Admin/HR Only */}
          {!editing && canEditSensitive && (
            <Button
              variant="outlined"
              startIcon={<ReceiptIcon />}
              onClick={() => setShowPayslipViewer(true)}
              sx={{
                borderColor: '#e0e0e0',
                color: '#6366f1',
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                mr: 2,
                '&:hover': {
                  borderColor: '#6366f1',
                  bgcolor: 'rgba(99, 102, 241, 0.05)'
                }
              }}
            >
              View Payslip
            </Button>
          )}
          
          {!editing && canEdit && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setEditing(true)}
              sx={{
                bgcolor: '#1976d2',
                px: 3,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(25,118,210,0.25)'
              }}
            >
              Edit Profile
            </Button>
          )}
          {editing && (
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={saving}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  bgcolor: '#10b981',
                  '&:hover': { bgcolor: '#059669' },
                  textTransform: 'none',
                  borderRadius: 2
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          )}
        </Box>

        {/* Profile Header Card */}
        <Fade in={true}>
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                {/* Avatar */}
                <Grid item xs={12} sm="auto">
                  <Avatar
                    src={employee.photoUrl ? `http://localhost:5000${employee.photoUrl}` : undefined}
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: '#1976d2',
                      fontSize: 48,
                      fontWeight: 600,
                      border: '4px solid white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    {employee.firstName?.[0]}{employee.lastName?.[0]}
                  </Avatar>
                </Grid>

                {/* Basic Info */}
                <Grid item xs={12} sm>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {employee.firstName} {employee.lastName}
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
                    <Chip
                      label={employee.employeeId || 'No ID'}
                      icon={<BadgeIcon />}
                      sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600 }}
                    />
                    <Chip
                      label={employee.position?.title || employee.positionId || 'No Position'}
                      icon={<BusinessIcon />}
                      sx={{ bgcolor: '#f3e5f5', color: '#9c27b0', fontWeight: 600 }}
                    />
                    <Chip
                      label={employee.department?.name || employee.departmentId || 'No Department'}
                      icon={<BusinessIcon />}
                      sx={{ bgcolor: '#e8f5e9', color: '#388e3c', fontWeight: 600 }}
                    />
                  </Stack>

                  {/* Contact Row */}
                  <Stack direction="row" spacing={3} flexWrap="wrap">
                    {employee.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ color: '#64748b', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          {employee.email}
                        </Typography>
                      </Box>
                    )}
                    {employee.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ color: '#64748b', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          {employee.phone}
                        </Typography>
                      </Box>
                    )}
                    {employee.workLocation && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon sx={{ color: '#64748b', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          {employee.workLocation}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Fade>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} lg={6}>
            {/* Personal Information */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Typography variant="h6" fontWeight={600}>
                    <PersonIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#1976d2' }} />
                    Personal Information
                  </Typography>
                  {editing && <Chip label="Editing" size="small" color="warning" icon={<EditIcon />} />}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={6}>
                    <InfoField
                      label="First Name"
                      value={employee.firstName}
                      editing={editing}
                      onChange={(val) => handleChange('firstName', val)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={6}>
                    <InfoField
                      label="Last Name"
                      value={employee.lastName}
                      editing={editing}
                      onChange={(val) => handleChange('lastName', val)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Date of Birth"
                      value={editing ? employee.dateOfBirth : formatDate(employee.dateOfBirth)}
                      editing={editing}
                      type="date"
                      onChange={(val) => handleChange('dateOfBirth', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {editing ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Gender</InputLabel>
                        <Select
                          value={employee.gender || ''}
                          label="Gender"
                          onChange={(e) => handleChange('gender', e.target.value)}
                          sx={{ bgcolor: 'white', borderRadius: 2 }}
                        >
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                          Gender
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {employee.gender || '-'}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <InfoField
                      label="Email"
                      value={employee.email}
                      editing={editing}
                      onChange={(val) => handleChange('email', val)}
                      type="email"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Phone"
                      value={employee.phone}
                      editing={editing}
                      onChange={(val) => handleChange('phone', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {editing ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Marital Status</InputLabel>
                        <Select
                          value={employee.maritalStatus || ''}
                          label="Marital Status"
                          onChange={(e) => handleChange('maritalStatus', e.target.value)}
                          sx={{ bgcolor: 'white', borderRadius: 2 }}
                        >
                          <MenuItem value="Single">Single</MenuItem>
                          <MenuItem value="Married">Married</MenuItem>
                          <MenuItem value="Divorced">Divorced</MenuItem>
                          <MenuItem value="Widowed">Widowed</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                          Marital Status
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {employee.maritalStatus || '-'}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Nationality"
                      value={employee.nationality}
                      editing={editing}
                      onChange={(val) => handleChange('nationality', val)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoField
                      label="Address"
                      value={employee.address}
                      editing={editing}
                      onChange={(val) => handleChange('address', val)}
                      multiline
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <InfoField
                      label="City"
                      value={employee.city}
                      editing={editing}
                      onChange={(val) => handleChange('city', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <InfoField
                      label="State"
                      value={employee.state}
                      editing={editing}
                      onChange={(val) => handleChange('state', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <InfoField
                      label="Pin Code"
                      value={employee.pinCode}
                      editing={editing}
                      onChange={(val) => handleChange('pinCode', val)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Typography variant="h6" fontWeight={600}>
                    <PhoneIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#ef4444' }} />
                    Emergency Contact
                  </Typography>
                  {editing && <Chip label="Editing" size="small" color="warning" icon={<EditIcon />} />}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <InfoField
                      label="Contact Name"
                      value={employee.emergencyContactName}
                      editing={editing}
                      onChange={(val) => handleChange('emergencyContactName', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Contact Phone"
                      value={employee.emergencyContactPhone}
                      editing={editing}
                      onChange={(val) => handleChange('emergencyContactPhone', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Relationship"
                      value={employee.emergencyContactRelation}
                      editing={editing}
                      onChange={(val) => handleChange('emergencyContactRelation', val)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={6}>
            {/* Employment Information */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Typography variant="h6" fontWeight={600}>
                    <BusinessIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#8b5cf6' }} />
                    Employment Details
                  </Typography>
                  {editing && <Chip label="Editing" size="small" color="warning" icon={<EditIcon />} />}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Employee ID"
                      value={employee.employeeId}
                      editing={editing}
                      onChange={(val) => handleChange('employeeId', val)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Hire Date"
                      value={editing ? employee.hireDate : formatDate(employee.hireDate)}
                      editing={editing}
                      type="date"
                      onChange={(val) => handleChange('hireDate', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {editing ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Department</InputLabel>
                        <Select
                          value={employee.departmentId || ''}
                          label="Department"
                          onChange={(e) => handleChange('departmentId', e.target.value)}
                          sx={{ bgcolor: 'white', borderRadius: 2 }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {departments.map((dept) => (
                            <MenuItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                          Department
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {employee.department?.name || '-'}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {editing ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Position</InputLabel>
                        <Select
                          value={employee.positionId || ''}
                          label="Position"
                          onChange={(e) => handleChange('positionId', e.target.value)}
                          sx={{ bgcolor: 'white', borderRadius: 2 }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {positions.map((pos) => (
                            <MenuItem key={pos.id} value={pos.id}>
                              {pos.title}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                          Position
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {employee.position?.title || '-'}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {editing ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Employment Type</InputLabel>
                        <Select
                          value={employee.employmentType || ''}
                          label="Employment Type"
                          onChange={(e) => handleChange('employmentType', e.target.value)}
                          sx={{ bgcolor: 'white', borderRadius: 2 }}
                        >
                          <MenuItem value="Full-time">Full-time</MenuItem>
                          <MenuItem value="Part-time">Part-time</MenuItem>
                          <MenuItem value="Contract">Contract</MenuItem>
                          <MenuItem value="Intern">Intern</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                          Employment Type
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {employee.employmentType || '-'}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Work Location"
                      value={employee.workLocation}
                      editing={editing}
                      onChange={(val) => handleChange('workLocation', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {editing ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={employee.status || 'Active'}
                          label="Status"
                          onChange={(e) => handleChange('status', e.target.value)}
                          sx={{ bgcolor: 'white', borderRadius: 2 }}
                        >
                          <MenuItem value="Active">Active</MenuItem>
                          <MenuItem value="Inactive">Inactive</MenuItem>
                          <MenuItem value="On Leave">On Leave</MenuItem>
                          <MenuItem value="Terminated">Terminated</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                          Status
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {employee.status || 'Active'}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Joining Date"
                      value={editing ? employee.joiningDate : formatDate(employee.joiningDate)}
                      editing={editing}
                      type="date"
                      onChange={(val) => handleChange('joiningDate', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Confirmation Date"
                      value={editing ? employee.confirmationDate : formatDate(employee.confirmationDate)}
                      editing={editing}
                      type="date"
                      onChange={(val) => handleChange('confirmationDate', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Probation Period (months)"
                      value={employee.probationPeriod}
                      editing={editing}
                      type="number"
                      onChange={(val) => handleChange('probationPeriod', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Notice Period (days)"
                      value={employee.noticePeriod}
                      editing={editing}
                      type="number"
                      onChange={(val) => handleChange('noticePeriod', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Resignation Date"
                      value={editing ? employee.resignationDate : formatDate(employee.resignationDate)}
                      editing={editing}
                      type="date"
                      onChange={(val) => handleChange('resignationDate', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Last Working Date"
                      value={editing ? employee.lastWorkingDate : formatDate(employee.lastWorkingDate)}
                      editing={editing}
                      type="date"
                      onChange={(val) => handleChange('lastWorkingDate', val)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    {editing ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Manager</InputLabel>
                        <Select
                          value={employee.managerId || ''}
                          label="Manager"
                          onChange={(e) => handleChange('managerId', e.target.value)}
                          sx={{ bgcolor: 'white', borderRadius: 2 }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {managers.map((mgr) => (
                            <MenuItem key={mgr.id} value={mgr.id}>
                              {mgr.firstName} {mgr.lastName} ({mgr.employeeId})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                          Manager
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '-'}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Salary Information - Admin/HR Only */}
            {canEditSensitive && (
              <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '2px solid #fbbf24' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" fontWeight={600}>
                        <MoneyIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#f59e0b' }} />
                        Compensation
                      </Typography>
                      {editing && <Chip label="Editing" size="small" color="warning" icon={<EditIcon />} />}
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Chip label="Confidential" size="small" color="error" />
                      <IconButton size="small" onClick={() => setShowSensitive(!showSensitive)}>
                        {showSensitive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </Stack>
                  </Box>

                  {showSensitive && (
                    <Grid container spacing={2}>
                      {/* Basic Salary Fields */}
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="Basic Salary"
                          value={employee.salary?.basicSalary || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('basicSalary', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        {editing ? (
                          <FormControl fullWidth size="small">
                            <InputLabel>Currency</InputLabel>
                            <Select
                              value={employee.salary?.currency || 'INR'}
                              label="Currency"
                              onChange={(e) => handleSalaryChange('currency', e.target.value)}
                              sx={{ bgcolor: 'white', borderRadius: 2 }}
                            >
                              <MenuItem value="INR">INR - Indian Rupee</MenuItem>
                              <MenuItem value="USD">USD - US Dollar</MenuItem>
                              <MenuItem value="EUR">EUR - Euro</MenuItem>
                              <MenuItem value="GBP">GBP - British Pound</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                              Currency
                            </Typography>
                            <Typography variant="body1" fontWeight={500}>
                              {employee.salary?.currency || 'INR'}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        {editing ? (
                          <FormControl fullWidth size="small">
                            <InputLabel>Pay Frequency</InputLabel>
                            <Select
                              value={employee.salary?.payFrequency || 'monthly'}
                              label="Pay Frequency"
                              onChange={(e) => handleSalaryChange('payFrequency', e.target.value)}
                              sx={{ bgcolor: 'white', borderRadius: 2 }}
                            >
                              <MenuItem value="weekly">Weekly</MenuItem>
                              <MenuItem value="biweekly">Bi-weekly</MenuItem>
                              <MenuItem value="monthly">Monthly</MenuItem>
                              <MenuItem value="annually">Annually</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                              Pay Frequency
                            </Typography>
                            <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                              {employee.salary?.payFrequency || 'monthly'}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="Effective From"
                          value={editing ? (employee.salary?.effectiveFrom || '') : formatDate(employee.salary?.effectiveFrom)}
                          editing={editing}
                          type="date"
                          onChange={(val) => handleSalaryChange('effectiveFrom', val)}
                        />
                      </Grid>

                      {/* Allowances Section */}
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                          Allowances
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="House Rent Allowance (HRA)"
                          value={employee.salary?.allowances?.hra || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('allowances.hra', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Transport Allowance"
                          value={employee.salary?.allowances?.transport || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('allowances.transport', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Medical Allowance"
                          value={employee.salary?.allowances?.medical || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('allowances.medical', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Food Allowance"
                          value={employee.salary?.allowances?.food || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('allowances.food', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Communication Allowance"
                          value={employee.salary?.allowances?.communication || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('allowances.communication', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Special Allowance"
                          value={employee.salary?.allowances?.special || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('allowances.special', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Other Allowances"
                          value={employee.salary?.allowances?.other || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('allowances.other', val)}
                        />
                      </Grid>

                      {/* Deductions Section */}
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                          Deductions
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Provident Fund (PF)"
                          value={employee.salary?.deductions?.pf || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('deductions.pf', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Income Tax (TDS)"
                          value={employee.salary?.deductions?.incomeTax || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('deductions.incomeTax', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Professional Tax"
                          value={employee.salary?.deductions?.professionalTax || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('deductions.professionalTax', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="ESI"
                          value={employee.salary?.deductions?.esi || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('deductions.esi', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Other Deductions"
                          value={employee.salary?.deductions?.other || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('deductions.other', val)}
                        />
                      </Grid>

                      {/* Benefits Section */}
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                          Additional Benefits
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Bonus"
                          value={employee.salary?.benefits?.bonus || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('benefits.bonus', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Incentive"
                          value={employee.salary?.benefits?.incentive || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('benefits.incentive', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <InfoField
                          label="Overtime Pay"
                          value={employee.salary?.benefits?.overtime || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('benefits.overtime', val)}
                        />
                      </Grid>

                      {/* Summary Section */}
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                          Summary
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <InfoField
                          label="Annual CTC"
                          value={employee.salary?.taxInformation?.ctc || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('taxInformation.ctc', val)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <InfoField
                          label="Take Home Salary"
                          value={employee.salary?.taxInformation?.takeHome || ''}
                          editing={editing}
                          type="number"
                          onChange={(val) => handleSalaryChange('taxInformation.takeHome', val)}
                        />
                      </Grid>
                    </Grid>
                  )}

                  {!showSensitive && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Click the eye icon to view salary details
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Statutory Information - Admin/HR Only */}
            {canEditSensitive && (
              <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" fontWeight={600}>
                        <CardIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#6366f1' }} />
                        Statutory & Banking
                      </Typography>
                      {editing && <Chip label="Editing" size="small" color="warning" icon={<EditIcon />} />}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="Confidential" size="small" color="error" />
                      {!editing && (
                        <IconButton 
                          size="small" 
                          onClick={() => setShowStatutory(!showStatutory)}
                          sx={{ ml: 1 }}
                        >
                          {showStatutory ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  {!showStatutory && !editing && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography color="text.secondary">
                        Click the eye icon to view statutory and banking details
                      </Typography>
                    </Box>
                  )}
                  {(showStatutory || editing) && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <InfoField
                        label="Aadhaar Number"
                        value={employee.aadhaarNumber}
                        editing={editing}
                        onChange={(val) => handleChange('aadhaarNumber', val)}
                        sensitive={editing ? false : !showStatutory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField
                        label="PAN Number"
                        value={employee.panNumber}
                        editing={editing}
                        onChange={(val) => handleChange('panNumber', val)}
                        sensitive={editing ? false : !showStatutory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField
                        label="UAN Number"
                        value={employee.uanNumber}
                        editing={editing}
                        onChange={(val) => handleChange('uanNumber', val)}
                        sensitive={editing ? false : !showStatutory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField
                        label="PF Number"
                        value={employee.pfNumber}
                        editing={editing}
                        onChange={(val) => handleChange('pfNumber', val)}
                        sensitive={editing ? false : !showStatutory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField
                        label="ESI Number"
                        value={employee.esiNumber}
                        editing={editing}
                        onChange={(val) => handleChange('esiNumber', val)}
                        sensitive={editing ? false : !showStatutory}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                        Banking Details
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <InfoField
                        label="Bank Name"
                        value={employee.bankName}
                        editing={editing}
                        onChange={(val) => handleChange('bankName', val)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField
                        label="Account Number"
                        value={employee.bankAccountNumber}
                        editing={editing}
                        onChange={(val) => handleChange('bankAccountNumber', val)}
                        sensitive={editing ? false : !showStatutory}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField
                        label="IFSC Code"
                        value={employee.ifscCode}
                        editing={editing}
                        onChange={(val) => handleChange('ifscCode', val)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField
                        label="Bank Branch"
                        value={employee.bankBranch}
                        editing={editing}
                        onChange={(val) => handleChange('bankBranch', val)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField
                        label="Account Holder Name"
                        value={employee.accountHolderName}
                        editing={editing}
                        onChange={(val) => handleChange('accountHolderName', val)}
                      />
                    </Grid>
                  </Grid>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Sticky Floating Action Bar - Only visible in edit mode */}
      {editing && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'white',
            borderTop: '2px solid',
            borderColor: 'warning.main',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
            zIndex: 1100,
            py: 2,
            px: 3
          }}
        >
          <Box
            sx={{
              maxWidth: '1400px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                icon={<EditIcon />}
                label="Edit Mode Active" 
                color="warning" 
                sx={{ fontWeight: 600 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                Make your changes and click Save to update the profile
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={saving}
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
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  bgcolor: '#10b981',
                  color: 'white',
                  fontWeight: 600,
                  px: 4,
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
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Payslip Viewer Dialog */}
      <PayslipViewer
        open={showPayslipViewer}
        onClose={() => setShowPayslipViewer(false)}
        employee={employee}
        mode="generate"
      />
    </Box>
  );
};

// Reusable Info Field Component
const InfoField = ({ label, value, editing, onChange, type = 'text', required = false, multiline = false, sensitive = false }) => {
  if (editing) {
    return (
      <TextField
        fullWidth
        label={label}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        multiline={multiline}
        rows={multiline ? 3 : 1}
        variant="outlined"
        size="small"
        InputLabelProps={type === 'date' ? { shrink: true } : undefined}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'white'
          }
        }}
      />
    );
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500}>
        {sensitive && value ? '••••••••' : value || '-'}
      </Typography>
    </Box>
  );
};

export default EmployeeProfileModern;
