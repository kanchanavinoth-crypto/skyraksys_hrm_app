import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  Badge,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  Group as TeamIcon,
  EventNote as LeaveIcon,
  Schedule as TimesheetIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useLoading } from '../../../contexts/LoadingContext';
import leaveService from '../../../services/LeaveService';
import timesheetService from '../../../services/TimesheetService';
import employeeService from '../../../services/EmployeeService';

const ManagerDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  // Loading state managed by LoadingContext
  const { isLoading: isLoadingFn, setLoading } = useLoading();
  const isLoading = isLoadingFn('manager-dashboard');
  const [activeTab, setActiveTab] = useState(0);
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingTimesheets, setPendingTimesheets] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    totalTeamMembers: 0,
    pendingLeaveApprovals: 0,
    pendingTimesheetApprovals: 0,
    teamOnLeave: 0
  });

  useEffect(() => {
    loadManagerData();
  }, []);

  const loadManagerData = async () => {
    try {
      setLoading(true);
      
      // Load team members managed by current user
      const teamResponse = await employeeService.getTeamMembers(user.id);
      setTeamMembers(teamResponse.data || []);
      
      // Load pending leave requests for team members
      const leavesResponse = await leaveService.getPendingForManager(user.id);
      setPendingLeaves(leavesResponse.data || []);
      
      // Load pending timesheets for team members
      const timesheetsResponse = await timesheetService.getPendingForManager(user.id);
      setPendingTimesheets(timesheetsResponse.data || []);
      
      // Calculate statistics
      setStats({
        totalTeamMembers: teamResponse.data?.length || 0,
        pendingLeaveApprovals: leavesResponse.data?.length || 0,
        pendingTimesheetApprovals: timesheetsResponse.data?.length || 0,
        teamOnLeave: teamResponse.data?.filter(member => member.isOnLeave)?.length || 0
      });
      
    } catch (error) {
      console.error('Error loading manager data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedItem || !approvalAction) return;
    
    try {
      setActionLoading(true);
      
      if (activeTab === 1) { // Leave approval
        await leaveService.approveReject(selectedItem.id, {
          action: approvalAction,
          comments: approvalComments
        });
      } else if (activeTab === 2) { // Timesheet approval
        await timesheetService.approveReject(selectedItem.id, {
          action: approvalAction,
          comments: approvalComments
        });
      }
      
      // Reload data
      await loadManagerData();
      
      // Close dialog
      setApprovalDialog(false);
      setSelectedItem(null);
      setApprovalComments('');
      
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openApprovalDialog = (item, action) => {
    setSelectedItem(item);
    setApprovalAction(action);
    setApprovalDialog(true);
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card 
      sx={{ 
        height: '100%',
        boxShadow: 1,
        border: `1px solid ${alpha(color, 0.1)}`,
        transition: 'all 0.15s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" variant="caption" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h6" fontWeight="600" sx={{ color, mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.6 }}>
            {React.cloneElement(icon, { sx: { fontSize: 24 } })}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );





  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Minimalistic Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="600" gutterBottom>
          Manager Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Typography>
      </Box>

      {/* Compact Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Team"
            value={stats.totalTeamMembers}
            icon={<TeamIcon />}
            color={theme.palette.primary.main}
            subtitle="members"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Leave Requests"
            value={stats.pendingLeaveApprovals}
            icon={<LeaveIcon />}
            color={theme.palette.warning.main}
            subtitle="pending"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Timesheets"
            value={stats.pendingTimesheetApprovals}
            icon={<TimesheetIcon />}
            color={theme.palette.info.main}
            subtitle="pending"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="On Leave"
            value={stats.teamOnLeave}
            icon={<CalendarIcon />}
            color={theme.palette.error.main}
            subtitle="today"
          />
        </Grid>
      </Grid>

      {/* ⚡ Quick Actions */}
      <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
        ⚡ Quick Actions
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<TeamIcon />}
            onClick={() => setActiveTab(0)}
            size="small"
            sx={{ py: 1.5 }}
          >
            View Team
          </Button>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LeaveIcon />}
            onClick={() => setActiveTab(1)}
            size="small"
            sx={{ py: 1.5 }}
            color="warning"
          >
            Leave Approvals
            {stats.pendingLeaveApprovals > 0 && (
              <Badge 
                badgeContent={stats.pendingLeaveApprovals} 
                color="error" 
                sx={{ ml: 1 }}
              />
            )}
          </Button>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<TimesheetIcon />}
            onClick={() => setActiveTab(2)}
            size="small"
            sx={{ py: 1.5 }}
            color="info"
          >
            Timesheet Approvals
            {stats.pendingTimesheetApprovals > 0 && (
              <Badge 
                badgeContent={stats.pendingTimesheetApprovals} 
                color="error" 
                sx={{ ml: 1 }}
              />
            )}
          </Button>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate('/reports')}
            size="small"
            sx={{ py: 1.5 }}
          >
            Reports
          </Button>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<TrendingUpIcon />}
            onClick={() => navigate('/performance')}
            size="small"
            sx={{ py: 1.5 }}
          >
            Performance
          </Button>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<PersonIcon />}
            onClick={() => navigate('/employee-profile')}
            size="small"
            sx={{ py: 1.5 }}
          >
            My Profile
          </Button>
        </Grid>
      </Grid>

      {/* Simplified Content Area */}
      <Paper sx={{ boxShadow: 1 }}>
        <Box sx={{ p: 2 }}>
          {/* Team Members */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                Team Members ({stats.totalTeamMembers})
              </Typography>
              {teamMembers.length === 0 ? (
                <Alert severity="info" sx={{ py: 1 }}>
                  No team members found.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {teamMembers.slice(0, 5).map((member) => (
                    <Card key={member.id} sx={{ p: 1 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>
                            {member.firstName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {member.firstName} {member.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {member.position}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {member.isOnLeave && (
                            <Chip label="On Leave" color="warning" size="small" />
                          )}
                          <IconButton 
                            size="small"
                            onClick={() => navigate(`/employees/${member.id}`)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                  {teamMembers.length > 5 && (
                    <Typography variant="caption" color="text.secondary" align="center">
                      +{teamMembers.length - 5} more team members
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
          )}

          {/* Leave Approvals */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                Pending Leave Requests ({stats.pendingLeaveApprovals})
              </Typography>
              {pendingLeaves.length === 0 ? (
                <Alert severity="success" sx={{ py: 1 }}>
                  No pending leave approvals!
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {pendingLeaves.slice(0, 3).map((request) => (
                    <Card key={request.id} sx={{ p: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {request.Employee?.firstName} {request.Employee?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.leaveType} • {request.startDate} to {request.endDate}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {request.reason}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            color="success"
                            variant="contained"
                            onClick={() => openApprovalDialog(request, 'approved')}
                            startIcon={<ApproveIcon />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => openApprovalDialog(request, 'rejected')}
                            startIcon={<RejectIcon />}
                          >
                            Reject
                          </Button>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                  {pendingLeaves.length > 3 && (
                    <Typography variant="caption" color="text.secondary" align="center">
                      +{pendingLeaves.length - 3} more pending requests
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
          )}

          {/* Timesheet Approvals */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                Pending Timesheets ({stats.pendingTimesheetApprovals})
              </Typography>
              {pendingTimesheets.length === 0 ? (
                <Alert severity="success" sx={{ py: 1 }}>
                  No pending timesheet approvals!
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {pendingTimesheets.slice(0, 3).map((timesheet) => (
                    <Card key={timesheet.id} sx={{ p: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {timesheet.Employee?.firstName} {timesheet.Employee?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Week of {timesheet.weekStart} • {timesheet.totalHours}h
                          </Typography>
                          {timesheet.description && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              {timesheet.description}
                            </Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            color="success"
                            variant="contained"
                            onClick={() => openApprovalDialog(timesheet, 'approved')}
                            startIcon={<ApproveIcon />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => openApprovalDialog(timesheet, 'rejected')}
                            startIcon={<RejectIcon />}
                          >
                            Reject
                          </Button>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                  {pendingTimesheets.length > 3 && (
                    <Typography variant="caption" color="text.secondary" align="center">
                      +{pendingTimesheets.length - 3} more pending timesheets
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Approval Dialog */}
      <Dialog 
        open={approvalDialog} 
        onClose={() => setApprovalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {approvalAction === 'approved' ? 'Approve' : 'Reject'} {activeTab === 1 ? 'Leave Request' : 'Timesheet'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to {approvalAction === 'approved' ? 'approve' : 'reject'} this {activeTab === 1 ? 'leave request' : 'timesheet'}?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comments (Optional)"
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
            placeholder="Add any comments for this approval/rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleApproval}
            variant="contained"
            color={approvalAction === 'approved' ? 'success' : 'error'}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {approvalAction === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManagerDashboard;
