const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { PayslipTemplate } = require('../models');
const { authenticateToken, authorize, isAdminOrHR } = require('../middleware/auth.simple');
const { Op } = require('sequelize');

// Debug endpoint - NO AUTH
router.get('/debug/test', async (req, res) => {
  try {
    const count = await PayslipTemplate.count();
    res.json({
      success: true,
      message: 'Backend is working!',
      timestamp: new Date().toISOString(),
      templatesCount: count,
      authMiddleware: typeof isAdminOrHR,
      isFunction: typeof isAdminOrHR === 'function'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @swagger
 * /payslip-templates:
 *   get:
 *     summary: Get all payslip templates
 *     description: Retrieve all payslip templates with optional filtering and pagination
 *     tags: [Payslip Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in template name and description
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Successfully retrieved templates
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         templates:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/PayslipTemplate'
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', 
  (req, res, next) => {
    console.log('🔍 GET /payslip-templates request received');
    next();
  },
  authenticateToken,
  isAdminOrHR,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('isActive').optional().isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    console.log('✅ GET /payslip-templates - Reached handler, user:', req.userRole);
    try {
      const {
        page = 1,
        limit = 20,
        search,
        isActive
      } = req.query;

      const where = {};
      
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const offset = (page - 1) * limit;

      const { count, rows: templates } = await PayslipTemplate.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          templates,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching payslip templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payslip templates',
        error: error.message
      });
    }
  }
);

// GET /api/payslip-templates/active - Get active templates only
router.get('/active', 
  authenticateToken,
  async (req, res) => {
    try {
      const templates = await PayslipTemplate.findAll({
        where: { isActive: true },
        attributes: ['id', 'name', 'description', 'templateData'],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching active templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active templates',
        error: error.message
      });
    }
  }
);

// GET /api/payslip-templates/:id - Get single template
router.get('/:id',
  authenticateToken,
  isAdminOrHR,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const template = await PayslipTemplate.findByPk(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template',
        error: error.message
      });
    }
  }
);

// POST /api/payslip-templates - Create new template
router.post('/',
  authenticateToken,
  isAdminOrHR,
  [
    body('name').notEmpty().trim().isLength({ min: 3, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('templateData').isObject(),
    body('templateData.earnings').isObject(),
    body('templateData.deductions').isObject(),
    body('isActive').optional().isBoolean(),
    body('isDefault').optional().isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, description, templateData, isActive, isDefault } = req.body;

      // Check if template name already exists
      const existingTemplate = await PayslipTemplate.findOne({
        where: { name: name.trim() }
      });

      if (existingTemplate) {
        return res.status(400).json({
          success: false,
          message: 'Template name already exists'
        });
      }

      // If this is set as default, remove default flag from other templates
      if (isDefault) {
        await PayslipTemplate.update(
          { isDefault: false },
          { where: { isDefault: true } }
        );
      }

      const template = await PayslipTemplate.create({
        name: name.trim(),
        description: description?.trim(),
        templateData,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
        createdBy: req.employeeId || null
      });

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template
      });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: error.message
      });
    }
  }
);

// PUT /api/payslip-templates/:id - Update template
router.put('/:id',
  authenticateToken,
  isAdminOrHR,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 3, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('version').optional().trim().isLength({ max: 20 }),
    body('templateData').optional().isObject(),
    body('isActive').optional().isBoolean(),
    body('isDefault').optional().isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const template = await PayslipTemplate.findByPk(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Check if name already exists (excluding current template)
      if (updateData.name) {
        const existingTemplate = await PayslipTemplate.findOne({
          where: { 
            name: updateData.name.trim(),
            id: { [Op.ne]: id }
          }
        });

        if (existingTemplate) {
          return res.status(400).json({
            success: false,
            message: 'Template name already exists'
          });
        }
        updateData.name = updateData.name.trim();
      }

      if (updateData.description !== undefined) {
        updateData.description = updateData.description?.trim();
      }

      // If this is set as default, remove default flag from other templates
      if (updateData.isDefault) {
        await PayslipTemplate.update(
          { isDefault: false },
          { where: { isDefault: true, id: { [Op.ne]: id } } }
        );
      }

      // Use employeeId if available, otherwise null
      updateData.updatedBy = req.employeeId || null;
      await template.update(updateData);

      res.json({
        success: true,
        message: 'Template updated successfully',
        data: template
      });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update template',
        error: error.message
      });
    }
  }
);

// POST /api/payslip-templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate',
  authenticateToken,
  isAdminOrHR,
  [
    param('id').isUUID(),
    body('name').notEmpty().trim().isLength({ min: 3, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const originalTemplate = await PayslipTemplate.findByPk(id);
      if (!originalTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Check if new name already exists
      const existingTemplate = await PayslipTemplate.findOne({
        where: { name: name.trim() }
      });

      if (existingTemplate) {
        return res.status(400).json({
          success: false,
          message: 'Template name already exists'
        });
      }

      const duplicatedTemplate = await PayslipTemplate.create({
        name: name.trim(),
        description: `Copy of ${originalTemplate.name}`,
        templateData: originalTemplate.templateData,
        isActive: true,
        isDefault: false,
        createdBy: req.employeeId || null
      });

      res.status(201).json({
        success: true,
        message: 'Template duplicated successfully',
        data: duplicatedTemplate
      });
    } catch (error) {
      console.error('Error duplicating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to duplicate template',
        error: error.message
      });
    }
  }
);

