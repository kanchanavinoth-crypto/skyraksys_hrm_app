import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
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
  Alert,
  Skeleton,
  Avatar,
  Stack,
  Divider,
  useTheme,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  ArrowBack as BackIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';

const EmployeePayslips = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [payslipDialog, setPayslipDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [yearFilter, setYearFilter] = useState('all');

  useEffect(() => {
    loadEmployeePayslips();
  }, []);

  const loadEmployeePayslips = async () => {
    try {
      setLoading(true);
      
      // Load payslips from API using the payslip service
      try {
        const { payslipService } = await import('../../../services/payslip/payslipService');
        
        // Get payslips for the current employee
        const response = await payslipService.getAllPayslips({ 
          employeeId: user.employeeId || user.id 
        });
        
        if (response?.data) {
          const payslips = Array.isArray(response.data) ? response.data : 
                          (response.data.data ? response.data.data : []);
          setPayslips(payslips);
        } else {
          setPayslips([]);
        }
      } catch (serviceError) {
        console.log('Payslip API not available yet - showing empty state');
        setPayslips([]);
      }
      
    } catch (error) {
      console.error('Error loading payslips:', error);
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'processing': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const filteredPayslips = payslips.filter(payslip => {
    if (yearFilter === 'all') return true;
    return payslip.payDate.includes(yearFilter);
  });

  const paginatedPayslips = filteredPayslips.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const yearlyEarnings = payslips.reduce((sum, p) => sum + p.netPay, 0);
  const averageMonthlyPay = payslips.length > 0 ? yearlyEarnings / payslips.length : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <BackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                My Payslips
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                View and download your salary statements
              </Typography>
            </Box>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <ReceiptIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {payslips.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Payslips
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    ₹{yearlyEarnings.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Earnings (YTD)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CalendarIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    ₹{averageMonthlyPay.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Monthly Pay
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Filter by Year</InputLabel>
                    <Select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      label="Filter by Year"
                    >
                      <MenuItem value="all">All Years</MenuItem>
                      <MenuItem value="2025">2025</MenuItem>
                      <MenuItem value="2024">2024</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {filteredPayslips.length} payslips
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    fullWidth
                    onClick={() => console.log('Export all payslips')}
                  >
                    Export All
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Payslips Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pay Period</TableCell>
                    <TableCell align="right">Gross Pay</TableCell>
                    <TableCell align="right">Deductions</TableCell>
                    <TableCell align="right">Net Pay</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 6 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton height={40} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    paginatedPayslips.map((payslip) => (
                      <TableRow key={payslip.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {payslip.month}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {payslip.payPeriod}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            ₹{payslip.grossPay.toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="error.main">
                            ₹{(payslip.taxDeductions + payslip.socialSecurity + payslip.otherDeductions).toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            ₹{payslip.netPay.toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payslip.status.toUpperCase()}
                            color={getStatusColor(payslip.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedPayslip(payslip);
                                setPayslipDialog(true);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => console.log('Download payslip', payslip.id)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredPayslips.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            />
          </Card>

          {/* Payslip Detail Dialog */}
          <Dialog open={payslipDialog} onClose={() => setPayslipDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              Payslip Details - {selectedPayslip?.month}
            </DialogTitle>
            <DialogContent>
              {selectedPayslip && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <strong>Payslip Number:</strong> {selectedPayslip.payslipNumber}
                    </Alert>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Employee Information</Typography>
                    <Typography><strong>Name:</strong> {user?.firstName} {user?.lastName}</Typography>
                    <Typography><strong>Employee ID:</strong> {user?.employeeId || 'EMP001'}</Typography>
                    <Typography><strong>Department:</strong> {user?.department || 'HR'}</Typography>
                    <Typography><strong>Position:</strong> {user?.position || 'HR Manager'}</Typography>
                    <Typography><strong>Pay Period:</strong> {selectedPayslip.payPeriod}</Typography>
                    <Typography><strong>Pay Date:</strong> {selectedPayslip.payDate}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Earnings</Typography>
                    <Typography><strong>Base Salary:</strong> ₹{selectedPayslip.baseSalary.toLocaleString('en-IN')}</Typography>
                    <Typography><strong>Overtime:</strong> ₹{selectedPayslip.overtime.toLocaleString('en-IN')}</Typography>
                    <Typography><strong>Allowances:</strong> ₹{selectedPayslip.allowances.toLocaleString('en-IN')}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography color="primary" fontWeight="bold">
                      <strong>Gross Pay:</strong> ₹{selectedPayslip.grossPay.toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Deductions</Typography>
                    <Typography><strong>Income Tax:</strong> ₹{selectedPayslip.taxDeductions.toLocaleString('en-IN')}</Typography>
                    <Typography><strong>Social Security:</strong> ₹{selectedPayslip.socialSecurity.toLocaleString('en-IN')}</Typography>
                    <Typography><strong>Other Deductions:</strong> ₹{selectedPayslip.otherDeductions.toLocaleString('en-IN')}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography color="error" fontWeight="bold">
                      <strong>Total Deductions:</strong> ₹{(selectedPayslip.taxDeductions + selectedPayslip.socialSecurity + selectedPayslip.otherDeductions).toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Net Pay</Typography>
                    <Typography variant="h3" color="success.main" fontWeight="bold">
                      ₹{selectedPayslip.netPay.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Amount credited to your account
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPayslipDialog(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => console.log('Download payslip PDF')}
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

export default EmployeePayslips;
