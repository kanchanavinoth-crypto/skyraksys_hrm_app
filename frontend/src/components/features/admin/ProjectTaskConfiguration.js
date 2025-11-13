import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tooltip,
  ToggleButtonGroup, // ✅ ADD
  ToggleButton, // ✅ ADD
  Stack,
  Divider,
  Avatar,
  useTheme,
  alpha,
  Grow,
  Fade,
  InputAdornment // ✅ ADD
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  ViewModule as CardViewIcon, // ✅ ADD - Card view icon
  ViewList as TableViewIcon, // ✅ ADD - Table view icon
  CalendarToday as CalendarTodayIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Folder as ProjectIcon, // ✅ ADD
  Close as CloseIcon // ✅ ADD
} from '@mui/icons-material';
import ProjectService from '../../../services/ProjectService';
import TaskService from '../../../services/TaskService';
import EmployeeService from '../../../services/EmployeeService';

const ProjectTaskConfiguration = () => {
  const theme = useTheme();
  
  useEffect(() => {
    console.log('🎯 CORRECT ProjectTaskConfiguration component loaded (TABLE VERSION - ADMIN FEATURES)');
  }, []);

  const [activeTab, setActiveTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Dialogs
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [projectStats, setProjectStats] = useState(null);
  
  // Form state
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'Planning',
    clientName: '',
    managerId: ''
  });
  
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    projectId: '',
    assignedTo: '',
    availableToAll: false,
    status: 'Not Started',
    priority: 'Medium',
    estimatedHours: ''
  });

  // ✅ ADD VIEW STATE
  const [projectView, setProjectView] = useState('cards'); // 'cards' or 'table'
  const [taskView, setTaskView] = useState('table'); // 'cards' or 'table'

  useEffect(() => {
    loadProjects();
    loadTasks();
    loadEmployees();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ProjectService.getAll();
      console.log('📦 Projects loaded:', response.data);
      
      if (response.data && response.data.success) {
        setProjects(response.data.data || []);
      } else {
        setProjects([]);
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      setError(error.response?.data?.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await TaskService.getAll();
      console.log('📋 Tasks loaded:', response.data);
      
      if (response.data && response.data.success) {
        setTasks(response.data.data || []);
      } else {
        setTasks([]);
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      setError(error.response?.data?.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await EmployeeService.getAll();
      console.log('👥 Employees loaded:', response.data);
      
      if (response.data && response.data.success) {
        setEmployees(response.data.data || []);
      } else {
        setEmployees([]);
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Error loading employees:', error);
      setError(error.response?.data?.message || 'Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSave = async () => {
    try {
      setLoading(true);
      
      // Clean the managerId field before sending
      const payload = {
        ...projectForm,
        managerId: projectForm.managerId && projectForm.managerId.trim() ? projectForm.managerId : null
      };
      
      if (selectedProject) {
        await ProjectService.update(selectedProject.id, payload);
        setSuccess('Project updated successfully');
      } else {
        await ProjectService.create(payload);
        setSuccess('Project created successfully');
      }
      setProjectDialogOpen(false);
      loadProjects();
      resetProjectForm();
    } catch (error) {
      console.error('Error saving project:', error);
      setError(error.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSave = async () => {
    try {
      setLoading(true);
      if (selectedTask) {
        await TaskService.update(selectedTask.id, taskForm);
        setSuccess('Task updated successfully');
      } else {
        await TaskService.create(taskForm);
        setSuccess('Task created successfully');
      }
      setTaskDialogOpen(false);
      loadTasks();
      resetTaskForm();
    } catch (error) {
      console.error('Error saving task:', error);
      setError(error.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project and all its tasks?')) {
      return;
    }
    
    try {
      setLoading(true);
      await ProjectService.delete(projectId);
      setSuccess('Project deleted successfully');
      loadProjects();
      loadTasks();
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error.response?.data?.message || 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      setLoading(true);
      await TaskService.delete(taskId);
      setSuccess('Task deleted successfully');
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.response?.data?.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStats = async (projectId) => {
    try {
      setLoading(true);
      const response = await ProjectService.getStats(projectId);
      setProjectStats(response.data.data);
      setStatsDialogOpen(true);
    } catch (error) {
      console.error('Error loading project stats:', error);
      setError('Failed to load project statistics');
    } finally {
      setLoading(false);
    }
  };

  const openProjectDialog = (project = null) => {
    if (project) {
      setSelectedProject(project);
      setProjectForm({
        name: project.name || '',
        description: project.description || '',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        status: project.status || 'Planning',
        clientName: project.clientName || '',
        managerId: project.managerId || ''
      });
    } else {
      resetProjectForm();
    }
    setProjectDialogOpen(true);
  };

  const openTaskDialog = (task = null) => {
    if (task) {
      setSelectedTask(task);
      setTaskForm({
        name: task.name || '',
        description: task.description || '',
        projectId: task.projectId || '',
        assignedTo: task.assignedTo || '',
        availableToAll: task.availableToAll || false,
        status: task.status || 'Not Started',
        priority: task.priority || 'Medium',
        estimatedHours: task.estimatedHours || ''
      });
    } else {
      resetTaskForm();
    }
    setTaskDialogOpen(true);
  };

  const resetProjectForm = () => {
    setSelectedProject(null);
    setProjectForm({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'Planning',
      clientName: '',
      managerId: ''
    });
  };

  const resetTaskForm = () => {
    setSelectedTask(null);
    setTaskForm({
      name: '',
      description: '',
      projectId: '',
      assignedTo: '',
      availableToAll: false,
      status: 'Not Started',
      priority: 'Medium',
      estimatedHours: ''
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planning': 'default',
      'Active': 'primary',
      'On Hold': 'warning',
      'Completed': 'success',
      'Cancelled': 'error',
      'Not Started': 'default',
      'In Progress': 'info'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'success',
      'Medium': 'info',
      'High': 'warning',
      'Critical': 'error'
    };
    return colors[priority] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Project & Task Configuration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Projects" />
          <Tab label="Tasks" />
        </Tabs>
      </Paper>

      {/* ======== PROJECTS TAB ======== */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          {/* ✅ HEADER WITH VIEW TOGGLE */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" fontWeight="700">
                Projects ({projects.length})
              </Typography>
              
              {/* View Toggle */}
              <ToggleButtonGroup
                value={projectView}
                exclusive
                onChange={(e, newView) => newView && setProjectView(newView)}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 2,
                    py: 0.5,
                    textTransform: 'none',
                    fontWeight: 500
                  }
                }}
              >
                <ToggleButton value="cards">
                  <CardViewIcon sx={{ fontSize: 18, mr: 0.5 }} />
                  Cards
                </ToggleButton>
                <ToggleButton value="table">
                  <TableViewIcon sx={{ fontSize: 18, mr: 0.5 }} />
                  Table
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openProjectDialog()}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.5)}`
                }
              }}
            >
              Add Project
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress size={48} />
            </Box>
          ) : (
            <>
              {/* ✅ CARD VIEW */}
              {projectView === 'cards' && (
                <Grid container spacing={3}>
                  {projects.map((project, index) => (
                    <Grow in timeout={300 + index * 100} key={project.id}>
                      <Grid item xs={12} md={6} lg={4}>
                        <Card
                          sx={{
                            height: '100%',
                            borderRadius: 3,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'visible',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '4px',
                              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                              borderRadius: '12px 12px 0 0'
                            },
                            '&:hover': {
                              transform: 'translateY(-8px)',
                              boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.15)}`
                            }
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Stack spacing={2}>
                              {/* Header */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" fontWeight="700" gutterBottom>
                                    {project.name}
                                  </Typography>
                                  <Chip
                                    label={project.status}
                                    size="small"
                                    color={getStatusColor(project.status)}
                                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                  />
                                </Box>
                                <Chip 
                                  label={`${project.tasks?.length || 0} tasks`}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              </Box>

                              {/* Description */}
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  minHeight: 40
                                }}
                              >
                                {project.description || 'No description provided'}
                              </Typography>

                              <Divider />

                              {/* Metadata */}
                              <Stack spacing={1}>
                                {project.clientName && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BusinessIcon fontSize="small" color="action" />
                                    <Typography variant="body2">{project.clientName}</Typography>
                                  </Box>
                                )}
                                {project.startDate && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarTodayIcon fontSize="small" color="action" />
                                    <Typography variant="body2">
                                      {new Date(project.startDate).toLocaleDateString()}
                                      {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString()}`}
                                    </Typography>
                                  </Box>
                                )}
                                {project.manager && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon fontSize="small" color="action" />
                                    <Typography variant="body2">
                                      {project.manager.firstName} {project.manager.lastName}
                                    </Typography>
                                  </Box>
                                )}
                              </Stack>

                              {/* Actions */}
                              <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
                                <Tooltip title="View Statistics">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewStats(project.id)}
                                    sx={{
                                      bgcolor: alpha(theme.palette.info.main, 0.1),
                                      '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) }
                                    }}
                                  >
                                    <InfoIcon fontSize="small" color="info" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit Project">
                                  <IconButton
                                    size="small"
                                    onClick={() => openProjectDialog(project)}
                                    sx={{
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                                    }}
                                  >
                                    <EditIcon fontSize="small" color="primary" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Project">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleProjectDelete(project.id)}
                                    sx={{
                                      bgcolor: alpha(theme.palette.error.main, 0.1),
                                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" color="error" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grow>
                  ))}

                  {projects.length === 0 && (
                    <Grid item xs={12}>
                      <Paper
                        sx={{
                          p: 8,
                          textAlign: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.02),
                          border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                          borderRadius: 3
                        }}
                      >
                        <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" gutterBottom color="text.secondary">
                          No projects yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Get started by creating your first project
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => openProjectDialog()}
                        >
                          Create Project
                        </Button>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* ✅ TABLE VIEW (Existing) */}
              {projectView === 'table' && (
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Project Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Manager</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Tasks</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {project.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {project.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>{project.clientName || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={project.status}
                              color={getStatusColor(project.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {project.manager 
                              ? `${project.manager.firstName} ${project.manager.lastName}`
                              : '-'
                            }
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={project.tasks?.length || 0}
                              size="small"
                              color={project.tasks?.length > 0 ? 'primary' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Statistics">
                              <IconButton size="small" onClick={() => handleViewStats(project.id)}>
                                <InfoIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Project">
                              <IconButton size="small" onClick={() => openProjectDialog(project)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Project">
                              <IconButton size="small" color="error" onClick={() => handleProjectDelete(project.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {projects.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} align="center">
                            <Box sx={{ py: 3 }}>
                              <Typography variant="body1" color="text.secondary" gutterBottom>
                                No projects found
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Click "Add Project" to create your first project
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Paper>
      )}

      {/* ======== TASKS TAB ======== */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          {/* ✅ HEADER WITH VIEW TOGGLE */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" fontWeight="700">
                Tasks ({tasks.length})
              </Typography>
              
              {/* View Toggle */}
              <ToggleButtonGroup
                value={taskView}
                exclusive
                onChange={(e, newView) => newView && setTaskView(newView)}
                size="small"
              >
                <ToggleButton value="cards">
                  <CardViewIcon sx={{ fontSize: 18, mr: 0.5 }} />
                  Cards
                </ToggleButton>
                <ToggleButton value="table">
                  <TableViewIcon sx={{ fontSize: 18, mr: 0.5 }} />
                  Table
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openTaskDialog()}
              sx={{
                borderRadius: 2,
                px: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
              }}
            >
              Add Task
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* ✅ CARD VIEW FOR TASKS */}
              {taskView === 'cards' && (
                <Grid container spacing={3}>
                  {tasks.map((task, index) => (
                    <Grow in timeout={300 + index * 50} key={task.id}>
                      <Grid item xs={12} md={6} lg={4}>
                        <Card
                          sx={{
                            height: '100%',
                            borderRadius: 3,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2.5 }}>
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <Typography variant="h6" fontWeight="600" sx={{ flex: 1 }}>
                                  {task.name}
                                </Typography>
                                <Chip
                                  label={task.priority}
                                  size="small"
                                  color={getPriorityColor(task.priority)}
                                  sx={{ ml: 1 }}
                                />
                              </Box>

                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                  label={task.status}
                                  size="small"
                                  color={getStatusColor(task.status)}
                                />
                                <Chip
                                  label={task.project?.name || 'No Project'}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>

                              {task.assignee ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>
                                    {task.assignee.firstName?.charAt(0)}
                                  </Avatar>
                                  <Typography variant="body2">
                                    {task.assignee.firstName} {task.assignee.lastName}
                                  </Typography>
                                </Box>
                              ) : task.availableToAll ? (
                                <Chip label="Available to All" size="small" color="info" />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Unassigned
                                </Typography>
                              )}

                              {task.estimatedHours && (
                                <Typography variant="caption" color="text.secondary">
                                  Est: {task.estimatedHours}h
                                </Typography>
                              )}

                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Edit Task">
                                  <IconButton
                                    size="small"
                                    onClick={() => openTaskDialog(task)}
                                    sx={{
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                                    }}
                                  >
                                    <EditIcon fontSize="small" color="primary" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Task">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleTaskDelete(task.id)}
                                    sx={{
                                      bgcolor: alpha(theme.palette.error.main, 0.1),
                                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" color="error" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grow>
                  ))}
                  {tasks.length === 0 && (
                    <Grid item xs={12}>
                      <Paper
                        sx={{
                          p: 8,
                          textAlign: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.02),
                          border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                          borderRadius: 3
                        }}
                      >
                        <Typography variant="h6" gutterBottom color="text.secondary">
                          No tasks found
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => openTaskDialog()}
                        >
                          Create Task
                        </Button>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* ✅ TABLE VIEW FOR TASKS (Existing) */}
              {taskView === 'table' && (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Task Name</strong></TableCell>
                        <TableCell><strong>Project</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Priority</strong></TableCell>
                        <TableCell><strong>Assigned To</strong></TableCell>
                        <TableCell><strong>Est. Hours</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id} hover>
                          <TableCell>{task.name}</TableCell>
                          <TableCell>{task.project?.name || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={task.status}
                              color={getStatusColor(task.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={task.priority}
                              color={getPriorityColor(task.priority)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {task.availableToAll ? (
                              <Chip label="All Employees" size="small" color="info" />
                            ) : task.assignee ? (
                              `${task.assignee.firstName} ${task.assignee.lastName}`
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{task.estimatedHours || '-'}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit Task">
                              <IconButton
                                size="small"
                                onClick={() => openTaskDialog(task)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Task">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleTaskDelete(task.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {tasks.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Box sx={{ py: 3 }}>
                              <Typography variant="body1" color="text.secondary" gutterBottom>
                                No tasks found
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Click "Add Task" to create one
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Paper>
      )}

      {/* Enhanced Project Dialog */}
      <Dialog
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 48px ${alpha(theme.palette.primary.main, 0.15)}`,
            overflow: 'visible',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              borderRadius: '12px 12px 0 0'
            }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.2)})`
              }}
            >
              <ProjectIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight="700">
              {selectedProject ? 'Edit Project' : 'Create New Project'}
            </Typography>
          </Stack>
          <IconButton
            onClick={() => setProjectDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <Divider sx={{ mx: 3 }} />
        
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Project Name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ProjectIcon color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Describe your project..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Client Name"
                value={projectForm.clientName}
                onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={projectForm.status}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2 }
                }}
              >
                <MenuItem value="Planning">
                  <Chip label="Planning" size="small" color="default" sx={{ mr: 1 }} />
                  Planning
                </MenuItem>
                <MenuItem value="Active">
                  <Chip label="Active" size="small" color="primary" sx={{ mr: 1 }} />
                  Active
                </MenuItem>
                <MenuItem value="On Hold">
                  <Chip label="On Hold" size="small" color="warning" sx={{ mr: 1 }} />
                  On Hold
                </MenuItem>
                <MenuItem value="Completed">
                  <Chip label="Completed" size="small" color="success" sx={{ mr: 1 }} />
                  Completed
                </MenuItem>
                <MenuItem value="Cancelled">
                  <Chip label="Cancelled" size="small" color="error" sx={{ mr: 1 }} />
                  Cancelled
                </MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={projectForm.startDate}
                onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={projectForm.endDate}
                onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2 }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Project Manager (Optional)"
                value={projectForm.managerId}
                onChange={(e) => setProjectForm({ ...projectForm, managerId: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2 }
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setProjectDialogOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProjectSave}
            disabled={loading || !projectForm.name}
            startIcon={loading ? <CircularProgress size={18} /> : <CheckCircleIcon />}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
              }
            }}
          >
            {loading ? 'Saving...' : selectedProject ? 'Update Project' : 'Create Project'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Dialog */}
      <Dialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTask ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Task Name"
                value={taskForm.name}
                onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                select
                label="Project"
                value={taskForm.projectId}
                onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Hours"
                value={taskForm.estimatedHours}
                onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
              >
                <MenuItem value="Not Started">Not Started</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Task Assignment:
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant={taskForm.availableToAll ? "contained" : "outlined"}
                  onClick={() => setTaskForm({ 
                    ...taskForm, 
                    availableToAll: true, 
                    assignedTo: '' 
                  })}
                  sx={{ mr: 2, mb: 1 }}
                >
                  Available to All
                </Button>
                <Button
                  variant={!taskForm.availableToAll ? "contained" : "outlined"}
                  onClick={() => setTaskForm({ 
                    ...taskForm, 
                    availableToAll: false 
                  })}
                  sx={{ mb: 1 }}
                >
                  Assign to Specific Employee
                </Button>
              </Box>
            </Grid>
            
            {!taskForm.availableToAll && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Assign To"
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} ({employee.employeeId})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleTaskSave}
            disabled={loading || !taskForm.name || !taskForm.projectId}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Statistics Dialog */}
      <Dialog
        open={statsDialogOpen}
        onClose={() => setStatsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Project Statistics</DialogTitle>
        <DialogContent>
          {projectStats && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {projectStats.projectName}
              </Typography>
              <Chip
                label={projectStats.projectStatus}
                color={getStatusColor(projectStats.projectStatus)}
                sx={{ mb: 2 }}
              />
              <Typography variant="body1" gutterBottom>
                Total Tasks: {projectStats.totalTasks}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {projectStats.tasksByStatus?.map((stat) => (
                  <Box key={stat.status} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      {stat.status}: {stat.count} tasks
                      {stat.totalEstimated > 0 && ` (${stat.totalEstimated}h estimated)`}
                      {stat.totalActual > 0 && ` / ${stat.totalActual}h actual`}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectTaskConfiguration;
