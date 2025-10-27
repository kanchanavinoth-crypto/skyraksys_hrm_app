const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all employee reviews (with filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      employeeId, 
      reviewerId, 
      status, 
      reviewType, 
      reviewPeriod,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build where conditions
    const whereConditions = {};
    
    if (employeeId) whereConditions.employeeId = employeeId;
    if (reviewerId) whereConditions.reviewerId = reviewerId;
    if (status) whereConditions.status = status;
    if (reviewType) whereConditions.reviewType = reviewType;
    if (reviewPeriod) whereConditions.reviewPeriod = { [Op.like]: `%${reviewPeriod}%` };

    // Role-based access control
    if (req.user.role === 'Employee') {
      // Employees can only see their own reviews
      const employee = await db.Employee.findOne({ where: { userId: req.user.id } });
      if (employee) {
        whereConditions.employeeId = employee.id;
      } else {
        return res.status(404).json({ message: 'Employee profile not found' });
      }
    } else if (req.user.role === 'Manager') {
      // Managers can see reviews for employees they manage
      // (This would need additional logic to determine which employees a manager manages)
      // For now, allow managers to see reviews they created
      whereConditions.reviewerId = req.user.id;
    }
    // Admin and HR can see all reviews (no additional restrictions)

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await db.EmployeeReview.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: db.Employee,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName', 'employeeId'],
          include: [{
            model: db.Position,
            as: 'position',
            attributes: ['title']
          }, {
            model: db.Department,
            as: 'department',
            attributes: ['name']
          }]
        },
        {
          model: db.User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: db.User,
          as: 'hrApprover',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      reviews: reviews.rows,
      totalCount: reviews.count,
      totalPages: Math.ceil(reviews.count / parseInt(limit)),
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('Error fetching employee reviews:', error);
    res.status(500).json({ 
      message: 'Error fetching employee reviews',
      error: error.message 
    });
  }
});

