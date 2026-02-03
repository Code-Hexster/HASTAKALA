/**
 * Central error-handling middleware.
 * Must be registered LAST in Express (after all routes).
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "production") {
    console.error(`[${status}] ${req.method} ${req.originalUrl} — ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
