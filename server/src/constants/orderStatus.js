/**
 * Centralized order status constants used across controllers, services, and webhooks.
 * Keeps statuses consistent and avoids magic strings.
 */

const ORDER_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

const PAYOUT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
};

/**
 * Platform commission rate (10%) deducted from artisan payouts.
 */
const PLATFORM_COMMISSION = 0.10;

module.exports = { ORDER_STATUS, PAYOUT_STATUS, PLATFORM_COMMISSION };
