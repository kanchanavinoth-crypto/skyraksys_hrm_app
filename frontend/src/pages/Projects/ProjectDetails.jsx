import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import ProjectService from '../../services/ProjectService';
import TaskService from '../../services/TaskService';
import TaskForm from '../Tasks/TaskForm';
import TaskList from '../Tasks/TaskList';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openTaskForm, setOpenTaskForm] = useState(false);

  useEffect(() => {
    loadProject();
    loadStats();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await ProjectService.get(id);
      setProject(response.data.data);
      setError(null);
    } catch (error) {
      console.error('Error loading project:', error);
      setError(error.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await ProjectService.getStats(id);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateTask = () => {
    setOpenTaskForm(true);
  };

  const handleTaskFormClose = () => {
    setOpenTaskForm(false);
    loadProject();
    loadStats();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/projects')}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" flex={1}>
          {project?.name}
        </Typography>
        <Chip label={project?.status} color="primary" />
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/projects/${id}/edit`)}
        >
          Edit
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Details
              </Typography>
              <Typography variant="body1" paragraph>
                {project?.description || 'No description'}
              </Typography>
              
              <Grid container spacing={2}>
                {project?.clientName && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Client
                    </Typography>
                    <Typography variant="body2">
                      {project.clientName}
                    </Typography>
                  </Grid>
                )}
                
                {project?.manager && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Manager
                    </Typography>
                    <Typography variant="body2">
                      {project.manager.firstName} {project.manager.lastName}
                    </Typography>
                  </Grid>
                )}
                
                {project?.startDate && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body2">
                      {new Date(project.startDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
                
                {project?.endDate && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      End Date
                    </Typography>
                    <Typography variant="body2">
                      {new Date(project.endDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Tasks ({project?.tasks?.length || 0})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={handleCreateTask}
                >
                  Add Task
                </Button>
              </Box>
              
              <TaskList tasks={project?.tasks || []} onUpdate={loadProject} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {stats && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Tasks
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalTasks}
                  </Typography>
                </Box>

                {stats.tasksByStatus?.map((stat) => (
                  <Box key={stat.status} sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {stat.status}
                    </Typography>
                    <Typography variant="body2">
                      {stat.count} tasks
                    </Typography>
                  </Box>
                ))}

                {stats.tasksByStatus?.some(s => s.totalEstimated) && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      Estimated Hours
                    </Typography>
                    <Typography variant="body2">
                      {stats.tasksByStatus.reduce((sum, s) => sum + (parseFloat(s.totalEstimated) || 0), 0).toFixed(2)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Dialog open={openTaskForm} onClose={handleTaskFormClose} maxWidth="md" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TaskForm
            projectId={id}
            onSave={handleTaskFormClose}
            onCancel={handleTaskFormClose}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProjectDetails;
