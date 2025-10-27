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
  Chip,
  Avatar,
  Stack,
  Divider,
  useTheme,
  Fade,
  Alert
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Pending as PendingIcon,
  Add as AddIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import LeaveService from '../../../services/LeaveService';

const EmployeeLeaveRequests = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});

  const statusColors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    cancelled: 'default'
  };

  const statusIcons = {
    approved: <ApprovedIcon color="success" />,
    rejected: <RejectedIcon color="error" />,
    pending: <PendingIcon color="warning" />
  };

  useEffect(() => {
    loadEmployeeLeaves();
  }, []);

  const loadEmployeeLeaves = async () => {
    try {
      setLoading(true);
      
      // Load leave requests from API
      const response = await LeaveService.getAll();
      if (response?.data) {
        const leaves = Array.isArray(response.data) ? response.data : 
                      (response.data.data ? response.data.data : []);
        
        // Sort by applied date descending
        const sortedLeaves = leaves.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLeaveRequests(sortedLeaves);
      } else {
        setLeaveRequests([]);
      }

      // Load leave balance from API (if available)
      try {
        // For now, set empty balance - implement balance API later
        setLeaveBalance({
          annual: { total: 25, used: 0, remaining: 25 },
          sick: { total: 12, used: 0, remaining: 12 },
          personal: { total: 5, used: 0, remaining: 5 }
        });
      } catch (balanceError) {
        console.error('Error loading leave balance:', balanceError);
        setLeaveBalance({
          annual: { total: 0, used: 0, remaining: 0 },
          sick: { total: 0, used: 0, remaining: 0 },
          personal: { total: 0, used: 0, remaining: 0 }
        });
      }
    } catch (error) {
      console.error('Error loading leave data:', error);
      setLeaveRequests([]);
      setLeaveBalance({
        annual: { total: 0, used: 0, remaining: 0 },
        sick: { total: 0, used: 0, remaining: 0 },
        personal: { total: 0, used: 0, remaining: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeLabel = (type) => {
    const types = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      personal: 'Personal Leave',
      maternity: 'Maternity Leave',
      emergency: 'Emergency Leave'
    };
    return types[type] || type;
  };

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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    My Leave Requests
                  </Typography>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                    Track your leave applications and balance
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/add-leave-request')}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                New Request
              </Button>
            </Box>
          </Paper>

          <Grid container spacing={4}>
            {/* Leave Balance Cards */}
            <Grid item xs={12}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                Leave Balance Overview
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="primary.main" fontWeight="bold">
                        {leaveBalance.annual?.remaining || 0}
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        Annual Leave
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {leaveBalance.annual?.used || 0} used of {leaveBalance.annual?.total || 0} days
                      </Typography>
                      <Box sx={{ mt: 2, bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                        <Box
                          sx={{
                            bgcolor: 'primary.main',
                            height: '100%',
                            borderRadius: 1,
                            width: `${((leaveBalance.annual?.remaining || 0) / (leaveBalance.annual?.total || 1)) * 100}%`
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="error.main" fontWeight="bold">
                        {leaveBalance.sick?.remaining || 0}
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        Sick Leave
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {leaveBalance.sick?.used || 0} used of {leaveBalance.sick?.total || 0} days
                      </Typography>
                      <Box sx={{ mt: 2, bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                        <Box
                          sx={{
                            bgcolor: 'error.main',
                            height: '100%',
                            borderRadius: 1,
                            width: `${((leaveBalance.sick?.remaining || 0) / (leaveBalance.sick?.total || 1)) * 100}%`
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="warning.main" fontWeight="bold">
                        {leaveBalance.personal?.remaining || 0}
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        Personal Leave
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {leaveBalance.personal?.used || 0} used of {leaveBalance.personal?.total || 0} days
                      </Typography>
                      <Box sx={{ mt: 2, bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                        <Box
                          sx={{
                            bgcolor: 'warning.main',
                            height: '100%',
                            borderRadius: 1,
                            width: `${((leaveBalance.personal?.remaining || 0) / (leaveBalance.personal?.total || 1)) * 100}%`
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Leave Requests Table */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Recent Leave Requests
                    </Typography>
                  </Box>
                  
                  {leaveRequests.length === 0 ? (
                    <Alert severity="info">
                      You haven't submitted any leave requests yet. Click "New Request" to apply for leave.
                    </Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Leave Type</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Days</TableCell>
                            <TableCell>Applied Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Comments</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {leaveRequests.map((request) => (
                            <TableRow key={request.id} hover>
                              <TableCell>
                                <Chip
                                  label={getLeaveTypeLabel(request.leaveType)}
                                  color={request.leaveType === 'annual' ? 'primary' : request.leaveType === 'sick' ? 'error' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2">
                                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {request.reason}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {request.days} days
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {new Date(request.appliedDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {statusIcons[request.status]}
                                  <Chip
                                    label={request.status.toUpperCase()}
                                    color={statusColors[request.status]}
                                    size="small"
                                    sx={{ ml: 1 }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {request.approverComments || '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Container>
  );
};

export default EmployeeLeaveRequests;
