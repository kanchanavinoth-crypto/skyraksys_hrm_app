/**
 * Custom Error Classes for Standardized Error Handling
 * 
 * These classes provide consistent error responses across the application
 */

/**
 * Base Application Error
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 * Used when request validation fails
 */
class ValidationError extends AppError {
  constructor(message = 'Validation error', errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Not Found Error (404)
 * Used when a resource is not found
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Unauthorized Error (401)
 * Used when authentication fails or is missing
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

/**
 * Forbidden Error (403)
 * Used when user doesn't have permission
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied. Insufficient permissions.') {
    super(message, 403);
  }
}

/**
 * Conflict Error (409)
 * Used when there's a conflict (e.g., duplicate entry)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

/**
 * Bad Request Error (400)
 * Used for general bad request errors
 */
class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError
};
