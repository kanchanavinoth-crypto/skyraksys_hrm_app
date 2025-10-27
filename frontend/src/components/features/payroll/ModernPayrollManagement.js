/**
 * Modern Payroll Management System - Admin/HR Interface
 * Comprehensive payslip generation, approval, payment processing, and reporting
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
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
  Checkbox,
  FormControlLabel,
  Alert,
  Divider,
  Stack,
  Tooltip,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Check as ApproveIcon,
  Clear as RejectIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Assessment as ReportIcon,
  Assessment as AssessmentIcon,
  Payment as PaymentIcon,
  PlayArrow as GenerateIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../../contexts/AuthContext';
import http from '../../../http-common';

const ModernPayrollManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { isAdmin, isHR } = useAuth();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    departmentId: '',
    status: '',
    templateId: '' // Add template filter
  });
  
  // Dialogs
  const [generateDialog, setGenerateDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    finalized: 0,
    paid: 0,
    totalAmount: 0
  });

  useEffect(() => {
    loadPayslips();
    loadEmployees();
    loadDepartments();
    loadTemplates();
  }, [filters, page, rowsPerPage]);

  const loadPayslips = async () => {
    try {
      setLoading(true);
      const params = {
        month: filters.month,
        year: filters.year,
        page: page + 1,
        limit: rowsPerPage,
        ...(filters.status && { status: filters.status }),
        ...(filters.departmentId && { departmentId: filters.departmentId })
      };
      
      const response = await http.get('/payslips', { params });
      
      if (response.data.success) {
        setPayslips(response.data.data);
        setTotalRecords(response.data.pagination?.totalRecords || 0);
        
        // Calculate stats
        calculateStats(response.data.data);
      }
    } catch (error) {
      console.error('Load payslips error:', error);
      enqueueSnackbar('Failed to load payslips', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await http.get('/employees', {
        params: { status: 'Active', limit: 1000 }
      });
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Load employees error:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await http.get('/departments');
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('Load departments error:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await http.get('/payslip-templates/active');
      if (response.data.success) {
        setTemplates(response.data.data || []);
      }
    } catch (error) {
      console.error('Load templates error:', error);
      // Don't show error to user, templates are optional
    }
  };

  const calculateStats = (payslipList) => {
    const newStats = {
      total: payslipList.length,
      draft: 0,
      finalized: 0,
      paid: 0,
      totalAmount: 0
    };
    
    payslipList.forEach(p => {
      newStats[p.status]++;
      newStats.totalAmount += parseFloat(p.netPay) || 0;
    });
    
    setStats(newStats);
  };

  const handleGeneratePayslips = async () => {
    if (selectedEmployees.length === 0) {
      enqueueSnackbar('Please select at least one employee', { variant: 'warning' });
      return;
    }
    
    try {
      setLoading(true);
      
      const payload = {
        employeeIds: selectedEmployees,
        month: filters.month,
        year: filters.year
      };
      
      // Include templateId if selected
      if (filters.templateId) {
        payload.templateId = filters.templateId;
      }
      
      const response = await http.post('/payslips/generate', payload);
      
      if (response.data.success) {
        enqueueSnackbar(
          response.data.message || 'Payslips generated successfully',
          { variant: 'success' }
        );
        setGenerateDialog(false);
        setSelectedEmployees([]);
        loadPayslips();
      } else {
        enqueueSnackbar(response.data.message || 'Generation failed', { variant: 'error' });
      }
    } catch (error) {
      console.error('Generate payslips error:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to generate payslips',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!window.confirm('Generate payslips for ALL active employees?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await http.post('/payslips/generate-all', {
        month: filters.month,
        year: filters.year,
        departmentId: filters.departmentId || undefined
      });
      
      if (response.data.success) {
        enqueueSnackbar('Payslips generated for all employees', { variant: 'success' });
        loadPayslips();
      }
    } catch (error) {
      console.error('Generate all error:', error);
      enqueueSnackbar('Failed to generate payslips', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizePayslip = async (payslipId) => {
    try {
      setLoading(true);
      const response = await http.put(`/payslips/${payslipId}/finalize`);
      
      if (response.data.success) {
        enqueueSnackbar('Payslip finalized successfully', { variant: 'success' });
        loadPayslips();
      }
    } catch (error) {
      console.error('Finalize error:', error);
      enqueueSnackbar('Failed to finalize payslip', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (payslipId) => {
    try {
      setLoading(true);
      const response = await http.put(`/payslips/${payslipId}/mark-paid`);
      
      if (response.data.success) {
        enqueueSnackbar('Payslip marked as paid', { variant: 'success' });
        loadPayslips();
      }
    } catch (error) {
      console.error('Mark paid error:', error);
      enqueueSnackbar('Failed to mark as paid', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (payslipId, payslipNumber) => {
    try {
      const response = await http.get(`/payslips/${payslipId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${payslipNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      enqueueSnackbar('PDF downloaded successfully', { variant: 'success' });
    } catch (error) {
      console.error('Download PDF error:', error);
      enqueueSnackbar('Failed to download PDF', { variant: 'error' });
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await http.get('/payslips/reports/export', {
        params: {
          month: filters.month,
          year: filters.year,
          format: 'xlsx'
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslips-${filters.month}-${filters.year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      enqueueSnackbar('Excel exported successfully', { variant: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      enqueueSnackbar('Failed to export Excel', { variant: 'error' });
    }
  };

  const handleViewPayslip = (payslip) => {
    setSelectedPayslip(payslip);
    setViewDialog(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'warning',
      finalized: 'info',
      paid: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  // =====================================================
  // TAB: OVERVIEW / DASHBOARD
  // =====================================================

  const OverviewTab = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Payslips
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Draft
              </Typography>
              <Typography variant="h4" color="warning.main">{stats.draft}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Finalized
              </Typography>
              <Typography variant="h4" color="info.main">{stats.finalized}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Paid
              </Typography>
              <Typography variant="h4" color="success.main">{stats.paid}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Payout Amount
              </Typography>
              <Typography variant="h4">
                ₹{stats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Quick Actions</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<GenerateIcon />}
            onClick={() => setGenerateDialog(true)}
          >
            Generate Payslips
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPayslips}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>
      
      {/* Payslips List */}
      <PayslipsTable />
    </Box>
  );

  // =====================================================
  // TAB: GENERATE PAYSLIPS
  // =====================================================

  const GenerateTab = () => (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Generate Payslips
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>
              <Select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                label="Month"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                label="Year"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return <MenuItem key={year} value={year}>{year}</MenuItem>;
                })}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Payslip Template (Optional)</InputLabel>
              <Select
                value={filters.templateId}
                onChange={(e) => setFilters({ ...filters, templateId: e.target.value })}
                label="Payslip Template (Optional)"
              >
                <MenuItem value="">
                  <em>Use Default Template</em>
                </MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name} {template.isDefault && '(Default)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Select a custom template or leave blank to use the default Indian payslip template
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Select Employees
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedEmployees.length === employees.length && employees.length > 0}
                  indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < employees.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedEmployees(employees.map(emp => emp.id));
                    } else {
                      setSelectedEmployees([]);
                    }
                  }}
                />
              }
              label="Select All"
            />
            
            <Box sx={{ maxHeight: 400, overflow: 'auto', mt: 2 }}>
              {employees.map((employee) => (
                <FormControlLabel
                  key={employee.id}
                  control={
                    <Checkbox
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, employee.id]);
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                        }
                      }}
                    />
                  }
                  label={`${employee.employeeId} - ${employee.firstName} ${employee.lastName}`}
                />
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="contained"
              size="large"
              startIcon={<GenerateIcon />}
              onClick={handleGeneratePayslips}
              disabled={loading || selectedEmployees.length === 0}
              fullWidth
            >
              Generate {selectedEmployees.length} Payslip(s)
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  // =====================================================
  // PAYSLIPS TABLE
  // =====================================================

  const PayslipsTable = () => (
    <Paper>
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            label="Month"
            size="small"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            label="Year"
            size="small"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return <MenuItem key={year} value={year}>{year}</MenuItem>;
            })}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            label="Status"
            size="small"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="finalized">Finalized</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select
            value={filters.departmentId}
            onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
            label="Department"
            size="small"
          >
            <MenuItem value="">All Departments</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {loading && <LinearProgress />}
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Pay Period</TableCell>
              <TableCell align="right">Gross Earnings</TableCell>
              <TableCell align="right">Deductions</TableCell>
              <TableCell align="right">Net Pay</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No payslips found
                </TableCell>
              </TableRow>
            ) : (
              payslips.map((payslip) => (
                <TableRow key={payslip.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {payslip.employee?.employeeId}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {payslip.employee?.firstName} {payslip.employee?.lastName}
                    </Typography>
                  </TableCell>
                  <TableCell>{payslip.payPeriod}</TableCell>
                  <TableCell align="right">
                    ₹{parseFloat(payslip.grossEarnings || 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="right">
                    ₹{parseFloat(payslip.totalDeductions || 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ₹{parseFloat(payslip.netPay || 0).toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payslip.status}
                      color={getStatusColor(payslip.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewPayslip(payslip)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download PDF">
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadPDF(payslip.id, payslip.payslipNumber)}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {payslip.status === 'draft' && (
                      <Tooltip title="Finalize">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleFinalizePayslip(payslip.id)}
                        >
                          <LockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {payslip.status === 'finalized' && (
                      <Tooltip title="Mark as Paid">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleMarkAsPaid(payslip.id)}
                        >
                          <PaymentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={totalRecords}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
  );

  // =====================================================
  // VIEW DIALOG
  // =====================================================

  const ViewPayslipDialog = () => (
    <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        Payslip Details - {selectedPayslip?.payslipNumber}
      </DialogTitle>
      <DialogContent dividers>
        {selectedPayslip && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">Employee Information</Typography>
              <Typography variant="body1">
                {selectedPayslip.employeeInfo?.name} ({selectedPayslip.employeeInfo?.employeeId})
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedPayslip.employeeInfo?.designation} | {selectedPayslip.employeeInfo?.department}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Pay Period</Typography>
              <Typography variant="body1">{selectedPayslip.payPeriod}</Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Status</Typography>
              <Chip label={selectedPayslip.status} color={getStatusColor(selectedPayslip.status)} size="small" />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Earnings</Typography>
              {Object.entries(selectedPayslip.earnings || {}).map(([key, value]) => (
                <Box key={key} display="flex" justifyContent="space-between">
                  <Typography variant="body2">{formatLabel(key)}</Typography>
                  <Typography variant="body2">₹{parseFloat(value).toFixed(2)}</Typography>
                </Box>
              ))}
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="body1" fontWeight="bold">Gross Earnings</Typography>
                <Typography variant="body1" fontWeight="bold">
                  ₹{parseFloat(selectedPayslip.grossEarnings).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Deductions</Typography>
              {Object.entries(selectedPayslip.deductions || {}).map(([key, value]) => (
                <Box key={key} display="flex" justifyContent="space-between">
                  <Typography variant="body2">{formatLabel(key)}</Typography>
                  <Typography variant="body2">₹{parseFloat(value).toFixed(2)}</Typography>
                </Box>
              ))}
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="body1" fontWeight="bold">Total Deductions</Typography>
                <Typography variant="body1" fontWeight="bold">
                  ₹{parseFloat(selectedPayslip.totalDeductions).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6" color="primary">Net Pay</Typography>
                <Typography variant="h6" color="primary">
                  ₹{parseFloat(selectedPayslip.netPay).toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                {selectedPayslip.netPayInWords}
              </Typography>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setViewDialog(false)}>Close</Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => {
            handleDownloadPDF(selectedPayslip.id, selectedPayslip.payslipNumber);
            setViewDialog(false);
          }}
        >
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );

  const formatLabel = (key) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  };

  // Main Render
  if (!isAdmin && !isHR) {
    return (
      <Container>
        <Alert severity="error">Access denied. Admin/HR privileges required.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Payroll Management System
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Comprehensive payslip generation, approval, and payment processing
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="Generate" icon={<GenerateIcon />} iconPosition="start" />
          <Tab label="Process Payments" icon={<PaymentIcon />} iconPosition="start" />
          <Tab label="Reports" icon={<ReportIcon />} iconPosition="start" />
        </Tabs>
      </Paper>
      
      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && <OverviewTab />}
        {activeTab === 1 && <GenerateTab />}
        {activeTab === 2 && <PayslipsTable />}
        {activeTab === 3 && <PayslipsTable />}
      </Box>
      
      <ViewPayslipDialog />
    </Container>
  );
};

export default ModernPayrollManagement;
