const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} = require("../controllers/cart.controller");

// All cart routes require authentication
router.use(authenticate);

// GET    /api/cart              — get full cart
router.get("/", getCart);

// POST   /api/cart              — add item to cart
router.post("/", addItem);

// PUT    /api/cart/:productId   — update item quantity
router.put("/:productId", updateItem);

// DELETE /api/cart/:productId   — remove single item
router.delete("/:productId", removeItem);

// DELETE /api/cart              — clear entire cart
router.delete("/", clearCart);

module.exports = router;
