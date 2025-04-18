const { CustomError } = require('../utils/errors');

// Not found error handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Check if error is a custom error
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }
  
  // Check if error is a Prisma error
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      message: 'Database operation failed',
      error: err.message
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // Generic error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = {
  notFound,
  errorHandler
}; 