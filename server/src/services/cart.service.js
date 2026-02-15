const { redis } = require("../config/redis");

const CART_PREFIX = "cart:";
const CART_TTL = 60 * 60 * 24 * 7; // 7 days

/**
 * Get the Redis key for a user's cart.
 */
const cartKey = (userId) => `${CART_PREFIX}${userId}`;

/**
 * Get all items in a user's cart.
 * Returns an array of { productId, quantity, price, name, imageUrl }
 */
const getCart = async (userId) => {
  const data = await redis.hgetall(cartKey(userId));
  if (!data || Object.keys(data).length === 0) return [];

  return Object.entries(data).map(([productId, json]) => ({
    productId,
    ...JSON.parse(json),
  }));
};

/**
 * Add or update an item in the cart.
 * If the item already exists, quantity is replaced (not incremented).
 */
const setItem = async (userId, productId, { quantity, price, name, imageUrl }) => {
  const payload = JSON.stringify({ quantity, price, name, imageUrl });
  await redis.hset(cartKey(userId), productId, payload);
  await redis.expire(cartKey(userId), CART_TTL);
};

/**
 * Update the quantity of an existing cart item.
 * Returns false if the item doesn't exist.
 */
const updateQuantity = async (userId, productId, quantity) => {
  const existing = await redis.hget(cartKey(userId), productId);
  if (!existing) return false;

  const item = JSON.parse(existing);
  item.quantity = quantity;
  await redis.hset(cartKey(userId), productId, JSON.stringify(item));
  await redis.expire(cartKey(userId), CART_TTL);
  return true;
};

/**
 * Remove a single item from the cart.
 */
const removeItem = async (userId, productId) => {
  await redis.hdel(cartKey(userId), productId);
};

/**
 * Clear the entire cart for a user.
 */
const clearCart = async (userId) => {
  await redis.del(cartKey(userId));
};

/**
 * Get the total number of items in the cart.
 */
const getCartCount = async (userId) => {
  return redis.hlen(cartKey(userId));
};

module.exports = { getCart, setItem, updateQuantity, removeItem, clearCart, getCartCount };
