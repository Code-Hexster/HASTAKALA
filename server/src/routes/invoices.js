const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { downloadInvoice, previewInvoice } = require("../controllers/invoice.controller");

// GET /api/invoices/:orderId — download PDF invoice
router.get("/:orderId", authenticate, downloadInvoice);

// GET /api/invoices/:orderId/preview — JSON GST breakdown
router.get("/:orderId/preview", authenticate, previewInvoice);

module.exports = router;
