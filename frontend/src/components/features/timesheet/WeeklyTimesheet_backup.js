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
  Tabs,
  Tab,
  Card,
  CardContent
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
  History as HistoryIcon,
  PostAdd as EntryIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import TimesheetDataService from '../../../services/TimesheetService';
import { timesheetService } from '../../../services/timesheet.service';
import ProjectDataService from '../../../services/ProjectService';
import TaskDataService from '../../../services/TaskService';
import TimesheetHistory from './TimesheetHistory';

// Enable dayjs plugins
dayjs.extend(weekday);
dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const WeeklyTimesheet = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('isoWeek'));
  const [currentTab, setCurrentTab] = useState(0); // Add tab state
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
  const [successOpen, setSuccessOpen] = useState(false);
  const [totalHours, setTotalHours] = useState(0);
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);

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

  // Load existing timesheets for the current week
  useEffect(() => {
    const loadExistingTimesheets = async () => {
      try {
        console.log('Loading timesheets for week:', currentWeek.format('YYYY-MM-DD'));
        
        // Calculate the date range for the current week
        const startDate = currentWeek.format('YYYY-MM-DD');
        const endDate = currentWeek.add(6, 'day').format('YYYY-MM-DD');
        
        // Get timesheets for the current week
        const response = await timesheetService.getAll();
        console.log('Timesheet response:', response);
        
        if (response.data && response.data.success && response.data.data) {
          const timesheets = response.data.data;
          console.log('Loaded timesheets:', timesheets);
          
          // Filter timesheets for current week
          const weekTimesheets = timesheets.filter(timesheet => {
            const workDate = dayjs(timesheet.workDate);
            return workDate.isBetween(currentWeek, currentWeek.add(6, 'day'), 'day', '[]');
          });
          
          console.log('Week timesheets:', weekTimesheets);
          
          if (weekTimesheets.length > 0) {
            // Group timesheets by project/task combination
            const groupedTimesheets = {};
            
            weekTimesheets.forEach(timesheet => {
              const key = `${timesheet.projectId}-${timesheet.taskId}`;
              if (!groupedTimesheets[key]) {
                groupedTimesheets[key] = {
                  id: Date.now() + Math.random(),
                  projectId: timesheet.projectId,
                  taskId: timesheet.taskId,
                  hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
                  notes: timesheet.description.split(' - ').length > 2 ? timesheet.description.split('. Notes: ')[1] || '' : ''
                };
              }
              
              // Map work date to day of week
              const workDate = dayjs(timesheet.workDate);
              const dayIndex = workDate.isoWeekday() - 1; // 0=Monday, 6=Sunday
              const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              
              if (dayIndex >= 0 && dayIndex < 7) {
                groupedTimesheets[key].hours[dayNames[dayIndex]] = timesheet.hoursWorked;
              }
            });
            
            // Convert grouped timesheets to tasks array
            const loadedTasks = Object.values(groupedTimesheets);
            console.log('Loaded tasks:', loadedTasks);
            
            setTasks(loadedTasks);
          } else {
            // No existing timesheets for this week, reset to default
            setTasks([{
              id: 1,
              projectId: '',
              taskId: '',
              hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
              notes: ''
            }]);
          }
        }
      } catch (error) {
        console.error('Error loading existing timesheets:', error);
      }
    };

    loadExistingTimesheets();
  }, [currentWeek]); // Re-run when current week changes

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
      return updatedTasks;
    });
  }, []);

  // Update hours for specific day
  const updateHours = useCallback((taskId, day, hours) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, hours: { ...task.hours, [day]: hours } }
          : task
      )
    );
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

  // Submit timesheet
  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Validate that at least one hour is entered
      const hasHours = tasks.some(task => 
        Object.values(task.hours).some(hour => parseFloat(hour) > 0)
      );

      if (!hasHours) {
        alert('Please enter at least one hour before submitting.');
        setSaving(false);
        return;
      }

      // Create individual timesheet entries for each day that has hours
      const timesheetEntries = [];
      const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      tasks.forEach(task => {
        if (!task.projectId || !task.taskId) {
          return; // Skip incomplete tasks
        }
        
        dayKeys.forEach((dayKey, dayIndex) => {
          const hours = parseFloat(task.hours[dayKey]);
          if (hours > 0) {
            const workDate = currentWeek.add(dayIndex, 'day');
            
            // Get project and task names for description
            const project = projects.find(p => p.id === task.projectId);
            const taskDetail = allTasks.find(t => t.id === task.taskId);
            
            timesheetEntries.push({
              workDate: workDate.format('YYYY-MM-DD'),
              hoursWorked: hours,
              description: `${project?.name || 'Unknown Project'} - ${taskDetail?.name || 'Unknown Task'}${task.notes ? '. Notes: ' + task.notes : ''}`,
              projectId: task.projectId,
              taskId: task.taskId
              // Will be created and submitted directly with 'Submitted' status
            });
          }
        });
      });

      if (timesheetEntries.length === 0) {
        alert('Please enter at least one hour before submitting.');
        setSaving(false);
        return;
      }

      // Create and submit timesheet entries directly with 'Submitted' status
      const submissions = timesheetEntries.map(entry => 
        timesheetService.createAndSubmit(entry)
      );

      await Promise.all(submissions);
      setSuccessOpen(true);
      
      // Reset form after successful submission
      setTasks([{
        id: 1,
        projectId: '',
        taskId: '',
        hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
        notes: ''
      }]);
      
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      alert('Error submitting timesheet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save as draft
  const handleSaveAsDraft = async () => {
    setSaving(true);
    try {
      // Validate that at least one hour is entered
      const hasHours = tasks.some(task => 
        Object.values(task.hours).some(hour => parseFloat(hour) > 0)
      );

      if (!hasHours) {
        alert('Please enter at least one hour before saving.');
        setSaving(false);
        return;
      }

      // Create individual timesheet entries for each day that has hours
      const timesheetEntries = [];
      const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      tasks.forEach(task => {
        if (!task.projectId || !task.taskId) {
          return; // Skip incomplete tasks
        }
        
        dayKeys.forEach((dayKey, dayIndex) => {
          const hours = parseFloat(task.hours[dayKey]);
          if (hours > 0) {
            const workDate = currentWeek.add(dayIndex, 'day');
            
            // Get project and task names for description
            const project = projects.find(p => p.id === task.projectId);
            const taskDetail = allTasks.find(t => t.id === task.taskId);
            
            timesheetEntries.push({
              workDate: workDate.format('YYYY-MM-DD'),
              hoursWorked: hours,
              description: `${project?.name || 'Unknown Project'} - ${taskDetail?.name || 'Unknown Task'}${task.notes ? '. Notes: ' + task.notes : ''}`,
              projectId: task.projectId,
              taskId: task.taskId
              // Will be created with 'Draft' status
            });
          }
        });
      });

      if (timesheetEntries.length === 0) {
        alert('Please enter at least one hour before saving.');
        setSaving(false);
        return;
      }

      // Create timesheet entries as drafts
      const submissions = timesheetEntries.map(entry => 
        timesheetService.create(entry)
      );

      await Promise.all(submissions);
      alert('Timesheet saved as draft successfully!');
      
      // Reset form after successful save
      setTasks([{
        id: 1,
        projectId: '',
        taskId: '',
        hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
        notes: ''
      }]);
      
    } catch (error) {
      console.error('Error saving timesheet as draft:', error);
      alert('Error saving timesheet. Please try again.');
    } finally {
      setSaving(false);
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
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  {currentWeek.format('MMM D')} - {currentWeek.add(6, 'day').format('MMM D, YYYY')}
                </Typography>
              </Box>
            </Box>
            
            {/* Week Navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={goToPreviousWeek} sx={{ color: 'white' }}>
                <PrevIcon />
              </IconButton>
              <Button
                onClick={goToCurrentWeek}
                startIcon={<TodayIcon />}
                sx={{ 
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
                variant="outlined"
                size="small"
              >
                Today
              </Button>
              <IconButton onClick={goToNextWeek} sx={{ color: 'white' }}>
                <NextIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} variant="fullWidth">
            <Tab icon={<EntryIcon />} label="Timesheet Entry" />
            <Tab icon={<HistoryIcon />} label="My History" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {currentTab === 0 ? (
          <Box>
            <Typography>Timesheet Entry Tab - Coming Soon</Typography>
          </Box>
        ) : null}
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
                </Stack>
              </Paper>
            )}

        {loading ? (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center', mb: 3 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body1">Loading projects and tasks...</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={3} sx={{ mb: 3 }}>
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
                        <FormControl fullWidth size="small">
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
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
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
                            disabled={!task.projectId}
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
                              inputProps={{ min: 0, max: 24, step: 0.5 }}
                              value={task.hours[dayKey]}
                              onChange={(e) => updateHours(task.id, dayKey, e.target.value)}
                              sx={{ 
                                width: 80,
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: isWeekend ? '#ff9800' : '#e0e0e0',
                                  }
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
                        />
                      </TableCell>
                      <TableCell align="center">
                        {tasks.length > 1 && (
                          <IconButton 
                            onClick={() => removeTask(task.id)} 
                            color="error"
                            size="small"
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
        {!loading && (
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

        {/* Submit Section */}
        {!loading && (
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Submit Weekly Timesheet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Week of {currentWeek.format('MMM D')} - {currentWeek.add(6, 'day').format('MMM D, YYYY')} • Total: {totalHours} hours
            </Typography>
            
            {saving && <LinearProgress sx={{ mb: 2 }} />}
            
            <Stack direction={isMobile ? "column" : "row"} spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSaveAsDraft}
                disabled={saving || totalHours === 0}
                sx={{
                  minWidth: 180,
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': {
                    borderColor: '#1565c0',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                }}
              >
                Save as Draft
              </Button>
              
              <Button
                variant="contained"
                size="large"
                startIcon={saving ? <RefreshIcon sx={{ animation: 'spin 1s linear infinite' }} /> : <CheckIcon />}
                onClick={handleSubmit}
                disabled={saving || totalHours === 0}
                sx={{
                  minWidth: 200,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                }}
              >
                {saving ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </Stack>
          </Paper>
        )}

        {/* History Tab Content */}
        {currentTab === 1 && (
          <TimesheetHistory showHeader={false} />
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
