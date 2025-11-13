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
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import ProjectService from '../services/ProjectService';
import TaskService from '../services/TaskService';

const ProjectTaskConfiguration = () => {
  useEffect(() => {
    console.log('🎯 CORRECT ProjectTaskConfiguration component loaded (TABLE VERSION)');
  }, []);

  const [activeTab, setActiveTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
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

  useEffect(() => {
    loadProjects();
    loadTasks();
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
      <Typography variant="h4" gutterBottom>
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

      {/* Projects Tab */}
      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Projects ({projects.length})</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openProjectDialog()}
            >
              Add Project
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ display: 'table !important' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Project Name</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Client</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Start Date</strong></TableCell>
                    <TableCell><strong>End Date</strong></TableCell>
                    <TableCell><strong>Manager</strong></TableCell>
                    <TableCell align="center"><strong>Tasks</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
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
                        <Typography variant="body2">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {project.manager 
                            ? `${project.manager.firstName} ${project.manager.lastName}`
                            : '-'
                          }
                        </Typography>
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
                          <IconButton
                            size="small"
                            onClick={() => handleViewStats(project.id)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Project">
                          <IconButton
                            size="small"
                            onClick={() => openProjectDialog(project)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Project">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleProjectDelete(project.id)}
                          >
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
        </Paper>
      )}

      {/* Tasks Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Tasks</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openTaskDialog()}
            >
              Add Task
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task Name</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Est. Hours</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
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
                        No tasks found. Click "Add Task" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Project Dialog */}
      <Dialog
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Project Name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Client Name"
                value={projectForm.clientName}
                onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={projectForm.status}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
              >
                <MenuItem value="Planning">Planning</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
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
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Project Manager (Optional)"
                value={projectForm.managerId}
                onChange={(e) => setProjectForm({ ...projectForm, managerId: e.target.value })}
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
        <DialogActions>
          <Button onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleProjectSave}
            disabled={loading || !projectForm.name}
          >
            {loading ? 'Saving...' : 'Save'}
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
