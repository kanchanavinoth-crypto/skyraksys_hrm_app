const express = require('express');
const { authenticateToken } = require('../middleware/auth.simple');
const { projectSchema } = require('../middleware/validation');
const db = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Helper: Check if user can modify projects
const canModifyProjects = (role) => ['admin', 'manager'].includes(role);

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, managerId } = req.query;
    
    let whereCondition = { isActive: true };
    if (status) whereCondition.status = status;
    if (managerId) whereCondition.managerId = managerId;

    // Build include options based on user role
    const taskInclude = {
      model: db.Task,
      as: 'tasks',
      attributes: ['id', 'name', 'status', 'priority', 'assignedTo', 'availableToAll'],
      where: { isActive: true },
      required: false,
      separate: true // This ensures projects without tasks are still shown
    };

    // Filter tasks for employees (but don't filter projects)
    if (req.userRole === 'employee') {
      taskInclude.where = {
        isActive: true,
        [Op.or]: [
          { availableToAll: true },
          { assignedTo: req.employeeId }
        ]
      };
    }

    const projects = await db.Project.findAll({
      where: whereCondition,
      include: [
        {
          model: db.Employee,
          as: 'manager',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email']
        },
        taskInclude
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Fetched ${projects.length} projects for role: ${req.userRole}`);

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get project by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await db.Project.findByPk(req.params.id, {
      include: [
        {
          model: db.Employee,
          as: 'manager',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email']
        },
        {
          model: db.Task,
          as: 'tasks',
          where: { isActive: true },
          required: false,
          include: [{
            model: db.Employee,
            as: 'assignee',
            attributes: ['id', 'employeeId', 'firstName', 'lastName']
          }]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('❌ Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project'
    });
  }
});

// Create new project (admin/manager only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!canModifyProjects(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create projects'
      });
    }

    // Validate input
    const { error, value } = projectSchema.create.validate(req.body, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    // Validate manager if provided
    if (value.managerId) {
      const manager = await db.Employee.findByPk(value.managerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Manager not found'
        });
      }
    }

    // Validate dates
    if (value.startDate && value.endDate && new Date(value.endDate) < new Date(value.startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Create project
    const project = await db.Project.create(value);

    // Return with manager details
    const createdProject = await db.Project.findByPk(project.id, {
      include: [{
        model: db.Employee,
        as: 'manager',
        attributes: ['id', 'employeeId', 'firstName', 'lastName']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: createdProject
    });
  } catch (error) {
    console.error('❌ Error creating project:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Project name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create project'
    });
  }
});

// Update project (admin/manager only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (!canModifyProjects(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update projects'
      });
    }

    // Validate input
    const { error, value } = projectSchema.update.validate(req.body, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    const project = await db.Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Validate manager if provided
    if (value.managerId) {
      const manager = await db.Employee.findByPk(value.managerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Manager not found'
        });
      }
    }

    // Validate dates
    const finalStartDate = value.startDate || project.startDate;
    const finalEndDate = value.endDate || project.endDate;
    
    if (finalStartDate && finalEndDate && new Date(finalEndDate) < new Date(finalStartDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Update project
    await project.update(value);

    // Return with manager details
    const updatedProject = await db.Project.findByPk(project.id, {
      include: [{
        model: db.Employee,
        as: 'manager',
        attributes: ['id', 'employeeId', 'firstName', 'lastName']
      }]
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    console.error('❌ Error updating project:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Project name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  }
});

// Delete project (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const project = await db.Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Soft delete
    await project.update({ isActive: false });
    
    // Also soft delete associated tasks
    await db.Task.update(
      { isActive: false },
      { where: { projectId: req.params.id } }
    );

    res.json({
      success: true,
      message: 'Project and associated tasks deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
});

// Get project statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const project = await db.Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const tasks = await db.Task.findAll({
      where: { projectId: req.params.id, isActive: true },
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', '*'), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('estimatedHours')), 'totalEstimated'],
        [db.sequelize.fn('SUM', db.sequelize.col('actualHours')), 'totalActual']
      ],
      group: ['status'],
      raw: true
    });

    const stats = {
      projectId: project.id,
      projectName: project.name,
      projectStatus: project.status,
      tasksByStatus: tasks,
      totalTasks: tasks.reduce((sum, t) => sum + parseInt(t.count), 0)
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ Error fetching project stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project statistics'
    });
  }
});

module.exports = router;