// Get a specific employee review
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;

    const review = await db.EmployeeReview.findByPk(reviewId, {
      include: [
        {
          model: db.Employee,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName', 'employeeId', 'email', 'phoneNumber'],
          include: [{
            model: db.Position,
            as: 'position',
            attributes: ['title']
          }, {
            model: db.Department,
            as: 'department',
            attributes: ['name']
          }]
        },
        {
          model: db.User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: db.User,
          as: 'hrApprover',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Role-based access control
    if (req.user.role === 'Employee') {
      const employee = await db.Employee.findOne({ where: { userId: req.user.id } });
      if (!employee || review.employeeId !== employee.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'Manager') {
      // Managers can only see reviews they created or for employees they manage
      if (review.reviewerId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(review);

  } catch (error) {
    console.error('Error fetching employee review:', error);
    res.status(500).json({ 
      message: 'Error fetching employee review',
      error: error.message 
    });
  }
});

// Create a new employee review
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Only Admin, HR, and Managers can create reviews
    if (!['Admin', 'HR', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Only Admin, HR, and Managers can create reviews.' });
    }

    const {
      employeeId,
      reviewPeriod,
      reviewType,
      overallRating,
      technicalSkills,
      communication,
      teamwork,
      leadership,
      punctuality,
      achievements,
      areasForImprovement,
      goals,
      reviewerComments,
      reviewDate,
      nextReviewDate
    } = req.body;

    // Validate required fields
    if (!employeeId || !reviewPeriod) {
      return res.status(400).json({ 
        message: 'Employee ID and review period are required' 
      });
    }

    // Check if employee exists
    const employee = await db.Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check for duplicate review for the same period
    const existingReview = await db.EmployeeReview.findOne({
      where: {
        employeeId: employeeId,
        reviewPeriod: reviewPeriod,
        reviewType: reviewType || 'quarterly'
      }
    });

    if (existingReview) {
      return res.status(400).json({ 
        message: 'A review for this employee and period already exists' 
      });
    }

    const review = await db.EmployeeReview.create({
      employeeId,
      reviewerId: req.user.id,
      reviewPeriod,
      reviewType: reviewType || 'quarterly',
      overallRating,
      technicalSkills,
      communication,
      teamwork,
      leadership,
      punctuality,
      achievements,
      areasForImprovement,
      goals,
      reviewerComments,
      reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
      nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
      status: 'draft'
    });

    // Fetch the complete review with associations
    const createdReview = await db.EmployeeReview.findByPk(review.id, {
      include: [
        {
          model: db.Employee,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName', 'employeeId']
        },
        {
          model: db.User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ]
    });

    res.status(201).json({
      message: 'Employee review created successfully',
      review: createdReview
    });

  } catch (error) {
    console.error('Error creating employee review:', error);
    res.status(500).json({ 
      message: 'Error creating employee review',
      error: error.message 
    });
  }
});

// Update an employee review
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;

    const review = await db.EmployeeReview.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Role-based access control
    if (req.user.role === 'Employee') {
      // Employees can only update their self-assessment
      const employee = await db.Employee.findOne({ where: { userId: req.user.id } });
      if (!employee || review.employeeId !== employee.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      // Only allow updating self-assessment
      const { employeeSelfAssessment } = req.body;
      await review.update({ 
        employeeSelfAssessment,
        status: 'pending_approval' // Move to next stage after employee input
      });
    } else if (req.user.role === 'Manager') {
      // Managers can update reviews they created
      if (review.reviewerId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      await review.update(req.body);
    } else if (['Admin', 'HR'].includes(req.user.role)) {
      // Admin and HR can update any review
      await review.update(req.body);
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch updated review with associations
    const updatedReview = await db.EmployeeReview.findByPk(reviewId, {
      include: [
        {
          model: db.Employee,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName', 'employeeId']
        },
        {
          model: db.User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: db.User,
          as: 'hrApprover',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({
      message: 'Employee review updated successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('Error updating employee review:', error);
    res.status(500).json({ 
      message: 'Error updating employee review',
      error: error.message 
    });
  }
});

// Update review status (submit, approve, etc.)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { status, hrApproved } = req.body;

    const review = await db.EmployeeReview.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const updateData = { status };

    // Handle HR approval
    if (hrApproved !== undefined && ['Admin', 'HR'].includes(req.user.role)) {
      updateData.hrApproved = hrApproved;
      if (hrApproved) {
        updateData.hrApprovedBy = req.user.id;
        updateData.hrApprovedAt = new Date();
        updateData.status = 'completed';
      }
    }

    await review.update(updateData);

    // Fetch updated review
    const updatedReview = await db.EmployeeReview.findByPk(reviewId, {
      include: [
        {
          model: db.Employee,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName', 'employeeId']
        },
        {
          model: db.User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ]
    });

    res.json({
      message: 'Review status updated successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ 
      message: 'Error updating review status',
      error: error.message 
    });
  }
});

// Delete an employee review
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;

    // Only Admin and HR can delete reviews
    if (!['Admin', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Only Admin and HR can delete reviews.' });
    }

    const review = await db.EmployeeReview.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.destroy();

    res.json({ message: 'Employee review deleted successfully' });

  } catch (error) {
    console.error('Error deleting employee review:', error);
    res.status(500).json({ 
      message: 'Error deleting employee review',
      error: error.message 
    });
  }
});

// Get review statistics/dashboard
router.get('/meta/dashboard', authenticateToken, async (req, res) => {
  try {
    const whereCondition = {};

    // Role-based filtering
    if (req.user.role === 'Manager') {
      whereCondition.reviewerId = req.user.id;
    } else if (req.user.role === 'Employee') {
      const employee = await db.Employee.findOne({ where: { userId: req.user.id } });
      if (employee) {
        whereCondition.employeeId = employee.id;
      }
    }

    const stats = await Promise.all([
      // Total reviews
      db.EmployeeReview.count({ where: whereCondition }),
      
      // Reviews by status
      db.EmployeeReview.findAll({
        where: whereCondition,
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['status']
      }),
      
      // Reviews by type
      db.EmployeeReview.findAll({
        where: whereCondition,
        attributes: [
          'reviewType',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['reviewType']
      }),
      
      // Average ratings
      db.EmployeeReview.findOne({
        where: {
          ...whereCondition,
          overallRating: { [Op.not]: null }
        },
        attributes: [
          [db.sequelize.fn('AVG', db.sequelize.col('overallRating')), 'avgOverallRating'],
          [db.sequelize.fn('AVG', db.sequelize.col('technicalSkills')), 'avgTechnicalSkills'],
          [db.sequelize.fn('AVG', db.sequelize.col('communication')), 'avgCommunication'],
          [db.sequelize.fn('AVG', db.sequelize.col('teamwork')), 'avgTeamwork']
        ]
      })
    ]);

    res.json({
      totalReviews: stats[0],
      reviewsByStatus: stats[1],
      reviewsByType: stats[2],
      averageRatings: stats[3]
    });

  } catch (error) {
    console.error('Error fetching review dashboard:', error);
    res.status(500).json({ 
      message: 'Error fetching review dashboard',
      error: error.message 
    });
  }
});

module.exports = router;
