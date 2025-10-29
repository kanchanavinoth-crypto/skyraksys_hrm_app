import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  MenuItem,
  FormControl,
  Select,
  LinearProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Avatar,
  Tooltip,
  Alert,
  Divider,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Send as SendIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Today as TodayIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { timesheetService } from '../../../services/timesheet.service';
import ProjectDataService from '../../../services/ProjectService';
import TaskDataService from '../../../services/TaskService';

// Enable dayjs plugins
dayjs.extend(weekday);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

/**
 * Modern Weekly Timesheet Component
 * 
 * A consolidated, modern timesheet component that handles:
 * - Weekly timesheet entry for employees
 * - Submission workflow
 * - Manager/Admin approval interface
 * - Timesheet history view
 * 
 * Features:
 * - Clean, intuitive UI
 * - Real-time validation
 * - Auto-save functionality
 * - Week navigation
 * - Role-based views (Employee, Manager, Admin)
 */
const ModernWeeklyTimesheet = () => {
  const { user, isAdmin, isHR, isManager } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const navigate = useNavigate();
  
  // Tab management (Employee vs Manager/Admin view)
  const [activeTab, setActiveTab] = useState(0); // 0: My Timesheet, 1: Pending Approvals, 2: History
  
  // Week navigation
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('isoWeek'));
  
  // Timesheet entries
  const [tasks, setTasks] = useState([
    {
      id: Date.now(),
      projectId: '',
      taskId: '',
      hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
      notes: ''
    }
  ]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Projects and tasks
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  
  // Timesheet metadata
  const [timesheetStatus, setTimesheetStatus] = useState('draft'); // 'draft', 'submitted', 'approved', 'rejected'
  const [submittedTimesheets, setSubmittedTimesheets] = useState([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // For Manager/Admin: Pending approvals
  const [pendingTimesheets, setPendingTimesheets] = useState([]);
  const [historyTimesheets, setHistoryTimesheets] = useState([]);
  
  // Dialogs
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [viewDialog, setViewDialog] = useState(false);
  
  // Validation
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Auto-save
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);

  // ========== DATA LOADING ==========
  
  // Load projects and tasks
  useEffect(() => {
    loadProjects();
    loadTasks();
  }, []);
  
  // Load timesheet for current week
  useEffect(() => {
    if (activeTab === 0) {
      loadWeekTimesheet();
    } else if (activeTab === 1 && (isManager || isAdmin || isHR)) {
      loadPendingApprovals();
    } else if (activeTab === 2) {
      loadHistory();
    }
  }, [currentWeek, activeTab]);
  
  const loadProjects = async () => {
    try {
      console.log('Loading projects...');
      const response = await ProjectDataService.getAll();
      console.log('Projects response:', response);
      
      // Handle multiple response formats:
      // 1. Direct array: response.data = [...]
      // 2. Wrapped in data: response.data.data = [...]
      // 3. Wrapped in projects: response.data.projects = [...]
      let projectData = [];
      if (Array.isArray(response.data)) {
        projectData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        projectData = response.data.data;
      } else if (response.data?.projects && Array.isArray(response.data.projects)) {
        projectData = response.data.projects;
      }
      
      console.log('Setting projects:', projectData);
      setProjects(projectData);
    } catch (error) {
      console.error('Error loading projects:', error);
      console.error('Error details:', error.response?.data || error.message);
      showError('Failed to load projects: ' + (error.response?.data?.message || error.message));
      setProjects([]); // Ensure it's always an array
    }
  };
  
  const loadTasks = async () => {
    try {
      console.log('Loading tasks...');
      const response = await TaskDataService.getAll();
      console.log('Tasks response:', response);
      
      // Handle multiple response formats:
      // 1. Direct array: response.data = [...]
      // 2. Wrapped in data: response.data.data = [...]
      // 3. Wrapped in tasks: response.data.tasks = [...]
      let taskData = [];
      if (Array.isArray(response.data)) {
        taskData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        taskData = response.data.data;
      } else if (response.data?.tasks && Array.isArray(response.data.tasks)) {
        taskData = response.data.tasks;
      }
      
      console.log('Setting tasks:', taskData);
      setAllTasks(taskData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      console.error('Error details:', error.response?.data || error.message);
      showError('Failed to load tasks: ' + (error.response?.data?.message || error.message));
      setAllTasks([]); // Ensure it's always an array
    }
  };
  
  const loadWeekTimesheet = async () => {
    try {
      setLoading(true);
      const weekStart = currentWeek.format('YYYY-MM-DD');
      const weekEnd = currentWeek.clone().endOf('isoWeek').format('YYYY-MM-DD');
      const weekNumber = currentWeek.isoWeek();
      const year = currentWeek.year();
      
      console.log('Loading timesheet for week:', { 
        weekStart, 
        weekEnd, 
        weekNumber, 
        year,
        currentWeek: currentWeek.format('YYYY-MM-DD')
      });
      
      const response = await timesheetService.getByDateRange(weekStart, weekEnd);
      console.log('Loaded timesheet response:', response);
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        // Filter to ensure we only get timesheets for the selected week AND current user
        const weekTimesheets = response.data.data.filter(ts => {
          const tsWeekStart = dayjs(ts.weekStartDate).format('YYYY-MM-DD');
          const matchesWeek = tsWeekStart === weekStart;
          // user.employee.id is the UUID from employees table, ts.employeeId is also UUID
          const matchesEmployee = ts.employeeId === user?.employee?.id;
          return matchesWeek && matchesEmployee;
        });
        
        console.log('Filtered timesheets for week and employee:', { 
          total: response.data.data.length,
          filtered: weekTimesheets.length,
          weekStart,
          employeeId: user?.employee?.id
        });
        
        if (weekTimesheets.length > 0) {
          // Transform backend data to UI format
          const transformedTasks = weekTimesheets.map(ts => ({
            id: ts.id,
            projectId: ts.projectId || '',
            taskId: ts.taskId || '',
            hours: {
              monday: ts.mondayHours || '',
              tuesday: ts.tuesdayHours || '',
              wednesday: ts.wednesdayHours || '',
              thursday: ts.thursdayHours || '',
              friday: ts.fridayHours || '',
              saturday: ts.saturdayHours || '',
              sunday: ts.sundayHours || ''
            },
            notes: ts.description || ''
          }));
          
          console.log('Transformed tasks:', transformedTasks);
          setTasks(transformedTasks);
          setTimesheetStatus(weekTimesheets[0]?.status?.toLowerCase() || 'draft');
          setIsReadOnly(weekTimesheets[0]?.status?.toLowerCase() !== 'draft');
        } else {
          // No timesheet for this specific week
          console.log('No timesheet for this specific week, starting fresh');
          resetTimesheet();
        }
      } else {
        // No timesheet exists, start fresh
        console.log('No existing timesheet, starting fresh');
        resetTimesheet();
      }
    } catch (error) {
      console.error('Error loading timesheet:', error);
      showError('Failed to load timesheet');
      resetTimesheet();
    } finally {
      setLoading(false);
    }
  };
  
  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      console.log('Loading pending approvals...');
      const response = await timesheetService.getPending();
      console.log('Pending approvals response:', response);
      
      // Handle response format: response.data.data
      let pendingData = [];
      if (Array.isArray(response.data)) {
        pendingData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        pendingData = response.data.data;
      }
      
      console.log('Setting pending timesheets:', pendingData);
      setPendingTimesheets(pendingData);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
      showError('Failed to load pending timesheets');
    } finally {
      setLoading(false);
    }
  };
  
  const loadHistory = async () => {
    try {
      setLoading(true);
      console.log('Loading history...');
      const response = await timesheetService.getAll();
      console.log('History response:', response);
      
      // Handle response format: response.data or response.data.data
      let historyData = [];
      if (Array.isArray(response)) {
        historyData = response;
      } else if (Array.isArray(response.data)) {
        historyData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        historyData = response.data.data;
      }
      
      console.log('Setting history timesheets:', historyData);
      setHistoryTimesheets(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
      showError('Failed to load timesheet history');
    } finally {
      setLoading(false);
    }
  };
  
  const resetTimesheet = () => {
    setTasks([
      {
        id: Date.now(),
        projectId: '',
        taskId: '',
        hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
        notes: ''
      }
    ]);
    setTimesheetStatus('draft');
    setIsReadOnly(false);
  };

  // ========== TIMESHEET OPERATIONS ==========
  
  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        projectId: '',
        taskId: '',
        hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
        notes: ''
      }
    ]);
    setHasUnsavedChanges(true);
  };
  
  const deleteTask = (taskId) => {
    if (tasks.length === 1) {
      showWarning('At least one task entry is required');
      return;
    }
    setTasks(tasks.filter(task => task.id !== taskId));
    setHasUnsavedChanges(true);
  };
  
  const updateTask = (taskId, field, value) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        if (field.startsWith('hours.')) {
          const day = field.split('.')[1];
          return {
            ...task,
            hours: { ...task.hours, [day]: value }
          };
        }
        return { ...task, [field]: value };
      }
      return task;
    }));
    setHasUnsavedChanges(true);
  };
  
  const saveDraft = async () => {
    try {
      setSaving(true);
      
      // Validate
      if (!validateTimesheet()) {
        showError('Please fix validation errors before saving');
        return;
      }
      
      // Transform to backend format
      const timesheetData = tasks.map(task => ({
        projectId: task.projectId,
        taskId: task.taskId,
        weekStartDate: currentWeek.format('YYYY-MM-DD'),
        mondayHours: parseFloat(task.hours.monday) || 0,
        tuesdayHours: parseFloat(task.hours.tuesday) || 0,
        wednesdayHours: parseFloat(task.hours.wednesday) || 0,
        thursdayHours: parseFloat(task.hours.thursday) || 0,
        fridayHours: parseFloat(task.hours.friday) || 0,
        saturdayHours: parseFloat(task.hours.saturday) || 0,
        sundayHours: parseFloat(task.hours.sunday) || 0,
        description: task.notes || '',
        status: 'draft'
      }));
      
      await timesheetService.createBatch(timesheetData);
      
      setHasUnsavedChanges(false);
      setLastSaveTime(new Date());
      showSuccess('Timesheet saved as draft');
    } catch (error) {
      console.error('Error saving timesheet:', error);
      showError('Failed to save timesheet');
    } finally {
      setSaving(false);
    }
  };
  
  const submitTimesheet = async () => {
    try {
      setSubmitting(true);
      
      // Validate
      if (!validateTimesheet()) {
        showError('Please fix validation errors before submitting');
        return;
      }
      
      const weekStart = currentWeek.format('YYYY-MM-DD');
      const weekNumber = currentWeek.isoWeek();
      const year = currentWeek.year();
      
      console.log('Submitting timesheet for week:', { 
        weekStart, 
        weekNumber, 
        year,
        currentWeek: currentWeek.format('YYYY-MM-DD')
      });
      
      // Transform to backend format
      const timesheetData = tasks.map(task => {
        const data = {
          projectId: task.projectId,
          taskId: task.taskId,
          weekStartDate: weekStart,
          mondayHours: parseFloat(task.hours.monday) || 0,
          tuesdayHours: parseFloat(task.hours.tuesday) || 0,
          wednesdayHours: parseFloat(task.hours.wednesday) || 0,
          thursdayHours: parseFloat(task.hours.thursday) || 0,
          fridayHours: parseFloat(task.hours.friday) || 0,
          saturdayHours: parseFloat(task.hours.saturday) || 0,
          sundayHours: parseFloat(task.hours.sunday) || 0,
          description: task.notes || '',
          status: 'Submitted'  // Backend expects capitalized status
        };
        
        // If task has an ID, it's an update
        if (task.id) {
          data.id = task.id;
        }
        
        return data;
      });
      
      console.log('Submitting timesheet data:', timesheetData);
      
      // Helper function to check if ID is a valid UUID (from backend) vs temporary numeric ID (from frontend)
      const isValidUUID = (id) => {
        if (!id) return false;
        // UUIDs are strings with format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return typeof id === 'string' && uuidRegex.test(id);
      };
      
      // Separate new timesheets from existing ones based on UUID validity
      const existingTimesheets = timesheetData.filter(t => isValidUUID(t.id));
      const newTimesheets = timesheetData.filter(t => !isValidUUID(t.id)).map(t => {
        const { id, ...rest } = t; // Remove temporary numeric ID
        return rest;
      });
      
      console.log('Existing timesheets to update:', existingTimesheets.length);
      console.log('New timesheets to create:', newTimesheets.length);
      
      // Process updates and creates
      if (existingTimesheets.length > 0) {
        console.log('Updating existing timesheets:', existingTimesheets);
        await timesheetService.bulkUpdate(existingTimesheets);
      }
      
      if (newTimesheets.length > 0) {
        console.log('Creating new timesheets:', newTimesheets);
        await timesheetService.createBatch(newTimesheets);
      }
      
      setTimesheetStatus('submitted');
      setIsReadOnly(true);
      setHasUnsavedChanges(false);
      showSuccess('Timesheet submitted successfully for approval');
      
      // Reload to get updated data
      loadWeekTimesheet();
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      console.error('Error response:', error.response?.data);
      showError('Failed to submit timesheet: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };
  
  const validateTimesheet = () => {
    const errors = {};
    let isValid = true;
    
    tasks.forEach(task => {
      // Validate project selection
      if (!task.projectId) {
        errors[`${task.id}_project`] = 'Project is required';
        isValid = false;
      }
      
      // Validate task selection
      if (!task.taskId) {
        errors[`${task.id}_task`] = 'Task is required';
        isValid = false;
      }
      
      // Validate at least one day has hours
      const hasHours = Object.values(task.hours).some(h => h && parseFloat(h) > 0);
      if (!hasHours) {
        errors[`${task.id}_hours`] = 'At least one day must have hours';
        isValid = false;
      }
      
      // Validate hour values
      Object.entries(task.hours).forEach(([day, value]) => {
        if (value) {
          const hours = parseFloat(value);
          if (isNaN(hours)) {
            errors[`${task.id}_${day}`] = 'Invalid number';
            isValid = false;
          } else if (hours < 0) {
            errors[`${task.id}_${day}`] = 'Cannot be negative';
            isValid = false;
          } else if (hours > 24) {
            errors[`${task.id}_${day}`] = 'Cannot exceed 24 hours';
            isValid = false;
          }
        }
      });
    });
    
    setFieldErrors(errors);
    return isValid;
  };

  // ========== MANAGER/ADMIN APPROVAL ==========
  
  const handleApprovalClick = (timesheet, action) => {
    setSelectedTimesheet(timesheet);
    setApprovalAction(action);
    setApprovalComments('');
    setApprovalDialog(true);
  };
  
  const processApproval = async () => {
    try {
      if (!selectedTimesheet) return;
      
      await timesheetService.updateStatus(
        selectedTimesheet.id,
        approvalAction === 'approve' ? 'approved' : 'rejected',
        approvalComments
      );
      
      showSuccess(`Timesheet ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      setApprovalDialog(false);
      loadPendingApprovals(); // Reload pending list
    } catch (error) {
      console.error('Error processing approval:', error);
      showError('Failed to process approval');
    }
  };
  
  const handleViewTimesheet = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setViewDialog(true);
  };

  // ========== WEEK NAVIGATION ==========
  
  const goToPreviousWeek = () => {
    setCurrentWeek(currentWeek.subtract(1, 'week'));
  };
  
  const goToNextWeek = () => {
    setCurrentWeek(currentWeek.add(1, 'week'));
  };
  
  const goToCurrentWeek = () => {
    setCurrentWeek(dayjs().startOf('isoWeek'));
  };

  // ========== CALCULATIONS ==========
  
  const calculateDayTotal = (day) => {
    return tasks.reduce((sum, task) => {
      const hours = parseFloat(task.hours[day]) || 0;
      return sum + hours;
    }, 0);
  };
  
  const calculateTaskTotal = (task) => {
    return Object.values(task.hours).reduce((sum, hours) => {
      return sum + (parseFloat(hours) || 0);
    }, 0);
  };
  
  const calculateWeekTotal = () => {
    return tasks.reduce((sum, task) => sum + calculateTaskTotal(task), 0);
  };

  // ========== HELPER FUNCTIONS ==========
  
  const getWeekDates = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map((day, index) => ({
      day,
      label: day.charAt(0).toUpperCase() + day.slice(1),
      date: currentWeek.add(index, 'day'),
      shortLabel: day.substring(0, 3).toUpperCase()
    }));
  };
  
  const getStatusConfig = (status) => {
    const configs = {
      'draft': { color: 'default', label: 'Draft', icon: <SaveIcon fontSize="small" /> },
      'submitted': { color: 'warning', label: 'Pending', icon: <SendIcon fontSize="small" /> },
      'approved': { color: 'success', label: 'Approved', icon: <ApproveIcon fontSize="small" /> },
      'rejected': { color: 'error', label: 'Rejected', icon: <RejectIcon fontSize="small" /> }
    };
    return configs[status?.toLowerCase()] || configs.draft;
  };
  
  const getTasksForProject = (projectId) => {
    if (!projectId || !allTasks) return [];
    return allTasks.filter(task => task.projectId === projectId);
  };

  // ========== RENDER HELPERS ==========
  
  const renderStatusChip = (status) => {
    const config = getStatusConfig(status);
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        sx={{ fontWeight: 600 }}
      />
    );
  };

  // ========== RENDER SECTIONS ==========
  
  // Employee Timesheet Entry Tab
  const renderTimesheetEntry = () => (
    <Box>
      {/* Week Navigation */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={goToPreviousWeek} disabled={loading}>
              <PrevIcon />
            </IconButton>
            <Box sx={{ minWidth: 200, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                Week {currentWeek.isoWeek()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentWeek.format('MMM DD')} - {currentWeek.endOf('isoWeek').format('MMM DD, YYYY')}
              </Typography>
            </Box>
            <IconButton onClick={goToNextWeek} disabled={loading}>
              <NextIcon />
            </IconButton>
            <Button
              size="small"
              startIcon={<TodayIcon />}
              onClick={goToCurrentWeek}
              disabled={loading}
            >
              Today
            </Button>
          </Stack>
          
          <Stack direction="row" spacing={1} alignItems="center">
            {renderStatusChip(timesheetStatus)}
            {lastSaveTime && (
              <Typography variant="caption" color="text.secondary">
                Last saved: {dayjs(lastSaveTime).format('HH:mm')}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Status Alert */}
      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This timesheet has been {timesheetStatus}. To make changes, please contact your manager.
        </Alert>
      )}

      {loading ? (
        <LinearProgress />
      ) : (
        <>
          {/* Timesheet Table */}
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell width="200px" sx={{ fontWeight: 600 }}>Project</TableCell>
                  <TableCell width="200px" sx={{ fontWeight: 600 }}>Task</TableCell>
                  {getWeekDates().map(({ day, shortLabel, date }) => (
                    <TableCell key={day} align="center" width="80px" sx={{ fontWeight: 600 }}>
                      <Box>
                        <div>{shortLabel}</div>
                        <Typography variant="caption" color="text.secondary">
                          {date.format('DD')}
                        </Typography>
                      </Box>
                    </TableCell>
                  ))}
                  <TableCell align="center" width="80px" sx={{ fontWeight: 600 }}>Total</TableCell>
                  <TableCell width="200px" sx={{ fontWeight: 600 }}>Notes</TableCell>
                  <TableCell width="50px"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task, index) => (
                  <TableRow key={task.id} hover>
                    {/* Project Select */}
                    <TableCell>
                      <FormControl fullWidth size="small" error={!!fieldErrors[`${task.id}_project`]}>
                        <Select
                          value={task.projectId}
                          onChange={(e) => updateTask(task.id, 'projectId', e.target.value)}
                          disabled={isReadOnly}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>Select Project</em>
                          </MenuItem>
                          {(projects || []).map((project) => (
                            <MenuItem key={project.id} value={project.id}>
                              {project.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    
                    {/* Task Select */}
                    <TableCell>
                      <FormControl fullWidth size="small" error={!!fieldErrors[`${task.id}_task`]}>
                        <Select
                          value={task.taskId}
                          onChange={(e) => updateTask(task.id, 'taskId', e.target.value)}
                          disabled={isReadOnly || !task.projectId}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>Select Task</em>
                          </MenuItem>
                          {getTasksForProject(task.projectId).map((taskItem) => (
                            <MenuItem key={taskItem.id} value={taskItem.id}>
                              {taskItem.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    
                    {/* Hours for each day */}
                    {getWeekDates().map(({ day }) => (
                      <TableCell key={day} padding="none">
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={task.hours[day]}
                          onChange={(e) => updateTask(task.id, `hours.${day}`, e.target.value)}
                          disabled={isReadOnly}
                          error={!!fieldErrors[`${task.id}_${day}`]}
                          inputProps={{ 
                            min: 0, 
                            max: 24, 
                            step: 0.25,
                            style: { textAlign: 'center', padding: '8px' }
                          }}
                          sx={{ 
                            '& .MuiOutlinedInput-root': { 
                              borderRadius: 0,
                              '& fieldset': { border: 'none' }
                            }
                          }}
                        />
                      </TableCell>
                    ))}
                    
                    {/* Total */}
                    <TableCell align="center">
                      <Typography fontWeight={600} color="primary.main">
                        {calculateTaskTotal(task).toFixed(2)}
                      </Typography>
                    </TableCell>
                    
                    {/* Notes */}
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={task.notes}
                        onChange={(e) => updateTask(task.id, 'notes', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Add notes..."
                      />
                    </TableCell>
                    
                    {/* Delete Button */}
                    <TableCell>
                      {!isReadOnly && tasks.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => deleteTask(task.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Totals Row */}
                <TableRow sx={{ bgcolor: 'primary.50' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 600 }}>
                    Daily Totals
                  </TableCell>
                  {getWeekDates().map(({ day }) => (
                    <TableCell key={day} align="center" sx={{ fontWeight: 600 }}>
                      {calculateDayTotal(day).toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell align="center">
                    <Typography fontWeight={700} color="primary.main" variant="h6">
                      {calculateWeekTotal().toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Add Task Button */}
          {!isReadOnly && (
            <Button
              startIcon={<AddIcon />}
              onClick={addTask}
              sx={{ mt: 2 }}
              variant="outlined"
            >
              Add Task
            </Button>
          )}

          {/* Action Buttons */}
          {!isReadOnly && (
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={saveDraft}
                disabled={saving || submitting || !hasUnsavedChanges}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={submitTimesheet}
                disabled={saving || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </Stack>
          )}
        </>
      )}
    </Box>
  );

  // Pending Approvals Tab (Manager/Admin)
  const renderPendingApprovals = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Pending Timesheets
      </Typography>
      
      {loading ? (
        <LinearProgress />
      ) : pendingTimesheets.length === 0 ? (
        <Alert severity="info">No pending timesheets for approval</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Week</TableCell>
                <TableCell align="right">Total Hours</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingTimesheets.map((timesheet) => (
                <TableRow key={timesheet.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {timesheet.employee?.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {timesheet.employee?.firstName} {timesheet.employee?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {timesheet.employee?.employeeId}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {dayjs(timesheet.weekStartDate).format('MMM DD')} - 
                    {dayjs(timesheet.weekStartDate).endOf('isoWeek').format('MMM DD, YYYY')}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>
                      {((timesheet.mondayHours || 0) + (timesheet.tuesdayHours || 0) + (timesheet.wednesdayHours || 0) + 
                        (timesheet.thursdayHours || 0) + (timesheet.fridayHours || 0) + (timesheet.saturdayHours || 0) + 
                        (timesheet.sundayHours || 0)).toFixed(2)}h
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {dayjs(timesheet.createdAt).format('MMM DD, YYYY')}
                  </TableCell>
                  <TableCell>
                    {renderStatusChip(timesheet.status)}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewTimesheet(timesheet)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Approve">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleApprovalClick(timesheet, 'approve')}
                        >
                          <ApproveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleApprovalClick(timesheet, 'reject')}
                        >
                          <RejectIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  // History Tab - Redirect to dedicated History page
  const renderHistory = () => (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <HistoryIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        View Timesheet History
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Click below to view your complete timesheet history with advanced filters and export options
      </Typography>
      <Button 
        variant="contained" 
        size="large"
        startIcon={<HistoryIcon />}
        onClick={() => navigate('/timesheets/history')}
      >
        Go to History
      </Button>
    </Box>
  );

  // ========== MAIN RENDER ==========
  
  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Weekly Timesheet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your work hours and submit for approval
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => {
            if (activeTab === 0) loadWeekTimesheet();
            else if (activeTab === 1) loadPendingApprovals();
            else loadHistory();
          }}
          variant="outlined"
        >
          Refresh
        </Button>
      </Stack>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => {
            // If History tab is clicked, redirect to history page
            if (newValue === 2) {
              navigate('/timesheets/history');
              return;
            }
            setActiveTab(newValue);
          }}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="My Timesheet" icon={<SaveIcon />} iconPosition="start" />
          {(isManager || isAdmin || isHR) && (
            <Tab label="Pending Approvals" icon={<ApproveIcon />} iconPosition="start" />
          )}
          <Tab label="History" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && renderTimesheetEntry()}
          {activeTab === 1 && (isManager || isAdmin || isHR) && renderPendingApprovals()}
          {activeTab === 2 && renderHistory()}
        </Box>
      </Paper>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {approvalAction === 'approve' ? 'Approve Timesheet' : 'Reject Timesheet'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comments"
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
            placeholder="Add optional comments..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={approvalAction === 'approve' ? 'success' : 'error'}
            onClick={processApproval}
          >
            {approvalAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Timesheet Details
        </DialogTitle>
        <DialogContent>
          {selectedTimesheet && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Employee</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedTimesheet.employee?.firstName} {selectedTimesheet.employee?.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Week</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {dayjs(selectedTimesheet.weekStartDate).format('MMM DD')} - 
                    {dayjs(selectedTimesheet.weekStartDate).endOf('isoWeek').format('MMM DD, YYYY')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  {renderStatusChip(selectedTimesheet.status)}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Hours</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {((selectedTimesheet.mondayHours || 0) + (selectedTimesheet.tuesdayHours || 0) + (selectedTimesheet.wednesdayHours || 0) + 
                      (selectedTimesheet.thursdayHours || 0) + (selectedTimesheet.fridayHours || 0) + (selectedTimesheet.saturdayHours || 0) + 
                      (selectedTimesheet.sundayHours || 0)).toFixed(2)}h
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Daily Breakdown
              </Typography>
              <Grid container spacing={1}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const dayKey = day.toLowerCase() + 'Hours';
                  return (
                    <Grid item xs={12} sm={6} md={3} key={day}>
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">{day}</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {selectedTimesheet[dayKey] || 0}h
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
              
              {selectedTimesheet.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                    Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTimesheet.description}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModernWeeklyTimesheet;
