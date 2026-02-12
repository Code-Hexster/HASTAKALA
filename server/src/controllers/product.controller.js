const prisma = require("../utils/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { z } = require("zod");
const { cacheOrFetch, invalidateCache } = require("../config/redis");

// ── Validation Schemas ──────────────────────────────────────

const createProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.number().positive("Price must be a positive number"),
  stock: z.number().int().min(0).optional().default(0),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const updateProductSchema = createProductSchema.partial();

const filtersSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  state: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "newest", "oldest"]).optional().default("newest"),
});

// ── Controllers ──────────────────────────────────────────────

/**
 * POST /api/products
 * Create a new product (ARTISAN / ADMIN only)
 */
const createProduct = asyncHandler(async (req, res) => {
  const val = createProductSchema.safeParse(req.body);
  if (!val.success) {
    return res.status(400).json({ success: false, error: val.error.errors[0].message });
  }

  // If the user is an ARTISAN, look up their artisan profile
  let artisanId = null;
  if (req.user.role === "ARTISAN") {
    const artisan = await prisma.artisan.findUnique({ where: { userId: req.user.id } });
    if (!artisan) {
      return res.status(400).json({ success: false, error: "Artisan profile not found — please create one first" });
    }
    artisanId = artisan.id;
  }

  const product = await prisma.product.create({
    data: {
      ...val.data,
      artisanId,
    },
    include: { artisan: { include: { user: { select: { name: true } } } } },
  });

  // Invalidate product list caches
  await invalidateCache("products:*");

  res.status(201).json({ success: true, data: product });
});

/**
 * GET /api/products
 * List products with filters, pagination, and sorting
 */
const getAllProducts = asyncHandler(async (req, res) => {
  const val = filtersSchema.safeParse(req.query);
  if (!val.success) {
    return res.status(400).json({ success: false, error: val.error.errors[0].message });
  }

  const { page, limit, category, minPrice, maxPrice, state, search, sortBy } = val.data;
  const skip = (page - 1) * limit;

  // Build cache key from query params
  const cacheKey = `products:${JSON.stringify(val.data)}`;

  const result = await cacheOrFetch(cacheKey, 60, async () => {
    // Build where clause
    const where = {};

    if (category) where.category = category;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    if (state) {
      where.artisan = { location: { contains: state, mode: "insensitive" } };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build orderBy
    const orderByMap = {
      price_asc: { price: "asc" },
      price_desc: { price: "desc" },
      newest: { createdAt: "desc" },
      oldest: { createdAt: "asc" },
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByMap[sortBy] || { createdAt: "desc" },
        include: {
          artisan: { include: { user: { select: { name: true } } } },
          giTags: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  res.status(200).json({ success: true, data: result });
});

/**
 * GET /api/products/:id
 * Get a single product by ID
 */
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cacheKey = `product:${id}`;
  const product = await cacheOrFetch(cacheKey, 120, async () => {
    return prisma.product.findUnique({
      where: { id },
      include: {
        artisan: { include: { user: { select: { name: true, email: true } } } },
        reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
        giTags: true,
      },
    });
  });

  if (!product) {
    return res.status(404).json({ success: false, error: "Product not found" });
  }

  res.status(200).json({ success: true, data: product });
});

/**
 * PUT /api/products/:id
 * Update a product (owner ARTISAN or ADMIN)
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const val = updateProductSchema.safeParse(req.body);
  if (!val.success) {
    return res.status(400).json({ success: false, error: val.error.errors[0].message });
  }

  // Verify the product exists
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, error: "Product not found" });
  }

  // Only the owning artisan or an admin can update
  if (req.user.role === "ARTISAN") {
    const artisan = await prisma.artisan.findUnique({ where: { userId: req.user.id } });
    if (!artisan || artisan.id !== existing.artisanId) {
      return res.status(403).json({ success: false, error: "You can only update your own products" });
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: val.data,
    include: { artisan: { include: { user: { select: { name: true } } } } },
  });

  await invalidateCache("products:*");
  await invalidateCache(`product:${id}`);

  res.status(200).json({ success: true, data: updated });
});

/**
 * DELETE /api/products/:id
 * Delete a product (owner ARTISAN or ADMIN)
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, error: "Product not found" });
  }

  // Only the owning artisan or an admin can delete
  if (req.user.role === "ARTISAN") {
    const artisan = await prisma.artisan.findUnique({ where: { userId: req.user.id } });
    if (!artisan || artisan.id !== existing.artisanId) {
      return res.status(403).json({ success: false, error: "You can only delete your own products" });
    }
  }

  await prisma.product.delete({ where: { id } });

  await invalidateCache("products:*");
  await invalidateCache(`product:${id}`);

  res.status(200).json({ success: true, message: "Product deleted" });
});

module.exports = { createProduct, getAllProducts, getProduct, updateProduct, deleteProduct };
