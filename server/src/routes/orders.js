const router = require("express").Router();

// POST /api/orders
router.post("/", (req, res) => {
  res.json({ success: true, message: "Create order — coming soon" });
});

// GET /api/orders/:id
router.get("/:id", (req, res) => {
  res.json({ success: true, message: `Order ${req.params.id} — coming soon` });
});

module.exports = router;
