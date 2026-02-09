const asyncHandler = require("../utils/asyncHandler");
const { uploadImage, deleteImage } = require("../config/cloudinary");

/**
 * POST /api/upload/single
 * Upload a single image (base64 in req.body.image)
 */
const uploadSingle = asyncHandler(async (req, res) => {
  const { image, folder } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, error: "No image provided" });
  }

  const result = await uploadImage(image, folder || "hastakala");

  res.status(200).json({
    success: true,
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    },
  });
});

/**
 * POST /api/upload/multiple
 * Upload multiple images (array of base64 in req.body.images)
 */
const uploadMultiple = asyncHandler(async (req, res) => {
  const { images, folder } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ success: false, error: "No images provided" });
  }

  if (images.length > 10) {
    return res.status(400).json({ success: false, error: "Maximum 10 images per upload" });
  }

  const uploadPromises = images.map((img) => uploadImage(img, folder || "hastakala"));
  const results = await Promise.all(uploadPromises);

  const data = results.map((r) => ({
    url: r.secure_url,
    publicId: r.public_id,
    width: r.width,
    height: r.height,
    format: r.format,
  }));

  res.status(200).json({ success: true, data });
});

/**
 * DELETE /api/upload/:publicId
 * Delete an image from Cloudinary
 */
const deleteSingle = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  if (!publicId) {
    return res.status(400).json({ success: false, error: "No publicId provided" });
  }

  await deleteImage(publicId);

  res.status(200).json({ success: true, message: "Image deleted" });
});

module.exports = { uploadSingle, uploadMultiple, deleteSingle };
