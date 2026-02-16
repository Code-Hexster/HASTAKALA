const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../utils/prisma");
const { z } = require("zod");
const cartService = require("../services/cart.service");

// ── Validation ───────────────────────────────────────────────

const addItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").optional().default(1),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

// ── Controllers ──────────────────────────────────────────────

/**
 * GET /api/cart
 * Retrieve the authenticated user's cart
 */
const getCart = asyncHandler(async (req, res) => {
  const items = await cartService.getCart(req.user.id);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  res.status(200).json({
    success: true,
    data: {
      items,
      itemCount: items.length,
      subtotal: Math.round(subtotal * 100) / 100,
    },
  });
});

/**
 * POST /api/cart
 * Add an item to the cart (fetches product details from DB)
 */
const addItem = asyncHandler(async (req, res) => {
  const val = addItemSchema.safeParse(req.body);
  if (!val.success) {
    return res.status(400).json({ success: false, error: val.error.errors[0].message });
  }

  const { productId, quantity } = val.data;

  // Verify product exists and has stock
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return res.status(404).json({ success: false, error: "Product not found" });
  }
  if (product.stock < quantity) {
    return res.status(400).json({ success: false, error: `Only ${product.stock} items in stock` });
  }

  await cartService.setItem(req.user.id, productId, {
    quantity,
    price: product.price,
    name: product.name,
    imageUrl: product.imageUrl || "",
  });

  const items = await cartService.getCart(req.user.id);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  res.status(200).json({
    success: true,
    message: "Item added to cart",
    data: { items, itemCount: items.length, subtotal: Math.round(subtotal * 100) / 100 },
  });
});

/**
 * PUT /api/cart/:productId
 * Update the quantity of a cart item
 */
const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const val = updateItemSchema.safeParse(req.body);
  if (!val.success) {
    return res.status(400).json({ success: false, error: val.error.errors[0].message });
  }

  // Check stock
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (product && product.stock < val.data.quantity) {
    return res.status(400).json({ success: false, error: `Only ${product.stock} items in stock` });
  }

  const updated = await cartService.updateQuantity(req.user.id, productId, val.data.quantity);
  if (!updated) {
    return res.status(404).json({ success: false, error: "Item not found in cart" });
  }

  const items = await cartService.getCart(req.user.id);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  res.status(200).json({
    success: true,
    message: "Cart updated",
    data: { items, itemCount: items.length, subtotal: Math.round(subtotal * 100) / 100 },
  });
});

/**
 * DELETE /api/cart/:productId
 * Remove a single item from the cart
 */
const removeItem = asyncHandler(async (req, res) => {
  await cartService.removeItem(req.user.id, req.params.productId);

  const items = await cartService.getCart(req.user.id);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  res.status(200).json({
    success: true,
    message: "Item removed",
    data: { items, itemCount: items.length, subtotal: Math.round(subtotal * 100) / 100 },
  });
});

/**
 * DELETE /api/cart
 * Clear the entire cart
 */
const clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCart(req.user.id);

  res.status(200).json({
    success: true,
    message: "Cart cleared",
    data: { items: [], itemCount: 0, subtotal: 0 },
  });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
