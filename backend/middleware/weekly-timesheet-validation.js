const Joi = require('joi');

// Weekly timesheet validation schemas
const weeklyTimesheetSchema = {
  create: Joi.object({
    // Weekly date range
    weekStartDate: Joi.date().iso().custom((value, helpers) => {
      const date = new Date(value);
      // Must be a Monday
      if (date.getDay() !== 1) {
        return helpers.error('any.invalid', { message: 'Week start date must be a Monday' });
      }
      
      // Cannot be in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        return helpers.error('any.invalid', { message: 'Cannot create timesheets for future weeks' });
      }
      
      return value;
    }).required(),
    
    // Project and task (single per week)
    projectId: Joi.string().uuid().required(),
    taskId: Joi.string().uuid().required(),
    
    // Total weekly hours
    totalHoursWorked: Joi.number().min(0).max(168).required(),
    
    // Daily breakdown (optional)
    mondayHours: Joi.number().min(0).max(24).default(0),
    tuesdayHours: Joi.number().min(0).max(24).default(0),
    wednesdayHours: Joi.number().min(0).max(24).default(0),
    thursdayHours: Joi.number().min(0).max(24).default(0),
    fridayHours: Joi.number().min(0).max(24).default(0),
    saturdayHours: Joi.number().min(0).max(24).default(0),
    sundayHours: Joi.number().min(0).max(24).default(0),
    
    description: Joi.string().max(1000).optional().allow(''),
  }).custom((value, helpers) => {
    // Validate that daily hours sum matches total
    const dailyTotal = (
      (value.mondayHours || 0) +
      (value.tuesdayHours || 0) +
      (value.wednesdayHours || 0) +
      (value.thursdayHours || 0) +
      (value.fridayHours || 0) +
      (value.saturdayHours || 0) +
      (value.sundayHours || 0)
    );
    
    if (Math.abs(dailyTotal - value.totalHoursWorked) > 0.01) {
      return helpers.error('any.invalid', { 
        message: 'Total hours must match sum of daily hours' 
      });
    }
    
    return value;
  }),
  
  update: Joi.object({
    // Can only update certain fields
    totalHoursWorked: Joi.number().min(0).max(168),
    mondayHours: Joi.number().min(0).max(24),
    tuesdayHours: Joi.number().min(0).max(24),
    wednesdayHours: Joi.number().min(0).max(24),
    thursdayHours: Joi.number().min(0).max(24),
    fridayHours: Joi.number().min(0).max(24),
    saturdayHours: Joi.number().min(0).max(24),
    sundayHours: Joi.number().min(0).max(24),
    description: Joi.string().max(1000).optional().allow(''),
    // Cannot change project/task or dates after creation
  }).custom((value, helpers) => {
    // Validate that daily hours sum matches total if both are provided
    if (value.totalHoursWorked !== undefined) {
      const dailyTotal = (
        (value.mondayHours || 0) +
        (value.tuesdayHours || 0) +
        (value.wednesdayHours || 0) +
        (value.thursdayHours || 0) +
        (value.fridayHours || 0) +
        (value.saturdayHours || 0) +
        (value.sundayHours || 0)
      );
      
      if (Math.abs(dailyTotal - value.totalHoursWorked) > 0.01) {
        return helpers.error('any.invalid', { 
          message: 'Total hours must match sum of daily hours' 
        });
      }
    }
    
    return value;
  }),
  
  approve: Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
    approverComments: Joi.string().max(1000).optional().allow('')
  }),
  
  submit: Joi.object({
    // No additional fields needed for submission
  })
};

// Helper function to get week start date (Monday) from any date
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper function to get week end date (Sunday) from week start
const getWeekEnd = (weekStart) => {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Helper function to get week number
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

module.exports = {
  weeklyTimesheetSchema,
  getWeekStart,
  getWeekEnd,
  getWeekNumber
};