/**
 * GST Calculation Service for Hastakala
 *
 * Indian GST structure:
 * - Intra-state (same state): CGST (9%) + SGST (9%) = 18% total
 * - Inter-state (different state): IGST (18%)
 *
 * Handicraft products typically fall under 18% GST slab.
 */

const GST_RATE = 0.18; // 18% GST
const CGST_RATE = 0.09; // 9% Central GST
const SGST_RATE = 0.09; // 9% State GST
const IGST_RATE = 0.18; // 18% Integrated GST

/**
 * Determine if the transaction is intra-state or inter-state.
 * @param {string} sellerState - Artisan's state
 * @param {string} buyerState - Buyer's shipping state
 * @returns {"intra" | "inter"}
 */
const getTransactionType = (sellerState, buyerState) => {
  if (!sellerState || !buyerState) return "inter";
  return sellerState.toLowerCase().trim() === buyerState.toLowerCase().trim()
    ? "intra"
    : "inter";
};

/**
 * Calculate GST breakdown for a given amount.
 * @param {number} baseAmount - Amount before tax
 * @param {string} sellerState - Artisan's state/location
 * @param {string} buyerState - Buyer's shipping state
 * @returns {object} GST breakdown
 */
const calculateGST = (baseAmount, sellerState, buyerState) => {
  const txnType = getTransactionType(sellerState, buyerState);
  const totalTax = Math.round(baseAmount * GST_RATE * 100) / 100;

  if (txnType === "intra") {
    const cgst = Math.round(baseAmount * CGST_RATE * 100) / 100;
    const sgst = Math.round(baseAmount * SGST_RATE * 100) / 100;
    return {
      type: "intra",
      baseAmount: Math.round(baseAmount * 100) / 100,
      cgst,
      sgst,
      igst: 0,
      totalTax: cgst + sgst,
      totalAmount: Math.round((baseAmount + cgst + sgst) * 100) / 100,
      cgstRate: `${CGST_RATE * 100}%`,
      sgstRate: `${SGST_RATE * 100}%`,
    };
  }

  const igst = totalTax;
  return {
    type: "inter",
    baseAmount: Math.round(baseAmount * 100) / 100,
    cgst: 0,
    sgst: 0,
    igst,
    totalTax: igst,
    totalAmount: Math.round((baseAmount + igst) * 100) / 100,
    igstRate: `${IGST_RATE * 100}%`,
  };
};

/**
 * Calculate GST for an entire order with multiple items.
 * Each item may have a different artisan (seller state).
 *
 * @param {Array} items - [{ price, quantity, sellerState }]
 * @param {string} buyerState - Buyer's shipping state
 * @returns {object} Combined GST summary
 */
const calculateOrderGST = (items, buyerState) => {
  let totalBase = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const itemBreakdowns = items.map((item) => {
    const lineBase = item.price * item.quantity;
    const gst = calculateGST(lineBase, item.sellerState, buyerState);

    totalBase += gst.baseAmount;
    totalCGST += gst.cgst;
    totalSGST += gst.sgst;
    totalIGST += gst.igst;

    return {
      ...item,
      lineTotal: lineBase,
      gst,
    };
  });

  return {
    items: itemBreakdowns,
    summary: {
      baseAmount: Math.round(totalBase * 100) / 100,
      cgst: Math.round(totalCGST * 100) / 100,
      sgst: Math.round(totalSGST * 100) / 100,
      igst: Math.round(totalIGST * 100) / 100,
      totalTax: Math.round((totalCGST + totalSGST + totalIGST) * 100) / 100,
      grandTotal: Math.round((totalBase + totalCGST + totalSGST + totalIGST) * 100) / 100,
    },
  };
};

module.exports = {
  GST_RATE,
  CGST_RATE,
  SGST_RATE,
  IGST_RATE,
  getTransactionType,
  calculateGST,
  calculateOrderGST,
};
