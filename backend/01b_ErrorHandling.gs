/**
 * 01b_ErrorHandling.gs
 * Standardized Error Handling and Response Formatting
 * Sprint 1: Database & Backend Skeleton
 */

// ========================================
// ERROR CODES
// ========================================

const ERROR_CODES = {
  // Client Errors (4xx)
  BAD_REQUEST: { code: 400, message: 'Permintaan tidak valid' },
  UNAUTHORIZED: { code: 401, message: 'Autentikasi diperlukan' },
  FORBIDDEN: { code: 403, message: 'Akses ditolak' },
  NOT_FOUND: { code: 404, message: 'Data tidak ditemukan' },
  VALIDATION_ERROR: { code: 422, message: 'Validasi gagal' },
  CONFLICT: { code: 409, message: 'Konflik data' },

  // Server Errors (5xx)
  INTERNAL_ERROR: { code: 500, message: 'Terjadi kesalahan internal' },
  SERVICE_UNAVAILABLE: { code: 503, message: 'Layanan tidak tersedia' },

  // Business Logic Errors
  INVALID_STATUS: { code: 400, message: 'Status tidak valid' },
  INVALID_TRANSITION: { code: 400, message: 'Transisi status tidak diizinkan' },
  MISSING_REQUIRED: { code: 400, message: 'Field wajib tidak lengkap' },
  DUPLICATE_ENTRY: { code: 409, message: 'Data sudah ada' },
  REFERENCE_ERROR: { code: 400, message: 'Referensi data tidak valid' }
};

// ========================================
// CUSTOM ERROR CLASS
// ========================================

/**
 * Custom API Error
 */
class APIError extends Error {
  constructor(errorType, customMessage = null, details = null) {
    const errorDef = ERROR_CODES[errorType] || ERROR_CODES.INTERNAL_ERROR;
    super(customMessage || errorDef.message);

    this.name = 'APIError';
    this.code = errorDef.code;
    this.errorType = errorType;
    this.details = details;
  }

  toResponse() {
    return {
      success: false,
      error: this.message,
      errorType: this.errorType,
      errorCode: this.code,
      details: this.details,
      timestamp: getTimestamp()
    };
  }
}

// ========================================
// RESPONSE HELPERS
// ========================================

/**
 * Create success response
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @returns {Object} Formatted response
 */
function successResponse(data, message = null) {
  const response = {
    success: true,
    data: data,
    timestamp: getTimestamp()
  };

  if (message) {
    response.message = message;
  }

  return response;
}

/**
 * Create paginated success response
 * @param {Array} data - Data array
 * @param {Object} pagination - Pagination info
 * @returns {Object} Formatted response
 */
function paginatedResponse(data, pagination) {
  return {
    success: true,
    data: data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      total: pagination.total || data.length,
      totalPages: Math.ceil((pagination.total || data.length) / (pagination.limit || 20))
    },
    timestamp: getTimestamp()
  };
}

/**
 * Create error response
 * @param {string} message - Error message
 * @param {string} errorType - Error type from ERROR_CODES
 * @param {*} details - Additional error details
 * @returns {Object} Formatted error response
 */
function errorResponse(message, errorType = 'INTERNAL_ERROR', details = null) {
  const errorDef = ERROR_CODES[errorType] || ERROR_CODES.INTERNAL_ERROR;

  return {
    success: false,
    error: message || errorDef.message,
    errorType: errorType,
    errorCode: errorDef.code,
    details: details,
    timestamp: getTimestamp()
  };
}

/**
 * Create validation error response
 * @param {Array} errors - Validation error messages
 * @returns {Object} Formatted validation error
 */
function validationErrorResponse(errors) {
  return {
    success: false,
    error: 'Validasi gagal',
    errorType: 'VALIDATION_ERROR',
    errorCode: 422,
    validationErrors: Array.isArray(errors) ? errors : [errors],
    timestamp: getTimestamp()
  };
}

/**
 * Create not found response
 * @param {string} entityName - Name of entity not found
 * @param {string} id - ID that was searched
 * @returns {Object} Formatted not found error
 */
function notFoundResponse(entityName, id = null) {
  return {
    success: false,
    error: `${entityName} tidak ditemukan` + (id ? `: ${id}` : ''),
    errorType: 'NOT_FOUND',
    errorCode: 404,
    timestamp: getTimestamp()
  };
}

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Validate required fields
 * @param {Object} data - Data to validate
 * @param {Array} requiredFields - List of required field names
 * @returns {Object} Validation result
 */
function validateRequired(data, requiredFields) {
  const missing = [];

  requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  });

  return {
    valid: missing.length === 0,
    missing: missing,
    error: missing.length > 0 ? `Field wajib tidak lengkap: ${missing.join(', ')}` : null
  };
}

/**
 * Validate data types
 * @param {Object} data - Data to validate
 * @param {Object} schema - Field type definitions
 * @returns {Object} Validation result
 */
