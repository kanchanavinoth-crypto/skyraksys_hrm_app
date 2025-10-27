const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth.simple');
const db = require('../models');

const Position = db.Position;
const Department = db.Department;
const Employee = db.Employee;
const router = express.Router();

// Get all positions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const positions = await Position.findAll({
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'description']
        },
        {
          model: Employee,
          as: 'employees',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'status']
        }
      ]
    });

    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch positions'
    });
  }
});

// Get position by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const position = await Position.findByPk(req.params.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'description']
        },
        {
          model: Employee,
          as: 'employees',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'status']
        }
      ]
    });

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    res.json({
      success: true,
      data: position
    });
  } catch (error) {
    console.error('Error fetching position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch position'
    });
  }
});

// Create new position (admin/hr only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'Admin or HR access required'
      });
    }

    const { title, description, departmentId, level } = req.body;

    // Validate required fields
    if (!title || !departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Title and departmentId are required'
      });
    }

    // Check if department exists
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    const position = await Position.create({
      title,
      description,
      departmentId,
      level: level || 'entry'
    });

    const createdPosition = await Position.findByPk(position.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Position created successfully',
      data: createdPosition
    });
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create position'
    });
  }
});

// Update position (admin/hr only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'Admin or HR access required'
      });
    }

    const { title, description, departmentId, level } = req.body;
    
    const position = await Position.findByPk(req.params.id);
    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    // If departmentId is being changed, validate it exists
    if (departmentId && departmentId !== position.departmentId) {
      const department = await Department.findByPk(departmentId);
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    await position.update({
      title: title || position.title,
      description: description || position.description,
      departmentId: departmentId || position.departmentId,
      level: level || position.level
    });

    const updatedPosition = await Position.findByPk(position.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Position updated successfully',
      data: updatedPosition
    });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update position'
    });
  }
});

// Delete position (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const position = await Position.findByPk(req.params.id);
    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    // Check if position has employees
    const employeeCount = await Employee.count({ where: { positionId: req.params.id } });
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete position with assigned employees'
      });
    }

    await position.destroy();

    res.json({
      success: true,
      message: 'Position deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete position'
    });
  }
});

module.exports = router;