// POST /api/payslip-templates/:id/set-default - Set as default template
router.post('/:id/set-default',
  authenticateToken,
  isAdminOrHR,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const template = await PayslipTemplate.findByPk(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Remove default flag from all templates
      await PayslipTemplate.update(
        { isDefault: false },
        { where: { isDefault: true } }
      );

      // Set current template as default
      await template.update({ 
        isDefault: true,
        isActive: true,
        updatedBy: req.employeeId || null
      });

      res.json({
        success: true,
        message: 'Template set as default successfully',
        data: template
      });
    } catch (error) {
      console.error('Error setting default template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set default template',
        error: error.message
      });
    }
  }
);

// POST /api/payslip-templates/:id/toggle-status - Toggle active status
router.post('/:id/toggle-status',
  authenticateToken,
  isAdminOrHR,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const template = await PayslipTemplate.findByPk(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Prevent deactivating default template
      if (template.isDefault && template.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate default template'
        });
      }

      await template.update({ 
        isActive: !template.isActive,
        updatedBy: req.user.id
      });

      res.json({
        success: true,
        message: `Template ${template.isActive ? 'activated' : 'deactivated'} successfully`,
        data: template
      });
    } catch (error) {
      console.error('Error toggling template status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle template status',
        error: error.message
      });
    }
  }
);

// DELETE /api/payslip-templates/:id - Delete template
router.delete('/:id',
  authenticateToken,
  authorize('admin'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const template = await PayslipTemplate.findByPk(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Prevent deleting default template
      if (template.isDefault) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete default template'
        });
      }

      // Check if template is in use
      const { Payslip } = require('../models');
      const payslipsUsingTemplate = await Payslip.count({
        where: { templateId: id }
      });

      if (payslipsUsingTemplate > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete template. It is used by ${payslipsUsingTemplate} payslips.`
        });
      }

      await template.destroy();

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete template',
        error: error.message
      });
    }
  }
);

// GET /api/payslip-templates/default - Get default template
router.get('/default/template',
  authenticateToken,
  async (req, res) => {
    try {
      const defaultTemplate = await PayslipTemplate.findOne({
        where: { isDefault: true, isActive: true }
      });

      if (!defaultTemplate) {
        // If no default template exists, create one
        const DEFAULT_TEMPLATE_DATA = {
          earnings: {
            basicSalary: { label: 'Basic Salary', isActive: true, isRequired: true, order: 1 },
            hra: { label: 'House Rent Allowance', isActive: true, isRequired: false, order: 2 },
            conveyanceAllowance: { label: 'Conveyance Allowance', isActive: true, isRequired: false, order: 3 },
            medicalAllowance: { label: 'Medical Allowance', isActive: true, isRequired: false, order: 4 },
            specialAllowance: { label: 'Special Allowance', isActive: true, isRequired: false, order: 5 },
            performanceBonus: { label: 'Performance Bonus', isActive: false, isRequired: false, order: 6 },
            overtimeAllowance: { label: 'Overtime Allowance', isActive: false, isRequired: false, order: 7 }
          },
          deductions: {
            providentFund: { label: 'Provident Fund', isActive: true, isRequired: true, order: 1 },
            esic: { label: 'ESIC', isActive: true, isRequired: false, order: 2 },
            professionalTax: { label: 'Professional Tax', isActive: true, isRequired: false, order: 3 },
            tds: { label: 'TDS', isActive: true, isRequired: false, order: 4 },
            loanDeduction: { label: 'Loan Deduction', isActive: false, isRequired: false, order: 5 },
            otherDeductions: { label: 'Other Deductions', isActive: false, isRequired: false, order: 6 }
          },
          calculations: {
            pf: { percentage: 12, maxAmount: null },
            esic: { percentage: 0.75, maxAmount: 21000 },
            professionalTax: { 
              slabs: [
                { min: 0, max: 10000, amount: 0 },
                { min: 10001, max: 15000, amount: 150 },
                { min: 15001, max: 25000, amount: 200 },
                { min: 25001, max: null, amount: 300 }
              ]
            }
          }
        };

        const newDefaultTemplate = await PayslipTemplate.create({
          name: 'Default Payslip Template',
          description: 'Standard payslip template with Indian statutory deductions',
          templateData: DEFAULT_TEMPLATE_DATA,
          isActive: true,
          isDefault: true,
          createdBy: req.employeeId || null
        });

        return res.json({
          success: true,
          data: newDefaultTemplate
        });
      }

      res.json({
        success: true,
        data: defaultTemplate
      });
    } catch (error) {
      console.error('Error fetching default template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch default template',
        error: error.message
      });
    }
  }
);

module.exports = router;
