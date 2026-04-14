const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../utils/prisma");
const { generateInvoicePDF } = require("../services/invoice.service");

/**
 * GET /api/invoices/:orderId
 * Download GST invoice as PDF for a given order.
 * Only the order owner or an ADMIN can download.
 */
const downloadInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: {
            include: {
              artisan: { select: { location: true } },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }

  // Authorization check
  if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  // Only generate invoice for paid orders
  if (order.status === "PENDING") {
    return res.status(400).json({ success: false, error: "Invoice not available — order is not yet paid" });
  }

  // TODO: In production, pass actual buyer state from shipping address
  const buyerState = "Maharashtra";

  const pdfBuffer = await generateInvoicePDF(order, buyerState);

  const invoiceNo = `HK-${order.id.slice(-8).toUpperCase()}`;

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="invoice-${invoiceNo}.pdf"`,
    "Content-Length": pdfBuffer.length,
  });

  res.send(pdfBuffer);
});

/**
 * GET /api/invoices/:orderId/preview
 * Returns GST breakdown as JSON (no PDF download).
 */
const previewInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { calculateOrderGST } = require("../services/gst.service");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: {
            include: {
              artisan: { select: { location: true } },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }

  if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  const buyerState = "Maharashtra";

  const gstItems = order.items.map((item) => ({
    name: item.product?.name || "Product",
    price: item.price,
    quantity: item.quantity,
    sellerState: item.product?.artisan?.location || "Unknown",
  }));

  const gstData = calculateOrderGST(gstItems, buyerState);

  res.status(200).json({
    success: true,
    data: {
      invoiceNo: `HK-${order.id.slice(-8).toUpperCase()}`,
      date: order.createdAt,
      status: order.status,
      buyer: order.user,
      ...gstData,
    },
  });
});

module.exports = { downloadInvoice, previewInvoice };
