const PDFDocument = require("pdfkit");
const { calculateOrderGST } = require("./gst.service");

/**
 * Generate a GST-compliant invoice PDF as a buffer.
 *
 * @param {object} order - Order with items, user, product, artisan relations
 * @param {string} buyerState - Buyer's shipping state
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateInvoicePDF = (order, buyerState = "Maharashtra") => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Prepare GST data
      const gstItems = order.items.map((item) => ({
        name: item.product?.name || "Product",
        price: item.price,
        quantity: item.quantity,
        sellerState: item.product?.artisan?.location || "Unknown",
      }));
      const gstData = calculateOrderGST(gstItems, buyerState);

      const pageWidth = doc.page.width - 100;

      // ── Header ──────────────────────────────────────────
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("#ff8000")
        .text("HASTAKALA", 50, 50);

      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#666")
        .text("Empowering Indian Artisans", 50, 78);

      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .fillColor("#1a1711")
        .text("TAX INVOICE", 400, 50, { align: "right" });

      // ── Invoice meta ─────────────────────────────────────
      const invoiceNo = `HK-${order.id.slice(-8).toUpperCase()}`;
      const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      doc.moveDown(2);
      doc.fontSize(9).font("Helvetica").fillColor("#333");

      const metaY = 110;
      doc.text(`Invoice No: ${invoiceNo}`, 50, metaY);
      doc.text(`Date: ${invoiceDate}`, 50, metaY + 14);
      doc.text(`Order ID: ${order.id}`, 50, metaY + 28);
      doc.text(`Status: ${order.status}`, 50, metaY + 42);

      // Buyer info
      doc.font("Helvetica-Bold").text("Bill To:", 350, metaY);
      doc.font("Helvetica");
      doc.text(order.user?.name || "Customer", 350, metaY + 14);
      doc.text(order.user?.email || "", 350, metaY + 28);

      // ── Divider ──────────────────────────────────────────
      const tableTop = metaY + 70;
      doc
        .moveTo(50, tableTop)
        .lineTo(50 + pageWidth, tableTop)
        .strokeColor("#ddd")
        .stroke();

      // ── Table Header ─────────────────────────────────────
      const headerY = tableTop + 10;
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#666");
      doc.text("#", 50, headerY, { width: 25 });
      doc.text("Item", 75, headerY, { width: 180 });
      doc.text("Qty", 260, headerY, { width: 35, align: "center" });
      doc.text("Rate (₹)", 300, headerY, { width: 70, align: "right" });
      doc.text("Tax", 375, headerY, { width: 70, align: "right" });
      doc.text("Amount (₹)", 450, headerY, { width: 95, align: "right" });

      doc
        .moveTo(50, headerY + 16)
        .lineTo(50 + pageWidth, headerY + 16)
        .strokeColor("#eee")
        .stroke();

      // ── Table Rows ───────────────────────────────────────
      let rowY = headerY + 24;
      doc.font("Helvetica").fillColor("#333").fontSize(8);

      gstData.items.forEach((item, i) => {
        const taxStr =
          item.gst.type === "intra"
            ? `C:${item.gst.cgst} + S:${item.gst.sgst}`
            : `I:${item.gst.igst}`;

        doc.text(String(i + 1), 50, rowY, { width: 25 });
        doc.text(item.name, 75, rowY, { width: 180 });
        doc.text(String(item.quantity), 260, rowY, { width: 35, align: "center" });
        doc.text(item.price.toFixed(2), 300, rowY, { width: 70, align: "right" });
        doc.text(taxStr, 375, rowY, { width: 70, align: "right" });
        doc.text(item.gst.totalAmount.toFixed(2), 450, rowY, { width: 95, align: "right" });

        rowY += 20;
      });

      // ── Divider ──────────────────────────────────────────
      doc
        .moveTo(50, rowY + 5)
        .lineTo(50 + pageWidth, rowY + 5)
        .strokeColor("#ddd")
        .stroke();

      // ── Totals ───────────────────────────────────────────
      const totalsX = 370;
      let totalsY = rowY + 18;
      doc.fontSize(9).font("Helvetica").fillColor("#666");

      doc.text("Subtotal:", totalsX, totalsY);
      doc.text(`₹${gstData.summary.baseAmount.toFixed(2)}`, 450, totalsY, { width: 95, align: "right" });
      totalsY += 16;

      if (gstData.summary.cgst > 0) {
        doc.text("CGST (9%):", totalsX, totalsY);
        doc.text(`₹${gstData.summary.cgst.toFixed(2)}`, 450, totalsY, { width: 95, align: "right" });
        totalsY += 16;
        doc.text("SGST (9%):", totalsX, totalsY);
        doc.text(`₹${gstData.summary.sgst.toFixed(2)}`, 450, totalsY, { width: 95, align: "right" });
        totalsY += 16;
      }

      if (gstData.summary.igst > 0) {
        doc.text("IGST (18%):", totalsX, totalsY);
        doc.text(`₹${gstData.summary.igst.toFixed(2)}`, 450, totalsY, { width: 95, align: "right" });
        totalsY += 16;
      }

      doc
        .moveTo(totalsX, totalsY)
        .lineTo(50 + pageWidth, totalsY)
        .strokeColor("#ff8000")
        .lineWidth(1.5)
        .stroke();

      totalsY += 8;
      doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1711");
      doc.text("Grand Total:", totalsX, totalsY);
      doc
        .fillColor("#ff8000")
        .text(`₹${gstData.summary.grandTotal.toFixed(2)}`, 450, totalsY, { width: 95, align: "right" });

      // ── Footer ───────────────────────────────────────────
      const footerY = doc.page.height - 80;
      doc.fontSize(7).font("Helvetica").fillColor("#999");
      doc.text(
        "This is a computer-generated invoice and does not require a physical signature.",
        50,
        footerY,
        { width: pageWidth, align: "center" }
      );
      doc.text(
        "Hastakala — Empowering Indian Artisans | www.hastakala.in",
        50,
        footerY + 12,
        { width: pageWidth, align: "center" }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
