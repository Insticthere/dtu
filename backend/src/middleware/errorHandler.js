/**
 * middleware/errorHandler.js — Centralised Express error handler
 *
 * All route handlers call next(err) or throw inside an async wrapper to reach here.
 * This means individual handlers never format error responses themselves — they
 * just throw, and this function formats the response.
 *
 * Error shape:
 *   { "message": "..." }   with the correct HTTP status code.
 *
 * Error types handled:
 *   - Mongoose ValidationError (e.g. required field missing, enum mismatch)
 *   - Mongoose CastError (e.g. invalid ObjectId in a URL param)
 *   - MongoDB duplicate key error (code 11000) — e.g. duplicate email
 *   - Application errors with a custom `status` property set by route handlers
 *   - Catch-all 500 for anything unexpected
 *
 * This must be registered AFTER all routes in app.js (Express identifies
 * error-handling middleware by the presence of the fourth `err` parameter).
 */
const errorHandler = (err, req, res, next) => {
  // Log full error for debugging in Render/server logs
  console.error(`[Error] ${req.method} ${req.path} —`, err);

  // Mongoose ValidationError: schema-level validation failures
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join('; ') });
  }

  // Mongoose CastError: happens when an invalid ObjectId is passed in a URL param
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  // MongoDB duplicate key (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `A record with this ${field} already exists.` });
  }

  // Application-level errors
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  // Catch-all 500 error
  return res.status(500).json({
    message: err.message || 'An unexpected error occurred.',
  });
};

export default errorHandler;
