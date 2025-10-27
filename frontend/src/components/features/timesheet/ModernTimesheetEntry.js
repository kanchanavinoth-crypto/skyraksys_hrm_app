import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
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
  Stack,
  TextField,
  MenuItem,
  Tooltip,
  CircularProgress,
  Fade,
  Divider,
  Alert,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Send as SendIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Today as TodayIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  WatchLater as DraftIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';
import { timesheetService } from '../../../services/timesheet.service';
import { useNotification } from '../../../contexts/NotificationContext';
import ProjectDataService from '../../../services/ProjectService';
import TaskDataService from '../../../services/TaskService';
import logger from '../../../utils/logger';

// Enable dayjs plugins
dayjs.extend(weekday);
dayjs.extend(isoWeek);

const ModernTimesheetEntry = () => {
  logger.debug('🔄 ModernTimesheetEntry component mounted/re-rendered');
  
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  
  // Core State
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('isoWeek'));
  const [tasks, setTasks] = useState([]); // Start with 0 rows - users must click "Add Task"
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [weekStatus, setWeekStatus] = useState('draft');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Days of week
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Calculate total hours
  const getTotalHours = useCallback(() => {
    return tasks.reduce((total, task) => {
      return total + daysOfWeek.reduce((sum, day) => {
        return sum + (parseFloat(task.hours[day]) || 0);
      }, 0);
    }, 0);
  }, [tasks]);

  // Debug: Log projects state changes
  useEffect(() => {
    logger.debug('📊 Projects state updated:', projects, 'Count:', projects?.length || 0);
  }, [projects]);

  // Debug: Log tasks state changes
  useEffect(() => {
    logger.debug('📋 Tasks state updated. Count:', tasks.length, 'Tasks:', tasks);
  }, [tasks]);

  // Load projects and tasks
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          ProjectDataService.getAll(),
          TaskDataService.getAll()
        ]);
        
        // Handle different response formats
        // Backend returns { success: true, data: [...] }
        logger.debug('Raw projects response:', projectsRes.data);
        logger.debug('Raw tasks response:', tasksRes.data);
        
        const projectsData = Array.isArray(projectsRes.data) 
          ? projectsRes.data 
          : (projectsRes.data?.data || projectsRes.data?.projects || []);
        
        const tasksData = Array.isArray(tasksRes.data) 
          ? tasksRes.data 
          : (tasksRes.data?.data || tasksRes.data?.tasks || []);
        
        logger.debug('Processed projects:', projectsData, 'Length:', projectsData.length);
        logger.debug('Processed tasks:', tasksData, 'Length:', tasksData.length);
        
        // Log first task structure to see fields
        if (tasksData.length > 0) {
          logger.debug('📋 Sample task structure:', {
            id: tasksData[0].id,
            name: tasksData[0].name,
            projectId: tasksData[0].projectId,
            project: tasksData[0].project,
            allFields: Object.keys(tasksData[0])
          });
        }
        
        setProjects(projectsData);
        setAllTasks(tasksData);
      } catch (error) {
        logger.error('Failed to load data:', error);
        
        // Provide specific, actionable error message
        let errorMessage = 'Unable to load projects and tasks. ';
        if (error.response?.status === 401) {
          errorMessage += 'Your session may have expired. Please refresh the page and log in again.';
        } else if (error.response?.status === 403) {
          errorMessage += 'You do not have permission to access this resource. Please contact your administrator.';
        } else if (error.response?.status >= 500) {
          errorMessage += 'The server is experiencing issues. Please try again in a few minutes or contact support.';
        } else if (!navigator.onLine) {
          errorMessage += 'You appear to be offline. Please check your internet connection and try again.';
        } else {
          errorMessage += 'Please refresh the page and try again. If the problem persists, contact your administrator.';
        }
        
        showError(errorMessage);
        // Set empty arrays on error to prevent map errors
        setProjects([]);
        setAllTasks([]);
      }
    };
    loadData();
  }, [showError]);

  // Load timesheet for current week
  const loadWeekData = useCallback(async () => {
    setLoading(true);
    try {
      const weekStart = currentWeek.format('YYYY-MM-DD');
      const response = await timesheetService.getByWeek(weekStart);
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const loadedTasks = response.data.data.map((ts, index) => ({
          id: Date.now() + index,
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
          notes: ts.notes || ''
        }));
        setTasks(loadedTasks);
        setWeekStatus(response.data.data[0]?.status || 'draft');
      } else {
        // Check localStorage for draft
        const draftKey = `timesheet_draft_${weekStart}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          setTasks(draft.tasks);
          showInfo('Loaded saved draft');
        } else {
          // Start with empty task list - user must click "Add Task"
          setTasks([]);
        }
        setWeekStatus('draft');
      }
    } catch (error) {
      logger.error('Load error:', error);
      
      // Provide specific error message
      let errorMessage = 'Unable to load timesheet data for this week. ';
      if (error.response?.status === 404) {
        // Not an error - just no data for this week yet
        logger.debug('No timesheet found for this week - this is normal');
      } else if (error.response?.status === 401) {
        errorMessage += 'Your session has expired. Please refresh the page and log in again.';
        showError(errorMessage);
      } else if (!navigator.onLine) {
        errorMessage += 'You are offline. Please check your internet connection.';
        showError(errorMessage);
      } else if (error.response?.status >= 500) {
        errorMessage += 'Server error. Please try again in a few minutes.';
        showError(errorMessage);
      }
      // For other errors, don't show error since we default to draft mode anyway
      
      setWeekStatus('draft');
    } finally {
      setLoading(false);
    }
  }, [currentWeek]); // Removed showInfo from dependencies - it's stable from the hook

  useEffect(() => {
    logger.debug('⚡ loadWeekData effect triggered. Current week:', currentWeek.format('YYYY-MM-DD'));
    loadWeekData();
  }, [loadWeekData]);

  // Auto-save to localStorage
  useEffect(() => {
    if (hasUnsavedChanges && weekStatus === 'draft') {
      const timer = setTimeout(() => {
        const draftKey = `timesheet_draft_${currentWeek.format('YYYY-MM-DD')}`;
        localStorage.setItem(draftKey, JSON.stringify({ tasks, week: currentWeek.format('YYYY-MM-DD') }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [tasks, hasUnsavedChanges, currentWeek, weekStatus]);

  // Handlers
  const handleAddTask = () => {
    logger.debug('➕ Adding new task row. Current tasks count:', tasks.length);
    
    // Check for duplicate project+task combinations before adding
    const newTask = {
      id: Date.now(),
      projectId: '',
      taskId: '',
      hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
      notes: ''
    };
    
    setTasks([...tasks, newTask]);
    setHasUnsavedChanges(true);
    logger.debug('✅ New task added. New tasks count:', tasks.length + 1);
  };

  const handleRemoveTask = (taskId) => {
    logger.debug('🗑️ Removing task:', taskId, 'Current count:', tasks.length);
    setTasks(tasks.filter(t => t.id !== taskId));
    setHasUnsavedChanges(true);
  };

  const handleTaskChange = (taskId, field, value) => {
    logger.debug(`🔄 handleTaskChange: taskId=${taskId}, field=${field}, value=${value}`);
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        logger.debug(`✏️ Updating task ${taskId}: ${field} = ${value}`);
        const updated = { ...t, [field]: value };
        logger.debug(`📝 Updated task object:`, updated);
        return updated;
      }
      return t;
    });
    setTasks(updatedTasks);
    logger.debug(`📊 All tasks after update:`, updatedTasks);
    setHasUnsavedChanges(true);
  };

  // Handle project change with task reset in a SINGLE state update
  const handleProjectChange = (taskId, projectId) => {
    logger.debug(`🔄 handleProjectChange: taskId=${taskId}, projectId=${projectId}`);
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, projectId, taskId: '' };
        logger.debug(`📝 Updated task with project change:`, updated);
        return updated;
      }
      return t;
    });
    setTasks(updatedTasks);
    setHasUnsavedChanges(true);
  };

  // Check for duplicate project+task combination
  const handleTaskIdChange = (taskId, newTaskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if this project+task combination already exists
    const duplicate = tasks.find(t => 
      t.id !== taskId && 
      t.projectId === task.projectId && 
      t.taskId === newTaskId &&
      t.projectId && newTaskId // Only check if both are selected
    );

    if (duplicate) {
      showWarning('You have already added this project and task combination for this week. Consider combining them or selecting a different task.');
    }

    handleTaskChange(taskId, 'taskId', newTaskId);
  };

  const handleHourChange = (taskId, day, value) => {
    if (value && (isNaN(value) || parseFloat(value) < 0 || parseFloat(value) > 24)) return;
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, hours: { ...t.hours, [day]: value } } : t
    ));
    setHasUnsavedChanges(true);
  };

  const handleWeekChange = (direction) => {
    setCurrentWeek(direction === 'next' 
      ? currentWeek.add(1, 'week') 
      : currentWeek.subtract(1, 'week')
    );
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const draftKey = `timesheet_draft_${currentWeek.format('YYYY-MM-DD')}`;
      localStorage.setItem(draftKey, JSON.stringify({ tasks, week: currentWeek.format('YYYY-MM-DD') }));
      showSuccess('Draft saved locally');
      setHasUnsavedChanges(false);
    } catch (error) {
      logger.error('Draft save error:', error);
      showError('Failed to save draft locally. Your browser storage may be full. Try clearing some browser data or use a different browser.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    const validTasks = tasks.filter(t => t.projectId && t.taskId);
    if (validTasks.length === 0) {
      showWarning('Please add at least one task with project and task selected');
      return;
    }

    // Calculate total hours for warnings
    const totalHours = getTotalHours();
    
    // Weekly hour warnings
    if (totalHours > 80) {
      showWarning(`Total hours (${totalHours.toFixed(1)}h) exceeds 80 hours per week. Please verify your entries.`);
    } else if (totalHours > 0 && totalHours < 20) {
      showWarning(`Total hours (${totalHours.toFixed(1)}h) seems low for a full week. Please verify your entries.`);
    }

    setSaving(true);
    try {
      // Prepare timesheet data for bulk save
      const timesheetsToSave = validTasks.map(task => ({
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
        description: task.notes || ''
      }));

      logger.debug('Timesheets to save:', JSON.stringify(timesheetsToSave, null, 2));

      // Step 1: Save timesheets as drafts
      const saveResponse = await timesheetService.bulkSave(timesheetsToSave);
      
      logger.debug('Save response:', saveResponse);
      
      if (!saveResponse.success || !saveResponse.data || !saveResponse.data.processed) {
        throw new Error(saveResponse.message || 'Failed to create timesheets');
      }

      // Step 2: Extract timesheet IDs from the created timesheets
      const timesheetIds = saveResponse.data.processed
        .filter(result => result.status === 'success')
        .map(result => result.timesheetId);
      
      if (timesheetIds.length === 0) {
        throw new Error('No timesheets were created successfully');
      }

      logger.debug('Timesheet IDs to submit:', timesheetIds);

      // Step 3: Submit the timesheets
      const submitResponse = await timesheetService.bulkSubmit(timesheetIds);
      
      if (!submitResponse.success) {
        throw new Error(submitResponse.message || 'Failed to submit timesheets');
      }
      
      // Clear draft
      const draftKey = `timesheet_draft_${currentWeek.format('YYYY-MM-DD')}`;
      localStorage.removeItem(draftKey);
      
      showSuccess('Timesheet submitted successfully!');
      setHasUnsavedChanges(false);
      setWeekStatus('submitted');
      loadWeekData();
    } catch (error) {
      logger.error('Submit error:', error);
      
      // Provide specific, actionable error message
      let errorMessage = '';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid timesheet data. Please check all fields and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please refresh the page and log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to submit timesheets. Please contact your manager.';
      } else if (error.response?.status === 409) {
        errorMessage = 'A timesheet for this week already exists. Please refresh the page and try editing the existing one.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Your timesheet was not submitted. Please try again in a few minutes.';
      } else if (!navigator.onLine) {
        errorMessage = 'You are offline. Please check your internet connection and try again.';
      } else {
        errorMessage = error.message || 'Failed to submit timesheet. Please try again or contact support.';
      }
      
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPreviousWeek = async () => {
    setLoading(true);
    try {
      const prevWeek = currentWeek.subtract(1, 'week').format('YYYY-MM-DD');
      const response = await timesheetService.getByWeek(prevWeek);
      
      if (response.data?.data?.length > 0) {
        const copiedTasks = response.data.data.map((ts, index) => ({
          id: Date.now() + index,
          projectId: ts.projectId,
          taskId: ts.taskId,
          hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
          notes: ''
        }));
        setTasks(copiedTasks);
        setHasUnsavedChanges(true);
        showSuccess('Copied tasks from previous week');
      } else {
        showInfo('No timesheet found for previous week. Start fresh by clicking "Add Task" below.');
      }
    } catch (error) {
      logger.error('Copy previous week error:', error);
      
      let errorMessage = 'Unable to copy previous week. ';
      if (error.response?.status === 401) {
        errorMessage += 'Your session has expired. Please refresh the page.';
      } else if (error.response?.status === 404) {
        errorMessage = 'No timesheet found for previous week. Start fresh by clicking "Add Task" below.';
      } else if (!navigator.onLine) {
        errorMessage += 'You are offline. Please check your internet connection.';
      } else {
        errorMessage += 'Please try again or start fresh.';
      }
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getTasksForProject = (projectId) => {
    logger.debug('🔍 getTasksForProject called with projectId:', projectId);
    logger.debug('🔍 allTasks array:', allTasks);
    
    if (!Array.isArray(allTasks)) {
      logger.warn('❌ allTasks is not an array');
      return [];
    }
    if (!projectId) {
      logger.debug('❌ No projectId provided');
      return [];
    }
    
    const filtered = allTasks.filter(t => {
      logger.debug(`🔍 Checking task "${t.name}": t.projectId=${t.projectId}, looking for=${projectId}, match=${t.projectId === projectId}`);
      return t.projectId === projectId;
    });
    
    logger.debug('✅ Filtered tasks for project:', filtered);
    return filtered;
  };

  const getWeekDates = () => {
    return daysOfWeek.map((day, index) => 
      currentWeek.add(index, 'day').format('DD MMM')
    );
  };

  const isReadOnly = weekStatus === 'submitted' || weekStatus === 'approved';

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 3 }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
          Weekly Timesheet
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          Track your work hours for the week
        </Typography>
      </Paper>

      {/* Week Navigator */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Previous Week">
              <span>
                <IconButton onClick={() => handleWeekChange('prev')} size="small" disabled={loading}>
                  <PrevIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Current Week">
              <span>
                <IconButton onClick={() => setCurrentWeek(dayjs().startOf('isoWeek'))} size="small" disabled={loading}>
                  <TodayIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Next Week">
              <span>
                <IconButton onClick={() => handleWeekChange('next')} size="small" disabled={loading}>
                  <NextIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {currentWeek.format('MMM DD')} - {currentWeek.add(6, 'day').format('MMM DD, YYYY')}
          </Typography>

          <Stack direction="row" spacing={1}>
            <Chip 
              icon={weekStatus === 'submitted' ? <CheckCircleIcon /> : <DraftIcon />}
              label={weekStatus === 'submitted' ? 'Submitted' : 'Draft'}
              color={weekStatus === 'submitted' ? 'success' : 'default'}
              size="small"
            />
            <Chip 
              label={`${getTotalHours().toFixed(1)}h`}
              color="primary"
              size="small"
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Actions */}
      {!isReadOnly && (
        <Collapse in={true}>
          <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                startIcon={<CopyIcon />}
                onClick={handleCopyPreviousWeek}
                size="small"
                variant="outlined"
                disabled={loading}
              >
                Copy Previous Week
              </Button>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddTask}
                size="small"
                variant="outlined"
              >
                Add Task
              </Button>
            </Stack>
          </Paper>
        </Collapse>
      )}

      {/* Table */}
      {loading ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading...</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Task</TableCell>
                {daysOfWeek.map((day, index) => (
                  <TableCell key={day} align="center" sx={{ fontWeight: 600, minWidth: 80 }}>
                    <Box>
                      <Typography variant="caption" sx={{ textTransform: 'uppercase', display: 'block' }}>
                        {day.slice(0, 3)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getWeekDates()[index]}
                      </Typography>
                    </Box>
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                {!isReadOnly && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" color="text.secondary">
                        No tasks added yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click the "Add Task" button below to start adding your timesheet entries
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddTask}
                        disabled={isReadOnly}
                      >
                        Add Your First Task
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task, taskIndex) => (
                <TableRow key={task.id} hover>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={task.projectId}
                      onChange={(e) => handleProjectChange(task.id, e.target.value)}
                      disabled={isReadOnly}
                      variant="outlined"
                    >
                      <MenuItem value="">Select Project</MenuItem>
                      {Array.isArray(projects) && projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={task.taskId}
                      onChange={(e) => handleTaskIdChange(task.id, e.target.value)}
                      disabled={isReadOnly || !task.projectId}
                      variant="outlined"
                    >
                      <MenuItem value="">Select Task</MenuItem>
                      {Array.isArray(getTasksForProject(task.projectId)) && 
                        getTasksForProject(task.projectId).map((taskOption) => (
                          <MenuItem key={taskOption.id} value={taskOption.id}>
                            {taskOption.name}
                          </MenuItem>
                        ))
                      }
                    </TextField>
                  </TableCell>
                  {daysOfWeek.map((day) => (
                    <TableCell key={day} align="center">
                      <TextField
                        size="small"
                        type="number"
                        value={task.hours[day]}
                        onChange={(e) => handleHourChange(task.id, day, e.target.value)}
                        disabled={isReadOnly}
                        inputProps={{ min: 0, max: 24, step: 0.5, style: { textAlign: 'center' } }}
                        sx={{ width: 70 }}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      maxRows={2}
                      value={task.notes}
                      onChange={(e) => handleTaskChange(task.id, 'notes', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Add notes..."
                    />
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <Tooltip title="Remove">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveTask(task.id)}
                            disabled={tasks.length === 1}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Footer Actions */}
      {!isReadOnly && (
        <Fade in={true}>
          <Paper elevation={0} sx={{ p: 2, mt: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" flexWrap="wrap">
              <Box>
                {hasUnsavedChanges && (
                  <Chip
                    icon={<InfoIcon />}
                    label="You have unsaved changes"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveDraft}
                  disabled={saving || !hasUnsavedChanges}
                >
                  Save Draft
                </Button>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} /> : <SendIcon />}
                  onClick={handleSubmit}
                  disabled={saving || getTotalHours() === 0}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #633a8a 100%)',
                    }
                  }}
                >
                  {saving ? 'Submitting...' : 'Submit Timesheet'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Fade>
      )}

      {/* Read-only info */}
      {isReadOnly && (
        <Alert severity="info" sx={{ mt: 3 }}>
          This timesheet has been submitted and is now read-only. Contact your manager if changes are needed.
        </Alert>
      )}
    </Box>
  );
};

export default ModernTimesheetEntry;
