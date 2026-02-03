const router = require("express").Router();

// POST /api/auth/register
router.post("/register", (req, res) => {
  res.json({ success: true, message: "Register endpoint — coming soon" });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  res.json({ success: true, message: "Login endpoint — coming soon" });
});

module.exports = router;
