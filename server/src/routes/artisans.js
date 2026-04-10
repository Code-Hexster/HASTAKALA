const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const { getArtisanOrders, getArtisanDashboard } = require("../controllers/artisan.controller");

// GET /api/artisans/orders — artisan's incoming orders
router.get("/orders", authenticate, authorize("ARTISAN"), getArtisanOrders);

// GET /api/artisans/dashboard — artisan stats
router.get("/dashboard", authenticate, authorize("ARTISAN"), getArtisanDashboard);

module.exports = router;
