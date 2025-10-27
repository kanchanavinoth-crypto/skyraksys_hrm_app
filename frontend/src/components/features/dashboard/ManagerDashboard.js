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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Stack,
  Badge,
  useTheme,
  alpha,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Group as TeamIcon,
  EventNote as LeaveIcon,
  Schedule as TimesheetIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Pending as PendingIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  ExpandMore as ExpandMoreIcon,
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
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: color, mr: 2, width: 48, height: 48 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" component="div" fontWeight="bold" color={color}>
              {value}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const TeamMemberCard = ({ member }) => (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: theme.shadows[4] } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {member.firstName} {member.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {member.position} • {member.department}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                {member.isOnLeave && (
                  <Chip 
                    label="On Leave" 
                    color="warning" 
                    size="small"
                    icon={<LeaveIcon />}
                  />
                )}
                <Chip 
                  label={member.employmentType} 
                  variant="outlined" 
                  size="small"
                />
              </Stack>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <IconButton 
              onClick={() => navigate(`/employees/${member.id}`)}
              color="primary"
            >
              <ViewIcon />
            </IconButton>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );

  const LeaveRequestItem = ({ request }) => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'orange' }}>
            <LeaveIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {request.Employee?.firstName} {request.Employee?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {request.leaveType} • {request.startDate} to {request.endDate}
            </Typography>
          </Box>
          <Chip 
            label={`${request.totalDays} days`} 
            color="info" 
            size="small"
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Reason:</strong> {request.reason}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Applied on:</strong> {new Date(request.createdAt).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<ApproveIcon />}
                onClick={() => openApprovalDialog(request, 'approved')}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<RejectIcon />}
                onClick={() => openApprovalDialog(request, 'rejected')}
              >
                Reject
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const TimesheetItem = ({ timesheet }) => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'blue' }}>
            <TimesheetIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {timesheet.Employee?.firstName} {timesheet.Employee?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Week of {timesheet.weekStart} • {timesheet.totalHours} hours
            </Typography>
          </Box>
          <Chip 
            label={timesheet.status} 
            color={timesheet.status?.toLowerCase() === 'submitted' ? 'warning' : 'default'} 
            size="small"
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Total Hours:</strong> {timesheet.totalHours}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Submitted on:</strong> {new Date(timesheet.submittedAt).toLocaleDateString()}
            </Typography>
            {timesheet.description && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Description:</strong> {timesheet.description}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<ApproveIcon />}
                onClick={() => openApprovalDialog(timesheet, 'approved')}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<RejectIcon />}
                onClick={() => openApprovalDialog(timesheet, 'rejected')}
              >
                Reject
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Manager Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {user?.firstName}! Manage your team and approvals here.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Team Members"
            value={stats.totalTeamMembers}
            icon={<TeamIcon />}
            color={theme.palette.primary.main}
            subtitle="Total team size"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Leave Approvals"
            value={stats.pendingLeaveApprovals}
            icon={<LeaveIcon />}
            color={theme.palette.warning.main}
            subtitle="Pending your approval"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Timesheet Approvals"
            value={stats.pendingTimesheetApprovals}
            icon={<TimesheetIcon />}
            color={theme.palette.info.main}
            subtitle="Pending your approval"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Team On Leave"
            value={stats.teamOnLeave}
            icon={<CalendarIcon />}
            color={theme.palette.error.main}
            subtitle="Currently on leave"
          />
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            aria-label="manager dashboard tabs"
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TeamIcon sx={{ mr: 1 }} />
                  Team Members ({stats.totalTeamMembers})
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LeaveIcon sx={{ mr: 1 }} />
                  Leave Approvals
                  {stats.pendingLeaveApprovals > 0 && (
                    <Badge 
                      badgeContent={stats.pendingLeaveApprovals} 
                      color="error" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimesheetIcon sx={{ mr: 1 }} />
                  Timesheet Approvals
                  {stats.pendingTimesheetApprovals > 0 && (
                    <Badge 
                      badgeContent={stats.pendingTimesheetApprovals} 
                      color="error" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {/* Team Members Tab */}
          {activeTab === 0 && (
            <Box>
              {teamMembers.length === 0 ? (
                <Alert severity="info">
                  No team members found. Contact HR to assign team members to your management.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {teamMembers.map((member) => (
                    <Grid item xs={12} md={6} key={member.id}>
                      <TeamMemberCard member={member} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Leave Approvals Tab */}
          {activeTab === 1 && (
            <Box>
              {pendingLeaves.length === 0 ? (
                <Alert severity="success">
                  No pending leave approvals. Great job staying on top of things!
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {pendingLeaves.map((request) => (
                    <LeaveRequestItem key={request.id} request={request} />
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {/* Timesheet Approvals Tab */}
          {activeTab === 2 && (
            <Box>
              {pendingTimesheets.length === 0 ? (
                <Alert severity="success">
                  No pending timesheet approvals. All timesheets are up to date!
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {pendingTimesheets.map((timesheet) => (
                    <TimesheetItem key={timesheet.id} timesheet={timesheet} />
                  ))}
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
