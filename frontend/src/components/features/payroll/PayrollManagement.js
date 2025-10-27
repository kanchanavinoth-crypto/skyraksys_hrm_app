import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Stack,
  Divider,
  Fade,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  CheckCircle as ProcessedIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Send as SendIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../../contexts/AuthContext';
import { useLoading } from '../../../contexts/LoadingContext';
import { payrollService } from '../../../services/payroll.service';
import ResponsiveTable from '../../common/ResponsiveTable';

const ModernPayrollManagement = () => {
  const navigate = useNavigate();
  const { isAdmin, isHR, isEmployee } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  // Hooks must be called first, before any conditional logic
  const [activeTab, setActiveTab] = useState(0);
  // Loading state managed by LoadingContext
  const { isLoading: isLoadingFn, setLoading } = useLoading();
  const isLoading = isLoadingFn('payroll-management');
  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [payslipDialog, setPayslipDialog] = useState(false);
  const [processDialog, setProcessDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('current');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoadingState] = useState(false);
  const [allGenerated, setAllGenerated] = useState(false);
  const [anyGenerated, setAnyGenerated] = useState(false);
  
  const handleDownloadPayslip = async (payrollId) => {
    try {
      const blob = await payrollService.downloadPayslip(payrollId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip_${payrollId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading payslip:', error);
      enqueueSnackbar('Failed to download payslip', { variant: 'error' });
    }
  };

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getAll();
      setPayslips(response.data || []);
    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadPayrollData();
    loadEmployeeData();
  }, []);
  
  // Redirect employees to their personal payslips page
  if (isEmployee()) {
    navigate('/payslips');
    return null;
  }

  const statusColors = {
    draft: 'default',
    processing: 'warning',
    processed: 'success',
    paid: 'primary',
    error: 'error'
  };

  const handleProcessPayroll = async (payslipId) => {
    try {
      await payrollService.updateStatus(payslipId, 'processed');
      await loadPayrollData(); // Refresh data
      setProcessDialog(false);
    } catch (error) {
      console.error('Error processing payroll:', error);
    }
  };

  const handleGeneratePayslip = async (employeeId) => {
    try {
      setLoadingState(true);
      const response = await payrollService.generatePayslip(employeeId);
      enqueueSnackbar(`Payslip ${response.status}`, { variant: 'success' });
      await loadPayrollData();
    } catch (error) {
      console.error('Error generating payslip:', error);
      enqueueSnackbar('Failed to generate payslip', { variant: 'error' });
    } finally {
      setLoadingState(false);
    }
  };

  const handleBulkGenerate = async () => {
    try {
      setLoadingState(true);
      const response = await payrollService.bulkGeneratePayslips();
      enqueueSnackbar(`Bulk payslip generation ${response.status}`, { variant: 'success' });
      await loadPayrollData();
    } catch (error) {
      console.error('Error in bulk payslip generation:', error);
      enqueueSnackbar('Failed to generate payslips', { variant: 'error' });
    } finally {
      setLoadingState(false);
    }
  };

  const handleBulkEmail = async () => {
    try {
      setLoadingState(true);
      const response = await payrollService.bulkEmailPayslips();
      enqueueSnackbar(`Bulk email ${response.status}`, { variant: 'success' });
    } catch (error) {
      console.error('Error in bulk email:', error);
      enqueueSnackbar('Failed to send emails', { variant: 'error' });
    } finally {
      setLoadingState(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed': return <ProcessedIcon color="success" />;
      case 'paid': return <ProcessedIcon color="primary" />;
      case 'processing': return <PendingIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <PendingIcon color="action" />;
    }
  };

  const filteredPayslips = payslips.filter(payslip => {
    const matchesSearch = 
      payslip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payslip.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payslip.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payslip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const PayrollOverviewTab = () => (
    <Box>
      {/* Header with Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Payroll Management
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<CalculateIcon />}
            onClick={() => console.log('Batch calculate payroll')}
          >
            Calculate Payroll
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => console.log('Export payroll report')}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => payrollService.bulkProcess({ status: 'processed' })}
            disabled={!payslips.some(p => p.status === 'draft')}
          >
            Process All
          </Button>
        </Stack>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              ₹{payslips.reduce((sum, p) => sum + (p.grossPay || 0), 0).toLocaleString('en-IN')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Gross Pay
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              ₹{payslips.reduce((sum, p) => sum + (p.netPay || 0), 0).toLocaleString('en-IN')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Net Pay
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {payslips.filter(p => p.status === 'processing').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Processing
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="error.main" fontWeight="bold">
              ₹{payslips.reduce((sum, p) => sum + (p.taxDeductions || 0), 0).toLocaleString('en-IN')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tax Deductions
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search employee"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="processed">Processed</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Pay Period</InputLabel>
                <Select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  label="Pay Period"
                >
                  <MenuItem value="current">Current Month</MenuItem>
                  <MenuItem value="previous">Previous Month</MenuItem>
                  <MenuItem value="quarter">This Quarter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {filteredPayslips.length} payslips
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Payslips Table */}
      <ResponsiveTable
        data={filteredPayslips}
        loading={isLoading}
        columns={[
          {
            id: 'employee',
            label: 'Employee',
            render: (value, payslip) => (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {payslip.employeeName.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {payslip.employeeName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {payslip.employeeId} • {payslip.department}
                  </Typography>
                </Box>
              </Box>
            )
          },
          {
            id: 'payPeriod',
            label: 'Pay Period',
            render: (value, payslip) => (
              <Typography variant="body2">
                {payslip.payPeriod}
              </Typography>
            )
          },
          {
            id: 'grossPay',
            label: 'Gross Pay',
            align: 'right',
            render: (value, payslip) => (
              <Typography variant="body2" fontWeight="bold">
                ₹{(payslip.grossPay || 0).toLocaleString('en-IN')}
              </Typography>
            )
          },
          {
            id: 'deductions',
            label: 'Deductions',
            align: 'right',
            render: (value, payslip) => (
              <Typography variant="body2" color="error.main">
                ₹{((payslip.taxDeductions || 0) + (payslip.socialSecurity || 0) + (payslip.otherDeductions || 0)).toLocaleString('en-IN')}
              </Typography>
            )
          },
          {
            id: 'netPay',
            label: 'Net Pay',
            align: 'right',
            render: (value, payslip) => (
              <Typography variant="body2" fontWeight="bold" color="success.main">
                ₹{(payslip.netPay || 0).toLocaleString('en-IN')}
              </Typography>
            )
          },
          {
            id: 'status',
            label: 'Status',
            render: (value, payslip) => (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getStatusIcon(payslip.status)}
                <Chip
                  label={payslip.status.toUpperCase()}
                  color={statusColors[payslip.status]}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            )
          },
          {
            id: 'actions',
            label: 'Actions',
            align: 'center',
            render: (value, payslip) => (
              <Stack direction="row" spacing={1} justifyContent="center">
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedPayslip(payslip);
                    setPayslipDialog(true);
                  }}
                >
                  View
                </Button>
                {(isAdmin() || isHR()) && payslip.status === 'draft' && (
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleProcessPayroll(payslip.id)}
                  >
                    Process
                  </Button>
                )}
                <IconButton
                  size="small"
                  onClick={() => handleDownloadPayslip(payslip.id)}
                >
                  <DownloadIcon />
                </IconButton>
              </Stack>
            )
          }
        ]}
        renderMobileCard={(payslip) => (
          <Card 
            sx={{ 
              mb: 2, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              '&:hover': {
                boxShadow: 2,
                borderColor: 'primary.main'
              }
            }}
          >
            <CardContent sx={{ p: 2 }}>
              {/* Header with Employee and Status */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Avatar 
                    sx={{ 
                      mr: 2, 
                      bgcolor: 'primary.main',
                      width: 40,
                      height: 40
                    }}
                  >
                    {payslip.employeeName.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {payslip.employeeName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {payslip.employeeId} • {payslip.department}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={payslip.status.toUpperCase()}
                  color={statusColors[payslip.status]}
                  size="small"
                />
              </Box>

              {/* Financial Details */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Pay Period
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {payslip.payPeriod}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Gross Pay
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{(payslip.grossPay || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Deductions
                    </Typography>
                    <Typography variant="body2" color="error.main" fontWeight="medium">
                      ₹{((payslip.taxDeductions || 0) + (payslip.socialSecurity || 0) + (payslip.otherDeductions || 0)).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Net Pay
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      ₹{(payslip.netPay || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => {
                    setSelectedPayslip(payslip);
                    setPayslipDialog(true);
                  }}
                  sx={{ flex: 1, minWidth: 'auto' }}
                >
                  View
                </Button>
                {(isAdmin() || isHR()) && payslip.status === 'draft' && (
                  <Button 
                    size="small" 
                    variant="contained"
                    color="primary"
                    onClick={() => handleProcessPayroll(payslip.id)}
                    sx={{ flex: 1, minWidth: 'auto' }}
                  >
                    Process
                  </Button>
                )}
                <IconButton
                  size="small"
                  onClick={() => handleDownloadPayslip(payslip.id)}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <DownloadIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        )}
      />

      {/* Payslip Generation Cards */}
      <Grid container spacing={3}>
        {employees.map((employee, index) => (
          <Grow in timeout={300 + index * 50} key={employee.id}>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: employee.payslipGenerated
                      ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
                      : `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`
                  },
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2.5}>
                    {/* Employee Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={employee.photoUrl}
                        sx={{
                          width: 48,
                          height: 48,
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}
                      >
                        {employee.firstName?.charAt(0)}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="700">
                          {employee.firstName} {employee.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {employee.employeeId} • {employee.position?.title}
                        </Typography>
                      </Box>
                      
                      {employee.payslipGenerated && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Generated"
                          size="small"
                          color="success"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                    
                    <Divider />
                    
                    {/* Salary Info */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Monthly Salary
                      </Typography>
                      <Typography variant="h5" fontWeight="700" color="primary.main">
                        ₹{employee.salary?.basicSalary?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        + Allowances & Benefits
                      </Typography>
                    </Box>
                    
                    {/* Action Button */}
                    <Button
                      fullWidth
                      variant={employee.payslipGenerated ? 'outlined' : 'contained'}
                      startIcon={employee.payslipGenerated ? <DownloadIcon /> : <ReceiptIcon />}
                      onClick={() => employee.payslipGenerated 
                        ? handleDownload(employee.id)
                        : handleGenerate(employee.id)
                      }
                      sx={{
                        borderRadius: 2,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        ...(!employee.payslipGenerated && {
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                        })
                      }}
                    >
                      {employee.payslipGenerated ? 'Download Payslip' : 'Generate Payslip'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grow>
        ))}
      </Grid>

      {/* Bulk Actions */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrowIcon />}
          onClick={handleBulkGenerate}
          disabled={loading || allGenerated}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`
            }
          }}
        >
          {loading ? 'Generating...' : 'Generate All Payslips'}
        </Button>
        
        <Button
          variant="outlined"
          size="large"
          startIcon={<EmailIcon />}
          onClick={handleBulkEmail}
          disabled={!anyGenerated}
          sx={{ borderRadius: 2, px: 4, py: 1.5 }}
        >
          Email All Payslips
        </Button>
      </Box>
    </Box>
  );

  const PayrollReportsTab = () => (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Payroll Reports & Analytics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Department Payroll Summary
              </Typography>
              {['Engineering', 'HR', 'Sales'].map((dept, index) => {
                const deptPayroll = payslips
                  .filter(p => p.department === dept)
                  .reduce((sum, p) => sum + p.netPay, 0);
                return (
                  <Box key={dept} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{dept}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{deptPayroll.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                      <Box
                        sx={{
                          bgcolor: 'primary.main',
                          height: '100%',
                          borderRadius: 1,
                          width: `${(deptPayroll / 20000) * 100}%`
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tax & Deductions Breakdown
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <MoneyIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Income Tax"
                    secondary={`₹${payslips.reduce((sum, p) => sum + (p.taxDeductions || 0), 0).toLocaleString('en-IN')}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ReceiptIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Social Security"
                    secondary={`₹${payslips.reduce((sum, p) => sum + (p.socialSecurity || 0), 0).toLocaleString('en-IN')}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalculateIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Other Deductions"
                    secondary={`₹${payslips.reduce((sum, p) => sum + (p.otherDeductions || 0), 0).toLocaleString('en-IN')}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ReportIcon />}
                    onClick={() => console.log('Generate monthly report')}
                  >
                    Monthly Report
                  </Button>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => console.log('Generate tax report')}
                  >
                    Tax Report
                  </Button>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => console.log('Export to CSV')}
                  >
                    Export CSV
                  </Button>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SendIcon />}
                    onClick={() => console.log('Send payslips')}
                  >
                    Send Payslips
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              borderRadius: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Payroll Management
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Process employee salaries and generate payslips
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Tabs */}
          <Paper sx={{ borderRadius: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
            >
              <Tab label="Payroll Overview" />
              <Tab label="Reports & Analytics" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && <PayrollOverviewTab />}
              {activeTab === 1 && <PayrollReportsTab />}
            </Box>
          </Paper>

          {/* Payslip Detail Dialog */}
          <Dialog open={payslipDialog} onClose={() => setPayslipDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              Payslip Details
            </DialogTitle>
            <DialogContent>
              {selectedPayslip && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Employee Information</Typography>
                    <Typography><strong>Name:</strong> {selectedPayslip.employeeName}</Typography>
                    <Typography><strong>Employee ID:</strong> {selectedPayslip.employeeId}</Typography>
                    <Typography><strong>Department:</strong> {selectedPayslip.department}</Typography>
                    <Typography><strong>Position:</strong> {selectedPayslip.position}</Typography>
                    <Typography><strong>Pay Period:</strong> {selectedPayslip.payPeriod}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Earnings</Typography>
                    <Typography><strong>Base Salary:</strong> ₹{(selectedPayslip.baseSalary || 0).toLocaleString('en-IN')}</Typography>
                    <Typography><strong>Overtime:</strong> ₹{(selectedPayslip.overtime || 0).toLocaleString('en-IN')}</Typography>
                    <Typography><strong>Allowances:</strong> ₹{(selectedPayslip.allowances || 0).toLocaleString('en-IN')}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography color="primary" fontWeight="bold">
                      <strong>Gross Pay:</strong> ₹{(selectedPayslip.grossPay || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Deductions</Typography>
                    <Typography><strong>Tax:</strong> ₹{(selectedPayslip.taxDeductions || 0).toLocaleString('en-IN')}</Typography>
                    <Typography><strong>Social Security:</strong> ₹{(selectedPayslip.socialSecurity || 0).toLocaleString('en-IN')}</Typography>
                    <Typography><strong>Other:</strong> ₹{(selectedPayslip.otherDeductions || 0).toLocaleString('en-IN')}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography color="error" fontWeight="bold">
                      <strong>Total Deductions:</strong> ₹{((selectedPayslip.taxDeductions || 0) + (selectedPayslip.socialSecurity || 0) + (selectedPayslip.otherDeductions || 0)).toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Net Pay</Typography>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      ₹{(selectedPayslip.netPay || 0).toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {selectedPayslip.status.toUpperCase()}
                    </Typography>
                    {selectedPayslip.processedDate && (
                      <Typography variant="body2" color="text.secondary">
                        Processed: {selectedPayslip.processedDate}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPayslipDialog(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadPayslip(selectedPayslip.id)}
              >
                Download PDF
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default ModernPayrollManagement;
