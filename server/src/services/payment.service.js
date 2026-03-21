const crypto = require("crypto");
const prisma = require("../utils/prisma");
const cartService = require("../services/cart.service");

/**
 * Verify Razorpay payment signature using HMAC SHA256.
 * @param {string} orderId    - Razorpay order ID
 * @param {string} paymentId  - Razorpay payment ID
 * @param {string} signature  - Razorpay signature from callback
 * @returns {boolean}
 */
const verifySignature = (orderId, paymentId, signature) => {
  const body = orderId + "|" + paymentId;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expected === signature;
};

/**
 * Process a successful payment — update order, decrement stock, clear cart.
 * Shared by both the frontend verify endpoint and the webhook handler.
 */
const processSuccessfulPayment = async (dbOrderId, userId) => {
  const order = await prisma.order.update({
    where: { id: dbOrderId },
    data: { status: "PAID" },
    include: { items: { include: { product: true } } },
  });

  // Decrement stock
  for (const item of order.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  // Clear cart
  if (userId) {
    await cartService.clearCart(userId);
  }

  return order;
};

module.exports = { verifySignature, processSuccessfulPayment };
