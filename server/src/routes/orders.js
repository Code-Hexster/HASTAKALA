const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const {
  createCheckoutOrder,
  verifyPayment,
  getMyOrders,
  getOrder,
} = require("../controllers/order.controller");

// All order routes require authentication
router.use(authenticate);

// GET    /api/orders             — list my orders
router.get("/", getMyOrders);

// GET    /api/orders/:id         — get single order
router.get("/:id", getOrder);

// POST   /api/orders/checkout    — create Razorpay order from cart
router.post("/checkout", createCheckoutOrder);

// POST   /api/orders/verify      — verify Razorpay payment signature
router.post("/verify", verifyPayment);

module.exports = router;
