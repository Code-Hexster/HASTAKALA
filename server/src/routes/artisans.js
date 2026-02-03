const router = require("express").Router();

// GET /api/artisans
router.get("/", (req, res) => {
  res.json({ success: true, message: "Artisans list — coming soon" });
});

// GET /api/artisans/:id
router.get("/:id", (req, res) => {
  res.json({ success: true, message: `Artisan ${req.params.id} — coming soon` });
});

module.exports = router;
