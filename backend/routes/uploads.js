const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "recipes");
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

// The file stays in memory until we have checked it; nothing touches the disk before that.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1, fields: 0 } }).single("image");

// Decide the real type from the first bytes ("magic numbers"). The filename and the
// Content-Type header sent by the client are NOT trusted, because they are easy to fake.
function detectImageType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

// POST /api/uploads/recipe-image   (multipart/form-data, field name: "image")
router.post("/recipe-image", (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      const tooBig = err.code === "LIMIT_FILE_SIZE";
      return res.status(tooBig ? 413 : 400).json({ message: tooBig ? "Image is too large (max 2 MB)." : "Invalid upload." });
    }
    if (err) return res.status(400).json({ message: "Invalid upload." });
    if (!req.file) return res.status(400).json({ message: "Please choose an image file (field name: image)." });

    const type = detectImageType(req.file.buffer);
    if (!type) return res.status(400).json({ message: "Only JPEG, PNG or WebP images are allowed." });

    try {
      await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
      const filename = `${crypto.randomUUID()}.${type}`; // random name chosen by the server
      await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), req.file.buffer, { flag: "wx" });
      res.status(201).json({ url: `/uploads/recipes/${filename}` });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Could not save the image." });
    }
  });
});

module.exports = router;
