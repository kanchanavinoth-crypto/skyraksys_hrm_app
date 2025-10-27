const Joi = require('joi');

// Employee validation schemas
const employeeSchema = {
  create: Joi.object({
    employeeId: Joi.string().min(3).max(20).pattern(/^[A-Z0-9]+$/).required()
      .messages({
        'string.empty': 'Employee ID is required',
        'string.min': 'Employee ID must be at least 3 characters',
        'string.max': 'Employee ID must not exceed 20 characters',
        'string.pattern.base': 'Employee ID must contain only uppercase letters and numbers'
      }),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional().allow(''),
    hireDate: Joi.date().iso().required(),
    departmentId: Joi.string().uuid().required(),
    positionId: Joi.string().uuid().required(),
    managerId: Joi.string().uuid().optional().allow(null),
    
    // Personal details with proper validation
    dateOfBirth: Joi.date().iso().max('now').optional().allow(null),
    gender: Joi.string().valid('Male', 'Female', 'Other').optional().allow(''),
    address: Joi.string().max(255).optional().allow(''),
    city: Joi.string().max(50).optional().allow(''),
    state: Joi.string().max(50).optional().allow(''),
    pinCode: Joi.string().length(6).pattern(/^[0-9]+$/).optional().allow(''),
    nationality: Joi.string().max(50).default('Indian').optional(),
    maritalStatus: Joi.string().valid('Single', 'Married', 'Divorced', 'Widowed').optional().allow(''),
    
    // Employment details with defaults
    employmentType: Joi.string().valid('Full-time', 'Part-time', 'Contract', 'Intern').default('Full-time').optional(),
    status: Joi.string().valid('Active', 'Inactive', 'On Leave', 'Terminated').default('Active').optional(),
    workLocation: Joi.string().max(100).optional().allow(''),
    joiningDate: Joi.date().iso().optional().allow(null),
    confirmationDate: Joi.date().iso().optional().allow(null),
    resignationDate: Joi.date().iso().optional().allow(null),
    lastWorkingDate: Joi.date().iso().optional().allow(null),
    probationPeriod: Joi.number().integer().min(0).max(24).default(6).optional(),
    noticePeriod: Joi.number().integer().min(0).max(12).default(1).optional(),
    
    // Emergency contact
    emergencyContactName: Joi.string().max(100).optional().allow(''),
    emergencyContactPhone: Joi.string().pattern(/^[0-9]{10,15}$/).optional().allow(''),
    emergencyContactRelation: Joi.string().max(50).optional().allow(''),
    
    // Statutory details with proper patterns
    aadhaarNumber: Joi.string().length(12).pattern(/^[0-9]+$/).optional().allow(''),
    panNumber: Joi.string().length(10).pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().allow(''),
    uanNumber: Joi.string().max(20).optional().allow(''),
    pfNumber: Joi.string().max(20).optional().allow(''),
    esiNumber: Joi.string().max(20).optional().allow(''),
    
    // Bank details with proper validation
    bankName: Joi.string().max(100).optional().allow(''),
    bankAccountNumber: Joi.string().max(20).optional().allow(''),
    ifscCode: Joi.string().length(11).pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional().allow(''),
    bankBranch: Joi.string().max(100).optional().allow(''),
    accountHolderName: Joi.string().max(100).optional().allow(''),
    
    // Photo URL
    photoUrl: Joi.string().uri().optional().allow(''),
    
    // Comprehensive salary structure
    salary: Joi.object({
      basicSalary: Joi.number().min(0).required(),
      currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP').default('INR').optional(),
      payFrequency: Joi.string().valid('weekly', 'biweekly', 'monthly', 'annually').default('monthly').optional(),
      effectiveFrom: Joi.date().iso().optional(),
      allowances: Joi.object({
        hra: Joi.number().min(0).default(0).optional(),
        transport: Joi.number().min(0).default(0).optional(),
        medical: Joi.number().min(0).default(0).optional(),
        food: Joi.number().min(0).default(0).optional(),
        communication: Joi.number().min(0).default(0).optional(),
        special: Joi.number().min(0).default(0).optional(),
        other: Joi.number().min(0).default(0).optional()
      }).optional(),
      deductions: Joi.object({
        pf: Joi.number().min(0).default(0).optional(),
        professionalTax: Joi.number().min(0).default(0).optional(),
        incomeTax: Joi.number().min(0).default(0).optional(),
        esi: Joi.number().min(0).default(0).optional(),
        other: Joi.number().min(0).default(0).optional()
      }).optional(),
      benefits: Joi.object({
        bonus: Joi.number().min(0).default(0).optional(),
        incentive: Joi.number().min(0).default(0).optional(),
        overtime: Joi.number().min(0).default(0).optional()
      }).optional(),
      taxInformation: Joi.object({
        taxRegime: Joi.string().valid('old', 'new').default('old').optional(),
        ctc: Joi.number().min(0).default(0).optional(),
        takeHome: Joi.number().min(0).default(0).optional()
      }).optional(),
      salaryNotes: Joi.string().max(500).optional().allow('')
    }).optional(),
    
    // Legacy salary structure (for backward compatibility)
    salaryStructure: Joi.object({
      basicSalary: Joi.number().min(0).required(),
      hra: Joi.number().min(0).optional(),
      allowances: Joi.number().min(0).optional(),
      pfContribution: Joi.number().min(0).optional(),
      tds: Joi.number().min(0).optional(),
      professionalTax: Joi.number().min(0).optional(),
      otherDeductions: Joi.number().min(0).optional(),
      effectiveFrom: Joi.date().optional()
    }).optional()
  }),
  
  update: Joi.object({
    employeeId: Joi.string().min(3).max(20).pattern(/^[A-Z0-9]+$/).optional(),
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional().allow(''),
    hireDate: Joi.date().iso().optional(),
    departmentId: Joi.string().uuid().optional(),
    positionId: Joi.string().uuid().optional(),
    managerId: Joi.string().uuid().optional().allow(null),
    
    // Personal details with proper validation
    dateOfBirth: Joi.date().iso().max('now').optional().allow(null, ''),
    gender: Joi.string().valid('Male', 'Female', 'Other').optional().allow(''),
    address: Joi.string().max(255).optional().allow(''),
    city: Joi.string().max(50).optional().allow(''),
    state: Joi.string().max(50).optional().allow(''),
    pinCode: Joi.string().length(6).pattern(/^[0-9]+$/).optional().allow(''),
    nationality: Joi.string().max(50).optional().allow(''),
    maritalStatus: Joi.string().valid('Single', 'Married', 'Divorced', 'Widowed').optional().allow(''),
    
    // Employment details
    employmentType: Joi.string().valid('Full-time', 'Part-time', 'Contract', 'Intern').optional(),
    status: Joi.string().valid('Active', 'Inactive', 'On Leave', 'Terminated').optional(),
    workLocation: Joi.string().max(100).optional().allow(''),
    joiningDate: Joi.date().iso().optional().allow(null, ''),
    confirmationDate: Joi.date().iso().optional().allow(null, ''),
    resignationDate: Joi.date().iso().optional().allow(null, ''),
    lastWorkingDate: Joi.date().iso().optional().allow(null, ''),
    probationPeriod: Joi.number().integer().min(0).max(24).optional().allow(null),
    noticePeriod: Joi.number().integer().min(0).max(12).optional().allow(null),
    
    // Emergency contact
    emergencyContactName: Joi.string().max(100).optional().allow(''),
    emergencyContactPhone: Joi.string().pattern(/^[0-9]{10,15}$/).optional().allow(''),
    emergencyContactRelation: Joi.string().max(50).optional().allow(''),
    
    // Statutory details with proper patterns
    aadhaarNumber: Joi.string().length(12).pattern(/^[0-9]+$/).optional().allow(''),
    panNumber: Joi.string().length(10).pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().allow(''),
    uanNumber: Joi.string().max(20).optional().allow(''),
    pfNumber: Joi.string().max(20).optional().allow(''),
    esiNumber: Joi.string().max(20).optional().allow(''),
    
    // Bank details with proper validation
    bankName: Joi.string().max(100).optional().allow(''),
    bankAccountNumber: Joi.string().max(20).optional().allow(''),
    ifscCode: Joi.string().length(11).pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional().allow(''),
    bankBranch: Joi.string().max(100).optional().allow(''),
    accountHolderName: Joi.string().max(100).optional().allow(''),
    
    // Photo URL
    photoUrl: Joi.string().uri().optional().allow(''),
    
    // Comprehensive salary structure for updates
    salary: Joi.object({
      basicSalary: Joi.number().min(0).required(),
      currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP').default('INR').optional(),
      payFrequency: Joi.string().valid('weekly', 'biweekly', 'monthly', 'annually').default('monthly').optional(),
      effectiveFrom: Joi.date().iso().optional(),
      allowances: Joi.object({
        hra: Joi.number().min(0).default(0).optional(),
        transport: Joi.number().min(0).default(0).optional(),
        medical: Joi.number().min(0).default(0).optional(),
        food: Joi.number().min(0).default(0).optional(),
        communication: Joi.number().min(0).default(0).optional(),
        special: Joi.number().min(0).default(0).optional(),
        other: Joi.number().min(0).default(0).optional()
      }).optional(),
      deductions: Joi.object({
        pf: Joi.number().min(0).default(0).optional(),
        professionalTax: Joi.number().min(0).default(0).optional(),
        incomeTax: Joi.number().min(0).default(0).optional(),
        esi: Joi.number().min(0).default(0).optional(),
        other: Joi.number().min(0).default(0).optional()
      }).optional(),
      benefits: Joi.object({
        bonus: Joi.number().min(0).default(0).optional(),
        incentive: Joi.number().min(0).default(0).optional(),
        overtime: Joi.number().min(0).default(0).optional()
      }).optional(),
      taxInformation: Joi.object({
        taxRegime: Joi.string().valid('old', 'new').default('old').optional(),
        ctc: Joi.number().min(0).default(0).optional(),
        takeHome: Joi.number().min(0).default(0).optional()
      }).optional(),
      salaryNotes: Joi.string().max(500).optional().allow('')
    }).optional(),
    
    // Legacy salary structure for updates (for backward compatibility)
    salaryStructure: Joi.object({
      basicSalary: Joi.number().min(0).required(),
      hra: Joi.number().min(0).optional(),
      allowances: Joi.number().min(0).optional(),
      pfContribution: Joi.number().min(0).optional(),
      tds: Joi.number().min(0).optional(),
      professionalTax: Joi.number().min(0).optional(),
      otherDeductions: Joi.number().min(0).optional(),
      effectiveFrom: Joi.date().optional()
    }).optional()
  })
};

