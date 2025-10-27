const sanitizeHtml = require('sanitize-html');

/**
 * Sanitization utility for user inputs
 * Prevents XSS attacks by cleaning HTML and dangerous scripts
 */

// Strict sanitization - only allow plain text
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  return sanitizeHtml(text, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  });
};

// Basic sanitization - allow simple formatting
const sanitizeBasicHtml = (html) => {
  if (!html || typeof html !== 'string') return html;
  
  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
    allowedSchemes: []
  });
};

// Sanitize timesheet data
const sanitizeTimesheetData = (data) => {
  const sanitized = { ...data };
  
  // Sanitize text fields
  if (sanitized.description) {
    sanitized.description = sanitizeText(sanitized.description);
  }
  
  if (sanitized.approverComments) {
    sanitized.approverComments = sanitizeText(sanitized.approverComments);
  }
  
  return sanitized;
};

// Sanitize bulk timesheet data
const sanitizeBulkTimesheetData = (timesheets) => {
  if (!Array.isArray(timesheets)) return timesheets;
  return timesheets.map(sanitizeTimesheetData);
};

module.exports = {
  sanitizeText,
  sanitizeBasicHtml,
  sanitizeTimesheetData,
  sanitizeBulkTimesheetData
};
