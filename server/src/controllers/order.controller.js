const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../utils/prisma");
const razorpay = require("../config/razorpay");
const cartService = require("../services/cart.service");
const crypto = require("crypto");
const { z } = require("zod");

const createOrderSchema = z.object({
  shippingAddress: z.object({
    name: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(5),
    phone: z.string().min(10),
  }),
});

/**
 * POST /api/orders/checkout
 * Creates a Razorpay order from the current cart, returns order details for frontend
 */
const createCheckoutOrder = asyncHandler(async (req, res) => {
  const val = createOrderSchema.safeParse(req.body);
  if (!val.success) {
    return res.status(400).json({ success: false, error: val.error.errors[0].message });
  }

  // Fetch cart from Redis
  const cartItems = await cartService.getCart(req.user.id);
  if (cartItems.length === 0) {
    return res.status(400).json({ success: false, error: "Cart is empty" });
  }

  // Verify products & calculate total from DB prices (not trusting cached prices)
  const productIds = cartItems.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  const productMap = {};
  products.forEach((p) => { productMap[p.id] = p; });

  let totalAmount = 0;
  const orderItems = [];

  for (const item of cartItems) {
    const product = productMap[item.productId];
    if (!product) {
      return res.status(400).json({ success: false, error: `Product ${item.productId} no longer available` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ success: false, error: `"${product.name}" has only ${product.stock} left in stock` });
    }
    const lineTotal = product.price * item.quantity;
    totalAmount += lineTotal;
    orderItems.push({
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
    });
  }

  totalAmount = Math.round(totalAmount * 100) / 100;

  // Create Razorpay order (amount in paise)
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100),
    currency: "INR",
    receipt: `hk_${Date.now()}`,
    notes: {
      userId: req.user.id,
      shippingCity: val.data.shippingAddress.city,
    },
  });

  // Create a pending order in our DB
  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      totalAmount,
      status: "PENDING",
      items: {
        create: orderItems,
      },
    },
    include: { items: true },
  });

  res.status(201).json({
    success: true,
    data: {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

/**
 * POST /api/orders/verify
 * Verify Razorpay payment signature, mark order as PAID, clear cart
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    return res.status(400).json({ success: false, error: "Missing payment verification fields" });
  }

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, error: "Payment verification failed — invalid signature" });
  }

  // Update order status to PAID
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: "PAID" },
    include: { items: { include: { product: true } } },
  });

  // Decrement stock for each product
  for (const item of order.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  // Clear cart from Redis
  await cartService.clearCart(req.user.id);

  res.status(200).json({
    success: true,
    message: "Payment verified and order confirmed",
    data: order,
  });
});

/**
 * GET /api/orders
 * List authenticated user's orders
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: { include: { product: { select: { name: true, imageUrl: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ success: true, data: orders });
});

/**
 * GET /api/orders/:id
 * Get a single order (owner or ADMIN)
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } }, user: { select: { name: true, email: true } } },
  });

  if (!order) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }

  if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  res.status(200).json({ success: true, data: order });
});

module.exports = { createCheckoutOrder, verifyPayment, getMyOrders, getOrder };
