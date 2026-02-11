const prisma = require("../utils/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const { z } = require("zod");

// Input validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CUSTOMER", "ARTISAN", "ADMIN"]).optional().default("CUSTOMER")
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const register = asyncHandler(async (req, res) => {
  // Validate input
  const val = registerSchema.safeParse(req.body);
  if (!val.success) {
    return res.status(400).json({ success: false, error: val.error.errors[0].message });
  }

  const { name, email, password, role } = val.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ success: false, error: "User already exists with this email" });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role
    }
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: newUser.id, role: newUser.role },
    process.env.JWT_SECRET || "super_secret_jwt_key",
    { expiresIn: "7d" }
  );

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    success: true,
    message: "Registration successful",
    token,
    user: userWithoutPassword
  });
});

const login = asyncHandler(async (req, res) => {
  // Validate input
  const val = loginSchema.safeParse(req.body);
  if (!val.success) {
    return res.status(400).json({ success: false, error: val.error.errors[0].message });
  }

  const { email, password } = val.data;

  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid credentials" });
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: "Invalid credentials" });
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || "super_secret_jwt_key",
    { expiresIn: "7d" }
  );

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: userWithoutPassword
  });
});

module.exports = {
  register,
  login
};
