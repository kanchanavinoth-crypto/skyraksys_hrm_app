import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Typography
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import TaskService from '../../services/TaskService';

const TaskList = ({ tasks, onUpdate }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await TaskService.updateStatus(selectedTask.id, newStatus);
      handleMenuClose();
      onUpdate();
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await TaskService.delete(taskId);
      onUpdate();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'default',
      'In Progress': 'primary',
      'Completed': 'success',
      'On Hold': 'warning'
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

  if (!tasks || tasks.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body2" color="text.secondary">
          No tasks found
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Task Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Assignee</TableCell>
              <TableCell>Estimated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {task.name}
                  </Typography>
                  {task.description && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {task.description.substring(0, 50)}...
                    </Typography>
                  )}
                </TableCell>
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
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {task.availableToAll ? (
                    <Chip label="All" size="small" variant="outlined" />
                  ) : task.assignee ? (
                    <Typography variant="body2">
                      {task.assignee.firstName} {task.assignee.lastName}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Unassigned
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {task.estimatedHours ? `${task.estimatedHours}h` : '-'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, task)}
                  >
                    <MoreIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange('Not Started')}>
          Mark as Not Started
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('In Progress')}>
          Mark as In Progress
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('Completed')}>
          Mark as Completed
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('On Hold')}>
          Mark as On Hold
        </MenuItem>
        <MenuItem divider />
        <MenuItem onClick={() => handleDelete(selectedTask.id)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

export default TaskList;
