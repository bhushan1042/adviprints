const { isDatabaseError, formatDatabaseError } = require('../config/db');

// Wraps a failure so the client gets a safe message while the details stay in the server log.
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = err.status || err.statusCode || 500;
  let message = 'Internal Server Error';

  if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed request body';
  } else if (err.name === 'MulterError') {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : 'Invalid upload';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  } else if (status < 500 && err.expose !== false && err.message) {
    message = err.message;
  }

  if (status >= 500) {
    if (isDatabaseError(err)) {
      console.error(`[error] ${req.method} ${req.originalUrl}: ${formatDatabaseError(err)}`);
    } else {
      console.error(`[error] ${req.method} ${req.originalUrl}:`, err.stack || err.message);
    }
  }
  res.status(status).json({ error: message });
};

module.exports = errorHandler;
