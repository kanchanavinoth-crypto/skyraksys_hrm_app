import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Accordion, AccordionSummary, AccordionDetails, Chip, Switch,
  FormControlLabel, Alert, Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon, Edit as EditIcon, Save as SaveIcon,
  Cancel as CancelIcon, Add as AddIcon, Delete as DeleteIcon,
  ContentCopy as CopyIcon, History as HistoryIcon,
  AccountBalance as BankIcon, Receipt as PayslipIcon
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { employeeService } from '../../services/employee.service';
import { payslipCalculator, formatCurrency } from '../../utils/payslipCalculations';
import { DEFAULT_PAYSLIP_TEMPLATE } from '../../config/payslipTemplates';

const EmployeeSalaryConfiguration = () => {
  const { showNotification } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState([]);

  // Load employees
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await employeeService.getAll();
      const employeeData = response?.data || response || [];
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
    } catch (error) {
      console.error('Failed to load employees:', error);
      showNotification('Failed to load employees', 'error');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Load salary structure for selected employee
  const loadSalaryStructure = useCallback(async (employeeId) => {
    if (!employeeId) return;
    
    try {
      setLoading(true);
      // In a real app, this would call a salary structure API
      // For now, we'll create a default structure
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee) {
        const basicSalary = employee.salary || 15000;
        const structure = payslipCalculator.createSalaryStructureTemplate(basicSalary);
        
        setSalaryStructure({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          effectiveDate: new Date().toISOString().split('T')[0],
          ...structure,
          // Additional employee-specific settings
          settings: {
            pfApplicable: true,
            esicApplicable: basicSalary <= 21000,
            ptApplicable: true,
            overtimeEligible: true,
            bonusEligible: true,
            gratuityApplicable: true
          },
          // Bank details
          bankDetails: {
            bankName: employee.bankName || '',
            accountNumber: employee.accountNumber || '',
            ifscCode: employee.ifscCode || '',
            branch: employee.branch || ''
          }
        });
      }
    } catch (error) {
      console.error('Failed to load salary structure:', error);
      showNotification('Failed to load salary structure', 'error');
    } finally {
      setLoading(false);
    }
  }, [employees, showNotification]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (selectedEmployee) {
      loadSalaryStructure(selectedEmployee.id);
    }
  }, [selectedEmployee, loadSalaryStructure]);

  const handleEmployeeChange = (employee) => {
    if (editMode) {
      // Ask user to save or discard changes
      if (window.confirm('You have unsaved changes. Do you want to discard them?')) {
        setEditMode(false);
        setSelectedEmployee(employee);
      }
    } else {
      setSelectedEmployee(employee);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEarningsChange = (field, value) => {
    setSalaryStructure(prev => ({
      ...prev,
      earnings: {
        ...prev.earnings,
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleDeductionsChange = (field, value) => {
    setSalaryStructure(prev => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleSettingChange = (setting, value) => {
    setSalaryStructure(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  const handleBankDetailsChange = (field, value) => {
    setSalaryStructure(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value
      }
    }));
  };

  const calculateTotals = () => {
    if (!salaryStructure) return { gross: 0, deductions: 0, net: 0 };
    
    const gross = Object.values(salaryStructure.earnings).reduce((sum, amount) => sum + (amount || 0), 0);
    const totalDeductions = Object.values(salaryStructure.deductions).reduce((sum, amount) => sum + (amount || 0), 0);
    const net = gross - totalDeductions;
    
    return { gross, deductions: totalDeductions, net };
  };

  const handleSave = async () => {
    if (!salaryStructure) return;
    
    try {
      setLoading(true);
      // In a real app, this would save to backend
      // await salaryService.saveSalaryStructure(salaryStructure);
      showNotification('Salary structure saved successfully', 'success');
      setEditMode(false);
    } catch (error) {
      console.error('Failed to save salary structure:', error);
      showNotification('Failed to save salary structure', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFromTemplate = (templateType = 'default') => {
    if (!selectedEmployee) return;
    
    const basicSalary = salaryStructure?.earnings?.basicSalary || 15000;
    const newStructure = payslipCalculator.createSalaryStructureTemplate(basicSalary);
    
    setSalaryStructure(prev => ({
      ...prev,
      ...newStructure
    }));
    
    showNotification(`Applied ${templateType} template`, 'success');
  };

  const handlePreviewPayslip = () => {
    setPreviewDialogOpen(true);
  };

  const handleViewHistory = async () => {
    try {
      // In a real app, this would load salary history from backend
      setSalaryHistory([
        {
          id: 1,
          effectiveDate: '2024-01-01',
          basicSalary: 15000,
          grossSalary: 18500,
          netSalary: 16200,
          createdBy: 'HR Admin',
          createdAt: '2024-01-01T10:00:00Z'
        },
        {
          id: 2,
          effectiveDate: '2024-06-01',
          basicSalary: 16000,
          grossSalary: 19500,
          netSalary: 17100,
          createdBy: 'HR Admin',
          createdAt: '2024-06-01T10:00:00Z'
        }
      ]);
      setHistoryDialogOpen(true);
    } catch (error) {
      showNotification('Failed to load salary history', 'error');
    }
  };

  const totals = calculateTotals();

  if (!selectedEmployee || !salaryStructure) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Employee Salary Configuration
        </Typography>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select Employee
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Employee</InputLabel>
              <Select
                value={selectedEmployee?.id || ''}
                onChange={(e) => {
                  const employee = employees.find(emp => emp.id === e.target.value);
                  handleEmployeeChange(employee);
                }}
                label="Employee"
                disabled={loading}
              >
                {loading ? (
                  <MenuItem disabled>Loading employees...</MenuItem>
                ) : !Array.isArray(employees) || employees.length === 0 ? (
                  <MenuItem disabled>No employees found</MenuItem>
                ) : (
                  employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} - {employee.employeeId}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Salary Configuration - {salaryStructure.employeeName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setSelectedEmployee(null)}
          >
            Change Employee
          </Button>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={handleViewHistory}
          >
            History
          </Button>
          <Button
            variant="outlined"
            startIcon={<PayslipIcon />}
            onClick={handlePreviewPayslip}
          >
            Preview Payslip
          </Button>
          {editMode ? (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setEditMode(false);
                  loadSalaryStructure(selectedEmployee.id);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
            >
              Edit
            </Button>
          )}
        </Box>
      </Box>

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" color="primary">
                Gross Salary
              </Typography>
              <Typography variant="h4">
                {formatCurrency(totals.gross)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" color="error">
                Total Deductions
              </Typography>
              <Typography variant="h4">
                {formatCurrency(totals.deductions)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" color="success.main">
                Net Salary
              </Typography>
              <Typography variant="h4">
                {formatCurrency(totals.net)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Effective Date
              </Typography>
              <TextField
                type="date"
                value={salaryStructure.effectiveDate}
                onChange={(e) => setSalaryStructure(prev => ({
                  ...prev,
                  effectiveDate: e.target.value
                }))}
                disabled={!editMode}
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Earnings" />
        <Tab label="Deductions" />
        <Tab label="Settings" />
        <Tab label="Bank Details" />
      </Tabs>

      {/* Earnings Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Earnings Structure</Typography>
              {editMode && (
                <Button
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={() => handleCopyFromTemplate('default')}
                >
                  Apply Template
                </Button>
              )}
            </Box>
            
            <Grid container spacing={3}>
              {Object.entries(salaryStructure.earnings).map(([key, value]) => (
                <Grid item xs={12} md={6} key={key}>
                  <TextField
                    fullWidth
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    type="number"
                    value={value || ''}
                    onChange={(e) => handleEarningsChange(key, e.target.value)}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: '₹'
                    }}
                  />
                </Grid>
              ))}
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Total Earnings
              </Typography>
              <Typography variant="h5" color="primary">
                {formatCurrency(totals.gross)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Deductions Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Deductions Structure</Typography>
            
            <Grid container spacing={3}>
              {Object.entries(salaryStructure.deductions).map(([key, value]) => (
                <Grid item xs={12} md={6} key={key}>
                  <TextField
                    fullWidth
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    type="number"
                    value={value || ''}
                    onChange={(e) => handleDeductionsChange(key, e.target.value)}
                    disabled={!editMode || (key === 'providentFund' && salaryStructure.settings.pfApplicable === false)}
                    InputProps={{
                      startAdornment: '₹'
                    }}
                    helperText={
                      key === 'providentFund' ? `Auto-calculated: ${formatCurrency(payslipCalculator.calculatePF(salaryStructure.earnings.basicSalary))}` :
                      key === 'esic' ? `Auto-calculated: ${formatCurrency(payslipCalculator.calculateESIC(totals.gross))}` :
                      key === 'professionalTax' ? `Auto-calculated: ${formatCurrency(payslipCalculator.calculateProfessionalTax(totals.gross))}` :
                      ''
                    }
                  />
                </Grid>
              ))}
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Total Deductions
              </Typography>
              <Typography variant="h5" color="error">
                {formatCurrency(totals.deductions)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Salary Settings</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={salaryStructure.settings.pfApplicable}
                      onChange={(e) => handleSettingChange('pfApplicable', e.target.checked)}
                      disabled={!editMode}
                    />
                  }
                  label="PF Applicable"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={salaryStructure.settings.esicApplicable}
                      onChange={(e) => handleSettingChange('esicApplicable', e.target.checked)}
                      disabled={!editMode}
                    />
                  }
                  label="ESIC Applicable"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={salaryStructure.settings.ptApplicable}
                      onChange={(e) => handleSettingChange('ptApplicable', e.target.checked)}
                      disabled={!editMode}
                    />
                  }
                  label="Professional Tax Applicable"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={salaryStructure.settings.overtimeEligible}
                      onChange={(e) => handleSettingChange('overtimeEligible', e.target.checked)}
                      disabled={!editMode}
                    />
                  }
                  label="Overtime Eligible"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={salaryStructure.settings.bonusEligible}
                      onChange={(e) => handleSettingChange('bonusEligible', e.target.checked)}
                      disabled={!editMode}
                    />
                  }
                  label="Bonus Eligible"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={salaryStructure.settings.gratuityApplicable}
                      onChange={(e) => handleSettingChange('gratuityApplicable', e.target.checked)}
                      disabled={!editMode}
                    />
                  }
                  label="Gratuity Applicable"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Bank Details Tab */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BankIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Bank Account Details</Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={salaryStructure.bankDetails.bankName}
                  onChange={(e) => handleBankDetailsChange('bankName', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  value={salaryStructure.bankDetails.accountNumber}
                  onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  value={salaryStructure.bankDetails.ifscCode}
                  onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Branch"
                  value={salaryStructure.bankDetails.branch}
                  onChange={(e) => handleBankDetailsChange('branch', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Salary History - {salaryStructure.employeeName}</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Effective Date</TableCell>
                  <TableCell>Basic Salary</TableCell>
                  <TableCell>Gross Salary</TableCell>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Created At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salaryHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{new Date(record.effectiveDate).toLocaleDateString()}</TableCell>
                    <TableCell>{formatCurrency(record.basicSalary)}</TableCell>
                    <TableCell>{formatCurrency(record.grossSalary)}</TableCell>
                    <TableCell>{formatCurrency(record.netSalary)}</TableCell>
                    <TableCell>{record.createdBy}</TableCell>
                    <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog - would show actual payslip preview */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Payslip Preview - {salaryStructure.employeeName}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a preview of how the payslip will look with current salary structure.
          </Alert>
          {/* Here you would render the actual payslip component */}
          <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
            <Typography variant="h6" align="center" gutterBottom>
              PAYSLIP - {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography><strong>Employee:</strong> {salaryStructure.employeeName}</Typography>
                <Typography><strong>Gross Salary:</strong> {formatCurrency(totals.gross)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography><strong>Total Deductions:</strong> {formatCurrency(totals.deductions)}</Typography>
                <Typography><strong>Net Salary:</strong> {formatCurrency(totals.net)}</Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeSalaryConfiguration;