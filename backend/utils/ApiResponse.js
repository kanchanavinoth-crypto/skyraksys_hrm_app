// Response utility for standardized API responses
class ApiResponse {
  static success(data = null, message = 'Success', meta = {}) {
    return {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString()
    };
  }

  static error(message = 'An error occurred', statusCode = 500, errors = null) {
    return {
      success: false,
      message,
      statusCode,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  static paginated(data, pagination, message = 'Success') {
    return {
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.page || 1,
        totalPages: pagination.totalPages || 1,
        totalItems: pagination.totalItems || data.length,
        itemsPerPage: pagination.limit || data.length,
        hasNextPage: pagination.hasNextPage || false,
        hasPrevPage: pagination.hasPrevPage || false
      },
      timestamp: new Date().toISOString()
    };
  }

  static validation(errors, message = 'Validation failed') {
    return {
      success: false,
      message,
      statusCode: 400,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  static unauthorized(message = 'Unauthorized access') {
    return {
      success: false,
      message,
      statusCode: 401,
      timestamp: new Date().toISOString()
    };
  }

  static forbidden(message = 'Access forbidden') {
    return {
      success: false,
      message,
      statusCode: 403,
      timestamp: new Date().toISOString()
    };
  }

  static notFound(message = 'Resource not found') {
    return {
      success: false,
      message,
      statusCode: 404,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ApiResponse;
