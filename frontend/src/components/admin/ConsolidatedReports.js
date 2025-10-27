import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Assessment as ReportIcon,
  People as EmployeeIcon,
  EventNote as LeaveIcon,
  Schedule as TimesheetIcon,
  AccountBalance as PayrollIcon
} from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import { useNotification } from '../../contexts/NotificationContext';
import employeeService from '../../services/EmployeeService';
import leaveService from '../../services/LeaveService';
import timesheetService from '../../services/TimesheetService';
import { payrollService } from '../../services/payroll.service';

const ConsolidatedReports = () => {
  const { user } = useAuth();
  const { isLoading, setLoading } = useLoading();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState(0);
  const [reportData, setReportData] = useState({
    employees: null,
    leaves: null,
    timesheets: null,
    payroll: null
  });
  const [filters, setFilters] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    department: '',
    employee: '',
    status: ''
  });

  // Report configurations
  const reportTypes = [
    {
      id: 'employees',
      label: 'Employee Reports',
      icon: <EmployeeIcon />,
      description: 'Employee demographics, status, and organization reports'
    },
    {
      id: 'leaves',
      label: 'Leave Analytics',
      icon: <LeaveIcon />,
      description: 'Leave requests, balances, and utilization reports'
    },
    {
      id: 'timesheets',
      label: 'Timesheet Reports',
      icon: <TimesheetIcon />,
      description: 'Time tracking, project allocation, and productivity reports'
    },
    {
      id: 'payroll',
      label: 'Payroll Reports',
      icon: <PayrollIcon />,
      description: 'Salary summaries, tax reports, and payroll analytics'
    }
  ];

  // Load report data
  const loadReportData = useCallback(async (reportType) => {
    const loadingKey = `load-${reportType}`;
    setLoading(loadingKey, true);
    
    try {
      let data = null;
      
      switch (reportType) {
        case 'employees':
          data = await loadEmployeeReports();
          break;
        case 'leaves':
          data = await loadLeaveReports();
          break;
        case 'timesheets':
          data = await loadTimesheetReports();
          break;
        case 'payroll':
          data = await loadPayrollReports();
          break;
        default:
          break;
      }
      
      setReportData(prev => ({
        ...prev,
        [reportType]: data
      }));
      
    } catch (error) {
      console.error(`Failed to load ${reportType} reports:`, error);
      showNotification(`Failed to load ${reportType} reports`, 'error');
    } finally {
      setLoading(loadingKey, false);
    }
  }, [setLoading, showNotification, filters]);

  const loadEmployeeReports = async () => {
    const [employeesResponse, departmentsResponse] = await Promise.all([
      employeeService.getAll(),
      employeeService.getDepartments?.() || Promise.resolve({ data: [] })
    ]);

    const employees = employeesResponse.data || [];
    const departments = departmentsResponse.data || [];

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'Active').length,
      inactiveEmployees: employees.filter(e => e.status === 'Inactive').length,
      departmentBreakdown: departments.map(dept => ({
        department: dept.name,
        count: employees.filter(e => e.departmentId === dept.id).length
      })),
      recentHires: employees
        .filter(e => {
          const hireDate = new Date(e.hireDate);
          return hireDate >= filters.startDate && hireDate <= filters.endDate;
        })
        .length,
      employees: employees
    };
  };

  const loadLeaveReports = async () => {
    const [leavesResponse, balancesResponse] = await Promise.all([
      leaveService.getAll(),
      leaveService.getBalance?.() || Promise.resolve({ data: [] })
    ]);

    const leaves = leavesResponse.data || [];
    const balances = balancesResponse.data || [];

    const filteredLeaves = leaves.filter(leave => {
      const leaveDate = new Date(leave.startDate);
      return leaveDate >= filters.startDate && leaveDate <= filters.endDate;
    });

    return {
      totalRequests: filteredLeaves.length,
      approvedRequests: filteredLeaves.filter(l => l.status === 'Approved').length,
      pendingRequests: filteredLeaves.filter(l => l.status === 'Pending').length,
      rejectedRequests: filteredLeaves.filter(l => l.status === 'Rejected').length,
      leaveTypeBreakdown: Object.entries(
        filteredLeaves.reduce((acc, leave) => {
          const type = leave.leaveType?.name || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {})
      ).map(([type, count]) => ({ type, count })),
      leaves: filteredLeaves,
      balances: balances
    };
  };

  const loadTimesheetReports = async () => {
    const timesheetsResponse = await timesheetService.getAll();
    const timesheets = timesheetsResponse.data || [];

    const filteredTimesheets = timesheets.filter(timesheet => {
      const workDate = new Date(timesheet.workDate);
      return workDate >= filters.startDate && workDate <= filters.endDate;
    });

    const totalHours = filteredTimesheets.reduce((sum, ts) => sum + (ts.hoursWorked || 0), 0);
    const avgHoursPerDay = filteredTimesheets.length > 0 ? totalHours / filteredTimesheets.length : 0;

    return {
      totalEntries: filteredTimesheets.length,
      totalHours: totalHours,
      avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
      approvedEntries: filteredTimesheets.filter(ts => ts.status === 'Approved').length,
      pendingEntries: filteredTimesheets.filter(ts => ts.status === 'Pending').length,
      projectBreakdown: Object.entries(
        filteredTimesheets.reduce((acc, ts) => {
          const project = ts.project?.name || 'No Project';
          acc[project] = (acc[project] || 0) + (ts.hoursWorked || 0);
          return acc;
        }, {})
      ).map(([project, hours]) => ({ project, hours })),
      timesheets: filteredTimesheets
    };
  };

  const loadPayrollReports = async () => {
    const payrollResponse = await payrollService.getAll();
    const payrolls = payrollResponse.data || [];

    const filteredPayrolls = payrolls.filter(payroll => {
      const payrollDate = new Date(payroll.payPeriodStart);
      return payrollDate >= filters.startDate && payrollDate <= filters.endDate;
    });

    const totalGross = filteredPayrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
    const totalNet = filteredPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + (p.totalDeductions || 0), 0);

    return {
      totalPayrolls: filteredPayrolls.length,
      totalGrossSalary: totalGross,
      totalNetSalary: totalNet,
      totalDeductions: totalDeductions,
      avgGrossSalary: filteredPayrolls.length > 0 ? totalGross / filteredPayrolls.length : 0,
      statusBreakdown: Object.entries(
        filteredPayrolls.reduce((acc, payroll) => {
          const status = payroll.status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      ).map(([status, count]) => ({ status, count })),
      payrolls: filteredPayrolls
    };
  };

  useEffect(() => {
    const reportType = reportTypes[activeTab]?.id;
    if (reportType) {
      loadReportData(reportType);
    }
  }, [activeTab, filters, loadReportData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExportReport = async (reportType, format = 'csv') => {
    const exportKey = `export-${reportType}`;
    setLoading(exportKey, true);
    
    try {
      let response;
      switch (reportType) {
        case 'employees':
          response = await employeeService.exportReport?.(filters, format);
          break;
        case 'leaves':
          response = await leaveService.exportReport?.(filters, format);
          break;
        case 'timesheets':
          response = await timesheetService.exportReport?.(filters, format);
          break;
        case 'payroll':
          response = await payrollService.exportPayrollReport(filters);
          break;
        default:
          throw new Error('Unknown report type');
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showNotification(`${reportType} report downloaded successfully`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Failed to export report', 'error');
    } finally {
      setLoading(exportKey, false);
    }
  };

  const renderSummaryCards = (data, reportType) => {
    if (!data) return null;

    let cards = [];
    
    switch (reportType) {
      case 'employees':
        cards = [
          { title: 'Total Employees', value: data.totalEmployees, color: 'primary' },
          { title: 'Active Employees', value: data.activeEmployees, color: 'success' },
          { title: 'Inactive Employees', value: data.inactiveEmployees, color: 'warning' },
          { title: 'Recent Hires', value: data.recentHires, color: 'info' }
        ];
        break;
      case 'leaves':
        cards = [
          { title: 'Total Requests', value: data.totalRequests, color: 'primary' },
          { title: 'Approved', value: data.approvedRequests, color: 'success' },
          { title: 'Pending', value: data.pendingRequests, color: 'warning' },
          { title: 'Rejected', value: data.rejectedRequests, color: 'error' }
        ];
        break;
      case 'timesheets':
        cards = [
          { title: 'Total Entries', value: data.totalEntries, color: 'primary' },
          { title: 'Total Hours', value: `${data.totalHours}h`, color: 'info' },
          { title: 'Avg Hours/Day', value: `${data.avgHoursPerDay}h`, color: 'success' },
          { title: 'Approved Entries', value: data.approvedEntries, color: 'success' }
        ];
        break;
      case 'payroll':
        cards = [
          { title: 'Total Payrolls', value: data.totalPayrolls, color: 'primary' },
          { title: 'Gross Salary', value: `₹${data.totalGrossSalary.toLocaleString()}`, color: 'success' },
          { title: 'Net Salary', value: `₹${data.totalNetSalary.toLocaleString()}`, color: 'info' },
          { title: 'Total Deductions', value: `₹${data.totalDeductions.toLocaleString()}`, color: 'warning' }
        ];
        break;
      default:
        return null;
    }

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h4" color={`${card.color}.main`} gutterBottom>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderDetailedData = (data, reportType) => {
    if (!data) return null;

    const currentReportType = reportTypes[activeTab]?.id;
    const loadingKey = `load-${currentReportType}`;

    if (isLoading(loadingKey)) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    switch (reportType) {
      case 'employees':
        return (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Department Breakdown
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell align="right">Employee Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.departmentBreakdown?.map((dept, index) => (
                  <TableRow key={index}>
                    <TableCell>{dept.department}</TableCell>
                    <TableCell align="right">{dept.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        );
      
      case 'leaves':
        return (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Leave Type Breakdown
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Leave Type</TableCell>
                  <TableCell align="right">Request Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.leaveTypeBreakdown?.map((type, index) => (
                  <TableRow key={index}>
                    <TableCell>{type.type}</TableCell>
                    <TableCell align="right">{type.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        );
      
      case 'timesheets':
        return (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Project Hours Breakdown
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell align="right">Total Hours</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.projectBreakdown?.map((project, index) => (
                  <TableRow key={index}>
                    <TableCell>{project.project}</TableCell>
                    <TableCell align="right">{project.hours}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        );
      
      case 'payroll':
        return (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Payroll Status Breakdown
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.statusBreakdown?.map((status, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip 
                        label={status.status} 
                        color={status.status === 'Approved' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{status.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        );
      
      default:
        return null;
    }
  };

  const currentReportType = reportTypes[activeTab]?.id;
  const currentData = reportData[currentReportType];

  return (
    // <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Consolidated Reports
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => loadReportData(currentReportType)}
              disabled={isLoading(`load-${currentReportType}`)}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport(currentReportType)}
              disabled={isLoading(`export-${currentReportType}`)}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Report Filters
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : null)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="End Date"
                  type="date"
                  value={filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : null)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    {/* Add department options here */}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              {reportTypes.map((report, index) => (
                <Tab
                  key={report.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {report.icon}
                      {report.label}
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>

          <CardContent>
            {/* Report Description */}
            <Alert severity="info" sx={{ mb: 3 }}>
              {reportTypes[activeTab]?.description}
            </Alert>

            {/* Summary Cards */}
            {renderSummaryCards(currentData, currentReportType)}

            {/* Detailed Data */}
            {renderDetailedData(currentData, currentReportType)}
          </CardContent>
        </Card>
      </Box>
    // </LocalizationProvider>
  );
};

export default React.memo(ConsolidatedReports);
