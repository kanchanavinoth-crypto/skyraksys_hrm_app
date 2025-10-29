const express = require('express');
const { authenticateToken } = require('../middleware/auth.simple');
const { taskSchema } = require('../middleware/validation');
const db = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Helper: Check if user can modify tasks
const canModifyTasks = (role) => ['admin', 'manager'].includes(role);

// Helper: Check if user can access task
const canAccessTask = async (task, userId, role) => {
  if (canModifyTasks(role)) return true;
  
  const employee = await db.Employee.findOne({ where: { userId } });
  return task.availableToAll || task.assignedTo === employee?.id;
};

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieve tasks with optional filtering by project, status, priority
 *     tags: [Projects & Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Create new task
 *     description: Create a new task - Admin/Manager only
 *     tags: [Projects & Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - projectId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *               availableToAll:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Get all tasks (with optional project filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, status, priority } = req.query;
    
    let whereCondition = { isActive: true };
    
    // Add filters
    if (projectId) whereCondition.projectId = projectId;
    if (status) whereCondition.status = status;
    if (priority) whereCondition.priority = priority;
    
    // Role-based filtering
    if (req.userRole === 'employee') {
      whereCondition[Op.or] = [
        { availableToAll: true },
        { assignedTo: req.employeeId }
      ];
    }

    console.log('📋 Fetching tasks with conditions:', {
      role: req.userRole,
      employeeId: req.employeeId,
      whereCondition,
      filters: { projectId, status, priority }
    });

    const tasks = await db.Task.findAll({
      where: whereCondition,
      include: [
        {
          model: db.Project,
          as: 'project',
          attributes: ['id', 'name', 'status']
        },
        {
          model: db.Employee,
          as: 'assignee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Fetched ${tasks.length} tasks`);

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('❌ Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get task by ID
/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: Retrieve detailed task information
 *     tags: [Projects & Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update task
 *     description: Update task details - Admin/Manager only
 *     tags: [Projects & Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await db.Task.findByPk(req.params.id, {
      include: [
        {
          model: db.Project,
          as: 'project',
          attributes: ['id', 'name', 'status', 'description']
        },
        {
          model: db.Employee,
          as: 'assignee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check access permission
    if (!await canAccessTask(task, req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this task'
      });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('❌ Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task'
    });
  }
});

// Create new task (admin/manager only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!canModifyTasks(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create tasks'
      });
    }

    // Validate input
    const { error, value } = taskSchema.create.validate(req.body, { abortEarly: false });
    
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

    // Normalize empty assignedTo
    if (value.assignedTo === '' || value.availableToAll) {
      value.assignedTo = null;
    }

    // Validate project exists and is active
    const project = await db.Project.findByPk(value.projectId);
    if (!project || !project.isActive) {
      return res.status(400).json({
        success: false,
        message: project ? 'Cannot create task for inactive project' : 'Project not found'
      });
    }

    // Validate assignee if provided
    if (value.assignedTo) {
      const assignee = await db.Employee.findByPk(value.assignedTo);
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: 'Assignee not found'
        });
      }
    }

    // Create task
    const task = await db.Task.create(value);

    // Return with relations
    const createdTask = await db.Task.findByPk(task.id, {
      include: [
        { model: db.Project, as: 'project', attributes: ['id', 'name', 'status'] },
        { model: db.Employee, as: 'assignee', attributes: ['id', 'employeeId', 'firstName', 'lastName'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: createdTask
    });
  } catch (error) {
    console.error('❌ Error creating task:', error);
    
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Database validation failed',
        errors: error.errors?.map(e => ({ field: e.path, message: e.message }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = taskSchema.update.validate(req.body, { abortEarly: false });
    
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

    const task = await db.Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (!canModifyTasks(req.user.role)) {
      const employee = await db.Employee.findOne({ where: { userId: req.user.id } });
      if (!employee || task.assignedTo !== employee.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only update tasks assigned to you'
        });
      }
      
      // Employees can only update specific fields
      const allowedFields = ['status', 'actualHours', 'description'];
      const updateKeys = Object.keys(value);
      const invalidFields = updateKeys.filter(key => !allowedFields.includes(key));
      
      if (invalidFields.length > 0) {
        return res.status(403).json({
          success: false,
          message: `Employees can only update: ${allowedFields.join(', ')}`,
          invalidFields
        });
      }
    }

    // Normalize empty assignedTo
    if (value.assignedTo === '' || value.availableToAll === true) {
      value.assignedTo = null;
    }

    // Validate assignee if provided
    if (value.assignedTo && !value.availableToAll) {
      const assignee = await db.Employee.findByPk(value.assignedTo);
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: 'Assignee not found'
        });
      }
    }

    // Update task
    await task.update(value);

    // Return with relations
    const updatedTask = await db.Task.findByPk(task.id, {
      include: [
        { model: db.Project, as: 'project', attributes: ['id', 'name', 'status'] },
        { model: db.Employee, as: 'assignee', attributes: ['id', 'employeeId', 'firstName', 'lastName'] }
      ]
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('❌ Error updating task:', error);
    
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Database validation failed',
        errors: error.errors?.map(e => ({ field: e.path, message: e.message }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

// Delete task (admin/manager only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!canModifyTasks(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin or Manager access required'
      });
    }

    const task = await db.Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Soft delete
    await task.update({ isActive: false });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

// Bulk create tasks (admin/manager only)
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    if (!canModifyTasks(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    const { tasks } = req.body;
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: tasks must be a non-empty array'
      });
    }

    // Validate all tasks
    const validationErrors = [];
    for (let i = 0; i < tasks.length; i++) {
      const { error } = taskSchema.create.validate(tasks[i]);
      if (error) {
        validationErrors.push({ index: i, errors: error.details });
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for some tasks',
        errors: validationErrors
      });
    }

    // Create tasks
    const createdTasks = await db.Task.bulkCreate(tasks);

    res.status(201).json({
      success: true,
      message: `${createdTasks.length} tasks created successfully`,
      data: createdTasks
    });
  } catch (error) {
    console.error('❌ Error bulk creating tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tasks'
    });
  }
});

module.exports = router;
