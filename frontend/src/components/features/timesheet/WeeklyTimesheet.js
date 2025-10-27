import React, { useState, useEffect, useCallback } from 'react';
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
  Fab,
  Stack,
  useTheme,
  useMediaQuery,
  MenuItem,
  FormControl,
  Select,
  LinearProgress,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  CheckCircle as CheckIcon,
  Timeline as TimelineIcon,
  Speed as QuickIcon,
  Refresh as RefreshIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Today as TodayIcon,
  Assignment as AssignmentIcon,
  CopyAll as CopyAllIcon,
  Keyboard as KeyboardIcon
} from '@mui/icons-material';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';
import TimesheetDataService from '../../../services/TimesheetService';
import { timesheetService } from '../../../services/timesheet.service';
import { useNotification } from '../../../contexts/NotificationContext';
import ProjectDataService from '../../../services/ProjectService';
import TaskDataService from '../../../services/TaskService';

// Enable dayjs plugins
dayjs.extend(weekday);
dayjs.extend(isoWeek);

const WeeklyTimesheet = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  
  // State management
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('isoWeek'));
  const [tasks, setTasks] = useState([
    {
      id: 1,
      projectId: '',
      taskId: '',
      hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
      notes: ''
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState({ current: 0, total: 0, mode: '' });
  const [successOpen, setSuccessOpen] = useState(false);
  const [totalHours, setTotalHours] = useState(0);
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  
  // Real-time validation state
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [lastSaveTime, setLastSaveTime] = useState(null);
  
  // Error handling and recovery state
  const [submissionErrors, setSubmissionErrors] = useState([]);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState(null);
  
  // Productivity features state
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(true);
  const [focusedCell, setFocusedCell] = useState({ taskId: null, day: null });
  
  // Timesheet status tracking
  const [weeklyTimesheetStatus, setWeeklyTimesheetStatus] = useState('draft'); // 'draft', 'submitted', 'approved', 'rejected'
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [submittedTimesheets, setSubmittedTimesheets] = useState([]);

  // Validation functions
  const validateHourField = (value) => {
    if (value === '' || value === null || value === undefined) {
      return null; // Empty is allowed
    }
    
    const hours = parseFloat(value);
    if (isNaN(hours)) {
      return 'Please enter a valid number';
    }
    if (hours < 0) {
      return 'Hours cannot be negative';
    }
    if (hours > 24) {
      return 'Cannot exceed 24 hours per day';
    }
    if (hours > 0 && hours < 0.25) {
      return 'Minimum entry is 0.25 hours (15 minutes)';
    }
    // Check for quarter-hour increments
    if ((hours * 4) % 1 !== 0) {
      return 'Please use quarter-hour increments (0.25, 0.5, 0.75, etc.)';
    }
    return null;
  };

  const validateTaskSelection = (taskId, projectId) => {
    if (!projectId) {
      return 'Please select a project first';
    }
    if (!taskId) {
      return 'Please select a task';
    }
    return null;
  };

  const validateProjectSelection = (projectId) => {
    if (!projectId) {
      return 'Please select a project';
    }
    return null;
  };

  // Set field error
  const setFieldError = (taskId, field, error) => {
    setFieldErrors(prev => ({
      ...prev,
      [`${taskId}_${field}`]: error
    }));
  };

  // Clear field error
  const clearFieldError = (taskId, field) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${taskId}_${field}`];
      return newErrors;
    });
  };

  // Get field error
  const getFieldError = (taskId, field) => {
    return fieldErrors[`${taskId}_${field}`] || null;
  };

  // Auto-save functionality
  const saveAsDraft = useCallback(async () => {
    if (!hasUnsavedChanges) return;
    
    try {
      setAutoSaveStatus('saving');
      
      // Create draft data
      const draftData = {
        week: currentWeek.format('YYYY-MM-DD'),
        tasks: tasks.filter(task => 
          task.projectId && task.taskId && 
          Object.values(task.hours).some(h => parseFloat(h) > 0)
        )
      };
      
      // Save to localStorage as backup
      localStorage.setItem(`timesheet_draft_${currentWeek.format('YYYY-MM-DD')}`, JSON.stringify(draftData));
      
      // Try to save to server (optional)
      try {
        const bulkTimesheetData = createBulkTimesheetData();
        if (bulkTimesheetData.length > 0) {
          await timesheetService.bulkSave(bulkTimesheetData.map(data => ({
            ...data,
            status: 'draft'
          })));
        }
      } catch (serverError) {
        console.log('Server auto-save failed, keeping local backup:', serverError);
      }
      
      setAutoSaveStatus('saved');
      setLastSaveTime(new Date());
      setHasUnsavedChanges(false);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
    }
  }, [hasUnsavedChanges, currentWeek, tasks]);

  // Load draft from localStorage
  const loadDraft = useCallback(async () => {
    try {
      // First, try to load submitted timesheets from server
      try {
        const weekStart = currentWeek.format('YYYY-MM-DD');
        console.log('🔍 Loading timesheets for week starting:', weekStart);
        console.log('📅 Current week object:', currentWeek);
        console.log('📅 Week details:', {
          weekStart: weekStart,
          weekEnd: currentWeek.add(6, 'day').format('YYYY-MM-DD'),
          weekNumber: currentWeek.isoWeek(),
          year: currentWeek.year()
        });
        
        const response = await timesheetService.getByWeek(weekStart);
        console.log('📊 Server response:', response);
        console.log('📊 Response data structure:', response.data);
        console.log('📊 Response data type:', typeof response.data);
        console.log('📊 Response data keys:', Object.keys(response.data || {}));
        console.log('📊 Timesheet data array:', response.data.data);
        
        if (response.data && response.data.data && response.data.data.length > 0) {
          console.log('✅ Found server data:', response.data.data);
          
          // Detailed validation of each timesheet
          console.log('🔍 VALIDATING TIMESHEET DATA:');
          response.data.data.forEach((timesheet, index) => {
            const weekCheck = timesheet.weekStartDate === weekStart;
            console.log(`🔍 Timesheet ${index + 1} validation:`, {
              weekStartMatches: weekCheck,
              expected: weekStart,
              actual: timesheet.weekStartDate,
              status: timesheet.status,
              hasHours: !!(timesheet.mondayHours || timesheet.tuesdayHours || timesheet.wednesdayHours || timesheet.thursdayHours || timesheet.fridayHours || timesheet.saturdayHours || timesheet.sundayHours),
              totalHours: timesheet.totalHoursWorked
            });
          });
          
          // Convert server data to our tasks format
          const serverTasks = response.data.data.map(timesheet => ({
            id: timesheet.id,
            projectId: timesheet.projectId,
            taskId: timesheet.taskId,
            hours: {
              monday: timesheet.mondayHours?.toString() || '',
              tuesday: timesheet.tuesdayHours?.toString() || '',
              wednesday: timesheet.wednesdayHours?.toString() || '',
              thursday: timesheet.thursdayHours?.toString() || '',
              friday: timesheet.fridayHours?.toString() || '',
              saturday: timesheet.saturdayHours?.toString() || '',
              sunday: timesheet.sundayHours?.toString() || ''
            },
            notes: timesheet.description || ''
          }));
          
          console.log('🔄 Converted tasks:', serverTasks);
          setTasks(serverTasks);
          setSubmittedTimesheets(response.data.data);
          
          // Determine overall status
          const statuses = response.data.data.map(ts => ts.status);
          const hasSubmitted = statuses.some(status => ['Submitted', 'Approved'].includes(status));
          const hasRejected = statuses.some(status => status === 'Rejected');
          
          console.log('📈 Status analysis:', { statuses, hasSubmitted, hasRejected });
          
          if (hasSubmitted) {
            setWeeklyTimesheetStatus('submitted');
            setIsReadOnlyMode(true);
            showInfo(`Timesheet for this week has been submitted and is read-only`);
          } else if (hasRejected) {
            setWeeklyTimesheetStatus('rejected');
            setIsReadOnlyMode(false);
            showWarning(`Some timesheets were rejected. You can make changes and resubmit.`);
          } else {
            setWeeklyTimesheetStatus('draft');
            setIsReadOnlyMode(false);
          }
          
          setHasUnsavedChanges(false);
          return; // Don't load local draft if we have server data
        } else {
          console.log('❌ No server data found in response');
        }
      } catch (serverError) {
        console.log('🚫 Server error, trying local draft:', serverError);
      }
      
      // Reset status if no server data
      setWeeklyTimesheetStatus('draft');
      setIsReadOnlyMode(false);
      setSubmittedTimesheets([]);
      
      // If no server data, try to load from localStorage
      const draftKey = `timesheet_draft_${currentWeek.format('YYYY-MM-DD')}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        if (draftData.tasks && draftData.tasks.length > 0) {
          setTasks(draftData.tasks);
          showInfo(`Restored draft from ${new Date(draftData.week).toLocaleDateString()}`);
          setHasUnsavedChanges(true);
        }
      } else {
        // Reset to default empty task if no data found
        setTasks([{
          id: 1,
          projectId: '',
          taskId: '',
          hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
          notes: ''
        }]);
      }
    } catch (error) {
      console.error('Failed to load timesheet data:', error);
      setWeeklyTimesheetStatus('draft');
      setIsReadOnlyMode(false);
      setSubmittedTimesheets([]);
    }
  }, [currentWeek, showInfo, showWarning]);

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const autoSaveTimer = setTimeout(() => {
      saveAsDraft();
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, saveAsDraft]);

  // Load draft when week changes
  useEffect(() => {
    loadDraft();
  }, [currentWeek, loadDraft]);

  // Enhanced error handling functions
  const addSubmissionError = (error, context = '') => {
    const errorEntry = {
      id: Date.now(),
      message: error.message || error,
      context,
      timestamp: new Date(),
      recoverable: true,
      retryAction: () => retrySubmission()
    };
    
    setSubmissionErrors(prev => [...prev, errorEntry]);
    setLastErrorTime(new Date());
    
    // Enhanced error messages based on error type
    if (error.message?.includes('validation')) {
      showError(`Validation Error: Please check the highlighted fields and fix any issues before submitting.`);
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      showError(`Network Error: Please check your connection and try again. Your work has been saved locally.`);
    } else if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
      showError(`Session Expired: Please refresh the page and log in again. Your work has been saved locally.`);
    } else if (error.message?.includes('project') || error.message?.includes('task')) {
      showError(`Data Error: Some projects or tasks may no longer be available. Please review your selections.`);
    } else {
      showError(`Submission Error: ${error.message || 'An unexpected error occurred. Your work has been saved locally.'}`);
    }
  };

  const removeSubmissionError = (errorId) => {
    setSubmissionErrors(prev => prev.filter(error => error.id !== errorId));
  };

  const retrySubmission = async () => {
    if (retryAttempts >= 3) {
      showError('Maximum retry attempts reached. Please refresh the page or contact support.');
      return;
    }
    
    setRetryAttempts(prev => prev + 1);
    showInfo(`Retrying submission (attempt ${retryAttempts + 1}/3)...`);
    
    try {
      await handleSubmit();
      setSubmissionErrors([]);
      setRetryAttempts(0);
      showSuccess('Retry successful!');
    } catch (error) {
      addSubmissionError(error, 'retry attempt');
    }
  };

  const clearAllErrors = () => {
    setSubmissionErrors([]);
    setFieldErrors({});
    setRetryAttempts(0);
  };

  // Productivity features
  const copyFromLastWeek = async () => {
    try {
      const lastWeek = currentWeek.subtract(1, 'week');
      const lastWeekKey = `timesheet_draft_${lastWeek.format('YYYY-MM-DD')}`;
      
      // Try to get from localStorage first
      let lastWeekData = null;
      try {
        const saved = localStorage.getItem(lastWeekKey);
        if (saved) {
          lastWeekData = JSON.parse(saved);
        }
      } catch (e) {
        console.log('No local draft found for last week');
      }
      
      // If no local draft, try to fetch from server
      if (!lastWeekData) {
        try {
          const response = await timesheetService.getByWeek(lastWeek.format('YYYY-MM-DD'));
          if (response.data && response.data.length > 0) {
            lastWeekData = {
              tasks: response.data.map(ts => ({
                id: Date.now() + Math.random(), // New ID for this week
                projectId: ts.projectId,
                taskId: ts.taskId,
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
              }))
            };
          }
        } catch (serverError) {
          console.log('Could not fetch last week data from server:', serverError);
        }
      }
      
      if (lastWeekData && lastWeekData.tasks && lastWeekData.tasks.length > 0) {
        setTasks(lastWeekData.tasks);
        setHasUnsavedChanges(true);
        showSuccess(`Copied ${lastWeekData.tasks.length} task${lastWeekData.tasks.length > 1 ? 's' : ''} from last week!`);
      } else {
        showWarning('No timesheet data found for last week to copy.');
      }
    } catch (error) {
      console.error('Error copying from last week:', error);
      showError('Failed to copy data from last week. Please try again.');
    }
  };

  // Keyboard navigation
  const handleKeyNavigation = useCallback((e, taskId, day) => {
    if (!keyboardShortcutsEnabled) return;
    
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const currentDayIndex = dayKeys.indexOf(day);
    const currentTaskIndex = tasks.findIndex(t => t.id === taskId);
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        // Move to next day or next task first day
        if (currentDayIndex < dayKeys.length - 1) {
          const nextDay = dayKeys[currentDayIndex + 1];
          const nextInput = document.querySelector(`input[data-task="${taskId}"][data-day="${nextDay}"]`);
          if (nextInput) {
            nextInput.focus();
            setFocusedCell({ taskId, day: nextDay });
          }
        } else if (currentTaskIndex < tasks.length - 1) {
          const nextTask = tasks[currentTaskIndex + 1];
          const nextInput = document.querySelector(`input[data-task="${nextTask.id}"][data-day="monday"]`);
          if (nextInput) {
            nextInput.focus();
            setFocusedCell({ taskId: nextTask.id, day: 'monday' });
          }
        }
        break;
        
      case 'Tab':
        // Let default tab behavior work, but track focus
        setTimeout(() => {
          const activeElement = document.activeElement;
          const taskIdAttr = activeElement?.getAttribute('data-task');
          const dayAttr = activeElement?.getAttribute('data-day');
          if (taskIdAttr && dayAttr) {
            setFocusedCell({ taskId: parseInt(taskIdAttr), day: dayAttr });
          }
        }, 0);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (currentTaskIndex > 0) {
          const prevTask = tasks[currentTaskIndex - 1];
          const prevInput = document.querySelector(`input[data-task="${prevTask.id}"][data-day="${day}"]`);
          if (prevInput) {
            prevInput.focus();
            setFocusedCell({ taskId: prevTask.id, day });
          }
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (currentTaskIndex < tasks.length - 1) {
          const nextTask = tasks[currentTaskIndex + 1];
          const nextInput = document.querySelector(`input[data-task="${nextTask.id}"][data-day="${day}"]`);
          if (nextInput) {
            nextInput.focus();
            setFocusedCell({ taskId: nextTask.id, day });
          }
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        if (currentDayIndex > 0) {
          const prevDay = dayKeys[currentDayIndex - 1];
          const prevInput = document.querySelector(`input[data-task="${taskId}"][data-day="${prevDay}"]`);
          if (prevInput) {
            prevInput.focus();
            setFocusedCell({ taskId, day: prevDay });
          }
        }
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        if (currentDayIndex < dayKeys.length - 1) {
          const nextDay = dayKeys[currentDayIndex + 1];
          const nextInput = document.querySelector(`input[data-task="${taskId}"][data-day="${nextDay}"]`);
          if (nextInput) {
            nextInput.focus();
            setFocusedCell({ taskId, day: nextDay });
          }
        }
        break;
    }
  }, [keyboardShortcutsEnabled, tasks]);

  // Fill entire row with same value
  const fillRowWithValue = (taskId, value) => {
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    dayKeys.forEach(day => {
      updateHours(taskId, day, value.toString());
    });
    showInfo(`Filled entire row with ${value} hours`);
  };

  // Get week dates
  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(currentWeek.add(i, 'day'));
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Load projects and tasks on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [projectsResponse, tasksResponse] = await Promise.all([
          ProjectDataService.getAll(),
          TaskDataService.getAll()
        ]);
        
        console.log('Projects response:', projectsResponse);
        console.log('Tasks response:', tasksResponse);
        
        // Handle different response structures
        let projectsData = [];
        let tasksData = [];
        
        if (projectsResponse.data) {
          if (projectsResponse.data.success && projectsResponse.data.data) {
            projectsData = projectsResponse.data.data;
          } else if (Array.isArray(projectsResponse.data)) {
            projectsData = projectsResponse.data;
          }
        }
        
        if (tasksResponse.data) {
          if (tasksResponse.data.success && tasksResponse.data.data) {
            tasksData = tasksResponse.data.data;
          } else if (Array.isArray(tasksResponse.data)) {
            tasksData = tasksResponse.data;
          }
        }
        
        setProjects(projectsData);
        setAllTasks(tasksData);
        
        console.log('Projects loaded:', projectsData);
        console.log('Tasks loaded:', tasksData);
        console.log('Project count:', projectsData.length);
        console.log('Task count:', tasksData.length);
      } catch (error) {
        console.error('Error loading projects and tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate total hours
  useEffect(() => {
    const total = tasks.reduce((sum, task) => {
      return sum + Object.values(task.hours).reduce((taskSum, hours) => {
        return taskSum + (parseFloat(hours) || 0);
      }, 0);
    }, 0);
    setTotalHours(total);
  }, [tasks]);

  // Add new task row
  const addTask = () => {
    const newTask = {
      id: Date.now(),
      projectId: '',
      taskId: '',
      hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
      notes: ''
    };
    setTasks([...tasks, newTask]);
  };

  // Remove task row
  const removeTask = (id) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  // Update task field
  const updateTask = useCallback((id, field, value) => {
    console.log('updateTask called:', { id, field, value });
    
    // Validate fields based on type
    if (field === 'projectId') {
      const error = validateProjectSelection(value);
      if (error) {
        setFieldError(id, 'projectId', error);
      } else {
        clearFieldError(id, 'projectId');
        // Also clear task error when project is selected
        clearFieldError(id, 'taskId');
      }
    } else if (field === 'taskId') {
      const task = tasks.find(t => t.id === id);
      const error = validateTaskSelection(value, task?.projectId);
      if (error) {
        setFieldError(id, 'taskId', error);
      } else {
        clearFieldError(id, 'taskId');
      }
    }
    
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === id) {
          const updatedTask = { ...task, [field]: value };
          console.log('Task updated:', { 
            oldTask: task, 
            newTask: updatedTask 
          });
          return updatedTask;
        }
        return task;
      });
      
      console.log('Updated tasks array:', updatedTasks);
      setHasUnsavedChanges(true); // Mark as having unsaved changes
      return updatedTasks;
    });
  }, [tasks]);

  // Update hours for specific day
  const updateHours = useCallback((taskId, day, hours) => {
    // Validate the hours input
    const error = validateHourField(hours);
    if (error) {
      setFieldError(taskId, `hours_${day}`, error);
    } else {
      clearFieldError(taskId, `hours_${day}`);
    }
    
    // Update the hours value
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, hours: { ...task.hours, [day]: hours } }
          : task
      )
    );
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
  }, []);

  // Navigate weeks
  const goToPreviousWeek = () => {
    setCurrentWeek(currentWeek.subtract(1, 'week'));
  };

  const goToNextWeek = () => {
    setCurrentWeek(currentWeek.add(1, 'week'));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(dayjs().startOf('isoWeek'));
  };

  // Quick fill templates
  const fillTemplate = (template) => {
    let templateHours;
    switch (template) {
      case 'fullWeek':
        templateHours = { monday: '8', tuesday: '8', wednesday: '8', thursday: '8', friday: '8', saturday: '', sunday: '' };
        break;
      case 'halfWeek':
        templateHours = { monday: '4', tuesday: '4', wednesday: '4', thursday: '4', friday: '4', saturday: '', sunday: '' };
        break;
      case 'threeDay':
        templateHours = { monday: '8', tuesday: '8', wednesday: '8', thursday: '', friday: '', saturday: '', sunday: '' };
        break;
      default:
        return;
    }
    
    if (tasks.length > 0) {
      updateTask(tasks[0].id, 'hours', templateHours);
    }
  };

  // Helper function to create bulk timesheet data
  const createBulkTimesheetData = () => {
    const validTasks = tasks.filter(task => 
      task.projectId && task.taskId && 
      Object.values(task.hours).some(h => parseFloat(h) > 0)
    );

    return validTasks.map(task => {
      const totalHours = Object.values(task.hours).reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
      
      if (totalHours > 0) {
        return {
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
        };
      }
      return null;
    }).filter(Boolean);
  };

  // Submit timesheet
  const handleSubmit = async () => {
    setSaving(true);
    setSavingProgress({ current: 0, total: 0, mode: 'Preparing to submit...' });
    
    try {
      // Validate all fields before submission
      let hasValidationErrors = false;
      const validationErrors = [];
      
      // Check each task for errors
      tasks.forEach(task => {
        // Validate project selection
        if (!task.projectId) {
          setFieldError(task.id, 'projectId', 'Please select a project');
          hasValidationErrors = true;
          validationErrors.push('Missing project selection');
        }
        
        // Validate task selection
        if (!task.taskId) {
          setFieldError(task.id, 'taskId', 'Please select a task');
          hasValidationErrors = true;
          validationErrors.push('Missing task selection');
        }
        
        // Validate hours
        Object.keys(task.hours).forEach(day => {
          const hours = task.hours[day];
          if (hours && hours !== '') {
            const error = validateHourField(hours);
            if (error) {
              setFieldError(task.id, `hours_${day}`, error);
              hasValidationErrors = true;
              validationErrors.push(`Invalid hours for ${day}: ${error}`);
            }
          }
        });
      });
      
      // Check if there are any existing validation errors
      const existingErrors = Object.keys(fieldErrors);
      if (existingErrors.length > 0) {
        hasValidationErrors = true;
        validationErrors.push('Please fix the highlighted errors before submitting');
      }
      
      if (hasValidationErrors) {
        showError(`Please fix validation errors: ${validationErrors.slice(0, 3).join(', ')}${validationErrors.length > 3 ? '...' : ''}`);
        setSaving(false);
        setSavingProgress({ current: 0, total: 0, mode: '' });
        return;
      }
      
      // Validate that at least one hour is entered
      const hasHours = tasks.some(task => 
        Object.values(task.hours).some(hour => parseFloat(hour) > 0)
      );

      if (!hasHours) {
        showError('Please enter at least one hour before submitting.');
        setSaving(false);
        setSavingProgress({ current: 0, total: 0, mode: '' });
        return;
      }

      // Create bulk timesheet data
      const bulkTimesheetData = createBulkTimesheetData();
      
      if (bulkTimesheetData.length === 0) {
        showError('Please enter at least one hour before submitting.');
        setSaving(false);
        setSavingProgress({ current: 0, total: 0, mode: '' });
        return;
      }

      setSavingProgress({ 
        current: 0, 
        total: bulkTimesheetData.length, 
        mode: bulkTimesheetData.length > 1 ? 'bulk' : 'individual' 
      });

      console.log(`🚀 Bulk saving ${bulkTimesheetData.length} timesheets for submission`);

      try {
        // First, try to save via bulk operations
        const saveResponse = await timesheetService.bulkSave(bulkTimesheetData);
        
        if (saveResponse.success && saveResponse.data?.processed) {
          const createdTimesheetIds = saveResponse.data.processed.map(item => item.timesheetId);
          console.log(`✅ Successfully saved ${createdTimesheetIds.length} timesheets via bulk operation`);
          
          setSavingProgress({ 
            current: createdTimesheetIds.length, 
            total: bulkTimesheetData.length, 
            mode: 'submitting' 
          });
          
          if (createdTimesheetIds.length > 1) {
            showInfo(`Used bulk operations to save ${createdTimesheetIds.length} timesheets efficiently!`);
          }

          // Now submit the created timesheets
          const submitResponse = await timesheetService.bulkSubmit(createdTimesheetIds);
          
          if (submitResponse.success) {
            showSuccess(`Successfully submitted ${createdTimesheetIds.length} timesheet${createdTimesheetIds.length > 1 ? 's' : ''} for approval!`);
            setSuccessOpen(true);
            
            // Reset form after successful submission
            setTasks([{
              id: 1,
              projectId: '',
              taskId: '',
              hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
              notes: ''
            }]);
            setTotalHours(0);
          } else {
            throw new Error('Failed to submit timesheets: ' + submitResponse.message);
          }
        } else {
          throw new Error('Bulk save failed: ' + (saveResponse.message || 'Unknown error'));
        }
      } catch (bulkError) {
        console.error('❌ Error in bulk operations:', bulkError);
        showWarning('Bulk operation failed, using individual weekly submissions as backup...');
        
        // Fallback to individual weekly timesheet submissions using the correct format
        setSavingProgress({ current: 0, total: bulkTimesheetData.length, mode: 'individual' });
        
        // Submit each weekly timesheet individually with proper error handling
        const results = [];
        const errors = [];
        
        for (let i = 0; i < bulkTimesheetData.length; i++) {
          const timesheetData = bulkTimesheetData[i];
          setSavingProgress({ current: i + 1, total: bulkTimesheetData.length, mode: 'individual' });
          console.log(`📤 Submitting individual weekly timesheet ${i + 1}/${bulkTimesheetData.length}:`, timesheetData);
          
          try {
            const result = await TimesheetDataService.create(timesheetData);
            results.push(result);
          } catch (individualError) {
            console.error(`❌ Failed to submit timesheet ${i + 1}:`, individualError);
            errors.push({
              index: i + 1,
              data: timesheetData,
              error: individualError
            });
          }
        }
        
        // Handle results
        if (errors.length === 0) {
          // All succeeded
          showSuccess(`Successfully submitted ${results.length} weekly timesheet${results.length > 1 ? 's' : ''} using individual submissions!`);
          setSuccessOpen(true);
          
          // Reset form after successful submission
          setTasks([{
            id: 1,
            projectId: '',
            taskId: '',
            hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
            notes: ''
          }]);
          setTotalHours(0);
        } else if (results.length > 0) {
          // Partial success
          showWarning(`Submitted ${results.length} timesheet${results.length > 1 ? 's' : ''} successfully, but ${errors.length} failed. Check the errors above.`);
          
          // Log detailed error information
          errors.forEach(err => {
            console.error(`Error for timesheet ${err.index}:`, err.error.message);
            addSubmissionError(err.error, `timesheet ${err.index} submission`);
          });
        } else {
          // All failed
          throw new Error(`All ${errors.length} timesheet submissions failed. ${errors[0]?.error?.message || 'Unknown error'}`);
        }
      }
      
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      
      // Only show one consolidated error message instead of multiple
      const errorMessage = error.message || 'Unknown error occurred';
      
      // Specific error recovery suggestions
      if (errorMessage.includes('validation')) {
        showError('Validation failed: Please fix the highlighted errors before resubmitting.');
      } else if (errorMessage.includes('network')) {
        showError('Network issue: Please check your connection and try again.');
      } else if (errorMessage.includes('already exists')) {
        showError('Timesheet already exists: Please update the existing timesheet instead of creating a new one.');
      } else if (errorMessage.includes('failed')) {
        showError(`Submission failed: ${errorMessage}`);
      } else {
        showError('Submission failed: Please try again or contact support.');
      }
      
      // Add to error log for debugging (but don't show multiple notifications)
      addSubmissionError(error, 'timesheet submission');
    } finally {
      setSaving(false);
      setSavingProgress({ current: 0, total: 0, mode: '' });
    }
  };

  // Get day total hours
  const getDayTotal = (dayKey) => {
    return tasks.reduce((sum, task) => {
      return sum + (parseFloat(task.hours[dayKey]) || 0);
    }, 0);
  };

  // Get tasks filtered by project
  const getTasksByProject = (projectId) => {
    if (!projectId) {
      console.log('getTasksByProject: No projectId provided');
      return [];
    }
    
    console.log('getTasksByProject called with:', { projectId, projectIdType: typeof projectId });
    
    const filteredTasks = allTasks.filter(task => {
      return task.projectId === projectId;
    });
    
    console.log(`Found ${filteredTasks.length} tasks for project ${projectId}:`, filteredTasks.map(t => ({ id: t.id, name: t.name })));
    return filteredTasks;
  };

  return (
    // <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3, maxWidth: '100%', mx: 'auto' }}>
        {/* Header */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <TimelineIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Weekly Timesheet
                </Typography>
                <Typography variant="h6" sx={{ 
                  opacity: 0.95, 
                  fontWeight: 'bold',
                  padding: '4px 12px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  📅 {currentWeek.format('MMM D')} - {currentWeek.add(6, 'day').format('MMM D, YYYY')}
                  <Typography component="span" sx={{ ml: 1, fontSize: '0.8em', opacity: 0.8 }}>
                    (Week {currentWeek.isoWeek()}, {currentWeek.year()})
                  </Typography>
                </Typography>
                {/* Auto-save Status Indicator */}
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {autoSaveStatus === 'saving' && (
                    <Chip
                      label="Saving..."
                      size="small"
                      color="warning"
                      sx={{ 
                        backgroundColor: 'rgba(255,193,7,0.2)', 
                        color: 'white',
                        '& .MuiChip-label': { fontSize: '0.7rem' }
                      }}
                    />
                  )}
                  {autoSaveStatus === 'saved' && lastSaveTime && (
                    <Chip
                      label={`Saved ${lastSaveTime.toLocaleTimeString()}`}
                      size="small"
                      color="success"
                      sx={{ 
                        backgroundColor: 'rgba(76,175,80,0.2)', 
                        color: 'white',
                        '& .MuiChip-label': { fontSize: '0.7rem' }
                      }}
                    />
                  )}
                  {autoSaveStatus === 'error' && (
                    <Chip
                      label="Save failed"
                      size="small"
                      color="error"
                      sx={{ 
                        backgroundColor: 'rgba(244,67,54,0.2)', 
                        color: 'white',
                        '& .MuiChip-label': { fontSize: '0.7rem' }
                      }}
                    />
                  )}
                  {hasUnsavedChanges && autoSaveStatus === 'saved' && (
                    <Chip
                      label="Unsaved changes"
                      size="small"
                      variant="outlined"
                      sx={{ 
                        borderColor: 'rgba(255,255,255,0.5)', 
                        color: 'white',
                        '& .MuiChip-label': { fontSize: '0.7rem' }
                      }}
                    />
                  )}
                  {weeklyTimesheetStatus === 'submitted' && (
                    <Chip
                      label="📋 Submitted - Read Only"
                      size="small"
                      color="success"
                      sx={{ 
                        backgroundColor: 'rgba(76,175,80,0.3)', 
                        color: 'white',
                        fontWeight: 'bold',
                        '& .MuiChip-label': { fontSize: '0.7rem' }
                      }}
                    />
                  )}
                  {weeklyTimesheetStatus === 'rejected' && (
                    <Chip
                      label="❌ Rejected - Can Edit"
                      size="small"
                      color="warning"
                      sx={{ 
                        backgroundColor: 'rgba(255,152,0,0.3)', 
                        color: 'white',
                        fontWeight: 'bold',
                        '& .MuiChip-label': { fontSize: '0.7rem' }
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
            
            {/* Week Navigation and Productivity Features */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {/* Productivity Features Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Copy project and task selections from last week">
                  <Button
                    startIcon={<CopyAllIcon />}
                    onClick={copyFromLastWeek}
                    sx={{ 
                      color: 'white', 
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                      fontSize: '0.875rem'
                    }}
                    variant="outlined"
                    size="small"
                  >
                    Copy Last Week
                  </Button>
                </Tooltip>
                
                <Tooltip title={keyboardShortcutsEnabled ? 
                  "Keyboard shortcuts enabled. Use arrow keys to navigate, Enter to move to next row, Ctrl+number to fill row" : 
                  "Enable keyboard shortcuts for faster data entry"
                }>
                  <IconButton
                    onClick={() => setKeyboardShortcutsEnabled(!keyboardShortcutsEnabled)}
                    sx={{ 
                      color: 'white',
                      backgroundColor: keyboardShortcutsEnabled ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.1)',
                      '&:hover': { backgroundColor: keyboardShortcutsEnabled ? 'rgba(76,175,80,0.4)' : 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    <KeyboardIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {/* Week Navigation Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  onClick={goToPreviousWeek} 
                  sx={{ 
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <PrevIcon />
                </IconButton>
                <Button
                  onClick={goToCurrentWeek}
                  startIcon={<TodayIcon />}
                  sx={{ 
                    color: 'white', 
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                  }}
                  variant="outlined"
                  size="small"
                >
                  This Week
                </Button>
                <IconButton 
                  onClick={goToNextWeek} 
                  sx={{ 
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <NextIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Quick Templates */}
        {!loading && (
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <QuickIcon color="primary" />
              Quick Fill Templates & Actions
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                size="small"
                onClick={() => fillTemplate('fullWeek')}
                startIcon={<AssignmentIcon />}
              >
                Full Week (40h)
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => fillTemplate('halfWeek')}
                startIcon={<AssignmentIcon />}
              >
                Half Time (20h)
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => fillTemplate('threeDay')}
                startIcon={<AssignmentIcon />}
              >
                3 Days (24h)
              </Button>
              
              {/* Manual Save Button */}
              <Button
                variant="contained"
                size="small"
                onClick={saveAsDraft}
                disabled={!hasUnsavedChanges || autoSaveStatus === 'saving'}
                startIcon={autoSaveStatus === 'saving' ? (
                  <RefreshIcon 
                    sx={{ 
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }} 
                  />
                ) : (
                  <SaveIcon />
                )}
                color="secondary"
              >
                {autoSaveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Keyboard Shortcuts Help Panel */}
        {keyboardShortcutsEnabled && (
          <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <KeyboardIcon fontSize="small" />
              Keyboard Shortcuts Active
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', fontSize: '0.875rem' }}>
              <Typography variant="body2">
                <strong>Navigation:</strong> Arrow keys to move between cells
              </Typography>
              <Typography variant="body2">
                <strong>Enter:</strong> Move to next day/row
              </Typography>
              <Typography variant="body2">
                <strong>Tab:</strong> Standard tab navigation
              </Typography>
              <Typography variant="body2">
                <strong>Ctrl + 0-8:</strong> Fill entire row with hours
              </Typography>
            </Box>
          </Paper>
        )}

        {loading ? (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center', mb: 3 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body1">Loading projects and tasks...</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={3} sx={{ 
            mb: 3,
            ...(isReadOnlyMode && {
              backgroundColor: '#f5f5f5',
              opacity: 0.8,
              '& .MuiTableCell-root': {
                backgroundColor: 'rgba(0,0,0,0.02)'
              }
            })
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Task</TableCell>
                  {weekDates.map((date, index) => {
                    const isWeekend = index >= 5;
                    return (
                      <TableCell 
                        key={index} 
                        align="center" 
                        sx={{ 
                          fontWeight: 'bold',
                          minWidth: 100,
                          backgroundColor: isWeekend ? '#fff3e0' : 'inherit',
                          color: isWeekend ? '#f57c00' : 'inherit'
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {dayNames[index]}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {date.format('MMM D')}
                          </Typography>
                        </Box>
                      </TableCell>
                    );
                  })}
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Notes</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 80 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task, taskIndex) => {
                  const taskTotal = Object.values(task.hours).reduce((sum, hours) => sum + (parseFloat(hours) || 0), 0);
                  
                  console.log(`Rendering task ${task.id}:`, { 
                    projectId: task.projectId, 
                    taskId: task.taskId, 
                    isDisabled: !task.projectId 
                  });
                  
                  return (
                    <TableRow key={task.id} hover>
                      <TableCell>
                        <FormControl 
                          fullWidth 
                          size="small" 
                          error={!!getFieldError(task.id, 'projectId')}
                          disabled={isReadOnlyMode}
                        >
                          <Select
                            value={task.projectId || ''}
                            onChange={(e) => {
                              console.log('Project selected:', e.target.value);
                              console.log('Project selected type:', typeof e.target.value);
                              console.log('Available projects:', projects.map(p => ({ id: p.id, idType: typeof p.id, name: p.name })));
                              updateTask(task.id, 'projectId', e.target.value);
                              updateTask(task.id, 'taskId', ''); // Reset task when project changes
                            }}
                            onOpen={() => console.log('Project dropdown opened')}
                            onClick={() => console.log('Project dropdown clicked')}
                            displayEmpty
                            disabled={isReadOnlyMode}
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  maxHeight: 224,
                                  width: 250,
                                },
                              },
                            }}
                          >
                            <MenuItem value="">Select Project</MenuItem>
                            {projects.map((project) => (
                              <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                            ))}
                          </Select>
                          {getFieldError(task.id, 'projectId') && (
                            <Typography 
                              variant="caption" 
                              color="error" 
                              sx={{ 
                                fontSize: '0.7rem', 
                                mt: 0.5,
                                display: 'block'
                              }}
                            >
                              {getFieldError(task.id, 'projectId')}
                            </Typography>
                          )}
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl 
                          fullWidth 
                          size="small"
                          error={!!getFieldError(task.id, 'taskId')}
                          disabled={isReadOnlyMode}
                        >
                          <Select
                            value={task.taskId || ''}
                            onChange={(e) => {
                              console.log('Task selected:', e.target.value);
                              updateTask(task.id, 'taskId', e.target.value);
                            }}
                            onOpen={() => {
                              console.log('Task dropdown opened');
                              console.log('Current task.projectId:', task.projectId);
                              console.log('Current task state:', task);
                              console.log('Available tasks for project:', getTasksByProject(task.projectId));
                            }}
                            onClick={() => {
                              console.log('Task dropdown clicked');
                              console.log('Task dropdown disabled check:', { 
                                projectId: task.projectId, 
                                hasProjectId: !!task.projectId, 
                                disabled: !task.projectId 
                              });
                            }}
                            displayEmpty
                            disabled={isReadOnlyMode || !task.projectId}
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  maxHeight: 224,
                                  width: 250,
                                },
                              },
                            }}
                          >
                            <MenuItem value="">Select Task</MenuItem>
                            {task.projectId && getTasksByProject(task.projectId).map((taskOption) => (
                              <MenuItem key={taskOption.id} value={taskOption.id}>{taskOption.name}</MenuItem>
                            ))}
                          </Select>
                          {getFieldError(task.id, 'taskId') && (
                            <Typography 
                              variant="caption" 
                              color="error" 
                              sx={{ 
                                fontSize: '0.7rem', 
                                mt: 0.5,
                                display: 'block'
                              }}
                            >
                              {getFieldError(task.id, 'taskId')}
                            </Typography>
                          )}
                        </FormControl>
                      </TableCell>
                      {weekDates.map((date, dayIndex) => {
                        const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayIndex];
                        const isWeekend = dayIndex >= 5;
                        
                        return (
                          <TableCell 
                            key={dayIndex} 
                            align="center"
                            sx={{ backgroundColor: isWeekend ? '#fff3e0' : 'inherit' }}
                          >
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ 
                                min: 0, 
                                max: 24, 
                                step: 0.25,
                                'data-task': task.id,
                                'data-day': dayKey
                              }}
                              value={task.hours[dayKey]}
                              onChange={(e) => updateHours(task.id, dayKey, e.target.value)}
                              onKeyDown={(e) => {
                                // Check for quick fill shortcuts (Ctrl + number)
                                if (e.ctrlKey && e.key >= '0' && e.key <= '8') {
                                  e.preventDefault();
                                  fillRowWithValue(task.id, e.key);
                                  return;
                                }
                                
                                handleKeyNavigation(e, task.id, dayKey);
                              }}
                              onFocus={() => setFocusedCell({ taskId: task.id, day: dayKey })}
                              onBlur={() => setFocusedCell(null)}
                              error={!!getFieldError(task.id, `hours_${dayKey}`)}
                              helperText={getFieldError(task.id, `hours_${dayKey}`)}
                              disabled={isReadOnlyMode}
                              sx={{ 
                                width: 80,
                                '& .MuiInputBase-input': {
                                  textAlign: 'center',
                                  backgroundColor: focusedCell?.taskId === task.id && focusedCell?.day === dayKey 
                                    ? '#e3f2fd' : 'transparent'
                                },
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: getFieldError(task.id, `hours_${dayKey}`) 
                                      ? '#f44336' 
                                      : isWeekend ? '#ff9800' : '#e0e0e0',
                                  }
                                },
                                '& .MuiFormHelperText-root': {
                                  fontSize: '0.7rem',
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  width: '120px',
                                  zIndex: 1,
                                  backgroundColor: 'white',
                                  padding: '2px 4px',
                                  border: getFieldError(task.id, `hours_${dayKey}`) ? '1px solid #f44336' : 'none',
                                  borderRadius: '4px',
                                  boxShadow: getFieldError(task.id, `hours_${dayKey}`) ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }
                              }}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell align="center">
                        <Chip 
                          label={`${taskTotal}h`} 
                          color={taskTotal > 0 ? "primary" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          multiline
                          rows={1}
                          size="small"
                          value={task.notes}
                          onChange={(e) => updateTask(task.id, 'notes', e.target.value)}
                          placeholder="Add notes..."
                          disabled={isReadOnlyMode}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {tasks.length > 1 && (
                          <IconButton 
                            onClick={() => removeTask(task.id)} 
                            color="error"
                            size="small"
                            disabled={isReadOnlyMode}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Daily Totals Row */}
                <TableRow sx={{ backgroundColor: '#e3f2fd', fontWeight: 'bold' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                    <Typography variant="subtitle2">Daily Totals</Typography>
                  </TableCell>
                  {weekDates.map((date, dayIndex) => {
                    const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayIndex];
                    const dayTotal = getDayTotal(dayKey);
                    const isWeekend = dayIndex >= 5;
                    
                    return (
                      <TableCell 
                        key={dayIndex} 
                        align="center" 
                        sx={{ 
                          fontWeight: 'bold',
                          backgroundColor: isWeekend ? '#fff3e0' : '#e3f2fd'
                        }}
                      >
                        <Chip 
                          label={`${dayTotal}h`} 
                          color={dayTotal > 8 ? "warning" : dayTotal > 0 ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    <Chip 
                      label={`${totalHours}h`} 
                      color="primary" 
                      size="medium"
                    />
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Add Task Button */}
        {!loading && !isReadOnlyMode && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addTask}
              color="primary"
            >
              Add Task
            </Button>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" color="primary">
                Total: {totalHours} hours
              </Typography>
            </Box>
          </Box>
        )}
        
        {/* Total Hours Display for Read-Only Mode */}
        {!loading && isReadOnlyMode && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" color="primary">
              Total: {totalHours} hours
            </Typography>
          </Box>
        )}

        {/* Error Recovery Panel */}
        {submissionErrors.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#fff3e0', border: '1px solid #ff9800' }}>
            <Typography variant="h6" color="warning.main" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              ⚠️ Submission Issues Detected
            </Typography>
            {submissionErrors.map((error) => (
              <Box key={error.id} sx={{ mb: 2, p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #ffcc02' }}>
                <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                  <strong>Error:</strong> {error.message}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  {error.context && `Context: ${error.context} • `}
                  Occurred at: {error.timestamp.toLocaleTimeString()}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {error.recoverable && (
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      onClick={error.retryAction}
                      disabled={retryAttempts >= 3}
                    >
                      {retryAttempts >= 3 ? 'Max Retries Reached' : `Retry (${retryAttempts}/3)`}
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => removeSubmissionError(error.id)}
                  >
                    Dismiss
                  </Button>
                </Stack>
              </Box>
            ))}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #ffcc02' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                💡 <strong>Recovery Options:</strong>
                {' '}Your work is automatically saved locally every 30 seconds. You can:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button size="small" variant="outlined" color="warning" onClick={clearAllErrors}>
                  Clear All Errors
                </Button>
                <Button size="small" variant="outlined" color="info" onClick={saveAsDraft}>
                  Save Draft Now
                </Button>
                <Button size="small" variant="outlined" color="secondary" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}

        {/* Submit Section */}
        {!loading && !isReadOnlyMode && (
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Submit Weekly Timesheet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Week of {currentWeek.format('MMM D')} - {currentWeek.add(6, 'day').format('MMM D, YYYY')} • Total: {totalHours} hours
            </Typography>
            
            {saving && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress 
                  variant={savingProgress.total > 0 ? "determinate" : "indeterminate"}
                  value={savingProgress.total > 0 ? (savingProgress.current / savingProgress.total) * 100 : 0}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {savingProgress.mode === 'bulk' && savingProgress.total > 1 
                    ? `Bulk saving ${savingProgress.total} timesheets... (${savingProgress.current}/${savingProgress.total})`
                    : savingProgress.mode === 'individual' 
                    ? `Saving timesheet ${savingProgress.current + 1} of ${savingProgress.total}...`
                    : savingProgress.mode === 'submitting'
                    ? `Submitting ${savingProgress.total} timesheets for approval...`
                    : savingProgress.mode || 'Processing...'}
                </Typography>
              </Box>
            )}
            
            <Button
              variant="contained"
              size="large"
              startIcon={saving ? (
                <RefreshIcon 
                  sx={{ 
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': {
                        transform: 'rotate(0deg)',
                      },
                      '100%': {
                        transform: 'rotate(360deg)',
                      },
                    },
                  }} 
                />
              ) : (
                <SaveIcon />
              )}
              onClick={handleSubmit}
              disabled={saving || totalHours === 0}
              sx={{
                minWidth: 200,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              }}
            >
              {saving ? 'Submitting...' : 'Submit Timesheet'}
            </Button>
          </Paper>
        )}
        
        {/* Mobile FAB */}
        {isMobile && !isReadOnlyMode && (
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            }}
            onClick={addTask}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Success Dialog */}
        <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
          <DialogTitle sx={{ textAlign: 'center' }}>
            <CheckIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6">Timesheet Submitted!</Typography>
          </DialogTitle>
          <DialogContent>
            <Typography align="center">
              Your weekly timesheet for {currentWeek.format('MMM D')} - {currentWeek.add(6, 'day').format('MMM D, YYYY')} has been successfully submitted.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button onClick={() => setSuccessOpen(false)} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default WeeklyTimesheet;
