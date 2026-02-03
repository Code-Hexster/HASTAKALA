const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();
const connectDB = require("./config/db");

// Connect to MongoDB
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders",   require("./routes/orders"));
app.use("/api/artisans", require("./routes/artisans"));

// ── Health check ────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", project: "Hastakala API", timestamp: new Date().toISOString() });
});

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, error: err.message || "Internal Server Error" });
});

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Hastakala server running on http://localhost:${PORT}`);
});

module.exports = app;
