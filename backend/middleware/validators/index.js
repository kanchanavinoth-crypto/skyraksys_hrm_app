/**
 * Validator Index
 * 
 * Central export point for all validation schemas
 */

const authValidators = require('./auth.validator');
const employeeValidators = require('./employee.validator');
const timesheetValidators = require('./timesheet.validator');
const leaveValidators = require('./leave.validator');

module.exports = {
  // Authentication validators
  ...authValidators,
  
  // Employee validators
  ...employeeValidators,
  
  // Timesheet validators
  ...timesheetValidators,
  
  // Leave validators
  ...leaveValidators
};
