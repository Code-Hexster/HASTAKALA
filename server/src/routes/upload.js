const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { uploadSingle, uploadMultiple, deleteSingle } = require("../controllers/upload.controller");

// POST /api/upload/single — upload one image (auth required)
router.post("/single", authenticate, uploadSingle);

// POST /api/upload/multiple — upload multiple images (auth required)
router.post("/multiple", authenticate, uploadMultiple);

// DELETE /api/upload/:publicId — delete an image (auth required)
router.delete("/:publicId", authenticate, deleteSingle);

module.exports = router;