// Leave validation schemas
const leaveSchema = {
  create: Joi.object({
    employeeId: Joi.alternatives().try(
      Joi.string().uuid(),
      Joi.number().integer()
    ).optional(),
    leaveTypeId: Joi.alternatives().try(
      Joi.string().uuid(),
      Joi.number().integer().positive()
    ).required(),
    startDate: Joi.date().iso().required(), // Remove min('now') to allow past dates for testing
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    reason: Joi.string().min(10).max(500).required(),
    isHalfDay: Joi.boolean().default(false).optional(),
    halfDayType: Joi.string().valid('first-half', 'second-half', 'First Half', 'Second Half').when('isHalfDay', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional().allow(null)
    })
  }),
  
  updateStatus: Joi.object({
    status: Joi.string().valid('Approved', 'Rejected').required(),
    approverComments: Joi.string().max(500).optional()
  })
};

// Timesheet validation schemas
const timesheetSchema = {
  create: Joi.object({
    projectId: Joi.string().uuid().required(),
    taskId: Joi.string().uuid().required(),
    weekStartDate: Joi.date().iso().required().custom((value) => {
      const date = new Date(value);
      if (date.getDay() !== 1) {
        throw new Error('Week start date must be a Monday');
      }
      return value;
    }),
    mondayHours: Joi.number().min(0).max(24).default(0),
    tuesdayHours: Joi.number().min(0).max(24).default(0),
    wednesdayHours: Joi.number().min(0).max(24).default(0),
    thursdayHours: Joi.number().min(0).max(24).default(0),
    fridayHours: Joi.number().min(0).max(24).default(0),
    saturdayHours: Joi.number().min(0).max(24).default(0),
    sundayHours: Joi.number().min(0).max(24).default(0),
    description: Joi.string().max(500).optional().allow('')
  }),
  
  update: Joi.object({
    projectId: Joi.string().uuid().optional(),
    taskId: Joi.string().uuid().optional(),
    mondayHours: Joi.number().min(0).max(24).optional(),
    tuesdayHours: Joi.number().min(0).max(24).optional(),
    wednesdayHours: Joi.number().min(0).max(24).optional(),
    thursdayHours: Joi.number().min(0).max(24).optional(),
    fridayHours: Joi.number().min(0).max(24).optional(),
    saturdayHours: Joi.number().min(0).max(24).optional(),
    sundayHours: Joi.number().min(0).max(24).optional(),
    description: Joi.string().max(500).optional().allow('')
  }),
  
  updateStatus: Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
    approverComments: Joi.string().max(500).optional().allow('')
  })
};

