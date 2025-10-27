import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import PayslipTemplate from './PayslipTemplate';
import payslipService from '../../services/payslip/payslipService';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const PayslipViewer = ({ 
  open, 
  onClose, 
  employee,
  initialMonth = null,
  mode = 'view' // 'view', 'generate', 'edit'
}) => {
  const { showNotification } = useNotifications();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payslipData, setPayslipData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || new Date());
  const [salaryData, setSalaryData] = useState({
    basicSalary: 15000,
    houseRentAllowance: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    specialAllowance: 0,
    lta: 0,
    shiftAllowance: 0,
    internetAllowance: 0,
    arrears: 0,
    medicalPremium: 0,
    nps: 0,
    voluntaryPF: 0
  });
  const [attendanceData, setAttendanceData] = useState({
    totalWorkingDays: 21,
    presentDays: 21,
    lopDays: 0
  });
  const [editMode, setEditMode] = useState(mode === 'generate' || mode === 'edit');

  // Load payslip data when component mounts or month changes
  useEffect(() => {
    if (employee && selectedMonth && mode === 'view') {
      loadPayslipData();
    } else if (employee && (mode === 'generate' || mode === 'edit')) {
      generatePayslipData();
    }
  }, [employee, selectedMonth, mode]);

  const loadPayslipData = async () => {
    setLoading(true);
    setError('');
    try {
      const monthString = selectedMonth.toISOString().slice(0, 7); // YYYY-MM format
      const data = await payslipService.generatePayslip(employee.id, monthString, salaryData);
      setPayslipData(data);
    } catch (err) {
      setError('Failed to load payslip data. Please try again.');
      console.error('Error loading payslip:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePayslipData = () => {
    setLoading(true);
    try {
      // Calculate payslip data locally
      const calculatedData = payslipService.calculatePayslip(
        employee,
        salaryData,
        attendanceData.totalWorkingDays,
        attendanceData.presentDays
      );

      const monthString = selectedMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      setPayslipData({
        ...calculatedData,
        month: monthString,
        paymentMode: 'Online Transfer',
        disbursementDate: new Date().toLocaleDateString('en-GB')
      });
    } catch (err) {
      setError('Failed to generate payslip data.');
      console.error('Error generating payslip:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSalaryChange = (field, value) => {
    setSalaryData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleAttendanceChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    setAttendanceData(prev => {
      const updated = { ...prev, [field]: numValue };
      
      // Auto-calculate LOP days
      if (field === 'totalWorkingDays' || field === 'presentDays') {
        updated.lopDays = Math.max(0, updated.totalWorkingDays - updated.presentDays);
      }
      
      return updated;
    });
  };

  const handleGenerate = () => {
    generatePayslipData();
    setEditMode(false);
  };

  const handlePrint = () => {
    try {
      payslipService.printPayslip('payslip-content');
    } catch (err) {
      showNotification('Failed to print payslip', 'error');
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const monthString = selectedMonth.toISOString().slice(0, 7);
      const pdfBlob = await payslipService.downloadPayslipPDF(employee.id, monthString);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip_${employee.firstName}_${employee.lastName}_${monthString}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification('Payslip downloaded successfully', 'success');
    } catch (err) {
      showNotification('Failed to download payslip', 'error');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'hr';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {mode === 'generate' ? 'Generate Payslip' : 'Employee Payslip'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {payslipData && (
              <>
                <Tooltip title="Print Payslip">
                  <IconButton onClick={handlePrint} size="small">
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download PDF">
                  <IconButton onClick={handleDownload} size="small" disabled={loading}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                {canEdit && (
                  <Tooltip title={editMode ? "View Mode" : "Edit Mode"}>
                    <IconButton 
                      onClick={() => setEditMode(!editMode)} 
                      size="small"
                      color={editMode ? "primary" : "default"}
                    >
                      {editMode ? <ViewIcon /> : <EditIcon />}
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Controls Panel */}
        {(editMode || mode === 'generate') && (
          <Paper sx={{ p: 3, m: 3, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              Payslip Configuration
            </Typography>
            
            <Grid container spacing={3}>
              {/* Month Selection */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Select Month"
                  type="month"
                  value={selectedMonth ? selectedMonth.toISOString().slice(0, 7) : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const [year, month] = value.split('-');
                      setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
                    } else {
                      setSelectedMonth(null);
                    }
                  }}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              {/* Attendance Data */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Total Working Days"
                  type="number"
                  value={attendanceData.totalWorkingDays}
                  onChange={(e) => handleAttendanceChange('totalWorkingDays', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Present Days"
                  type="number"
                  value={attendanceData.presentDays}
                  onChange={(e) => handleAttendanceChange('presentDays', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="LOP Days"
                  type="number"
                  value={attendanceData.lopDays}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Salary Configuration */}
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              Earnings Configuration
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(salaryData).filter(([key]) => 
                !['medicalPremium', 'nps', 'voluntaryPF'].includes(key)
              ).map(([key, value]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <TextField
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    type="number"
                    value={value}
                    onChange={(e) => handleSalaryChange(key, e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>

            <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ mt: 2 }}>
              Additional Deductions
            </Typography>
            <Grid container spacing={2}>
              {['medicalPremium', 'nps', 'voluntaryPF'].map((key) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <TextField
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    type="number"
                    value={salaryData[key]}
                    onChange={(e) => handleSalaryChange(key, e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Generate Payslip'}
              </Button>
              {editMode && payslipData && (
                <Button
                  variant="outlined"
                  onClick={() => setEditMode(false)}
                >
                  View Payslip
                </Button>
              )}
            </Box>
          </Paper>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ m: 3, mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && !payslipData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Payslip Display */}
        {payslipData && !editMode && (
          <Box sx={{ p: 3 }}>
            <PayslipTemplate
              employee={employee}
              payslipData={payslipData}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PayslipViewer;