function validateTypes(data, schema) {
  const errors = [];

  Object.keys(schema).forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      const expectedType = schema[field];
      const actualValue = data[field];

      switch (expectedType) {
        case 'string':
          if (typeof actualValue !== 'string') {
            errors.push(`${field} harus berupa teks`);
          }
          break;
        case 'number':
          if (typeof actualValue !== 'number' && isNaN(parseFloat(actualValue))) {
            errors.push(`${field} harus berupa angka`);
          }
          break;
        case 'boolean':
          if (typeof actualValue !== 'boolean') {
            errors.push(`${field} harus berupa boolean`);
          }
          break;
        case 'date':
          if (isNaN(Date.parse(actualValue))) {
            errors.push(`${field} harus berupa tanggal valid`);
          }
          break;
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(actualValue)) {
            errors.push(`${field} harus berupa email valid`);
          }
          break;
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validate enum value
 * @param {*} value - Value to check
 * @param {Array} allowedValues - Allowed values
 * @param {string} fieldName - Field name for error message
 * @returns {Object} Validation result
 */
function validateEnum(value, allowedValues, fieldName) {
  if (value === undefined || value === null || value === '') {
    return { valid: true }; // Empty is OK, let required validation handle it
  }

  const valid = allowedValues.includes(value);
  return {
    valid: valid,
    error: valid ? null : `${fieldName} harus salah satu dari: ${allowedValues.join(', ')}`
  };
}

/**
 * Validate numeric range
 * @param {number} value - Value to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Field name for error message
 * @returns {Object} Validation result
 */
function validateRange(value, min, max, fieldName) {
  if (value === undefined || value === null) {
    return { valid: true };
  }

  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return { valid: false, error: `${fieldName} harus berupa angka` };
  }

  if (min !== null && numValue < min) {
    return { valid: false, error: `${fieldName} minimal ${min}` };
  }

  if (max !== null && numValue > max) {
    return { valid: false, error: `${fieldName} maksimal ${max}` };
  }

  return { valid: true };
}

// ========================================
// SAFE EXECUTION WRAPPER
// ========================================

/**
 * Execute function with error handling
 * @param {Function} fn - Function to execute
 * @param {string} context - Context for error logging
 * @returns {Object} Result or error response
 */
function safeExecute(fn, context = '') {
  try {
    const result = fn();
    return result;
  } catch (e) {
    console.error(`Error in ${context}:`, e);

    if (e instanceof APIError) {
      return e.toResponse();
    }

    return errorResponse(
      e.message || 'Terjadi kesalahan yang tidak terduga',
      'INTERNAL_ERROR',
      { context: context }
    );
  }
}

/**
 * Execute async-like function with error handling
 * @param {Function} fn - Function to execute
 * @param {string} context - Context for error logging
 * @returns {Object} Result or error response
 */
function tryCatch(fn, context = '') {
  return safeExecute(fn, context);
}

// ========================================
// REQUEST VALIDATION
// ========================================

/**
 * Validate API request body
 * @param {Object} body - Request body
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result
 */
function validateRequestBody(body, rules) {
  const errors = [];

  // Check required fields
  if (rules.required) {
    const reqValidation = validateRequired(body, rules.required);
    if (!reqValidation.valid) {
      errors.push(...reqValidation.missing.map(f => `${f} wajib diisi`));
    }
  }

  // Check field types
  if (rules.types) {
    const typeValidation = validateTypes(body, rules.types);
    if (!typeValidation.valid) {
      errors.push(...typeValidation.errors);
    }
  }

  // Check enum fields
  if (rules.enums) {
    Object.keys(rules.enums).forEach(field => {
      if (body[field] !== undefined) {
        const enumValidation = validateEnum(body[field], rules.enums[field], field);
        if (!enumValidation.valid) {
          errors.push(enumValidation.error);
        }
      }
    });
  }

  // Check range fields
  if (rules.ranges) {
    Object.keys(rules.ranges).forEach(field => {
      if (body[field] !== undefined) {
        const range = rules.ranges[field];
        const rangeValidation = validateRange(body[field], range.min, range.max, field);
        if (!rangeValidation.valid) {
          errors.push(rangeValidation.error);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// ========================================
// LOGGING HELPERS
// ========================================

/**
 * Log API request
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {Object} params - Query params
 */
function logRequest(method, path, params = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${path}`, JSON.stringify(params));
}

/**
 * Log API response
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {boolean} success - Response success status
 * @param {number} duration - Request duration in ms
 */
function logResponse(method, path, success, duration = 0) {
  const timestamp = new Date().toISOString();
  const status = success ? '✓' : '✗';
  console.log(`[${timestamp}] ${status} ${method} ${path} (${duration}ms)`);
}

/**
 * Log error with stack trace
 * @param {Error} error - Error object
 * @param {string} context - Error context
 */
function logError(error, context = '') {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR in ${context}:`);
  console.error(`  Message: ${error.message}`);
  if (error.stack) {
    console.error(`  Stack: ${error.stack}`);
  }
}
