const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

// GET /api/products — public, with filters & pagination
router.get("/", getAllProducts);

// GET /api/products/:id — public
router.get("/:id", getProduct);

// POST /api/products — protected: ARTISAN and ADMIN only
router.post("/", authenticate, authorize("ARTISAN", "ADMIN"), createProduct);

// PUT /api/products/:id — protected: owner ARTISAN or ADMIN
router.put("/:id", authenticate, authorize("ARTISAN", "ADMIN"), updateProduct);

// DELETE /api/products/:id — protected: owner ARTISAN or ADMIN
router.delete("/:id", authenticate, authorize("ARTISAN", "ADMIN"), deleteProduct);

module.exports = router;
