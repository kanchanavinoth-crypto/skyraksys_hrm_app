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
  Paper,
  Fade
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
        // Fetch employee details
        const empData = await employeeService.getById(id);
        console.log('===== EMPLOYEE DATA DEBUG =====');
        console.log('Full employee data:', empData);
        console.log('Date of Birth:', empData.dateOfBirth);
        console.log('ESI Number:', empData.esiNumber);
        console.log('Salary data:', empData.salary);
        console.log('Salary structure:', empData.salaryStructure);
        console.log('===============================');
        setEmployee(empData);
        setOriginalEmployee({ ...empData });
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

  // Format currency
  const formatCurrency = (amount, currency = 'INR') => {
    if (!amount) return '-';
    return `${currency} ${Number(amount).toLocaleString()}`;
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: 4 }}>
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
                    src={employee.photoUrl}
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
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                  <PersonIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#1976d2' }} />
                  Personal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="First Name"
                      value={employee.firstName}
                      editing={editing}
                      onChange={(val) => handleChange('firstName', val)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
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
                    <InfoField
                      label="Gender"
                      value={employee.gender}
                      editing={editing}
                      onChange={(val) => handleChange('gender', val)}
                    />
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
                    <InfoField
                      label="Marital Status"
                      value={employee.maritalStatus}
                      editing={editing}
                      onChange={(val) => handleChange('maritalStatus', val)}
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
                </Grid>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                  <PhoneIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#ef4444' }} />
                  Emergency Contact
                </Typography>
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
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                  <BusinessIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#8b5cf6' }} />
                  Employment Details
                </Typography>
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
                    <InfoField
                      label="Department"
                      value={employee.department?.name || employee.departmentId || '-'}
                      editing={editing}
                      onChange={(val) => handleChange('departmentId', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Position"
                      value={employee.position?.title || employee.positionId || '-'}
                      editing={editing}
                      onChange={(val) => handleChange('positionId', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Employment Type"
                      value={employee.employmentType || '-'}
                      editing={editing}
                      onChange={(val) => handleChange('employmentType', val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoField
                      label="Work Location"
                      value={employee.workLocation}
                      editing={editing}
                      onChange={(val) => handleChange('workLocation', val)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoField
                      label="Manager"
                      value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : employee.managerId || '-'}
                      editing={editing}
                      onChange={(val) => handleChange('managerId', val)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Salary Information - Admin/HR Only */}
            {canEditSensitive && (
              <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '2px solid #fbbf24' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight={600}>
                      <MoneyIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#f59e0b' }} />
                      Compensation
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip label="Confidential" size="small" color="error" />
                      <IconButton size="small" onClick={() => setShowSensitive(!showSensitive)}>
                        {showSensitive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </Stack>
                  </Box>

                  {showSensitive && employee.salary && (
                    <Grid container spacing={2}>
                      {/* Basic Salary */}
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: '#ecfdf5', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Basic Salary
                          </Typography>
                          <Typography variant="h5" fontWeight={700} color="#059669">
                            {formatCurrency(employee.salary.basicSalary, employee.salary.currency)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employee.salary.payFrequency || 'Monthly'}
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* Allowances */}
                      {(employee.salary.houseRentAllowance || employee.salary.transportAllowance || employee.salary.medicalAllowance) && (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mt: 1 }}>
                              Allowances
                            </Typography>
                          </Grid>
                          {employee.salary.houseRentAllowance > 0 && (
                            <Grid item xs={12} sm={6}>
                              <SalaryItem
                                label="HRA"
                                amount={employee.salary.houseRentAllowance}
                                currency={employee.salary.currency}
                              />
                            </Grid>
                          )}
                          {employee.salary.transportAllowance > 0 && (
                            <Grid item xs={12} sm={6}>
                              <SalaryItem
                                label="Transport"
                                amount={employee.salary.transportAllowance}
                                currency={employee.salary.currency}
                              />
                            </Grid>
                          )}
                          {employee.salary.medicalAllowance > 0 && (
                            <Grid item xs={12} sm={6}>
                              <SalaryItem
                                label="Medical"
                                amount={employee.salary.medicalAllowance}
                                currency={employee.salary.currency}
                              />
                            </Grid>
                          )}
                        </>
                      )}

                      {/* Deductions */}
                      {(employee.salary.providentFund || employee.salary.incomeTax || employee.salary.professionalTax) && (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mt: 1 }}>
                              Deductions
                            </Typography>
                          </Grid>
                          {employee.salary.providentFund > 0 && (
                            <Grid item xs={12} sm={6}>
                              <SalaryItem
                                label="PF"
                                amount={employee.salary.providentFund}
                                currency={employee.salary.currency}
                                deduction
                              />
                            </Grid>
                          )}
                          {employee.salary.incomeTax > 0 && (
                            <Grid item xs={12} sm={6}>
                              <SalaryItem
                                label="Income Tax"
                                amount={employee.salary.incomeTax}
                                currency={employee.salary.currency}
                                deduction
                              />
                            </Grid>
                          )}
                          {employee.salary.professionalTax > 0 && (
                            <Grid item xs={12} sm={6}>
                              <SalaryItem
                                label="Professional Tax"
                                amount={employee.salary.professionalTax}
                                currency={employee.salary.currency}
                                deduction
                              />
                            </Grid>
                          )}
                        </>
                      )}

                      {/* Summary */}
                      {(employee.salary.ctc || employee.salary.takeHome) && (
                        <>
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                          </Grid>
                          {employee.salary.ctc > 0 && (
                            <Grid item xs={12} sm={6}>
                              <Paper sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #3b82f6' }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Annual CTC
                                </Typography>
                                <Typography variant="h6" fontWeight={700} color="#2563eb">
                                  {formatCurrency(employee.salary.ctc, employee.salary.currency)}
                                </Typography>
                              </Paper>
                            </Grid>
                          )}
                          {employee.salary.takeHome > 0 && (
                            <Grid item xs={12} sm={6}>
                              <Paper sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #10b981' }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Take Home
                                </Typography>
                                <Typography variant="h6" fontWeight={700} color="#059669">
                                  {formatCurrency(employee.salary.takeHome, employee.salary.currency)}
                                </Typography>
                              </Paper>
                            </Grid>
                          )}
                        </>
                      )}
                    </Grid>
                  )}

                  {!showSensitive && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Click the eye icon to view salary details
                      </Typography>
                    </Box>
                  )}

                  {showSensitive && !employee.salary && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No salary information configured for this employee
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Statutory Information - Admin/HR Only */}
            {canEditSensitive && (
              <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight={600}>
                      <CardIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#6366f1' }} />
                      Statutory & Banking
                    </Typography>
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
                  </Grid>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
      
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

// Salary Item Component
const SalaryItem = ({ label, amount, currency = 'INR', deduction = false }) => {
  return (
    <Paper
      sx={{
        p: 1.5,
        bgcolor: deduction ? '#fef2f2' : '#f0f9ff',
        borderRadius: 2,
        border: `1px solid ${deduction ? '#fecaca' : '#bfdbfe'}`
      }}
    >
      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} color={deduction ? '#dc2626' : '#0284c7'}>
        {currency} {Number(amount).toLocaleString()}
      </Typography>
    </Paper>
  );
};

export default EmployeeProfileModern;
