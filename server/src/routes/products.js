const router = require("express").Router();

// GET /api/products
router.get("/", (req, res) => {
  res.json({ success: true, message: "Products list — coming soon" });
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  res.json({ success: true, message: `Product ${req.params.id} — coming soon` });
});

// POST /api/products
router.post("/", (req, res) => {
  res.json({ success: true, message: "Create product — coming soon" });
});

module.exports = router;
