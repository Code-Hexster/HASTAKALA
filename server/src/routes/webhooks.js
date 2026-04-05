const router = require("express").Router();
const { handleRazorpayWebhook } = require("../controllers/webhook.controller");

// POST /api/webhooks/razorpay — Razorpay sends payment events here
router.post("/razorpay", handleRazorpayWebhook);

module.exports = router;
