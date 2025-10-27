/**
 * Field-Level Access Control Middleware
 * This middleware filters response data based on user roles and field permissions
 */

const fieldAccessMap = {
  admin: {
    employees: ['*'], // All fields
    timesheets: ['*'],
    leave: ['*'],
    payrolls: ['*'],
    users: ['*']
  },
  hr: {
    employees: [
      'id', 'employeeId', 'firstName', 'lastName', 'email', 'phone', 'departmentId', 'positionId', 
      'hireDate', 'employmentType', 'status', 'managerId', 'address', 'city', 
      'state', 'pinCode', 'dateOfBirth', 'gender', 'maritalStatus', 'nationality',
      'workLocation', 'probationPeriod', 'noticePeriod', 'emergencyContactName',
      'emergencyContactPhone', 'emergencyContactRelation', 'joiningDate', 'confirmationDate',
      'aadhaarNumber', 'panNumber', 'uanNumber', 'pfNumber', 'esiNumber',
      'bankName', 'bankAccountNumber', 'ifscCode', 'bankBranch', 'accountHolderName',
      'userId', 'createdAt', 'updatedAt'
    ],
    timesheets: ['employeeId', 'projectId', 'taskId', 'workDate', 'hoursWorked', 'description', 'status', 'submittedAt', 'approvedAt', 'clockInTime', 'clockOutTime', 'breakHours'],
    leave: ['*'], // HR can access all leave fields
    payrolls: ['*'], // HR can access all payroll fields
    users: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt']
  },
  manager: {
    employees: [
      'id', 'employeeId', 'firstName', 'lastName', 'email', 'phone', 'departmentId', 'positionId',
      'status', 'workLocation', 'emergencyContactName', 'emergencyContactPhone', 'hireDate',
      'employmentType', 'userId'
    ],
    timesheets: ['*'], // Managers can access all timesheet fields for approval
    leave: ['*'], // Managers can access all leave fields for approval
    payrolls: ['employeeId', 'month', 'year', 'status', 'processedAt'], // Limited payroll access
    users: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive']
  },
  employee: {
    employees: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'pinCode', 'emergencyContactName', 'emergencyContactPhone'], // Only self-access
    timesheets: ['projectId', 'taskId', 'workDate', 'hoursWorked', 'description', 'status', 'clockInTime', 'clockOutTime', 'breakHours'], // Own timesheets only
    leave: ['leaveTypeId', 'startDate', 'endDate', 'reason', 'isHalfDay', 'halfDayType', 'status'], // Own leave only
    payrolls: ['month', 'year', 'grossSalary', 'netSalary', 'workingDays', 'actualWorkingDays', 'leaveDays'], // Own payslips only
    users: ['id', 'firstName', 'lastName', 'email']
  }
};

/**
 * Filter response fields based on user role and entity type
 * @param {string} userRole - User's role (admin, hr, manager, employee)
 * @param {string} entityType - Type of entity (employees, timesheets, leave, payrolls, users)
 * @param {Object|Array} data - Data to filter
 * @param {string} userId - Current user ID for employee self-access validation
 * @param {string} employeeId - Current employee ID for employee self-access validation
 * @returns {Object|Array} Filtered data
 */
const filterResponseFields = (userRole, entityType, data, userId = null, employeeId = null) => {
  const allowedFields = fieldAccessMap[userRole]?.[entityType] || [];
  
  if (allowedFields.includes('*')) {
    return data; // Full access
  }
  
  if (Array.isArray(data)) {
    return data.map(item => filterObject(item, allowedFields, userRole, entityType, userId, employeeId));
  }
  
  return filterObject(data, allowedFields, userRole, entityType, userId, employeeId);
};

/**
 * Filter individual object based on allowed fields
 * @param {Object} obj - Object to filter
 * @param {Array} allowedFields - Array of allowed field names
 * @param {string} userRole - User's role
 * @param {string} entityType - Type of entity
 * @param {string} userId - Current user ID
 * @param {string} employeeId - Current employee ID
 * @returns {Object} Filtered object
 */
