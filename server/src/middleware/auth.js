const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

/**
 * Verifies the JWT token from the Authorization header.
 * Attaches the authenticated user (without password) to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Access denied — no token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_secret_jwt_key");

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ success: false, error: "User no longer exists" });
    }

    // Attach user without password to request
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Token expired — please log in again" });
    }
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

/**
 * Role-based authorization middleware.
 * Must be used AFTER authenticate.
 * Usage: authorize("ADMIN", "ARTISAN")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Forbidden — insufficient permissions" });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
