/**
 * Wraps an async route handler so that any rejected promise is forwarded
 * to Express's next(err) automatically — no try/catch boilerplate needed.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