// Auth validation schemas
const authSchema = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),
  
  register: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'hr', 'manager', 'employee').default('employee').optional()
  }),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),
  
  resetPassword: Joi.object({
    userId: Joi.string().uuid().required(),
    newPassword: Joi.string().min(6).required()
  })
};

// Validation middleware with enhanced error messages
const validate = (schema) => {
  return (req, res, next) => {
    // Enhanced validation with better error messages
    const { error } = schema.validate(req.body, { 
      abortEarly: false, // Get all validation errors
      allowUnknown: false // Reject unknown fields
    });
    
    if (error) {
      // Check for common misunderstandings first
      if (req.body.workDate && req.body.hoursWorked) {
        return res.status(400).json({
          success: false,
          message: 'Invalid data format: This endpoint expects weekly timesheet data, not daily entries.',
          details: {
            receivedFormat: 'Daily format (workDate, hoursWorked)',
            expectedFormat: 'Weekly format (weekStartDate, mondayHours, tuesdayHours, etc.)',
            example: {
              projectId: 'uuid-string',
              taskId: 'uuid-string',
              weekStartDate: '2024-01-01', // Must be a Monday
              mondayHours: 8,
              tuesdayHours: 8,
              wednesdayHours: 8,
              thursdayHours: 8,
              fridayHours: 8,
              saturdayHours: 0,
              sundayHours: 0,
              description: 'Work description (optional)'
            }
          },
          hint: 'Please use the weekly timesheet format. Contact support if you need help migrating from the old daily format.'
        });
      }

      // Enhanced error formatting
      const detailedErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        received: detail.context?.value,
        type: detail.type,
        label: detail.context?.label
      }));

      // Get field requirements based on the schema
      let fieldRequirements = {};
      if (schema === timesheetSchema.create) {
        fieldRequirements = {
          requiredFields: ['projectId', 'taskId', 'weekStartDate'],
          optionalFields: ['mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours', 'fridayHours', 'saturdayHours', 'sundayHours', 'description'],
          fieldTypes: {
            projectId: 'UUID string - ID of the project you are working on',
            taskId: 'UUID string - ID of the specific task within the project', 
            weekStartDate: 'ISO date string (YYYY-MM-DD) - Must be a Monday',
            hours: 'Number between 0 and 24 - Hours worked on each day',
            description: 'String (max 500 characters) - Description of work done'
          },
          commonMistakes: [
            'Using workDate instead of weekStartDate',
            'Using hoursWorked instead of daily hour breakdown',
            'Providing a non-Monday date for weekStartDate',
            'Sending empty or null values for required fields'
          ]
        };
      }

      return res.status(400).json({
        success: false,
        message: `Validation error: ${detailedErrors.length} field(s) failed validation`,
        errors: detailedErrors,
        validationGuide: fieldRequirements,
        receivedData: req.body
      });
    }
    
    next();
  };
};

