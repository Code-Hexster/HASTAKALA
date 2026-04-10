const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../utils/prisma");

/**
 * GET /api/artisans/orders
 * Get orders containing products belonging to the authenticated artisan
 */
const getArtisanOrders = asyncHandler(async (req, res) => {
  // Find this user's artisan profile
  const artisan = await prisma.artisan.findUnique({ where: { userId: req.user.id } });
  if (!artisan) {
    return res.status(404).json({ success: false, error: "Artisan profile not found" });
  }

  // Find all order items for this artisan's products
  const orderItems = await prisma.orderItem.findMany({
    where: {
      product: { artisanId: artisan.id },
    },
    include: {
      order: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      product: { select: { name: true, imageUrl: true, price: true } },
    },
    orderBy: { order: { createdAt: "desc" } },
  });

  // Group by order
  const ordersMap = new Map();
  for (const item of orderItems) {
    const orderId = item.order.id;
    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, {
        id: item.order.id,
        status: item.order.status,
        createdAt: item.order.createdAt,
        buyer: item.order.user,
        items: [],
        artisanTotal: 0,
      });
    }
    const order = ordersMap.get(orderId);
    const lineTotal = item.price * item.quantity;
    order.items.push({
      productName: item.product.name,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity,
      price: item.price,
      lineTotal,
    });
    order.artisanTotal += lineTotal;
  }

  const orders = Array.from(ordersMap.values());

  res.status(200).json({
    success: true,
    data: orders,
    total: orders.length,
  });
});

/**
 * GET /api/artisans/dashboard
 * Quick stats for the artisan dashboard
 */
const getArtisanDashboard = asyncHandler(async (req, res) => {
  const artisan = await prisma.artisan.findUnique({ where: { userId: req.user.id } });
  if (!artisan) {
    return res.status(404).json({ success: false, error: "Artisan profile not found" });
  }

  const [productCount, totalOrders, pendingPayouts, paidPayouts] = await Promise.all([
    prisma.product.count({ where: { artisanId: artisan.id } }),
    prisma.orderItem.count({ where: { product: { artisanId: artisan.id } } }),
    prisma.payout.aggregate({
      where: { artisanId: artisan.id, status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.payout.aggregate({
      where: { artisanId: artisan.id, status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      products: productCount,
      orders: totalOrders,
      pendingPayout: pendingPayouts._sum.amount || 0,
      totalEarnings: paidPayouts._sum.amount || 0,
    },
  });
});

module.exports = { getArtisanOrders, getArtisanDashboard };
