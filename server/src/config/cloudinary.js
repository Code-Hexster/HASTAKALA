const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a single buffer/base64 image to Cloudinary.
 * @param {string} fileStr - Base64 data URI or file path
 * @param {string} folder  - Cloudinary folder name
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadImage = async (fileStr, folder = "hastakala") => {
  const result = await cloudinary.uploader.upload(fileStr, {
    folder,
    resource_type: "image",
    transformation: [
      { width: 1200, height: 1200, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });
  return result;
};

/**
 * Delete an image from Cloudinary by public_id.
 * @param {string} publicId
 */
const deleteImage = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { cloudinary, uploadImage, deleteImage };