// Project validation schemas
const projectSchema = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).optional().allow(''),
    startDate: Joi.date().iso().optional().allow(null),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().allow(null),
    status: Joi.string().valid('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled').default('Planning'),
    clientName: Joi.string().max(100).optional().allow(''),
    managerId: Joi.string().uuid().optional().allow(null),
    isActive: Joi.boolean().default(true)
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    status: Joi.string().valid('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled').optional(),
    clientName: Joi.string().max(100).optional(),
    managerId: Joi.string().uuid().optional(),
    isActive: Joi.boolean().optional()
  })
};

// Task validation schemas
const taskSchema = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).optional().allow(''),
    projectId: Joi.string().uuid().required(),
    assignedTo: Joi.alternatives().try(
      Joi.string().uuid(),
      Joi.string().allow(''),
      Joi.allow(null)
    ).optional(),
    availableToAll: Joi.boolean().default(false),
    status: Joi.string().valid('Not Started', 'In Progress', 'Completed', 'On Hold').default('Not Started'),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').default('Medium'),
    estimatedHours: Joi.number().positive().precision(2).optional().allow(null),
    isActive: Joi.boolean().default(true)
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    assignedTo: Joi.alternatives().try(
      Joi.string().uuid(),
      Joi.string().allow(''),
      Joi.allow(null)
    ).optional(),
    availableToAll: Joi.boolean().optional(),
    status: Joi.string().valid('Not Started', 'In Progress', 'Completed', 'On Hold').optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
    estimatedHours: Joi.number().positive().precision(2).optional(),
    actualHours: Joi.number().min(0).precision(2).optional(),
    isActive: Joi.boolean().optional()
  })
};

module.exports = {
  employeeSchema,
  leaveSchema,
  timesheetSchema,
  authSchema,
  projectSchema,
  taskSchema,
  validate
};
