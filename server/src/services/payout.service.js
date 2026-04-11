const razorpay = require("../config/razorpay");
const prisma = require("../utils/prisma");

/**
 * Create a Razorpay Route linked account for an artisan.
 * Required for splitting payments to artisans via Razorpay Route.
 *
 * @param {object} artisan - Artisan record with user relation
 * @param {object} bankDetails - { accountNumber, ifscCode, beneficiaryName }
 * @returns {Promise<string>} Razorpay account ID
 */
const createLinkedAccount = async (artisan, bankDetails) => {
  const account = await razorpay.accounts.create({
    email: artisan.user?.email,
    phone: bankDetails.phone || "9999999999",
    type: "route",
    legal_business_name: artisan.user?.name || "Hastakala Artisan",
    business_type: "individual",
    legal_info: {
      pan: bankDetails.pan || "",
    },
    bank_account: {
      ifsc_code: bankDetails.ifscCode,
      beneficiary_name: bankDetails.beneficiaryName,
      account_type: "savings",
      account_number: bankDetails.accountNumber,
    },
  });

  // Store the Razorpay account ID in artisan record
  // We'll use the bio field temporarily or add a new column later
  await prisma.artisan.update({
    where: { id: artisan.id },
    data: { bio: `razorpay_account:${account.id}` },
  });

  return account.id;
};

/**
 * Transfer payment to artisan after a successful order.
 * Uses Razorpay Route transfer API.
 *
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} artisanAccountId - Razorpay linked account ID
 * @param {number} amount - Amount in paise
 * @param {string} orderId - Internal order ID for reference
 */
const transferToArtisan = async (paymentId, artisanAccountId, amount, orderId) => {
  const transfer = await razorpay.payments.transfer(paymentId, {
    transfers: [
      {
        account: artisanAccountId,
        amount: amount,
        currency: "INR",
        notes: {
          orderId,
          purpose: "artisan_payout",
        },
        on_hold: false,
      },
    ],
  });

  return transfer;
};

/**
 * Process artisan payouts for a paid order.
 * Splits the order total among artisans whose products were ordered.
 *
 * @param {object} order - Order with items and product -> artisan relations
 * @param {string} razorpayPaymentId - Razorpay payment ID
 */
const processArtisanPayouts = async (order, razorpayPaymentId) => {
  // Group items by artisan
  const artisanTotals = new Map();

  for (const item of order.items) {
    if (!item.product?.artisanId) continue;

    const artisanId = item.product.artisanId;
    const lineTotal = item.price * item.quantity;
    const platformFee = lineTotal * 0.10; // 10% platform commission
    const artisanAmount = lineTotal - platformFee;

    if (!artisanTotals.has(artisanId)) {
      artisanTotals.set(artisanId, { amount: 0, artisanId });
    }
    artisanTotals.get(artisanId).amount += artisanAmount;
  }

  // Create payout records
  for (const [artisanId, data] of artisanTotals) {
    await prisma.payout.create({
      data: {
        artisanId,
        amount: Math.round(data.amount * 100) / 100,
        status: "PENDING",
        transactionId: razorpayPaymentId,
      },
    });

    // Attempt Razorpay transfer if artisan has linked account
    const artisan = await prisma.artisan.findUnique({
      where: { id: artisanId },
      include: { user: true },
    });

    if (artisan?.bio?.startsWith("razorpay_account:")) {
      const accountId = artisan.bio.replace("razorpay_account:", "");
      try {
        await transferToArtisan(
          razorpayPaymentId,
          accountId,
          Math.round(data.amount * 100), // Convert to paise
          order.id
        );

        // Mark payout as PAID
        await prisma.payout.updateMany({
          where: { artisanId, transactionId: razorpayPaymentId },
          data: { status: "PAID" },
        });
      } catch (err) {
        console.error(`Transfer to artisan ${artisanId} failed:`, err.message);
      }
    }
  }
};

module.exports = { createLinkedAccount, transferToArtisan, processArtisanPayouts };
