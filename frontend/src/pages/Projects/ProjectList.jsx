import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ProjectService from '../../services/ProjectService';
import ProjectForm from './ProjectForm';

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await ProjectService.getAll(params);
      setProjects(response.data.data || []);
      setError(null);
    } catch (error) {
      console.error('Error loading projects:', error);
      setError(error.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setOpenForm(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setOpenForm(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await ProjectService.delete(projectId);
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleViewProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedProject(null);
  };

  const handleFormSave = () => {
    handleFormClose();
    loadProjects();
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planning': 'info',
      'Active': 'success',
      'On Hold': 'warning',
      'Completed': 'default',
      'Cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateProject}
        >
          New Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} mb={3}>
        <TextField
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ flex: 1 }}
        />
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
          SelectProps={{ native: true }}
        >
          <option value="">All Status</option>
          <option value="Planning">Planning</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </TextField>
      </Box>

      <Grid container spacing={3}>
        {filteredProjects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6" gutterBottom>
                    {project.name}
                  </Typography>
                  <Chip
                    label={project.status}
                    color={getStatusColor(project.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {project.description || 'No description'}
                </Typography>

                {project.manager && (
                  <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                    Manager: {project.manager.firstName} {project.manager.lastName}
                  </Typography>
                )}

                {project.tasks && (
                  <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                    Tasks: {project.tasks.length}
                  </Typography>
                )}

                {project.clientName && (
                  <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                    Client: {project.clientName}
                  </Typography>
                )}

                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <IconButton
                    size="small"
                    onClick={() => handleViewProject(project.id)}
                    title="View Details"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleEditProject(project)}
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteProject(project.id)}
                    title="Delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredProjects.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No projects found
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleCreateProject}
            sx={{ mt: 2 }}
          >
            Create Your First Project
          </Button>
        </Box>
      )}

      <Dialog open={openForm} onClose={handleFormClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent>
          <ProjectForm
            project={selectedProject}
            onSave={handleFormSave}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProjectList;
