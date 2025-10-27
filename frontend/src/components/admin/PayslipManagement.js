import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Grid, Button, Card, CardContent,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, FormControl, InputLabel, Select, MenuItem, TextField,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, 
  DialogActions, Divider, IconButton, Accordion, AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon, GetApp as DownloadIcon, Refresh as RefreshIcon,
  Receipt as PayslipIcon, GroupWork as BulkIcon, Settings as SettingsIcon,
  Visibility as ViewIcon, Edit as EditIcon, Upload as UploadIcon,
  ExpandMore as ExpandMoreIcon, Delete as DeleteIcon,
  Calculate as CalculateIcon, Preview as PreviewIcon
} from '@mui/icons-material';

// Context imports
import { useNotification } from '../../contexts/NotificationContext';
import PayslipViewer from '../payslip/PayslipViewer';
import { payslipService } from '../../services/payslip/payslipService';
import { employeeService } from '../../services/employee.service';
import { payslipCalculator, formatCurrency } from '../../utils/payslipCalculations';
import { DEFAULT_PAYSLIP_TEMPLATE } from '../../config/payslipTemplates';
import TemplateConfiguration from './TemplateConfiguration';
import EmployeeSalaryConfiguration from './EmployeeSalaryConfiguration';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payslip-tabpanel-${index}`}
      aria-labelledby={`payslip-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PayslipManagement = () => {
  const { showNotification } = useNotification();
  const [tabValue, setTabValue] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('default');

  // Bulk generation state
  const [bulkMonth, setBulkMonth] = useState('');
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear());
  
  // CSV Import/Export state
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [csvImportMode, setCsvImportMode] = useState(true);
  const [csvValidationErrors, setCsvValidationErrors] = useState([]);
  
  // Manual data entry state
  const [payrollDataDialog, setPayrollDataDialog] = useState(false);
  const [currentPayrollData, setCurrentPayrollData] = useState({});
  
  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [bulkGenerationLoading, setBulkGenerationLoading] = useState(false);
  
  // Payslip viewer state
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [viewerDialogOpen, setViewerDialogOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    month: '',
    status: '',
    employee: ''
  });

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await employeeService.getAll();
      // Handle different response structures
      const employeeData = response?.data || response || [];
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
    } catch (error) {
      console.error('Failed to load employees:', error);
      showNotification('Failed to load employees - using mock data', 'warning');
      
      // Fallback to mock employee data when backend is not available
      const mockEmployees = [
        {
          id: '1',
          employeeId: 'EMP001',
          firstName: 'System',
          lastName: 'Administrator',
          email: 'admin@skyraksys.com',
          position: 'System Administrator',
          department: 'Information Technology',
          salary: 125000
        },
        {
          id: '2',
          employeeId: 'EMP003',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@skyraksys.com',
          position: 'Software Developer',
          department: 'Information Technology',
          salary: 66667
        },
        {
          id: '3',
          employeeId: 'EMP004',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@skyraksys.com',
          position: 'Software Developer',
          department: 'Information Technology',
          salary: 62500
        },
        {
          id: '4',
          employeeId: 'EMP005',
          firstName: 'Mike',
          lastName: 'Wilson',
          email: 'mike.wilson@skyraksys.com',
          position: 'Senior Software Developer',
          department: 'Information Technology',
          salary: 108333
        }
      ];
      setEmployees(mockEmployees);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const loadPayslips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await payslipService.getAllPayslips();
      setPayslips(response.data || []);
    } catch (error) {
      console.error('Failed to load payslips:', error);
      showNotification('Failed to load payslips', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadEmployees();
    loadPayslips();
  }, [loadEmployees, loadPayslips]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
  };

  // CSV Import/Export functions
  const handleCSVImport = () => {
    setCsvImportMode(true);
    setCsvDialogOpen(true);
    setCsvData('employee_id,basic_salary,hra,conveyance,medical,overtime,bonus,working_days,present_days,lop_days\nEMP001,15000,6000,1600,1250,0,0,21,21,0\nEMP002,18000,7200,1600,1250,500,1000,21,20,1');
  };

  const handleCSVExport = async () => {
    try {
      // Generate CSV template or export existing payslip data
      const csvTemplate = generateCSVTemplate();
      downloadCSV(csvTemplate, 'payroll_data_template.csv');
    } catch (error) {
      showNotification('Failed to export CSV', 'error');
    }
  };

  const generateCSVTemplate = () => {
    const headers = [
      'employee_id', 'basic_salary', 'hra', 'conveyance', 'medical', 'special_allowance',
      'performance_bonus', 'overtime_hours', 'working_days', 'present_days', 'lop_days',
      'pf', 'esic', 'pt', 'tds', 'medical_premium', 'loan_emi', 'advances'
    ];
    
    // Add sample data
    const sampleData = employees.slice(0, 3).map(emp => [
      emp.employeeId,
      emp.salary || 15000,
      (emp.salary || 15000) * 0.4, // HRA
      1600, // Conveyance
      1250, // Medical
      0, // Special allowance
      0, // Bonus
      0, // Overtime hours
      21, // Working days
      21, // Present days
      0, // LOP days
      0, // PF (auto-calculated)
      0, // ESIC (auto-calculated)
      0, // PT (auto-calculated)
      0, // TDS
      0, // Medical premium
      0, // Loan EMI
      0  // Advances
    ]);
    
    return [headers, ...sampleData];
  };

  const downloadCSV = (data, filename) => {
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processCSVImport = () => {
    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const errors = [];
      const processedData = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowData = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });
        
        // Validate required fields
        if (!rowData.employee_id) {
          errors.push(`Row ${i + 1}: Employee ID is required`);
          continue;
        }
        
        if (!rowData.basic_salary || isNaN(parseFloat(rowData.basic_salary))) {
          errors.push(`Row ${i + 1}: Valid basic salary is required`);
          continue;
        }
        
        processedData.push(rowData);
      }
      
      setCsvValidationErrors(errors);
      
      if (errors.length === 0) {
        // Process the data
        showNotification(`Successfully imported ${processedData.length} records`, 'success');
        setCsvDialogOpen(false);
        // Here you would typically save the data or generate payslips
      }
      
    } catch (error) {
      showNotification('Invalid CSV format', 'error');
    }
  };

  // Manual payroll data entry
  const handleManualDataEntry = (employee) => {
    setSelectedEmployee(employee);
    
    // Set default values based on employee
    let defaultPayrollData = {
      employeeId: employee.employeeId,
      basicSalary: employee.salary || 35000,
      totalWorkingDays: 22,
      presentDays: 22,
      lopDays: 0,
      overtimeHours: 0,
      // Initialize all other fields
      houseRentAllowance: (employee.salary || 35000) * 0.4, // 40% of basic
      conveyanceAllowance: 1600,
      medicalAllowance: 1250,
      specialAllowance: 8000,
      performanceBonus: 1000,
      arrears: 0,
      incentive: 0,
      // Deductions
      voluntaryPF: Math.min((employee.salary || 35000) * 0.12, 1800), // 12% of basic or max 1800
      tds: 2500,
      professionalTax: 200,
      esic: 0,
      medicalPremium: 0,
      nps: 0,
      loanEmi: 0,
      advances: 0,
      canteenCharges: 0,
      otherDeductions: 0
    };

    // Specific defaults for known employees
    if (employee.employeeId === 'EMP003') {
      defaultPayrollData = {
        ...defaultPayrollData,
        basicSalary: 35000,
        houseRentAllowance: 14000,
        medicalAllowance: 1250,
        conveyanceAllowance: 1600,
        specialAllowance: 8000,
        performanceBonus: 1000,
        overtimeHours: 10, // Has overtime
        presentDays: 21, // 1 day absent
        lopDays: 1,
        voluntaryPF: 4200,
        esic: 449,
        professionalTax: 200,
        tds: 2500
      };
    } else if (employee.employeeId === 'EMP005') {
      defaultPayrollData = {
        ...defaultPayrollData,
        basicSalary: 55000,
        houseRentAllowance: 27500,
        medicalAllowance: 15000,
        conveyanceAllowance: 3200,
        specialAllowance: 25000,
        performanceBonus: 8000,
        overtimeHours: 0,
        presentDays: 22,
        lopDays: 0,
        voluntaryPF: 1800,
        esic: 0,
        professionalTax: 200,
        tds: 12000
      };
    }

    setCurrentPayrollData(defaultPayrollData);
    setPayrollDataDialog(true);
  };

  const handleSavePayrollData = () => {
    try {
      // Calculate payslip using the calculation engine
      const payslipData = payslipCalculator.calculatePayslip(
        selectedEmployee,
        currentPayrollData,
        {} // Salary structure would come from employee configuration
      );
      
      setPreviewData(payslipData);
      setPreviewDialogOpen(true);
      setPayrollDataDialog(false);
      showNotification('Payroll data processed successfully', 'success');
    } catch (error) {
      showNotification('Failed to process payroll data', 'error');
    }
  };

  // Bulk generation function
  const handleBulkGeneration = async () => {
    if (!bulkMonth || !bulkYear) {
      showNotification('Please select month and year', 'error');
      return;
    }
    
    try {
      setBulkGenerationLoading(true);
      
      // Get all active employees
      if (!Array.isArray(employees) || employees.length === 0) {
        showNotification('No employees found for bulk generation', 'warning');
        return;
      }
      
      const bulkGenerationData = {
        month: bulkMonth,
        year: bulkYear,
        employeeIds: employees.map(emp => emp.id),
        templateId: selectedTemplate
      };
      
      showNotification('Starting bulk payslip generation...', 'info');
      
      // Call bulk generation API
      const response = await payslipService.generateBulkPayslips(bulkGenerationData);
      
      if (response.success) {
        showNotification(`Successfully generated ${response.data.successCount} payslips`, 'success');
        if (response.data.failedCount > 0) {
          showNotification(`${response.data.failedCount} payslips failed to generate`, 'warning');
        }
        // Refresh payslips list
        loadPayslips();
      } else {
        showNotification('Bulk generation failed: ' + response.message, 'error');
      }
    } catch (error) {
      console.error('Bulk generation error:', error);
      showNotification('Bulk generation failed: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setBulkGenerationLoading(false);
    }
  };

  const handleGeneratePayslip = async () => {
    if (!selectedEmployee) {
      showNotification('Please select an employee', 'warning');
      return;
    }

    try {
      setLoading(true);
      await payslipService.generatePayslip({
        employeeId: selectedEmployee.id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        template: selectedTemplate
      });
      showNotification('Payslip generated successfully', 'success');
      loadPayslips();
    } catch (error) {
      console.error('Failed to generate payslip:', error);
      showNotification('Failed to generate payslip', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFinalPayslip = async () => {
    if (!previewData || !selectedEmployee) {
      showNotification('No preview data available', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Get current date for payPeriod
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const payPeriodString = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      
      // Calculate pay period dates
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);
      const payslipNumber = `PAY-${currentYear}${currentMonth.toString().padStart(2, '0')}-${selectedEmployee.id.substring(0, 8)}`;
      
      // Prepare payslip data for creation
      const payslipData = {
        employeeId: selectedEmployee.id,
        templateId: '61d17f49-8308-4c9c-8a1c-bb3dd900c443', // Default template ID
        payPeriod: payPeriodString,
        month: currentMonth,
        year: currentYear,
        payPeriodStart: startDate.toISOString().split('T')[0],
        payPeriodEnd: endDate.toISOString().split('T')[0],
        payslipNumber: payslipNumber,
        employeeInfo: {
          id: selectedEmployee.id,
          employeeNumber: selectedEmployee.employeeNumber,
          firstName: selectedEmployee.firstName,
          lastName: selectedEmployee.lastName,
          email: selectedEmployee.email,
          department: selectedEmployee.department,
          position: selectedEmployee.position,
          joinDate: selectedEmployee.joinDate
        },
        companyInfo: {
          name: 'SkyrakSys HRM',
          address: 'Corporate Office',
          phone: '+1-234-567-8900',
          email: 'hr@skyraksys.com'
        },
        earnings: previewData.earnings,
        deductions: previewData.deductions,
        attendance: {
          totalWorkingDays: previewData.totalWorkingDays,
          paidDays: previewData.paidDays,
          lopDays: previewData.lopDays,
          presentDays: previewData.paidDays,
          absentDays: previewData.lopDays,
          overtimeHours: 0
        },
        grossEarnings: previewData.grossSalary,
        totalDeductions: previewData.totalDeductions,
        netPay: previewData.netSalary
      };

      const result = await payslipService.createPayslip(payslipData);
      
      showNotification('Final payslip generated successfully!', 'success');
      setPreviewDialogOpen(false);
      setPreviewData(null);
      loadPayslips(); // Refresh the payslips list
      
    } catch (error) {
      console.error('Failed to generate final payslip:', error);
      showNotification('Failed to generate final payslip: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing payslip
  const handleViewPayslip = async (payslip) => {
    try {
      setLoading(true);
      const payslipData = await payslipService.getPayslipById(payslip.id);
      
      // Open payslip viewer dialog
      setSelectedPayslip(payslipData.data);
      setViewerDialogOpen(true);
      
    } catch (error) {
      console.error('Failed to load payslip:', error);
      showNotification('Failed to load payslip: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle downloading payslip PDF
  const handleDownloadPayslip = async (payslip) => {
    try {
      setLoading(true);
      
      // Use the service method for downloading
      await payslipService.downloadPayslipByIdPDF(payslip.id);
      showNotification('Payslip downloaded successfully!', 'success');
      
    } catch (error) {
      console.error('Failed to download payslip:', error);
      showNotification('Failed to download payslip: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayslips = payslips.filter(payslip => {
    if (filters.employee && payslip.employeeId !== filters.employee) return false;
    if (filters.status && filters.status !== 'all' && payslip.status !== filters.status) return false;
    if (filters.month && payslip.month !== parseInt(filters.month)) return false;
    return true;
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PayslipIcon />
            Payslip Management
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadEmployees();
              loadPayslips();
            }}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="payslip management tabs">
            <Tab label="Generate Payslip" icon={<PayslipIcon />} />
            <Tab label="Manual Data Entry" icon={<EditIcon />} />
            <Tab label="CSV Import/Export" icon={<UploadIcon />} />
            <Tab label="Bulk Operations" icon={<BulkIcon />} />
            <Tab label="Payslip History" icon={<ViewIcon />} />
            <Tab label="Employee Config" icon={<SettingsIcon />} />
            <Tab label="Templates" icon={<SettingsIcon />} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Select Employee
                  </Typography>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Employee</InputLabel>
                    <Select
                      value={selectedEmployee?.id || ''}
                      onChange={(e) => {
                        const employee = employees.find(emp => emp.id === e.target.value);
                        handleEmployeeSelect(employee);
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
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Template</InputLabel>
                    <Select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      label="Template"
                    >
                      <MenuItem value="default">Default SKYRAKSYS Template</MenuItem>
                      <MenuItem value="custom">Custom Template</MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleGeneratePayslip}
                      disabled={loading || !selectedEmployee}
                      fullWidth
                    >
                      Generate Payslip
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              {selectedEmployee && (
                <PayslipViewer 
                  employeeId={selectedEmployee.id}
                  embedded={true}
                />
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Manual Data Entry Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box>
            {/* Filters */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Employee</InputLabel>
                    <Select
                      value={filters.employee}
                      onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                      label="Employee"
                    >
                      <MenuItem value="">All Employees</MenuItem>
                      {Array.isArray(employees) && employees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Month"
                    type="number"
                    size="small"
                    value={filters.month}
                    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                    inputProps={{ min: 1, max: 12 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      label="Status"
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="generated">Generated</MenuItem>
                      <MenuItem value="sent">Sent</MenuItem>
                      <MenuItem value="viewed">Viewed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Payslips Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Month/Year</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Generated Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredPayslips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No payslips found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        <TableCell>
                          {payslip.employee?.employeeId || payslip.employeeId || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {payslip.employee?.firstName} {payslip.employee?.lastName}
                        </TableCell>
                        <TableCell>
                          {payslip.month}/{payslip.year}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payslip.status}
                            color={payslip.status === 'generated' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(payslip.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewPayslip(payslip)}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              // TODO: Handle edit payslip
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadPayslip(payslip)}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Manual Data Entry Tab */}
        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Manual Payroll Data Entry
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Enter payroll data for individual employees manually
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Employee</InputLabel>
                    <Select
                      value={selectedEmployee?.id || ''}
                      onChange={(e) => {
                        const employee = employees.find(emp => emp.id === e.target.value);
                        handleManualDataEntry(employee);
                      }}
                      label="Select Employee"
                    >
                      {Array.isArray(employees) && employees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} - {employee.employeeId}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* CSV Import/Export Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    CSV Import
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Import payroll data from CSV file
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={handleCSVImport}
                    sx={{ mt: 2 }}
                  >
                    Import CSV Data
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    CSV Export
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Download CSV template or export existing data
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleCSVExport}
                    sx={{ mt: 2 }}
                  >
                    Download CSV Template
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Bulk Operations Tab (now index 3) */}
        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bulk Payslip Generation
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Month"
                    type="month"
                    value={`${bulkYear}-${String(bulkMonth).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [year, month] = e.target.value.split('-');
                      setBulkYear(parseInt(year));
                      setBulkMonth(parseInt(month));
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<BulkIcon />}
                    onClick={handleBulkGeneration}
                    disabled={bulkGenerationLoading}
                  >
                    {bulkGenerationLoading ? 'Generating...' : 'Generate Bulk Payslips'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Payslip History Tab (now index 4) */}
        <TabPanel value={tabValue} index={4}>
          <Box>
            {/* Filters */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Employee</InputLabel>
                    <Select
                      value={filters.employee}
                      onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                      label="Employee"
                    >
                      <MenuItem value="">All Employees</MenuItem>
                      {Array.isArray(employees) && employees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Month"
                    type="month"
                    value={filters.month}
                    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      label="Status"
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="generated">Generated</MenuItem>
                      <MenuItem value="sent">Sent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Payslips Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Month/Year</TableCell>
                    <TableCell>Gross Salary</TableCell>
                    <TableCell>Net Salary</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Generated Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayslips.map((payslip) => (
                    <TableRow key={payslip.id}>
                      <TableCell>{payslip.employee?.employeeId || payslip.employeeId || 'N/A'}</TableCell>
                      <TableCell>{payslip.employeeName}</TableCell>
                      <TableCell>{payslip.payPeriod}</TableCell>
                      <TableCell>{formatCurrency(payslip.grossSalary)}</TableCell>
                      <TableCell>{formatCurrency(payslip.netSalary)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={payslip.status} 
                          color={
                            payslip.status === 'generated' ? 'success' :
                            payslip.status === 'sent' ? 'primary' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(payslip.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewPayslip(payslip)}
                        >
                          View
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadPayslip(payslip)}
                        >
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Employee Configuration Tab */}
        <TabPanel value={tabValue} index={5}>
          <EmployeeSalaryConfiguration />
        </TabPanel>

        {/* Template Configuration Tab */}
        <TabPanel value={tabValue} index={6}>
          <TemplateConfiguration />
        </TabPanel>

        {/* CSV Dialog */}
        <Dialog open={csvDialogOpen} onClose={() => setCsvDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            CSV {csvImportMode ? 'Import' : 'Export'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={10}
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="Paste your CSV data here..."
              sx={{ mt: 2 }}
            />
            {csvValidationErrors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Validation Errors:</Typography>
                <ul>
                  {csvValidationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCsvDialogOpen(false)}>Cancel</Button>
            <Button onClick={processCSVImport} variant="contained">
              Process CSV
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payroll Data Entry Dialog */}
        <Dialog open={payrollDataDialog} onClose={() => setPayrollDataDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Payroll Data Entry - {selectedEmployee?.firstName} {selectedEmployee?.lastName}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Attendance Information</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Total Working Days"
                  type="number"
                  value={currentPayrollData.totalWorkingDays || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    totalWorkingDays: parseInt(e.target.value) || 0
                  })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Present Days"
                  type="number"
                  value={currentPayrollData.presentDays || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    presentDays: parseInt(e.target.value) || 0
                  })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="LOP Days"
                  type="number"
                  value={currentPayrollData.lopDays || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    lopDays: parseInt(e.target.value) || 0
                  })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Salary & Allowances</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Basic Salary"
                  type="number"
                  value={currentPayrollData.basicSalary || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    basicSalary: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="House Rent Allowance (HRA)"
                  type="number"
                  value={currentPayrollData.houseRentAllowance || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    houseRentAllowance: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Medical Allowance"
                  type="number"
                  value={currentPayrollData.medicalAllowance || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    medicalAllowance: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Transport Allowance"
                  type="number"
                  value={currentPayrollData.conveyanceAllowance || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    conveyanceAllowance: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Special Allowance"
                  type="number"
                  value={currentPayrollData.specialAllowance || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    specialAllowance: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Additional Earnings</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Performance Bonus"
                  type="number"
                  value={currentPayrollData.performanceBonus || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    performanceBonus: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Overtime Hours"
                  type="number"
                  value={currentPayrollData.overtimeHours || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    overtimeHours: parseFloat(e.target.value) || 0
                  })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Statutory Deductions</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Provident Fund (PF)"
                  type="number"
                  value={currentPayrollData.voluntaryPF || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    voluntaryPF: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Income Tax (TDS)"
                  type="number"
                  value={currentPayrollData.tds || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    tds: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Professional Tax"
                  type="number"
                  value={currentPayrollData.professionalTax || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    professionalTax: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ESIC Contribution"
                  type="number"
                  value={currentPayrollData.esic || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    esic: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Other Deductions</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Loan EMI"
                  type="number"
                  value={currentPayrollData.loanEmi || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    loanEmi: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Advances"
                  type="number"
                  value={currentPayrollData.advances || ''}
                  onChange={(e) => setCurrentPayrollData({
                    ...currentPayrollData,
                    advances: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPayrollDataDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePayrollData} variant="contained" startIcon={<CalculateIcon />}>
              Calculate & Preview
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Payslip Preview
          </DialogTitle>
          <DialogContent>
            {previewData && (
              <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                <Typography variant="h6" align="center" gutterBottom>
                  PAYSLIP PREVIEW
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography><strong>Employee:</strong> {previewData.employee?.firstName} {previewData.employee?.lastName}</Typography>
                    <Typography><strong>Employee ID:</strong> {previewData.employee?.employeeId}</Typography>
                    <Typography><strong>Basic Salary:</strong> {formatCurrency(previewData.earnings?.basicSalary)}</Typography>
                    <Typography><strong>Gross Salary:</strong> {formatCurrency(previewData.grossSalary)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Pay Period:</strong> {previewData.payPeriod}</Typography>
                    <Typography><strong>Working Days:</strong> {previewData.totalWorkingDays}</Typography>
                    <Typography><strong>Total Deductions:</strong> {formatCurrency(previewData.totalDeductions)}</Typography>
                    <Typography><strong>Net Salary:</strong> {formatCurrency(previewData.netSalary)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
            <Button 
              variant="contained" 
              startIcon={<PayslipIcon />}
              onClick={handleGenerateFinalPayslip}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Final Payslip'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payslip Viewer Dialog */}
        <Dialog
          open={viewerDialogOpen}
          onClose={() => setViewerDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            View Payslip
            {selectedPayslip && (
              <Typography variant="subtitle1" color="textSecondary">
                {selectedPayslip.employeeInfo?.firstName} {selectedPayslip.employeeInfo?.lastName} - 
                {new Date(0, selectedPayslip.month - 1).toLocaleString('default', { month: 'long' })} {selectedPayslip.year}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            {selectedPayslip ? (
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Employee Information</Typography>
                    <Typography><strong>Employee ID:</strong> {selectedPayslip.employee?.employeeId || 'N/A'}</Typography>
                    <Typography><strong>Name:</strong> {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}</Typography>
                    <Typography><strong>Email:</strong> {selectedPayslip.employee?.email || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Payslip Information</Typography>
                    <Typography><strong>Month:</strong> {selectedPayslip.month}/{selectedPayslip.year}</Typography>
                    <Typography><strong>Status:</strong> {selectedPayslip.status}</Typography>
                    <Typography><strong>Generated:</strong> {new Date(selectedPayslip.createdAt).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Salary Details</Typography>
                    {selectedPayslip.payrollData && (
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom><strong>Earnings</strong></Typography>
                          {Object.entries(selectedPayslip.payrollData.earningsData || {}).map(([key, value]) => (
                            <Typography key={key}>
                              <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ₹{value || 0}
                            </Typography>
                          ))}
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom><strong>Deductions</strong></Typography>
                          {Object.entries(selectedPayslip.payrollData.deductionsData || {}).map(([key, value]) => (
                            <Typography key={key}>
                              <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ₹{value || 0}
                            </Typography>
                          ))}
                        </Grid>
                      </Grid>
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6">
                      <strong>Net Pay: ₹{selectedPayslip.netSalary || 'N/A'}</strong>
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <CircularProgress />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewerDialogOpen(false)}>Close</Button>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={() => selectedPayslip && handleDownloadPayslip(selectedPayslip)}
            >
              Download PDF
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default PayslipManagement;