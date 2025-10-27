const db = require('../models');
const { Employee, Task, Project } = db;

/**
 * Enhanced task availability validation helper
 * Provides comprehensive validation for task access permissions
 */
class TaskValidator {
  /**
   * Validate if an employee can access a specific task
   * @param {string} taskId - UUID of the task
   * @param {string} employeeId - UUID of the employee
   * @param {string} userRole - Role of the user (admin, manager, employee)
   * @returns {Promise<Object>} Validation result with detailed information
   */
  static async validateTaskAccess(taskId, employeeId, userRole = 'employee') {
    try {
      // Validate task exists and is active
      const task = await Task.findByPk(taskId, {
        include: [{
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status', 'isActive']
        }]
      });

      if (!task) {
        return {
          isValid: false,
          error: 'TASK_NOT_FOUND',
          message: 'Task not found or has been deleted.',
          details: {
            taskId,
            error: 'Task does not exist in the database'
          },
          hint: 'Please verify the task ID or contact your manager for assistance.'
        };
      }

      if (!task.isActive) {
        return {
          isValid: false,
          error: 'TASK_INACTIVE',
          message: 'This task has been deactivated.',
          details: {
            taskId,
            taskName: task.name,
            status: task.status
          },
          hint: 'Contact your manager to reactivate this task if needed.'
        };
      }

      // Validate associated project is active
      if (!task.project) {
        return {
          isValid: false,
          error: 'PROJECT_NOT_FOUND',
          message: 'The project associated with this task no longer exists.',
          details: {
            taskId,
            taskName: task.name
          },
          hint: 'This task may be orphaned. Contact your administrator.'
        };
      }

      if (!task.project.isActive) {
        return {
          isValid: false,
          error: 'PROJECT_INACTIVE',
          message: 'The project associated with this task is inactive.',
          details: {
            taskId,
            taskName: task.name,
            projectId: task.project.id,
            projectName: task.project.name,
            projectStatus: task.project.status
          },
          hint: 'Contact your manager to reactivate the project or reassign the task.'
        };
      }

      // Admin and manager roles have full access
      if (['admin', 'manager'].includes(userRole)) {
        return {
          isValid: true,
          task,
          accessReason: 'Administrative privileges'
        };
      }

      // For employees, check specific access rules
      if (task.availableToAll) {
        return {
          isValid: true,
          task,
          accessReason: 'Task is available to all employees'
        };
      }

      if (task.assignedTo === employeeId) {
        return {
          isValid: true,
          task,
          accessReason: 'Task is specifically assigned to you'
        };
      }

      // Employee doesn't have access
      return {
        isValid: false,
        error: 'ACCESS_DENIED',
        message: 'This task is not available to any employees. Please contact your manager.',
        details: {
          taskId,
          taskName: task.name,
          availableToAll: task.availableToAll,
          assignedTo: task.assignedTo,
          currentEmployee: employeeId,
          reason: 'Task has no assignments'
        },
        hint: 'Contact your manager to request access to this task or to have it assigned to you.'
      };

    } catch (error) {
      console.error('Error validating task access:', error);
      return {
        isValid: false,
        error: 'VALIDATION_ERROR',
        message: 'Unable to validate task access due to system error.',
        details: {
          taskId,
          employeeId,
          systemError: error.message
        },
        hint: 'Please try again or contact support if the problem persists.'
      };
    }
  }

  /**
   * Validate multiple tasks for batch operations
   * @param {Array<string>} taskIds - Array of task UUIDs
   * @param {string} employeeId - UUID of the employee
   * @param {string} userRole - Role of the user
   * @returns {Promise<Object>} Batch validation result
   */
  static async validateBatchTaskAccess(taskIds, employeeId, userRole = 'employee') {
    const results = {
      valid: [],
      invalid: [],
      summary: {
        total: taskIds.length,
        accessible: 0,
        denied: 0
      }
    };

    for (const taskId of taskIds) {
      const validation = await this.validateTaskAccess(taskId, employeeId, userRole);
      
      if (validation.isValid) {
        results.valid.push({
          taskId,
          task: validation.task,
          accessReason: validation.accessReason
        });
        results.summary.accessible++;
      } else {
        results.invalid.push({
          taskId,
          error: validation.error,
          message: validation.message,
          details: validation.details,
          hint: validation.hint
        });
        results.summary.denied++;
      }
    }

    return results;
  }

  /**
   * Get all accessible tasks for an employee
   * @param {string} employeeId - UUID of the employee
   * @param {string} userRole - Role of the user
   * @param {Object} filters - Additional filters (projectId, status, etc.)
   * @returns {Promise<Array>} Array of accessible tasks
   */
  static async getAccessibleTasks(employeeId, userRole = 'employee', filters = {}) {
    try {
      let whereCondition = { isActive: true };

      // Apply additional filters
      if (filters.projectId) {
        whereCondition.projectId = filters.projectId;
      }
      if (filters.status) {
        whereCondition.status = filters.status;
      }

      // Role-based access control
      if (userRole === 'employee') {
        whereCondition = {
          ...whereCondition,
          [db.Sequelize.Op.or]: [
            { availableToAll: true },
            { assignedTo: employeeId }
          ]
        };
      }

      const tasks = await Task.findAll({
        where: whereCondition,
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name', 'status'],
            where: { isActive: true }
          },
          {
            model: Employee,
            as: 'assignee',
            attributes: ['id', 'employeeId', 'firstName', 'lastName'],
            required: false
          }
        ]
      });

      return tasks;
    } catch (error) {
      console.error('Error getting accessible tasks:', error);
      throw new Error('Failed to retrieve accessible tasks');
    }
  }
}

module.exports = TaskValidator;