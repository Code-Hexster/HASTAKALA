const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../utils/prisma");
const { verifySignature, processSuccessfulPayment } = require("../services/payment.service");

/**
 * POST /api/webhooks/razorpay
 * Handles the payment.captured event from Razorpay webhooks.
 * This is a fallback in case the frontend verification doesn't execute
 * (e.g. user closes browser immediately after paying).
 */
const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Verify webhook signature
  if (webhookSecret) {
    const shasum = require("crypto").createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      return res.status(400).json({ success: false, error: "Invalid webhook signature" });
    }
  }

  const { event, payload } = req.body;

  if (event === "payment.captured") {
    const payment = payload.payment.entity;
    const razorpayOrderId = payment.order_id;

    // Find our order by matching the Razorpay order ID stored in notes
    // We search for PENDING orders with matching amount
    const amountInRupees = payment.amount / 100;

    const pendingOrder = await prisma.order.findFirst({
      where: {
        status: "PENDING",
        totalAmount: amountInRupees,
      },
      orderBy: { createdAt: "desc" },
    });

    if (pendingOrder) {
      await processSuccessfulPayment(pendingOrder.id, pendingOrder.userId);
      console.log(`✅ Webhook: Order ${pendingOrder.id} marked as PAID via payment.captured`);
    }
  }

  if (event === "payment.failed") {
    const payment = payload.payment.entity;
    console.log(`❌ Webhook: Payment failed for Razorpay order ${payment.order_id}`);
  }

  // Always respond 200 to Razorpay (they retry on non-2xx)
  res.status(200).json({ success: true, message: "Webhook received" });
});

module.exports = { handleRazorpayWebhook };