const filterObject = (obj, allowedFields, userRole, entityType, userId, employeeId) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // For employee role, ensure they can only access their own data
  if (userRole === 'employee' && entityType === 'employees') {
    if (obj.id !== employeeId && obj.userId !== userId) {
      return {}; // Return empty object if trying to access other employee's data
    }
  }

  const filtered = {};
  
  // Always include id field for reference
  if (obj.id && !allowedFields.includes('id')) {
    allowedFields.push('id');
  }

  allowedFields.forEach(field => {
    if (obj.hasOwnProperty(field)) {
      // Handle nested objects (like department, position, manager, etc.)
      if (typeof obj[field] === 'object' && obj[field] !== null && !Array.isArray(obj[field])) {
        // For nested objects, apply basic filtering to show only essential info
        if (field === 'department' || field === 'position') {
          filtered[field] = {
            id: obj[field].id,
            name: obj[field].name || obj[field].title,
            ...(obj[field].description && { description: obj[field].description })
          };
        } else if (field === 'manager' || field === 'user') {
          filtered[field] = {
            id: obj[field].id,
            firstName: obj[field].firstName,
            lastName: obj[field].lastName,
            ...(obj[field].email && userRole !== 'employee' && { email: obj[field].email })
          };
        } else {
          filtered[field] = obj[field];
        }
      } else {
        filtered[field] = obj[field];
      }
    }
  });

  return filtered;
};

/**
 * Express middleware to filter response data based on user role
 * @param {string} entityType - Type of entity being filtered
 * @returns {Function} Express middleware function
 */
const applyFieldFiltering = (entityType) => {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      if (data && data.data && req.user) {
        const filteredData = filterResponseFields(
          req.user.role || req.userRole,
          entityType,
          data.data,
          req.user.id,
          req.employeeId
        );
        
        data.data = filteredData;
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Validate if user has permission to access specific fields
 * @param {string} userRole - User's role
 * @param {string} entityType - Type of entity
 * @param {Array} requestedFields - Fields being requested
 * @returns {Object} Validation result with allowed and denied fields
 */
const validateFieldAccess = (userRole, entityType, requestedFields) => {
  const allowedFields = fieldAccessMap[userRole]?.[entityType] || [];
  
  if (allowedFields.includes('*')) {
    return { allowed: requestedFields, denied: [] };
  }
  
  const allowed = requestedFields.filter(field => allowedFields.includes(field));
  const denied = requestedFields.filter(field => !allowedFields.includes(field));
  
  return { allowed, denied };
};

/**
 * Check if user can modify specific fields
 * @param {string} userRole - User's role
 * @param {string} entityType - Type of entity
 * @param {Array} fieldsToModify - Fields being modified
 * @returns {boolean} Whether user can modify these fields
 */
const canModifyFields = (userRole, entityType, fieldsToModify) => {
  // Define modify permissions (more restrictive than read permissions)
  const modifyPermissions = {
    admin: { employees: ['*'], timesheets: ['*'], leave: ['*'], payrolls: ['*'] },
    hr: { 
      employees: ['firstName', 'lastName', 'phone', 'address', 'departmentId', 'positionId', 'status', 'managerId'],
      timesheets: ['status', 'approverComments'],
      leave: ['status', 'approverComments'],
      payrolls: ['*']
    },
    manager: {
      employees: ['status'], // Managers can only update status of subordinates
      timesheets: ['status', 'approverComments'],
      leave: ['status', 'approverComments'],
      payrolls: []
    },
    employee: {
      employees: ['phone', 'address', 'emergencyContactName', 'emergencyContactPhone'], // Self-update only
      timesheets: ['projectId', 'taskId', 'workDate', 'hoursWorked', 'description', 'clockInTime', 'clockOutTime', 'breakHours'],
      leave: ['leaveTypeId', 'startDate', 'endDate', 'reason', 'isHalfDay', 'halfDayType'],
      payrolls: []
    }
  };

  const allowedModifyFields = modifyPermissions[userRole]?.[entityType] || [];
  
  if (allowedModifyFields.includes('*')) {
    return true;
  }
  
  return fieldsToModify.every(field => allowedModifyFields.includes(field));
};

module.exports = {
  filterResponseFields,
  applyFieldFiltering,
  validateFieldAccess,
  canModifyFields,
  fieldAccessMap
};
