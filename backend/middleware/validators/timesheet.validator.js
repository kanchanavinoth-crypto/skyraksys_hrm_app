/**
 * Timesheet Validation Schemas
 * 
 * Joi schemas for validating timesheet-related requests
 */

const Joi = require('joi');

/**
 * Schema for timesheet entry
 */
const timesheetEntrySchema = Joi.object({
  date: Joi.date()
    .required()
    .max('now')
    .messages({
      'date.max': 'Cannot create timesheet entries for future dates'
    }),

  hours: Joi.number()
    .required()
    .min(0)
    .max(24)
    .precision(2)
    .messages({
      'number.min': 'Hours must be at least 0',
      'number.max': 'Hours cannot exceed 24 per day'
    }),

  taskId: Joi.string()
    .required()
    .uuid()
    .messages({
      'string.guid': 'Task ID must be a valid UUID'
    }),

  description: Joi.string()
    .required()
    .min(5)
    .max(500)
    .messages({
      'string.min': 'Description must be at least 5 characters',
      'string.max': 'Description cannot exceed 500 characters'
    })
});

/**
 * Schema for creating a new timesheet
 */
const createTimesheetSchema = Joi.object({
  employeeId: Joi.string()
    .required()
    .uuid(),

  projectId: Joi.string()
    .required()
    .uuid(),

  taskId: Joi.string()
    .required()
    .uuid(),

  weekStartDate: Joi.date()
    .required()
    .custom((value, helpers) => {
      // Validate that it's a Monday
      const day = value.getDay();
      if (day !== 1) {
        return helpers.error('any.invalid', { message: 'Week start date must be a Monday' });
      }
      return value;
    }),

  weekEndDate: Joi.date()
    .required()
    .custom((value, helpers) => {
      // Validate that it's a Sunday
      const day = value.getDay();
      if (day !== 0) {
        return helpers.error('any.invalid', { message: 'Week end date must be a Sunday' });
      }
      return value;
    })
    .greater(Joi.ref('weekStartDate'))
    .messages({
      'date.greater': 'Week end date must be after week start date'
    }),

  // Individual day hours (old format - matches route implementation)
  mondayHours: Joi.number().min(0).max(24).default(0),
  tuesdayHours: Joi.number().min(0).max(24).default(0),
  wednesdayHours: Joi.number().min(0).max(24).default(0),
  thursdayHours: Joi.number().min(0).max(24).default(0),
  fridayHours: Joi.number().min(0).max(24).default(0),
  saturdayHours: Joi.number().min(0).max(24).default(0),
  sundayHours: Joi.number().min(0).max(24).default(0),

  description: Joi.string()
    .max(500)
    .allow('')
    .optional(),

  status: Joi.string()
    .valid('Draft', 'Submitted', 'Approved', 'Rejected')
    .default('Draft'),

  totalHours: Joi.number()
    .min(0)
    .max(168) // Max hours in a week
    .precision(2)
    .optional()
});

/**
 * Schema for bulk timesheet submission
 */
const bulkSubmitTimesheetSchema = Joi.object({
  timesheets: Joi.array()
    .items(
      Joi.object({
        projectId: Joi.string().uuid().required(),
        weekStartDate: Joi.date().required(),
        weekEndDate: Joi.date().required(),
        entries: Joi.array()
          .items(timesheetEntrySchema)
          .min(1)
          .required()
      })
    )
    .min(1)
    .max(10) // Limit bulk submissions to 10 timesheets
    .required()
    .messages({
      'array.min': 'At least one timesheet is required',
      'array.max': 'Cannot submit more than 10 timesheets at once'
    })
});

/**
 * Schema for updating timesheet status
 */
const updateTimesheetStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Draft', 'Submitted', 'Approved', 'Rejected')
    .required(),

  approverComments: Joi.string()
    .max(500)
    .when('status', {
      is: 'Rejected',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'any.required': 'Comments are required when rejecting a timesheet'
    })
});

/**
 * Schema for updating timesheet entries
 */
const updateTimesheetSchema = Joi.object({
  entries: Joi.array()
    .items(timesheetEntrySchema)
    .min(1)
    .optional(),

  totalHours: Joi.number()
    .min(0)
    .max(168)
    .precision(2)
    .optional()
}).min(1);

/**
 * Schema for timesheet query parameters
 */
const timesheetQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .default(10),

  employeeId: Joi.string()
    .uuid()
    .optional(),

  projectId: Joi.string()
    .uuid()
    .optional(),

  status: Joi.string()
    .valid('Draft', 'Submitted', 'Approved', 'Rejected', 'draft', 'submitted', 'approved', 'rejected')
    .optional(),

  weekStartDate: Joi.date()
    .optional(),

  startDate: Joi.date()
    .optional(),

  weekEndDate: Joi.date()
    .optional()
    .when('weekStartDate', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('weekStartDate'))
    }),

  fromDate: Joi.date()
    .optional(),

  toDate: Joi.date()
    .optional()
    .when('fromDate', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('fromDate'))
    }),

  sort: Joi.string()
    .valid('weekStartDate', 'weekEndDate', 'totalHours', 'status', 'createdAt')
    .default('weekStartDate'),

  order: Joi.string()
    .valid('asc', 'desc', 'ASC', 'DESC')
    .default('desc')
});

/**
 * Schema for week parameter validation
 */
const weekParamSchema = Joi.object({
  weekStart: Joi.date()
    .required()
    .custom((value, helpers) => {
      const day = value.getDay();
      if (day !== 1) {
        return helpers.error('any.invalid', { message: 'Week start must be a Monday' });
      }
      return value;
    })
});

/**
 * Schema for timesheet approval/rejection
 */
const timesheetApprovalSchema = Joi.object({
  action: Joi.string()
    .valid('approve', 'reject')
    .required(),

  comments: Joi.string()
    .max(500)
    .when('action', {
      is: 'reject',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
});

module.exports = {
  createTimesheetSchema,
  bulkSubmitTimesheetSchema,
  updateTimesheetStatusSchema,
  updateTimesheetSchema,
  timesheetQuerySchema,
  weekParamSchema,
  timesheetApprovalSchema
};
